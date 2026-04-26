"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot, doc, getDocs } from "firebase/firestore";
import { db, auth } from "@/utils/firebase/client";
import TopNavBar from "@/app/components/dashboard/TopNavBar";
import { History, Star, Calendar, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

import { useRouter } from "next/navigation";

export default function TimelinePage() {
  const router = useRouter();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [partnerNames, setPartnerNames] = useState<Record<string, string>>({});

  useEffect(() => {
    // 1. Initial Auth Check (Faster than waiting for onAuthStateChanged if already logged in)
    const checkAuth = async () => {
      const user = auth.currentUser;
      if (user) {
        setupListeners(user);
      }
    };

    const setupListeners = (user: any) => {
      // Listen for profile
      const profileUnsub = onSnapshot(doc(db, "profiles", user.uid), async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const cid = data.coupleId;
          setCoupleId(cid || null);

          if (cid) {
            // Background fetch names
            const coupleSnap = await getDocs(query(collection(db, "couples"), where("__name__", "==", cid)));
            if (!coupleSnap.empty) {
              const coupleData = coupleSnap.docs[0].data();
              const ids = [coupleData.partner_a_id, coupleData.partner_b_id].filter(Boolean);
              const namesMap: Record<string, string> = {};
              for (const id of ids) {
                const pSnap = await getDocs(query(collection(db, "profiles"), where("__name__", "==", id)));
                if (!pSnap.empty) namesMap[id] = pSnap.docs[0].data().displayName || "Someone";
              }
              setPartnerNames(namesMap);
            }
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      });
      return profileUnsub;
    };

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setupListeners(user);
    });

    checkAuth();
    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    if (!coupleId) return;

    const q = query(
      collection(db, "feedback"),
      where("coupleId", "==", coupleId),
      orderBy("submittedAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate() || new Date(),
      } as any));
      setActivities(docs);
      setLoading(false);
    }, (error) => {
      setLoading(false);
    });

    return () => unsub();
  }, [coupleId]);

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <TopNavBar />
      <main className="max-w-[800px] mx-auto px-6 py-12">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <History className="text-brand-rose" size={24} />
            <h1 className="text-3xl font-bold text-[#1a1c1b]">Relationship Timeline</h1>
          </div>
          <p className="text-[#78716c]">Look back at your journey and shared memories.</p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-rose/30 border-t-brand-rose rounded-full animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <div className="bg-surface rounded-3xl p-12 text-center border border-black/5">
            <div className="bg-brand-rose/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-rose">
              <Calendar size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-2">No memories yet</h3>
            <p className="text-[#78716c]">Complete your first daily task to start your timeline!</p>
          </div>
        ) : (
          <div className="space-y-6 relative">
            {/* Timeline Vertical Line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-black/5 hidden md:block" />

            {activities.map((activity, idx) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative md:pl-16"
              >
                {/* Timeline Dot */}
                <div className="absolute left-[21px] top-6 w-2.5 h-2.5 rounded-full bg-brand-rose hidden md:block border-2 border-white shadow-sm" />

                <div className="bg-surface rounded-2xl p-6 border border-black/5 shadow-sm hover:shadow-apple-card transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] font-bold text-brand-rose uppercase tracking-widest bg-brand-rose/10 px-2 py-1 rounded-full mb-2 inline-block">
                        {activity.userId === auth.currentUser?.uid ? "Your Reflection" : `${partnerNames[activity.userId] || 'Partner'}'s Reflection`}
                      </span>
                      <h3 className="text-lg font-semibold text-[#1a1c1b]">
                        {activity.taskId || "Daily Activity"}
                      </h3>
                      <p className="text-xs text-[#78716c]">
                        {activity.submittedAt.toLocaleDateString('en-US', { 
                          weekday: 'long',
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < activity.rating ? "fill-brand-rose text-brand-rose" : "text-black/10"}
                        />
                      ))}
                    </div>
                  </div>

                  {activity.comment && (
                    <div className="bg-black/[0.02] rounded-xl p-4 flex gap-3 italic text-[#4a4c4b]">
                      <MessageSquare size={16} className="text-brand-rose/40 shrink-0 mt-1" />
                      <p className="text-sm">"{activity.comment}"</p>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {activity.feelingTags?.map((tag: string) => (
                      <span key={tag} className="text-[10px] font-medium px-2 py-1 bg-white border border-black/5 rounded-full text-[#78716c]">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
