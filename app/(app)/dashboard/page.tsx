"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/utils/firebase/client";
import { useAuth } from "@/lib/contexts/auth-context";
import {
  collection, addDoc, serverTimestamp, doc, updateDoc,
  onSnapshot, query, where, limit,
} from "firebase/firestore";
import TopNavBar from "@/app/components/dashboard/TopNavBar";
import ConnectionScoreCard from "@/app/components/dashboard/ConnectionScoreCard";
import DailyTaskCard, { Task } from "@/app/components/dashboard/DailyTaskCard";
import MoodSelector from "@/app/components/dashboard/MoodSelector";
import PreferencesList from "@/app/components/dashboard/PreferencesList";
import PartnerStatus from "@/app/components/dashboard/PartnerStatus";
import FeedbackModal from "@/app/components/dashboard/FeedbackModal";
import { playSound, SoundType } from "@/utils/sound";
import { HeartHandshake } from "lucide-react";

interface Feedback { rating: number; feelings: string[]; comment: string; }
interface Partner {
  name: string; isOnline: boolean; lastSeen?: string;
  taskCompleted: boolean; photoUrl?: string; mood?: string; _lastSeenDate?: Date;
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
      if (!couple) { if (!isPolling) setIsPartnerLoading(false); return; }

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
        if (prevStatus !== "active") {
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
          _lastSeenDate: prev?._lastSeenDate,
        }));
        // Stop polling
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      }

      if (!isPolling) setIsPartnerLoading(false);
    } catch (err) {
      console.error("[Dashboard] Supabase fetch error:", err);
      if (!isPolling) setIsPartnerLoading(false);
    }
  }, []);

  // ── Presence ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const update = async () => {
      try { await updateDoc(doc(db, "profiles", currentUser.uid), { lastSeen: serverTimestamp() }); } catch { /* non-fatal */ }
    };
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, [currentUser]);

  // ── Primary: Supabase couple fetch + polling ──────────────────────────
  useEffect(() => {
    if (!currentUser || authLoading) return;
    setIsPartnerLoading(true);
    fetchCoupleFromSupabase(false).then(() => {
      if (coupleStatusRef.current !== "active") {
        pollRef.current = setInterval(() => fetchCoupleFromSupabase(true), 5000);
      }
    });
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, authLoading]);

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

  // ── Secondary: Firestore for presence, task, mood ────────────────────
  useEffect(() => {
    if (!currentUser || !partnerDbId) return;
    const cleanups: (() => void)[] = [];
    const calcOnline = (d?: Date | null) => !!d && new Date().getTime() - d.getTime() < 60000;

    // Presence
    const pQ = query(collection(db, "profiles"), where("dbId", "==", partnerDbId), limit(1));
    cleanups.push(onSnapshot(pQ, snap => {
      if (!snap.empty) {
        const d = snap.docs[0].data();
        const ls = d.lastSeen?.toDate();
        setPartner(prev => prev ? { ...prev, isOnline: calcOnline(ls), lastSeen: ls?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), _lastSeenDate: ls } : prev);
      }
    }));

    // Task completion
    cleanups.push(onSnapshot(query(collection(db, "completed_tasks"), where("userId", "==", partnerDbId)), snap => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const hasToday = snap.docs.some(d => { const c = d.data().completedAt?.toDate(); return c && c >= today; });
      setPartner(prev => prev ? { ...prev, taskCompleted: hasToday } : null);
    }, () => {}));

    // Mood
    cleanups.push(onSnapshot(query(collection(db, "mood_checkins"), where("userId", "==", partnerDbId)), snap => {
      let latest: any = null; let lt = 0;
      snap.docs.forEach(d => { const x = d.data(); if (x.shareWithPartner) { const t = x.timestamp?.toDate()?.getTime() || 0; if (t > lt) { lt = t; latest = x; } } });
      if (latest) setPartner(prev => prev ? { ...prev, mood: latest.mood } : null);
    }, () => {}));

    // Online timer
    const ot = setInterval(() => {
      setPartner(prev => { if (!prev?._lastSeenDate) return prev; const s = calcOnline(prev._lastSeenDate); return s === prev.isOnline ? prev : { ...prev, isOnline: s }; });
    }, 30000);
    cleanups.push(() => clearInterval(ot));

    return () => cleanups.forEach(fn => fn());
  }, [currentUser, partnerDbId]);

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
    if (!currentUser) return;
    setIsActionLoading(true);
    try {
      await Promise.race([addDoc(collection(db, "completed_tasks"), { userId: currentUser.uid, task: dailyTask, reflection, completedAt: serverTimestamp() }), new Promise((_, r) => setTimeout(() => r(new Error("Timeout")), 5000))]);
    } catch { /* non-fatal */ }
    setHasCompletedTask(true); setIsFeedbackModalOpen(true); playSound(SoundType.SUCCESS);
    setIsActionLoading(false);
  }, [currentUser, dailyTask, reflection]);

  const handleFeedbackSubmit = useCallback(async (feedback: Feedback) => {
    if (!currentUser) return;
    try {
      await Promise.race([addDoc(collection(db, "feedback"), { userId: currentUser.uid, taskId: dailyTask.title, rating: feedback.rating, feelingTags: feedback.feelings, comment: feedback.comment, coupleId, submittedAt: serverTimestamp() }), new Promise((_, r) => setTimeout(() => r(new Error("Timeout")), 5000))]);
    } catch { /* non-fatal */ }
    setDailyTask({ title: "Meaningful Conversation", description: "Ask your partner what they appreciated most about you today.", category: "connection", intensity: 2 });
    setHasCompletedTask(false); setIsFeedbackModalOpen(false); setReflection("");
  }, [currentUser, dailyTask, coupleId]);

  const handleMoodChange = useCallback(async (mood: string) => {
    setSelectedMood(mood); playSound(SoundType.POP);
    if (!currentUser) return;
    try { await Promise.race([addDoc(collection(db, "mood_checkins"), { userId: currentUser.uid, mood, shareWithPartner, timestamp: serverTimestamp() }), new Promise((_, r) => setTimeout(() => r(new Error("Timeout")), 5000))]); } catch { /* non-fatal */ }
  }, [currentUser, shareWithPartner]);

  const handleShareToggle = useCallback(async (shared: boolean) => {
    setShareWithPartner(shared);
    if (!currentUser) return;
    try { await Promise.race([addDoc(collection(db, "mood_checkins"), { userId: currentUser.uid, mood: selectedMood, shareWithPartner: shared, timestamp: serverTimestamp() }), new Promise((_, r) => setTimeout(() => r(new Error("Timeout")), 5000))]); } catch { /* non-fatal */ }
  }, [currentUser, selectedMood]);

  const handleUpdateTask = useCallback((t: Task) => setDailyTask(t), []);

  const handleDisconnect = useCallback(async () => {
    if (!currentUser) return;
    setIsActionLoading(true);
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/couples", { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed to disconnect"); }
      playSound(SoundType.SUCCESS);
      setPartner(null); setCoupleId(null); setCoupleStatus(null); setPartnerDbId(null); coupleStatusRef.current = null;
    } catch (err: any) { alert(err.message || "Failed to disconnect."); }
    finally { setIsActionLoading(false); }
  }, [currentUser]);

  const handleJoin = useCallback(async (code: string) => {
    if (!currentUser) return;
    setIsActionLoading(true);
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/couples/join", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ inviteCode: code }) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed to join"); }
      playSound(SoundType.SUCCESS);
      await fetchCoupleFromSupabase(false);
    } catch (err: any) { alert(err.message || "Failed to join."); }
    finally { setIsActionLoading(false); }
  }, [currentUser, fetchCoupleFromSupabase]);

  if (authLoading) return (
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
          <DailyTaskCard task={dailyTask} onUpdateTask={handleUpdateTask} onComplete={handleTaskComplete} isCompleted={hasCompletedTask} reflection={reflection} onReflectionChange={setReflection} />
          <MoodSelector selectedMood={selectedMood} onMoodChange={handleMoodChange} shareWithPartner={shareWithPartner} onShareToggle={handleShareToggle} />
          <PartnerStatus
            currentUser={currentUser ? { name: currentUser.displayName || "You", email: currentUser.email || "", photoUrl: currentUser.photoURL || undefined } : null}
            partner={partner} inviteCode={inviteCode} currentUserTaskCompleted={hasCompletedTask}
            isLoading={isPartnerLoading} coupleStatus={coupleStatus} onDisconnect={handleDisconnect} onJoin={handleJoin}
          />
          <PreferencesList partnerName={partner?.name || "Partner"} coupleId={coupleId} />
        </section>
      </main>
      <FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} onSubmit={handleFeedbackSubmit} />
      {showPartnerJoinedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-[#1D1D1F] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10">
            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center"><HeartHandshake size={18} className="text-green-400" /></div>
            <div><p className="font-semibold text-sm">Partner Connected!</p><p className="text-xs text-white/70">You can now track your progress together</p></div>
          </div>
        </div>
      )}
    </div>
  );
}
