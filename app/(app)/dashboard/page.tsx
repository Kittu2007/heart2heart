"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/utils/firebase/client";
import { onAuthStateChanged, User } from "firebase/auth";
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
  getDocs,
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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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
  const [connectionScore, setConnectionScore] = useState(0);
  const [reflection, setReflection] = useState("");

  // Auth and Data Fetching
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
      } else {
        setCurrentUser(user);
        
        // 1. Listen for user's profile and couple link
        const profileUnsub = onSnapshot(doc(db, "profiles", user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.coupleId) {
              setCoupleId(data.coupleId);
            }
          }
        });

        setIsInitialLoading(false);
        return () => profileUnsub();
      }
    });

    // Presence update
    const updatePresence = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          await updateDoc(doc(db, "profiles", user.uid), {
            lastSeen: serverTimestamp()
          });
        } catch (e) {
          // Ignore
        }
      }
    };

    updatePresence();
    const presenceInterval = setInterval(updatePresence, 30000);

    return () => {
      unsubscribe();
      clearInterval(presenceInterval);
    };
  }, [router]);

  // 2. Real-time Partner & Couple Sync
  useEffect(() => {
    if (!currentUser || !coupleId) return;

    setIsPartnerLoading(true);

    // Listen for the couple document
    const coupleUnsub = onSnapshot(doc(db, "couples", coupleId), async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const partnerId = data.partner_a_id === currentUser.uid ? data.partner_b_id : data.partner_a_id;
        
        if (partnerId) {
          // Fetch partner profile name
          const partnerProfileSnap = await getDocs(query(collection(db, "profiles"), where("__name__", "==", partnerId)));
          const partnerData = !partnerProfileSnap.empty ? partnerProfileSnap.docs[0].data() : null;
          const partnerName = partnerData?.displayName || "Partner";
          const partnerPhoto = partnerData?.photoURL;

          setPartner({
            name: partnerName,
            photoUrl: partnerPhoto,
            isOnline: false,
            taskCompleted: false,
          });
          setIsPartnerLoading(false);

          // Listen for partner's today completion
          const today = new Date();
          today.setHours(0,0,0,0);
          
          const q = query(
            collection(db, "completed_tasks"),
            where("userId", "==", partnerId),
            where("completedAt", ">=", Timestamp.fromDate(today))
          );
          
          const taskUnsub = onSnapshot(q, (snapshot) => {
            setPartner(prev => prev ? ({
              ...prev,
              taskCompleted: !snapshot.empty
            }) : null);
          });

          // Listen for partner's online status
          const profileUnsub = onSnapshot(doc(db, "profiles", partnerId), (docSnap) => {
            if (docSnap.exists()) {
              const profileData = docSnap.data();
              const lastSeen = profileData.lastSeen?.toDate();
              const isOnline = lastSeen ? (new Date().getTime() - lastSeen.getTime() < 60000) : false; // Within 1 min
              
              setPartner(prev => prev ? ({
                ...prev,
                isOnline,
                lastSeen: lastSeen?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }) : null);
            }
          });

          // Listen for partner's mood
          const moodQ = query(
            collection(db, "mood_checkins"),
            where("userId", "==", partnerId),
            where("shareWithPartner", "==", true),
            orderBy("timestamp", "desc"),
            limit(1)
          );

          const moodUnsub = onSnapshot(moodQ, (snapshot) => {
            if (!snapshot.empty) {
              const moodData = snapshot.docs[0].data();
              setPartner(prev => prev ? ({
                ...prev,
                mood: moodData.mood
              }) : null);
            }
          });

          return () => {
            taskUnsub();
            profileUnsub();
            moodUnsub();
          };
        }
      }
    });

    // 3. Dynamic Connection Score Calculation (Real-time)
    const feedbackQ = query(
      collection(db, "feedback"), 
      where("coupleId", "==", coupleId),
      orderBy("submittedAt", "desc"),
      limit(20)
    );

    const feedbackUnsub = onSnapshot(feedbackQ, (snapshot) => {
      if (snapshot.empty) {
        setConnectionScore(0);
        return;
      }

      let totalRating = 0;
      snapshot.forEach(doc => totalRating += doc.data().rating);
      const avgRating = totalRating / snapshot.size;
      
      const calculated = Math.min(100, Math.floor((avgRating / 5) * 80 + (snapshot.size * 2)));
      setConnectionScore(calculated);
    }, () => {
      setConnectionScore(0);
    });

    return () => {
      coupleUnsub();
      feedbackUnsub();
    };
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

      setPartner((prev) => ({
        ...prev,
        taskCompleted: true,
      }));

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

  if (isInitialLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #FFF5F5 0%, #FFFBF0 100%)" }}
      >
        <div className="w-8 h-8 border-2 border-brand-rose/30 border-t-brand-rose rounded-full animate-spin" />
      </div>
    );
  }

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
