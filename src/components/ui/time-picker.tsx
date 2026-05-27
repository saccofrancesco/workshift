"use client"

import { useMemo } from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { ChevronDown, Clock3, Minus, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/
const DAY_MINUTES = 24 * 60
const HOURS = Array.from({ length: 24 }, (_, value) => value)
const DEFAULT_QUICK_TIMES = [
  "06:00",
  "08:00",
  "09:00",
  "12:00",
  "18:00",
  "22:00",
] as const

interface TimePickerProps {
  value: string
  onValueChange: (value: string) => void
  className?: string
  disabled?: boolean
  minuteStep?: number
  quickTimes?: readonly string[]
}

interface ParsedTime {
  hours: number
  minutes: number
}

function parseTime(value: string): ParsedTime | null {
  if (!TIME_PATTERN.test(value)) {
    return null
  }

  const [hours, minutes] = value.split(":").map((part) => Number.parseInt(part, 10))
  return { hours, minutes }
}

function formatTime(hours: number, minutes: number): string {
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
}

function createMinuteOptions(step: number): number[] {
  const normalizedStep = Math.trunc(step)
  if (normalizedStep <= 0 || normalizedStep > 60 || 60 % normalizedStep !== 0) {
    return [0, 30]
  }
  return Array.from({ length: 60 / normalizedStep }, (_, index) => index * normalizedStep)
}

function findClosestMinute(value: number, minuteOptions: number[]): number {
  return minuteOptions.reduce((closest, current) => {
    return Math.abs(current - value) < Math.abs(closest - value) ? current : closest
  }, minuteOptions[0] ?? 0)
}

function normalizeMinutes(totalMinutes: number): number {
  return ((totalMinutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES
}

export function TimePicker({
  value,
  onValueChange,
  className,
  disabled = false,
  minuteStep = 30,
  quickTimes = DEFAULT_QUICK_TIMES,
}: TimePickerProps) {
  const minuteOptions = useMemo(() => createMinuteOptions(minuteStep), [minuteStep])
  const parsed = parseTime(value) ?? { hours: 9, minutes: 0 }
  const snappedMinutes = findClosestMinute(parsed.minutes, minuteOptions)
  const displayTime = formatTime(parsed.hours, snappedMinutes)

  const validQuickTimes = useMemo(() => {
    return quickTimes.filter((time) => parseTime(time) !== null)
  }, [quickTimes])

  const setHour = (nextHour: number) => {
    onValueChange(formatTime(nextHour, snappedMinutes))
  }

  const setMinute = (nextMinute: number) => {
    onValueChange(formatTime(parsed.hours, nextMinute))
  }

  const shiftTimeBy = (deltaMinutes: number) => {
    const totalMinutes = parsed.hours * 60 + snappedMinutes + deltaMinutes
    const normalized = normalizeMinutes(totalMinutes)
    const nextHour = Math.floor(normalized / 60)
    const rawMinute = normalized % 60
    const nextMinute = findClosestMinute(rawMinute, minuteOptions)
    onValueChange(formatTime(nextHour, nextMinute))
  }

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger
        data-slot="time-picker-trigger"
        className={cn(
          "flex w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        disabled={disabled}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <Clock3 className="size-4 text-muted-foreground" />
          <span className="font-medium tabular-nums">{displayTime}</span>
        </span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          side="bottom"
          sideOffset={4}
          align="start"
          className="isolate z-[70]"
        >
          <PopoverPrimitive.Popup
            data-slot="time-picker-content"
            initialFocus={false}
            className="relative isolate z-[70] w-(--anchor-width) min-w-[260px] origin-(--transform-origin) rounded-xl border bg-popover p-2.5 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
          >
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => shiftTimeBy(-minuteStep)}
                >
                  <Minus />
                  {minuteStep}m
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => shiftTimeBy(minuteStep)}
                >
                  <Plus />
                  {minuteStep}m
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md border bg-background/50">
                  <p className="border-b px-2 py-1 text-xs text-muted-foreground">Hour</p>
                  <ScrollArea className="h-32">
                    <div className="space-y-1 p-1">
                      {HOURS.map((hour) => {
                        const selected = hour === parsed.hours
                        return (
                          <button
                            key={`hour-${hour}`}
                            type="button"
                            onClick={() => setHour(hour)}
                            className={cn(
                              "w-full cursor-pointer rounded-md px-2 py-1 text-center text-sm tabular-nums transition-colors",
                              selected
                                ? "bg-accent font-medium text-accent-foreground"
                                : "hover:bg-accent/70 hover:text-accent-foreground"
                            )}
                          >
                            {hour.toString().padStart(2, "0")}
                          </button>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </div>

                <div className="rounded-md border bg-background/50">
                  <p className="border-b px-2 py-1 text-xs text-muted-foreground">Minute</p>
                  <ScrollArea className="h-32">
                    <div className="space-y-1 p-1">
                      {minuteOptions.map((minute) => {
                        const selected = minute === snappedMinutes
                        return (
                          <button
                            key={`minute-${minute}`}
                            type="button"
                            onClick={() => setMinute(minute)}
                            className={cn(
                              "w-full cursor-pointer rounded-md px-2 py-1 text-center text-sm tabular-nums transition-colors",
                              selected
                                ? "bg-accent font-medium text-accent-foreground"
                                : "hover:bg-accent/70 hover:text-accent-foreground"
                            )}
                          >
                            {minute.toString().padStart(2, "0")}
                          </button>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              {validQuickTimes.length > 0 && (
                <div className="space-y-1.5">
                  <p className="px-0.5 text-xs text-muted-foreground">Quick picks</p>
                  <div className="flex flex-wrap gap-1.5">
                    {validQuickTimes.map((time) => (
                      <Button
                        key={time}
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() => onValueChange(time)}
                        className="font-normal tabular-nums"
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <PopoverPrimitive.Close
                render={<Button type="button" variant="outline" size="sm" className="w-full" />}
              >
                Done
              </PopoverPrimitive.Close>
            </div>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

