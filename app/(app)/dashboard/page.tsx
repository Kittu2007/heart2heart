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

  // Profile listener — separate effect so it runs once user is set
  useEffect(() => {
    if (!currentUser) return;

    const profileUnsub = onSnapshot(doc(db, "profiles", currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.coupleId) {
          setCoupleId(data.coupleId);
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

    // Listen for the couple document
    const coupleUnsub = onSnapshot(doc(db, "couples", coupleId), async (docSnap) => {
      if (!docSnap.exists()) {
        setIsPartnerLoading(false);
        return;
      }
      
      const data = docSnap.data();
      if (data?.inviteCode) {
        setInviteCode(data.inviteCode);
      }
      
      const partnerId = data?.partner_a_id === currentUser.uid ? data?.partner_b_id : data?.partner_a_id;
      
      if (!partnerId) {
        setIsPartnerLoading(false);
        return;
      }

      // Direct doc lookup instead of query (much faster)
      try {
        const partnerDoc = await getDoc(doc(db, "profiles", partnerId));
        const partnerData = partnerDoc.exists() ? partnerDoc.data() : null;
        
        setPartner({
          name: partnerData?.displayName || "Partner",
          photoUrl: partnerData?.photoURL,
          isOnline: false,
          taskCompleted: false,
        });
      } catch {
        setPartner({
          name: "Partner",
          isOnline: false,
          taskCompleted: false,
        });
      }
      setIsPartnerLoading(false);

      // Listen for partner's online status (single-field, no index needed)
      const profileUnsub = onSnapshot(doc(db, "profiles", partnerId), (snap) => {
        if (snap.exists()) {
          const profileData = snap.data();
          const lastSeen = profileData.lastSeen?.toDate();
          const isOnline = lastSeen ? (new Date().getTime() - lastSeen.getTime() < 60000) : false;
          
          setPartner(prev => prev ? ({
            ...prev,
            isOnline,
            lastSeen: lastSeen?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }) : null);
        }
      });
      cleanups.push(profileUnsub);

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
        setPartner(prev => prev ? ({ ...prev, taskCompleted: hasToday }) : null);
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
          setPartner(prev => prev ? ({ ...prev, mood: latest.mood }) : null);
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
    </div>
  );
}
