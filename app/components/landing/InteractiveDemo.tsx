"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Coffee, Heart, CheckCircle, Star } from "lucide-react";

const loveLanguages = [
  { icon: MessageSquare, label: "Words of Affirmation", score: 82 },
  { icon: Coffee, label: "Quality Time", score: 76 },
  { icon: Heart, label: "Physical Touch", score: 88 },
  { icon: CheckCircle, label: "Acts of Service", score: 70 },
];

const moods = [
  { label: "Rough", score: 60, mood: "rough" },
  { label: "Low", score: 65, mood: "low" },
  { label: "Good", score: 78, mood: "good" },
  { label: "Great", score: 88, mood: "great" },
  { label: "Amazing", score: 95, mood: "amazing" },
];

const taskMap: Record<string, { title: string; desc: string; cat: string }> = {
  rough: { title: "The Comfort Hold", desc: "Sit together for 5 minutes without talking. One of you rests your head on the other's shoulder. No phones. Just presence.", cat: "Care" },
  low: { title: "Gratitude Exchange", desc: "Write down three things you appreciate about your partner right now. Read them aloud to each other slowly.", cat: "Communication" },
  good: { title: "The 10-Minute Highlight Reel", desc: "Each of you shares your single best moment of the past week. Listen without interrupting, then tell them what you loved about their story.", cat: "Communication" },
  great: { title: "Spontaneous Adventure", desc: "Pick a direction and walk for 15 minutes. No destination. Whoever spots something interesting first decides where to stop.", cat: "Adventure" },
  amazing: { title: "Creative Collab Night", desc: "Open a blank doc together and co-write the first chapter of a story about a couple who can do anything. You have 20 minutes.", cat: "Creative" },
};

const demoSteps = [
  { num: "1", title: "Pick your love language", desc: "The AI shapes every activity using this — privately, individually." },
  { num: "2", title: "Log your mood", desc: "Share or keep it private. If shared, it adjusts today's task tone in real time." },
  { num: "3", title: "Rate yesterday's task", desc: "Sentiment-analysed by NVIDIA MiniMax AI and used to improve the next activity." },
];

export default function InteractiveDemo() {
  const [llIdx, setLlIdx] = useState(0);
  const [moodIdx, setMoodIdx] = useState(2);
  const [stars, setStars] = useState(4);
  const [submitted, setSubmitted] = useState(false);
  const [ringScore, setRingScore] = useState(0);
  const ringRef = useRef<SVGCircleElement>(null);

  const computeScore = useCallback(() => {
    return Math.round((loveLanguages[llIdx].score + moods[moodIdx].score) / 2);
  }, [llIdx, moodIdx]);

  useEffect(() => {
    const target = computeScore();
    let raf: number;
    const t0 = performance.now();
    const from = ringScore;
    const tick = (now: number) => {
      const p = Math.min((now - t0) / 500, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setRingScore(Math.round(from + (target - from) * ease));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [llIdx, moodIdx, computeScore]);

  const currentTask = taskMap[moods[moodIdx].mood];
  const circumference = 264;
  const offset = circumference - (circumference * (ringScore / 100));

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3500);
  };

  return (
    <section id="demo" className="py-[80px] md:py-[120px] px-6 md:px-16 bg-[rgba(13,13,18,0.02)] relative z-10">
      <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-start">
        {/* Left */}
        <div>
          <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="text-[11px] font-semibold tracking-[0.2em] uppercase text-brand-rose mb-5">Try It Now</motion.div>
          <motion.h2 initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="font-serif text-[40px] md:text-[50px] font-bold tracking-[-3px] leading-[0.93] text-[#0D0D12]">
            Experience the<br /><em className="italic text-brand-rose">daily ritual</em>
          </motion.h2>
          <motion.p initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-[17px] font-light text-[rgba(13,13,18,0.6)] leading-[1.75] max-w-[480px] mt-4">
            This is what Heart2Heart looks like every morning. Log your mood, see your AI-generated task, and rate how it went — all in under a minute.
          </motion.p>
          <div className="flex flex-col gap-[22px] mt-8">
            {demoSteps.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -18 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }} className="flex gap-[18px] items-start">
                <div className="w-[38px] h-[38px] rounded-full bg-brand-rose flex items-center justify-center text-[13px] font-bold text-white shrink-0 font-serif">{s.num}</div>
                <div>
                  <div className="text-[15px] font-semibold text-[#0D0D12] mb-1">{s.title}</div>
                  <div className="text-[14px] text-[rgba(13,13,18,0.6)] leading-[1.6] font-light">{s.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right – Interactive Panel */}
        <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-white border border-[rgba(13,13,18,0.08)] rounded-[32px] p-6 md:p-10 shadow-[0_20px_60px_rgba(13,13,18,0.06)]">
          <div className="flex justify-between items-center mb-7">
            <div className="font-serif text-[20px] font-bold text-[#0D0D12]">Your Daily Check-In</div>
            <div className="bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.2)] rounded-full px-[14px] py-[6px] text-[12px] font-semibold text-[#16a34a] flex items-center gap-[6px]">
              <div className="w-[6px] h-[6px] bg-[#22c55e] rounded-full animate-[pulse-green_2s_infinite]" />Partner is online
            </div>
          </div>

          {/* Ring */}
          <div className="flex gap-6 items-center mb-6">
            <div className="relative w-[100px] h-[100px] shrink-0">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(13,13,18,0.06)" strokeWidth="8" />
                <circle ref={ringRef} cx="50" cy="50" r="42" fill="none" stroke="#E8274B" strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 50 50)" className="transition-[stroke-dashoffset] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-serif text-[22px] font-bold text-[#0D0D12] tracking-[-1px]">{ringScore}</div>
                <div className="text-[9px] text-[rgba(13,13,18,0.6)] uppercase tracking-[0.08em]">Score</div>
              </div>
            </div>
            <div>
              <div className="text-[15px] font-semibold text-[#0D0D12] font-serif mb-[5px]">Engagement Score</div>
              <p className="text-[13px] text-[rgba(13,13,18,0.6)] leading-[1.6] font-light">Select your love language and mood to see how it shapes your score and today&apos;s AI task.</p>
            </div>
          </div>

          {/* Love Language */}
          <div className="text-[11px] font-bold tracking-[0.12em] uppercase text-[rgba(13,13,18,0.6)] mb-3">Your Love Language</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
            {loveLanguages.map((ll, i) => (
              <button key={i} onClick={() => setLlIdx(i)} className={`border-[1.5px] rounded-[14px] px-[14px] py-3 flex items-center gap-[10px] text-left transition-all duration-200 ${i === llIdx ? "border-brand-rose bg-[rgba(232,39,75,0.04)]" : "border-[rgba(13,13,18,0.08)] bg-transparent hover:border-brand-rose hover:bg-[rgba(232,39,75,0.04)]"}`}>
                <div className="w-8 h-8 rounded-[10px] bg-[rgba(232,39,75,0.07)] flex items-center justify-center shrink-0">
                  <ll.icon size={16} className="text-brand-rose" strokeWidth={2} />
                </div>
                <span className={`text-[13px] font-medium transition-colors ${i === llIdx ? "text-brand-rose font-semibold" : "text-[rgba(13,13,18,0.6)]"}`}>{ll.label}</span>
              </button>
            ))}
          </div>

          {/* Mood */}
          <div className="text-[11px] font-bold tracking-[0.12em] uppercase text-[rgba(13,13,18,0.6)] mb-3">How are you feeling?</div>
          <div className="grid grid-cols-5 gap-2 mb-6">
            {moods.map((m, i) => (
              <button key={i} onClick={() => setMoodIdx(i)} className={`border-[1.5px] rounded-[14px] py-3 px-2 text-center transition-all duration-200 ${i === moodIdx ? "border-brand-rose bg-[rgba(232,39,75,0.04)]" : "border-[rgba(13,13,18,0.08)] bg-transparent hover:border-brand-rose hover:bg-[rgba(232,39,75,0.04)]"}`}>
                <div className="text-[20px] mb-1">{["😔", "😕", "🙂", "😊", "🤩"][i]}</div>
                <span className={`text-[11px] font-medium transition-colors ${i === moodIdx ? "text-brand-rose" : "text-[rgba(13,13,18,0.6)]"}`}>{m.label}</span>
              </button>
            ))}
          </div>

          {/* AI Task */}
          <div className="bg-[rgba(232,39,75,0.04)] border border-[rgba(232,39,75,0.15)] rounded-[18px] p-5 mb-5">
            <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-brand-rose mb-2 flex items-center gap-[6px]">
              <div className="w-[5px] h-[5px] bg-brand-rose rounded-full animate-[pulse-green_2s_infinite]" />
              MiniMax AI — Today&apos;s Task
            </div>
            <div className="font-serif text-[16px] font-bold text-[#0D0D12] mb-[6px]">{currentTask.title}</div>
            <div className="text-[13px] text-[rgba(13,13,18,0.6)] leading-[1.6] font-light">{currentTask.desc}</div>
            <div className="flex gap-2 mt-[10px]">
              <span className="bg-[rgba(232,39,75,0.08)] rounded-full px-3 py-1 text-[11px] font-semibold text-brand-rose">{currentTask.cat}</span>
              <span className="bg-[rgba(232,39,75,0.08)] rounded-full px-3 py-1 text-[11px] font-semibold text-brand-rose">~10 min</span>
            </div>
          </div>

          {/* Stars */}
          <div className="text-[11px] font-bold tracking-[0.12em] uppercase text-[rgba(13,13,18,0.6)] mb-3">Rate yesterday&apos;s task</div>
          <div className="flex gap-2 mb-5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setStars(n)} className="hover:scale-110 transition-transform p-[2px]">
                <Star size={26} className={n <= stars ? "text-brand-rose fill-brand-rose" : "text-[rgba(13,13,18,0.08)] fill-[rgba(13,13,18,0.08)]"} />
              </button>
            ))}
          </div>

          <button onClick={handleSubmit} className={`w-full rounded-[14px] py-4 text-[14px] font-semibold tracking-[-0.01em] transition-all duration-300 ${submitted ? "bg-[#16a34a] text-white" : "bg-[#0D0D12] text-white hover:bg-brand-rose hover:-translate-y-[2px]"}`}>
            {submitted ? "✓ Saved!" : "Submit Check-In — Notify Partner"}
          </button>
          {submitted && (
            <div className="text-center mt-3 text-[14px] font-semibold text-[#16a34a] flex items-center justify-center gap-[6px]">
              <CheckCircle size={16} /> Partner notified · AI task updated
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
