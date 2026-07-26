"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";
import type { Employee } from "@/lib/workshift";

import { COLOR_SWATCHES } from "./form-drafts";
import type { AvailableUpdateState } from "./use-tauri-updater";
import type {
  ConfirmState,
  EmployeeDialogState,
  EmployeeDraft,
  NoticeState,
  ShiftDialogState,
  ShiftDraft,
} from "./workshift-ui-types";

interface EmployeeDialogProps {
  dialog: EmployeeDialogState;
  draft: EmployeeDraft;
  lunchBreakOptions: string[];
  onOpenChange: (open: boolean) => void;
  onDraftChange: (updates: Partial<EmployeeDraft>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function EmployeeDialog({
  dialog,
  draft,
  lunchBreakOptions,
  onOpenChange,
  onDraftChange,
  onSubmit,
  onCancel,
}: EmployeeDialogProps) {
  return (
    <Dialog open={dialog.open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {dialog.open && dialog.mode === "edit"
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
                value={draft.firstName}
                onChange={(event) => {
                  onDraftChange({ firstName: event.target.value });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee-last-name">Last name</Label>
              <Input
                id="employee-last-name"
                value={draft.lastName}
                onChange={(event) => {
                  onDraftChange({ lastName: event.target.value });
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
                value={draft.monthlyTargetHours}
                onChange={(event) => {
                  onDraftChange({ monthlyTargetHours: event.target.value });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee-lunch-break">Lunch break (hours)</Label>
              <Select
                value={draft.lunchBreakHours}
                onValueChange={(value) => {
                  onDraftChange({ lunchBreakHours: value ?? "0" });
                }}
              >
                <SelectTrigger id="employee-lunch-break" className="w-full">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {lunchBreakOptions.map((value) => (
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
                    "h-8 cursor-pointer rounded-md border transition-colors",
                    draft.colorHex.toLowerCase() === color
                      ? "ring-2 ring-ring"
                      : "hover:border-foreground/40",
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    onDraftChange({ colorHex: color });
                  }}
                />
              ))}
            </div>
            <div className="grid grid-cols-[auto_1fr] items-center gap-2">
              <Input
                type="color"
                value={draft.colorHex}
                className="h-9 w-14 p-1"
                onChange={(event) => {
                  onDraftChange({ colorHex: event.target.value });
                }}
              />
              <Input
                id="employee-color-hex"
                value={draft.colorHex}
                onChange={(event) => {
                  onDraftChange({ colorHex: event.target.value });
                }}
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Lunch break is deducted from shifts when enabled.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ShiftDialogProps {
  dialog: ShiftDialogState;
  draft: ShiftDraft;
  selectedDayLabel: string;
  employees: Employee[];
  employeeNameById: Map<string, string>;
  onOpenChange: (open: boolean) => void;
  onDraftChange: (updates: Partial<ShiftDraft>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function ShiftDialog({
  dialog,
  draft,
  selectedDayLabel,
  employees,
  employeeNameById,
  onOpenChange,
  onDraftChange,
  onSubmit,
  onCancel,
}: ShiftDialogProps) {
  return (
    <Dialog open={dialog.open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {dialog.open && dialog.mode === "edit"
              ? "Edit shift"
              : "Add shift"}
          </DialogTitle>
          <DialogDescription>
            Selected day: {selectedDayLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Employee</Label>
            <Select
              value={draft.employeeId}
              onValueChange={(value) => {
                onDraftChange({ employeeId: value ?? "" });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an employee">
                  {(value) => {
                    if (!value) {
                      return "Select an employee";
                    }
                    return (
                      employeeNameById.get(String(value)) ?? "Unknown employee"
                    );
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Available employees</SelectLabel>
                  {employees.map((employee) => (
                    <SelectItem
                      key={employee.id}
                      value={employee.id}
                      label={employeeNameById.get(employee.id)}
                    >
                      {employeeNameById.get(employee.id)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Start time</Label>
              <TimePicker
                value={draft.startTime}
                onValueChange={(nextTime) => {
                  onDraftChange({ startTime: nextTime });
                }}
                quickTimes={[
                  "06:00",
                  "07:00",
                  "08:00",
                  "09:00",
                  "10:00",
                  "12:00",
                ]}
              />
            </div>

            <div className="space-y-2">
              <Label>End time</Label>
              <TimePicker
                value={draft.endTime}
                onValueChange={(nextTime) => {
                  onDraftChange({ endTime: nextTime });
                }}
                quickTimes={[
                  "12:00",
                  "14:00",
                  "16:00",
                  "18:00",
                  "20:00",
                  "22:00",
                ]}
              />
            </div>
          </div>

          <div className="rounded-md border p-3">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={draft.includesLunchBreak}
                onCheckedChange={(checked) => {
                  onDraftChange({ includesLunchBreak: checked });
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
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface UpdateDialogProps {
  availableUpdate: AvailableUpdateState | null;
  isInstallingUpdate: boolean;
  updateProgressLabel: string;
  onDismiss: () => void;
  onInstall: () => void | Promise<void>;
}

export function UpdateDialog({
  availableUpdate,
  isInstallingUpdate,
  updateProgressLabel,
  onDismiss,
  onInstall,
}: UpdateDialogProps) {
  return (
    <Dialog
      open={Boolean(availableUpdate)}
      onOpenChange={(open) => {
        if (!open) {
          onDismiss();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update available</DialogTitle>
          <DialogDescription className="space-y-1 whitespace-pre-wrap">
            <span>
              Version {availableUpdate?.version} is available (current{" "}
              {availableUpdate?.currentVersion}).
            </span>
            {availableUpdate?.date && (
              <span className="block">Published: {availableUpdate.date}</span>
            )}
            {availableUpdate?.notes && (
              <span className="block">{availableUpdate.notes}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {isInstallingUpdate && (
          <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {updateProgressLabel}
          </p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            disabled={isInstallingUpdate}
            onClick={onDismiss}
          >
            Later
          </Button>
          <Button disabled={isInstallingUpdate} onClick={() => void onInstall()}>
            {isInstallingUpdate ? "Installing..." : "Update now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ConfirmDialogProps {
  state: ConfirmState | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  state,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={Boolean(state)}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{state?.title}</DialogTitle>
          <DialogDescription className="whitespace-pre-wrap">
            {state?.message}
          </DialogDescription>
        </DialogHeader>

        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          This action cannot be undone.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant={state?.variant === "danger" ? "destructive" : "default"}
            onClick={onConfirm}
          >
            {state?.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface NoticeDialogProps {
  notice: NoticeState | null;
  onClose: () => void;
}

export function NoticeDialog({ notice, onClose }: NoticeDialogProps) {
  return (
    <Dialog
      open={Boolean(notice)}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{notice?.title}</DialogTitle>
          <DialogDescription className="whitespace-pre-wrap">
            {notice?.message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
