import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Users, 
  Trash2, 
  Edit3, 
  Building, 
  ShieldAlert, 
  Check, 
  Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { alertSound } from '../utils/audio';

export const UrgentNoticeCard = ({ 
  notice, 
  onMarkAsRead, 
  onOpenReceipts, 
  onEdit, 
  onDelete 
}) => {
  const { user, isAdmin } = useAuth();
  const [isMarking, setIsMarking] = useState(false);

  // Compute expiry text
  const formatExpiry = (expiresAt) => {
    if (!expiresAt) return null;
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffHours = Math.round((expiry - now) / (1000 * 60 * 60));
    
    if (diffHours < 0) return 'Expired';
    if (diffHours === 0) return 'Expires soon (under 1 hour)';
    if (diffHours === 1) return 'Expires in 1 hour';
    if (diffHours < 24) return `Expires in ${diffHours} hours`;
    return `Valid until ${expiry.toLocaleDateString()}`;
  };

  const handleAcknowledge = async () => {
    if (notice.is_read_by_me || isMarking) return;
    setIsMarking(true);
    try {
      await onMarkAsRead(notice.id);
      alertSound.playSubtleAcknowledgePing();
      
      // Fire confetti burst
      confetti({
        particleCount: 60,
        spread: 55,
        origin: { y: 0.8 },
        colors: ['#ef4444', '#f59e0b', '#10b981']
      });
    } catch (err) {
      console.error('Failed to acknowledge notice:', err);
    } finally {
      setIsMarking(false);
    }
  };

  const readPercentage = notice.total_members > 0 
    ? Math.round((notice.read_count / notice.total_members) * 100) 
    : 0;

  return (
    <div className="group relative rounded-2xl bg-white dark:bg-slate-900 border-2 border-red-500/80 dark:border-red-500/60 shadow-lg shadow-red-500/10 hover:shadow-red-500/20 transition-all duration-300 beacon-urgent overflow-hidden">
      
      {/* Top Urgent Alert Bar */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-white">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-black/25 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping" />
            <ShieldAlert className="w-3.5 h-3.5" /> High Priority Alert
          </span>
          <span className="bg-white/20 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Building className="w-3 h-3" /> {notice.department_tag}
          </span>
        </div>

        {notice.expires_at && (
          <div className="flex items-center gap-1 text-xs text-white/90 font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatExpiry(notice.expires_at)}</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-snug">
            {notice.title}
          </h3>

          {/* Admin Edit/Delete Controls */}
          {isAdmin && (
            <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition shrink-0">
              <button
                onClick={() => onEdit(notice)}
                className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Edit notice"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(notice.id)}
                className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Delete notice"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <p className="mt-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line font-normal">
          {notice.content}
        </p>

        {/* Footer Info & Interactive Actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          {/* Metadata */}
          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
            <div>Posted by <span className="font-semibold text-slate-700 dark:text-slate-300">{notice.creator_name || 'Admin'}</span></div>
            <div className="text-[11px] text-slate-400">
              {new Date(notice.created_at).toLocaleString([], { 
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
              })}
            </div>
          </div>

          {/* Action Center (Member Ack vs Admin Receipts) */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            
            {/* Admin Seen Receipts Counter */}
            {isAdmin && (
              <button
                onClick={() => onOpenReceipts(notice)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
                title="Click to view full member read receipts"
              >
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                <span>Seen by <strong>{notice.read_count}</strong> / {notice.total_members}</span>
                <span className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {readPercentage}%
                </span>
                <Eye className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>
            )}

            {/* Member Acknowledge Button */}
            {!isAdmin && (
              notice.is_read_by_me ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Acknowledged</span>
                  {notice.my_read_at && (
                    <span className="text-[10px] text-emerald-600/80 font-normal">
                      • {new Date(notice.my_read_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleAcknowledge}
                  disabled={isMarking}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl font-bold text-xs shadow-md shadow-red-500/25 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isMarking ? 'Confirming...' : 'Acknowledge Notice'}</span>
                </button>
              )
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
