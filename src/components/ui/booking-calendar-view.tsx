"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  toDateKey,
  isSameDay,
  isPastDay,
  CONFIRM_TIME_LABELS,
  type CalendarCell,
  type SelectedSlot,
} from "./booking-calendar-utils";

export interface BookingCalendarViewProps {
  viewDate: Date;
  today: Date;
  activeDate: Date;
  calendarCells: CalendarCell[];
  selectedSlots: SelectedSlot[];
  isCurrentMonth: boolean;
  locale: string;
  months: readonly string[] | string[];
  weekdays: readonly string[] | string[];
  selectedSlotsTitle: string;
  slotsCountLabel: string;
  noSlotsChosenLabel: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (date: Date) => void;
  onBackToForm: () => void;
  getSlotCountForDate: (dateKey: string) => number;
}

export function BookingCalendarView({
  viewDate,
  today,
  activeDate,
  calendarCells,
  selectedSlots,
  isCurrentMonth,
  locale,
  months,
  weekdays,
  selectedSlotsTitle,
  slotsCountLabel,
  noSlotsChosenLabel,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
  onBackToForm,
  getSlotCountForDate,
}: BookingCalendarViewProps) {
  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="icon-glass"
              size="icon-sm"
              onClick={onBackToForm}
              aria-label="Back"
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="font-heading text-base font-semibold tracking-tight text-brand-text">
              {months[viewDate.getMonth()]} {viewDate.getFullYear()}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="icon-glass"
              size="icon-sm"
              onClick={onPrevMonth}
              disabled={isCurrentMonth}
              aria-label="Previous month"
              className="h-8 w-8 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="icon-glass"
              size="icon-sm"
              onClick={onNextMonth}
              aria-label="Next month"
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-center text-[11px] sm:text-xs font-medium text-brand-text/50 mb-1">
          {weekdays.map((day, idx) => (
            <span key={`${day}-${idx}`} className="py-0.5">
              {day}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-center text-sm">
          {calendarCells.map(({ date, isCurrentMonth: inMonth }, i) => {
            const past = isPastDay(date, today);
            const isTodayCell = isSameDay(date, today);
            const isActive = isSameDay(date, activeDate);
            const dateKey = toDateKey(date);
            const slotsCount = getSlotCountForDate(dateKey);
            const disabled = past || !inMonth;

            return (
              <button
                key={`${dateKey}-${i}`}
                type="button"
                disabled={disabled}
                onClick={() => onSelectDate(date)}
                className={cn(
                  "relative flex h-9 w-full flex-col items-center justify-center rounded-full sm:rounded-xl text-sm font-medium transition-all duration-150",
                  !inMonth && "opacity-20 cursor-default",
                  inMonth && past && "cursor-not-allowed opacity-30 text-brand-text/40 line-through",
                  inMonth && !past && "hover:bg-brand-text/10 active:scale-95 cursor-pointer",
                  isTodayCell && !isActive && "border border-brand-text/30 font-bold",
                  isActive && "bg-brand-text text-white shadow-sm font-semibold hover:bg-brand-text/90"
                )}
              >
                <span>{date.getDate()}</span>
                {slotsCount > 0 && (
                  <span
                    className={cn(
                      "absolute bottom-1 h-1.5 w-1.5 rounded-full",
                      isActive ? "bg-white" : "bg-brand-text"
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <span className="text-xs text-brand-text/50">
          {selectedSlots.length > 0
            ? `${selectedSlotsTitle}: ${selectedSlots.length} ${slotsCountLabel}`
            : noSlotsChosenLabel}
        </span>
        <Button
          type="button"
          variant="brand-primary"
          size="lg"
          className="w-full h-11 flex items-center justify-center gap-1.5"
          onClick={onBackToForm}
        >
          <span>{CONFIRM_TIME_LABELS[locale] ?? "Готово"}</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
