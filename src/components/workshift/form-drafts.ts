import {
  toDateInputValue,
  type Employee,
  type Shift,
} from "@/lib/workshift";

import type { EmployeeDraft, ShiftDraft } from "./workshift-ui-types";

export const DEFAULT_EMPLOYEE_DRAFT: EmployeeDraft = {
  firstName: "",
  lastName: "",
  monthlyTargetHours: "160",
  lunchBreakHours: "1",
  colorHex: "#2563eb",
};

export const COLOR_SWATCHES = [
  "#2563eb",
  "#0ea5e9",
  "#14b8a6",
  "#22c55e",
  "#eab308",
  "#f97316",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#64748b",
] as const;

const LUNCH_BREAK_OPTIONS = [
  "0",
  "0.25",
  "0.5",
  "0.75",
  "1",
  "1.25",
  "1.5",
  "2",
] as const;

export function createShiftDraftForDay(selectedDay: Date): ShiftDraft {
  return {
    employeeId: "",
    shiftDate: toDateInputValue(selectedDay),
    startTime: "09:00",
    endTime: "18:00",
    includesLunchBreak: true,
  };
}

export function employeeToDraft(employee: Employee): EmployeeDraft {
  return {
    firstName: employee.firstName,
    lastName: employee.lastName,
    monthlyTargetHours: employee.monthlyTargetHours.toString(),
    lunchBreakHours: employee.lunchBreakHours.toString(),
    colorHex: employee.colorHex,
  };
}

export function shiftToDraft(shift: Shift): ShiftDraft {
  return {
    employeeId: shift.employeeId,
    shiftDate: toDateInputValue(shift.shiftDate),
    startTime: shift.startTime,
    endTime: shift.endTime,
    includesLunchBreak: shift.includesLunchBreak,
  };
}

export function parseNumericField(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function lunchBreakOptionsForValue(currentValue: string): string[] {
  const trimmedValue = currentValue.trim();
  if (!trimmedValue) {
    return [...LUNCH_BREAK_OPTIONS];
  }
  if (
    LUNCH_BREAK_OPTIONS.includes(
      trimmedValue as (typeof LUNCH_BREAK_OPTIONS)[number],
    )
  ) {
    return [...LUNCH_BREAK_OPTIONS];
  }
  return [trimmedValue, ...LUNCH_BREAK_OPTIONS];
}
