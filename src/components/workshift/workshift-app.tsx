"use client";

import { useCallback, useMemo, useState } from "react";

import { useTheme } from "@/components/theme-provider";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  createDefaultSessionState,
  formatFullDateLabel,
  formatTimeRange,
  parseDateInputValue,
  type EmployeeFormValues,
  type ShiftFormValues,
  WorkshiftError,
  useWorkshift,
} from "@/lib/workshift";

import { exportScheduleWorkbook } from "./export-file";
import {
  DEFAULT_EMPLOYEE_DRAFT,
  createShiftDraftForDay,
  employeeToDraft,
  lunchBreakOptionsForValue,
  parseNumericField,
  shiftToDraft,
} from "./form-drafts";
import { useKeyboardHistory } from "./use-keyboard-history";
import { useTauriUpdater } from "./use-tauri-updater";
import {
  ConfirmDialog,
  EmployeeDialog,
  NoticeDialog,
  ShiftDialog,
  UpdateDialog,
} from "./workshift-dialogs";
import {
  CalendarPanel,
  EmployeePanel,
  RecapPanel,
  ShiftsPanel,
} from "./workshift-panels";
import type {
  ConfirmState,
  EmployeeDialogState,
  EmployeeDraft,
  NoticeState,
  ShiftClipboardState,
  ShiftDialogState,
  ShiftDraft,
} from "./workshift-ui-types";

export function WorkshiftApp() {
  const controller = useWorkshift(createDefaultSessionState());
  const { resolvedTheme, setTheme } = useTheme();

  const [employeeDialog, setEmployeeDialog] = useState<EmployeeDialogState>({
    open: false,
  });
  const [employeeDraft, setEmployeeDraft] = useState<EmployeeDraft>(
    DEFAULT_EMPLOYEE_DRAFT,
  );

  const [shiftDialog, setShiftDialog] = useState<ShiftDialogState>({
    open: false,
  });
  const [shiftDraft, setShiftDraft] = useState<ShiftDraft>(
    createShiftDraftForDay(controller.state.viewState.selectedDay),
  );
  const [shiftClipboard, setShiftClipboard] =
    useState<ShiftClipboardState | null>(null);

  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [errorState, setErrorState] = useState<NoticeState | null>(null);
  const [infoState, setInfoState] = useState<NoticeState | null>(null);

  const showError = useCallback((title: string, message: string) => {
    setErrorState({ title, message });
  }, []);
  const showInfo = useCallback((title: string, message: string) => {
    setInfoState({ title, message });
  }, []);

  const {
    availableUpdate,
    dismissAvailableUpdate,
    installAvailableUpdate,
    isInstallingUpdate,
    updateProgressLabel,
  } = useTauriUpdater({
    onError: showError,
    onInfo: showInfo,
  });

  const employeeOptions = controller.state.schedule.employees;
  const employeeNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const employee of employeeOptions) {
      const fullName = `${employee.firstName} ${employee.lastName}`.trim();
      map.set(employee.id, fullName || "Unnamed employee");
    }
    return map;
  }, [employeeOptions]);
  const selectedDayLabel = useMemo(
    () => formatFullDateLabel(controller.state.viewState.selectedDay),
    [controller.state.viewState.selectedDay],
  );
  const lunchBreakSelectOptions = useMemo(
    () => lunchBreakOptionsForValue(employeeDraft.lunchBreakHours),
    [employeeDraft.lunchBreakHours],
  );

  const canPasteCopiedShift =
    shiftClipboard !== null && employeeNameById.has(shiftClipboard.employeeId);
  const copiedShiftMissingEmployee =
    shiftClipboard !== null && !employeeNameById.has(shiftClipboard.employeeId);
  const copiedShiftEmployeeName =
    shiftClipboard !== null
      ? (employeeNameById.get(shiftClipboard.employeeId) ??
        shiftClipboard.employeeName)
      : "";
  const canUndo = controller.canUndo;
  const canRedo = controller.canRedo;

  useKeyboardHistory({
    canUndo,
    canRedo,
    undo: controller.undo,
    redo: controller.redo,
  });

  const executeSafely = (title: string, action: () => void) => {
    try {
      action();
    } catch (error) {
      const message =
        error instanceof WorkshiftError || error instanceof Error
          ? error.message
          : String(error);
      showError(title, message);
    }
  };

  const openAddEmployeeDialog = () => {
    setEmployeeDraft(DEFAULT_EMPLOYEE_DRAFT);
    setEmployeeDialog({ open: true, mode: "add" });
  };

  const openEditEmployeeDialog = (employeeId: string) => {
    executeSafely("Cannot edit person", () => {
      const employee = controller.getEmployee(employeeId);
      setEmployeeDraft(employeeToDraft(employee));
      setEmployeeDialog({ open: true, mode: "edit", employeeId });
    });
  };

  const submitEmployeeDialog = () => {
    const values: EmployeeFormValues = {
      firstName: employeeDraft.firstName,
      lastName: employeeDraft.lastName,
      monthlyTargetHours: parseNumericField(employeeDraft.monthlyTargetHours),
      lunchBreakHours: parseNumericField(employeeDraft.lunchBreakHours),
      colorHex: employeeDraft.colorHex,
    };

    if (employeeDialog.open && employeeDialog.mode === "edit") {
      executeSafely("Cannot edit person", () => {
        controller.editEmployee(employeeDialog.employeeId, values);
        setEmployeeDialog({ open: false });
      });
      return;
    }

    executeSafely("Cannot add person", () => {
      controller.addEmployee(values);
      setEmployeeDialog({ open: false });
    });
  };

  const requestDeleteEmployee = (employeeId: string) => {
    executeSafely("Cannot delete person", () => {
      const employee = controller.getEmployee(employeeId);
      const removedShifts = controller.countEmployeeShifts(employeeId);
      let message = `Delete ${employee.firstName} ${employee.lastName}?`;
      if (removedShifts > 0) {
        message += `\nThis will also remove ${removedShifts} shift(s).`;
      }

      setConfirmState({
        title: "Delete person",
        message,
        confirmLabel: "Delete",
        variant: "danger",
        action: () => {
          executeSafely("Cannot delete person", () => {
            controller.deleteEmployee(employeeId);
          });
        },
      });
    });
  };

  const openAddShiftDialog = () => {
    if (employeeOptions.length === 0) {
      showInfo("No employees", "Add a person before creating shifts.");
      return;
    }

    setShiftDraft(
      createShiftDraftForDay(controller.state.viewState.selectedDay),
    );
    setShiftDialog({ open: true, mode: "add" });
  };

  const openEditShiftDialog = (shiftId: string) => {
    executeSafely("Cannot edit shift", () => {
      const shift = controller.getShift(shiftId);
      setShiftDraft(shiftToDraft(shift));
      setShiftDialog({ open: true, mode: "edit", shiftId });
    });
  };

  const copyShiftToClipboard = (shiftId: string) => {
    executeSafely("Cannot copy shift", () => {
      const shift = controller.getShift(shiftId);
      const employeeName =
        employeeNameById.get(shift.employeeId) ?? "Unknown employee";
      setShiftClipboard({
        employeeId: shift.employeeId,
        employeeName,
        startTime: shift.startTime,
        endTime: shift.endTime,
        includesLunchBreak: shift.includesLunchBreak,
      });
    });
  };

  const pasteCopiedShift = () => {
    if (!shiftClipboard) {
      return;
    }

    executeSafely("Cannot paste shift", () => {
      controller.addShift({
        employeeId: shiftClipboard.employeeId,
        shiftDate: controller.state.viewState.selectedDay,
        startTime: shiftClipboard.startTime,
        endTime: shiftClipboard.endTime,
        includesLunchBreak: shiftClipboard.includesLunchBreak,
      });
    });
  };

  const submitShiftDialog = () => {
    if (!shiftDraft.employeeId.trim()) {
      showError("Cannot add shift", "Select an employee.");
      return;
    }

    const values: ShiftFormValues = {
      employeeId: shiftDraft.employeeId,
      shiftDate: parseDateInputValue(shiftDraft.shiftDate),
      startTime: shiftDraft.startTime,
      endTime: shiftDraft.endTime,
      includesLunchBreak: shiftDraft.includesLunchBreak,
    };

    if (shiftDialog.open && shiftDialog.mode === "edit") {
      executeSafely("Cannot edit shift", () => {
        controller.editShift(shiftDialog.shiftId, values);
        setShiftDialog({ open: false });
      });
      return;
    }

    executeSafely("Cannot add shift", () => {
      controller.addShift(values);
      setShiftDialog({ open: false });
    });
  };

  const requestDeleteShift = (shiftId: string) => {
    executeSafely("Cannot delete shift", () => {
      const shift = controller.getShift(shiftId);
      const employee = controller.getEmployee(shift.employeeId);
      const message =
        `Delete the shift for ${employee.firstName} ${employee.lastName} on ` +
        `${formatFullDateLabel(shift.shiftDate)}\n` +
        `${formatTimeRange(shift.startTime, shift.endTime)}?`;

      setConfirmState({
        title: "Delete shift",
        message,
        confirmLabel: "Delete",
        variant: "danger",
        action: () => {
          executeSafely("Cannot delete shift", () => {
            controller.deleteShift(shiftId);
          });
        },
      });
    });
  };

  const handleExport = async () => {
    try {
      const finalPath = await exportScheduleWorkbook(
        controller.state.schedule,
        controller.state.viewState.selectedMonth,
      );
      if (!finalPath) {
        return;
      }

      showInfo("Export complete", `Saved schedule to:\n${finalPath}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showError("Export failed", message);
    }
  };

  return (
    <main className="min-h-screen overflow-auto bg-muted/25 p-4">
      <div className="mx-auto flex h-[calc(100vh-2rem)] min-h-[780px] min-w-[1320px] max-w-[1800px] flex-col">
        <ResizablePanelGroup orientation="vertical" className="flex-1 gap-1">
          <ResizablePanel defaultSize="66%" minSize="56%" maxSize="78%">
            <ResizablePanelGroup orientation="horizontal" className="gap-1">
              <ResizablePanel defaultSize="22%" minSize="18%" maxSize="30%">
                <EmployeePanel
                  employees={controller.employeeRows}
                  onAddEmployee={openAddEmployeeDialog}
                  onEditEmployee={openEditEmployeeDialog}
                  onDeleteEmployee={requestDeleteEmployee}
                />
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel defaultSize="56%" minSize="40%">
                <CalendarPanel
                  monthLabel={controller.monthLabel}
                  calendarGrid={controller.calendarGrid}
                  canUndo={canUndo}
                  canRedo={canRedo}
                  isDarkTheme={resolvedTheme === "dark"}
                  onPreviousMonth={() => controller.moveMonth(-1)}
                  onNextMonth={() => controller.moveMonth(1)}
                  onToday={controller.goToday}
                  onSelectDay={controller.setSelectedDay}
                  onUndo={controller.undo}
                  onRedo={controller.redo}
                  onToggleTheme={() =>
                    setTheme(resolvedTheme === "dark" ? "light" : "dark")
                  }
                />
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel defaultSize="22%" minSize="18%" maxSize="30%">
                <ShiftsPanel
                  shifts={controller.dailyShiftRows}
                  clipboard={shiftClipboard}
                  copiedShiftEmployeeName={copiedShiftEmployeeName}
                  copiedShiftMissingEmployee={copiedShiftMissingEmployee}
                  canAddShift={controller.employeeRows.length > 0}
                  canPasteCopiedShift={canPasteCopiedShift}
                  onAddShift={openAddShiftDialog}
                  onPasteShift={pasteCopiedShift}
                  onClearClipboard={() => setShiftClipboard(null)}
                  onCopyShift={copyShiftToClipboard}
                  onEditShift={openEditShiftDialog}
                  onDeleteShift={requestDeleteShift}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize="34%" minSize="22%" maxSize="44%">
            <RecapPanel
              workloads={controller.workloadRows}
              onExport={handleExport}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <EmployeeDialog
        dialog={employeeDialog}
        draft={employeeDraft}
        lunchBreakOptions={lunchBreakSelectOptions}
        onOpenChange={(open) => {
          if (!open) {
            setEmployeeDialog({ open: false });
          }
        }}
        onDraftChange={(updates) => {
          setEmployeeDraft((current) => ({ ...current, ...updates }));
        }}
        onSubmit={submitEmployeeDialog}
        onCancel={() => setEmployeeDialog({ open: false })}
      />

      <ShiftDialog
        dialog={shiftDialog}
        draft={shiftDraft}
        selectedDayLabel={selectedDayLabel}
        employees={employeeOptions}
        employeeNameById={employeeNameById}
        onOpenChange={(open) => {
          if (!open) {
            setShiftDialog({ open: false });
          }
        }}
        onDraftChange={(updates) => {
          setShiftDraft((current) => ({ ...current, ...updates }));
        }}
        onSubmit={submitShiftDialog}
        onCancel={() => setShiftDialog({ open: false })}
      />

      <UpdateDialog
        availableUpdate={availableUpdate}
        isInstallingUpdate={isInstallingUpdate}
        updateProgressLabel={updateProgressLabel}
        onDismiss={dismissAvailableUpdate}
        onInstall={installAvailableUpdate}
      />

      <ConfirmDialog
        state={confirmState}
        onCancel={() => setConfirmState(null)}
        onConfirm={() => {
          const action = confirmState?.action;
          setConfirmState(null);
          action?.();
        }}
      />

      <NoticeDialog notice={errorState} onClose={() => setErrorState(null)} />
      <NoticeDialog notice={infoState} onClose={() => setInfoState(null)} />
    </main>
  );
}
