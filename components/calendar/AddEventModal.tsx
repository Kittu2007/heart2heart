"use client";

import { useState } from "react";

type Event = {
  id: string;
  title: string;
  type: "date" | "countdown" | "message";
  date: string;
  description?: string;
};

type Props = {
  onClose: () => void;
  onAdd: (event: Event) => void;
  defaultDate?: string;
};

export default function AddEventModal({ onClose, onAdd, defaultDate }: Props) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<Event["type"]>("date");
  const [date, setDate] = useState(
    defaultDate ?? new Date().toISOString().split("T")[0]
  );
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const typeOptions: Array<{
    value: Event["type"];
    label: string;
    icon: string;
  }> = [
    { value: "date", label: "Date Night", icon: "??" },
    { value: "countdown", label: "Countdown", icon: "?" },
    { value: "message", label: "Locked Message", icon: "??" },
  ];

  const handleSubmit = () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!date) {
      setError("Date is required.");
      return;
    }

    setError("");
    onAdd({
      id: crypto.randomUUID(),
      title: title.trim(),
      type,
      date,
      description: description.trim() || undefined,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-3xl border border-rose-100 bg-white shadow-xl">
        <div className="bg-gradient-to-r from-rose-400 to-pink-400 px-6 py-5">
          <h2 className="text-lg font-bold text-white">Add New Event</h2>
          <p className="text-sm text-rose-100">Capture a meaningful moment</p>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Event type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {typeOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => setType(option.value)}
                  className={`rounded-xl border px-2 py-3 text-center transition-all duration-150 active:scale-95 ${
                    type === option.value
                      ? "border-rose-300 bg-rose-50 text-rose-600"
                      : "border-rose-100 bg-white text-neutral-600 hover:bg-rose-50"
                  }`}
                >
                  <span className="block text-xl">{option.icon}</span>
                  <span className="mt-1 block text-[11px] font-semibold">
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
            {type === "message" && (
              <p className="mt-2 text-xs font-medium text-purple-600">
                ?? Unlocks on selected date
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-xl border border-rose-100 px-3 py-2.5 text-sm text-neutral-800 outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-200"
              placeholder="Movie date, surprise note..."
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-xl border border-rose-100 px-3 py-2.5 text-sm text-neutral-800 outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-rose-100 px-3 py-2.5 text-sm text-neutral-800 outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-200"
              placeholder="Add context or a sweet note..."
            />
          </div>

          {error && <p className="text-xs font-medium text-red-500">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-rose-100 px-4 py-2.5 text-sm font-semibold text-neutral-600 transition-colors hover:bg-rose-50 active:scale-95"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-rose-600 active:scale-95"
            >
              Add Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

