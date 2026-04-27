"use client";

import { useEffect, useState, useCallback } from "react";
import { authFetch } from "@/utils/authFetch";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_time: string;      // ISO timestamp
  end_time: string | null; // ISO timestamp
  event_type: string;
  couple_id: string;
  created_by: string;
  created_at: string;
}

type NewEventPayload = Omit<CalendarEvent, "id" | "couple_id" | "created_by" | "created_at">;

// ─── Component ────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch events ──────────────────────────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await authFetch("/api/calendar-events");

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Server error: ${res.status}`);
      }

      const data: CalendarEvent[] = await res.json();
      setEvents(data ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load calendar events.";
      console.error("[CalendarPage] fetchEvents error:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ── Create event ──────────────────────────────────────────────────────────

  const handleCreateEvent = async (payload: NewEventPayload) => {
    setError(null);

    try {
      const res = await authFetch("/api/calendar-events", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Failed to create event: ${res.status}`);
      }

      // Refresh the list after creation
      await fetchEvents();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create event.";
      console.error("[CalendarPage] handleCreateEvent error:", err);
      setError(message);
    }
  };

  // ── Delete event ──────────────────────────────────────────────────────────

  const handleDeleteEvent = async (eventId: string) => {
    setError(null);

    try {
      const res = await authFetch(`/api/calendar-events?id=${eventId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Failed to delete event: ${res.status}`);
      }

      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete event.";
      console.error("[CalendarPage] handleDeleteEvent error:", err);
      setError(message);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground animate-pulse">Loading calendar…</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">📅 Couple Calendar</h1>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Event List ── */}
      {events.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">🗓️</p>
          <p className="font-medium">No events yet.</p>
          <p className="text-sm mt-1">Add your first couple activity below!</p>
        </div>
      ) : (
        <ul className="space-y-3 mb-8">
          {events.map((event) => (
            <li
              key={event.id}
              className="rounded-xl border bg-card p-4 flex items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="font-semibold truncate">{event.title}</p>
                {event.description && (
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                    {event.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(event.start_time).toLocaleString()}
                  {event.end_time && (
                    <> — {new Date(event.end_time).toLocaleString()}</>
                  )}
                </p>
              </div>
              <button
                onClick={() => handleDeleteEvent(event.id)}
                className="shrink-0 text-xs text-destructive hover:underline"
                aria-label={`Delete event: ${event.title}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ── Quick Add Form ── */}
      <QuickAddEventForm onSubmit={handleCreateEvent} />
    </div>
  );
}

// ─── Quick Add Form ───────────────────────────────────────────────────────────

interface QuickAddEventFormProps {
  onSubmit: (payload: NewEventPayload) => Promise<void>;
}

function QuickAddEventForm({ onSubmit }: QuickAddEventFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startTime) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        start_time: new Date(startTime).toISOString(),
        end_time: endTime ? new Date(endTime).toISOString() : null,
        event_type: "activity",
      });
      // Reset form
      setTitle("");
      setDescription("");
      setStartTime("");
      setEndTime("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border bg-card p-5 space-y-3"
    >
      <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
        Add Event
      </h2>

      <input
        type="text"
        placeholder="Event title *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />

      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">Start *</label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">End</label>
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting || !title.trim() || !startTime}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "Adding…" : "Add Event"}
      </button>
    </form>
  );
}
