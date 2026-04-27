"use client";

import { useEffect, useState, useCallback } from "react";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/utils/firebase/client";
import TopNavBar from "@/app/components/dashboard/TopNavBar";
import { History, Calendar, Camera, Upload, Image as ImageIcon, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/contexts/auth-context";
import { playSound, SoundType } from "@/utils/sound";

interface Activity {
  id: string;
  type: 'feedback' | 'memory';
  userId: string;
  submittedAt: Date;
  comment?: string;
  caption?: string;
  rating?: number;
  feelings?: string[];
  imageUrl?: string;
  uploadedBy?: string;
}

export default function TimelinePage() {
  const { user, loading: authLoading } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [memories, setMemories] = useState<Activity[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [partnerNames, setPartnerNames] = useState<Record<string, string>>({});
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCaption, setUploadCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
                    namesMap[id] = profileDoc.data().displayName || profileDoc.data().name || "Someone";
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

  // Activity & Memories Fetch
  useEffect(() => {
    if (!coupleId) {
      if (!authLoading && !dataLoading) setDataLoading(false);
      return;
    }

    // 1. Fetch Feedback from Firestore
    const q = query(
      collection(db, "feedback"),
      where("coupleId", "==", coupleId)
    );

    const unsubFeedback = onSnapshot(q, (snapshot) => {
      const feedbackDocs = snapshot.docs.map(doc => ({
        id: doc.id,
        type: 'feedback' as const,
        userId: doc.data().userId,
        submittedAt: doc.data().submittedAt?.toDate() || new Date(),
        comment: doc.data().comment,
        rating: doc.data().rating,
        feelings: doc.data().feelingTags,
      }));
      setActivities(feedbackDocs);
      setDataLoading(false);
    }, () => {
      setDataLoading(false);
    });

    // 2. Fetch Memories from Supabase API
    const fetchMemories = async () => {
      try {
        const token = await user?.getIdToken();
        const res = await fetch("/api/memories", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const memoryDocs = data.memories.map((m: any) => ({
            id: m.id,
            type: 'memory' as const,
            userId: m.uploaded_by,
            submittedAt: new Date(m.created_at),
            imageUrl: m.image_url,
            caption: m.caption,
          }));
          setMemories(memoryDocs);
        }
      } catch (err) {
        console.error("Failed to fetch memories:", err);
      }
    };

    fetchMemories();

    return () => unsubFeedback();
  }, [coupleId, authLoading, user]);

  // Merge and sort
  const combinedActivities = [...activities, ...memories].sort(
    (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime()
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (uploadCaption) formData.append("caption", uploadCaption);

      const token = await user.getIdToken();
      const res = await fetch("/api/memories/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const newMemory = await res.json();
      
      // Append new memory locally for immediate feedback
      const formattedMemory: Activity = {
        id: newMemory.id,
        type: 'memory',
        userId: newMemory.uploaded_by,
        submittedAt: new Date(newMemory.created_at),
        imageUrl: newMemory.image_url,
        caption: newMemory.caption,
      };
      
      setMemories(prev => [formattedMemory, ...prev]);
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadCaption("");
      playSound(SoundType.SUCCESS);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload memory. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

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
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <History className="text-brand-rose" size={24} />
              <h1 className="text-3xl font-bold text-[#1a1c1b]">Relationship Timeline</h1>
            </div>
            <p className="text-[#78716c]">Look back at your journey and shared memories.</p>
          </div>
        </header>

        {/* Memory Upload Section */}
        {coupleId && (
          <div className="mb-12 bg-white rounded-3xl p-6 border border-black/5 shadow-sm">
            <h3 className="text-lg font-bold text-[#1a1c1b] mb-4 flex items-center gap-2">
              <Camera size={20} className="text-brand-rose" />
              Capture a New Memory
            </h3>
            
            <div className="flex flex-col gap-4">
              {previewUrl ? (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-black/5 bg-black/5">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                    className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full backdrop-blur-sm hover:bg-black/70 transition-colors"
                  >
                    <ImageIcon size={18} />
                  </button>
                </div>
              ) : (
                <label className="w-full aspect-[3/1] md:aspect-[4/1] rounded-2xl border-2 border-dashed border-black/10 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-black/[0.02] hover:border-brand-rose/30 transition-all group">
                  <Upload size={24} className="text-[#78716c] group-hover:text-brand-rose transition-colors" />
                  <span className="text-sm font-medium text-[#78716c]">Click to select a photo</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                </label>
              )}

              <div className="flex gap-3">
                <input 
                  type="text"
                  placeholder="Add a caption..."
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  className="flex-grow bg-[#F9F9F7] border border-black/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose/20 transition-all"
                />
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="bg-brand-rose text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-rose-dark disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
                >
                  {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  <span>{isUploading ? "Sharing..." : "Share"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {dataLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-rose/30 border-t-brand-rose rounded-full animate-spin" />
          </div>
        ) : combinedActivities.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-black/5 shadow-sm">
            <div className="bg-brand-rose/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-rose">
              <Calendar size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-2">No memories yet</h3>
            <p className="text-[#78716c]">Complete your first daily task or upload a photo to start your timeline!</p>
          </div>
        ) : (
          <div className="space-y-8 relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-black/5 hidden md:block" />

            <AnimatePresence initial={false}>
              {combinedActivities.map((activity, idx) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  layout
                  className="relative md:pl-16"
                >
                  <div className="absolute left-[21px] top-6 w-2.5 h-2.5 rounded-full bg-brand-rose hidden md:block border-2 border-white shadow-sm" />

                  <div className="bg-white rounded-3xl overflow-hidden border border-black/5 shadow-sm hover:shadow-md transition-all group">
                    {/* Activity Header */}
                    <div className="p-6 pb-4">
                      <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-rose/10 flex items-center justify-center text-brand-rose font-semibold border border-brand-rose/20">
                            {partnerNames[activity.userId]?.[0] || "?"}
                          </div>
                          <div>
                            <h3 className="font-bold text-[#1a1c1b]">
                              {partnerNames[activity.userId] || "Partner"} 
                              {activity.type === 'feedback' ? " shared a reflection" : " added a memory"}
                            </h3>
                            <p className="text-xs text-[#78716c]">
                              {activity.submittedAt.toLocaleDateString()} at {activity.submittedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        {activity.type === 'feedback' && (
                          <div className="flex items-center gap-1 bg-brand-rose/5 px-3 py-1 rounded-full text-brand-rose text-xs font-bold">
                            <span>Score: {activity.rating}/5</span>
                          </div>
                        )}
                      </div>

                      {/* Content Section */}
                      {activity.type === 'feedback' ? (
                        <div className="bg-[#F9F9F7] rounded-2xl p-5 border border-black/5">
                          <p className="text-[#4b5563] italic leading-relaxed text-sm">"{activity.comment || "No comment shared."}"</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          <div className="relative aspect-video rounded-2xl overflow-hidden border border-black/5 bg-black/5">
                            <img 
                              src={activity.imageUrl} 
                              alt="Memory" 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                              loading="lazy"
                            />
                          </div>
                          {activity.caption && (
                            <p className="text-[#4b5563] text-sm font-medium px-1">{activity.caption}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer / Tags */}
                    {activity.type === 'feedback' && activity.feelings && activity.feelings.length > 0 && (
                      <div className="px-6 pb-6 pt-2 flex flex-wrap gap-2">
                        {activity.feelings.map((feeling: string) => (
                          <span key={feeling} className="text-[10px] uppercase tracking-wider font-bold bg-white border border-black/5 px-2.5 py-1 rounded-lg text-[#6b7280]">
                            {feeling}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
