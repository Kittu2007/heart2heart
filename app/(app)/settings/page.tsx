"use client";

import { useEffect, useState } from "react";
import { onSnapshot, doc, setDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/utils/firebase/client";
import TopNavBar from "@/app/components/dashboard/TopNavBar";
import { Settings, User, Heart, Bell, LogOut, ChevronRight } from "lucide-react";
import { signOut, updateProfile as updateAuthProfile, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { playSound, SoundType } from "@/utils/sound";

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      // Direct doc listener (no query needed — we know the doc ID)
      const unsub = onSnapshot(doc(db, "profiles", user.uid), (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        } else {
          // Profile doesn't exist yet — show defaults from auth
          setProfile({
            displayName: user.displayName || "User",
            email: user.email || "",
            preferences: {
              notifications: true,
              sound: true,
            }
          });
        }
        setLoading(false);
      });

      return () => unsub();
    });

    return () => unsubscribe();
  }, [router]);

  const updateFirebaseProfile = async (updates: any) => {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
      if (updates.displayName) {
        await updateAuthProfile(user, { displayName: updates.displayName });
      }
      await setDoc(doc(db, "profiles", user.uid), updates, { merge: true });
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

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  interface SettingItem {
    label: string;
    value?: any;
    action?: () => void;
    toggle?: boolean;
  }

  const sections: { title: string; icon: React.ReactNode; items: SettingItem[] }[] = [
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
      ]
    },
    {
      title: "Relationship",
      icon: <Heart size={20} className="text-rose-500" />,
      items: [
        { 
          label: "Love Language", 
          value: profile?.loveLanguage || "Not set",
          action: () => {
            const newValue = prompt("Enter your Love Language (e.g., Words of Affirmation, Quality Time, Receiving Gifts, Acts of Service, Physical Touch):", profile?.loveLanguage || "");
            if (newValue && newValue.trim()) {
              updateFirebaseProfile({ loveLanguage: newValue.trim() });
            }
          }
        },
        { 
          label: "Communication Style", 
          value: profile?.communicationStyle || "Not set",
          action: () => {
             const newValue = prompt("Enter your Communication Style (e.g., Direct & Clear, Emotional & Empathetic, Analytical & Logical):", profile?.communicationStyle || "");
             if (newValue && newValue.trim()) {
               updateFirebaseProfile({ communicationStyle: newValue.trim() });
             }
          }
        },
        { 
          label: "Partner Connection", 
          value: profile?.coupleId ? "Connected" : "Not connected", 
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

        <header className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="text-[#78716c]" size={24} />
            <h1 className="text-3xl font-bold text-[#1a1c1b]">Settings</h1>
          </div>
          <p className="text-[#78716c]">Manage your account and relationship preferences.</p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-rose/30 border-t-brand-rose rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {sections.map((section) => (
              <div key={section.title} className="bg-surface rounded-3xl border border-black/5 overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-black/[0.01] border-b border-black/5 flex items-center gap-3">
                  {section.icon}
                  <h3 className="font-semibold text-[#1a1c1b]">{section.title}</h3>
                </div>
                <div className="divide-y divide-black/5">
                  {section.items.map((item) => (
                    <div 
                      key={item.label}
                      onClick={() => item.action && item.action()}
                      className={`px-6 py-4 flex items-center justify-between transition-colors ${item.action ? 'hover:bg-black/[0.04] cursor-pointer' : ''}`}
                    >
                      <span className="text-[#4a4c4b] font-medium">{item.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[#78716c] text-sm">
                          {typeof item.value === 'boolean' ? (item.value ? 'On' : 'Off') : item.value}
                        </span>
                        {item.action && !item.toggle && <ChevronRight size={18} className="text-[#d2d2d7]" />}
                        {item.toggle && (
                          <div 
                            className={`w-10 h-6 rounded-full relative p-1 transition-colors duration-200 ${item.value ? 'bg-brand-rose' : 'bg-[#e5e5e7]'}`}
                          >
                            <div 
                              className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${item.value ? 'translate-x-4' : 'translate-x-0'}`} 
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={handleSignOut}
              className="w-full bg-white border border-red-100 text-red-500 py-4 rounded-3xl font-semibold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors mt-8"
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
