"use client";

import { useState } from "react";
import { Calendar, RefreshCw, CheckCircle } from "lucide-react";

export interface Task {
  title: string;
  description: string;
  category?: string;
  intensity?: number;
}

interface DailyTaskCardProps {
  task?: Task;
  onUpdateTask?: (newTask: Task) => void;
  onComplete?: () => void;
  isCompleted?: boolean;
  reflection?: string;
  onReflectionChange?: (val: string) => void;
}

export default function DailyTaskCard({
  task,
  onUpdateTask,
  onComplete,
  isCompleted: externalIsCompleted = false,
  reflection = "",
  onReflectionChange,
}: DailyTaskCardProps) {
  const displayTask = task || {
    title: "Plan Date Night",
    description: "It's your turn to plan something special for this weekend.",
  };
  const [isCompleting, setIsCompleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const generateNewTask = async () => {
    setIsLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch("/api/generate-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: "Happy",
          loveLanguage: "Quality Time",
          comfortLevel: 3,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (onUpdateTask) {
          onUpdateTask(data);
        }
      } else {
        // Fallback task if AI fails
        if (onUpdateTask) {
          onUpdateTask({
            title: "Appreciation Moment",
            description: "Share three things you genuinely appreciate about your partner today.",
            category: "connection",
            intensity: 1
          });
        }
      }
    } catch (err) {
      // Fallback task if AI fails or times out
      if (onUpdateTask) {
        onUpdateTask({
          title: "Walk & Talk",
          description: "Take a 15-minute walk together without any phones.",
          category: "quality time",
          intensity: 2
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!reflection.trim()) return;
    setIsCompleting(true);
    try {
      if (onComplete) {
        await (onComplete as () => Promise<void>)();
      }
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="col-span-1 bg-surface backdrop-blur-apple rounded-[24px] p-6 lg:p-8 shadow-apple-card hover:shadow-apple-card-hover transition-shadow duration-300 flex flex-col gap-4 border border-black/5 relative overflow-hidden group">
      <div className="bg-brand-rose/10 w-14 h-14 rounded-2xl flex items-center justify-center text-brand-rose mb-2 shadow-sm">
        <Calendar size={28} className="fill-brand-rose/20" />
      </div>

      <div className="flex-grow">
        <h3 className="text-xl font-semibold text-[#1a1c1b] mb-2 transition-opacity duration-300" style={{ opacity: isLoading ? 0.5 : 1 }}>
          {displayTask.title}
        </h3>
        <p className="text-base text-[#78716c] transition-opacity duration-300 mb-4" style={{ opacity: isLoading ? 0.5 : 1 }}>
          {displayTask.description}
        </p>

        {!externalIsCompleted && (
          <div className="mt-4">
            <label className="text-xs font-bold text-[#78716c] uppercase tracking-wider mb-2 block">
              Daily Reflection (Required)
            </label>
            <textarea
              value={reflection}
              onChange={(e) => onReflectionChange?.(e.target.value)}
              placeholder="How was your experience??"
              className="w-full bg-black/5 border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-brand-rose/30 transition-all resize-none h-20"
            />
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleCompleteTask}
          disabled={isCompleting || externalIsCompleted || !reflection.trim()}
          className={`flex-grow font-semibold py-3 rounded-xl transition-colors active:scale-[0.98] flex items-center justify-center disabled:opacity-70 gap-2 ${externalIsCompleted ? 'bg-green-500/10 text-green-600' : 'bg-[#FFF0F0] text-brand-rose hover:bg-brand-rose/15'}`}
        >
          {isCompleting ? (
            <div className="w-5 h-5 border-2 border-brand-rose/30 border-t-brand-rose rounded-full animate-spin" />
          ) : externalIsCompleted ? (
            <>
              <CheckCircle size={20} />
              Task Completed
            </>
          ) : (
            "Complete Task"
          )}
        </button>
        <button
          onClick={generateNewTask}
          disabled={isLoading}
          className="bg-white border border-black/5 text-[#78716c] px-4 py-3 rounded-xl hover:bg-black/5 transition-colors active:scale-[0.98] disabled:opacity-50 flex items-center justify-center font-medium gap-2"
          title="Generate New Task"
        >
          {isLoading ? "Generating..." : <RefreshCw size={20} />}
        </button>
      </div>
    </div>
  );
}
