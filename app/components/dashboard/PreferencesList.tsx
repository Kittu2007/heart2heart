import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Link as LinkIcon, ChevronRight, Volume2, Loader2 } from "lucide-react";
import { db, auth } from "@/utils/firebase/client";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { playSound, SoundType } from "@/utils/sound";

interface PreferencesListProps {
  partnerName?: string;
  coupleId?: string | null;
}

export default function PreferencesList({ partnerName = "Partner", coupleId }: PreferencesListProps) {
  const router = useRouter();
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setIsInitialLoading(false);
      return;
    }

    // Subscribe to preference changes
    const unsubscribe = onSnapshot(doc(db, "profiles", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.preferences) {
          setNotificationsOn(data.preferences.notifications !== false);
          setSoundOn(data.preferences.sound !== false);
        }
      }
      setIsInitialLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updatePreference = async (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    playSound(SoundType.CLICK);
    const user = auth.currentUser;
    if (!user) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, "profiles", user.uid), {
        [`preferences.${key}`]: value
      });
    } catch (error) {
      console.error("Failed to update preference:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePartnerConnection = () => {
    router.push("/connect");
  };

  if (isInitialLoading) {
    return (
      <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-transparent flex flex-col gap-2 relative z-10">
        <div className="flex items-center justify-between ml-4 mb-1">
          <div className="w-24 h-4 bg-black/5 rounded animate-pulse" />
        </div>
        <div className="bg-surface backdrop-blur-apple rounded-[24px] h-[200px] animate-pulse shadow-apple-card border border-black/5" />
      </div>
    );
  }

  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-transparent flex flex-col gap-2 relative z-10">
      <div className="flex items-center justify-between ml-4 mb-1">
        <h3 className="text-[13px] font-medium text-[#78716c] uppercase tracking-wider">
          Preferences
        </h3>
        {isSaving && (
          <div className="flex items-center gap-1.5 text-[11px] text-brand-rose/60 animate-pulse">
            <Loader2 size={12} className="animate-spin" />
            Saving...
          </div>
        )}
      </div>
      <div className="bg-surface backdrop-blur-apple rounded-[24px] shadow-apple-card overflow-hidden border border-black/5">

        {/* Notifications */}
        <button
          onClick={() => updatePreference("notifications", !notificationsOn, setNotificationsOn)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-black/[0.02] transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm transition-colors duration-300 ${
                notificationsOn ? "bg-rose-400" : "bg-gray-300"
              }`}
            >
              <Bell size={18} />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-base text-[#1a1c1b] font-medium">Notifications</span>
              <span className="text-xs text-[#78716c]">Alerts for partner updates</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              role="switch"
              aria-checked={notificationsOn}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ${
                notificationsOn ? "bg-rose-400" : "bg-black/10"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  notificationsOn ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </div>
          </div>
        </button>

        <div className="h-[1px] bg-black/5 ml-[68px]" />

        {/* Sound Effects */}
        <button
          onClick={() => updatePreference("sound", !soundOn, setSoundOn)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-black/[0.02] transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm transition-colors duration-300 ${
                soundOn ? "bg-blue-400" : "bg-gray-300"
              }`}
            >
              <Volume2 size={18} />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-base text-[#1a1c1b] font-medium">Sound Effects</span>
              <span className="text-xs text-[#78716c]">Interactive audio feedback</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              role="switch"
              aria-checked={soundOn}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ${
                soundOn ? "bg-blue-400" : "bg-black/10"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  soundOn ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </div>
          </div>
        </button>

        <div className="h-[1px] bg-black/5 ml-[68px]" />

        {/* Partner Connection */}
        <button
          onClick={handlePartnerConnection}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-black/[0.02] transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="bg-rose-500 w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm">
              <LinkIcon size={18} />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-base text-[#1a1c1b] font-medium">Partner Connection</span>
              <span className="text-xs text-[#78716c]">Link with your significant other</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[#78716c]">
            <span className="text-sm">
              {coupleId ? (
                <span className="text-green-600 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  {partnerName}
                </span>
              ) : (
                <span className="text-brand-rose font-medium">Connect now</span>
              )}
            </span>
            <ChevronRight size={20} className="text-[#d2d2d7] group-hover:text-[#78716c] transition-colors" />
          </div>
        </button>
      </div>
    </div>
  );
}
