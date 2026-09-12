import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  BellRing, 
  Building, 
  Check, 
  Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ReadReceiptsModal = ({ isOpen, onClose, notice }) => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('seen'); // 'seen' | 'unread'
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nudgedUsers, setNudgedUsers] = useState(new Set());

  useEffect(() => {
    if (!isOpen || !notice) return;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/notices/${notice.id}/reads`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      } catch (err) {
        console.error('Failed to fetch read analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [isOpen, notice, token]);

  if (!isOpen || !notice) return null;

  const handleNudge = (userId) => {
    setNudgedUsers(prev => new Set([...prev, userId]));
  };

  const percentage = analytics && analytics.total_members > 0
    ? Math.round((analytics.seen_count / analytics.total_members) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
                notice.priority === 'urgent' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-indigo-500 text-white'
              }`}>
                {notice.priority} Notice
              </span>
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Building className="w-3 h-3" /> {notice.department_tag}
              </span>
            </div>
            <h3 className="font-extrabold text-base sm:text-lg line-clamp-1">
              {notice.title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Detailed Member Read Receipts & Acknowledgment Log
            </p>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Analytics Highlights Bar */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-center py-4">
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {analytics?.total_members || 0}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              Total Members
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
              {analytics?.seen_count || 0}
              <span className="text-xs font-bold text-emerald-500">({percentage}%)</span>
            </div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              Acknowledged
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {analytics?.unread_count || 0}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              Pending Seen
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 pt-3 gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('seen')}
            className={`pb-3 border-b-2 flex items-center gap-2 cursor-pointer transition ${
              activeTab === 'seen'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Seen by ({analytics?.seen_count || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('unread')}
            className={`pb-3 border-b-2 flex items-center gap-2 cursor-pointer transition ${
              activeTab === 'unread'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pending Acknowledgment ({analytics?.unread_count || 0})</span>
          </button>
        </div>

        {/* List Content */}
        <div className="p-6 max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Loading read receipts...
            </div>
          ) : activeTab === 'seen' ? (
            analytics?.seen_members.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No members have acknowledged this notice yet.
              </div>
            ) : (
              analytics?.seen_members.map((member) => (
                <div key={member.user_id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {member.name}
                      </h5>
                      <p className="text-[11px] text-slate-400">
                        {member.department} • {member.email}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60">
                      <Check className="w-3 h-3" />
                      {new Date(member.read_at).toLocaleTimeString([], { 
                        hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>
              ))
            )
          ) : (
            analytics?.unread_members.length === 0 ? (
              <div className="py-8 text-center text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                Outstanding! All members have viewed and acknowledged this notice.
              </div>
            ) : (
              analytics?.unread_members.map((member) => {
                const nudged = nudgedUsers.has(member.user_id);

                return (
                  <div key={member.user_id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                          {member.name}
                        </h5>
                        <p className="text-[11px] text-slate-400">
                          {member.department} • {member.email}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleNudge(member.user_id)}
                      disabled={nudged}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                        nudged
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200'
                      }`}
                    >
                      {nudged ? (
                        <>
                          <Check className="w-3 h-3" /> Nudge Sent
                        </>
                      ) : (
                        <>
                          <BellRing className="w-3 h-3" /> Nudge Member
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold rounded-xl hover:opacity-90 transition cursor-pointer"
          >
            Close Receipts
          </button>
        </div>

      </div>
    </div>
  );
};
