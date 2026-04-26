"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "@/utils/firebase/client";
import TopNavBar from "@/app/components/dashboard/TopNavBar";
import { History, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/contexts/auth-context";

export default function TimelinePage() {
  const { user, loading: authLoading } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [partnerNames, setPartnerNames] = useState<Record<string, string>>({});

  // Profile listener to get coupleId and partner names
  useEffect(() => {
    if (!user) return;
    
    const profileUnsub = onSnapshot(doc(db, "profiles", user.uid), async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const cid = data.coupleId;
        setCoupleId(cid || null);

        if (cid) {
          try {
            const coupleDoc = await getDoc(doc(db, "couples", cid));
            if (coupleDoc.exists()) {
              const coupleData = coupleDoc.data();
              const ids = [coupleData.partnerAId, coupleData.partnerBId].filter(Boolean);
              const namesMap: Record<string, string> = {};
              
              await Promise.all(ids.map(async (id: string) => {
                try {
                  const profileDoc = await getDoc(doc(db, "profiles", id));
                  if (profileDoc.exists()) {
                    namesMap[id] = profileDoc.data().displayName || "Someone";
                  }
                } catch (e) {
                  console.error("Error fetching partner profile:", e);
                }
              }));
              setPartnerNames(namesMap);
            }
          } catch (e) {
            console.error("Error fetching couple doc:", e);
          }
        } else {
          setDataLoading(false);
        }
      } else {
        setDataLoading(false);
      }
    });

    return () => profileUnsub();
  }, [user]);

  // Activity listener
  useEffect(() => {
    if (!coupleId) {
      if (!authLoading && !dataLoading) setDataLoading(false);
      return;
    }

    const q = query(
      collection(db, "feedback"),
      where("coupleId", "==", coupleId)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          submittedAt: doc.data().submittedAt?.toDate() || new Date(),
        } as any))
        .sort((a: any, b: any) => b.submittedAt.getTime() - a.submittedAt.getTime());
      
      setActivities(docs);
      setDataLoading(false);
    }, () => {
      setDataLoading(false);
    });

    return () => unsub();
  }, [coupleId, authLoading, dataLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F9F9F7]">
        <TopNavBar />
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-rose/30 border-t-brand-rose rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) return null;

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

        {dataLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-rose/30 border-t-brand-rose rounded-full animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-black/5 shadow-sm">
            <div className="bg-brand-rose/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-rose">
              <Calendar size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-2">No memories yet</h3>
            <p className="text-[#78716c]">Complete your first daily task to start your timeline!</p>
          </div>
        ) : (
          <div className="space-y-6 relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-black/5 hidden md:block" />

            {activities.map((activity, idx) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative md:pl-16"
              >
                <div className="absolute left-[21px] top-6 w-2.5 h-2.5 rounded-full bg-brand-rose hidden md:block border-2 border-white shadow-sm" />

                <div className="bg-white rounded-2xl p-6 border border-black/5 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-rose/10 flex items-center justify-center text-brand-rose font-semibold">
                        {partnerNames[activity.userId]?.[0] || "?"}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#1a1c1b]">
                          {partnerNames[activity.userId] || "Partner"} shared a reflection
                        </h3>
                        <p className="text-xs text-[#78716c]">
                          {activity.submittedAt.toLocaleDateString()} at {activity.submittedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-brand-rose/5 px-3 py-1 rounded-full text-brand-rose text-sm font-medium">
                      <span>Score: {activity.rating}/10</span>
                    </div>
                  </div>

                  <div className="bg-[#F9F9F7] rounded-xl p-4 mb-4">
                    <p className="text-[#4b5563] italic">"{activity.comment || "No comment shared."}"</p>
                  </div>

                  {activity.feelings && activity.feelings.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {activity.feelings.map((feeling: string) => (
                        <span key={feeling} className="text-xs bg-white border border-black/5 px-2 py-1 rounded-md text-[#6b7280]">
                          {feeling}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
