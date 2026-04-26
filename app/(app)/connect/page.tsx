'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Link as LinkIcon, HeartHandshake, Loader2, Heart, AlertCircle, RefreshCw } from 'lucide-react';
import { auth } from '@/utils/firebase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { playSound, SoundType } from '@/utils/sound';

/* ── Helper: authenticated fetch with timeout ── */
async function authFetch(url: string, options: RequestInit = {}, timeoutMs = 20000) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const token = await user.getIdToken(true); // Force refresh for maximum reliability
  if (!token) throw new Error("Could not generate auth token");
  console.log(`[authFetch] Token length: ${token.length}`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    const data = await res.json();
    if (!res.ok) {
      const msg = data.error || data.details || `Request failed (${res.status})`;
      throw new Error(msg);
    }
    return data;
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Connection timed out. The server might be waking up, please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
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
  const fetchAttempted = useRef(false);

  /* ── Fetch existing couple or create a new one via API ── */
  const fetchOrCreateCode = useCallback(async () => {
    setIsGenerating(true);
    setCodeError(null);

    try {
      // 1. Check if user already has a couple
      const getResult = await authFetch("/api/couples");

      if (getResult.couple && getResult.couple.invite_code) {
        setInviteCode(getResult.couple.invite_code);
        // If already active, show success state before redirecting
        if (getResult.couple.status === 'active') {
          setConnectionSuccess(true);
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
          return;
        }
      } else {
        // 2. No couple yet — create one
        const createResult = await authFetch("/api/couples", { method: "POST" });
        setInviteCode(createResult.couple.inviteCode);
      }
    } catch (err: any) {
      console.error("Error fetching/creating code:", err);
      setCodeError(err?.message || "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  }, [router]);

  const { user, loading: authLoading } = useAuth();

  // Auth check and initial fetch
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (!fetchAttempted.current) {
      fetchAttempted.current = true;
      setIsLoading(false);
      fetchOrCreateCode();
    } else {
      setIsLoading(false);
    }
  }, [user, authLoading, router, fetchOrCreateCode]);

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

    setIsConnecting(true);
    setError(null);
    playSound(SoundType.CLICK);

    try {
      await authFetch("/api/couples/join", {
        method: "POST",
        body: JSON.stringify({ inviteCode: partnerCode.trim().toUpperCase() }),
      });

      setConnectionSuccess(true);
      playSound(SoundType.SUCCESS);

      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      console.error("Connection error:", err);
      setError(err?.message || "Failed to connect. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRetryCodeGeneration = () => {
    fetchOrCreateCode();
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
                  <h1 className="text-2xl font-semibold mb-2 text-[#1D1D1F]">Connect with your Partner</h1>
                  <p className="text-[#86868b] text-sm">
                    Link your accounts to start your shared journey on Heart2Heart.
                  </p>
                </div>

                <div className="space-y-8">
                  {/* Share Code Section */}
                  <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-white/50 relative overflow-hidden shadow-sm">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                    <h3 className="text-sm font-medium text-[#86868b] mb-3 flex items-center justify-center gap-2 uppercase tracking-wider">
                      <LinkIcon size={14} /> Share Your Code
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className={`flex-1 bg-white/60 border ${codeError ? 'border-red-200' : 'border-white/80'} rounded-xl px-4 py-3 font-mono text-xl tracking-widest text-center min-h-[64px] flex items-center justify-center shadow-inner`}>
                        {isGenerating ? (
                          <div className="flex items-center gap-2 text-[#86868b] text-sm font-sans tracking-normal">
                            <Loader2 className="w-4 h-4 animate-spin text-brand-rose" />
                            <span>Generating...</span>
                          </div>
                        ) : codeError ? (
                          <div className="flex flex-col gap-1 py-1 px-2">
                            <span className="text-red-500 text-[11px] font-sans tracking-normal font-bold leading-tight uppercase">
                              {codeError.includes("timeout") ? "Timed Out" : "Failed"}
                            </span>
                            <span className="text-[#86868b] text-[10px] font-sans tracking-normal leading-tight">
                              {codeError.includes("timeout") ? "Server is waking up" : codeError}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#1D1D1F] font-bold text-2xl">{inviteCode || '------'}</span>
                        )}
                      </div>
                      
                      <button
                        onClick={codeError ? handleRetryCodeGeneration : handleCopyCode}
                        disabled={isGenerating || (!inviteCode && !codeError)}
                        className={`p-3 rounded-xl transition-all shadow-sm flex items-center justify-center w-14 h-14 flex-shrink-0 disabled:opacity-50 active:scale-95 ${
                          codeError ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-brand-rose text-white hover:bg-brand-rose/90'
                        }`}
                        title={codeError ? "Retry" : "Copy to clipboard"}
                      >
                        {isGenerating ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : codeError ? (
                          <RefreshCw size={24} />
                        ) : (
                          copied ? <Check size={24} /> : <Copy size={24} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-black/5"></div>
                    <span className="flex-shrink-0 mx-4 text-[#86868b] text-[10px] font-bold uppercase tracking-widest">Or</span>
                    <div className="flex-grow border-t border-black/5"></div>
                  </div>

                  {/* Join Section */}
                  <form onSubmit={handleConnect} className="space-y-4">
                    <div className="text-left">
                      <label htmlFor="partnerCode" className="block text-xs font-bold text-[#86868b] mb-2 uppercase tracking-wider ml-1">
                        Enter Partner Code
                      </label>
                      <div className="relative">
                        <input
                          id="partnerCode"
                          type="text"
                          value={partnerCode}
                          onChange={(e) => {
                            setPartnerCode(e.target.value.toUpperCase());
                            if (error) setError(null);
                          }}
                          placeholder="e.g., B4K79Y"
                          className="w-full px-4 py-4 rounded-xl border border-white/80 bg-white/60 focus:bg-white focus:border-brand-rose/30 focus:ring-4 focus:ring-brand-rose/10 outline-none transition-all font-mono text-center tracking-widest uppercase placeholder:text-black/20 shadow-inner text-xl"
                          maxLength={12}
                          disabled={isConnecting}
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-50 text-red-600 text-[13px] py-3 px-4 rounded-xl flex items-center gap-2 border border-red-100 shadow-sm">
                        <AlertCircle size={16} className="flex-shrink-0" />
                        <span className="font-semibold">{error}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!partnerCode.trim() || partnerCode.length < 5 || isConnecting}
                      className="w-full bg-[#1D1D1F] text-white py-4.5 rounded-xl font-bold hover:bg-black transition-all shadow-lg active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <HeartHandshake size={20} />
                          <span>Connect Partner</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard')}
                      className="w-full mt-4 text-[#86868b] text-[11px] font-bold hover:text-[#1D1D1F] transition-colors py-2 uppercase tracking-widest"
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
                <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-sm border border-green-100">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <Heart className="w-12 h-12 fill-current" />
                  </motion.div>
                </div>
                <h2 className="text-2xl font-bold mb-2 text-[#1D1D1F]">Connected Successfully!</h2>
                <p className="text-[#86868b] font-medium">
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
