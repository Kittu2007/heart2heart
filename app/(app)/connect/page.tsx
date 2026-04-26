'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Link as LinkIcon, HeartHandshake, Loader2, Heart, AlertCircle } from 'lucide-react';
import { auth, db } from '@/utils/firebase/client';
import { onAuthStateChanged, User } from 'firebase/auth';
import { playSound, SoundType } from '@/utils/sound';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc,
  serverTimestamp 
} from 'firebase/firestore';

/* ── Helper: race a promise against a timeout ── */
function withTimeout<T>(promise: Promise<T>, ms: number, label = "Request"): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

export default function ConnectPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [partnerCode, setPartnerCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* ── Generate or retrieve the user's invite code ── */
  const fetchOrCreateCode = useCallback(async (user: User) => {
    setIsGenerating(true);
    setCodeError(null);

    try {
      // Use single-field query (no composite index needed)
      const q = query(
        collection(db, "couples"),
        where("partner_a_id", "==", user.uid)
      );
      const snapshot = await withTimeout(getDocs(q), 10000, "Fetching invite code");

      // Filter for pending status client-side
      const pendingDoc = snapshot.docs.find((d) => d.data().status === "pending");

      if (pendingDoc) {
        setInviteCode(pendingDoc.data().code);
      } else {
        // Generate a new 6-char code
        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        await withTimeout(
          addDoc(collection(db, "couples"), {
            code: newCode,
            partner_a_id: user.uid,
            partner_b_id: null,
            status: "pending",
            createdAt: serverTimestamp(),
          }),
          10000,
          "Creating invite code"
        );
        setInviteCode(newCode);
      }
    } catch (err: any) {
      console.error("Error fetching/creating code:", err);
      // Show a visible error so the user isn't stuck on a spinner
      setCodeError(
        err?.message?.includes("timed out")
          ? "Request timed out. Check your connection and refresh."
          : "Could not generate your code. Please refresh the page."
      );
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Auth check and fetch code
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      } else {
        setIsLoading(false);
        fetchOrCreateCode(user);
      }
    });

    return () => unsubscribe();
  }, [router, fetchOrCreateCode]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      playSound(SoundType.CLICK);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerCode.trim() || partnerCode.length < 5) return;

    const user = auth.currentUser;
    if (!user) return;

    setIsConnecting(true);
    setError(null);
    playSound(SoundType.CLICK);

    try {
      // Single-field query on "code" (no composite index needed)
      const q = query(
        collection(db, "couples"),
        where("code", "==", partnerCode.trim().toUpperCase())
      );
      const snapshot = await withTimeout(getDocs(q), 10000, "Looking up partner code");

      // Filter for pending status client-side
      const pendingDoc = snapshot.docs.find((d) => d.data().status === "pending");

      if (!pendingDoc) {
        setError("Invalid or expired code.");
        setIsConnecting(false);
        return;
      }

      const coupleData = pendingDoc.data();

      if (coupleData.partner_a_id === user.uid) {
        setError("You cannot connect with your own code.");
        setIsConnecting(false);
        return;
      }

      // Update document to link users
      await withTimeout(
        updateDoc(doc(db, "couples", pendingDoc.id), {
          partner_b_id: user.uid,
          status: "active",
          connectedAt: serverTimestamp(),
        }),
        10000,
        "Linking accounts"
      );

      // Update profiles to link to this coupleId (best-effort, don't block on failure)
      try {
        await Promise.all([
          updateDoc(doc(db, "profiles", user.uid), { coupleId: pendingDoc.id }),
          updateDoc(doc(db, "profiles", coupleData.partner_a_id), { coupleId: pendingDoc.id }),
        ]);
      } catch (profileErr) {
        console.warn("Profile link update failed (non-critical):", profileErr);
      }

      setConnectionSuccess(true);
      playSound(SoundType.SUCCESS);
      
      // Route to dashboard after success message
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      console.error("Connection error:", err);
      setError(
        err?.message?.includes("timed out")
          ? "Request timed out. Check your connection and try again."
          : "Failed to connect. Please try again."
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRetryCodeGeneration = () => {
    const user = auth.currentUser;
    if (user) fetchOrCreateCode(user);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen aurora-bg flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-brand-rose" />
      </div>
    );
  }

  return (
    <div className="min-h-screen aurora-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative floating elements */}
      <div className="absolute top-20 left-10 md:left-20 text-brand-rose/20 animate-pulse-slow">
        <Heart size={64} />
      </div>
      <div className="absolute bottom-20 right-10 md:right-20 text-brand-rose/20 animate-pulse-slow" style={{ animationDelay: '1s' }}>
        <Heart size={48} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card shadow-apple-card rounded-3xl p-8 md:p-10 text-center">
          
          <AnimatePresence mode="wait">
            {!connectionSuccess ? (
              <motion.div
                key="connect-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <div className="mx-auto bg-brand-rose/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 text-brand-rose">
                    <HeartHandshake size={32} />
                  </div>
                  <h1 className="text-2xl font-semibold mb-2">Connect with your Partner</h1>
                  <p className="text-on-surface/60 text-sm">
                    Link your accounts to start your shared journey on Heart2Heart.
                  </p>
                </div>

                <div className="space-y-8">
                  {/* Share Code Section */}
                  <div className="bg-surface-container/30 rounded-2xl p-6 border border-white/10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                    <h3 className="text-sm font-medium text-on-surface/70 mb-3 flex items-center justify-center gap-2">
                      <LinkIcon size={16} /> Share Your Code
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-background/50 border border-white/10 rounded-xl px-4 py-3 font-mono text-xl tracking-widest text-center min-h-[56px] flex items-center justify-center">
                        {isGenerating ? (
                          <Loader2 className="w-5 h-5 animate-spin text-brand-rose/40" />
                        ) : codeError ? (
                          <span className="text-red-400 text-sm font-sans tracking-normal">{codeError}</span>
                        ) : (
                          inviteCode || '------'
                        )}
                      </div>
                      {codeError ? (
                        <button
                          onClick={handleRetryCodeGeneration}
                          className="bg-brand-rose text-white p-3 rounded-xl hover:bg-brand-rose/90 transition-colors shadow-sm flex items-center justify-center w-12 h-12 flex-shrink-0"
                          title="Retry"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
                        </button>
                      ) : (
                        <button
                          onClick={handleCopyCode}
                          disabled={isGenerating || !inviteCode}
                          className="bg-brand-rose text-white p-3 rounded-xl hover:bg-brand-rose/90 transition-colors shadow-sm flex items-center justify-center w-12 h-12 flex-shrink-0 disabled:opacity-50"
                          title="Copy to clipboard"
                        >
                          {copied ? <Check size={20} /> : <Copy size={20} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink-0 mx-4 text-on-surface/40 text-xs font-medium uppercase tracking-wider">Or</span>
                    <div className="flex-grow border-t border-white/10"></div>
                  </div>

                  {/* Join Section */}
                  <form onSubmit={handleConnect} className="space-y-4">
                    <div>
                      <label htmlFor="partnerCode" className="block text-sm font-medium text-on-surface/70 mb-2 text-left">
                        Enter Partner Code
                      </label>
                      <input
                        id="partnerCode"
                        type="text"
                        value={partnerCode}
                        onChange={(e) => {
                          setPartnerCode(e.target.value.toUpperCase());
                          if (error) setError(null);
                        }}
                        placeholder="e.g., B4K79Y"
                        className="glass-input w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 focus:bg-white/10 focus:border-brand-rose/50 focus:ring-2 focus:ring-brand-rose/20 outline-none transition-all font-mono text-center tracking-widest uppercase placeholder:text-on-surface/30 placeholder:tracking-normal placeholder:normal-case"
                        maxLength={8}
                        disabled={isConnecting}
                      />
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm py-2 px-4 rounded-xl flex items-center gap-2">
                        <AlertCircle size={16} className="flex-shrink-0" />
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!partnerCode.trim() || partnerCode.length < 5 || isConnecting}
                      className="w-full bg-on-surface text-background py-3.5 rounded-xl font-medium hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isConnecting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        'Connect Partner'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard')}
                      className="w-full mt-4 text-[#78716c] text-sm font-medium hover:text-[#1a1c1b] transition-colors py-2"
                    >
                      Skip for now, continue to Dashboard
                    </button>
                  </form>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success-message"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, type: "spring" }}
                className="py-12 flex flex-col items-center justify-center"
              >
                <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6">
                  <Heart className="w-10 h-10 fill-current animate-pulse-slow" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Connected Successfully!</h2>
                <p className="text-on-surface/60">
                  Preparing your shared space...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
