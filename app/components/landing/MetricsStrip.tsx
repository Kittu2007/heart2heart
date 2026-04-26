"use client";

import { useEffect, useRef, useState } from "react";

function useCountUp(target: number, duration = 1600, start = false) {
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

const metrics = [
  { count: 87, suffix: "%", label: "Task Completion Rate" },
  { count: 12, suffix: "k+", label: "Couples Connected" },
  { count: 6, suffix: " cats", label: "AI Task Categories" },
  { count: 4.9, suffix: "★", label: "Average Rating" },
];

export default function MetricsStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.4 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="bg-[#0D0D12] px-6 md:px-16 relative z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(232,39,75,0.08)_0%,transparent_70%)] pointer-events-none" />
      <div className="max-w-[1240px] mx-auto grid grid-cols-2 md:grid-cols-4">
        {metrics.map((m, i) => (
          <MetricItem key={i} {...m} visible={visible} index={i} />
        ))}
      </div>
    </div>
  );
}

function MetricItem({ count, suffix, label, visible, index }: { count: number; suffix: string; label: string; visible: boolean; index: number }) {
  const [started, setStarted] = useState(false);
  const val = useCountUp(count, 1600, started);

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setStarted(true), index * 130);
      return () => clearTimeout(t);
    }
  }, [visible, index]);

  return (
    <div className={`py-[52px] text-center border-r border-[rgba(255,255,255,0.06)] last:border-r-0 transition-all duration-600 ease-[cubic-bezier(0.23,1,0.32,1)] ${started ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} max-md:border-b max-md:border-[rgba(255,255,255,0.06)] max-md:[&:nth-child(1)]:border-r max-md:[&:nth-child(2)]:border-r-0 max-md:[&:nth-child(3)]:border-b-0 max-md:[&:nth-child(4)]:border-b-0`}>
      <div className="font-serif text-[40px] md:text-[52px] font-bold text-white tracking-[-3px] leading-none mb-[10px]">
        {val}<span className="text-brand-rose">{suffix}</span>
      </div>
      <div className="text-[12px] font-normal text-[rgba(255,255,255,0.3)] tracking-[0.08em] uppercase">{label}</div>
    </div>
  );
}
