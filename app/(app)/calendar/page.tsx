"use client";

import { useState } from "react";
import TopNavBar from "@/app/components/dashboard/TopNavBar";
import AddEventModal from "@/components/calendar/AddEventModal";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import EventSidebar from "@/components/calendar/EventSidebar";
import { isUnlocked, isSameDay } from "@/lib/calendar/utils";

type Event = {
  id: string;
  title: string;
  type: "date" | "countdown" | "message";
  date: string;
  description?: string;
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const makeIsoDate = (date: Date) => date.toISOString().split("T")[0];

const buildSeedEvents = (): Event[] => {
  const today = new Date();
  const withOffset = (offsetDays: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() + offsetDays);
    return makeIsoDate(date);
  };

  return [
    {
      id: crypto.randomUUID(),
      title: "Movie Night 🎬",
      type: "date",
      date: withOffset(3),
      description: "Cozy night in with popcorn and your favorite film.",
    },
    {
      id: crypto.randomUUID(),
      title: "Anniversary Countdown",
      type: "countdown",
      date: withOffset(30),
      description: "One month until our celebration.",
    },
    {
      id: crypto.randomUUID(),
      title: "Open on Birthday ❤️",
      type: "message",
      date: withOffset(14),
      description: "A little love letter waiting for you.",
    },
  ];
};

export default function CalendarPage() {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(now);
  const [events, setEvents] = useState<Event[]>(buildSeedEvents);
  const [showModal, setShowModal] = useState(false);

  const prevMonth = () => {
    setCurrentMonth(
      (month) => new Date(month.getFullYear(), month.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      (month) => new Date(month.getFullYear(), month.getMonth() + 1, 1)
    );
  };

  const handleAddEvent = (event: Event) => {
    setEvents((previous) => [...previous, event]);
  };

  const handleDeleteEvent = (eventId: string) => {
    const confirmed = window.confirm("Delete this event?");
    if (!confirmed) return;
    setEvents((previous) => previous.filter((event) => event.id !== eventId));
  };

  const selectedDateIso = makeIsoDate(selectedDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalEvents = events.length;
  const upcomingEvents = events.filter((event) => {
    const date = new Date(event.date);
    date.setHours(0, 0, 0, 0);
    return date >= today;
  }).length;
  const lockedMessages = events.filter(
    (event) => event.type === "message" && !isUnlocked(event.date)
  ).length;

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <TopNavBar />

      <main className="mx-auto w-full max-w-[1200px] px-6 py-10">
        <div className="mb-6">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-rose/70">
            Your Moments
          </p>
          <h1 className="text-3xl font-bold text-[#1a1c1b]">Calendar</h1>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          <section className="overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-sm">
            <header className="flex items-center justify-between bg-gradient-to-r from-rose-400 to-pink-400 px-6 py-5 text-white">
              <button
                onClick={prevMonth}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 transition-colors hover:bg-white/30 active:scale-95"
              >
                ‹
              </button>
              <div className="text-center">
                <h2 className="text-xl font-bold">
                  {MONTH_NAMES[currentMonth.getMonth()]}
                </h2>
                <p className="text-sm text-rose-100">{currentMonth.getFullYear()}</p>
              </div>
              <button
                onClick={nextMonth}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 transition-colors hover:bg-white/30 active:scale-95"
              >
                ›
              </button>
            </header>

            <div className="px-5 py-5">
              <CalendarGrid
                currentMonth={currentMonth}
                selectedDate={selectedDate}
                events={events}
                onSelectDate={setSelectedDate}
              />
            </div>

            <div className="border-t border-rose-50 px-5 py-4">
              <p className="text-xs text-neutral-500">
                {events.some((event) =>
                  isSameDay(new Date(event.date), selectedDate)
                )
                  ? "This day has one or more saved moments."
                  : "Select any date and add a special moment."}
              </p>
            </div>
          </section>

          <section className="max-h-[680px] overflow-y-auto rounded-3xl border border-rose-100 bg-white px-5 py-5 shadow-sm">
            <EventSidebar
              selectedDate={selectedDate}
              events={events}
              onAddEvent={() => setShowModal(true)}
              onDeleteEvent={handleDeleteEvent}
            />
          </section>
        </div>

        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-gradient-to-r from-rose-400 to-pink-400 p-4 text-white shadow-sm">
            <p className="text-sm font-semibold opacity-95">Total Events</p>
            <p className="mt-1 text-3xl font-bold">{totalEvents}</p>
          </div>
          <div className="rounded-3xl bg-gradient-to-r from-amber-400 to-orange-400 p-4 text-white shadow-sm">
            <p className="text-sm font-semibold opacity-95">Upcoming</p>
            <p className="mt-1 text-3xl font-bold">{upcomingEvents}</p>
          </div>
          <div className="rounded-3xl bg-gradient-to-r from-purple-400 to-violet-400 p-4 text-white shadow-sm">
            <p className="text-sm font-semibold opacity-95">Locked Messages</p>
            <p className="mt-1 text-3xl font-bold">{lockedMessages}</p>
          </div>
        </section>
      </main>

      {showModal && (
        <AddEventModal
          onClose={() => setShowModal(false)}
          onAdd={handleAddEvent}
          defaultDate={selectedDateIso}
        />
      )}
    </div>
  );
}
