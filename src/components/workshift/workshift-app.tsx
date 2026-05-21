"use client"

import { useMemo, useState } from "react"

import { save } from "@tauri-apps/plugin-dialog"
import { writeFile } from "@tauri-apps/plugin-fs"
import { Moon, Sun } from "lucide-react"

import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
import { cn } from "@/lib/utils"
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

const COLOR_SWATCHES = [
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
] as const

const LUNCH_BREAK_OPTIONS = [
  "0",
  "0.25",
  "0.5",
  "0.75",
  "1",
  "1.25",
  "1.5",
  "2",
] as const

const SHIFT_TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2)
  const minute = index % 2 === 0 ? "00" : "30"
  return `${hour.toString().padStart(2, "0")}:${minute}`
})

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
  const { resolvedTheme, setTheme } = useTheme()

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
  const employeeNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const employee of employeeOptions) {
      const fullName = `${employee.firstName} ${employee.lastName}`.trim()
      map.set(employee.id, fullName || "Unnamed employee")
    }
    return map
  }, [employeeOptions])
  const selectedDayLabel = useMemo(
    () => formatFullDateLabel(controller.state.viewState.selectedDay),
    [controller.state.viewState.selectedDay]
  )
  const lunchBreakSelectOptions = useMemo(() => {
    const currentValue = employeeDraft.lunchBreakHours.trim()
    if (!currentValue) {
      return [...LUNCH_BREAK_OPTIONS]
    }
    if (LUNCH_BREAK_OPTIONS.includes(currentValue as (typeof LUNCH_BREAK_OPTIONS)[number])) {
      return [...LUNCH_BREAK_OPTIONS]
    }
    return [currentValue, ...LUNCH_BREAK_OPTIONS]
  }, [employeeDraft.lunchBreakHours])

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
      employeeId: "",
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
    if (!shiftDraft.employeeId.trim()) {
      setErrorState({
        title: "Cannot add shift",
        message: "Select an employee.",
      })
      return
    }

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
    <main className="min-h-screen overflow-auto bg-muted/25 p-1">
      <div className="mx-auto flex h-[calc(100vh-0.5rem)] min-h-[780px] min-w-[1320px] max-w-[1800px] flex-col">
        <ResizablePanelGroup orientation="vertical" className="flex-1 gap-1">
          <ResizablePanel defaultSize="66%" minSize="56%" maxSize="78%">
            <ResizablePanelGroup orientation="horizontal" className="gap-1">
              <ResizablePanel defaultSize="22%" minSize="18%" maxSize="30%">
                <Card className="flex h-full flex-col shadow-none">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <CardTitle>Employees</CardTitle>
                      <Button size="sm" className="ml-auto" onClick={openAddEmployeeDialog}>
                        Add person
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="min-h-0 flex-1">
                    <ScrollArea className="h-full">
                      <div className="space-y-2 pr-2">
                        {controller.employeeRows.length === 0 && (
                          <p className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                            No employees yet. Add a person to start planning shifts.
                          </p>
                        )}

                        {controller.employeeRows.map((employee) => (
                          <div key={employee.id} className="rounded-lg border bg-card p-3">
                            <div className="flex items-start gap-2">
                              <span
                                className="mt-1 inline-flex size-3 shrink-0 rounded-full"
                                style={{ backgroundColor: employee.colorHex }}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">{employee.fullName}</p>
                                <p className="truncate text-sm text-muted-foreground">
                                  {formatHours(employee.monthlyTargetHours)} / month ·{" "}
                                  {formatHours(employee.lunchBreakHours)} lunch break
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditEmployeeDialog(employee.id)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
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

              <ResizableHandle withHandle />

              <ResizablePanel defaultSize="56%" minSize="40%">
                <Card className="flex h-full flex-col shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle>Monthly calendar</CardTitle>
                  </CardHeader>
                  <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => controller.moveMonth(-1)}>
                        Prev
                      </Button>
                      <div className="flex-1 text-center text-sm font-medium">
                        {controller.monthLabel}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => controller.goToday()}>
                        Today
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => controller.moveMonth(1)}>
                        Next
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() =>
                          setTheme(resolvedTheme === "dark" ? "light" : "dark")
                        }
                        aria-label="Toggle theme"
                      >
                        <Sun className="hidden size-4 dark:block" />
                        <Moon className="block size-4 dark:hidden" />
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
                      {controller.calendarGrid.flat().map((day) => (
                        <button
                          key={`${day.date.toISOString()}-${day.dayNumber}`}
                          type="button"
                          title={day.tooltip}
                          onClick={() => controller.setSelectedDay(day.date)}
                          className={cn(
                            "flex h-full min-h-0 cursor-pointer flex-col justify-between gap-1 overflow-hidden rounded-xl border p-1.5 text-left transition-colors sm:p-2",
                            day.inCurrentMonth
                              ? "bg-card hover:bg-accent/70"
                              : "bg-muted/45 text-muted-foreground",
                            day.isToday && "border-primary/60",
                            day.isSelected &&
                              "border-primary bg-primary/15 text-foreground hover:bg-primary/20"
                          )}
                        >
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-semibold leading-none sm:text-sm">
                              {day.dayNumber}
                            </span>
                            <span
                              className={cn(
                                "ml-auto inline-flex size-1.5 rounded-full",
                                day.isToday ? "bg-primary" : "bg-transparent"
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
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel defaultSize="22%" minSize="18%" maxSize="30%">
                <Card className="flex h-full flex-col shadow-none">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <CardTitle>Daily shifts</CardTitle>
                      <Button
                        size="sm"
                        className="ml-auto"
                        disabled={controller.employeeRows.length === 0}
                        onClick={openAddShiftDialog}
                      >
                        Add shift
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="min-h-0 flex-1">
                    <ScrollArea className="h-full">
                      <div className="space-y-2 pr-2">
                        {controller.dailyShiftRows.length === 0 && (
                          <p className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                            No shifts for this day yet.
                          </p>
                        )}

                        {controller.dailyShiftRows.map((shift) => (
                          <div key={shift.id} className="rounded-lg border bg-card p-3">
                            <div className="flex items-start gap-2">
                              <span
                                className="mt-1 inline-flex size-3 shrink-0 rounded-full"
                                style={{ backgroundColor: shift.colorHex }}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">{shift.employeeName}</p>
                                <p className="truncate text-sm text-muted-foreground">
                                  {formatTimeRange(shift.startTime, shift.endTime)}
                                </p>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {formatHours(shift.durationHours)}
                              </p>
                            </div>
                            <div className="mt-3 flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditShiftDialog(shift.id)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
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

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize="34%" minSize="22%" maxSize="44%">
            <Card className="flex h-full flex-col shadow-none">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle>Employee workload recap</CardTitle>
                  <Button size="sm" className="ml-auto" onClick={() => void handleExport()}>
                    Export .xlsx
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="min-h-0 flex-1">
                <ScrollArea className="h-full">
                  {controller.workloadRows.length === 0 ? (
                    <p className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                      Add people and shifts to see the workload recap.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 pr-2 md:grid-cols-2 xl:grid-cols-3">
                      {controller.workloadRows.map((workload) => (
                        <div key={workload.id} className="rounded-lg border bg-card p-3">
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
                          <Progress value={Math.round(workload.progressRatio * 100)} className="gap-0" />
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <Dialog
        open={employeeDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setEmployeeDialog({ open: false })
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {employeeDialog.open && employeeDialog.mode === "edit"
                ? "Edit person"
                : "Add person"}
            </DialogTitle>
            <DialogDescription>
              Fill employee details and default shift settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
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

              <div className="space-y-2">
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
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
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

              <div className="space-y-2">
                <Label htmlFor="employee-lunch-break">Lunch break (hours)</Label>
                <Select
                  value={employeeDraft.lunchBreakHours}
                  onValueChange={(value) => {
                    setEmployeeDraft((current) => ({
                      ...current,
                      lunchBreakHours: value ?? "0",
                    }))
                  }}
                >
                  <SelectTrigger id="employee-lunch-break" className="w-full">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {lunchBreakSelectOptions.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value} h
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee-color-hex">Color</Label>
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                {COLOR_SWATCHES.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Set color ${color}`}
                    className={cn(
                      "h-8 rounded-md border transition-colors",
                      employeeDraft.colorHex.toLowerCase() === color
                        ? "ring-2 ring-ring"
                        : "hover:border-foreground/40"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setEmployeeDraft((current) => ({
                        ...current,
                        colorHex: color,
                      }))
                    }}
                  />
                ))}
              </div>
              <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                <Input
                  type="color"
                  value={employeeDraft.colorHex}
                  className="h-9 w-14 p-1"
                  onChange={(event) => {
                    setEmployeeDraft((current) => ({
                      ...current,
                      colorHex: event.target.value,
                    }))
                  }}
                />
                <Input
                  id="employee-color-hex"
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

            <p className="text-sm text-muted-foreground">
              Lunch break is deducted from shifts when enabled.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEmployeeDialog({ open: false })}>
              Cancel
            </Button>
            <Button onClick={submitEmployeeDialog}>Save</Button>
          </DialogFooter>
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
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {shiftDialog.open && shiftDialog.mode === "edit"
                ? "Edit shift"
                : "Add shift"}
            </DialogTitle>
            <DialogDescription>Selected day: {selectedDayLabel}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
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
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an employee">
                    {(value) => {
                      if (!value) {
                        return "Select an employee"
                      }
                      return employeeNameById.get(String(value)) ?? "Unknown employee"
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {employeeOptions.map((employee) => (
                    <SelectItem
                      key={employee.id}
                      value={employee.id}
                      label={employeeNameById.get(employee.id)}
                    >
                      {employeeNameById.get(employee.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Start time</Label>
                <Select
                  value={shiftDraft.startTime}
                  onValueChange={(value) => {
                    setShiftDraft((current) => ({
                      ...current,
                      startTime: value ?? current.startTime,
                    }))
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIFT_TIME_OPTIONS.map((time) => (
                      <SelectItem key={`start-${time}`} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>End time</Label>
                <Select
                  value={shiftDraft.endTime}
                  onValueChange={(value) => {
                    setShiftDraft((current) => ({
                      ...current,
                      endTime: value ?? current.endTime,
                    }))
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIFT_TIME_OPTIONS.map((time) => (
                      <SelectItem key={`end-${time}`} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border p-3">
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
              <p className="mt-2 text-sm text-muted-foreground">
                Uncheck it for shifts where lunch happens outside working time.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShiftDialog({ open: false })}>
              Cancel
            </Button>
            <Button onClick={submitShiftDialog}>Save</Button>
          </DialogFooter>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmState?.title}</DialogTitle>
            <DialogDescription className="whitespace-pre-wrap">
              {confirmState?.message}
            </DialogDescription>
          </DialogHeader>

          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            This action cannot be undone.
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmState(null)}>
              Cancel
            </Button>
            <Button
              variant={confirmState?.variant === "danger" ? "destructive" : "default"}
              onClick={() => {
                const action = confirmState?.action
                setConfirmState(null)
                action?.()
              }}
            >
              {confirmState?.confirmLabel}
            </Button>
          </DialogFooter>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{errorState?.title}</DialogTitle>
            <DialogDescription className="whitespace-pre-wrap">
              {errorState?.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setErrorState(null)}>Close</Button>
          </DialogFooter>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{infoState?.title}</DialogTitle>
            <DialogDescription className="whitespace-pre-wrap">
              {infoState?.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setInfoState(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
