'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Lock, Image as ImageIcon, Clock, Heart, Gift, Send, Sparkles } from 'lucide-react';

// ─── Shared Modal Shell ───────────────────────────────────────────────────────

function ModalShell({
  isOpen,
  onClose,
  title,
  icon,
  accentColor,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  accentColor: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="w-full max-w-md pointer-events-auto bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/10 border border-white/60 overflow-hidden">
              {/* Header */}
              <div className={`px-6 pt-6 pb-4 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${accentColor}`}>
                    {icon}
                  </div>
                  <h2 className="text-lg font-bold text-gray-800">{title}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              {/* Body */}
              <div className="px-6 pb-6">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Shared input styles ──────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-2xl border border-gray-200 bg-white/70 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all';

const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5';

// ─── CREATE EVENT MODAL ───────────────────────────────────────────────────────

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    event_type: 'date' | 'countdown' | 'message';
    event_date: string;
  }) => Promise<void>;
}

const EVENT_TYPES: { value: 'date' | 'countdown' | 'message'; label: string; icon: React.ReactNode; desc: string; color: string }[] = [
  { value: 'date', label: 'Date Night', icon: <Heart className="w-4 h-4" />, desc: 'Plan a special outing', color: 'bg-pink-100 text-pink-600 border-pink-200' },
  { value: 'countdown', label: 'Countdown', icon: <Clock className="w-4 h-4" />, desc: 'Count down to something', color: 'bg-indigo-100 text-indigo-600 border-indigo-200' },
  { value: 'message', label: 'Surprise', icon: <Gift className="w-4 h-4" />, desc: 'Reveal on the day', color: 'bg-amber-100 text-amber-600 border-amber-200' },
];

export function CreateEventModal({ isOpen, onClose, onSubmit }: CreateEventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<'date' | 'countdown' | 'message'>('date');
  const [eventDate, setEventDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setTitle(''); setDescription(''); setEventType('date'); setEventDate(''); setError('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Please add a title.'); return; }
    if (!eventDate) { setError('Please pick a date.'); return; }
    setIsSubmitting(true); setError('');
    try {
      await onSubmit({ title: title.trim(), description: description.trim(), event_type: eventType, event_date: new Date(eventDate).toISOString() });
      handleClose();
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Event"
      icon={<Calendar className="w-5 h-5 text-pink-500" />}
      accentColor="bg-pink-100"
    >
      <div className="space-y-4">
        {/* Type selector */}
        <div>
          <label className={labelCls}>Type</label>
          <div className="grid grid-cols-3 gap-2">
            {EVENT_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setEventType(t.value)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all text-center ${
                  eventType === t.value ? t.color + ' border-opacity-100' : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-gray-200'
                }`}
              >
                {t.icon}
                <span className="text-[11px] font-bold leading-tight">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className={labelCls}>Title</label>
          <input
            className={inputCls}
            placeholder="e.g. Rooftop dinner 🌙"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
          />
        </div>

        {/* Date */}
        <div>
          <label className={labelCls}>Date & Time</label>
          <input
            type="datetime-local"
            className={inputCls}
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Note (optional)</label>
          <textarea
            className={inputCls + ' resize-none'}
            placeholder="Any details to remember..."
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
          />
        </div>

        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-2xl bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white font-bold text-sm transition-all shadow-sm shadow-pink-200 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <><Sparkles className="w-4 h-4" /> Add to Calendar</>
          )}
        </button>
      </div>
    </ModalShell>
  );
}

// ─── CREATE LOCKED MESSAGE MODAL ──────────────────────────────────────────────

interface CreateMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { content: string; unlock_at: string }) => Promise<void>;
}

export function CreateMessageModal({ isOpen, onClose, onSubmit }: CreateMessageModalProps) {
  const [content, setContent] = useState('');
  const [unlockAt, setUnlockAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const QUICK_DATES = [
    { label: 'Tomorrow', getValue: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d.toISOString().slice(0, 16); } },
    { label: '1 Week', getValue: () => { const d = new Date(); d.setDate(d.getDate() + 7); d.setHours(9, 0, 0, 0); return d.toISOString().slice(0, 16); } },
    { label: '1 Month', getValue: () => { const d = new Date(); d.setMonth(d.getMonth() + 1); d.setHours(9, 0, 0, 0); return d.toISOString().slice(0, 16); } },
    { label: '1 Year', getValue: () => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); d.setHours(9, 0, 0, 0); return d.toISOString().slice(0, 16); } },
  ];

  const handleClose = () => {
    setContent(''); setUnlockAt(''); setError('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!content.trim()) { setError('Write a message first.'); return; }
    if (!unlockAt) { setError('Pick when they can open it.'); return; }
    const unlockDate = new Date(unlockAt);
    if (unlockDate <= new Date()) { setError('Unlock date must be in the future.'); return; }
    setIsSubmitting(true); setError('');
    try {
      await onSubmit({ content: content.trim(), unlock_at: unlockDate.toISOString() });
      handleClose();
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      title="Lock a Message"
      icon={<Lock className="w-5 h-5 text-indigo-500" />}
      accentColor="bg-indigo-100"
    >
      <div className="space-y-4">
        {/* Message */}
        <div>
          <label className={labelCls}>Your message</label>
          <textarea
            className={inputCls + ' resize-none focus:ring-indigo-300'}
            placeholder="Write something heartfelt... ❤️"
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
          />
          <p className="text-[11px] text-gray-400 mt-1 text-right">{content.length}/500</p>
        </div>

        {/* Quick date buttons */}
        <div>
          <label className={labelCls}>Unlock in</label>
          <div className="flex gap-2 flex-wrap mb-2">
            {QUICK_DATES.map(({ label, getValue }) => (
              <button
                key={label}
                onClick={() => setUnlockAt(getValue())}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  unlockAt === getValue()
                    ? 'bg-indigo-100 text-indigo-600 border-indigo-200'
                    : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            type="datetime-local"
            className={inputCls + ' focus:ring-indigo-300'}
            value={unlockAt}
            onChange={(e) => setUnlockAt(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>

        {unlockAt && (
          <div className="bg-indigo-50 rounded-2xl px-4 py-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
            <p className="text-xs text-indigo-600 font-medium">
              Stays locked until {new Date(unlockAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}

        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white font-bold text-sm transition-all shadow-sm shadow-indigo-200 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <><Send className="w-4 h-4" /> Lock it</>
          )}
        </button>
      </div>
    </ModalShell>
  );
}

// ─── CREATE MEMORY MODAL ──────────────────────────────────────────────────────

interface CreateMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description: string; memory_date: string; image_url?: string; mood?: string }) => Promise<void>;
}

const MOODS = ['❤️', '😊', '🥰', '😂', '✨', '🌟', '🎉', '🥹', '🌸', '🌙'];

export function CreateMemoryModal({ isOpen, onClose, onSubmit }: CreateMemoryModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [memoryDate, setMemoryDate] = useState(new Date().toISOString().slice(0, 10));
  const [imageUrl, setImageUrl] = useState('');
  const [mood, setMood] = useState('❤️');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setTitle(''); setDescription(''); setMemoryDate(new Date().toISOString().slice(0, 10));
    setImageUrl(''); setMood('❤️'); setError('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Give this memory a title.'); return; }
    if (!memoryDate) { setError('When did this happen?'); return; }
    setIsSubmitting(true); setError('');
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        memory_date: new Date(memoryDate).toISOString(),
        image_url: imageUrl.trim() || undefined,
        mood,
      });
      handleClose();
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Memory"
      icon={<ImageIcon className="w-5 h-5 text-amber-500" />}
      accentColor="bg-amber-100"
    >
      <div className="space-y-4">
        {/* Mood picker */}
        <div>
          <label className={labelCls}>Vibe</label>
          <div className="flex gap-2 flex-wrap">
            {MOODS.map((m) => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`w-10 h-10 text-xl rounded-xl transition-all ${
                  mood === m ? 'bg-amber-100 ring-2 ring-amber-300 scale-110' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className={labelCls}>Title</label>
          <input
            className={inputCls + ' focus:ring-amber-300'}
            placeholder="e.g. First trip to the beach 🏖️"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
          />
        </div>

        {/* Date */}
        <div>
          <label className={labelCls}>When</label>
          <input
            type="date"
            className={inputCls + ' focus:ring-amber-300'}
            value={memoryDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setMemoryDate(e.target.value)}
          />
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>What happened</label>
          <textarea
            className={inputCls + ' resize-none focus:ring-amber-300'}
            placeholder="Tell the story..."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={400}
          />
        </div>

        {/* Image URL */}
        <div>
          <label className={labelCls}>Photo URL (optional)</label>
          <input
            className={inputCls + ' focus:ring-amber-300'}
            placeholder="https://..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          {imageUrl && (
            <div className="mt-2 rounded-xl overflow-hidden aspect-video bg-gray-100">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-bold text-sm transition-all shadow-sm shadow-amber-200 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <><Sparkles className="w-4 h-4" /> Save Memory</>
          )}
        </button>
      </div>
    </ModalShell>
  );
}
