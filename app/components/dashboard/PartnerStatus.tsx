"use client";

import { User, CheckCircle, Clock, Heart, Link as LinkIcon, UserPlus, Sparkles } from "lucide-react";
import Link from "next/link";

interface PartnerStatusProps {
  currentUser?: {
    name: string;
    email: string;
    photoUrl?: string;
  } | null;
  partner?: {
    name: string;
    isOnline: boolean;
    lastSeen?: string;
    taskCompleted: boolean;
    mood?: string;
    photoUrl?: string;
  } | null;
  inviteCode?: string | null;
  currentUserTaskCompleted?: boolean;
  isLoading?: boolean;
}

export default function PartnerStatus({
  currentUser,
  partner,
  inviteCode,
  currentUserTaskCompleted = false,
  isLoading = false,
}: PartnerStatusProps) {
  const currentUserName = currentUser?.name || "You";
  const bothCompleted = currentUserTaskCompleted && partner?.taskCompleted;

  if (isLoading) {
    return (
      <div className="col-span-1 md:col-span-2 lg:col-span-1 bg-surface backdrop-blur-apple rounded-[24px] p-6 lg:p-8 shadow-apple-card border border-black/5 flex flex-col gap-5">
        <div className="h-6 w-32 bg-gray-100 rounded-md animate-pulse" />
        <div className="flex items-center justify-between px-2">
          <div className="w-14 h-14 rounded-full bg-gray-100 animate-pulse" />
          <div className="flex-1 px-4 h-1 bg-gray-100 animate-pulse mx-2" />
          <div className="w-14 h-14 rounded-full bg-gray-100 animate-pulse" />
        </div>
        <div className="h-16 w-full bg-gray-100 rounded-2xl animate-pulse mt-auto" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="col-span-1 md:col-span-2 lg:col-span-1 bg-surface backdrop-blur-apple rounded-[24px] p-6 lg:p-8 shadow-apple-card hover:shadow-apple-card-hover transition-all duration-500 border border-black/5 flex flex-col group relative overflow-hidden">
        {/* Animated background decoration */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-brand-rose/5 rounded-full blur-3xl group-hover:bg-brand-rose/10 transition-colors duration-700" />
        
        <h3 className="text-lg font-semibold text-[#1a1c1b] mb-5 flex items-center gap-2 relative z-10">
          <User size={20} className="text-[#78716c]" />
          Partner Status
        </h3>

        <div className="flex flex-col items-center justify-center flex-grow py-4 relative z-10">
          <div className="w-20 h-20 bg-brand-rose/10 rounded-full flex items-center justify-center mb-4 animate-pulse-slow">
            <UserPlus size={32} className="text-brand-rose" />
          </div>
          
          <h4 className="text-base font-bold text-[#1a1c1b] mb-2">No Partner Linked</h4>
          
          {inviteCode ? (
            <div className="flex flex-col items-center gap-3 w-full mb-6 text-center">
              <p className="text-[10px] uppercase tracking-widest text-[#78716c] font-black">Your Permanent Code</p>
              <div className="bg-brand-rose/5 border border-brand-rose/20 px-6 py-4 rounded-2xl w-full">
                <span className="text-2xl font-black tracking-[0.2em] text-brand-rose select-all">{inviteCode}</span>
              </div>
              <p className="text-[10px] text-[#78716c] max-w-[180px]">Share this code with your partner to start your journey together.</p>
            </div>
          ) : (
            <p className="text-xs text-[#78716c] text-center max-w-[200px] mb-6 leading-relaxed">
              Connect with your partner to track your progress together and earn daily rewards.
            </p>
          )}

          <Link 
            href="/connect"
            className="w-full py-3 px-4 bg-[#1a1c1b] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-sm active:scale-[0.98] group/btn"
          >
            <LinkIcon size={16} className="group-hover/btn:rotate-12 transition-transform" />
            {inviteCode ? "Connection Center" : "Connect Now"}
          </Link>
        </div>

        <style jsx>{`
          @keyframes pulse-slow {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
          }
          .animate-pulse-slow {
            animation: pulse-slow 3s infinite ease-in-out;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-1 bg-surface backdrop-blur-apple rounded-[24px] p-6 lg:p-8 shadow-apple-card hover:shadow-apple-card-hover transition-all duration-500 border border-black/5 flex flex-col group">
      <h3 className="text-lg font-semibold text-[#1a1c1b] mb-5 flex items-center gap-2">
        <User size={20} className="text-[#78716c]" />
        Partner Status
      </h3>

      <div className="flex flex-col gap-5 flex-grow">
        {/* Avatars and Connection Line */}
        <div className="flex items-center justify-between px-2">
          {/* Current User */}
          <div className="flex flex-col items-center gap-2 group/user">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-[#1a1c1b] to-[#4a4c4b] rounded-full flex items-center justify-center text-white font-semibold text-lg border-2 border-white shadow-sm overflow-hidden transition-transform duration-500 group-hover/user:scale-110">
                {currentUser?.photoUrl ? (
                  <img src={currentUser.photoUrl} alt={currentUserName} className="w-full h-full object-cover" />
                ) : (
                  currentUserName.charAt(0).toUpperCase()
                )}
              </div>
              {currentUserTaskCompleted && (
                <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-white animate-in zoom-in duration-300 shadow-sm">
                  <CheckCircle size={12} className="text-white" />
                </div>
              )}
              {/* Online dot */}
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white bg-green-500 shadow-sm" />
            </div>
            <span className="text-xs font-medium text-[#78716c] truncate max-w-[70px] transition-colors group-hover/user:text-black">{currentUserName}</span>
          </div>

          {/* Connection Visualizer */}
          <div className="flex-1 px-3 flex flex-col items-center gap-1.5">
            <div className="w-full h-[2px] relative overflow-hidden rounded-full bg-black/5">
              {/* Animated pulse traveling across the line */}
              <div
                className={`absolute inset-0 rounded-full transition-all duration-1000 ${
                  bothCompleted
                    ? "bg-gradient-to-r from-green-400 via-green-500 to-green-400"
                    : partner.isOnline
                    ? "bg-gradient-to-r from-brand-rose/20 via-brand-rose/50 to-brand-rose/20"
                    : "bg-gray-200"
                }`}
              />
              {partner.isOnline && (
                <div
                  className="absolute top-0 h-full w-12 bg-white/60 rounded-full"
                  style={{
                    animation: "shimmer 2s infinite linear",
                  }}
                />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {bothCompleted ? (
                <div className="relative">
                  <Heart size={10} className="text-green-500 fill-green-500 animate-pulse" />
                  <Sparkles size={14} className="absolute -top-1 -left-1 text-yellow-400 opacity-50 animate-bounce" />
                </div>
              ) : (
                <div
                  className={`w-2 h-2 rounded-full transition-colors duration-500 ${
                    partner.isOnline ? "bg-green-500 animate-pulse" : "bg-gray-300"
                  }`}
                />
              )}
              <span className="text-[10px] uppercase tracking-wider font-black text-[#78716c]">
                {bothCompleted ? "Perfectly In Sync" : partner.isOnline ? "Connected" : "Offline"}
              </span>
            </div>
          </div>

          {/* Partner User */}
          <div className="flex flex-col items-center gap-2 group/partner">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-brand-rose/20 to-[#ff4b6d]/20 rounded-full flex items-center justify-center text-brand-rose font-semibold text-lg border-2 border-white shadow-sm overflow-hidden transition-transform duration-500 group-hover/partner:scale-110">
                {partner.photoUrl ? (
                  <img
                    src={partner.photoUrl}
                    alt={partner.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  partner.name.charAt(0).toUpperCase()
                )}
              </div>
              {partner.taskCompleted && (
                <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-white animate-in zoom-in duration-300 shadow-sm">
                  <CheckCircle size={12} className="text-white" />
                </div>
              )}
              {/* Online indicator */}
              <div
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white transition-all duration-500 ${
                  partner.isOnline ? "bg-green-500" : "bg-gray-400"
                }`}
              />
            </div>
            <span className="text-xs font-medium text-[#78716c] truncate max-w-[70px] transition-colors group-hover/partner:text-black">{partner.name}</span>
          </div>
        </div>

        {/* Status Message Box */}
        <div
          className={`rounded-2xl p-4 flex items-start gap-3 transition-all duration-700 mt-auto shadow-sm border ${
            bothCompleted
              ? "bg-green-500/5 border-green-500/20"
              : partner.taskCompleted
              ? "bg-green-500/5 border-green-500/20"
              : "bg-brand-rose/5 border-brand-rose/20"
          }`}
        >
          {bothCompleted ? (
            <>
              <div className="p-1.5 bg-green-500/10 rounded-full">
                <Heart size={16} className="text-green-600 fill-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1a1c1b]">
                  Sync Completed! 🎉
                  {partner.mood && (
                    <span className="ml-2 px-1.5 py-0.5 bg-green-500/20 rounded-full text-[10px] text-green-700 font-bold align-middle uppercase tracking-tighter">
                      {partner.name} is {partner.mood}
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-[#78716c] leading-tight mt-0.5 font-medium">
                  Amazing teamwork! You&apos;re both growing together. Check your timeline for new memories.
                </p>
              </div>
            </>
          ) : partner.taskCompleted ? (
            <>
              <div className="p-1.5 bg-green-500/10 rounded-full">
                <CheckCircle size={16} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1a1c1b]">
                  {partner.name} is waiting!
                  {partner.mood && (
                    <span className="ml-2 px-1.5 py-0.5 bg-green-500/20 rounded-full text-[10px] text-green-700 font-bold align-middle uppercase tracking-tighter">
                      Feeling {partner.mood}
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-[#78716c] leading-tight mt-0.5 font-medium">
                  Your partner completed their reflection. Complete yours to unlock their message!
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-1.5 bg-brand-rose/10 rounded-full">
                <Clock size={16} className="text-brand-rose" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1a1c1b]">
                  Ongoing Progress
                  {partner.mood && (
                    <span className="ml-2 px-1.5 py-0.5 bg-brand-rose/20 rounded-full text-[10px] text-brand-rose font-bold align-middle uppercase tracking-tighter">
                      {partner.name}: {partner.mood}
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-[#78716c] leading-tight mt-0.5 font-medium">
                  We&apos;ll notify you as soon as {partner.name} completes today&apos;s activity. Hang tight!
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { left: -48px; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}
