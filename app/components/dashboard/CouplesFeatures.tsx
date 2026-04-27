'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Lock, 
  Image as ImageIcon, 
  Plus, 
  Clock, 
  Heart, 
  ChevronRight,
  Send,
  MessageSquare,
  Gift
} from 'lucide-react';
import { format, formatDistanceToNow, isAfter } from 'date-fns';
import { CreateEventModal, CreateMessageModal, CreateMemoryModal } from './FeatureModals';
import { auth } from '@/utils/firebase/client';
import { playSound, SoundType } from '@/utils/sound';

interface Event {
  id: string;
  title: string;
  description: string;
  event_type: 'date' | 'countdown' | 'message';
  event_date: string;
}

interface LockedMessage {
  id: string;
  content: string;
  unlock_at: string;
  is_unlocked: boolean;
  sender_id: string;
}

interface Memory {
  id: string;
  title: string;
  description: string;
  memory_date: string;
  image_url?: string;
  mood?: string;
}

interface CouplesFeaturesProps {
  coupleId: string | null;
  dbId: string | null;
}

export default function CouplesFeatures({ coupleId, dbId }: CouplesFeaturesProps) {
  const [activeTab, setActiveTab] = useState<'events' | 'messages' | 'memories'>('events');
  const [events, setEvents] = useState<Event[]>([]);
  const [messages, setMessages] = useState<LockedMessage[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showMemoryModal, setShowMemoryModal] = useState(false);

  // Fetch data function
  const fetchData = useCallback(async () => {
    if (!coupleId) return;
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      
      const headers = { 'Authorization': `Bearer ${token}` };

      const [evRes, msgRes, memRes] = await Promise.all([
        fetch('/api/events', { headers }),
        fetch('/api/locked-messages', { headers }),
        fetch('/api/memories', { headers })
      ]);

      const [evData, msgData, memData] = await Promise.all([
        evRes.json(),
        msgRes.json(),
        memRes.json()
      ]);

      if (evData.events) setEvents(evData.events);
      if (msgData.messages) setMessages(msgData.messages);
      if (memData.memories) setMemories(memData.memories);
    } catch (error) {
      console.error('Error fetching features data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [coupleId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers
  const handleCreateEvent = async (data: any) => {
    const user = auth.currentUser;
    if (!user) return;
    const token = await user.getIdToken();
    
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error('Failed to create event');
    playSound(SoundType.SUCCESS);
    fetchData();
  };

  const handleCreateMessage = async (data: any) => {
    const user = auth.currentUser;
    if (!user) return;
    const token = await user.getIdToken();
    
    const res = await fetch('/api/locked-messages', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error('Failed to create message');
    playSound(SoundType.SUCCESS);
    fetchData();
  };

  const handleCreateMemory = async (data: any) => {
    const user = auth.currentUser;
    if (!user) return;
    const token = await user.getIdToken();
    
    const res = await fetch('/api/memories', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error('Failed to create memory');
    playSound(SoundType.SUCCESS);
    fetchData();
  };

  if (!coupleId) {
    return (
      <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-8 border border-white/20 text-center">
        <div className="bg-pink-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Heart className="text-pink-500 w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Connect to unlock features</h3>
        <p className="text-gray-500 max-w-xs mx-auto">
          Link with your partner to start tracking events, sending locked messages, and building memories together.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex p-1 bg-white/40 backdrop-blur-md rounded-2xl border border-white/20">
        <button
          onClick={() => setActiveTab('events')}
          className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
            activeTab === 'events' 
              ? 'bg-white text-pink-600 shadow-sm font-bold' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Events</span>
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
            activeTab === 'messages' 
              ? 'bg-white text-pink-600 shadow-sm font-bold' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Locked</span>
        </button>
        <button
          onClick={() => setActiveTab('memories')}
          className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
            activeTab === 'memories' 
              ? 'bg-white text-pink-600 shadow-sm font-bold' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Memories</span>
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[300px]">
        <AnimatePresence mode="wait">
          {activeTab === 'events' && (
            <motion.div
              key="events"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800 text-lg">Upcoming Events</h3>
                <button 
                  onClick={() => setShowEventModal(true)}
                  className="p-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors shadow-sm shadow-pink-200"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {isLoading ? (
                <div className="py-20 text-center text-gray-400">Loading events...</div>
              ) : events.length === 0 ? (
                <div className="bg-white/40 rounded-3xl p-10 text-center border border-white/20">
                  <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Calendar className="text-blue-400 w-6 h-6" />
                  </div>
                  <p className="text-gray-500">No events planned yet.</p>
                  <button 
                    onClick={() => setShowEventModal(true)}
                    className="mt-4 text-pink-500 font-medium text-sm flex items-center justify-center gap-1 mx-auto hover:gap-2 transition-all"
                  >
                    Plan your first date <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {events.map((event) => (
                    <div key={event.id} className="bg-white/60 hover:bg-white/80 transition-colors rounded-2xl p-4 border border-white/30 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        event.event_type === 'date' ? 'bg-pink-100 text-pink-500' :
                        event.event_type === 'countdown' ? 'bg-indigo-100 text-indigo-500' :
                        'bg-amber-100 text-amber-500'
                      }`}>
                        {event.event_type === 'date' ? <Heart className="w-6 h-6" /> :
                         event.event_type === 'countdown' ? <Clock className="w-6 h-6" /> :
                         <Gift className="w-6 h-6" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800">{event.title}</h4>
                        <p className="text-sm text-gray-500">{format(new Date(event.event_date), 'MMMM do, yyyy')}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-pink-500 uppercase tracking-wider bg-pink-50 px-2 py-1 rounded-lg">
                          {formatDistanceToNow(new Date(event.event_date), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'messages' && (
            <motion.div
              key="messages"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800 text-lg">Future Messages</h3>
                <button 
                  onClick={() => setShowMessageModal(true)}
                  className="p-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition-colors shadow-sm shadow-indigo-200"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              {isLoading ? (
                <div className="py-20 text-center text-gray-400">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="bg-white/40 rounded-3xl p-10 text-center border border-white/20">
                  <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="text-indigo-400 w-6 h-6" />
                  </div>
                  <p className="text-gray-500">No locked messages yet.</p>
                  <p className="text-xs text-gray-400 mt-2">Send a message for them to open later!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {messages.map((msg) => {
                    const isUnlocked = isAfter(new Date(), new Date(msg.unlock_at));
                    const isSender = msg.sender_id === dbId;
                    
                    return (
                      <div key={msg.id} className={`rounded-2xl p-4 border transition-all ${
                        isUnlocked 
                          ? 'bg-white/80 border-white/40 shadow-sm' 
                          : 'bg-gray-100/40 border-dashed border-gray-300'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className={`p-1.5 rounded-lg ${isUnlocked ? 'bg-green-100 text-green-500' : 'bg-gray-200 text-gray-500'}`}>
                            {isUnlocked ? <MessageSquare className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">
                            {isUnlocked ? 'Unlocked' : `Opens ${format(new Date(msg.unlock_at), 'MMM d')}`}
                          </span>
                        </div>
                        
                        {isUnlocked ? (
                          <p className="text-gray-700 text-sm italic">"{msg.content}"</p>
                        ) : (
                          <div className="space-y-2">
                            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-300 w-1/3" />
                            </div>
                            <p className="text-xs text-gray-400 text-center italic">Waiting for the right moment...</p>
                          </div>
                        )}
                        
                        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                          <span className="text-[10px] text-gray-400">
                            {isSender ? 'From you' : 'From partner'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'memories' && (
            <motion.div
              key="memories"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800 text-lg">Shared Memories</h3>
                <button 
                  onClick={() => setShowMemoryModal(true)}
                  className="p-2 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-colors shadow-sm shadow-amber-200"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {isLoading ? (
                <div className="py-20 text-center text-gray-400">Loading memories...</div>
              ) : memories.length === 0 ? (
                <div className="bg-white/40 rounded-3xl p-10 text-center border border-white/20">
                  <div className="bg-amber-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <ImageIcon className="text-amber-400 w-6 h-6" />
                  </div>
                  <p className="text-gray-500">Capture your first memory together.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {memories.map((mem) => (
                    <div key={mem.id} className="group relative aspect-square rounded-2xl overflow-hidden border border-white/40 shadow-sm bg-white/40">
                      {mem.image_url ? (
                        <img src={mem.image_url} alt={mem.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-50 to-amber-50">
                          <span className="text-4xl">{mem.mood || '✨'}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                        <h5 className="text-white font-bold text-xs truncate">{mem.title}</h5>
                        <p className="text-white/80 text-[10px]">{format(new Date(mem.memory_date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <CreateEventModal 
        isOpen={showEventModal} 
        onClose={() => setShowEventModal(false)} 
        onSubmit={handleCreateEvent} 
      />
      <CreateMessageModal 
        isOpen={showMessageModal} 
        onClose={() => setShowMessageModal(false)} 
        onSubmit={handleCreateMessage} 
      />
      <CreateMemoryModal 
        isOpen={showMemoryModal} 
        onClose={() => setShowMemoryModal(false)} 
        onSubmit={handleCreateMemory} 
      />
    </div>
  );
}
