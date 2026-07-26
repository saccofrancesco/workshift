"use client";

import { Moon, Redo2, Sun, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  formatHours,
  formatTimeRange,
  weekdayAbbrev,
  type CalendarDayVM,
  type EmployeeListItemVM,
  type EmployeeWorkloadVM,
  type ShiftRowVM,
} from "@/lib/workshift";

import type { ShiftClipboardState } from "./workshift-ui-types";

interface EmployeePanelProps {
  employees: EmployeeListItemVM[];
  onAddEmployee: () => void;
  onEditEmployee: (employeeId: string) => void;
  onDeleteEmployee: (employeeId: string) => void;
}

export function EmployeePanel({
  employees,
  onAddEmployee,
  onEditEmployee,
  onDeleteEmployee,
}: EmployeePanelProps) {
  return (
    <Card className="flex h-full flex-col shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CardTitle>Employee</CardTitle>
          <Button size="sm" className="ml-auto" onClick={onAddEmployee}>
            Add person
          </Button>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 pt-1">
        <ScrollArea className="h-full">
          <div className="space-y-1.5">
            {employees.length === 0 && (
              <p className="w-full rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                No employees yet. Add a person to start planning shifts.
              </p>
            )}

            {employees.map((employee) => (
              <div
                key={employee.id}
                className="w-full rounded-lg border bg-card px-2.5 py-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: employee.colorHex }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm leading-tight font-medium">
                      {employee.fullName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatHours(employee.monthlyTargetHours)} / month ·{" "}
                      {formatHours(employee.lunchBreakHours)} lunch break
                    </p>
                  </div>
                  <div className="ml-auto flex shrink-0 items-center gap-1">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => onEditEmployee(employee.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="xs"
                      variant="destructive"
                      onClick={() => onDeleteEmployee(employee.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface CalendarPanelProps {
  monthLabel: string;
  calendarGrid: CalendarDayVM[][];
  canUndo: boolean;
  canRedo: boolean;
  isDarkTheme: boolean;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onSelectDay: (day: Date) => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleTheme: () => void;
}

export function CalendarPanel({
  monthLabel,
  calendarGrid,
  canUndo,
  canRedo,
  isDarkTheme,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onSelectDay,
  onUndo,
  onRedo,
  onToggleTheme,
}: CalendarPanelProps) {
  return (
    <Card className="flex h-full flex-col shadow-none">
      <CardHeader className="pb-2">
        <CardTitle>Calendar</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={onPreviousMonth}>
            Prev
          </Button>
          <div className="flex-1 text-center text-sm font-medium">
            {monthLabel}
          </div>
          <Button size="sm" variant="outline" onClick={onToday}>
            Today
          </Button>
          <Button size="sm" variant="outline" onClick={onNextMonth}>
            Next
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={!canUndo}
            onClick={onUndo}
            aria-label="Undo"
            title="Undo (Ctrl/Cmd+Z)"
          >
            <Undo2 className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={!canRedo}
            onClick={onRedo}
            aria-label="Redo"
            title="Redo (Shift+Ctrl/Cmd+Z)"
          >
            <Redo2 className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
          >
            {isDarkTheme ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, weekdayIndex) => (
            <div
              key={weekdayIndex}
              className="text-center text-sm font-medium text-muted-foreground"
            >
              {weekdayAbbrev(weekdayIndex)}
            </div>
          ))}
        </div>

        <div className="grid h-full min-h-0 grid-cols-7 grid-rows-6 gap-1">
          {calendarGrid.flat().map((day) => (
            <button
              key={`${day.date.toISOString()}-${day.dayNumber}`}
              type="button"
              title={day.tooltip}
              onClick={() => onSelectDay(day.date)}
              className={cn(
                "flex h-full min-h-0 cursor-pointer flex-col justify-between gap-1 overflow-hidden rounded-xl border p-1.5 text-left transition-colors sm:p-2",
                day.inCurrentMonth
                  ? "bg-card hover:bg-accent/70"
                  : "bg-muted/45 text-muted-foreground",
                day.isToday && "border-primary/60",
                day.isSelected &&
                  "border-primary bg-primary/15 text-foreground hover:bg-primary/20",
              )}
            >
              <div className="flex items-center gap-1">
                <span className="text-xs leading-none font-semibold sm:text-sm">
                  {day.dayNumber}
                </span>
                <span
                  className={cn(
                    "ml-auto inline-flex size-1.5 rounded-full",
                    day.isToday ? "bg-primary" : "bg-transparent",
                  )}
                />
              </div>
              <div className="flex items-center gap-1">
                {day.employeeColors.slice(0, 3).map((color, index) => (
                  <span
                    key={`${day.dayNumber}-${index}`}
                    className="inline-flex size-1.5 rounded-full sm:size-2"
                    style={{ backgroundColor: color }}
                  />
                ))}
                {day.overflowCount > 0 && (
                  <span className="rounded bg-muted px-1 text-[10px] font-medium text-muted-foreground sm:text-xs">
                    +{day.overflowCount}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface ShiftsPanelProps {
  shifts: ShiftRowVM[];
  clipboard: ShiftClipboardState | null;
  copiedShiftEmployeeName: string;
  copiedShiftMissingEmployee: boolean;
  canAddShift: boolean;
  canPasteCopiedShift: boolean;
  onAddShift: () => void;
  onPasteShift: () => void;
  onClearClipboard: () => void;
  onCopyShift: (shiftId: string) => void;
  onEditShift: (shiftId: string) => void;
  onDeleteShift: (shiftId: string) => void;
}

export function ShiftsPanel({
  shifts,
  clipboard,
  copiedShiftEmployeeName,
  copiedShiftMissingEmployee,
  canAddShift,
  canPasteCopiedShift,
  onAddShift,
  onPasteShift,
  onClearClipboard,
  onCopyShift,
  onEditShift,
  onDeleteShift,
}: ShiftsPanelProps) {
  return (
    <Card className="flex h-full flex-col shadow-none">
      <CardHeader className="space-y-2 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle>Shifts</CardTitle>
          <div className="ml-auto flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={!canPasteCopiedShift}
              onClick={onPasteShift}
            >
              Paste shift
            </Button>
            <Button size="sm" disabled={!canAddShift} onClick={onAddShift}>
              Add shift
            </Button>
          </div>
        </div>
        {clipboard && (
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-2 py-1.5 text-xs">
            <p className="min-w-0 flex-1 truncate text-muted-foreground">
              Copied: {copiedShiftEmployeeName} ·{" "}
              {formatTimeRange(clipboard.startTime, clipboard.endTime)} ·{" "}
              {clipboard.includesLunchBreak
                ? "lunch included"
                : "lunch not included"}
            </p>
            {copiedShiftMissingEmployee && (
              <span className="text-destructive">Employee removed</span>
            )}
            <Button size="xs" variant="ghost" onClick={onClearClipboard}>
              Clear
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="min-h-0 flex-1 pt-1">
        <ScrollArea className="h-full">
          <div className="space-y-1.5">
            {shifts.length === 0 && (
              <p className="w-full rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                No shifts for this day yet.
              </p>
            )}

            {shifts.map((shift) => (
              <div
                key={shift.id}
                className="w-full rounded-lg border bg-card px-2.5 py-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: shift.colorHex }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm leading-tight font-medium">
                      {shift.employeeName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatTimeRange(shift.startTime, shift.endTime)} ·{" "}
                      {formatHours(shift.durationHours)}
                    </p>
                  </div>
                  <div className="ml-auto flex shrink-0 items-center gap-1">
                    <Button
                      size="xs"
                      variant="secondary"
                      onClick={() => onCopyShift(shift.id)}
                    >
                      Copy
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => onEditShift(shift.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="xs"
                      variant="destructive"
                      onClick={() => onDeleteShift(shift.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface RecapPanelProps {
  workloads: EmployeeWorkloadVM[];
  onExport: () => void | Promise<void>;
}

export function RecapPanel({ workloads, onExport }: RecapPanelProps) {
  return (
    <Card className="flex h-full flex-col shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CardTitle>Recap</CardTitle>
          <Button size="sm" className="ml-auto" onClick={() => void onExport()}>
            Export .xlsx
          </Button>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 pt-1">
        <ScrollArea className="h-full">
          {workloads.length === 0 ? (
            <p className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
              Add people and shifts to see the workload recap.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 pr-2 md:grid-cols-2 xl:grid-cols-3">
              {workloads.map((workload) => (
                <div
                  key={workload.id}
                  className="rounded-lg border bg-card p-3"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className="inline-flex size-2 rounded-full"
                      style={{ backgroundColor: workload.colorHex }}
                    />
                    <p className="truncate font-medium">{workload.fullName}</p>
                  </div>
                  <p className="mb-2 text-sm leading-snug text-muted-foreground">
                    {formatHours(workload.assignedHours)} assigned ·{" "}
                    {formatHours(workload.targetHours)} target ·{" "}
                    {formatHours(workload.remainingHours)} remaining
                  </p>
                  <Progress
                    value={Math.round(workload.progressRatio * 100)}
                    className="gap-0"
                  />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
