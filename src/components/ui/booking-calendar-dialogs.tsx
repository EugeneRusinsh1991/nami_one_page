"use client";

import * as React from "react";
import { Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import {
  HOURS,
  MAX_SLOTS,
  pad,
  toDateKey,
  type SelectedSlot,
  type SubmittedBookingData,
} from "./booking-calendar-utils";

export interface DayTimeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeDate: Date;
  selectedSlots: SelectedSlot[];
  errorMessage: string | null;
  formatSlotDate: (d: Date) => string;
  onToggleSlot: (hour: number) => void;
  selectTimeTitle: string;
}

export function DayTimeModal({
  open,
  onOpenChange,
  activeDate,
  selectedSlots,
  errorMessage,
  formatSlotDate,
  onToggleSlot,
  selectTimeTitle,
}: DayTimeModalProps) {
  const dateKey = toDateKey(activeDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs sm:max-w-sm rounded-3xl border border-white/70 bg-white/95 p-5 sm:p-6 backdrop-blur-2xl text-brand-text">
        <DialogHeader>
          <DialogTitle className="font-heading text-base sm:text-lg font-semibold text-brand-text">
            {formatSlotDate(activeDate)}
          </DialogTitle>
          <DialogDescription className="text-xs text-brand-text/60">
            {selectTimeTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 my-2">
          {HOURS.map((hour) => {
            const isSelected = selectedSlots.some((s) => s.dateStr === dateKey && s.hour === hour);
            const isMax = selectedSlots.length >= MAX_SLOTS;
            const disabled = !isSelected && isMax;

            return (
              <button
                key={hour}
                type="button"
                disabled={disabled}
                onClick={() => onToggleSlot(hour)}
                className={cn(
                  "flex h-11 items-center justify-center gap-1 rounded-xl border text-sm font-medium transition-all duration-150",
                  isSelected
                    ? "border-brand-text bg-brand-text text-white shadow-sm"
                    : disabled
                    ? "cursor-not-allowed border-transparent bg-brand-text/5 text-brand-text/30"
                    : "border-brand-border/40 bg-white/80 text-brand-text hover:border-brand-text/50 hover:bg-white active:scale-95"
                )}
              >
                <Clock className="hidden sm:block h-3.5 w-3.5 opacity-70" />
                <span>{pad(hour)}:00</span>
              </button>
            );
          })}
        </div>

        <div className="flex h-4 items-center gap-1.5 px-1 text-xs text-red-600">
          {errorMessage && (
            <>
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{errorMessage}</span>
            </>
          )}
        </div>

        <Button
          type="button"
          variant="brand-primary"
          size="default"
          className="w-full mt-2"
          onClick={() => onOpenChange(false)}
        >
          OK
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export interface BookingSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submittedData: SubmittedBookingData | null;
  cal: {
    modalTitle: string;
    modalDescription: string;
    modalClose: string;
    nameLabel: string;
    phoneLabel: string;
    selectedSlotsTitle: string;
  };
}

export function BookingSuccessDialog({
  open,
  onOpenChange,
  submittedData,
  cal,
}: BookingSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border border-white/70 bg-white/95 p-6 backdrop-blur-2xl text-brand-text sm:rounded-3xl">
        <DialogHeader className="items-center text-center">
          <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <DialogTitle className="font-heading text-xl sm:text-2xl font-semibold">
            {cal.modalTitle}
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-brand-text/70">
            {cal.modalDescription}
          </DialogDescription>
        </DialogHeader>

        {submittedData && (
          <div className="my-3 rounded-2xl border border-brand-border/30 bg-brand-surface/60 p-3.5 text-xs sm:text-sm">
            <div className="mb-2 flex justify-between font-medium">
              <span className="text-brand-text/60">{cal.nameLabel}:</span>
              <span className="font-semibold">{submittedData.name}</span>
            </div>
            <div className="mb-2 flex justify-between font-medium">
              <span className="text-brand-text/60">{cal.phoneLabel}:</span>
              <span className="font-semibold">{submittedData.phone}</span>
            </div>
            {submittedData.slots.length > 0 && (
              <div className="pt-2 border-t border-brand-border/20">
                <span className="text-brand-text/60 block mb-1.5">{cal.selectedSlotsTitle}:</span>
                <div className="flex flex-col gap-1">
                  {submittedData.slots.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2 font-medium">
                      <Clock className="h-3.5 w-3.5 text-brand-text/60" />
                      <span>{s.formattedDate} · {s.formattedTime}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-2 flex justify-center">
          <DialogClose asChild>
            <Button variant="brand-primary" size="default" className="w-full">
              {cal.modalClose}
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
