"use client";

import { useState, useEffect, useCallback } from "react";
import TopNavBar from "@/app/components/dashboard/TopNavBar";
import AddEventModal from "@/components/calendar/AddEventModal";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import EventSidebar from "@/components/calendar/EventSidebar";
import { authFetch } from "@/utils/authFetch";
import { Loader2 } from "lucide-react";
import { playSound, SoundType } from "@/utils/sound";

// ─── Types ────────────────────────────────────────────────────────────────────

type Event = {
  id: string;
  title: string;
  type: "date" | "countdown" | "message";
  date: string; // YYYY-MM-DD
  description?: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch events ──────────────────────────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/calendar-events");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Server error: ${res.status}`);
      }
      const data = await res.json();
      
      // Map API fields (date) to UI Event type if needed
      // API currently returns: { id, title, type, date, description, ... }
      setEvents(data ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load calendar events.";
      console.error("[CalendarPage] fetchEvents error:", err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ── Create event ──────────────────────────────────────────────────────────

  const handleAddEvent = async (eventData: Event) => {
    try {
      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const newEvent = { ...eventData, id: tempId };
      setEvents((prev) => [...prev, newEvent]);
      
      const res = await authFetch("/api/calendar-events", {
        method: "POST",
        body: JSON.stringify({
          title: eventData.title,
          description: eventData.description,
          start_time: eventData.date, // API handles conversion or expects ISO
          event_type: eventData.type,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Failed to create event: ${res.status}`);
      }

      const result = await res.json();
      // Replace temp ID with real ID from DB
      setEvents((prev) => prev.map((e) => e.id === tempId ? { ...result, start_time: result.date } : e));
      playSound(SoundType.SUCCESS);
      
      // Final sync to be sure
      fetchEvents();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create event.";
      console.error("[CalendarPage] handleAddEvent error:", err);
      setError(message);
      // Rollback optimistic update
      fetchEvents();
    }
  };

  // ── Delete event ──────────────────────────────────────────────────────────

  const handleDeleteEvent = async (eventId: string) => {
    const confirmed = window.confirm("Delete this event?");
    if (!confirmed) return;

    // Optimistic update
    const previousEvents = [...events];
    setEvents((prev) => prev.filter((e) => e.id !== eventId));

    try {
      const res = await authFetch(`/api/calendar-events?id=${eventId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Failed to delete event: ${res.status}`);
      }
      
      playSound(SoundType.CLICK);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete event.";
      console.error("[CalendarPage] handleDeleteEvent error:", err);
      setError(message);
      // Rollback
      setEvents(previousEvents);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#fafaf9] pb-20">
      <TopNavBar />

      <main className="mx-auto w-full max-w-[1200px] px-6 py-10">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-rose/70">
              Your Moments
            </p>
            <h1 className="text-3xl font-bold text-[#1a1c1b]">Calendar</h1>
          </div>
          <div className="flex items-center gap-4">
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-brand-rose/60 animate-pulse font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                Syncing...
              </div>
            )}
            <button
              onClick={() => setShowModal(true)}
              className="rounded-xl bg-brand-rose px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-rose-200 transition-all hover:bg-rose-600 active:scale-95"
            >
              + New Event
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-8 rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
            {error}
            <button onClick={() => fetchEvents()} className="ml-auto underline font-bold">Retry</button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Main Calendar View */}
          <section className="lg:col-span-8">
            <div className="rounded-[32px] border border-black/5 bg-white p-8 shadow-sm">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#1a1c1b]">
                  {currentMonth.toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setCurrentMonth(
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth() - 1,
                          1
                        )
                      )
                    }
                    className="rounded-xl border border-black/5 p-2 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600"
                  >
                    ??
                  </button>
                  <button
                    onClick={() =>
                      setCurrentMonth(
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth() + 1,
                          1
                        )
                      )
                    }
                    className="rounded-xl border border-black/5 p-2 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600"
                  >
                    ??
                  </button>
                </div>
              </div>

              <CalendarGrid
                currentMonth={currentMonth}
                selectedDate={selectedDate}
                events={events}
                onSelectDate={(date) => {
                  setSelectedDate(date);
                  playSound(SoundType.CLICK);
                }}
              />
            </div>
          </section>

          {/* Sidebar */}
          <section className="lg:col-span-4">
            <EventSidebar
              selectedDate={selectedDate}
              events={events}
              onAddEvent={() => setShowModal(true)}
              onDeleteEvent={handleDeleteEvent}
            />
          </section>
        </div>
      </main>

      {showModal && (
        <AddEventModal
          onClose={() => setShowModal(false)}
          onAdd={handleAddEvent}
          defaultDate={selectedDate.toISOString().split("T")[0]}
        />
      )}
    </div>
  );
}
