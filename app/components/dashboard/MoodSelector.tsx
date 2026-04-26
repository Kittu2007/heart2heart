"use client";

import { useState } from "react";
import { Smile, Share2 } from "lucide-react";

const MOODS = [
  { id: "Happy", emoji: "😊", label: "Happy" },
  { id: "Loved", emoji: "🥰", label: "Loved" },
  { id: "Calm", emoji: "😌", label: "Calm" },
  { id: "Neutral", emoji: "😐", label: "Neutral" },
  { id: "Stressed", emoji: "😰", label: "Stressed" },
  { id: "Sad", emoji: "😢", label: "Sad" },
];

interface MoodSelectorProps {
  selectedMood?: string;
  onMoodChange?: (mood: string) => void;
  shareWithPartner?: boolean;
  onShareToggle?: (shared: boolean) => void;
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

  const selectedMood = externalMood ?? internalMood;
  const shareWithPartner = externalShare ?? internalShare;

  const handleMoodSelect = async (mood: string) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      if (onMoodChange) {
        await (onMoodChange as (mood: string) => Promise<void>)(mood);
      } else {
        setInternalMood(mood);
      }
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
        await (onShareToggle as (shared: boolean) => Promise<void>)(newValue);
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
      </div>

      {/* Mood Grid */}
      <div className="grid grid-cols-3 gap-2">
        {MOODS.map((mood) => {
          const isSelected = selectedMood === mood.id;
          return (
            <button
              key={mood.id}
              disabled={isSaving}
              onClick={() => handleMoodSelect(mood.id)}
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
