"use client"

import { useMemo, useState } from "react"

import { save } from "@tauri-apps/plugin-dialog"
import { writeFile } from "@tauri-apps/plugin-fs"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  createDefaultSessionState,
  formatFullDateLabel,
  formatHours,
  formatTimeRange,
  parseDateInputValue,
  toDateInputValue,
  type Employee,
  type EmployeeFormValues,
  type Shift,
  type ShiftFormValues,
  weekdayAbbrev,
  WorkshiftError,
  useWorkshift,
} from "@/lib/workshift"
import {
  createScheduleWorkbook,
  defaultExportFilename,
} from "@/lib/workshift/export-xlsx"

interface EmployeeDraft {
  firstName: string
  lastName: string
  monthlyTargetHours: string
  lunchBreakHours: string
  colorHex: string
}

interface ShiftDraft {
  employeeId: string
  shiftDate: string
  startTime: string
  endTime: string
  includesLunchBreak: boolean
}

type EmployeeDialogState =
  | { open: false }
  | { open: true; mode: "add" }
  | { open: true; mode: "edit"; employeeId: string }

type ShiftDialogState =
  | { open: false }
  | { open: true; mode: "add" }
  | { open: true; mode: "edit"; shiftId: string }

interface ConfirmState {
  title: string
  message: string
  action: () => void
  confirmLabel: string
  variant: "danger" | "primary"
}

interface NoticeState {
  title: string
  message: string
}

const DEFAULT_EMPLOYEE_DRAFT: EmployeeDraft = {
  firstName: "",
  lastName: "",
  monthlyTargetHours: "160",
  lunchBreakHours: "1",
  colorHex: "#2563eb",
}

function employeeToDraft(employee: Employee): EmployeeDraft {
  return {
    firstName: employee.firstName,
    lastName: employee.lastName,
    monthlyTargetHours: employee.monthlyTargetHours.toString(),
    lunchBreakHours: employee.lunchBreakHours.toString(),
    colorHex: employee.colorHex,
  }
}

function shiftToDraft(shift: Shift): ShiftDraft {
  return {
    employeeId: shift.employeeId,
    shiftDate: toDateInputValue(shift.shiftDate),
    startTime: shift.startTime,
    endTime: shift.endTime,
    includesLunchBreak: shift.includesLunchBreak,
  }
}

function parseNumericField(value: string): number {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function ensureXlsxExtension(path: string): string {
  const trimmed = path.trim()
  if (!trimmed.toLowerCase().endsWith(".xlsx")) {
    return `${trimmed}.xlsx`
  }
  return trimmed
}

export function WorkshiftApp() {
  const controller = useWorkshift(createDefaultSessionState())

  const [employeeDialog, setEmployeeDialog] =
    useState<EmployeeDialogState>({ open: false })
  const [employeeDraft, setEmployeeDraft] = useState<EmployeeDraft>(
    DEFAULT_EMPLOYEE_DRAFT
  )

  const [shiftDialog, setShiftDialog] = useState<ShiftDialogState>({ open: false })
  const [shiftDraft, setShiftDraft] = useState<ShiftDraft>({
    employeeId: "",
    shiftDate: toDateInputValue(controller.state.viewState.selectedDay),
    startTime: "09:00",
    endTime: "18:00",
    includesLunchBreak: true,
  })

  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)
  const [errorState, setErrorState] = useState<NoticeState | null>(null)
  const [infoState, setInfoState] = useState<NoticeState | null>(null)

  const employeeOptions = controller.state.schedule.employees
  const selectedDayLabel = useMemo(
    () => formatFullDateLabel(controller.state.viewState.selectedDay),
    [controller.state.viewState.selectedDay]
  )

  const executeSafely = (title: string, action: () => void) => {
    try {
      action()
    } catch (error) {
      const message =
        error instanceof WorkshiftError || error instanceof Error
          ? error.message
          : String(error)
      setErrorState({ title, message })
    }
  }

  const openAddEmployeeDialog = () => {
    setEmployeeDraft(DEFAULT_EMPLOYEE_DRAFT)
    setEmployeeDialog({ open: true, mode: "add" })
  }

  const openEditEmployeeDialog = (employeeId: string) => {
    executeSafely("Cannot edit person", () => {
      const employee = controller.getEmployee(employeeId)
      setEmployeeDraft(employeeToDraft(employee))
      setEmployeeDialog({ open: true, mode: "edit", employeeId })
    })
  }

  const submitEmployeeDialog = () => {
    const values: EmployeeFormValues = {
      firstName: employeeDraft.firstName,
      lastName: employeeDraft.lastName,
      monthlyTargetHours: parseNumericField(employeeDraft.monthlyTargetHours),
      lunchBreakHours: parseNumericField(employeeDraft.lunchBreakHours),
      colorHex: employeeDraft.colorHex,
    }

    if (employeeDialog.open && employeeDialog.mode === "edit") {
      executeSafely("Cannot edit person", () => {
        controller.editEmployee(employeeDialog.employeeId, values)
        setEmployeeDialog({ open: false })
      })
      return
    }

    executeSafely("Cannot add person", () => {
      controller.addEmployee(values)
      setEmployeeDialog({ open: false })
    })
  }

  const requestDeleteEmployee = (employeeId: string) => {
    executeSafely("Cannot delete person", () => {
      const employee = controller.getEmployee(employeeId)
      const removedShifts = controller.countEmployeeShifts(employeeId)
      let message = `Delete ${employee.firstName} ${employee.lastName}?`
      if (removedShifts > 0) {
        message += `\nThis will also remove ${removedShifts} shift(s).`
      }

      setConfirmState({
        title: "Delete person",
        message,
        confirmLabel: "Delete",
        variant: "danger",
        action: () => {
          executeSafely("Cannot delete person", () => {
            controller.deleteEmployee(employeeId)
          })
        },
      })
    })
  }

  const openAddShiftDialog = () => {
    if (employeeOptions.length === 0) {
      setInfoState({
        title: "No employees",
        message: "Add a person before creating shifts.",
      })
      return
    }

    setShiftDraft({
      employeeId: employeeOptions[0]?.id ?? "",
      shiftDate: toDateInputValue(controller.state.viewState.selectedDay),
      startTime: "09:00",
      endTime: "18:00",
      includesLunchBreak: true,
    })
    setShiftDialog({ open: true, mode: "add" })
  }

  const openEditShiftDialog = (shiftId: string) => {
    executeSafely("Cannot edit shift", () => {
      const shift = controller.getShift(shiftId)
      setShiftDraft(shiftToDraft(shift))
      setShiftDialog({ open: true, mode: "edit", shiftId })
    })
  }

  const submitShiftDialog = () => {
    const values: ShiftFormValues = {
      employeeId: shiftDraft.employeeId,
      shiftDate: parseDateInputValue(shiftDraft.shiftDate),
      startTime: shiftDraft.startTime,
      endTime: shiftDraft.endTime,
      includesLunchBreak: shiftDraft.includesLunchBreak,
    }

    if (shiftDialog.open && shiftDialog.mode === "edit") {
      executeSafely("Cannot edit shift", () => {
        controller.editShift(shiftDialog.shiftId, values)
        setShiftDialog({ open: false })
      })
      return
    }

    executeSafely("Cannot add shift", () => {
      controller.addShift(values)
      setShiftDialog({ open: false })
    })
  }

  const requestDeleteShift = (shiftId: string) => {
    executeSafely("Cannot delete shift", () => {
      const shift = controller.getShift(shiftId)
      const employee = controller.getEmployee(shift.employeeId)
      const message =
        `Delete the shift for ${employee.firstName} ${employee.lastName} on ` +
        `${formatFullDateLabel(shift.shiftDate)}\n` +
        `${formatTimeRange(shift.startTime, shift.endTime)}?`

      setConfirmState({
        title: "Delete shift",
        message,
        confirmLabel: "Delete",
        variant: "danger",
        action: () => {
          executeSafely("Cannot delete shift", () => {
            controller.deleteShift(shiftId)
          })
        },
      })
    })
  }

  const handleExport = async () => {
    try {
      const defaultPath = defaultExportFilename(controller.state.viewState.selectedMonth)
      const path = await save({
        title: "Export .xlsx",
        defaultPath,
        filters: [
          {
            name: "Excel Workbook",
            extensions: ["xlsx"],
          },
        ],
      })

      if (!path) {
        return
      }

      const finalPath = ensureXlsxExtension(path)
      const workbookData = createScheduleWorkbook(
        controller.state.schedule,
        controller.state.viewState.selectedMonth
      )
      await writeFile(finalPath, workbookData)

      setInfoState({
        title: "Export complete",
        message: `Saved schedule to:\n${finalPath}`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setErrorState({ title: "Export failed", message })
    }
  }

  return (
    <main className="h-screen min-h-screen bg-[#eef2f7] p-3 text-[#0f172a]">
      <ResizablePanelGroup orientation="vertical" className="gap-2">
        <ResizablePanel defaultSize={62} minSize={40}>
          <ResizablePanelGroup orientation="horizontal" className="gap-2">
            <ResizablePanel defaultSize={22} minSize={16}>
              <Card className="h-full rounded-2xl border border-[#d9e0ea] bg-white py-0">
                <CardHeader className="px-3 pt-3 pb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-[15px] font-bold text-[#0f172a]">
                      Employees
                    </CardTitle>
                    <div className="ml-auto">
                      <Button
                        size="sm"
                        className="h-8 rounded-lg bg-[#2563eb] px-3 text-white hover:bg-[#1d4ed8]"
                        onClick={openAddEmployeeDialog}
                      >
                        Add person
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="h-[calc(100%-52px)] px-3 pb-3">
                  <ScrollArea className="h-full">
                    <div className="space-y-2 pr-2">
                      {controller.employeeRows.length === 0 && (
                        <p className="rounded-xl px-3 py-3 text-center text-[12px] italic text-[#64748b]">
                          No employees yet. Add a person to start planning shifts
                        </p>
                      )}

                      {controller.employeeRows.map((employee) => (
                        <div
                          key={employee.id}
                          className="rounded-xl border border-[#d9e0ea] bg-white px-3 py-2"
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className="mt-1 inline-flex size-3 shrink-0 rounded-full"
                              style={{ backgroundColor: employee.colorHex }}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[12px] font-semibold text-[#0f172a]">
                                {employee.fullName}
                              </p>
                              <p className="truncate text-[11px] text-[#64748b]">
                                {formatHours(employee.monthlyTargetHours)} / month ·{" "}
                                {formatHours(employee.lunchBreakHours)} lunch break
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 rounded-lg border-[#d8e0ea] bg-white px-2.5 text-[11px]"
                              onClick={() => openEditEmployeeDialog(employee.id)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 rounded-lg border border-[#fecdd3] bg-[#fff1f2] px-2.5 text-[11px] text-[#be123c] hover:bg-[#ffe4e6]"
                              onClick={() => requestDeleteEmployee(employee.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-transparent" />

            <ResizablePanel defaultSize={56} minSize={34}>
              <Card className="h-full rounded-2xl border border-[#d9e0ea] bg-white py-0">
                <CardHeader className="px-3 pt-3 pb-2">
                  <CardTitle className="text-[15px] font-bold text-[#0f172a]">
                    Monthly calendar
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex h-[calc(100%-52px)] flex-col gap-2 px-3 pb-3">
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg border-[#d8e0ea] bg-white px-2.5"
                      onClick={() => controller.moveMonth(-1)}
                    >
                      Prev
                    </Button>
                    <div className="flex-1 text-center text-[11px] text-[#64748b]">
                      {controller.monthLabel}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg border-[#d8e0ea] bg-white px-2.5"
                      onClick={() => controller.goToday()}
                    >
                      Today
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg border-[#d8e0ea] bg-white px-2.5"
                      onClick={() => controller.moveMonth(1)}
                    >
                      Next
                    </Button>
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 7 }).map((_, weekdayIndex) => (
                      <div
                        key={weekdayIndex}
                        className="text-center text-[11px] text-[#64748b]"
                      >
                        {weekdayAbbrev(weekdayIndex)}
                      </div>
                    ))}
                  </div>

                  <div className="grid flex-1 grid-cols-7 gap-1">
                    {controller.calendarGrid.flat().map((day) => {
                      const dayBorder = day.isSelected
                        ? "#2563eb"
                        : day.isToday
                          ? "#2563eb"
                          : day.inCurrentMonth
                            ? "#d8e0ea"
                            : "#e2e8f0"
                      const dayBackground = day.isSelected
                        ? "#dbeafe"
                        : day.inCurrentMonth || day.isToday
                          ? "#ffffff"
                          : "#f8fafc"
                      const textColor =
                        day.inCurrentMonth || day.isSelected || day.isToday
                          ? "#0f172a"
                          : "#64748b"

                      return (
                        <button
                          key={`${day.date.toISOString()}-${day.dayNumber}`}
                          type="button"
                          title={day.tooltip}
                          onClick={() => controller.setSelectedDay(day.date)}
                          className="flex min-h-[58px] cursor-pointer flex-col rounded-xl border p-1.5 text-left"
                          style={{
                            borderColor: dayBorder,
                            background: dayBackground,
                          }}
                        >
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-semibold" style={{ color: textColor }}>
                              {day.dayNumber}
                            </span>
                            <span className="ml-auto inline-flex size-1.5 rounded-full bg-[#2563eb]" style={{ visibility: day.isToday ? "visible" : "hidden" }} />
                          </div>
                          <div className="mt-auto flex items-center gap-1">
                            {day.employeeColors.slice(0, 3).map((color, index) => (
                              <span
                                key={`${day.dayNumber}-${index}`}
                                className="inline-flex size-2 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                            {day.overflowCount > 0 && (
                              <span className="rounded-md bg-[#e2e8f0] px-1 text-[10px] text-[#475569]">
                                +{day.overflowCount}
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-transparent" />

            <ResizablePanel defaultSize={22} minSize={16}>
              <Card className="h-full rounded-2xl border border-[#d9e0ea] bg-white py-0">
                <CardHeader className="px-3 pt-3 pb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-[15px] font-bold text-[#0f172a]">
                      Daily shifts
                    </CardTitle>
                    <div className="ml-auto">
                      <Button
                        size="sm"
                        className="h-8 rounded-lg bg-[#2563eb] px-3 text-white hover:bg-[#1d4ed8] disabled:opacity-50"
                        disabled={controller.employeeRows.length === 0}
                        onClick={openAddShiftDialog}
                      >
                        Add shift
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="h-[calc(100%-52px)] px-3 pb-3">
                  <ScrollArea className="h-full">
                    <div className="space-y-2 pr-2">
                      {controller.dailyShiftRows.length === 0 && (
                        <p className="rounded-xl px-3 py-3 text-center text-[12px] italic text-[#64748b]">
                          No shifts for this day yet.
                        </p>
                      )}

                      {controller.dailyShiftRows.map((shift) => (
                        <div
                          key={shift.id}
                          className="rounded-xl border border-[#d9e0ea] bg-white px-3 py-2"
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className="mt-1 inline-flex size-3 shrink-0 rounded-full"
                              style={{ backgroundColor: shift.colorHex }}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[12px] font-semibold text-[#0f172a]">
                                {shift.employeeName}
                              </p>
                              <p className="truncate text-[11px] text-[#64748b]">
                                {formatTimeRange(shift.startTime, shift.endTime)}
                              </p>
                            </div>
                            <p className="text-[11px] text-[#64748b]">
                              {formatHours(shift.durationHours)}
                            </p>
                          </div>
                          <div className="mt-2 flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 rounded-lg border-[#d8e0ea] bg-white px-2.5 text-[11px]"
                              onClick={() => openEditShiftDialog(shift.id)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 rounded-lg border border-[#fecdd3] bg-[#fff1f2] px-2.5 text-[11px] text-[#be123c] hover:bg-[#ffe4e6]"
                              onClick={() => requestDeleteShift(shift.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-transparent" />

        <ResizablePanel defaultSize={38} minSize={22}>
          <Card className="h-full rounded-2xl border border-[#d9e0ea] bg-white py-0">
            <CardHeader className="px-3 pt-3 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-[15px] font-bold text-[#0f172a]">
                  Employee workload recap
                </CardTitle>
                <div className="ml-auto">
                  <Button
                    size="sm"
                    className="h-8 rounded-lg bg-[#2563eb] px-3 text-white hover:bg-[#1d4ed8]"
                    onClick={() => {
                      void handleExport()
                    }}
                  >
                    Export .xlsx
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[calc(100%-52px)] px-3 pb-3">
              <ScrollArea className="h-full">
                {controller.workloadRows.length === 0 ? (
                  <p className="rounded-xl px-3 py-3 text-center text-[12px] italic text-[#64748b]">
                    Add people and shifts to see the workload recap.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 pr-2 md:grid-cols-2 xl:grid-cols-3">
                    {controller.workloadRows.map((workload) => (
                      <div
                        key={workload.id}
                        className="rounded-xl border border-[#d9e0ea] bg-white px-3 py-2"
                      >
                        <div className="mb-1 flex items-center gap-1.5">
                          <span
                            className="inline-flex size-2 rounded-full"
                            style={{ backgroundColor: workload.colorHex }}
                          />
                          <p className="truncate text-[12px] font-semibold text-[#0f172a]">
                            {workload.fullName}
                          </p>
                        </div>
                        <p className="mb-2 text-[10px] text-[#64748b]">
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
        </ResizablePanel>
      </ResizablePanelGroup>

      <Dialog
        open={employeeDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setEmployeeDialog({ open: false })
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-[500px] rounded-2xl border border-[#d9e0ea] bg-[#eef2f7] p-4"
        >
          <div className="rounded-2xl border border-[#d9e0ea] bg-white p-4">
            <DialogHeader>
              <DialogTitle className="text-[15px] font-bold text-[#0f172a]">
                {employeeDialog.open && employeeDialog.mode === "edit"
                  ? "Edit person"
                  : "Add person"}
              </DialogTitle>
            </DialogHeader>

            <div className="mt-4 space-y-3">
              <div className="space-y-1">
                <Label htmlFor="employee-first-name">First name</Label>
                <Input
                  id="employee-first-name"
                  value={employeeDraft.firstName}
                  onChange={(event) => {
                    setEmployeeDraft((current) => ({
                      ...current,
                      firstName: event.target.value,
                    }))
                  }}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="employee-last-name">Last name</Label>
                <Input
                  id="employee-last-name"
                  value={employeeDraft.lastName}
                  onChange={(event) => {
                    setEmployeeDraft((current) => ({
                      ...current,
                      lastName: event.target.value,
                    }))
                  }}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="employee-monthly-target">Monthly target</Label>
                <Input
                  id="employee-monthly-target"
                  type="number"
                  min="0"
                  step="0.25"
                  value={employeeDraft.monthlyTargetHours}
                  onChange={(event) => {
                    setEmployeeDraft((current) => ({
                      ...current,
                      monthlyTargetHours: event.target.value,
                    }))
                  }}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="employee-lunch-break">Lunch break</Label>
                <Input
                  id="employee-lunch-break"
                  type="number"
                  min="0"
                  step="0.25"
                  value={employeeDraft.lunchBreakHours}
                  onChange={(event) => {
                    setEmployeeDraft((current) => ({
                      ...current,
                      lunchBreakHours: event.target.value,
                    }))
                  }}
                />
                <p className="text-[11px] text-[#64748b]">
                  Deducted from shifts when lunch is included in the day.
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="employee-color">Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="employee-color"
                    type="color"
                    value={employeeDraft.colorHex}
                    className="h-9 w-16 p-1"
                    onChange={(event) => {
                      setEmployeeDraft((current) => ({
                        ...current,
                        colorHex: event.target.value,
                      }))
                    }}
                  />
                  <Input
                    value={employeeDraft.colorHex}
                    onChange={(event) => {
                      setEmployeeDraft((current) => ({
                        ...current,
                        colorHex: event.target.value,
                      }))
                    }}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4 -mx-4 -mb-4 rounded-b-2xl border-t border-[#d9e0ea] bg-white/50">
              <Button
                variant="outline"
                className="border-[#d8e0ea] bg-white"
                onClick={() => setEmployeeDialog({ open: false })}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                onClick={submitEmployeeDialog}
              >
                Save
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={shiftDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setShiftDialog({ open: false })
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-[470px] rounded-2xl border border-[#d9e0ea] bg-[#eef2f7] p-4"
        >
          <div className="rounded-2xl border border-[#d9e0ea] bg-white p-4">
            <DialogHeader>
              <DialogTitle className="text-[15px] font-bold text-[#0f172a]">
                {shiftDialog.open && shiftDialog.mode === "edit"
                  ? "Edit shift"
                  : "Add shift"}
              </DialogTitle>
              <DialogDescription className="text-[11px] text-[#64748b]">
                Selected day: {selectedDayLabel}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-3">
              <div className="space-y-1">
                <Label>Employee</Label>
                <Select
                  value={shiftDraft.employeeId}
                  onValueChange={(value) => {
                    setShiftDraft((current) => ({
                      ...current,
                      employeeId: value ?? "",
                    }))
                  }}
                >
                  <SelectTrigger className="h-9 w-full rounded-lg border-[#d8e0ea]">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeOptions.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="shift-date">Date</Label>
                <Input
                  id="shift-date"
                  type="date"
                  value={shiftDraft.shiftDate}
                  onChange={(event) => {
                    setShiftDraft((current) => ({
                      ...current,
                      shiftDate: event.target.value,
                    }))
                  }}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="shift-start-time">Start time</Label>
                <Input
                  id="shift-start-time"
                  type="time"
                  value={shiftDraft.startTime}
                  onChange={(event) => {
                    setShiftDraft((current) => ({
                      ...current,
                      startTime: event.target.value,
                    }))
                  }}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="shift-end-time">End time</Label>
                <Input
                  id="shift-end-time"
                  type="time"
                  value={shiftDraft.endTime}
                  onChange={(event) => {
                    setShiftDraft((current) => ({
                      ...current,
                      endTime: event.target.value,
                    }))
                  }}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={shiftDraft.includesLunchBreak}
                    onCheckedChange={(checked) => {
                      setShiftDraft((current) => ({
                        ...current,
                        includesLunchBreak: checked,
                      }))
                    }}
                  />
                  <Label>Lunch break included</Label>
                </div>
                <p className="text-[11px] text-[#64748b]">
                  Uncheck it for morning or afternoon shifts where lunch happens
                  outside work.
                </p>
              </div>
            </div>

            <DialogFooter className="mt-4 -mx-4 -mb-4 rounded-b-2xl border-t border-[#d9e0ea] bg-white/50">
              <Button
                variant="outline"
                className="border-[#d8e0ea] bg-white"
                onClick={() => setShiftDialog({ open: false })}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                onClick={submitShiftDialog}
              >
                Save
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(confirmState)}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmState(null)
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-[460px] rounded-2xl border border-[#d9e0ea] bg-[#eef2f7] p-4"
        >
          <div className="rounded-2xl border border-[#d9e0ea] bg-white p-4">
            <DialogHeader>
              <DialogTitle className="text-[15px] font-bold text-[#0f172a]">
                {confirmState?.title}
              </DialogTitle>
              <DialogDescription className="whitespace-pre-wrap text-[11px] text-[#64748b]">
                {confirmState?.message}
              </DialogDescription>
            </DialogHeader>

            <p className="mt-3 rounded-lg border border-[#fecdd3] bg-[#fff1f2] px-2 py-1.5 text-[11px] text-[#be123c]">
              This action cannot be undone.
            </p>

            <DialogFooter className="mt-4 -mx-4 -mb-4 rounded-b-2xl border-t border-[#d9e0ea] bg-white/50">
              <Button
                variant="outline"
                className="border-[#d8e0ea] bg-white"
                onClick={() => setConfirmState(null)}
              >
                Cancel
              </Button>
              <Button
                className={
                  confirmState?.variant === "danger"
                    ? "border border-[#fecdd3] bg-[#fff1f2] text-[#be123c] hover:bg-[#ffe4e6]"
                    : "bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                }
                onClick={() => {
                  const action = confirmState?.action
                  setConfirmState(null)
                  action?.()
                }}
              >
                {confirmState?.confirmLabel}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(errorState)}
        onOpenChange={(open) => {
          if (!open) {
            setErrorState(null)
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-[460px] rounded-2xl border border-[#d9e0ea] bg-[#eef2f7] p-4"
        >
          <div className="rounded-2xl border border-[#d9e0ea] bg-white p-4">
            <DialogHeader>
              <DialogTitle className="text-[15px] font-bold text-[#0f172a]">
                {errorState?.title}
              </DialogTitle>
              <DialogDescription className="whitespace-pre-wrap text-[11px] text-[#64748b]">
                {errorState?.message}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-4 -mx-4 -mb-4 rounded-b-2xl border-t border-[#d9e0ea] bg-white/50">
              <Button
                className="bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                onClick={() => setErrorState(null)}
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(infoState)}
        onOpenChange={(open) => {
          if (!open) {
            setInfoState(null)
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-[460px] rounded-2xl border border-[#d9e0ea] bg-[#eef2f7] p-4"
        >
          <div className="rounded-2xl border border-[#d9e0ea] bg-white p-4">
            <DialogHeader>
              <DialogTitle className="text-[15px] font-bold text-[#0f172a]">
                {infoState?.title}
              </DialogTitle>
              <DialogDescription className="whitespace-pre-wrap text-[11px] text-[#64748b]">
                {infoState?.message}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-4 -mx-4 -mb-4 rounded-b-2xl border-t border-[#d9e0ea] bg-white/50">
              <Button
                className="bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                onClick={() => setInfoState(null)}
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
