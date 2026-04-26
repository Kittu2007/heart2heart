"use client";

import { useEffect, useState } from "react";
import { onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/utils/firebase/client";
import TopNavBar from "@/app/components/dashboard/TopNavBar";
import { Settings, User, Heart, Bell, LogOut, ChevronRight } from "lucide-react";
import { signOut, updateProfile as updateAuthProfile } from "firebase/auth";
import { useRouter } from "next/navigation";
import { playSound, SoundType } from "@/utils/sound";
import { useAuth } from "@/lib/contexts/auth-context";

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(doc(db, "profiles", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      } else {
        setProfile({
          displayName: user.displayName || "User",
          email: user.email || "",
          preferences: {
            notifications: true,
            sound: true,
          }
        });
      }
      setDataLoading(false);
    });

    return () => unsub();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const togglePreference = async (key: string) => {
    if (!user || !profile) return;
    
    playSound(SoundType.SUCCESS);
    const newPrefs = {
      ...profile.preferences,
      [key]: !profile.preferences?.[key]
    };

    try {
      await updateDoc(doc(db, "profiles", user.uid), {
        preferences: newPrefs
      });
    } catch (error) {
      console.error("Error updating preferences:", error);
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
    <div className="min-h-screen bg-[#F9F9F7] font-sans text-[#1D1D1F]">
      <TopNavBar />
      
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-brand-rose/10 rounded-2xl flex items-center justify-center text-brand-rose">
            <Settings size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-[#86868B]">Manage your account and preferences</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
            <h2 className="text-sm font-semibold text-[#86868B] uppercase tracking-wider mb-4 px-2">Account</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#F5F5F7] transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#F5F5F7] rounded-full flex-shrink-0 flex items-center justify-center text-[#1D1D1F] overflow-hidden group-hover:bg-white transition-colors">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={24} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{profile?.displayName || user.displayName || "Set Display Name"}</p>
                    <p className="text-sm text-[#86868B] truncate">{user.email}</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-[#C1C1C6]" />
              </div>

              {profile?.inviteCode && (
                <div className="p-4 bg-brand-rose/5 rounded-2xl border border-brand-rose/10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-brand-rose uppercase tracking-wider">Your Invite Code</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(profile.inviteCode);
                        playSound(SoundType.SUCCESS);
                      }}
                      className="text-[10px] bg-brand-rose text-white px-2 py-0.5 rounded-full font-bold hover:bg-brand-rose/90 transition-colors"
                    >
                      COPY
                    </button>
                  </div>
                  <p className="text-2xl font-mono font-bold tracking-[0.2em] text-[#1a1c1b] uppercase">
                    {profile.inviteCode}
                  </p>
                  <p className="text-[10px] text-[#78716c] mt-2">
                    Share this code with your partner to connect your accounts.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Preferences Section */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
            <h2 className="text-sm font-semibold text-[#86868B] uppercase tracking-wider mb-4 px-2">Preferences</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-rose/10 rounded-xl flex items-center justify-center text-brand-rose">
                    <Bell size={20} />
                  </div>
                  <p className="font-medium">Notifications</p>
                </div>
                <button 
                  onClick={() => togglePreference('notifications')}
                  className={`w-12 h-6 rounded-full transition-colors relative ${profile?.preferences?.notifications ? 'bg-brand-rose' : 'bg-[#E5E5E7]'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${profile?.preferences?.notifications ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-rose/10 rounded-xl flex items-center justify-center text-brand-rose">
                    <Heart size={20} />
                  </div>
                  <p className="font-medium">Sound Effects</p>
                </div>
                <button 
                  onClick={() => togglePreference('sound')}
                  className={`w-12 h-6 rounded-full transition-colors relative ${profile?.preferences?.sound ? 'bg-brand-rose' : 'bg-[#E5E5E7]'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${profile?.preferences?.sound ? 'left-7' : 'left-1'}`} profile-preferences-sound-btn />
                </button>
              </div>
            </div>
          </section>

          {/* App Info Section */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
            <h2 className="text-sm font-semibold text-[#86868B] uppercase tracking-wider mb-4 px-2">Support</h2>
            <div className="space-y-1">
              <button className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-[#F5F5F7] transition-colors group">
                <p className="font-medium">Help Center</p>
                <ChevronRight size={18} className="text-[#C1C1C6]" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-[#F5F5F7] transition-colors group">
                <p className="font-medium">Privacy Policy</p>
                <ChevronRight size={18} className="text-[#C1C1C6]" />
              </button>
            </div>
          </section>

          {/* Logout Section */}
          <button 
            onClick={handleSignOut}
            className="w-full bg-white rounded-3xl p-6 shadow-sm border border-brand-rose/20 flex items-center justify-center gap-3 text-brand-rose font-bold hover:bg-brand-rose/5 transition-colors"
          >
            <LogOut size={20} />
            Sign Out
          </button>
          
          <p className="text-center text-xs text-[#86868B] pt-4">Version 1.0.0 (Build 2024.1)</p>
        </div>
      </main>
    </div>
  );
}
