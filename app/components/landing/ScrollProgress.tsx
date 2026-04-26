"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export default function ScrollProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const p = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      setPct(p);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 h-[2px] z-[600] rounded-r-sm"
      style={{
        width: `${pct}%`,
        background: "linear-gradient(90deg, #E8274B, #F97316, #C8A96E)",
        boxShadow: "0 0 8px rgba(232,39,75,0.4)",
        transition: "width 0.05s linear",
      }}
    />
  );
}
