"use client";

import {
  getDaysInMonth,
  getFirstDayOfMonth,
  isSameDay,
  isToday,
} from "@/lib/calendar/utils";

type Event = {
  id: string;
  title: string;
  type: "date" | "countdown" | "message";
  date: string;
  description?: string;
};

type Props = {
  currentMonth: Date;
  selectedDate: Date;
  events: Event[];
  onSelectDate: (d: Date) => void;
};

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarGrid({
  currentMonth,
  selectedDate,
  events,
  onSelectDate,
}: Props) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const cells: Array<number | null> = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const hasEvent = (day: number) => {
    const dayDate = new Date(year, month, day);
    return events.some((event) => isSameDay(new Date(event.date), dayDate));
  };

  return (
    <div className="w-full">
      <div className="mb-2 grid grid-cols-7">
        {DAY_HEADERS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-semibold uppercase tracking-widest text-rose-300"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          if (day === null) {
            return <div key={`blank-${index}`} className="h-11 w-full" />;
          }

          const cellDate = new Date(year, month, day);
          const selected = isSameDay(cellDate, selectedDate);
          const today = isToday(cellDate);
          const eventExists = hasEvent(day);

          return (
            <button
              key={`${year}-${month}-${day}`}
              onClick={() => onSelectDate(cellDate)}
              className={`relative flex h-11 w-full flex-col items-center justify-center rounded-xl text-sm font-medium transition-all duration-150 active:scale-95 ${
                selected
                  ? "bg-rose-500 text-white shadow-sm shadow-rose-200"
                  : today
                    ? "bg-rose-50 text-rose-600 ring-2 ring-rose-300"
                    : "text-neutral-700 hover:bg-rose-50 hover:text-rose-600"
              }`}
            >
              <span>{day}</span>
              {eventExists && (
                <span
                  className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${
                    selected ? "bg-white" : "bg-rose-400"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

