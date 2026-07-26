"use client";

import { useEffect } from "react";

interface UseKeyboardHistoryOptions {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  if (
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) {
    return true;
  }
  if (!(target instanceof HTMLInputElement)) {
    return false;
  }

  const nonTextTypes = new Set([
    "button",
    "checkbox",
    "color",
    "file",
    "hidden",
    "image",
    "radio",
    "range",
    "reset",
    "submit",
  ]);
  return !nonTextTypes.has(target.type);
}

export function useKeyboardHistory({
  canUndo,
  canRedo,
  undo,
  redo,
}: UseKeyboardHistoryOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      const hasCommandKey = event.metaKey || event.ctrlKey;
      if (!hasCommandKey || event.altKey) {
        return;
      }

      const key = event.key.toLowerCase();
      const isUndo = key === "z" && !event.shiftKey;
      const isRedo =
        (key === "z" && event.shiftKey) ||
        (key === "y" && event.ctrlKey && !event.metaKey);

      if (isUndo) {
        if (!canUndo) {
          return;
        }
        event.preventDefault();
        undo();
        return;
      }

      if (isRedo) {
        if (!canRedo) {
          return;
        }
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [canRedo, canUndo, redo, undo]);
}
