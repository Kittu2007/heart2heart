"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  MessageCircle, 
  Sparkles, 
  Gift, 
  Clock, 
  Hand,
  Volume2,
  Ear,
  Shield,
  Loader2,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { auth, db } from "@/utils/firebase/client";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

type LoveLanguage = "Words of Affirmation" | "Acts of Service" | "Receiving Gifts" | "Quality Time" | "Physical Touch" | null;
type CommStyle = "Direct & Clear" | "Gentle & Reassuring" | "Analytical & Logical" | "Expressive & Emotional" | null;

const LOVE_LANGUAGES = [
  { id: "Words of Affirmation", icon: MessageCircle, description: "Unsolicited compliments mean the world." },
  { id: "Quality Time", icon: Clock, description: "Full, undivided attention is essential." },
  { id: "Receiving Gifts", icon: Gift, description: "Visual symbols of love are important." },
  { id: "Acts of Service", icon: Sparkles, description: "Let me do that for you." },
  { id: "Physical Touch", icon: Hand, description: "Hugs, holding hands, and physical presence." },
];

const COMM_STYLES = [
  { id: "Direct & Clear", icon: Volume2, description: "I prefer straight-to-the-point communication." },
  { id: "Gentle & Reassuring", icon: Heart, description: "I need to feel safe and supported first." },
  { id: "Analytical & Logical", icon: Shield, description: "I like to break down problems logically." },
  { id: "Expressive & Emotional", icon: Ear, description: "I process things by sharing my feelings." },
];

export default function OnboardingPage() {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [loveLanguage, setLoveLanguage] = useState<LoveLanguage>(null);
  const [commStyle, setCommStyle] = useState<CommStyle>(null);
  const [comfortLevel, setComfortLevel] = useState<number>(3);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextStep = () => {
    if (step < 3) setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  const handleComplete = async () => {
    const user = auth.currentUser;
    if (!user) {
      console.warn("User not authenticated during onboarding");
      router.push("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Save profile to Firestore (legacy support)
      const savePromise = setDoc(doc(db, "profiles", user.uid), {
        loveLanguage,
        communicationStyle: commStyle,
        comfortLevel,
        onboardingCompleted: true,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // 2. Sync profile to Supabase (essential for API routes)
      const syncProfile = async () => {
        const token = await user.getIdToken();
        const res = await fetch("/api/auth/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: user.displayName || "User",
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Sync failed");
        }
      };

      // Run both in parallel with timeout protection
      await Promise.all([
        Promise.race([
          savePromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore Timeout")), 8000))
        ]),
        Promise.race([
          syncProfile(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Sync Timeout")), 8000))
        ])
      ]);

      router.push("/connect");
    } catch (error) {
      console.error("Onboarding completion error:", error);
      // Proceed to connect anyway, as the connect page now has fallback sync
      router.push("/connect");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#FFF5F5] to-[#FFFBF0] font-sans overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-rose/5 blur-3xl pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-orange-300/10 blur-3xl pointer-events-none" />

      {/* Progress Indicator */}
      <div className="w-full max-w-2xl mb-8 flex items-center justify-between z-10">
        <button 
          onClick={prevStep}
          disabled={step === 1}
          className={`p-2 rounded-full transition-colors ${step === 1 ? 'opacity-0 pointer-events-none' : 'hover:bg-black/5 text-[#86868b]'}`}
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? "w-8 bg-brand-rose" : i < step ? "w-4 bg-brand-rose/40" : "w-4 bg-black/10"
              }`} 
            />
          ))}
        </div>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      <div className="w-full max-w-2xl relative z-10 flex flex-col">
        <AnimatePresence mode="wait" custom={1}>
          {step === 1 && (
            <motion.div
              key="step1"
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full flex flex-col"
            >
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-[#1D1D1F] mb-3">
                  What's your Love Language?
                </h1>
                <p className="text-[#86868b] text-lg">
                  How do you best receive love and appreciation?
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {LOVE_LANGUAGES.map((lang) => {
                  const Icon = lang.icon;
                  const isSelected = loveLanguage === lang.id;
                  return (
                    <button
                      key={lang.id}
                      onClick={() => setLoveLanguage(lang.id as LoveLanguage)}
                      className={`text-left p-5 rounded-[20px] transition-all duration-300 border ${
                        isSelected 
                          ? "bg-white shadow-apple-card-hover border-brand-rose/30 ring-1 ring-brand-rose/20 scale-[1.02]" 
                          : "bg-white/60 backdrop-blur-apple shadow-sm border-white/50 hover:bg-white/80 hover:shadow-apple-card"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors ${
                        isSelected ? "bg-[#FFF0F0] text-brand-rose" : "bg-black/5 text-[#86868b]"
                      }`}>
                        <Icon size={20} />
                      </div>
                      <h3 className={`font-semibold text-lg mb-1 ${isSelected ? "text-[#1D1D1F]" : "text-[#1D1D1F]"}`}>
                        {lang.id}
                      </h3>
                      <p className="text-[#86868b] text-sm line-clamp-2">
                        {lang.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={nextStep}
                disabled={!loveLanguage}
                className="mt-8 w-full sm:w-auto self-center bg-brand-rose text-white px-8 py-3.5 rounded-xl font-semibold shadow-md hover:bg-brand-rose/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Continue <ChevronRight size={18} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full flex flex-col"
            >
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-[#1D1D1F] mb-3">
                  Your Communication Style
                </h1>
                <p className="text-[#86868b] text-lg">
                  When discussing relationship topics, how do you communicate?
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {COMM_STYLES.map((style) => {
                  const Icon = style.icon;
                  const isSelected = commStyle === style.id;
                  return (
                    <button
                      key={style.id}
                      onClick={() => setCommStyle(style.id as CommStyle)}
                      className={`text-left p-5 rounded-[20px] transition-all duration-300 border flex items-center gap-4 ${
                        isSelected 
                          ? "bg-white shadow-apple-card-hover border-brand-rose/30 ring-1 ring-brand-rose/20 scale-[1.01]" 
                          : "bg-white/60 backdrop-blur-apple shadow-sm border-white/50 hover:bg-white/80 hover:shadow-apple-card"
                      }`}
                    >
                      <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center transition-colors ${
                        isSelected ? "bg-[#FFF0F0] text-brand-rose" : "bg-black/5 text-[#86868b]"
                      }`}>
                        <Icon size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-[#1D1D1F]">
                          {style.id}
                        </h3>
                        <p className="text-[#86868b] text-sm">
                          {style.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={nextStep}
                disabled={!commStyle}
                className="mt-8 w-full sm:w-auto self-center bg-brand-rose text-white px-8 py-3.5 rounded-xl font-semibold shadow-md hover:bg-brand-rose/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Continue <ChevronRight size={18} />
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full flex flex-col"
            >
              <div className="mb-10 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-[#1D1D1F] mb-3">
                  Baseline Comfort Level
                </h1>
                <p className="text-[#86868b] text-lg">
                  How comfortable are you discussing deeper emotional topics?
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-apple rounded-[24px] p-8 shadow-apple-card border border-white/50">
                <div className="flex flex-col gap-8">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-medium text-[#86868b]">Reserved</span>
                    <div className="text-4xl font-bold text-brand-rose">{comfortLevel}</div>
                    <span className="text-sm font-medium text-[#86868b]">Very Open</span>
                  </div>
                  
                  <div className="relative w-full h-4">
                    <div className="absolute inset-0 bg-black/5 rounded-full overflow-hidden">
                      <div 
                        className="absolute h-full bg-brand-rose/30 transition-all duration-300"
                        style={{ width: `${((comfortLevel - 1) / 4) * 100}%` }}
                      />
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="5" 
                      step="1"
                      value={comfortLevel}
                      onChange={(e) => setComfortLevel(parseInt(e.target.value))}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                    />
                    {/* Custom thumb */}
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md border-2 border-brand-rose pointer-events-none transition-all duration-300 z-0 flex items-center justify-center"
                      style={{ left: `calc(${((comfortLevel - 1) / 4) * 100}% - 16px)` }}
                    >
                      <div className="w-2 h-2 rounded-full bg-brand-rose" />
                    </div>
                  </div>

                  <div className="text-center mt-2">
                    <p className="text-[#1D1D1F] font-medium">
                      {comfortLevel === 1 && "I prefer to keep things light initially."}
                      {comfortLevel === 2 && "I need time to warm up to deep topics."}
                      {comfortLevel === 3 && "I'm comfortable with moderate emotional depth."}
                      {comfortLevel === 4 && "I enjoy discussing deeper feelings."}
                      {comfortLevel === 5 && "I'm an open book and love deep talks."}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="mt-10 w-full bg-brand-rose text-white px-8 py-4 rounded-xl font-semibold shadow-md hover:bg-brand-rose/90 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2 text-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Finalizing Profile...
                  </>
                ) : (
                  "Save & Continue"
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
