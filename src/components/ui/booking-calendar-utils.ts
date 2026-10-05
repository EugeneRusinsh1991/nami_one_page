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

export interface SubmittedBookingData {
  name: string;
  phone: string;
  slots: SelectedSlot[];
}

export interface CalendarCell {
  date: Date;
  isCurrentMonth: boolean;
}

export const HOURS: readonly number[] = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
export const MAX_SLOTS = 3;

export const GO_TO_CALENDAR_LABELS: Record<string, string> = {
  ru: "Перейти в календарь",
  uk: "Перейти до календаря",
  en: "Go to calendar",
  de: "Zum Kalender",
};

export const CHANGE_TIME_LABELS: Record<string, string> = {
  ru: "Изменить время в календаре",
  uk: "Змінити час у календарі",
  en: "Change time in calendar",
  de: "Termin im Kalender ändern",
};

export const CONFIRM_TIME_LABELS: Record<string, string> = {
  ru: "Готово",
  uk: "Готово",
  en: "Done",
  de: "Fertig",
};

export function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function isPastDay(d: Date, today: Date): boolean {
  const dMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return dMidnight < todayMidnight;
}

export function buildCalendarCells(viewDate: Date): CalendarCell[] {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: CalendarCell[] = [];

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    cells.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      date: new Date(year, month, day),
      isCurrentMonth: true,
    });
  }

  const extraNeeded = 42 - cells.length;
  for (let day = 1; day <= extraNeeded; day++) {
    cells.push({
      date: new Date(year, month + 1, day),
      isCurrentMonth: false,
    });
  }

  return cells;
}

export function formatSlotDate(
  d: Date,
  locale: string,
  fallbackMonths?: readonly string[] | string[]
): string {
  try {
    const weekday = new Intl.DateTimeFormat(locale, { weekday: "short" }).format(d);
    const day = d.getDate();
    const month = new Intl.DateTimeFormat(locale, { month: "short" }).format(d);
    return `${weekday}, ${day} ${month}`;
  } catch {
    return fallbackMonths
      ? `${d.getDate()} ${fallbackMonths[d.getMonth()]}`
      : `${d.getDate()}.${pad(d.getMonth() + 1)}`;
  }
}
