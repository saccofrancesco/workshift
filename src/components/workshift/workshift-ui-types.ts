import type { Employee, Shift } from "@/lib/workshift";

export interface EmployeeDraft {
  firstName: string;
  lastName: string;
  monthlyTargetHours: string;
  lunchBreakHours: string;
  colorHex: string;
}

export interface ShiftDraft {
  employeeId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  includesLunchBreak: boolean;
}

export interface ShiftClipboardState {
  employeeId: string;
  employeeName: string;
  startTime: string;
  endTime: string;
  includesLunchBreak: boolean;
}

export type EmployeeDialogState =
  | { open: false }
  | { open: true; mode: "add" }
  | { open: true; mode: "edit"; employeeId: Employee["id"] };

export type ShiftDialogState =
  | { open: false }
  | { open: true; mode: "add" }
  | { open: true; mode: "edit"; shiftId: Shift["id"] };

export interface ConfirmState {
  title: string;
  message: string;
  action: () => void;
  confirmLabel: string;
  variant: "danger" | "primary";
}

export interface NoticeState {
  title: string;
  message: string;
}
