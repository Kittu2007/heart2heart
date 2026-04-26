"use client";

import { useState } from "react";
import { X, Star, CheckCircle } from "lucide-react";
import { playSound, SoundType } from "@/utils/sound";

const FEELING_TAGS = [
  { id: "loved", label: "Loved", color: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  { id: "fun", label: "Fun", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  { id: "awkward", label: "Awkward", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  { id: "too-easy", label: "Too Easy", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { id: "too-hard", label: "Too Hard", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
];

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: {
    rating: number;
    feelings: string[];
    comment: string;
  }) => void;
}

export default function FeedbackModal({ isOpen, onClose, onSubmit }: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedFeelings, setSelectedFeelings] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleFeeling = (feelingId: string) => {
    setSelectedFeelings((prev) =>
      prev.includes(feelingId)
        ? prev.filter((id) => id !== feelingId)
        : [...prev, feelingId]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    playSound(SoundType.MOOD);
    await onSubmit({ rating, feelings: selectedFeelings, comment });
    setIsSubmitting(false);
    // Reset form
    setRating(0);
    setSelectedFeelings([]);
    setComment("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface rounded-[32px] p-8 max-w-lg w-full shadow-2xl border border-black/5 animate-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
          aria-label="Close modal"
        >
          <X size={20} className="text-[#78716c]" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-[#1a1c1b] mb-2">How did it go?</h2>
          <p className="text-[#78716c]">Rate your experience and share how you felt</p>
        </div>

        {/* Star Rating */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => {
                setRating(star);
                playSound(SoundType.CLICK);
              }}
              onMouseEnter={() => setHoverRating(star)}
              className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
              aria-label={`Rate ${star} stars`}
            >
              <Star
                size={44}
                className={`transition-colors duration-200 ${
                  star <= (hoverRating || rating)
                    ? "fill-brand-rose text-brand-rose"
                    : "text-[#d2d2d7] hover:text-brand-rose"
                }`}
              />
            </button>
          ))}
        </div>

        {/* Feeling Tags */}
        <div className="mb-6">
          <label className="text-sm font-medium text-[#78716c] mb-3 block">
            How did this activity make you feel? (select all that apply)
          </label>
          <div className="flex flex-wrap gap-2">
            {FEELING_TAGS.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleFeeling(tag.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                  selectedFeelings.includes(tag.id)
                    ? tag.color
                    : "bg-black/5 text-[#78716c] border-transparent hover:bg-black/10"
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Comment Textarea */}
        <div className="mb-6">
          <label htmlFor="feedback-comment" className="text-sm font-medium text-[#78716c] mb-2 block">
            Anything else you'd like to share? (optional)
          </label>
          <textarea
            id="feedback-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Your thoughts, feelings, or suggestions..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose/50 transition-all resize-none text-[#1a1c1b] placeholder:text-[#a8a29e]"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || selectedFeelings.length === 0 || isSubmitting}
          className="w-full bg-gradient-to-r from-brand-rose to-[#ff4b6d] text-white py-4 rounded-xl font-semibold shadow-lg shadow-brand-rose/25 hover:shadow-brand-rose/40 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <CheckCircle size={20} />
              Submit Feedback
            </>
          )}
        </button>
      </div>
    </div>
  );
}
