"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function AuroraBackground() {
  const auras = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      auras.current.forEach((a) => a && (a.style.opacity = "1"));
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Aurora orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {[
          "w-[900px] h-[700px] bg-[radial-gradient(ellipse,rgba(232,39,75,0.08)_0%,transparent_70%)] -top-[200px] -right-[200px] animate-[af1_22s_ease-in-out_infinite]",
          "w-[700px] h-[600px] bg-[radial-gradient(ellipse,rgba(200,169,110,0.06)_0%,transparent_70%)] -bottom-[100px] -left-[100px] animate-[af2_28s_ease-in-out_infinite]",
          "w-[500px] h-[500px] bg-[radial-gradient(ellipse,rgba(249,115,22,0.04)_0%,transparent_70%)] top-1/2 left-[40%] animate-[af1_18s_ease-in-out_infinite_reverse]",
          "w-[400px] h-[400px] bg-[radial-gradient(ellipse,rgba(124,58,237,0.04)_0%,transparent_70%)] top-[20%] left-[20%] animate-[af2_32s_ease-in-out_infinite]",
        ].map((cls, i) => (
          <div
            key={i}
            ref={(el) => { if (el) auras.current[i] = el; }}
            className={`absolute rounded-full blur-[120px] opacity-0 transition-opacity duration-[2s] ${cls}`}
          />
        ))}
      </div>

      {/* Grain overlay */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "180px",
        }}
      />
    </>
  );
}
