import * as XLSX from "xlsx"

import type { Employee, Schedule, Shift } from "@/lib/workshift"
import { formatMonthLabel, toDateInputValue } from "@/lib/workshift"

interface ShiftExportRow {
  employeeId: string
  employeeName: string
  shiftDate: Date
  startTime: string
  endTime: string
  durationHours: number
  notes: string
}

function shiftDurationHours(shift: Shift): number {
  const [startHour, startMinute] = shift.startTime
    .split(":")
    .map((value) => Number.parseInt(value, 10))
  const [endHour, endMinute] = shift.endTime
    .split(":")
    .map((value) => Number.parseInt(value, 10))
  return (endHour * 60 + endMinute - (startHour * 60 + startMinute)) / 60
}

function employeeName(employee: Employee | undefined): string {
  if (!employee) {
    return "Unknown employee"
  }
  return `${employee.firstName} ${employee.lastName}`.trim()
}

function buildExportRows(schedule: Schedule, monthDate: Date): ShiftExportRow[] {
  const employeesById = new Map(schedule.employees.map((employee) => [employee.id, employee]))

  return schedule.shifts
    .filter(
      (shift) =>
        shift.shiftDate.getFullYear() === monthDate.getFullYear() &&
        shift.shiftDate.getMonth() === monthDate.getMonth()
    )
    .sort((left, right) => {
      const dayDiff = left.shiftDate.getTime() - right.shiftDate.getTime()
      if (dayDiff !== 0) {
        return dayDiff
      }
      if (left.startTime !== right.startTime) {
        return left.startTime.localeCompare(right.startTime)
      }
      if (left.endTime !== right.endTime) {
        return left.endTime.localeCompare(right.endTime)
      }
      return employeeName(employeesById.get(left.employeeId)).localeCompare(
        employeeName(employeesById.get(right.employeeId)),
        undefined,
        { sensitivity: "base" }
      )
    })
    .map((shift) => ({
      employeeId: shift.employeeId,
      employeeName: employeeName(employeesById.get(shift.employeeId)),
      shiftDate: shift.shiftDate,
      startTime: shift.startTime,
      endTime: shift.endTime,
      durationHours: Math.max(shiftDurationHours(shift), 0),
      notes: "",
    }))
}

function monthDays(monthDate: Date): Date[] {
  const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate()
  return Array.from({ length: lastDay }, (_, index) => {
    return new Date(monthDate.getFullYear(), monthDate.getMonth(), index + 1)
  })
}

function formatShiftCell(row: ShiftExportRow): string {
  return `${row.startTime}\u2013${row.endTime}`
}

function createShiftsDataSheet(rows: ShiftExportRow[], monthDate: Date): XLSX.WorkSheet {
  const titleRow = [`Shifts Data - ${formatMonthLabel(monthDate)}`]
  const subtitleRow = ["Source of truth for shift assignments"]
  const spacerRow: string[] = []
  const headerRow = ["Employee", "Date", "StartTime", "EndTime", "Duration", "Notes"]

  const bodyRows = rows.map((row) => [
    row.employeeName,
    toDateInputValue(row.shiftDate),
    row.startTime,
    row.endTime,
    Number(row.durationHours.toFixed(2)),
    row.notes,
  ])

  const worksheet = XLSX.utils.aoa_to_sheet([
    titleRow,
    subtitleRow,
    spacerRow,
    headerRow,
    ...bodyRows,
  ])

  worksheet["!cols"] = [
    { wch: 26 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 24 },
  ]

  return worksheet
}

function createMonthlyViewSheet(
  schedule: Schedule,
  monthDate: Date,
  rows: ShiftExportRow[]
): XLSX.WorkSheet {
  const days = monthDays(monthDate)
  const headers = ["Employee", ...days.map((day) => day.getDate().toString())]

  const shiftsByEmployeeDay = new Map<string, ShiftExportRow[]>()
  for (const row of rows) {
    const key = `${row.employeeId}:${toDateInputValue(row.shiftDate)}`
    const existing = shiftsByEmployeeDay.get(key)
    if (existing) {
      existing.push(row)
    } else {
      shiftsByEmployeeDay.set(key, [row])
    }
  }

  const employeeRows = schedule.employees.map((employee) => {
    const employeeLabel = `${employee.firstName} ${employee.lastName}`.trim()
    const cells = days.map((day) => {
      const key = `${employee.id}:${toDateInputValue(day)}`
      const shifts = shiftsByEmployeeDay.get(key) ?? []
      return shifts.map(formatShiftCell).join("\n")
    })
    return [employeeLabel, ...cells]
  })

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...employeeRows])
  worksheet["!cols"] = [{ wch: 26 }, ...days.map(() => ({ wch: 12 }))]
  return worksheet
}

function createSummarySheet(
  schedule: Schedule,
  rows: ShiftExportRow[]
): XLSX.WorkSheet {
  const totalsByEmployee = new Map<string, number>()
  const workingDaysByEmployee = new Map<string, Set<string>>()

  for (const row of rows) {
    totalsByEmployee.set(
      row.employeeId,
      (totalsByEmployee.get(row.employeeId) ?? 0) + row.durationHours
    )

    const dayKey = toDateInputValue(row.shiftDate)
    const days = workingDaysByEmployee.get(row.employeeId)
    if (days) {
      days.add(dayKey)
    } else {
      workingDaysByEmployee.set(row.employeeId, new Set([dayKey]))
    }
  }

  const headerRow = ["Employee", "Total Hours", "Working Days"]
  const bodyRows = schedule.employees.map((employee) => {
    const name = `${employee.firstName} ${employee.lastName}`.trim()
    return [
      name,
      Number((totalsByEmployee.get(employee.id) ?? 0).toFixed(2)),
      (workingDaysByEmployee.get(employee.id) ?? new Set()).size,
    ]
  })

  const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...bodyRows])
  worksheet["!cols"] = [{ wch: 26 }, { wch: 14 }, { wch: 14 }]
  return worksheet
}

export function createScheduleWorkbook(
  schedule: Schedule,
  monthDate: Date
): Uint8Array<ArrayBuffer> {
  const workbook = XLSX.utils.book_new()
  const rows = buildExportRows(schedule, monthDate)

  XLSX.utils.book_append_sheet(
    workbook,
    createShiftsDataSheet(rows, monthDate),
    "Shifts_Data"
  )
  XLSX.utils.book_append_sheet(
    workbook,
    createMonthlyViewSheet(schedule, monthDate, rows),
    "Monthly_View"
  )
  XLSX.utils.book_append_sheet(
    workbook,
    createSummarySheet(schedule, rows),
    "Summary"
  )

  return XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
    compression: true,
  }) as Uint8Array<ArrayBuffer>
}

export function defaultExportFilename(monthDate: Date): string {
  return `workshift_${monthDate.getFullYear()}-${(monthDate.getMonth() + 1)
    .toString()
    .padStart(2, "0")}.xlsx`
}
