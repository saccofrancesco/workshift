import { useMemo, useReducer } from "react";

export class WorkshiftError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkshiftError";
  }
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  monthlyTargetHours: number;
  lunchBreakHours: number;
  colorHex: string;
}

export interface Shift {
  id: string;
  employeeId: string;
  shiftDate: Date;
  startTime: string;
  endTime: string;
  includesLunchBreak: boolean;
}

export interface Schedule {
  employees: Employee[];
  shifts: Shift[];
}

export interface ViewState {
  selectedMonth: Date;
  selectedDay: Date;
}

export interface SessionState {
  schedule: Schedule;
  viewState: ViewState;
}

export interface EmployeeListItemVM {
  id: string;
  fullName: string;
  colorHex: string;
  monthlyTargetHours: number;
  lunchBreakHours: number;
}

export interface ShiftRowVM {
  id: string;
  employeeId: string;
  employeeName: string;
  colorHex: string;
  startTime: string;
  endTime: string;
  durationHours: number;
}

export interface CalendarDayVM {
  date: Date;
  inCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  dayNumber: number;
  employeeColors: string[];
  overflowCount: number;
  tooltip: string;
}

export interface EmployeeWorkloadVM {
  id: string;
  fullName: string;
  colorHex: string;
  assignedHours: number;
  targetHours: number;
  remainingHours: number;
  progressRatio: number;
}

export interface EmployeeFormValues {
  firstName: string;
  lastName: string;
  monthlyTargetHours: number;
  colorHex: string;
  lunchBreakHours: number;
}

export interface ShiftFormValues {
  employeeId: string;
  shiftDate: Date;
  startTime: string;
  endTime: string;
  includesLunchBreak: boolean;
}

export interface WorkshiftViewModel {
  state: SessionState;
  canUndo: boolean;
  canRedo: boolean;
  monthLabel: string;
  employeeRows: EmployeeListItemVM[];
  calendarGrid: CalendarDayVM[][];
  dailyShiftRows: ShiftRowVM[];
  workloadRows: EmployeeWorkloadVM[];
  countEmployeeShifts: (employeeId: string) => number;
  getEmployee: (employeeId: string) => Employee;
  getShift: (shiftId: string) => Shift;
  setSelectedDay: (selectedDay: Date) => void;
  moveMonth: (delta: number) => void;
  goToday: () => void;
  addEmployee: (values: EmployeeFormValues) => void;
  editEmployee: (employeeId: string, values: EmployeeFormValues) => void;
  deleteEmployee: (employeeId: string) => number;
  addShift: (values: ShiftFormValues) => void;
  editShift: (shiftId: string, values: ShiftFormValues) => void;
  deleteShift: (shiftId: string) => void;
  undo: () => void;
  redo: () => void;
}

const WEEKDAY_SHORT = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;
const WEEKDAY_LONG = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
const DEFAULT_COLOR = "#2563eb";
const UNKNOWN_COLOR = "#94a3b8";
const HISTORY_LIMIT = 100;

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function nowDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function weekdayMondayIndex(value: Date): number {
  return (value.getDay() + 6) % 7;
}

function employeeFullName(employee: Employee): string {
  return `${employee.firstName} ${employee.lastName}`.trim();
}

function cloneSchedule(schedule: Schedule): Schedule {
  return {
    employees: schedule.employees.map((employee) => ({ ...employee })),
    shifts: schedule.shifts.map((shift) => ({
      ...shift,
      shiftDate: new Date(shift.shiftDate),
    })),
  };
}

function cloneSessionState(state: SessionState): SessionState {
  return {
    schedule: cloneSchedule(state.schedule),
    viewState: {
      selectedDay: new Date(state.viewState.selectedDay),
      selectedMonth: new Date(state.viewState.selectedMonth),
    },
  };
}

function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
}

function normalizeColorHex(colorHex: string): string {
  let value = colorHex.trim();
  if (!value.startsWith("#")) {
    value = `#${value}`;
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
    throw new WorkshiftError("Color must be a hex value like #2563eb.");
  }
  return value.toLowerCase();
}

function parseTimeToMinutes(value: string): number {
  if (!TIME_PATTERN.test(value)) {
    throw new WorkshiftError("Time must be in HH:mm format.");
  }
  const [hours, minutes] = value
    .split(":")
    .map((part) => Number.parseInt(part, 10));
  return hours * 60 + minutes;
}

function validateEmployeeFields(
  values: EmployeeFormValues,
): EmployeeFormValues {
  const firstName = values.firstName.trim();
  const lastName = values.lastName.trim();
  if (!firstName) {
    throw new WorkshiftError("First name is required.");
  }
  if (!lastName) {
    throw new WorkshiftError("Last name is required.");
  }
  if (values.monthlyTargetHours < 0) {
    throw new WorkshiftError("Monthly target hours cannot be negative.");
  }
  if (values.lunchBreakHours < 0) {
    throw new WorkshiftError("Lunch break hours cannot be negative.");
  }

  return {
    ...values,
    firstName,
    lastName,
    colorHex: normalizeColorHex(values.colorHex || DEFAULT_COLOR),
  };
}

function requireEmployee(schedule: Schedule, employeeId: string): Employee {
  const employee = schedule.employees.find((item) => item.id === employeeId);
  if (!employee) {
    throw new WorkshiftError("Selected employee no longer exists.");
  }
  return employee;
}

function requireShift(schedule: Schedule, shiftId: string): Shift {
  const shift = schedule.shifts.find((item) => item.id === shiftId);
  if (!shift) {
    throw new WorkshiftError("Selected shift no longer exists.");
  }
  return shift;
}

function validateShiftFields(
  schedule: Schedule,
  values: ShiftFormValues,
  shiftId?: string,
): ShiftFormValues {
  requireEmployee(schedule, values.employeeId);
  const shiftDate = startOfDay(values.shiftDate);
  const startMinutes = parseTimeToMinutes(values.startTime);
  const endMinutes = parseTimeToMinutes(values.endTime);

  if (endMinutes <= startMinutes) {
    throw new WorkshiftError("Shift end time must be after start time.");
  }

  for (const shift of schedule.shifts) {
    if (shift.id === shiftId) {
      continue;
    }
    if (shift.employeeId !== values.employeeId) {
      continue;
    }
    if (!isSameDay(shift.shiftDate, shiftDate)) {
      continue;
    }

    const existingStart = parseTimeToMinutes(shift.startTime);
    const existingEnd = parseTimeToMinutes(shift.endTime);
    const overlaps = startMinutes < existingEnd && existingStart < endMinutes;
    if (overlaps) {
      throw new WorkshiftError(
        "This shift overlaps another shift for the same employee.",
      );
    }
  }

  return {
    ...values,
    shiftDate,
    startTime: formatTimeValue(values.startTime),
    endTime: formatTimeValue(values.endTime),
  };
}

function formatTimeValue(value: string): string {
  const total = parseTimeToMinutes(value);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

export function formatMonthLabel(value: Date): string {
  return value.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function toDateInputValue(value: Date): string {
  const year = value.getFullYear();
  const month = (value.getMonth() + 1).toString().padStart(2, "0");
  const day = value.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateInputValue(value: string): Date {
  const parts = value.split("-").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    throw new WorkshiftError("Date must be in YYYY-MM-DD format.");
  }
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
}

export function formatDateLabel(value: Date): string {
  return `${value.getDate()} ${value.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })}`;
}

export function formatFullDateLabel(value: Date): string {
  return `${WEEKDAY_LONG[weekdayMondayIndex(value)]}, ${value.getDate()} ${value.toLocaleDateString(
    "en-US",
    {
      month: "short",
      year: "numeric",
    },
  )}`;
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTimeValue(startTime)} - ${formatTimeValue(endTime)}`;
}

export function formatHours(value: number, decimals = 2): string {
  let text = value
    .toFixed(decimals)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*?)0+$/, "$1");
  if (text === "-0") {
    text = "0";
  }
  return `${text} h`;
}

export function weekdayAbbrev(index: number): string {
  return WEEKDAY_SHORT[index] ?? "";
}

export function addMonths(value: Date, delta: number): Date {
  const monthIndex = value.getMonth() + delta;
  const year = value.getFullYear() + Math.floor(monthIndex / 12);
  const month = ((monthIndex % 12) + 12) % 12;
  const day = value.getDate();
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, lastDay));
}

function shiftDurationHours(shift: Shift): number {
  const start = parseTimeToMinutes(shift.startTime);
  const end = parseTimeToMinutes(shift.endTime);
  return (end - start) / 60;
}

function shiftWorkHours(shift: Shift, lunchBreakHours = 0): number {
  let duration = shiftDurationHours(shift);
  if (shift.includesLunchBreak) {
    duration -= Math.max(lunchBreakHours, 0);
  }
  return Math.max(duration, 0);
}

export function employeeDisplayRows(schedule: Schedule): EmployeeListItemVM[] {
  return schedule.employees.map((employee) => ({
    id: employee.id,
    fullName: employeeFullName(employee),
    colorHex: employee.colorHex,
    monthlyTargetHours: employee.monthlyTargetHours,
    lunchBreakHours: employee.lunchBreakHours,
  }));
}

export function buildDailyShiftRows(
  schedule: Schedule,
  selectedDay: Date,
): ShiftRowVM[] {
  const employeesById = new Map(
    schedule.employees.map((employee) => [employee.id, employee]),
  );

  const rows = schedule.shifts
    .filter((shift) => isSameDay(shift.shiftDate, selectedDay))
    .map((shift) => {
      const employee = employeesById.get(shift.employeeId);
      return {
        id: shift.id,
        employeeId: shift.employeeId,
        employeeName: employee
          ? employeeFullName(employee)
          : "Unknown employee",
        colorHex: employee?.colorHex ?? UNKNOWN_COLOR,
        startTime: formatTimeValue(shift.startTime),
        endTime: formatTimeValue(shift.endTime),
        durationHours: shiftWorkHours(shift, employee?.lunchBreakHours ?? 0),
      };
    });

  return rows.sort((left, right) => {
    const timeDiff =
      parseTimeToMinutes(left.startTime) - parseTimeToMinutes(right.startTime);
    if (timeDiff !== 0) {
      return timeDiff;
    }
    return left.employeeName.localeCompare(right.employeeName, undefined, {
      sensitivity: "base",
    });
  });
}

function assignedHoursForEmployee(
  schedule: Schedule,
  employeeId: string,
  monthDate: Date,
): number {
  const employee = schedule.employees.find((item) => item.id === employeeId);

  return schedule.shifts
    .filter(
      (shift) =>
        shift.employeeId === employeeId &&
        shift.shiftDate.getFullYear() === monthDate.getFullYear() &&
        shift.shiftDate.getMonth() === monthDate.getMonth(),
    )
    .reduce(
      (total, shift) =>
        total + shiftWorkHours(shift, employee?.lunchBreakHours ?? 0),
      0,
    );
}

export function buildEmployeeWorkloads(
  schedule: Schedule,
  monthDate: Date,
): EmployeeWorkloadVM[] {
  return schedule.employees.map((employee) => {
    const assigned = assignedHoursForEmployee(schedule, employee.id, monthDate);
    const target = Math.max(employee.monthlyTargetHours, 0);
    const remaining = target - assigned;
    const progress =
      target <= 0
        ? assigned > 0
          ? 1
          : 0
        : Math.max(0, Math.min(assigned / target, 1));

    return {
      id: employee.id,
      fullName: employeeFullName(employee),
      colorHex: employee.colorHex,
      assignedHours: assigned,
      targetHours: target,
      remainingHours: remaining,
      progressRatio: progress,
    };
  });
}

function buildDayTooltip(schedule: Schedule, day: Date): string {
  const employeesById = new Map(
    schedule.employees.map((employee) => [employee.id, employee]),
  );

  const shifts = schedule.shifts
    .filter((shift) => isSameDay(shift.shiftDate, day))
    .sort((left, right) => {
      const timeDiff =
        parseTimeToMinutes(left.startTime) -
        parseTimeToMinutes(right.startTime);
      if (timeDiff !== 0) {
        return timeDiff;
      }

      const leftName = employeesById.get(left.employeeId);
      const rightName = employeesById.get(right.employeeId);
      const leftText = leftName
        ? employeeFullName(leftName)
        : "Unknown employee";
      const rightText = rightName
        ? employeeFullName(rightName)
        : "Unknown employee";
      return leftText.localeCompare(rightText, undefined, {
        sensitivity: "base",
      });
    });

  if (shifts.length === 0) {
    return `${formatFullDateLabel(day)}\nNo shifts planned.`;
  }

  const lines = [formatFullDateLabel(day)];
  for (const shift of shifts) {
    const employee = employeesById.get(shift.employeeId);
    const name = employee ? employeeFullName(employee) : "Unknown employee";
    lines.push(`${formatTimeRange(shift.startTime, shift.endTime)}  ${name}`);
  }
  return lines.join("\n");
}

export function buildCalendarGrid(
  schedule: Schedule,
  selectedMonth: Date,
  selectedDay: Date,
  today: Date = nowDate(),
): CalendarDayVM[][] {
  const firstDay = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth(),
    1,
  );
  const startOffset = weekdayMondayIndex(firstDay);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - startOffset);

  const employeesById = new Map(
    schedule.employees.map((employee) => [employee.id, employee]),
  );
  const cells: CalendarDayVM[] = [];

  for (let index = 0; index < 42; index += 1) {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);

    const dayShifts = schedule.shifts.filter((shift) =>
      isSameDay(shift.shiftDate, day),
    );
    const uniqueEmployeeIds: string[] = [];

    for (const shift of dayShifts.sort((left, right) => {
      const leftEmployee = employeesById.get(left.employeeId);
      const rightEmployee = employeesById.get(right.employeeId);
      const leftName = leftEmployee
        ? employeeFullName(leftEmployee)
        : "Unknown";
      const rightName = rightEmployee
        ? employeeFullName(rightEmployee)
        : "Unknown";
      return leftName.localeCompare(rightName, undefined, {
        sensitivity: "base",
      });
    })) {
      if (!uniqueEmployeeIds.includes(shift.employeeId)) {
        uniqueEmployeeIds.push(shift.employeeId);
      }
    }

    const employeeColors = uniqueEmployeeIds
      .slice(0, 3)
      .map((employeeId) => employeesById.get(employeeId)?.colorHex)
      .filter((color): color is string => Boolean(color));

    cells.push({
      date: day,
      inCurrentMonth:
        day.getFullYear() === firstDay.getFullYear() &&
        day.getMonth() === firstDay.getMonth(),
      isToday: isSameDay(day, today),
      isSelected: isSameDay(day, selectedDay),
      dayNumber: day.getDate(),
      employeeColors,
      overflowCount: Math.max(uniqueEmployeeIds.length - 3, 0),
      tooltip: buildDayTooltip(schedule, day),
    });
  }

  const rows: CalendarDayVM[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    rows.push(cells.slice(index, index + 7));
  }
  return rows;
}

type StateAction =
  | { type: "set-selected-day"; selectedDay: Date }
  | { type: "move-month"; delta: number }
  | { type: "go-today" }
  | { type: "add-employee"; values: EmployeeFormValues }
  | { type: "edit-employee"; employeeId: string; values: EmployeeFormValues }
  | { type: "delete-employee"; employeeId: string }
  | { type: "add-shift"; values: ShiftFormValues }
  | { type: "edit-shift"; shiftId: string; values: ShiftFormValues }
  | { type: "delete-shift"; shiftId: string };

type Action = StateAction | { type: "undo" } | { type: "redo" };

interface HistoryState {
  past: SessionState[];
  present: SessionState;
  future: SessionState[];
}

function reducer(state: SessionState, action: StateAction): SessionState {
  switch (action.type) {
    case "set-selected-day": {
      const selectedDay = startOfDay(action.selectedDay);
      return {
        ...state,
        viewState: {
          selectedDay,
          selectedMonth: new Date(
            selectedDay.getFullYear(),
            selectedDay.getMonth(),
            1,
          ),
        },
      };
    }

    case "move-month": {
      const nextDay = addMonths(state.viewState.selectedDay, action.delta);
      return {
        ...state,
        viewState: {
          selectedDay: nextDay,
          selectedMonth: new Date(nextDay.getFullYear(), nextDay.getMonth(), 1),
        },
      };
    }

    case "go-today": {
      const today = nowDate();
      return {
        ...state,
        viewState: {
          selectedDay: today,
          selectedMonth: new Date(today.getFullYear(), today.getMonth(), 1),
        },
      };
    }

    case "add-employee": {
      const schedule = cloneSchedule(state.schedule);
      const values = validateEmployeeFields(action.values);
      schedule.employees.push({
        id: createId(),
        firstName: values.firstName,
        lastName: values.lastName,
        monthlyTargetHours: values.monthlyTargetHours,
        lunchBreakHours: values.lunchBreakHours,
        colorHex: values.colorHex,
      });
      return { ...state, schedule };
    }

    case "edit-employee": {
      const schedule = cloneSchedule(state.schedule);
      const values = validateEmployeeFields(action.values);
      const employee = requireEmployee(schedule, action.employeeId);
      employee.firstName = values.firstName;
      employee.lastName = values.lastName;
      employee.monthlyTargetHours = values.monthlyTargetHours;
      employee.lunchBreakHours = values.lunchBreakHours;
      employee.colorHex = values.colorHex;
      return { ...state, schedule };
    }

    case "delete-employee": {
      const schedule = cloneSchedule(state.schedule);
      requireEmployee(schedule, action.employeeId);
      schedule.employees = schedule.employees.filter(
        (item) => item.id !== action.employeeId,
      );
      schedule.shifts = schedule.shifts.filter(
        (shift) => shift.employeeId !== action.employeeId,
      );
      return { ...state, schedule };
    }

    case "add-shift": {
      const schedule = cloneSchedule(state.schedule);
      const values = validateShiftFields(schedule, action.values);
      schedule.shifts.push({
        id: createId(),
        employeeId: values.employeeId,
        shiftDate: values.shiftDate,
        startTime: values.startTime,
        endTime: values.endTime,
        includesLunchBreak: values.includesLunchBreak,
      });
      return { ...state, schedule };
    }

    case "edit-shift": {
      const schedule = cloneSchedule(state.schedule);
      const values = validateShiftFields(
        schedule,
        action.values,
        action.shiftId,
      );
      const shift = requireShift(schedule, action.shiftId);
      shift.employeeId = values.employeeId;
      shift.shiftDate = values.shiftDate;
      shift.startTime = values.startTime;
      shift.endTime = values.endTime;
      shift.includesLunchBreak = values.includesLunchBreak;
      return { ...state, schedule };
    }

    case "delete-shift": {
      const schedule = cloneSchedule(state.schedule);
      requireShift(schedule, action.shiftId);
      schedule.shifts = schedule.shifts.filter(
        (shift) => shift.id !== action.shiftId,
      );
      return { ...state, schedule };
    }

    default: {
      return state;
    }
  }
}

function isHistoryTrackedAction(action: StateAction): boolean {
  return (
    action.type === "add-employee" ||
    action.type === "edit-employee" ||
    action.type === "delete-employee" ||
    action.type === "add-shift" ||
    action.type === "edit-shift" ||
    action.type === "delete-shift"
  );
}

function trimPast(past: SessionState[]): SessionState[] {
  if (past.length <= HISTORY_LIMIT) {
    return past;
  }
  return past.slice(past.length - HISTORY_LIMIT);
}

function historyReducer(state: HistoryState, action: Action): HistoryState {
  switch (action.type) {
    case "undo": {
      if (state.past.length === 0) {
        return state;
      }
      const previous = state.past[state.past.length - 1];
      if (!previous) {
        return state;
      }
      return {
        past: state.past.slice(0, -1),
        present: cloneSessionState(previous),
        future: [cloneSessionState(state.present), ...state.future],
      };
    }

    case "redo": {
      if (state.future.length === 0) {
        return state;
      }
      const [next, ...future] = state.future;
      if (!next) {
        return state;
      }
      return {
        past: trimPast([...state.past, cloneSessionState(state.present)]),
        present: cloneSessionState(next),
        future,
      };
    }

    default: {
      const nextPresent = reducer(state.present, action);
      if (!isHistoryTrackedAction(action)) {
        return {
          ...state,
          present: nextPresent,
          future: [],
        };
      }
      return {
        past: trimPast([...state.past, cloneSessionState(state.present)]),
        present: nextPresent,
        future: [],
      };
    }
  }
}

export function createDefaultSessionState(
  today: Date = nowDate(),
): SessionState {
  const selectedDay = startOfDay(today);
  return {
    schedule: {
      employees: [],
      shifts: [],
    },
    viewState: {
      selectedDay,
      selectedMonth: new Date(
        selectedDay.getFullYear(),
        selectedDay.getMonth(),
        1,
      ),
    },
  };
}

export function useWorkshift(
  initialState: SessionState = createDefaultSessionState(),
): WorkshiftViewModel {
  const [historyState, dispatch] = useReducer(
    historyReducer,
    initialState,
    (seed): HistoryState => ({
      past: [],
      present: cloneSessionState(seed),
      future: [],
    }),
  );
  const state = historyState.present;

  const derived = useMemo(() => {
    const employeeRows = employeeDisplayRows(state.schedule);
    return {
      monthLabel: formatMonthLabel(state.viewState.selectedMonth),
      employeeRows,
      calendarGrid: buildCalendarGrid(
        state.schedule,
        state.viewState.selectedMonth,
        state.viewState.selectedDay,
      ),
      dailyShiftRows: buildDailyShiftRows(
        state.schedule,
        state.viewState.selectedDay,
      ),
      workloadRows: buildEmployeeWorkloads(
        state.schedule,
        state.viewState.selectedMonth,
      ),
    };
  }, [state]);

  return {
    state,
    canUndo: historyState.past.length > 0,
    canRedo: historyState.future.length > 0,
    ...derived,
    countEmployeeShifts: (employeeId: string) =>
      state.schedule.shifts.filter((shift) => shift.employeeId === employeeId)
        .length,
    getEmployee: (employeeId: string) =>
      requireEmployee(state.schedule, employeeId),
    getShift: (shiftId: string) => requireShift(state.schedule, shiftId),
    setSelectedDay: (selectedDay: Date) =>
      dispatch({ type: "set-selected-day", selectedDay }),
    moveMonth: (delta: number) => dispatch({ type: "move-month", delta }),
    goToday: () => dispatch({ type: "go-today" }),
    addEmployee: (values: EmployeeFormValues) => {
      dispatch({ type: "add-employee", values });
    },
    editEmployee: (employeeId: string, values: EmployeeFormValues) => {
      dispatch({ type: "edit-employee", employeeId, values });
    },
    deleteEmployee: (employeeId: string) => {
      const removed = state.schedule.shifts.filter(
        (shift) => shift.employeeId === employeeId,
      ).length;
      dispatch({ type: "delete-employee", employeeId });
      return removed;
    },
    addShift: (values: ShiftFormValues) => {
      dispatch({ type: "add-shift", values });
    },
    editShift: (shiftId: string, values: ShiftFormValues) => {
      dispatch({ type: "edit-shift", shiftId, values });
    },
    deleteShift: (shiftId: string) => {
      dispatch({ type: "delete-shift", shiftId });
    },
    undo: () => {
      dispatch({ type: "undo" });
    },
    redo: () => {
      dispatch({ type: "redo" });
    },
  };
}
