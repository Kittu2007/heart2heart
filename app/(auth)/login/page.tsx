"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Heart, Sparkles, Home } from "lucide-react";
import { auth } from "@/utils/firebase/client";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";

/* ───────────────────────── shared ease ───────────────────────── */
const EASE = [0.23, 1, 0.32, 1] as const;
const rise = (d: number) => ({
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: d, ease: EASE } },
});

/* ═══════════════════════════════════════════════════════════════
   AuthLayout — aurora background + ambient orbs + header
   ═══════════════════════════════════════════════════════════════ */
function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9F7] text-[#1a1c1b] relative overflow-hidden font-sans w-full">
      {/* Aurora background */}
      <div className="aurora-bg absolute inset-0 -z-10 w-full h-full overflow-hidden" />

      {/* Ambient orbs */}
      <div className="absolute top-1/4 -left-1/4 lg:left-1/4 w-[80vw] max-w-96 h-[80vw] max-h-96 bg-brand-rose/5 rounded-full blur-[100px] -z-10 mix-blend-multiply" />
      <div className="absolute bottom-1/4 -right-1/4 lg:right-1/4 w-[100vw] max-w-[500px] h-[100vw] max-h-[500px] bg-brand-rose/10 rounded-full blur-[120px] -z-10 mix-blend-multiply" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-[20px] border-b border-[rgba(232,39,75,0.06)] shadow-[0_4px_24px_rgba(0,0,0,0.04)] w-full">
        <div className="max-w-[1200px] mx-auto px-4 md:px-12 h-16 flex items-center justify-between w-full">
          <Link href="/" className="text-2xl font-extrabold tracking-tight text-[#1a1c1b] no-underline font-[family-name:var(--font-heading)] flex-shrink-0">
            Heart<span className="text-brand-rose">2</span>Heart
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-[#57534e] hover:text-brand-rose transition-colors text-[15px] md:text-[17px] font-semibold tracking-[-0.01em] no-underline flex-shrink-0">
            <Home size={16} />
            <span className="hidden sm:inline">Homepage</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-grow flex flex-col pt-[100px] pb-12 px-4 md:px-8 relative w-full max-w-[1200px] mx-auto min-h-[calc(100vh-100px)]">
        {children}
      </main>

      {/* Footer */}
      <footer className="text-sm bg-[#fafaf8] text-[#78716c] w-full py-12 px-6 border-t border-[#e7e5e4]">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-lg font-bold text-[#1a1c1b]">Heart<span className="text-brand-rose">2</span>Heart</div>
          <div className="text-[#a8a29e] text-center md:text-left">© 2026 Heart2Heart. Crafted for connection.</div>
          <div className="flex flex-wrap justify-center gap-4">
            {["Privacy", "Terms", "Safety", "Contact"].map((l) => (
              <a key={l} href="#" className="text-[#a8a29e] hover:text-brand-rose transition-colors no-underline">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   InteractiveVisual — 3D glass heart + floating decorative orbs
   ═══════════════════════════════════════════════════════════════ */
function InteractiveVisual() {
  return (
    <motion.div
      variants={rise(0.1)}
      initial="hidden"
      animate="visible"
      className="hidden lg:flex flex-col justify-center items-center h-full relative"
    >
      {/* Glass heart container */}
      <div className="heart-container relative w-[400px] h-[400px] cursor-pointer">
        {/* Heart SVG visual with glow */}
        <div className="heart-image w-full h-full flex items-center justify-center">
          <svg
            viewBox="0 0 200 200"
            className="w-[280px] h-[280px] drop-shadow-[0_0_60px_rgba(232,39,75,0.15)]"
          >
            <defs>
              <radialGradient id="heartGlow" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="rgba(255,178,183,0.9)" />
                <stop offset="50%" stopColor="rgba(232,39,75,0.4)" />
                <stop offset="100%" stopColor="rgba(232,39,75,0.05)" />
              </radialGradient>
              <filter id="blur">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
              </filter>
            </defs>
            {/* Outer glow */}
            <path
              d="M100 180 C60 140 10 110 10 70 C10 30 40 10 70 10 C85 10 95 20 100 30 C105 20 115 10 130 10 C160 10 190 30 190 70 C190 110 140 140 100 180Z"
              fill="url(#heartGlow)"
              filter="url(#blur)"
              opacity="0.6"
            />
            {/* Main heart */}
            <path
              d="M100 170 C65 135 20 105 20 70 C20 38 45 18 70 18 C85 18 95 28 100 38 C105 28 115 18 130 18 C155 18 180 38 180 70 C180 105 135 135 100 170Z"
              fill="rgba(232,39,75,0.12)"
              stroke="rgba(232,39,75,0.25)"
              strokeWidth="1.5"
            />
            {/* Glass highlight */}
            <ellipse
              cx="85"
              cy="55"
              rx="25"
              ry="18"
              fill="rgba(255,255,255,0.35)"
              transform="rotate(-15 85 55)"
            />
          </svg>
        </div>

        {/* Floating decorative elements */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 right-10 w-16 h-16 rounded-full glass-card border border-white/60 shadow-xl flex items-center justify-center"
        >
          <Heart size={22} className="text-brand-rose fill-brand-rose" />
        </motion.div>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-20 left-10 w-12 h-12 rounded-full glass-card border border-white/60 shadow-xl flex items-center justify-center"
        >
          <Sparkles size={18} className="text-[#5f5e60]" />
        </motion.div>
      </div>

      {/* Tagline */}
      <div className="mt-8 text-center max-w-md">
        <h2 className="text-[32px] font-bold tracking-[-0.01em] leading-[1.2] gradient-text mb-2">
          A Digital Sanctuary
        </h2>
        <p className="text-[19px] leading-[1.5] text-[#5b4041]">
          Where connection meets elegance. Step into a space designed for meaningful relationships.
        </p>
      </div>
    </motion.div>
  );
}

/* ── Friendly error messages ── */
function getAuthErrorMessage(code: string): string {
  switch (code) {
    case "auth/popup-blocked":
      return "Pop-up was blocked by your browser. Trying redirect instead...";
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled. Please try again.";
    case "auth/cancelled-popup-request":
      return "Only one sign-in window allowed at a time.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized for sign-in. Please contact support.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email using a different sign-in method.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again in a few minutes.";
    default:
      return "Sign-in failed. Please try again.";
  }
}

/* ═══════════════════════════════════════════════════════════════
   SignInForm — email/password + Google auth (popup + redirect)
   ═══════════════════════════════════════════════════════════════ */
function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle redirect result when page loads (after signInWithRedirect)
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          router.push("/dashboard");
        }
      })
      .catch((err) => {
        if (err?.code && err.code !== "auth/popup-closed-by-user") {
          setError(getAuthErrorMessage(err.code));
        }
      });
  }, [router]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(getAuthErrorMessage(err?.code || ""));
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      // Try popup first (works on desktop browsers)
      await signInWithPopup(auth, provider);
      router.push("/dashboard");
    } catch (err: any) {
      const code = err?.code || "";

      // If popup was blocked or failed, fall back to redirect
      if (
        code === "auth/popup-blocked" ||
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request"
      ) {
        try {
          // Redirect-based flow — page will reload after Google auth
          await signInWithRedirect(auth, provider);
          // This line won't execute — browser navigates away
          return;
        } catch (redirectErr: any) {
          setError(getAuthErrorMessage(redirectErr?.code || ""));
          setIsLoading(false);
          return;
        }
      }

      setError(getAuthErrorMessage(code));
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      variants={rise(0.2)}
      initial="hidden"
      animate="visible"
      className="w-full max-w-md mx-auto lg:ml-auto"
    >
      <div className="glass-card rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-[0_20px_40px_-15px_rgba(232,39,75,0.05)] border border-white/80">
        {/* Header */}
        <div className="text-center mb-2">
          <h1 className="text-2xl md:text-[32px] font-bold tracking-tight text-[#1a1c1b] mb-1 leading-[1.2]">
            Welcome Back
          </h1>
          <p className="text-sm md:text-base text-[#5b4041]">
            Sign in to continue to your sanctuary.
          </p>
        </div>

        {/* Social Logins */}
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="social-btn flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm md:text-[17px] text-[#1a1c1b] font-semibold tracking-[-0.01em] group border border-[rgba(227,189,191,0.3)] hover:bg-white/50 transition-colors"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-[rgba(227,189,191,0.3)]" />
          <span className="flex-shrink-0 mx-4 text-[rgba(91,64,65,0.7)] text-[13px] font-medium tracking-[0.05em] uppercase">
            Or continue with email
          </span>
          <div className="flex-grow border-t border-[rgba(227,189,191,0.3)]" />
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-[13px] border border-red-100 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}
          {/* Email */}
          <div className="w-full">
            <label htmlFor="email" className="text-[13px] font-medium text-[#5b4041] mb-1.5 block ml-1 tracking-[0.05em]">
              Email Address
            </label>
            <div className="relative flex items-center group w-full">
              <Mail size={20} className="absolute left-4 text-[rgba(91,64,65,0.5)] group-focus-within:text-brand-rose transition-colors" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@example.com"
                required
                className="glass-input w-full pl-12 pr-4 py-3.5 rounded-xl text-base text-[#1a1c1b] placeholder:text-[rgba(91,64,65,0.4)] focus:outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div className="w-full">
            <label htmlFor="password" className="text-[13px] font-medium text-[#5b4041] mb-1.5 ml-1 tracking-[0.05em] flex justify-between">
              Password
              <a href="#" className="text-brand-rose hover:text-[#B01D39] transition-colors no-underline">
                Forgot Password?
              </a>
            </label>
            <div className="relative flex items-center group w-full">
              <Lock size={20} className="absolute left-4 text-[rgba(91,64,65,0.5)] group-focus-within:text-brand-rose transition-colors" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="glass-input w-full pl-12 pr-12 py-3.5 rounded-xl text-base text-[#1a1c1b] placeholder:text-[rgba(91,64,65,0.4)] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-[rgba(91,64,65,0.5)] hover:text-brand-rose transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="primary-btn mt-2 w-full bg-gradient-to-r from-brand-rose to-[#ff4b6d] text-white py-4 rounded-xl text-[17px] font-semibold tracking-[-0.01em] shadow-[0_8px_16px_rgba(232,39,75,0.2)] relative overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
          </button>
        </form>

        {/* Register link */}
        <div className="text-center mt-1">
          <p className="text-sm md:text-base text-[#5b4041]">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-brand-rose font-semibold hover:text-[#B01D39] transition-colors no-underline relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-brand-rose after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Page Export
   ═══════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  return (
    <AuthLayout>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full flex-grow items-center">
        <InteractiveVisual />
        <SignInForm />
      </div>
    </AuthLayout>
  );
}
