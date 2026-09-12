import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  ShieldAlert, 
  Bell, 
  Building, 
  Calendar, 
  Sparkles,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = ['All Departments', 'CSE', 'IT', 'Exams', 'Admin', 'Mechanical'];

export const NoticeComposerModal = ({ isOpen, onClose, onNoticeCreated, editingNotice }) => {
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('urgent');
  const [departmentTag, setDepartmentTag] = useState('All Departments');
  const [expiresAt, setExpiresAt] = useState('');
  const [immediatePush, setImmediatePush] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Populate when editing
  useEffect(() => {
    if (editingNotice) {
      setTitle(editingNotice.title);
      setContent(editingNotice.content);
      setPriority(editingNotice.priority);
      setDepartmentTag(editingNotice.department_tag);
      setExpiresAt(editingNotice.expires_at ? editingNotice.expires_at.substring(0, 16) : '');
      setImmediatePush(false);
    } else {
      setTitle('');
      setContent('');
      setPriority('urgent');
      setDepartmentTag('All Departments');
      // Default expiry 24 hours from now
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const isoLocal = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setExpiresAt(isoLocal);
      setImmediatePush(true);
    }
    setError('');
  }, [editingNotice, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Please provide both title and content for the notice.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const payload = {
        title: title.trim(),
        content: content.trim(),
        priority,
        department_tag: departmentTag,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        immediate_push: immediatePush
      };

      const url = editingNotice ? `/api/notices/${editingNotice.id}` : '/api/notices';
      const method = editingNotice ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to submit notice');
      }

      const saved = await res.json();
      onNoticeCreated(saved);
      onClose();
    } catch (err) {
      console.error('Error saving notice:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={`px-6 py-4 flex items-center justify-between text-white ${
          priority === 'urgent' 
            ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600' 
            : 'bg-gradient-to-r from-indigo-600 to-violet-600'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              {priority === 'urgent' ? <ShieldAlert className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-lg">
                {editingNotice ? 'Edit Notice' : priority === 'urgent' ? 'Compose Urgent Notice' : 'Post Announcement'}
              </h3>
              <p className="text-xs text-white/80">
                {priority === 'urgent' 
                  ? 'Triggers live audio ping & desktop push alert across all active sessions'
                  : 'Published to the standard notice feed'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Priority Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Notice Priority
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPriority('urgent')}
                className={`p-3 rounded-2xl border-2 text-left transition flex items-center gap-3 cursor-pointer ${
                  priority === 'urgent'
                    ? 'border-red-500 bg-red-50/70 dark:bg-red-950/30 text-red-900 dark:text-red-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/50 text-red-600">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm">Urgent Alert</p>
                  <p className="text-[11px] text-slate-500">Instant push banner + chime</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPriority('regular')}
                className={`p-3 rounded-2xl border-2 text-left transition flex items-center gap-3 cursor-pointer ${
                  priority === 'regular'
                    ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm">Regular Notice</p>
                  <p className="text-[11px] text-slate-500">Standard announcement</p>
                </div>
              </button>
            </div>
          </div>

          {/* Department Target & Expiry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Target Department
              </label>
              <div className="relative">
                <select
                  value={departmentTag}
                  onChange={(e) => setDepartmentTag(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Expiry Date & Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Notice Title
            </label>
            <input
              type="text"
              placeholder="e.g., [EMERGENCY] Server Cluster Maintenance Tonight"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Notice Content
            </label>
            <textarea
              rows={4}
              placeholder="Enter detailed notice information, instructions, deadlines..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y"
              required
            />
          </div>

          {/* Immediate Push Toggle for Urgent Notices */}
          {priority === 'urgent' && !editingNotice && (
            <div className="flex items-center justify-between p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="font-bold text-xs text-amber-900 dark:text-amber-300">
                    Immediate Push Alert & Audio Chime
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    All currently connected members will instantly see the banner and hear the alert ping
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={immediatePush}
                  onChange={(e) => setImmediatePush(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white flex items-center gap-2 shadow-md transition cursor-pointer ${
                priority === 'urgent'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-red-500/25'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Publishing...' : editingNotice ? 'Update Notice' : 'Publish & Broadcast'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
