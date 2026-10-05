"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";
import {
  MAX_SLOTS,
  pad,
  toDateKey,
  buildCalendarCells,
  formatSlotDate,
  type SelectedSlot,
  type BookingCalendarProps,
  type SubmittedBookingData,
} from "./booking-calendar-utils";
import { DayTimeModal, BookingSuccessDialog } from "./booking-calendar-dialogs";
import { BookingCalendarView } from "./booking-calendar-view";
import { BookingCalendarForm } from "./booking-calendar-form";

export type { SelectedSlot, BookingCalendarProps, SubmittedBookingData };

export function BookingCalendar({ className, onBookingSubmitted }: BookingCalendarProps) {
  const { t, locale } = useLanguage();
  const cal = t.cta.calendar;

  const [today] = React.useState<Date>(() => new Date());
  const [viewDate, setViewDate] = React.useState<Date>(() => new Date());
  const [activeDate, setActiveDate] = React.useState<Date>(() => new Date());
  const [selectedSlots, setSelectedSlots] = React.useState<SelectedSlot[]>([]);
  const [isTimeOpen, setIsTimeOpen] = React.useState(false);
  const [step, setStep] = React.useState<1 | 2>(1);

  const [clientName, setClientName] = React.useState("");
  const [clientPhone, setClientPhone] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = React.useState(false);
  const [submittedData, setSubmittedData] = React.useState<SubmittedBookingData | null>(null);

  const isCurrentMonth =
    viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() === today.getMonth();

  const handlePrevMonth = () => {
    if (isCurrentMonth) return;
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const calendarCells = React.useMemo(() => buildCalendarCells(viewDate), [viewDate]);

  const formatSlot = React.useCallback(
    (d: Date) => formatSlotDate(d, locale, cal.months),
    [locale, cal.months]
  );

  const activeDateKey = toDateKey(activeDate);

  const isSlotSelected = (dateStr: string, hour: number) => {
    return selectedSlots.some((s) => s.dateStr === dateStr && s.hour === hour);
  };

  const getSlotCountForDate = (dateStr: string) => {
    return selectedSlots.filter((s) => s.dateStr === dateStr).length;
  };

  const handleToggleSlot = (hour: number) => {
    setErrorMessage(null);
    const dateStr = activeDateKey;
    const exists = isSlotSelected(dateStr, hour);

    if (exists) {
      setSelectedSlots((prev) => prev.filter((s) => !(s.dateStr === dateStr && s.hour === hour)));
    } else {
      if (selectedSlots.length >= MAX_SLOTS) {
        setErrorMessage(cal.maxSlotsReached);
        return;
      }
      const newSlot: SelectedSlot = {
        dateStr,
        hour,
        formattedTime: `${pad(hour)}:00`,
        formattedDate: formatSlot(activeDate),
      };
      setSelectedSlots((prev) => [...prev, newSlot]);
    }
  };

  const handleRemoveSlot = (dateStr: string, hour: number) => {
    setSelectedSlots((prev) => prev.filter((s) => !(s.dateStr === dateStr && s.hour === hour)));
    setErrorMessage(null);
  };

  const handleClearAll = () => {
    setSelectedSlots([]);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!clientName.trim() || clientPhone.trim().length < 3) {
      setErrorMessage(cal.validationErrorRequired);
      return;
    }

    setIsSubmitting(true);
    const payload: SubmittedBookingData = {
      name: clientName.trim(),
      phone: clientPhone.trim(),
      slots: [...selectedSlots],
    };

    try {
      if (onBookingSubmitted) {
        await onBookingSubmitted(payload);
      } else {
        await new Promise((res) => setTimeout(res, 600));
      }
      setSubmittedData(payload);
      setIsSuccessOpen(true);
      setSelectedSlots([]);
      setClientName("");
      setClientPhone("");
      setStep(1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ошибка отправки. Попробуйте еще раз.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("mx-auto w-full max-w-[17rem] sm:max-w-md text-brand-text", className)}>
      <div key={step} className="flex h-[24rem] flex-col gap-3 animate-in fade-in duration-300">
        {step === 1 ? (
          <BookingCalendarForm
            clientName={clientName}
            clientPhone={clientPhone}
            selectedSlots={selectedSlots}
            errorMessage={errorMessage}
            isSubmitting={isSubmitting}
            locale={locale}
            cal={cal}
            onNameChange={setClientName}
            onPhoneChange={setClientPhone}
            onClearAllSlots={handleClearAll}
            onRemoveSlot={handleRemoveSlot}
            onSubmit={handleSubmit}
            onOpenCalendar={() => {
              setErrorMessage(null);
              setStep(2);
            }}
          />
        ) : (
          <BookingCalendarView
            viewDate={viewDate}
            today={today}
            activeDate={activeDate}
            calendarCells={calendarCells}
            selectedSlots={selectedSlots}
            isCurrentMonth={isCurrentMonth}
            locale={locale}
            months={cal.months}
            weekdays={cal.weekdays}
            selectedSlotsTitle={cal.selectedSlotsTitle}
            slotsCountLabel={cal.slotsCount}
            noSlotsChosenLabel={cal.noSlotsChosen}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onSelectDate={(date) => {
              setActiveDate(date);
              setIsTimeOpen(true);
            }}
            onBackToForm={() => {
              setErrorMessage(null);
              setStep(1);
            }}
            getSlotCountForDate={getSlotCountForDate}
          />
        )}
      </div>

      <DayTimeModal
        open={isTimeOpen}
        onOpenChange={setIsTimeOpen}
        activeDate={activeDate}
        selectedSlots={selectedSlots}
        errorMessage={errorMessage}
        formatSlotDate={formatSlot}
        onToggleSlot={handleToggleSlot}
        selectTimeTitle={cal.selectTimeTitle}
      />

      <BookingSuccessDialog
        open={isSuccessOpen}
        onOpenChange={setIsSuccessOpen}
        submittedData={submittedData}
        cal={cal}
      />
    </div>
  );
}
