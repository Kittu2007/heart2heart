"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/utils/firebase/client";
import { User } from "firebase/auth";
import { useAuth } from "@/lib/contexts/auth-context";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  getDoc,
  Timestamp
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

interface Feedback {
  rating: number;
  feelings: string[];
  comment: string;
}

interface Partner {
  name: string;
  isOnline: boolean;
  lastSeen?: string;
  taskCompleted: boolean;
  photoUrl?: string;
  mood?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Task state
  const [dailyTask, setDailyTask] = useState<Task>({
    title: "Plan Date Night",
    description: "It's your turn to plan something special for this weekend.",
    category: "communication",
    intensity: 3,
  });

  // Mood state
  const [selectedMood, setSelectedMood] = useState<string>("Happy");
  const [shareWithPartner, setShareWithPartner] = useState(false);

  // Partner state
  const [partner, setPartner] = useState<Partner | null>(null);
  const [isPartnerLoading, setIsPartnerLoading] = useState(false);

  // Feedback modal state
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [hasCompletedTask, setHasCompletedTask] = useState(false);
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(false);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [connectionScore, setConnectionScore] = useState(0);
  const [reflection, setReflection] = useState("");
  const [dbId, setDbId] = useState<string | null>(null);
  const [showPartnerJoinedToast, setShowPartnerJoinedToast] = useState(false);
  const [coupleStatus, setCoupleStatus] = useState<string | null>(null);

  // Profile listener — separate effect so it runs once user is set
  useEffect(() => {
    if (!currentUser) return;

    const profileUnsub = onSnapshot(doc(db, "profiles", currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.coupleId) {
          setCoupleId(data.coupleId);
        }
        if (data.dbId) {
          setDbId(data.dbId);
        }
        if (data.inviteCode) {
          setInviteCode(data.inviteCode);
        }
      }
    });

    // Presence update
    const updatePresence = async () => {
      try {
        await updateDoc(doc(db, "profiles", currentUser.uid), {
          lastSeen: serverTimestamp()
        });
      } catch (e) {
        // Ignore — profile may not exist yet
      }
    };

    updatePresence();
    const presenceInterval = setInterval(updatePresence, 30000);

    return () => {
      profileUnsub();
      clearInterval(presenceInterval);
    };
  }, [currentUser]);

  // Partner & Couple Sync — only runs when coupleId is available
  useEffect(() => {
    if (!currentUser || !coupleId) return;

    setIsPartnerLoading(true);
    const cleanups: (() => void)[] = [];
    let partnerId: string | null = null;

    // Listen for the couple document
    const coupleUnsub = onSnapshot(doc(db, "couples", coupleId), async (docSnap) => {
      if (!docSnap.exists()) {
        setIsPartnerLoading(false);
        setPartner(null);
        return;
      }

      const data = docSnap.data();
      if (data?.inviteCode) {
        setInviteCode(data.inviteCode);
      }

      // Track status change to detect when partner joins
      const newStatus = data?.status;
      if (newStatus === 'active' && coupleStatus !== 'active') {
        // Status just changed to active - partner has joined!
        setShowPartnerJoinedToast(true);
        playSound(SoundType.SUCCESS);
        setTimeout(() => setShowPartnerJoinedToast(false), 5000);
      }
      setCoupleStatus(newStatus);

      if (data?.inviteCode) {
        setInviteCode(data.inviteCode);
      }

      // Determine partner ID based on current user's position
      const currentUserId = dbId;
      if (data?.partnerAId === currentUserId) {
        partnerId = data?.partnerBId || null;
      } else if (data?.partnerBId === currentUserId) {
        partnerId = data?.partnerAId || null;
      } else {
        partnerId = data?.partnerAId || data?.partnerBId || null;
      }

      if (!partnerId) {
        // No partner yet - show pending state
        setIsPartnerLoading(false);
        return;
      }

      // Initialize or update partner state with basic info
      setPartner(prev => ({
        name: prev?.name || "Partner",
        isOnline: prev?.isOnline ?? false,
        taskCompleted: prev?.taskCompleted ?? false,
        photoUrl: prev?.photoUrl ?? undefined,
        lastSeen: prev?.lastSeen ?? undefined,
        mood: prev?.mood ?? undefined,
      }));

      setIsPartnerLoading(false);

      // Query for the partner profile by their dbId (Supabase UUID)
      // This is more robust than direct doc access because doc IDs are Firebase UIDs
      try {
        const partnerQuery = query(collection(db, "profiles"), where("dbId", "==", partnerId), limit(1));
        const querySnap = onSnapshot(partnerQuery, (snap) => {
          if (!snap.empty) {
            const partnerData = snap.docs[0].data();
            const lastSeen = partnerData.lastSeen?.toDate();
            const isOnline = lastSeen ? (new Date().getTime() - lastSeen.getTime() < 60000) : false;

            console.log(`[Dashboard] Partner data received:`, partnerData.displayName, "Online:", isOnline);

            setPartner(prev => {
              // Note: We don't return null here if prev is null because we want to initialize it
              // if it's the first time we get data
              const base = prev || { 
                name: "Partner", 
                isOnline: false, 
                taskCompleted: false 
              };
              
              return {
                ...base,
                name: partnerData?.displayName || partnerData?.name || base.name,
                photoUrl: partnerData?.photoURL || base.photoUrl,
                isOnline,
                lastSeen: lastSeen?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                mood: partnerData?.mood || base.mood,
              };
            });
          } else {
            console.warn(`[Dashboard] No profile found in Firestore for partner dbId: ${partnerId}`);
          }
        }, (err) => {
          console.error("[Dashboard] Partner query error:", err);
        });
        cleanups.push(querySnap);
      } catch (e) {
        console.error("Partner lookup error:", e);
      }

      // Listen for partner's task completion (single-field query + client filter)
      const taskQ = query(
        collection(db, "completed_tasks"),
        where("userId", "==", partnerId)
      );
      const taskUnsub = onSnapshot(taskQ, (snapshot) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const hasToday = snapshot.docs.some(d => {
          const completedAt = d.data().completedAt?.toDate();
          return completedAt && completedAt >= today;
        });
        setPartner(prev => {
          if (!prev) return null;
          return {
            ...prev,
            taskCompleted: hasToday,
          };
        });
      }, () => {/* ignore errors */});
      cleanups.push(taskUnsub);

      // Listen for partner's mood (single-field query + client filter)
      const moodQ = query(
        collection(db, "mood_checkins"),
        where("userId", "==", partnerId)
      );
      const moodUnsub = onSnapshot(moodQ, (snapshot) => {
        // Find the most recent shared mood client-side
        let latest: any = null;
        let latestTime = 0;
        snapshot.docs.forEach(d => {
          const data = d.data();
          if (data.shareWithPartner) {
            const t = data.timestamp?.toDate()?.getTime() || 0;
            if (t > latestTime) {
              latestTime = t;
              latest = data;
            }
          }
        });
        if (latest) {
          setPartner(prev => {
            if (!prev) return null;
            return {
              ...prev,
              mood: latest.mood,
            };
          });
        }
      }, () => {/* ignore errors */});
      cleanups.push(moodUnsub);
    });
    cleanups.push(coupleUnsub);

    // Connection Score — single-field query + client sort
    const feedbackQ = query(
      collection(db, "feedback"), 
      where("coupleId", "==", coupleId)
    );
    const feedbackUnsub = onSnapshot(feedbackQ, (snapshot) => {
      if (snapshot.empty) {
        setConnectionScore(0);
        return;
      }

      let totalRating = 0;
      // Sort by submittedAt descending, take top 20
      const sorted = snapshot.docs
        .map(d => d.data())
        .sort((a, b) => (b.submittedAt?.toDate()?.getTime() || 0) - (a.submittedAt?.toDate()?.getTime() || 0))
        .slice(0, 20);

      sorted.forEach(d => totalRating += d.rating || 0);
      const avgRating = totalRating / sorted.length;
      
      const calculated = Math.min(100, Math.floor((avgRating / 5) * 80 + (sorted.length * 2)));
      setConnectionScore(calculated);
    }, () => {
      setConnectionScore(0);
    });
    cleanups.push(feedbackUnsub);

    return () => cleanups.forEach(fn => fn());
  }, [currentUser, coupleId]);

  // Handle task completion - opens feedback modal
  const handleTaskComplete = useCallback(async () => {
    if (!currentUser) return;
    
    setIsActionLoading(true);
    
    try {
      const savePromise = addDoc(collection(db, "completed_tasks"), {
        userId: currentUser.uid,
        task: dailyTask,
        reflection: reflection,
        completedAt: serverTimestamp(),
      });

      await Promise.race([
        savePromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
      ]);
      
      setHasCompletedTask(true);
      setIsFeedbackModalOpen(true);
      playSound(SoundType.SUCCESS);
    } catch (error) {
      // Fallback for production robustness
      setHasCompletedTask(true);
      setIsFeedbackModalOpen(true);
      playSound(SoundType.SUCCESS);
    } finally {
      setIsActionLoading(false);
    }
  }, [currentUser, dailyTask, reflection]);

  // Handle feedback submission
  const handleFeedbackSubmit = useCallback(async (feedback: Feedback) => {
    if (!currentUser) return;

    try {
      const savePromise = addDoc(collection(db, "feedback"), {
        userId: currentUser.uid,
        taskId: dailyTask.title,
        rating: feedback.rating,
        feelingTags: feedback.feelings,
        comment: feedback.comment,
        coupleId: coupleId,
        submittedAt: serverTimestamp(),
      });

      await Promise.race([
        savePromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
      ]);

      setPartner((prev) => prev ? {
        ...prev,
        taskCompleted: true,
      } : null);

      setHasSubmittedFeedback(true);

      setDailyTask({
        title: "Meaningful Conversation",
        description: "Ask your partner what they appreciated most about you today.",
        category: "connection",
        intensity: 2,
      });

      setHasCompletedTask(false);
      setHasSubmittedFeedback(false);
      setIsFeedbackModalOpen(false);
      setReflection("");
    } catch (error) {
      // Feedback failed silently, but close modal to not block user
      setIsFeedbackModalOpen(false);
    }
  }, [currentUser, dailyTask]);

  // Handle mood change
  const handleMoodChange = useCallback(async (mood: string) => {
    setSelectedMood(mood);
    playSound(SoundType.POP);
    if (!currentUser) return;

    try {
      const savePromise = addDoc(collection(db, "mood_checkins"), {
        userId: currentUser.uid,
        mood: mood,
        shareWithPartner: shareWithPartner,
        timestamp: serverTimestamp(),
      });

      await Promise.race([
        savePromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
      ]);
    } catch (error) {
      // Mood update failed silently
    }
  }, [currentUser, shareWithPartner]);

  // Handle share toggle
  const handleShareToggle = useCallback(async (shared: boolean) => {
    setShareWithPartner(shared);
    if (!currentUser) return;

    try {
      const savePromise = addDoc(collection(db, "mood_checkins"), {
        userId: currentUser.uid,
        mood: selectedMood,
        shareWithPartner: shared,
        timestamp: serverTimestamp(),
      });

      await Promise.race([
        savePromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
      ]);
    } catch (error) {
      // Share settings failed silently
    }
  }, [currentUser, selectedMood]);

  // Handle task update from DailyTaskCard
  const handleUpdateTask = useCallback((newTask: Task) => {
    setDailyTask(newTask);
  }, []);

  // Handle partner disconnect
  const handleDisconnect = useCallback(async () => {
    if (!currentUser) return;
    
    setIsActionLoading(true);
    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch('/api/couples', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}` }
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to disconnect');
      }
      
      playSound(SoundType.SUCCESS);
      // Local state will be updated by Firestore listeners
      setPartner(null);
      setCoupleId(null);
      setCoupleStatus(null);
    } catch (err: any) {
      console.error("Disconnect error:", err);
      alert(err.message || "Failed to disconnect. Please try again.");
    } finally {
      setIsActionLoading(false);
    }
  }, [currentUser]);

  // Handle partner join
  const handleJoin = useCallback(async (code: string) => {
    if (!currentUser) return;
    
    setIsActionLoading(true);
    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch('/api/couples/join', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inviteCode: code })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to join');
      }
      
      playSound(SoundType.SUCCESS);
      // Success state will be picked up by listeners
    } catch (err: any) {
      console.error("Join error:", err);
      alert(err.message || "Failed to join. Please try again.");
    } finally {
      setIsActionLoading(false);
    }
  }, [currentUser]);

  if (authLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #FFF5F5 0%, #FFFBF0 100%)" }}
      >
        <div className="w-8 h-8 border-2 border-brand-rose/30 border-t-brand-rose rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div
      className="min-h-screen flex flex-col font-sans text-[#1D1D1F]"
      style={{ background: "linear-gradient(135deg, #FFF5F5 0%, #FFFBF0 100%)" }}
    >
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
            currentUser={currentUser ? {
              name: currentUser.displayName || "You",
              email: currentUser.email || "",
              photoUrl: currentUser.photoURL || undefined,
            } : null}
            partner={partner}
            inviteCode={inviteCode}
            currentUserTaskCompleted={hasCompletedTask}
            isLoading={isPartnerLoading}
            coupleStatus={coupleStatus}
            onDisconnect={handleDisconnect}
            onJoin={handleJoin}
          />
          <PreferencesList partnerName={partner?.name || "Partner"} coupleId={coupleId} />
        </section>
      </main>

      {/* Feedback Modal - shown after task completion */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        onSubmit={handleFeedbackSubmit}
      />

      {/* Partner Joined Toast Notification */}
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
