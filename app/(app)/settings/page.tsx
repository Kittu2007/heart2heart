"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/utils/authFetch";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileData {
  display_name: string | null;
  love_language: string | null;
  comfort_level: number | null;
  notification_enabled: boolean;
  sound_enabled: boolean;
  photo_url: string | null;
  couple_id: string | null;
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

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [loveLanguage, setLoveLanguage] = useState("");
  const [comfortLevel, setComfortLevel] = useState(3);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [coupleId, setCoupleId] = useState<string | null>(null);

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

      const profile: ProfileData = await res.json();

      setDisplayName(profile.display_name ?? "");
      setLoveLanguage(profile.love_language ?? "");
      setComfortLevel(profile.comfort_level ?? 3);
      setNotificationsEnabled(profile.notification_enabled ?? true);
      setSoundEnabled(profile.sound_enabled ?? true);
      setCoupleId(profile.couple_id ?? null);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await authFetch("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({
          display_name: displayName.trim() || null,
          love_language: loveLanguage || null,
          comfort_level: comfortLevel,
          notification_enabled: notificationsEnabled,
          sound_enabled: soundEnabled,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to save settings");
      }

      setSuccessMessage("Settings saved ✓");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save settings";
      console.error("[SettingsPage] handleSave error:", err);
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

      setCoupleId(null);
      setLeaveConfirming(false);
      setSuccessMessage("You have left the couple. You can connect with a new partner anytime.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to leave couple";
      console.error("[SettingsPage] handleLeavePartner error:", err);
      setError(msg);
      setLeaveConfirming(false);
    } finally {
      setLeaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground animate-pulse">Loading settings…</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold">⚙️ Settings</h1>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="rounded-md bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          {successMessage}
        </div>
      )}

      {/* ── Profile Form ── */}
      <form onSubmit={handleSave} className="space-y-6 rounded-xl border bg-card p-6">
        <h2 className="font-semibold text-lg">Profile & Preferences</h2>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Love Language</label>
          <select
            value={loveLanguage}
            onChange={(e) => setLoveLanguage(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">— Select your love language —</option>
            {LOVE_LANGUAGES.map((ll) => (
              <option key={ll.value} value={ll.value}>
                {ll.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Comfort Level: <span className="font-bold text-primary">{comfortLevel}</span> / 5
          </label>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={comfortLevel}
            onChange={(e) => setComfortLevel(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>💛 Casual</span>
            <span>❤️🔥 Deep</span>
          </div>
        </div>

        <div className="space-y-3">
          <ToggleRow
            label="Push Notifications"
            description="Get notified when your partner completes a task"
            checked={notificationsEnabled}
            onChange={setNotificationsEnabled}
          />
          <ToggleRow
            label="Sound Effects"
            description="Play audio feedback for interactions"
            checked={soundEnabled}
            onChange={setSoundEnabled}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </form>

      {/* ── Danger Zone ── */}
      {coupleId && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-lg text-destructive">⚠️ Danger Zone</h2>
            <p className="text-sm text-muted-foreground mt-1">
              These actions are irreversible. Please proceed with caution.
            </p>
          </div>

          <div className="rounded-lg border border-destructive/20 bg-background p-4 space-y-3">
            <div>
              <p className="font-medium text-sm">Leave Partner</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Disconnects you and your partner. Both accounts return to unlinked state.
              </p>
            </div>

            {leaveConfirming ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-destructive">
                  Are you sure? This will disconnect both you and your partner immediately.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleLeavePartner}
                    disabled={leaving}
                    className="flex-1 rounded-md bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                  >
                    {leaving ? "Leaving…" : "Yes, Leave Partner"}
                  </button>
                  <button
                    onClick={() => setLeaveConfirming(false)}
                    disabled={leaving}
                    className="flex-1 rounded-md border px-3 py-2 text-xs font-medium hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleLeavePartner}
                className="rounded-md border border-destructive/40 px-4 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                Leave Partner
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
