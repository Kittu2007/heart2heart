"use client";

import { useState } from "react";
import { Calendar, RefreshCw } from "lucide-react";

export default function TaskCard() {
  const [dailyTask, setDailyTask] = useState({
    title: "Plan Date Night",
    description: "It's your turn to plan something special for this weekend.",
    category: "communication",
    intensity: 3,
  });
  const [isLoading, setIsLoading] = useState(false);

  const generateNewTask = () => {
    setIsLoading(true);
    // Simulate API fetch delay
    setTimeout(() => {
      setDailyTask({
        title: "Meaningful Conversation",
        description: "Ask your partner what they appreciated most about you today.",
        category: "connection",
        intensity: 2,
      });
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="col-span-1 bg-white rounded-[24px] p-6 lg:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-shadow duration-300 flex flex-col gap-4 border border-black/5 relative overflow-hidden group">
      <div className="bg-brand-rose/10 w-14 h-14 rounded-2xl flex items-center justify-center text-brand-rose mb-2 shadow-sm">
        <Calendar size={28} className="fill-brand-rose/20" />
      </div>
      
      <div className="flex-grow">
        <h3 className="text-xl font-semibold text-[#1a1c1b] mb-2 transition-opacity duration-300" style={{ opacity: isLoading ? 0.5 : 1 }}>
          {dailyTask.title}
        </h3>
        <p className="text-base text-[#78716c] transition-opacity duration-300" style={{ opacity: isLoading ? 0.5 : 1 }}>
          {dailyTask.description}
        </p>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          className="flex-grow bg-[#FFF0F0] text-brand-rose font-semibold py-3 rounded-xl hover:bg-brand-rose/15 transition-colors active:scale-[0.98]"
        >
          Complete
        </button>
        <button
          onClick={generateNewTask}
          disabled={isLoading}
          className="bg-white border border-black/5 text-[#78716c] p-3 rounded-xl hover:bg-black/5 transition-colors active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
          title="Generate New Task"
        >
          <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>
    </div>
  );
}
