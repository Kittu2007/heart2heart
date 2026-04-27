"use client";

import { useState } from "react";
import { X, Calendar, Clock, Send, Loader2 } from "lucide-react";

type Props = {
  onClose: () => void;
  onAdd: (event: { title: string; message: string; scheduled_for: string }) => Promise<void>;
};

export default function AddScheduledEventModal({ onClose, onAdd }: Props) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("12:00");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!date || !time) {
      setError("Date and time are required.");
      return;
    }

    // Combine date and time into an ISO string
    const scheduledFor = new Date(`${date}T${time}:00`).toISOString();

    setIsSubmitting(true);
    setError("");
    try {
      await onAdd({
        title: title.trim(),
        message: message.trim(),
        scheduled_for: scheduledFor,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to schedule event.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl border border-purple-100 bg-white shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Schedule a Message</h2>
              <p className="text-xs text-purple-100">Deliver a sweet note in the future</p>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-5 px-6 py-5">
          {error && (
            <div className="text-xs font-medium text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-neutral-500">
              Event Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-neutral-100 px-4 py-3 text-sm outline-none transition focus:border-purple-300 focus:ring-2 focus:ring-purple-200"
              placeholder="e.g., Anniversary Surprise, Good Morning Note"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 text-neutral-400" size={16} />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-xl border border-neutral-100 pl-10 pr-4 py-3 text-sm outline-none focus:border-purple-300 transition"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 text-neutral-400" size={16} />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-xl border border-neutral-100 pl-10 pr-4 py-3 text-sm outline-none focus:border-purple-300 transition"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-neutral-500">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-2xl border border-neutral-100 px-4 py-3 text-sm outline-none focus:border-purple-300 transition"
              placeholder="What do you want to say?"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-neutral-100 px-4 py-3 text-sm font-bold text-neutral-500 hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-purple-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-purple-100 hover:bg-purple-700 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {isSubmitting ? "Scheduling..." : "Schedule"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
