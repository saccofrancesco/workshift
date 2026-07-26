"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { isTauri } from "@tauri-apps/api/core";
import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";

export interface AvailableUpdateState {
  currentVersion: string;
  version: string;
  date?: string;
  notes?: string;
}

interface UpdateProgressState {
  downloadedBytes: number;
  totalBytes: number | null;
}

interface UseTauriUpdaterOptions {
  onError: (title: string, message: string) => void;
  onInfo: (title: string, message: string) => void;
}

function formatByteCount(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const precision = value >= 100 || unitIndex === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}

export function useTauriUpdater({ onError, onInfo }: UseTauriUpdaterOptions) {
  const [availableUpdate, setAvailableUpdate] =
    useState<AvailableUpdateState | null>(null);
  const [isInstallingUpdate, setIsInstallingUpdate] = useState(false);
  const [updateProgress, setUpdateProgress] =
    useState<UpdateProgressState | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const checkForUpdates = async () => {
      if (!isTauri()) {
        return;
      }

      try {
        const update = await check();
        if (!update) {
          return;
        }

        const metadata: AvailableUpdateState = {
          currentVersion: update.currentVersion,
          version: update.version,
          date: update.date,
          notes: update.body,
        };
        await update.close();

        if (!isCancelled) {
          setAvailableUpdate(metadata);
        }
      } catch {
        // Updater errors should not block planner usage.
      }
    };

    void checkForUpdates();

    return () => {
      isCancelled = true;
    };
  }, []);

  const updateProgressLabel = useMemo(() => {
    if (!updateProgress) {
      return "Downloading update package...";
    }
    if (
      typeof updateProgress.totalBytes === "number" &&
      updateProgress.totalBytes > 0
    ) {
      const percentage = Math.round(
        (updateProgress.downloadedBytes / updateProgress.totalBytes) * 100,
      );
      const boundedPercentage = Math.min(100, Math.max(0, percentage));
      return `Downloading update package... ${boundedPercentage}% (${formatByteCount(updateProgress.downloadedBytes)} / ${formatByteCount(updateProgress.totalBytes)})`;
    }
    return `Downloading update package... ${formatByteCount(updateProgress.downloadedBytes)}`;
  }, [updateProgress]);

  const dismissAvailableUpdate = useCallback(() => {
    if (!isInstallingUpdate) {
      setAvailableUpdate(null);
    }
  }, [isInstallingUpdate]);

  const installAvailableUpdate = useCallback(async () => {
    if (isInstallingUpdate) {
      return;
    }

    setIsInstallingUpdate(true);
    setUpdateProgress({
      downloadedBytes: 0,
      totalBytes: null,
    });

    let pendingUpdate: Awaited<ReturnType<typeof check>> = null;
    try {
      pendingUpdate = await check();
      if (!pendingUpdate) {
        setAvailableUpdate(null);
        onInfo("Already up to date", "No update is currently available.");
        return;
      }

      await pendingUpdate.downloadAndInstall((event) => {
        if (event.event === "Started") {
          setUpdateProgress({
            downloadedBytes: 0,
            totalBytes: event.data.contentLength ?? null,
          });
          return;
        }
        if (event.event === "Progress") {
          setUpdateProgress((current) => {
            const previousBytes = current?.downloadedBytes ?? 0;
            const totalBytes = current?.totalBytes ?? null;
            return {
              downloadedBytes: previousBytes + event.data.chunkLength,
              totalBytes,
            };
          });
        }
      });

      setAvailableUpdate(null);
      await relaunch();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      onError("Update failed", message);
    } finally {
      if (pendingUpdate) {
        await pendingUpdate.close().catch(() => undefined);
      }
      setIsInstallingUpdate(false);
      setUpdateProgress(null);
    }
  }, [isInstallingUpdate, onError, onInfo]);

  return {
    availableUpdate,
    dismissAvailableUpdate,
    installAvailableUpdate,
    isInstallingUpdate,
    updateProgressLabel,
  };
}
