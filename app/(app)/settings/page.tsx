"use client";
import { useEffect, useState } from "react";
import { onSnapshot, doc, setDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/utils/firebase/client";
import TopNavBar from "@/app/components/dashboard/TopNavBar";
import { Settings, User, Heart, Bell, LogOut, ChevronRight, Copy, ShieldAlert, Zap } from "lucide-react";
import { signOut, updateProfile as updateAuthProfile } from "firebase/auth";
import { useRouter } from "next/navigation";
import { playSound, SoundType } from "@/utils/sound";

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;

    const setupListeners = (u: any) => {
      unsubProfile = onSnapshot(doc(db, "profiles", u.uid), (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        } else {
          setProfile({
            displayName: u.displayName || "User",
            email: u.email || "",
            preferences: {
              notifications: true,
              sound: true,
            }
          });
        }
        setLoading(false);
      });
    };

    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      if (!u) {
        router.push("/login");
        return;
      }
      setupListeners(u);
    });

    return () => {
      unsubscribeAuth();
      if (unsubProfile) unsubProfile();
    };
  }, [router]);

  const updateFirebaseProfile = async (updates: any) => {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
      if (updates.displayName) {
        await updateAuthProfile(user, { displayName: updates.displayName });
      }
      await setDoc(doc(db, "profiles", user.uid), updates, { merge: true });
      playSound(SoundType.SUCCESS);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const updatePreference = async (key: string, value: boolean) => {
    const user = auth.currentUser;
    if (!user) return;
    
    playSound(SoundType.CLICK);
    try {
      await updateDoc(doc(db, "profiles", user.uid), {
        [`preferences.${key}`]: value
      });
    } catch (error) {
      console.error("Error updating preference:", error);
    }
  };

  const handleEditName = () => {
    const newName = prompt("Enter your new display name:", profile?.displayName || "");
    if (newName && newName.trim()) {
      updateFirebaseProfile({ displayName: newName.trim() });
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect from your partner? This will reset your shared progress.")) {
      return;
    }

    setIsDisconnecting(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/couples', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}` }
      });

      if (!res.ok) throw new Error('Failed to disconnect');
      
      playSound(SoundType.SUCCESS);
      alert("Disconnected successfully. You can now create or join a new connection.");
      router.push('/connect');
    } catch (err) {
      console.error(err);
      alert("Failed to disconnect. Please try again.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const copyInviteCode = () => {
    if (profile?.inviteCode) {
      navigator.clipboard.writeText(profile.inviteCode);
      playSound(SoundType.SUCCESS);
      alert("Invite code copied to clipboard!");
    }
  };

  const sections = [
    {
      title: "Account",
      icon: <User size={20} className="text-blue-500" />,
      items: [
        { 
          label: "Display Name", 
          value: profile?.displayName || profile?.name || "User",
          action: handleEditName
        },
        { label: "Email", value: auth.currentUser?.email || profile?.email || "" },
        { 
          label: "Your Permanent Invite Code", 
          value: profile?.inviteCode || "Generating...",
          component: profile?.inviteCode ? (
            <button 
              onClick={copyInviteCode}
              className="flex items-center gap-2 bg-black/5 px-3 py-1.5 rounded-lg hover:bg-black/10 transition-colors"
            >
              <span className="font-mono font-bold tracking-wider">{profile.inviteCode}</span>
              <Copy size={14} className="text-[#78716c]" />
            </button>
          ) : null,
          action: profile?.inviteCode ? copyInviteCode : undefined
        },
      ]
    },
    {
      title: "Relationship Setup",
      icon: <Heart size={20} className="text-rose-500" />,
      items: [
        { 
          label: "Love Language", 
          value: profile?.loveLanguage || "Not set",
          action: () => {
            const newValue = prompt("Update Love Language:", profile?.loveLanguage || "");
            if (newValue !== null) updateFirebaseProfile({ loveLanguage: newValue.trim() });
          }
        },
        { 
          label: "Communication Style", 
          value: profile?.communicationStyle || "Not set",
          action: () => {
            const newValue = prompt("Update Communication Style:", profile?.communicationStyle || "");
            if (newValue !== null) updateFirebaseProfile({ communicationStyle: newValue.trim() });
          }
        },
        { 
          label: "Baseline Comfort Level", 
          value: profile?.comfortLevel !== undefined ? `${profile.comfortLevel}%` : "Not set",
          action: () => {
            const newValue = prompt("Update Baseline Comfort Level (0-100):", profile?.comfortLevel || "50");
            if (newValue !== null) {
              const num = parseInt(newValue);
              if (!isNaN(num) && num >= 0 && num <= 100) {
                updateFirebaseProfile({ comfortLevel: num });
              } else {
                alert("Please enter a number between 0 and 100");
              }
            }
          }
        },
        { 
          label: "Connection Status", 
          value: profile?.coupleId ? "Linked with Partner" : "Waiting for Connection", 
          action: () => router.push("/connect") 
        },
      ]
    },
    {
      title: "Preferences",
      icon: <Bell size={20} className="text-amber-500" />,
      items: [
        { 
          label: "Notifications", 
          toggle: true, 
          value: profile?.preferences?.notifications !== false,
          action: () => updatePreference("notifications", profile?.preferences?.notifications === false)
        },
        { 
          label: "Sound Effects", 
          toggle: true, 
          value: profile?.preferences?.sound !== false,
          action: () => updatePreference("sound", profile?.preferences?.sound === false)
        },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <TopNavBar />
      <main className="max-w-[800px] mx-auto px-6 py-12">

        <header className="mb-10 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-black/5">
                <Settings className="text-[#1a1c1b]" size={24} />
              </div>
              <h1 className="text-3xl font-bold text-[#1a1c1b]">Settings</h1>
            </div>
            <p className="text-[#78716c]">Refine your experience and bond.</p>
          </div>
          
          {profile?.coupleId && (
            <button
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="px-4 py-2 bg-white border border-rose-100 text-rose-500 rounded-xl text-xs font-bold hover:bg-rose-50 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <ShieldAlert size={14} />
              {isDisconnecting ? "Disconnecting..." : "Disconnect Partner"}
            </button>
          )}
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-rose/30 border-t-brand-rose rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {sections.map((section) => (
              <div key={section.title} className="bg-white rounded-[32px] border border-black/5 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-500">
                <div className="px-8 py-5 bg-black/[0.01] border-b border-black/5 flex items-center gap-3">
                  <div className="p-1.5 bg-white rounded-lg shadow-xs border border-black/5">
                    {section.icon}
                  </div>
                  <h3 className="font-bold text-[#1a1c1b] uppercase tracking-wider text-xs">{section.title}</h3>
                </div>
                <div className="divide-y divide-black/5">
                  {section.items.map((item) => (
                    <div 
                      key={item.label}
                      onClick={() => item.action && item.action()}
                      className={`px-8 py-5 flex items-center justify-between transition-all duration-300 ${item.action ? 'hover:bg-black/[0.02] cursor-pointer' : ''}`}
                    >
                      <div className="flex flex-col">
                        <span className="text-[#4a4c4b] font-semibold text-sm">{item.label}</span>
                        {!item.toggle && (
                          <span className="text-[#78716c] text-xs mt-0.5">
                            {item.value}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {item.component ? item.component : (
                          <>
                            {item.action && !item.toggle && <ChevronRight size={18} className="text-[#d2d2d7]" />}
                            {item.toggle && (
                              <div 
                                className={`w-12 h-7 rounded-full relative p-1 transition-all duration-300 ${item.value ? 'bg-brand-rose' : 'bg-[#e5e5e7]'}`}
                              >
                                <div 
                                  className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${item.value ? 'translate-x-5' : 'translate-x-0'}`} 
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="bg-brand-rose/5 rounded-[32px] p-8 border border-brand-rose/10 flex flex-col items-center text-center gap-4 group hover:bg-brand-rose/[0.07] transition-all duration-500">
               <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-brand-rose/20 flex items-center justify-center text-brand-rose group-hover:scale-110 transition-transform">
                 <Zap size={24} fill="currentColor" />
               </div>
               <div>
                 <h4 className="font-bold text-[#1a1c1b]">Deepen your Connection</h4>
                 <p className="text-xs text-[#78716c] max-w-[280px] mx-auto mt-1 leading-relaxed">
                   Consistency is the key to a healthy relationship. Keep your daily streak alive!
                 </p>
               </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full bg-white border border-red-100 text-red-500 py-5 rounded-[32px] font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-all mt-8 active:scale-[0.98] shadow-sm hover:shadow-md"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
