"use client";
import { useState } from "react";

import { User, CheckCircle, Clock, Heart, Link as LinkIcon, UserPlus, Sparkles, ShieldAlert, RefreshCw } from "lucide-react";
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
  coupleStatus?: string | null;
  onDisconnect?: () => Promise<void>;
  onJoin?: (code: string) => Promise<void>;
}

export default function PartnerStatus({
  currentUser,
  partner,
  inviteCode,
  currentUserTaskCompleted = false,
  isLoading = false,
  coupleStatus,
  onDisconnect,
  onJoin,
}: PartnerStatusProps) {
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const currentUserName = currentUser?.name || "You";
  const bothCompleted = currentUserTaskCompleted && partner?.taskCompleted;

  const handleJoinPartner = async () => {
    if (!onJoin || joinCode.length < 4) return;
    setIsActionLoading(true);
    setError(null);
    try {
      await onJoin(joinCode);
      setIsConnectModalOpen(false);
      setJoinCode("");
    } catch (err: any) {
      setError(err.message || "Failed to join. Please check the code.");
    } finally {
      setIsActionLoading(false);
    }
  };

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

  // If connected but partner profile not found, show a basic linked state
  if (!partner && coupleStatus === 'active') {
    return (
      <div className="col-span-1 md:col-span-2 lg:col-span-1 bg-surface backdrop-blur-apple rounded-[24px] p-6 lg:p-8 shadow-apple-card border border-black/5 flex flex-col">
        <div className="flex flex-col items-center py-4">
          <div className="w-16 h-16 bg-brand-rose/10 rounded-full flex items-center justify-center mb-4">
            <User size={28} className="text-brand-rose/40" />
          </div>
          <h3 className="text-lg font-bold text-black mb-1">Partner Linked</h3>
          <p className="text-xs text-[#78716c] mb-6 text-center">Waiting for partner to sync profile...</p>
          
          <button
            onClick={() => setIsManageModalOpen(true)}
            className="w-full py-2.5 px-4 bg-black/5 text-[#78716c] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 hover:bg-black/10 transition-all"
          >
            <ShieldAlert size={14} />
            Manage Connection
          </button>
        </div>
        {isManageModalOpen && (
          <ManageModal 
            onClose={() => setIsManageModalOpen(false)} 
            onDisconnect={onDisconnect} 
            coupleStatus={coupleStatus}
          />
        )}
      </div>
    );
  }

  if (!partner) {
    const isPending = coupleStatus === 'pending';

    return (
      <div className="col-span-1 md:col-span-2 lg:col-span-1 bg-surface backdrop-blur-apple rounded-[24px] p-6 lg:p-8 shadow-apple-card hover:shadow-apple-card-hover transition-all duration-500 border border-black/5 flex flex-col group relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-brand-rose/5 rounded-full blur-3xl group-hover:bg-brand-rose/10 transition-colors duration-700" />

        <h3 className="text-lg font-semibold text-[#1a1c1b] mb-5 flex items-center gap-2 relative z-10">
          <User size={20} className="text-[#78716c]" />
          Partner Status
        </h3>

        <div className="flex flex-col items-center justify-center flex-grow py-4 relative z-10">
          {isPending ? (
            <>
              <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-4 animate-pulse-slow">
                <Clock size={32} className="text-amber-500" />
              </div>

              <h4 className="text-base font-bold text-[#1a1c1b] mb-2">Waiting for Partner</h4>

              <div className="flex flex-col items-center gap-3 w-full mb-6 text-center">
                <p className="text-[10px] uppercase tracking-widest text-[#78716c] font-black">Your Connection Code</p>
                <div className="bg-amber-500/10 border border-amber-500/20 px-6 py-4 rounded-2xl w-full group/code relative">
                  <span className="text-2xl font-black tracking-[0.2em] text-amber-600 select-all">{inviteCode}</span>
                </div>
                <p className="text-[10px] text-[#78716c] max-w-[180px]">Your partner needs to enter this code to connect with you.</p>
              </div>

              <div className="flex flex-col w-full gap-2 mt-auto">
                <button
                  onClick={() => setIsConnectModalOpen(true)}
                  className="w-full py-3 px-4 bg-[#1a1c1b] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-sm active:scale-[0.98]"
                >
                  <LinkIcon size={16} />
                  Enter Partner's Code
                </button>
                
                <button
                  onClick={() => setIsManageModalOpen(true)}
                  className="w-full py-2.5 px-4 bg-white border border-rose-100 text-rose-500 rounded-xl text-xs font-bold hover:bg-rose-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <ShieldAlert size={14} />
                  Manage Connection
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-brand-rose/10 rounded-full flex items-center justify-center mb-4 animate-pulse-slow">
                <UserPlus size={32} className="text-brand-rose" />
              </div>

              <h4 className="text-base font-bold text-[#1a1c1b] mb-2">No Partner Linked</h4>

              <div className="flex flex-col items-center gap-3 w-full mb-6 text-center">
                <p className="text-[10px] uppercase tracking-widest text-[#78716c] font-black">Your Permanent Code</p>
                <div className="bg-brand-rose/5 border border-brand-rose/20 px-6 py-4 rounded-2xl w-full group/code relative">
                  <span className="text-2xl font-black tracking-[0.2em] text-brand-rose select-all">{inviteCode}</span>
                </div>
                <p className="text-[10px] text-[#78716c] max-w-[180px]">Share this code with your partner to start your journey together.</p>
              </div>

              <div className="flex flex-col w-full gap-3 mt-auto">
                <button
                  onClick={() => setIsConnectModalOpen(true)}
                  className="w-full py-3 px-4 bg-brand-rose text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-brand-rose-dark transition-all shadow-sm active:scale-[0.98]"
                >
                  <LinkIcon size={16} />
                  Enter Partner's Code
                </button>

                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-black/5" />
                  <span className="text-[10px] text-[#78716c] font-bold uppercase tracking-wider">or</span>
                  <div className="h-px flex-1 bg-black/5" />
                </div>

                <Link
                  href="/connect"
                  className="w-full py-3 px-4 bg-black/5 text-[#1a1c1b] rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-black/10 transition-all"
                >
                  <Heart size={16} />
                  Connection Center
                </Link>
              </div>
            </>
          )}
        </div>

        {isConnectModalOpen && (
          <ConnectModal 
            onClose={() => setIsConnectModalOpen(false)} 
            onJoin={handleJoinPartner}
            joinCode={joinCode}
            setJoinCode={setJoinCode}
            isLoading={isActionLoading}
            error={error}
          />
        )}

        {isManageModalOpen && (
          <ManageModal 
            onClose={() => setIsManageModalOpen(false)} 
            onDisconnect={onDisconnect} 
            coupleStatus={coupleStatus}
          />
        )}

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
        <button 
          onClick={() => window.location.reload()} 
          className="ml-auto p-1.5 hover:bg-black/5 rounded-full text-[#78716c] transition-all"
          title="Refresh connection"
        >
          <RefreshCw size={14} />
        </button>
      </h3>

      <div className="flex flex-col gap-5 flex-grow">
        <div className="flex items-center justify-between px-2">
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
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white bg-green-500 shadow-sm" />
            </div>
            <span className="text-xs font-medium text-[#78716c] truncate max-w-[70px] transition-colors group-hover/user:text-black">{currentUserName}</span>
          </div>

          <div className="flex-1 px-3 flex flex-col items-center gap-1.5">
            <div className="w-full h-[2px] relative overflow-hidden rounded-full bg-black/5">
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
              <div
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white transition-all duration-500 ${
                  partner.isOnline ? "bg-green-500" : "bg-gray-400"
                }`}
              />
            </div>
            <span className="text-xs font-medium text-[#78716c] truncate max-w-[70px] transition-colors group-hover/partner:text-black">{partner.name}</span>
          </div>
        </div>

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

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={() => setIsManageModalOpen(true)}
            className="p-2.5 bg-black/5 text-[#78716c] rounded-xl hover:bg-black/10 transition-all active:scale-[0.98]"
            title="Settings"
          >
            <ShieldAlert size={16} />
          </button>
        </div>
      </div>

      {isManageModalOpen && (
        <ManageModal 
          onClose={() => setIsManageModalOpen(false)} 
          onDisconnect={onDisconnect} 
          coupleStatus={coupleStatus}
        />
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% { left: -48px; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}

function ConnectModal({ onClose, onJoin, joinCode, setJoinCode, isLoading, error }: any) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl relative z-[101] animate-in zoom-in-95 duration-300 border border-black/5">
        <h3 className="text-2xl font-black text-[#1a1c1b] mb-2">Connect with Partner</h3>
        <p className="text-sm text-[#78716c] mb-8">Enter the secret code your partner shared with you to link your accounts.</p>
        
        <div className="space-y-6">
          <div className="relative group">
            <input
              type="text"
              autoFocus
              placeholder="PASTE CODE HERE"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="w-full bg-black/5 border border-black/10 rounded-2xl px-6 py-5 text-2xl font-black tracking-[0.2em] text-center placeholder:text-sm placeholder:tracking-normal placeholder:font-medium focus:outline-none focus:ring-4 focus:ring-brand-rose/20 transition-all"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-500 font-bold flex items-center gap-3 animate-in shake duration-500">
              <ShieldAlert size={16} />
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={onJoin}
              disabled={isLoading || joinCode.length < 4}
              className="w-full py-4 bg-brand-rose text-white rounded-2xl text-base font-black hover:bg-brand-rose-dark transition-all shadow-lg shadow-brand-rose/20 disabled:opacity-50 disabled:shadow-none active:scale-[0.98] flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LinkIcon size={20} />
                  Link Accounts Now
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 text-sm font-bold text-[#78716c] hover:text-black transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ManageModal({ onClose, onDisconnect, coupleStatus }: any) {
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const handleDisconnect = async () => {
    if (!onDisconnect) return;
    setIsActionLoading(true);
    try {
      await onDisconnect();
      onClose();
    } catch (err) {
      alert("Failed to disconnect. Please try again.");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl relative z-[101] animate-in zoom-in-95 duration-300 border border-black/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-black/5 rounded-xl flex items-center justify-center text-[#1a1c1b]">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#1a1c1b]">Manage Connection</h3>
            <p className="text-xs text-[#78716c]">Current Status: <span className="text-brand-rose font-bold uppercase">{coupleStatus || 'None'}</span></p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
            <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
              If you're having trouble connecting or see an "Already part of a couple" error, you can force a reset below. This will clear your current partnership data.
            </p>
          </div>

          <div className="pt-2">
            {!confirmDisconnect ? (
              <button
                onClick={() => setConfirmDisconnect(true)}
                className="w-full py-3.5 px-4 bg-rose-50 text-rose-500 rounded-xl text-sm font-bold hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
              >
                Disconnect & Reset Profile
              </button>
            ) : (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <p className="text-xs text-center font-bold text-rose-600">Are you absolutely sure? This cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDisconnect}
                    disabled={isActionLoading}
                    className="flex-1 py-3 bg-rose-500 text-white rounded-xl text-sm font-bold hover:bg-rose-600 transition-all disabled:opacity-50"
                  >
                    {isActionLoading ? "Processing..." : "Yes, Disconnect"}
                  </button>
                  <button
                    onClick={() => setConfirmDisconnect(false)}
                    className="flex-1 py-3 bg-black/5 text-[#1a1c1b] rounded-xl text-sm font-bold hover:bg-black/10 transition-all"
                  >
                    No, Go Back
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 text-sm font-bold text-[#78716c] hover:text-black transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
