"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db, rtdb } from "@/utils/firebase/client";
import { useAuth } from "@/lib/contexts/auth-context";
import {
  collection, addDoc, serverTimestamp, doc, updateDoc,
  onSnapshot, query, where, limit, setDoc
} from "firebase/firestore";
import { ref, onValue } from "firebase/database";
import TopNavBar from "@/app/components/dashboard/TopNavBar";
import ConnectionScoreCard from "@/app/components/dashboard/ConnectionScoreCard";
import DailyTaskCard, { Task } from "@/app/components/dashboard/DailyTaskCard";
import MoodSelector from "@/app/components/dashboard/MoodSelector";

import PartnerStatus from "@/app/components/dashboard/PartnerStatus";
import FeedbackModal from "@/app/components/dashboard/FeedbackModal";
import CouplesFeatures from "@/app/components/dashboard/CouplesFeatures";
import { playSound, SoundType } from "@/utils/sound";
import { HeartHandshake } from "lucide-react";

interface Feedback { rating: number; feelings: string[]; comment: string; }
interface Partner {
  name: string; isOnline: boolean; lastSeen?: string;
  taskCompleted: boolean; photoUrl?: string; mood?: string; moodEmoji?: string; _lastSeenDate?: Date;
}

async function authFetch(url: string, options: RequestInit = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const token = await user.getIdToken(true);
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export default function DashboardPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [dailyTask, setDailyTask] = useState<Task>({
    title: "Plan Date Night",
    description: "It's your turn to plan something special for this weekend.",
    category: "communication", intensity: 3,
  });
  const [selectedMood, setSelectedMood] = useState("Happy");
  const [shareWithPartner, setShareWithPartner] = useState(false);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [isPartnerLoading, setIsPartnerLoading] = useState(true);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [hasCompletedTask, setHasCompletedTask] = useState(false);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [dbId, setDbId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [coupleStatus, setCoupleStatus] = useState<string | null>(null);
  const [partnerDbId, setPartnerDbId] = useState<string | null>(null);
  const [connectionScore, setConnectionScore] = useState(0);
  const [reflection, setReflection] = useState("");
  const [showPartnerJoinedToast, setShowPartnerJoinedToast] = useState(false);

  const coupleStatusRef = useRef<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // ── Fetch couple from Supabase ───────────────────────────────────────
  const fetchCoupleFromSupabase = useCallback(async (isPolling = false) => {
    try {
      const result = await authFetch("/api/couples");
      const couple = result.couple;
      const currentDbId: string | undefined = result.currentUserDbId;
      
      if (currentDbId) setDbId(currentDbId);

      if (!couple) { 
        if (!isPolling) setIsPartnerLoading(false); 
        setCoupleId(null);
        setCoupleStatus(null);
        setPartner(null);
        return; 
      }

      const prevStatus = coupleStatusRef.current;
      const newStatus = couple.status;

      setCoupleId(couple.id);
      setInviteCode(couple.invite_code);
      setCoupleStatus(newStatus);
      coupleStatusRef.current = newStatus;

      // Determine partner profile from Supabase join
      let partnerProfile: { id: string; name: string; avatar_url: string | null } | null = null;
      let resolvedPartnerDbId: string | null = null;

      const partnerAId = couple.partner_a?.id || couple.partner_a_id;
      const partnerBId = couple.partner_b?.id || couple.partner_b_id;

      if (currentDbId && partnerAId && partnerBId) {
        if (partnerAId === currentDbId) {
          partnerProfile = couple.partner_b || null;
          resolvedPartnerDbId = partnerBId;
        } else {
          partnerProfile = couple.partner_a || null;
          resolvedPartnerDbId = partnerAId;
        }
      } else if (partnerAId && partnerAId !== currentDbId) {
        partnerProfile = couple.partner_a || null;
        resolvedPartnerDbId = partnerAId;
      }

      if (resolvedPartnerDbId) setPartnerDbId(resolvedPartnerDbId);

      // Populate partner from Supabase immediately when active
      if (newStatus === "active" && partnerProfile) {
        if (prevStatus !== "active" && prevStatus !== null) {
          setShowPartnerJoinedToast(true);
          playSound(SoundType.SUCCESS);
          setTimeout(() => setShowPartnerJoinedToast(false), 5000);
        }
        setPartner(prev => ({
          name: partnerProfile!.name || "Partner",
          isOnline: prev?.isOnline ?? false,
          taskCompleted: prev?.taskCompleted ?? false,
          photoUrl: (partnerProfile!.avatar_url ?? prev?.photoUrl) || undefined,
          lastSeen: prev?.lastSeen,
          mood: prev?.mood,
          moodEmoji: prev?.moodEmoji,
          _lastSeenDate: prev?._lastSeenDate,
        }));
        // Stop polling if active
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      }

      if (!isPolling) setIsPartnerLoading(false);
    } catch (err) {
      console.error("[Dashboard] Supabase fetch error:", err);
      if (!isPolling) setIsPartnerLoading(false);
    }
  }, []);

  // ── RTDB Presence for Current User ───────────────────────────────────
  useEffect(() => {
    // This is handled in the root layout or AuthProvider normally,
    // but we ensure it's here for the dashboard specifically if needed.
    // (Actual setup is in lib/auth/presence.ts or similar)
  }, [currentUser]);

  // ── NEW: Firestore real-time listener for couple status ────────────────
  useEffect(() => {
    if (!currentUser || !coupleId) return;
    
    const unsub = onSnapshot(doc(db, "couples", coupleId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.status && data.status !== coupleStatus) {
          setCoupleStatus(data.status);
          coupleStatusRef.current = data.status;
          
          if (data.status === 'active') {
            fetchCoupleFromSupabase(false);
          }
        }
        
        // Real-time task completion sync
        if (data.taskCompleted === true) {
          setPartner(prev => prev ? { ...prev, taskCompleted: true } : prev);
        }
      } else {
        if (coupleStatusRef.current !== null) {
          setCoupleStatus(null);
          setCoupleId(null);
          setPartner(null);
          setPartnerDbId(null);
          setInviteCode(null);
          coupleStatusRef.current = null;
          fetchCoupleFromSupabase(false);
        }
      }
    });
    
    return () => unsub();
  }, [currentUser, coupleId, fetchCoupleFromSupabase, coupleStatus]);

  // ── Primary: Supabase couple fetch + polling ──────────────────────────
  useEffect(() => {
    if (!currentUser || authLoading) return;
    
    if (!coupleId && !coupleStatus) {
      setIsPartnerLoading(true);
    }

    fetchCoupleFromSupabase(false).then(() => {
      if (pollRef.current) clearInterval(pollRef.current);
      
      if (coupleStatusRef.current !== "active") {
        pollRef.current = setInterval(() => fetchCoupleFromSupabase(true), 5000);
      }
    });
    
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [currentUser, authLoading, fetchCoupleFromSupabase]);

  // ── Fetch Daily Task ──────────────────────────────────────────────────
  useEffect(() => {
    if (coupleStatus === "active") {
      authFetch("/api/tasks")
        .then(res => {
          if (res.task) {
            setDailyTask(res.task);
            setHasCompletedTask(res.task.completed);
          }
        })
        .catch(err => console.error("[Dashboard] Failed to fetch task:", err));
    }
  }, [coupleStatus]);

  // ── Secondary: RTDB Presence for Partner ─────────────────────────────
  useEffect(() => {
    if (!currentUser || !partnerDbId || !coupleId) return;
    const cleanups: (() => void)[] = [];

    // Find partner's Firebase UID from their profile doc
    const pQ = query(collection(db, "profiles"), where("dbId", "==", partnerDbId), limit(1));
    const profileUnsub = onSnapshot(pQ, snap => {
      if (!snap.empty) {
        const partnerUid = snap.docs[0].id;
        const presenceRef = ref(rtdb, 'presence/' + partnerUid);
        
        const rtdbUnsub = onValue(presenceRef, (presenceSnap) => {
          const status = presenceSnap.val();
          setPartner(prev => prev ? { 
            ...prev, 
            isOnline: status === 'online',
            lastSeen: status === 'online' ? 'Online' : (status === 'offline' ? 'Offline' : prev.lastSeen)
          } : prev);
        });
        cleanups.push(() => rtdbUnsub());
      }
    });
    cleanups.push(profileUnsub);

    return () => cleanups.forEach(fn => fn());
  }, [currentUser, partnerDbId, coupleId]);

  // ── Fetch Partner Mood (Supabase) ────────────────────────────────────
  useEffect(() => {
    if (!currentUser || !partnerDbId || coupleStatus !== "active") return;

    const fetchPartnerMood = async () => {
      try {
        const res = await authFetch("/api/mood");
        if (res.partner && res.partner.length > 0) {
          const latest = res.partner[0];
          setPartner(prev => prev ? { 
            ...prev, 
            mood: latest.mood, 
            moodEmoji: latest.emoji 
          } : null);
        }
      } catch (err) {
        console.error("[Dashboard] Partner mood fetch error:", err);
      }
    };

    fetchPartnerMood();
    const t = setInterval(fetchPartnerMood, 30000);
    return () => clearInterval(t);
  }, [currentUser, partnerDbId, coupleStatus]);


  // ── Connection score (Firestore) ─────────────────────────────────────
  useEffect(() => {
    if (!currentUser || !coupleId) return;
    const unsub = onSnapshot(query(collection(db, "feedback"), where("coupleId", "==", coupleId)), snap => {
      if (snap.empty) { setConnectionScore(0); return; }
      const sorted = snap.docs.map(d => d.data()).sort((a, b) => (b.submittedAt?.toDate()?.getTime() || 0) - (a.submittedAt?.toDate()?.getTime() || 0)).slice(0, 20);
      let total = 0; sorted.forEach(d => total += d.rating || 0);
      setConnectionScore(Math.min(100, Math.floor((total / sorted.length / 5) * 80 + sorted.length * 2)));
    }, () => setConnectionScore(0));
    return () => unsub();
  }, [currentUser, coupleId]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleTaskComplete = useCallback(async () => {
    if (!currentUser || !coupleId) return;
    setIsActionLoading(true);
    
    try {
      // 1. Update Supabase via API
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ taskId: (dailyTask as any).id })
      });

      if (!res.ok) throw new Error("Failed to update Supabase");

      // 2. Firestore updates for real-time sync
      await setDoc(doc(db, "couples", coupleId), { 
        taskCompleted: true, 
        updatedAt: serverTimestamp() 
      }, { merge: true });

      await addDoc(collection(db, "completed_tasks"), { 
        userId: currentUser.uid, 
        task: dailyTask, 
        reflection, 
        completedAt: serverTimestamp() 
      });

      setHasCompletedTask(true); 
      setIsFeedbackModalOpen(true); 
      playSound(SoundType.SUCCESS);
    } catch (err) {
      console.error("[Dashboard] Task completion failed:", err);
    } finally {
      setIsActionLoading(false);
    }
  }, [currentUser, dailyTask, reflection, coupleId]);

  const handleFeedbackSubmit = useCallback(async (feedback: Feedback) => {
    if (!currentUser || !coupleId || !dbId) return;
    try {
      await addDoc(collection(db, "feedback"), { 
        userId: dbId, 
        taskId: dailyTask.title, 
        rating: feedback.rating, 
        feelings: feedback.feelings, 
        comment: feedback.comment, 
        coupleId, 
        submittedAt: serverTimestamp() 
      });
      
      setHasCompletedTask(false); 
      setIsFeedbackModalOpen(false); 
      setReflection("");
      playSound(SoundType.SUCCESS);
    } catch (error) {
      console.error("Feedback submission failed:", error);
      setIsFeedbackModalOpen(false);
    }
  }, [currentUser, dailyTask, coupleId, dbId]);

  const [selectedEmoji, setSelectedEmoji] = useState("😊");

  // ── Fetch current mood ────────────────────────────────────────────────
  useEffect(() => {
    if (coupleStatus === "active") {
      authFetch("/api/mood?latest=true")
        .then(res => {
          if (res.latest) {
            setSelectedMood(res.latest.mood);
            setSelectedEmoji(res.latest.emoji || "😊");
            setShareWithPartner(res.latest.share_with_partner);
          }
        })
        .catch(err => console.error("[Dashboard] Failed to fetch latest mood:", err));
    }
  }, [coupleStatus]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleMoodChange = useCallback(async (mood: string, emoji?: string, isCustom?: boolean) => {
    setSelectedMood(mood);
    if (emoji) setSelectedEmoji(emoji);
    playSound(SoundType.POP);
    
    if (!currentUser) return;
    try {
      await authFetch("/api/mood", {
        method: "POST",
        body: JSON.stringify({
          mood,
          emoji: emoji || selectedEmoji,
          isCustom: !!isCustom,
          shareWithPartner
        })
      });
    } catch (err) {
      console.error("[Dashboard] Mood update failed:", err);
    }
  }, [currentUser, shareWithPartner, selectedEmoji]);

  const handleShareToggle = useCallback(async (shared: boolean) => {
    setShareWithPartner(shared);
    if (!currentUser) return;
    try {
      await authFetch("/api/mood", {
        method: "POST",
        body: JSON.stringify({
          mood: selectedMood,
          emoji: selectedEmoji,
          shareWithPartner: shared
        })
      });
    } catch (err) {
      console.error("[Dashboard] Share toggle update failed:", err);
    }
  }, [currentUser, selectedMood, selectedEmoji]);

  const handleUpdateTask = useCallback((t: Task) => setDailyTask(t), []);

  const handleDisconnect = useCallback(async () => {
    if (!currentUser) return;
    setIsActionLoading(true);
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/couples", { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed to disconnect"); }
      playSound(SoundType.SUCCESS);
      setPartner(null); 
      setCoupleId(null); 
      setCoupleStatus(null); 
      setPartnerDbId(null); 
      coupleStatusRef.current = null;
    } catch (err: any) { 
      alert(err.message || "Failed to disconnect."); 
    } finally { 
      setIsActionLoading(false); 
    }
  }, [currentUser]);

  const handleJoin = useCallback(async (code: string) => {
    if (!currentUser) return;
    setIsActionLoading(true);
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/couples/join", { 
        method: "POST", 
        headers: { 
          Authorization: `Bearer ${token}`, 
          "Content-Type": "application/json" 
        }, 
        body: JSON.stringify({ inviteCode: code }) 
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed to join"); }
      playSound(SoundType.SUCCESS);
      await fetchCoupleFromSupabase(false);
    } catch (err: any) { 
      alert(err.message || "Failed to join."); 
    } finally { 
      setIsActionLoading(false); 
    }
  }, [currentUser, fetchCoupleFromSupabase]);

  if (authLoading && !currentUser) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FFF5F5 0%, #FFFBF0 100%)" }}>
      <div className="w-8 h-8 border-2 border-brand-rose/30 border-t-brand-rose rounded-full animate-spin" />
    </div>
  );

  if (!currentUser) return null;

  return (
    <div className="min-h-screen flex flex-col font-sans text-[#1D1D1F]" style={{ background: "linear-gradient(135deg, #FFF5F5 0%, #FFFBF0 100%)" }}>
      <TopNavBar />
      <main className="flex-grow flex flex-col w-full px-[max(20px,5vw)] py-12 gap-8 max-w-[1200px] mx-auto">
        <section className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px]">
          <ConnectionScoreCard score={connectionScore} />
          <DailyTaskCard 
            task={dailyTask} 
            onUpdateTask={handleUpdateTask} 
            onComplete={handleTaskComplete} 
            isCompleted={hasCompletedTask} 
            reflection={reflection} 
            onReflectionChange={setReflection} 
          />
          <MoodSelector 
            selectedMood={selectedMood} 
            onMoodChange={handleMoodChange} 
            shareWithPartner={shareWithPartner} 
            onShareToggle={handleShareToggle} 
          />
          <PartnerStatus
            currentUser={currentUser ? { name: currentUser.displayName || "You", email: currentUser.email || "", photoUrl: currentUser.photoURL || undefined } : null}
            partner={partner} 
            inviteCode={inviteCode} 
            currentUserTaskCompleted={hasCompletedTask}
            isLoading={isPartnerLoading} 
            coupleStatus={coupleStatus} 
            onDisconnect={handleDisconnect} 
            onJoin={handleJoin}
          />

        </section>

        {/* Relational Features Section */}
        <section className="w-full">
          <CouplesFeatures coupleId={coupleId} dbId={dbId} />
        </section>
      </main>

      <FeedbackModal 
        isOpen={isFeedbackModalOpen} 
        onClose={() => setIsFeedbackModalOpen(false)} 
        onSubmit={handleFeedbackSubmit} 
      />

      {showPartnerJoinedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-[#1D1D1F] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10">
            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
              <HeartHandshake size={18} className="text-green-400" />
            </div>
            <div>
              <p className="font-semibold text-sm">Partner Connected!</p>
              <p className="text-xs text-white/70">You can now track your progress together</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
