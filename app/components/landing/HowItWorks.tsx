"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { User, Link2, Radio, Activity } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: User,
    title: "Create your profile",
    desc: "Sign up and complete a 6-step onboarding — love languages, interests, schedule, comfort level. Private to you, always.",
  },
  {
    num: "02",
    icon: Link2,
    title: "Connect your partner",
    desc: "Share a 6-char invite code or a one-tap link. Partner joins and completes their own private onboarding. The AI now knows you both.",
  },
  {
    num: "03",
    icon: Radio,
    title: "Get your daily AI task",
    desc: "Every morning, Gemini AI generates one personalised activity — matched to your moods, love languages, and feedback.",
  },
  {
    num: "04",
    icon: Activity,
    title: "Give feedback, get better",
    desc: "Rate each task. The AI reads your sentiment and adapts — getting smarter every day until tasks feel made for exactly who you are.",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.23, 1, 0.32, 1] as const },
  }),
};

export default function HowItWorks() {
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
    <section id="how" className="py-[80px] md:py-[120px] px-6 md:px-16 relative z-10 overflow-hidden">
      <div className="max-w-[1240px] mx-auto relative z-[1]">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }} className="text-[11px] font-semibold tracking-[0.2em] uppercase text-brand-rose mb-5">
          How It Works
        </motion.div>
        <motion.h2 initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.23, 1, 0.32, 1] }} className="font-serif text-[40px] md:text-[58px] font-bold tracking-[-3px] leading-[0.93] text-[#0D0D12]">
          Four steps to a<br />stronger <em className="italic text-brand-rose">connection</em>
        </motion.h2>

        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-16">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate={vis ? "visible" : "hidden"}
              className="bg-white border border-[rgba(13,13,18,0.08)] rounded-[28px] p-7 relative overflow-hidden hover:-translate-y-[6px] hover:shadow-[0_20px_60px_rgba(13,13,18,0.08)] hover:border-[rgba(232,39,75,0.15)] transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group"
            >
              <div className="font-serif text-[72px] font-bold text-[rgba(232,39,75,0.06)] leading-none absolute -top-2 right-5 pointer-events-none select-none">{s.num}</div>
              <div className="w-12 h-12 rounded-[16px] bg-[rgba(232,39,75,0.07)] flex items-center justify-center mb-5">
                <s.icon size={22} className="text-brand-rose" strokeWidth={2} />
              </div>
              <div className="font-serif text-[19px] font-bold text-[#0D0D12] mb-[10px] tracking-[-0.3px]">{s.title}</div>
              <p className="text-[14px] font-light text-[rgba(13,13,18,0.6)] leading-[1.7]">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
