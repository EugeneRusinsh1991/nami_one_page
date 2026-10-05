"use client";

import * as React from "react";
import { Clock, X, AlertCircle, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CHANGE_TIME_LABELS,
  GO_TO_CALENDAR_LABELS,
  type SelectedSlot,
} from "./booking-calendar-utils";

export interface BookingCalendarFormProps {
  clientName: string;
  clientPhone: string;
  selectedSlots: SelectedSlot[];
  errorMessage: string | null;
  isSubmitting: boolean;
  locale: string;
  cal: {
    nameLabel: string;
    phoneLabel: string;
    selectedSlotsTitle: string;
    clearAll: string;
    submittingButton: string;
    submitButton: string;
  };
  onNameChange: (val: string) => void;
  onPhoneChange: (val: string) => void;
  onClearAllSlots: () => void;
  onRemoveSlot: (dateStr: string, hour: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onOpenCalendar: () => void;
}

export function BookingCalendarForm({
  clientName,
  clientPhone,
  selectedSlots,
  errorMessage,
  isSubmitting,
  locale,
  cal,
  onNameChange,
  onPhoneChange,
  onClearAllSlots,
  onRemoveSlot,
  onSubmit,
  onOpenCalendar,
}: BookingCalendarFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex h-full flex-col justify-between">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2.5">
          <Input
            className="h-11 text-base sm:text-sm"
            variant="pill"
            size="default"
            placeholder={cal.nameLabel}
            value={clientName}
            onChange={(e) => onNameChange(e.target.value)}
            autoComplete="name"
          />
          <Input
            className="h-11 text-base sm:text-sm"
            variant="pill"
            size="default"
            type="text"
            placeholder={cal.phoneLabel}
            value={clientPhone}
            onChange={(e) => onPhoneChange(e.target.value)}
            autoComplete="tel"
          />
        </div>

        {selectedSlots.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-medium text-brand-text/70">{cal.selectedSlotsTitle}:</span>
              <button
                type="button"
                onClick={onClearAllSlots}
                className="text-xs text-brand-text/60 hover:text-brand-text underline transition-colors cursor-pointer"
              >
                {cal.clearAll}
              </button>
            </div>
            <div className="flex max-h-[7rem] flex-col gap-1.5 overflow-y-auto pr-0.5">
              {selectedSlots.map((s) => (
                <span
                  key={`${s.dateStr}-${s.hour}`}
                  className="flex h-9 w-full shrink-0 items-center gap-2 rounded-full border border-brand-border/40 bg-white/90 px-3.5 text-xs sm:text-sm font-medium text-brand-text shadow-sm"
                >
                  <Clock className="h-3.5 w-3.5 shrink-0 text-brand-text/60" />
                  <span className="flex-1 truncate">{s.formattedDate} · {s.formattedTime}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveSlot(s.dateStr, s.hour)}
                    className="ml-0.5 rounded-full p-0.5 text-brand-text/50 hover:bg-brand-text/10 hover:text-brand-text transition-colors cursor-pointer"
                    aria-label="Remove slot"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex min-h-4 items-center gap-1.5 px-3 text-xs text-red-600">
          {errorMessage && (
            <>
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{errorMessage}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button
          type="submit"
          variant="brand-primary"
          size="lg"
          disabled={isSubmitting}
          className="w-full h-11"
        >
          {isSubmitting ? cal.submittingButton : cal.submitButton}
        </Button>

        <Button
          type="button"
          variant="brand-glass"
          size="lg"
          className="w-full h-11 flex items-center justify-center gap-2"
          onClick={onOpenCalendar}
        >
          <CalendarIcon className="h-4 w-4" />
          <span>
            {selectedSlots.length > 0
              ? (CHANGE_TIME_LABELS[locale] ?? "Изменить время в календаре")
              : (GO_TO_CALENDAR_LABELS[locale] ?? "Перейти в календарь")}
          </span>
        </Button>
      </div>
    </form>
  );
}
