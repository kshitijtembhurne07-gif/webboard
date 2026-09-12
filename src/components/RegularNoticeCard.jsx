import React, { useState } from 'react';
import { 
  Building, 
  Calendar, 
  Check, 
  CheckCircle2, 
  Users, 
  Edit3, 
  Trash2, 
  Eye 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { alertSound } from '../utils/audio';

export const RegularNoticeCard = ({ 
  notice, 
  onMarkAsRead, 
  onOpenReceipts, 
  onEdit, 
  onDelete 
}) => {
  const { isAdmin } = useAuth();
  const [isMarking, setIsMarking] = useState(false);

  const handleAcknowledge = async () => {
    if (notice.is_read_by_me || isMarking) return;
    setIsMarking(true);
    try {
      await onMarkAsRead(notice.id);
      alertSound.playSubtleAcknowledgePing();
      confetti({
        particleCount: 40,
        spread: 45,
        origin: { y: 0.85 }
      });
    } catch (err) {
      console.error('Failed to acknowledge regular notice:', err);
    } finally {
      setIsMarking(false);
    }
  };

  const getDeptBadgeColor = (dept) => {
    switch (dept) {
      case 'CSE':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'IT':
        return 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
      case 'Exams':
        return 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Admin':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 p-5 sm:p-6 flex flex-col justify-between">
      <div>
        {/* Header Tags & Admin Controls */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${getDeptBadgeColor(notice.department_tag)}`}>
            <Building className="w-3 h-3" />
            {notice.department_tag}
          </span>

          {isAdmin && (
            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
              <button
                onClick={() => onEdit(notice)}
                className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Edit notice"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(notice.id)}
                className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Delete notice"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Title & Body */}
        <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
          {notice.title}
        </h4>
        <p className="mt-2 text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line line-clamp-4">
          {notice.content}
        </p>
      </div>

      {/* Footer */}
      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        
        <div className="text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>
            {new Date(notice.created_at).toLocaleDateString([], { 
              month: 'short', day: 'numeric' 
            })} • {notice.creator_name || 'Admin'}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {isAdmin ? (
            <button
              onClick={() => onOpenReceipts(notice)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span>Seen: {notice.read_count} / {notice.total_members}</span>
              <Eye className="w-3 h-3 text-slate-400" />
            </button>
          ) : (
            notice.is_read_by_me ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4" /> Read
              </span>
            ) : (
              <button
                onClick={handleAcknowledge}
                disabled={isMarking}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg text-xs transition cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Mark as Read
              </button>
            )
          )}
        </div>

      </div>
    </div>
  );
};
