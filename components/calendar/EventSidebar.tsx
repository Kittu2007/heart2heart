"use client";

import {
  formatDate,
  getCountdownText,
  isSameDay,
  isUnlocked,
} from "@/lib/calendar/utils";

type Event = {
  id: string;
  title: string;
  type: "date" | "countdown" | "message";
  date: string;
  description?: string;
};

type Props = {
  selectedDate: Date;
  events: Event[];
  onAddEvent: () => void;
};

const iconForEvent = (event: Event) => {
  if (event.type === "date") return "??";
  if (event.type === "countdown") return "?";
  return isUnlocked(event.date) ? "??" : "??";
};

const typeBadgeClass = (type: Event["type"]) => {
  if (type === "date") return "bg-rose-100 text-rose-600";
  if (type === "countdown") return "bg-amber-100 text-amber-700";
  return "bg-purple-100 text-purple-700";
};

function EventCard({ event }: { event: Event }) {
  const lockedMessage = event.type === "message" && !isUnlocked(event.date);

  return (
    <article className="rounded-2xl border border-rose-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="text-xl">{iconForEvent(event)}</span>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-bold text-neutral-800">{event.title}</h4>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${typeBadgeClass(event.type)}`}
            >
              {event.type}
            </span>
          </div>
          <p className="text-xs text-neutral-500">{formatDate(event.date)}</p>

          {event.type === "countdown" && (
            <p className="mt-1 text-xs font-semibold text-amber-600">
              {getCountdownText(event.date)}
            </p>
          )}

          {event.type === "message" && (
            <p className="mt-1 text-xs font-semibold text-purple-600">
              {lockedMessage ? "?? Locked until this date" : "?? Message unlocked"}
            </p>
          )}

          {event.description && !lockedMessage && (
            <p className="mt-2 text-xs leading-relaxed text-neutral-600">
              {event.description}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

export default function EventSidebar({ selectedDate, events, onAddEvent }: Props) {
  const selectedEvents = events.filter((event) =>
    isSameDay(new Date(event.date), selectedDate)
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = events
    .filter((event) => {
      const date = new Date(event.date);
      date.setHours(0, 0, 0, 0);
      return date >= today && !isSameDay(date, selectedDate);
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <aside className="flex h-full flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-rose-400">
            Selected date
          </p>
          <h3 className="text-base font-bold text-neutral-800">
            {formatDate(selectedDate)}
          </h3>
        </div>
        <button
          onClick={onAddEvent}
          className="rounded-xl bg-rose-500 px-3.5 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-rose-600 active:scale-95"
        >
          + Add
        </button>
      </div>

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">
          On this day
        </p>
        <div className="flex flex-col gap-2.5">
          {selectedEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50 p-5 text-center">
              <p className="text-sm font-medium text-rose-400">
                No events on this day yet.
              </p>
            </div>
          ) : (
            selectedEvents.map((event) => <EventCard key={event.id} event={event} />)
          )}
        </div>
      </section>

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">
          Upcoming
        </p>
        <div className="flex flex-col gap-2">
          {upcoming.length === 0 && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
              <p className="text-xs text-neutral-500">No upcoming events yet.</p>
            </div>
          )}
          {upcoming.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-3 rounded-xl border border-rose-100 bg-white p-3 transition-colors duration-150 hover:bg-rose-50"
            >
              <span className="text-lg">{iconForEvent(event)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-neutral-700">
                  {event.title}
                </p>
                <p className="text-xs text-neutral-500">
                  {formatDate(event.date)}
                  {event.type === "countdown" && (
                    <span className="ml-1.5 text-amber-600">
                      · {getCountdownText(event.date)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}

