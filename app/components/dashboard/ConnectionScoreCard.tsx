"use client";

import { Heart, TrendingUp } from "lucide-react";
import { useMemo } from "react";

interface ConnectionScoreCardProps {
  score?: number;
}

export default function ConnectionScoreCard({ score = 0 }: ConnectionScoreCardProps) {
  const scoreLabel = useMemo(() => {
    if (score === 0) return "Start completing tasks to build your bond!";
    if (score < 30) return "Your journey is just beginning.";
    if (score < 60) return "Growing stronger every day.";
    if (score < 80) return "Your bond is thriving!";
    return "Your bond is stronger than ever.";
  }, [score]);

  // Dynamic bar heights based on actual score
  const barHeights = useMemo(() => {
    const pct = score / 100;
    return [
      Math.max(8, pct * 40),  // shortest
      Math.max(12, pct * 60),
      Math.max(16, pct * 80),
      Math.max(20, pct * 100), // tallest
    ];
  }, [score]);

  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-surface backdrop-blur-apple rounded-[24px] p-6 md:p-8 shadow-apple-card hover:shadow-apple-card-hover transition-shadow duration-300 flex flex-col gap-6 border border-black/5 relative overflow-hidden">
      {/* Ambient glowing orb in the corner */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-rose/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

      <div className="flex justify-between items-start relative z-10">
        <div>
          <h2 className="text-3xl font-bold text-[#1a1c1b] tracking-[-0.01em]">Connection Score</h2>
          <p className="text-base text-[#78716c] mt-1">{scoreLabel}</p>
        </div>
        <div className="bg-[#FFF0F0] w-12 h-12 rounded-full flex items-center justify-center text-brand-rose shadow-sm">
          <Heart size={24} className="fill-brand-rose text-brand-rose" />
        </div>
      </div>

      <div className="flex items-end gap-2 relative z-10 mt-auto">
        {score === 0 ? (
          <span className="text-xl font-medium text-[#a8a29e] mb-2 leading-snug max-w-[200px]">
            Complete your first task to see your score
          </span>
        ) : (
          <>
            <span className="text-[72px] font-bold leading-none tracking-tighter transition-colors duration-500 text-[#1a1c1b]">
              {score}
            </span>
            <span className="text-2xl font-semibold text-[#78716c] mb-3">%</span>
          </>
        )}

        {score > 0 && (
          <div className="flex items-center gap-1 mb-4 ml-2">
            <TrendingUp size={16} className="text-green-500" />
            <span className="text-sm font-semibold text-green-600">Live</span>
          </div>
        )}

        {/* Dynamic Progress Bars */}
        <div className="ml-auto flex gap-2 items-end" style={{ height: "160px" }}>
          {barHeights.map((h, i) => (
            <div
              key={i}
              className="w-3 rounded-full overflow-hidden transition-all duration-700 ease-out"
              style={{
                height: `${h}%`,
                background:
                  i < 3
                    ? `rgba(232,39,75,${0.15 + i * 0.2})`
                    : "linear-gradient(to top, #E8274B, #ff4b6d)",
                boxShadow: i === 3 && score > 50 ? "0 0 12px rgba(232,39,75,0.4)" : "none",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
