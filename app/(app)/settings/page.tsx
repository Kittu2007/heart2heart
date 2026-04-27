"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/utils/firebase/client";
import { authFetch } from "@/utils/authFetch";
import TopNavBar from "@/app/components/dashboard/TopNavBar";
import { 
  Settings, User, Heart, Bell, LogOut, ChevronRight, Copy, 
  ShieldAlert, Zap, Loader2 
} from "lucide-react";
import { playSound, SoundType } from "@/utils/sound";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileData {
  id: string;
  name: string | null;
  love_language: string | null;
  comfort_level: number | null;
  notification_enabled: boolean;
  sound_enabled: boolean;
  avatar_url: string | null;
  couple_id: string | null;
  invite_code?: string | null;
}

interface SettingItem {
  label: string;
  value: string | boolean;
  toggle?: boolean;
  component?: React.ReactNode;
  action?: () => void;
}

interface SettingSection {
  title: string;
  icon: React.ReactNode;
  items: SettingItem[];
}

const LOVE_LANGUAGES = [
  { value: "words_of_affirmation", label: "Words of Affirmation" },
  { value: "acts_of_service", label: "Acts of Service" },
  { value: "receiving_gifts", label: "Receiving Gifts" },
  { value: "quality_time", label: "Quality Time" },
  { value: "physical_touch", label: "Physical Touch" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();

  // Profile data
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [partnerName, setPartnerName] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [loveLanguage, setLoveLanguage] = useState("");
  const [comfortLevel, setComfortLevel] = useState(3);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Danger Zone state
  const [leaveConfirming, setLeaveConfirming] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // ── Load profile from Supabase ─────────────────────────

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await authFetch("/api/profile");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to load profile");
      }

      const data: ProfileData = await res.json();
      setProfile(data);
      setName(data.name ?? "");
      setLoveLanguage(data.love_language ?? "");
      setComfortLevel(data.comfort_level ?? 3);
      setNotificationsEnabled(data.notification_enabled ?? true);
      setSoundEnabled(data.sound_enabled ?? true);

      // Fetch partner info if linked
      if (data.couple_id) {
        try {
          const coupleRes = await authFetch("/api/couples");
          const coupleData = await coupleRes.json();
          if (coupleData?.couple) {
            const currentDbId = data.id;
            const pA = coupleData.couple.partner_a;
            const pB = coupleData.couple.partner_b;
            const partnerInfo = (pA && pA.id !== currentDbId) ? pA : (pB && pB.id !== currentDbId) ? pB : null;
            if (partnerInfo?.name) {
              setPartnerName(partnerInfo.name);
            }
          }
        } catch (err) {
          console.error("Failed to fetch partner info:", err);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load settings";
      console.error("[SettingsPage] loadProfile error:", err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // ── Save profile ───────────────────────────────────

  const handleSave = async (updatedFields?: Partial<ProfileData>) => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await authFetch("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: updatedFields?.name !== undefined ? updatedFields.name : (name.trim() || null),
          love_language: updatedFields?.love_language !== undefined ? updatedFields.love_language : (loveLanguage || null),
          comfort_level: updatedFields?.comfort_level !== undefined ? updatedFields.comfort_level : comfortLevel,
          notification_enabled: updatedFields?.notification_enabled !== undefined ? updatedFields.notification_enabled : notificationsEnabled,
          sound_enabled: updatedFields?.sound_enabled !== undefined ? updatedFields.sound_enabled : soundEnabled,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to save settings");
      }

      setSuccessMessage("Settings saved ✓");
      playSound(SoundType.SUCCESS);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      const updatedData = await res.json();
      setProfile(updatedData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save settings";
      console.error("[SettingsPage] handleSave error:", err);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = async (key: 'notification' | 'sound', value: boolean) => {
    if (key === 'notification') setNotificationsEnabled(value);
    else setSoundEnabled(value);
    
    playSound(SoundType.CLICK);
    handleSave({ [key === 'notification' ? 'notification_enabled' : 'sound_enabled']: value });
  };

  // ── Profile Picture Upload ─────────────────────────

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to upload image");
      }

      const { url } = await res.json();
      setProfile(prev => prev ? { ...prev, avatar_url: url } : null);
      setSuccessMessage("Profile picture updated ✓");
      playSound(SoundType.SUCCESS);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload image";
      console.error("[SettingsPage] handleImageUpload error:", err);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Leave Partner flow ────────────────────────────────────────────────────

  const handleLeavePartner = async () => {
    if (!leaveConfirming) {
      setLeaveConfirming(true);
      return;
    }

    setLeaving(true);
    setError(null);

    try {
      const res = await authFetch("/api/couples/leave", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to leave couple");
      }

      setProfile(prev => prev ? { ...prev, couple_id: null } : null);
      setLeaveConfirming(false);
      playSound(SoundType.SUCCESS);
      setSuccessMessage("You have left the couple. You can connect with a new partner anytime.");
      router.push("/connect");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to leave couple";
      console.error("[SettingsPage] handleLeavePartner error:", err);
      setError(msg);
      setLeaveConfirming(false);
    } finally {
      setLeaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const copyInviteCode = () => {
    if (profile?.invite_code) {
      navigator.clipboard.writeText(profile.invite_code);
      playSound(SoundType.SUCCESS);
      alert("Invite code copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fafaf9]">
        <Loader2 className="w-10 h-10 text-brand-rose animate-spin mb-4" />
        <p className="text-[#78716c] font-medium animate-pulse">Loading your world…</p>
      </div>
    );
  }

  const sections: SettingSection[] = [
    {
      title: "Account",
      icon: <User size={20} className="text-blue-500" />,
      items: [
        { 
          label: "Display Name", 
          value: name || "Set your name",
          action: () => {
            const newVal = prompt("Update Display Name:", name);
            if (newVal !== null) {
              setName(newVal.trim());
              handleSave({ name: newVal.trim() });
            }
          }
        },
        { label: "Email", value: auth.currentUser?.email || "No email linked" },
        { 
          label: "Your Invite Code", 
          value: profile?.invite_code || "Generating...",
          component: profile?.invite_code ? (
            <button 
              onClick={copyInviteCode}
              className="flex items-center gap-2 bg-black/5 px-3 py-1.5 rounded-lg hover:bg-black/10 transition-colors"
            >
              <span className="font-mono font-bold tracking-wider">{profile.invite_code}</span>
              <Copy size={14} className="text-[#78716c]" />
            </button>
          ) : null,
          action: profile?.invite_code ? copyInviteCode : undefined
        },
      ]
    },
    {
      title: "Relationship Setup",
      icon: <Heart size={20} className="text-rose-500" />,
      items: [
        { 
          label: "Love Language", 
          value: LOVE_LANGUAGES.find(l => l.value === loveLanguage)?.label || "Not set",
          action: () => {
            const val = prompt("Enter love language (quality_time, physical_touch, words_of_affirmation, acts_of_service, receiving_gifts):", loveLanguage);
            if (val && LOVE_LANGUAGES.some(l => l.value === val)) {
              setLoveLanguage(val);
              handleSave({ love_language: val });
            }
          }
        },
        { 
          label: "Baseline Comfort Level", 
          value: `${comfortLevel} / 5`,
          action: () => {
            const val = prompt("Update Comfort Level (1-5):", comfortLevel.toString());
            if (val) {
              const num = parseInt(val);
              if (num >= 1 && num <= 5) {
                setComfortLevel(num);
                handleSave({ comfort_level: num });
              }
            }
          }
        },
        { 
          label: "Connection Status", 
          value: profile?.couple_id ? (partnerName ? `Linked with ${partnerName}` : "Linked with Partner") : "Waiting for Connection", 
          action: () => profile?.couple_id ? undefined : router.push("/connect") 
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
          value: notificationsEnabled,
          action: () => updatePreference("notification", !notificationsEnabled)
        },
        { 
          label: "Sound Effects", 
          toggle: true, 
          value: soundEnabled,
          action: () => updatePreference("sound", !soundEnabled)
        },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9] pb-20">
      <TopNavBar />
      
      <main className="mx-auto w-full max-w-[800px] px-6 py-10">
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-[32px] bg-brand-rose/10 border-2 border-brand-rose/20 overflow-hidden flex items-center justify-center shadow-sm">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-brand-rose/40" />
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-[32px]">
                <span className="text-[10px] font-bold uppercase tracking-wider">Update</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={saving} />
              </label>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-white rounded-xl shadow-sm border border-black/5">
                  <Settings className="text-[#1a1c1b]" size={20} />
                </div>
                <h1 className="text-3xl font-bold text-[#1a1c1b]">Settings</h1>
              </div>
              <p className="text-[#78716c]">Refine your experience and bond.</p>
            </div>
          </div>
          
          {profile?.couple_id && (
            <button
              onClick={handleLeavePartner}
              disabled={leaving}
              className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 ${
                leaveConfirming 
                  ? "bg-destructive text-destructive-foreground border-transparent animate-pulse" 
                  : "bg-white border-rose-100 text-rose-500 hover:bg-rose-50"
              }`}
            >
              <ShieldAlert size={14} />
              {leaving ? "Leaving..." : leaveConfirming ? "Confirm Disconnect?" : "Disconnect Partner"}
            </button>
          )}
        </header>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-2xl bg-green-50 border border-green-100 p-4 text-sm text-green-700 flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full shrink-0" />
            {successMessage}
          </div>
        )}

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
      </main>
    </div>
  );
}
