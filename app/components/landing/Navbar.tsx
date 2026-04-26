"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "How It Works", href: "#how" },
  { label: "Features", href: "#features" },
  { label: "Try It", href: "#demo" },
  { label: "Stories", href: "#stories" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[500] flex justify-between items-center transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          scrolled
            ? "bg-[rgba(250,250,248,0.92)] backdrop-blur-[32px] saturate-[1.4] py-4 px-6 md:px-16 border-b border-[rgba(13,13,18,0.08)] shadow-[0_1px_40px_rgba(13,13,18,0.05)]"
            : "py-6 px-6 md:px-16"
        }`}
      >
        <Link href="/" className="font-serif text-[22px] font-bold text-[#0D0D12] tracking-tight flex items-center gap-[2px] no-underline">
          Heart<span className="text-brand-rose">2</span>Heart
        </Link>

        <div className="hidden lg:flex items-center gap-0 bg-[rgba(13,13,18,0.04)] border border-[rgba(13,13,18,0.08)] rounded-full overflow-hidden">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="px-[22px] py-[9px] text-[13px] font-medium text-[rgba(13,13,18,0.6)] hover:text-[#0D0D12] hover:bg-[rgba(255,255,255,0.7)] transition-all no-underline whitespace-nowrap">
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-[10px]">
          <Link href="/login" className="hidden md:inline-flex text-[13px] font-medium text-[rgba(13,13,18,0.6)] bg-transparent border border-[rgba(13,13,18,0.08)] rounded-full px-[22px] py-[9px] hover:text-[#0D0D12] hover:border-[rgba(13,13,18,0.25)] hover:bg-[rgba(13,13,18,0.03)] transition-all no-underline">
            Log in
          </Link>
          <Link href="/register" className="hidden md:inline-flex text-[13px] font-semibold text-white bg-brand-rose border-none rounded-full px-6 py-[9px] shadow-[0_4px_16px_rgba(232,39,75,0.2)] hover:bg-[#B01D39] hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgba(232,39,75,0.3)] transition-all no-underline tracking-tight">
            Sign In
          </Link>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden flex flex-col items-center justify-center gap-[5px] w-9 h-9 bg-transparent border border-[rgba(13,13,18,0.08)] rounded-[10px] p-0" aria-label="Menu">
            {mobileOpen ? <X size={16} className="text-[#0D0D12]" /> : <Menu size={16} className="text-[#0D0D12]" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="fixed inset-0 z-[490] bg-[#FAFAF8] flex flex-col items-center justify-center gap-8"
          >
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="font-serif text-4xl font-bold text-[#0D0D12] no-underline hover:text-brand-rose transition-colors">
                {l.label}
              </a>
            ))}
            <Link href="/login" onClick={() => setMobileOpen(false)} className="mt-4 bg-brand-rose text-white border-none rounded-full px-12 py-4 text-base font-semibold no-underline">
              Sign In
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
