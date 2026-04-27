"use client";

import { useState } from "react";
import { Smile, Share2, Plus, Check, X } from "lucide-react";

const PRESET_MOODS = [
  { id: "Happy", emoji: "😊", label: "Happy" },
  { id: "Loved", emoji: "🥰", label: "Loved" },
  { id: "Calm", emoji: "😌", label: "Calm" },
  { id: "Neutral", emoji: "😐", label: "Neutral" },
  { id: "Stressed", emoji: "😰", label: "Stressed" },
  { id: "Sad", emoji: "😢", label: "Sad" },
];

interface MoodSelectorProps {
  selectedMood?: string;
  onMoodChange?: (mood: string, emoji?: string, isCustom?: boolean) => Promise<void>;
  shareWithPartner?: boolean;
  onShareToggle?: (shared: boolean) => Promise<void>;
}

export default function MoodSelector({
  selectedMood: externalMood,
  onMoodChange,
  shareWithPartner: externalShare,
  onShareToggle,
}: MoodSelectorProps) {
  const [internalMood, setInternalMood] = useState("Happy");
  const [internalShare, setInternalShare] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Custom mood state
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const [customEmoji, setCustomEmoji] = useState("");

  const selectedMood = externalMood ?? internalMood;
  const shareWithPartner = externalShare ?? internalShare;

  const handleMoodSelect = async (mood: string, emoji?: string) => {
    if (isSaving) return;
    setIsSaving(true);
    setIsCustomMode(false);
    try {
      if (onMoodChange) {
        await onMoodChange(mood, emoji, false);
      } else {
        setInternalMood(mood);
      }
    } catch {
      // silently handle
    } finally {
      setIsSaving(false);
    }
  };

  const handleCustomSubmit = async () => {
    if (isSaving || !customLabel.trim()) return;
    setIsSaving(true);
    try {
      if (onMoodChange) {
        await onMoodChange(customLabel.trim(), customEmoji.trim() || "✨", true);
      }
      setIsCustomMode(false);
      setCustomLabel("");
      setCustomEmoji("");
    } catch {
      // silently handle
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareToggle = async () => {
    if (isSaving) return;
    const newValue = !shareWithPartner;
    setIsSaving(true);
    try {
      if (onShareToggle) {
        await onShareToggle(newValue);
      } else {
        setInternalShare(newValue);
      }
    } catch {
      // silently handle
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-1 bg-surface backdrop-blur-apple rounded-[24px] p-6 lg:p-8 shadow-apple-card hover:shadow-apple-card-hover transition-shadow duration-300 flex flex-col gap-5 border border-black/5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Smile size={24} className="text-[#78716c]" />
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-[#1a1c1b]">Current Mood</h3>
            {isSaving && (
              <div className="w-4 h-4 border-2 border-brand-rose/30 border-t-brand-rose rounded-full animate-spin" />
            )}
          </div>
        </div>
        {!isCustomMode ? (
          <button 
            onClick={() => setIsCustomMode(true)}
            className="p-1.5 rounded-lg hover:bg-black/5 text-[#78716c] transition-colors"
            title="Custom Mood"
          >
            <Plus size={18} />
          </button>
        ) : (
          <button 
            onClick={() => setIsCustomMode(false)}
            className="p-1.5 rounded-lg hover:bg-black/5 text-[#ef4444] transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {isCustomMode ? (
        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Emoji (e.g. 🌧️)" 
              value={customEmoji}
              onChange={(e) => setCustomEmoji(e.target.value)}
              className="w-16 bg-white border border-black/10 rounded-xl px-2 py-3 text-center text-xl outline-none focus:ring-2 focus:ring-brand-rose/20"
              maxLength={2}
            />
            <input 
              type="text" 
              placeholder="How are you feeling?" 
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              className="flex-1 bg-white border border-black/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-rose/20"
              onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
            />
          </div>
          <button 
            onClick={handleCustomSubmit}
            disabled={!customLabel.trim() || isSaving}
            className="bg-brand-rose text-white py-3 rounded-xl font-bold text-sm shadow-md shadow-rose-100 hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Check size={18} />
            Set Custom Mood
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {PRESET_MOODS.map((mood) => {
            const isSelected = selectedMood === mood.id;
            return (
              <button
                key={mood.id}
                disabled={isSaving}
                onClick={() => handleMoodSelect(mood.id, mood.emoji)}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl transition-all duration-200 border ${
                  isSelected
                    ? "bg-brand-rose/10 border-brand-rose/30 shadow-sm scale-[1.03]"
                    : "bg-transparent border-transparent hover:bg-black/[0.03] hover:border-black/5"
                } ${isSaving ? "cursor-not-allowed opacity-60" : "cursor-pointer active:scale-95"}`}
              >
                <span className={`text-2xl transition-transform duration-200 ${isSelected ? "scale-110" : ""}`}>
                  {mood.emoji}
                </span>
                <span
                  className={`text-xs font-medium transition-colors ${
                    isSelected ? "text-brand-rose font-semibold" : "text-[#78716c]"
                  }`}
                >
                  {mood.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Share Toggle */}
      <div className="flex items-center justify-between pt-2 border-t border-black/5">
        <label htmlFor="share-toggle" className="text-sm font-medium text-[#78716c] cursor-pointer flex items-center gap-2">
          <Share2 size={14} />
          Share with partner
        </label>
        <button
          id="share-toggle"
          role="switch"
          aria-checked={shareWithPartner}
          disabled={isSaving}
          onClick={handleShareToggle}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-rose focus:ring-offset-2 ${
            shareWithPartner ? "bg-brand-rose" : "bg-black/10"
          } ${isSaving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
              shareWithPartner ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Share Status */}
      {shareWithPartner && (
        <p className="text-xs text-brand-rose flex items-center gap-1 -mt-2 animate-in fade-in duration-300">
          <Share2 size={12} />
          Your mood is visible to your partner
        </p>
      )}
    </div>
  );
}
