"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

function useCountUp(target: number, duration = 1400, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    const isFloat = String(target).includes(".");
    let raf: number;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      const v = target * ease;
      setValue(isFloat ? parseFloat(v.toFixed(1)) : Math.round(v));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return value;
}

const rise = (delay: number) => ({
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, delay, ease: [0.23, 1, 0.32, 1] as const } },
});

export default function Hero() {
  const [cardVisible, setCardVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const heroScore = useCountUp(82, 1400, cardVisible);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setCardVisible(true); },
      { threshold: 0.3 }
    );
    if (cardRef.current) obs.observe(cardRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="min-h-screen flex flex-col justify-center pt-[140px] pb-[80px] px-6 md:px-16 relative z-10">
      <div className="max-w-[1240px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-0 items-center">
        {/* Left */}
        <div className="lg:pr-20">
          <motion.div variants={rise(0.1)} initial="hidden" animate="visible" className="inline-flex items-center gap-[10px] text-[11px] font-semibold tracking-[0.18em] uppercase text-brand-rose mb-10">
            <div className="w-8 h-[1px] bg-brand-rose" />
            AI-Powered Relationship Platform
          </motion.div>

          <motion.h1 variants={rise(0.2)} initial="hidden" animate="visible" className="font-serif text-[48px] md:text-[80px] font-bold tracking-[-3.5px] leading-[0.92] text-[#0D0D12] mb-8">
            Daily<br />activities <span className="italic text-brand-rose">made</span><br />
            <span className="font-normal text-[rgba(13,13,18,0.6)]">for two</span>
          </motion.h1>

          <motion.p variants={rise(0.3)} initial="hidden" animate="visible" className="text-[18px] font-light text-[rgba(13,13,18,0.6)] leading-[1.75] max-w-[440px] mb-12">
            Heart2Heart learns what makes your relationship unique — then generates personalised daily couple activities using AI, so you never run out of meaningful things to do together.
          </motion.p>

          <motion.div variants={rise(0.4)} initial="hidden" animate="visible" className="flex gap-3 items-center flex-wrap">
            <Link href="/login" className="relative overflow-hidden bg-[#0D0D12] text-white border-none rounded-full px-10 py-[18px] text-[15px] font-semibold tracking-[-0.02em] no-underline group transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_14px_40px_rgba(232,39,75,0.25)]">
              <span className="absolute inset-0 bg-brand-rose scale-0 group-hover:scale-100 transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] rounded-full" />
              <span className="relative z-10">Sign In & Start</span>
            </Link>
            <a href="#how" className="flex items-center gap-[10px] bg-transparent text-[#0D0D12] border border-[rgba(13,13,18,0.08)] rounded-full px-8 py-[18px] text-[15px] font-medium no-underline hover:border-brand-rose hover:text-brand-rose transition-all group">
              See how it works
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>

          <motion.div variants={rise(0.5)} initial="hidden" animate="visible" className="flex items-center gap-4 mt-10">
            <div className="flex">
              {[
                { bg: "bg-brand-rose", letter: "S" },
                { bg: "bg-[#0D0D12]", letter: "M" },
                { bg: "bg-[#C8A96E]", letter: "R" },
                { bg: "bg-[#7C3AED]", letter: "J" },
              ].map((a, i) => (
                <div key={i} className={`w-8 h-8 rounded-full border-[2.5px] border-[#FAFAF8] ${i > 0 ? "-ml-[9px]" : ""} text-[11px] font-bold flex items-center justify-center text-white ${a.bg}`}>
                  {a.letter}
                </div>
              ))}
            </div>
            <div className="text-[13px] text-[rgba(13,13,18,0.6)] leading-[1.5]">
              <strong className="text-[#0D0D12] font-semibold">12,400+ couples</strong> already connecting
              <br />Rated 4.9 · Built at Vibe Coding 2026
            </div>
          </motion.div>
        </div>

        {/* Right – Card stack */}
        <motion.div variants={rise(0.2)} initial="hidden" animate="visible" className="relative h-[520px] hidden lg:block">
          <div className="absolute top-20 left-20 right-[-20px] bottom-[-40px] bg-[#FAFAF8] border border-[rgba(13,13,18,0.04)] rounded-[32px] z-[1]" style={{ transform: "perspective(1200px) rotateX(4deg) rotateY(-6deg) translateZ(-60px)" }} />
          <div className="absolute top-[50px] left-[50px] right-0 bottom-[-20px] bg-[#F4F3EF] border border-[rgba(13,13,18,0.08)] rounded-[32px] z-[2]" style={{ transform: "perspective(1200px) rotateX(4deg) rotateY(-6deg) translateZ(-30px)" }} />

          <div ref={cardRef} className="absolute top-5 left-5 right-5 bg-white border border-[rgba(13,13,18,0.08)] rounded-[32px] p-9 shadow-[0_24px_80px_rgba(13,13,18,0.09),0_4px_16px_rgba(13,13,18,0.04)] z-[3] hover:-translate-y-2 hover:shadow-[0_48px_100px_rgba(13,13,18,0.13)] transition-all duration-600">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-[rgba(232,39,75,0.06)] border border-[rgba(232,39,75,0.15)] rounded-full px-[14px] py-[6px] text-[11px] font-semibold text-brand-rose tracking-[0.08em] uppercase">Engagement Score</div>
              <div className="flex items-center gap-[6px] text-[12px] text-[rgba(13,13,18,0.6)]">
                <div className="w-[6px] h-[6px] bg-[#22c55e] rounded-full animate-[pulse-green_2s_infinite]" />AI Active
              </div>
            </div>
            <div className="text-[11px] font-medium text-[rgba(13,13,18,0.6)] tracking-[0.05em] uppercase mb-[10px]">Your Bond Strength</div>
            <div className="flex items-baseline gap-[6px] mb-[18px]">
              <span className="font-serif text-[80px] font-bold text-[#0D0D12] tracking-[-4px] leading-none">{heroScore}</span>
              <span className="text-[26px] text-[rgba(13,13,18,0.6)] font-light">%</span>
            </div>
            <div className="bg-[rgba(232,39,75,0.04)] border border-[rgba(232,39,75,0.15)] rounded-[16px] p-4 mb-[18px]">
              <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-brand-rose mb-[6px]">Today&apos;s AI Task — Communication</div>
              <div className="font-serif text-[15px] font-bold text-[#0D0D12] mb-1">The 10-Minute Highlight Reel</div>
              <div className="text-[12px] text-[rgba(13,13,18,0.6)] leading-[1.5]">Each share your single best moment from the past week. Listen fully without interrupting, then swap.</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-[34px] h-[34px] rounded-full border-2 border-white flex items-center justify-center text-[11px] font-bold text-white bg-brand-rose">Y</div>
                <div className="w-[34px] h-[34px] rounded-full border-2 border-white flex items-center justify-center text-[11px] font-bold text-white bg-[#0D0D12] -ml-2">A</div>
                <div className="ml-2">
                  <div className="text-[13px] font-semibold text-[#0D0D12]">You & Partner</div>
                  <div className="text-[11px] text-[rgba(13,13,18,0.6)]">Day 14 together</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[20px] font-bold text-brand-rose tracking-[-1px]">+7%</div>
                <div className="text-[11px] text-[rgba(13,13,18,0.6)]">This week</div>
              </div>
            </div>
          </div>

          {/* Floating mini cards */}
          <div className="absolute bottom-[10px] left-[-20px] w-[190px] bg-white border border-[rgba(13,13,18,0.08)] rounded-[22px] p-5 shadow-[0_12px_40px_rgba(13,13,18,0.08)] z-10 animate-[float1_6s_ease-in-out_infinite]">
            <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[rgba(13,13,18,0.6)] mb-2">Today&apos;s Streak</div>
            <div className="font-serif text-[30px] font-bold text-[#0D0D12] tracking-[-1px]">14</div>
            <div className="text-[12px] text-[rgba(13,13,18,0.6)] mt-[3px]">days completed</div>
            <div className="h-1 rounded bg-[#F4F3EF] mt-[10px] overflow-hidden"><div className="h-full rounded bg-gradient-to-r from-brand-rose to-[#F97316] w-[70%]" /></div>
          </div>
          <div className="absolute top-[10px] right-[-20px] w-[185px] bg-white border border-[rgba(13,13,18,0.08)] rounded-[22px] p-5 shadow-[0_12px_40px_rgba(13,13,18,0.08)] z-10 animate-[float2_8s_ease-in-out_infinite]">
            <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[rgba(13,13,18,0.6)] mb-2">AI Mood Read</div>
            <div className="font-serif text-[18px] font-bold text-[#0D0D12] mt-1">Both Happy</div>
            <div className="inline-block bg-[rgba(232,39,75,0.08)] border border-[rgba(232,39,75,0.15)] rounded-full px-3 py-1 text-[11px] font-semibold text-brand-rose mt-[10px]">Adventure task queued</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
