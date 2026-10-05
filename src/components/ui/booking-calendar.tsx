"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Clock, CheckCircle2, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { useLanguage } from "@/components/providers/language-provider";

export interface SelectedSlot {
  dateStr: string; // YYYY-MM-DD
  hour: number;    // 8..19
  formattedDate: string; // e.g. "Пн, 12 окт."
  formattedTime: string; // e.g. "10:00"
}

export interface BookingCalendarProps {
  className?: string;
  onBookingSubmitted?: (data: { name: string; phone: string; slots: SelectedSlot[] }) => Promise<void> | void;
}

const HOURS: readonly number[] = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
const MAX_SLOTS = 3;

const NEXT_BUTTON_LABELS: Record<string, string> = {
  ru: "Далее",
  uk: "Далі",
  en: "Next",
  de: "Weiter",
};


function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isPastDay(d: Date, today: Date): boolean {
  const dMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return dMidnight < todayMidnight;
}

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
  const [submittedData, setSubmittedData] = React.useState<{ name: string; phone: string; slots: SelectedSlot[] } | null>(null);

  // Month navigation guards
  const isCurrentMonth =
    viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() === today.getMonth();

  const handlePrevMonth = () => {
    if (isCurrentMonth) return;
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Calendar matrix calculation
  const calendarCells = React.useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: { date: Date; isCurrentMonth: boolean }[] = [];

    // Leading padding days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({
        date: new Date(year, month, day),
        isCurrentMonth: true,
      });
    }

    // Trailing padding days: always 6 weeks (42 cells) to keep height static
    const extraNeeded = 42 - cells.length;
    for (let day = 1; day <= extraNeeded; day++) {
      cells.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [viewDate]);

  // Formatted date string helper for slot labels
  const formatSlotDate = React.useCallback(
    (d: Date): string => {
      try {
        const weekday = new Intl.DateTimeFormat(locale, { weekday: "short" }).format(d);
        const day = d.getDate();
        const month = new Intl.DateTimeFormat(locale, { month: "short" }).format(d);
        return `${weekday}, ${day} ${month}`;
      } catch {
        return `${d.getDate()} ${cal.months[d.getMonth()]}`;
      }
    },
    [locale, cal.months]
  );

  const activeDateKey = toDateKey(activeDate);

  // Slot management
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
        formattedDate: formatSlotDate(activeDate),
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

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!clientName.trim() || clientPhone.trim().length < 6) {
      setErrorMessage(cal.validationErrorRequired);
      return;
    }

    setIsSubmitting(true);
    const payload = {
      name: clientName.trim(),
      phone: clientPhone.trim(),
      slots: [...selectedSlots],
    };

    try {
      if (onBookingSubmitted) {
        await onBookingSubmitted(payload);
      } else {
        // Mock asynchronous telegram webhook call
        await new Promise((res) => setTimeout(res, 600));
      }
      setSubmittedData(payload);
      setIsSuccessOpen(true);
      // Reset form
      setSelectedSlots([]);
      setClientName("");
      setClientPhone("");
      setStep(1);
    } catch {
      setErrorMessage("Ошибка отправки. Попробуйте еще раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("mx-auto w-full max-w-[17rem] sm:max-w-md text-brand-text", className)}>
      <div key={step} className="flex h-[24rem] flex-col gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
        {step === 1 ? (
          <>
            {/* Monthly Calendar */}
            <div>
              {/* Calendar Header */}
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-heading text-base font-semibold tracking-tight text-brand-text">
                  {cal.months[viewDate.getMonth()]} {viewDate.getFullYear()}
                </h3>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="icon-glass"
                    size="icon-sm"
                    onClick={handlePrevMonth}
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
                    onClick={handleNextMonth}
                    aria-label="Next month"
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Weekday Labels */}
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-center text-[11px] sm:text-xs font-medium text-brand-text/50 mb-1">
                {cal.weekdays.map((day, idx) => (
                  <span key={`${day}-${idx}`} className="py-0.5">
                    {day}
                  </span>
                ))}
              </div>

              {/* Day Grid */}
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
                      onClick={() => {
                        setActiveDate(date);
                        setIsTimeOpen(true);
                      }}
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

            {/* Step 1 Confirm Bar */}
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-xs text-brand-text/50">{cal.noSlotsChosen}</span>
              <Button
                type="button"
                variant="brand-primary"
                size="lg"
                className="w-full h-11 flex items-center justify-center gap-1.5"
                onClick={() => {
                  setErrorMessage(null);
                  setStep(2);
                }}
              >
                <span>{NEXT_BUTTON_LABELS[locale] ?? "Далі"}</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Top row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="icon-glass"
                  size="icon-sm"
                  onClick={() => setStep(1)}
                  aria-label="Back"
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="font-heading text-base font-semibold tracking-tight text-brand-text">
                  {cal.selectedSlotsTitle}
                </h3>
              </div>
              {selectedSlots.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-brand-text/60 hover:text-brand-text underline transition-colors cursor-pointer"
                >
                  {cal.clearAll}
                </button>
              )}
            </div>

            {/* Removable chips list */}
            <div className="flex h-[8.5rem] shrink-0 flex-col gap-2">
              {selectedSlots.map((s) => (
                <span
                  key={`${s.dateStr}-${s.hour}`}
                  className="flex h-10 w-full shrink-0 items-center gap-2 rounded-full border border-brand-border/40 bg-white/90 px-4 text-sm font-medium text-brand-text shadow-sm"
                >
                  <Clock className="h-3.5 w-3.5 shrink-0 text-brand-text/60" />
                  <span className="flex-1 truncate">{s.formattedDate} · {s.formattedTime}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSlot(s.dateStr, s.hour)}
                    className="ml-0.5 rounded-full p-0.5 text-brand-text/50 hover:bg-brand-text/10 hover:text-brand-text transition-colors cursor-pointer"
                    aria-label="Remove slot"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Contact Inputs & Submit */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-2">
                <Input
                  className="h-11 text-base sm:text-sm"
                  variant="pill"
                  size="default"
                  placeholder={cal.nameLabel}
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  autoComplete="name"
                />
                <Input
                  className="h-11 text-base sm:text-sm"
                  variant="pill"
                  size="default"
                  type="tel"
                  inputMode="tel"
                  placeholder={cal.phoneLabel}
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  autoComplete="tel"
                />
              </div>

              <div className="flex h-4 items-center gap-1.5 px-3 text-xs text-red-600">
                {errorMessage && (
                  <>
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{errorMessage}</span>
                  </>
                )}
              </div>

              <Button
                type="submit"
                variant="brand-primary"
                size="lg"
                disabled={isSubmitting}
                className="w-full h-11"
              >
                {isSubmitting ? cal.submittingButton : cal.submitButton}
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* Day-Time Selection Modal */}
      <DayTimeModal
        open={isTimeOpen}
        onOpenChange={setIsTimeOpen}
        activeDate={activeDate}
        selectedSlots={selectedSlots}
        errorMessage={errorMessage}
        formatSlotDate={formatSlotDate}
        onToggleSlot={handleToggleSlot}
        selectTimeTitle={cal.selectTimeTitle}
      />

      {/* Telegram Confirmation Modal */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
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
    </div>
  );
}

interface DayTimeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeDate: Date;
  selectedSlots: SelectedSlot[];
  errorMessage: string | null;
  formatSlotDate: (d: Date) => string;
  onToggleSlot: (hour: number) => void;
  selectTimeTitle: string;
}

function DayTimeModal({
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
