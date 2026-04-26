"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const socials = [
  { label: "Twitter", path: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" },
  { label: "Instagram", path: "M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01", rect: { x: 2, y: 2, width: 20, height: 20, rx: 5 } },
  { label: "LinkedIn", path: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z", circle: { cx: 4, cy: 4, r: 2 } },
];

export default function Footer() {
  return (
    <>
      {/* CTA Section */}
      <section className="py-10 md:py-20 px-6 md:px-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 lg:gap-20 items-center bg-white border border-[rgba(13,13,18,0.08)] rounded-[40px] p-10 md:p-20 shadow-[0_40px_100px_rgba(13,13,18,0.06)] relative overflow-hidden"
        >
          <div className="absolute -right-20 -top-20 w-[400px] h-[400px] rounded-full bg-[radial-gradient(ellipse,rgba(232,39,75,0.06)_0%,transparent_70%)] blur-[40px]" />
          <div className="absolute -left-20 -bottom-20 w-[300px] h-[300px] rounded-full bg-[radial-gradient(ellipse,rgba(200,169,110,0.04)_0%,transparent_70%)] blur-[40px]" />

          <div>
            <h2 className="font-serif text-[36px] md:text-[54px] font-bold tracking-[-3px] leading-[0.93] text-[#0D0D12] mb-5">
              One task a day.<br /><em className="italic text-brand-rose">Infinite</em> closer.
            </h2>
            <p className="text-[17px] font-light text-[rgba(13,13,18,0.6)] leading-[1.7] max-w-[520px]">
              Connect your partner, complete onboarding, and receive your first AI-generated activity within minutes. Everything starts with signing in.
            </p>
          </div>

          <div className="flex flex-col gap-[14px] min-w-[240px] relative z-[1]">
            <Link href="/register" className="bg-brand-rose text-white border-none rounded-full px-9 py-[18px] text-[14px] font-semibold text-center no-underline shadow-[0_8px_24px_rgba(232,39,75,0.25)] hover:bg-[#B01D39] hover:-translate-y-[2px] hover:shadow-[0_14px_32px_rgba(232,39,75,0.35)] transition-all whitespace-nowrap">
              Sign In & Start Together
            </Link>
            <a href="#features" className="bg-transparent text-[#0D0D12] border border-[rgba(13,13,18,0.08)] rounded-full px-9 py-[18px] text-[14px] font-medium text-center no-underline hover:border-brand-rose hover:text-brand-rose transition-all">
              Explore All Features
            </a>
            <div className="text-[12px] text-[rgba(13,13,18,0.6)] text-center">Free plan available · No card required</div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0D0D12] py-16 px-6 md:px-16 relative z-10">
        <div className="max-w-[1240px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10 lg:gap-[60px] pb-[52px] border-b border-[rgba(255,255,255,0.06)] mb-9">
          <div>
            <div className="font-serif text-[22px] font-bold text-white mb-[14px]">
              Heart<span className="text-brand-rose">2</span>Heart
            </div>
            <div className="text-[13px] text-[rgba(255,255,255,0.3)] leading-[1.7] max-w-[240px] mb-6">
              AI-powered daily couple activities that grow stronger the more you use them together.
            </div>
            <div className="flex gap-[10px]">
              {socials.map((s, i) => (
                <a key={i} href="#" aria-label={s.label} className="w-9 h-9 rounded-[10px] bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center hover:bg-[rgba(232,39,75,0.15)] hover:border-[rgba(232,39,75,0.3)] transition-all group">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[rgba(255,255,255,0.4)] group-hover:text-[rgba(255,255,255,0.8)]">
                    {s.rect && <rect x={s.rect.x} y={s.rect.y} width={s.rect.width} height={s.rect.height} rx={s.rect.rx} />}
                    {s.circle && <circle cx={s.circle.cx} cy={s.circle.cy} r={s.circle.r} />}
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {[
            { title: "Product", links: [{ label: "How It Works", href: "#how" }, { label: "Features", href: "#features" }, { label: "Try Demo", href: "#demo" }] },
            { title: "Company", links: [{ label: "About", href: "#" }, { label: "Blog", href: "#" }, { label: "Careers", href: "#" }, { label: "Support", href: "#" }] },
            { title: "Legal", links: [{ label: "Privacy Policy", href: "#" }, { label: "Terms of Service", href: "#" }, { label: "Security", href: "#" }, { label: "Cookie Policy", href: "#" }] },
          ].map((col) => (
            <div key={col.title}>
              <div className="text-[12px] font-bold tracking-[0.1em] uppercase text-[rgba(255,255,255,0.3)] mb-4">{col.title}</div>
              <div className="flex flex-col gap-[10px]">
                {col.links.map((l) => (
                  <a key={l.label} href={l.href} className="text-[13px] text-[rgba(255,255,255,0.3)] no-underline hover:text-[rgba(255,255,255,0.7)] transition-colors">{l.label}</a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-[1240px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-[12px] text-[rgba(255,255,255,0.18)]">© 2026 Heart2Heart · Vibe Coding Hackathon · All rights reserved</div>
          <div className="flex gap-3">
            {["Powered by Gemini", "Built on Supabase", "Deployed on Vercel"].map((b) => (
              <div key={b} className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-full px-[14px] py-[5px] text-[11px] text-[rgba(255,255,255,0.3)]">{b}</div>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}
