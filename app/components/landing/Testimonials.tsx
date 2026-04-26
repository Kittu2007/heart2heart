"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    text: "\"The AI actually got us. After just a week of feedback it stopped suggesting outdoor tasks — it figured out we're both homebodies. Wild.\"",
    initials: "SK",
    name: "Sara & Kyle",
    sub: "Engagement score: 94% · London",
    color: "bg-brand-rose",
    featured: false,
  },
  {
    text: "\"Long distance was brutal until we found Heart2Heart. The daily task gave us something to look forward to — a shared experience even 6,000 miles apart.\"",
    initials: "MR",
    name: "Mia & Ryan",
    sub: "Long distance · 22-day streak",
    color: "bg-[#B01D39]",
    featured: true,
  },
  {
    text: "\"The comfort level slider is genius. We started at 2 and worked up to 5 over three months. It's made us more open than we've ever been.\"",
    initials: "JP",
    name: "James & Priya",
    sub: "Married · comfort level 5 · Mumbai",
    color: "bg-[#C8A96E]",
    featured: false,
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.23, 1, 0.32, 1] as const },
  }),
};

export default function Testimonials() {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVis(true); },
      { threshold: 0.1 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="stories" className="py-[80px] md:py-[120px] px-6 md:px-16 relative z-10">
      <div className="max-w-[1240px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-[11px] font-semibold tracking-[0.2em] uppercase text-brand-rose mb-5">
          Real Couples
        </motion.div>
        <motion.h2 initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="font-serif text-[40px] md:text-[58px] font-bold tracking-[-3px] leading-[0.93] text-[#0D0D12]">
          Stories that started<br />with <em className="italic text-brand-rose">one task</em>
        </motion.h2>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-16">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate={vis ? "visible" : "hidden"}
              className={`${t.featured ? "bg-[#0D0D12] border-[rgba(255,255,255,0.06)]" : "bg-white border-[rgba(13,13,18,0.08)]"} border rounded-[28px] p-9 hover:-translate-y-[6px] hover:shadow-[0_20px_60px_rgba(13,13,18,0.07)] transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]`}
            >
              <div className="flex gap-[3px] mb-[18px]">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} size={14} className={t.featured ? "text-[#C8A96E] fill-[#C8A96E]" : "text-brand-rose fill-brand-rose"} />
                ))}
              </div>
              <p className={`text-[15px] font-light leading-[1.7] mb-[22px] italic font-serif ${t.featured ? "text-[rgba(255,255,255,0.8)]" : "text-[#0D0D12]"}`}>
                {t.text}
              </p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-[12px] font-bold text-white shrink-0`}>
                  {t.initials}
                </div>
                <div>
                  <div className={`text-[14px] font-semibold ${t.featured ? "text-white" : "text-[#0D0D12]"}`}>{t.name}</div>
                  <div className={`text-[12px] mt-[2px] ${t.featured ? "text-[rgba(255,255,255,0.4)]" : "text-[rgba(13,13,18,0.6)]"}`}>{t.sub}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
