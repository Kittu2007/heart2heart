"use client";

import { useState } from "react";
import { Star, CheckCircle } from "lucide-react";

export default function FeedbackCard() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (isSubmitted) {
    return (
      <div className="col-span-1 md:col-span-full lg:col-span-full bg-surface backdrop-blur-apple rounded-[24px] p-8 shadow-apple-card flex flex-col items-center justify-center py-12 gap-6 border border-black/5 animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-2">
          <CheckCircle size={32} />
        </div>
        <h3 className="text-xl font-medium text-[#1a1c1b] text-center">Feedback saved to improve tomorrow's task</h3>
      </div>
    );
  }

  return (
    <div className="col-span-1 md:col-span-full lg:col-span-full bg-surface backdrop-blur-apple rounded-[24px] p-8 shadow-apple-card flex flex-col items-center justify-center py-12 gap-6 border border-black/5">
      <h3 className="text-2xl font-semibold text-[#1a1c1b]">How was your day together?</h3>
      <div 
        className="flex gap-2"
        onMouseLeave={() => setHoverRating(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
            aria-label={`Rate ${star} stars`}
          >
            <Star
              size={40}
              className={`transition-colors duration-200 ${
                star <= (hoverRating || rating)
                  ? "fill-brand-rose text-brand-rose"
                  : "text-[#d2d2d7] hover:text-brand-rose"
              }`}
            />
          </button>
        ))}
      </div>
      
      {rating > 0 && (
        <button 
          onClick={() => setIsSubmitted(true)}
          className="mt-4 bg-brand-rose text-white px-8 py-3 rounded-xl font-semibold hover:bg-brand-rose/90 transition-all active:scale-95 animate-in fade-in slide-in-from-bottom-2"
        >
          Submit Feedback
        </button>
      )}
    </div>
  );
}
