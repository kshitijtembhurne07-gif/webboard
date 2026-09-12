import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  ShieldAlert, 
  Calendar, 
  Search, 
  Filter, 
  Sparkles, 
  Plus, 
  Radio, 
  Layers, 
  BookOpen, 
  Flame, 
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { PushAlertBanner } from './components/PushAlertBanner';
import { UrgentNoticeCard } from './components/UrgentNoticeCard';
import { RegularNoticeCard } from './components/RegularNoticeCard';
import { TimetableTracker } from './components/TimetableTracker';
import { NoticeComposerModal } from './components/NoticeComposerModal';
import { ReadReceiptsModal } from './components/ReadReceiptsModal';
import { TimetableSlotModal } from './components/TimetableSlotModal';
import { LoginModal } from './components/LoginModal';

const DEPARTMENTS = ['All Departments', 'CSE', 'IT', 'Exams', 'Admin', 'Mechanical'];

function Dashboard() {
  const { user, token, isAdmin } = useAuth();
  const { addSocketListener } = useSocket();

  // Notices state
  const [notices, setNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(true);
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' (notices + timetable) | 'announcements' | 'timetable'

  // Modals state
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [receiptsNotice, setReceiptsNotice] = useState(null);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Ref to urgent section for smooth scroll on push alert click
  const urgentSectionRef = useRef(null);

  // Fetch notices from backend
  const fetchNotices = async () => {
    try {
      setLoadingNotices(true);
      let url = '/api/notices';
      const params = new URLSearchParams();
      if (selectedDept !== 'All Departments') {
        params.append('department', selectedDept);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setNotices(data);
      }
    } catch (err) {
      console.error('Failed to fetch notices:', err);
    } finally {
      setLoadingNotices(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [token, selectedDept, searchQuery]);

  // Subscribe to WebSocket live events
  useEffect(() => {
    const unsubscribe = addSocketListener((event) => {
      console.log('[NoticePulse Event]', event);
      if (event.type === 'URGENT_NOTICE_ALERT' || event.type === 'NEW_NOTICE') {
        // Prepend notice to list
        setNotices((prev) => {
          // Avoid duplicate
          const filtered = prev.filter(n => n.id !== event.notice.id);
          return [event.notice, ...filtered];
        });
      } else if (event.type === 'NOTICE_UPDATED') {
        setNotices((prev) =>
          prev.map(n => n.id === event.notice.id ? { ...n, ...event.notice } : n)
        );
      } else if (event.type === 'NOTICE_DELETED') {
        setNotices((prev) => prev.filter(n => n.id !== event.notice_id));
      } else if (event.type === 'NOTICE_READ_RECEIPT') {
        // Update seen count in real time
        setNotices((prev) =>
          prev.map(n => {
            if (n.id === event.notice_id) {
              return {
                ...n,
                read_count: event.read_count,
                total_members: event.total_members
              };
            }
            return n;
          })
        );
      }
    });

    return unsubscribe;
  }, [addSocketListener]);

  // Mark notice as read
  const handleMarkAsRead = async (noticeId) => {
    if (!token) {
      setIsLoginModalOpen(true);
      return;
    }
    const res = await fetch(`/api/notices/${noticeId}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setNotices((prev) =>
        prev.map(n => n.id === noticeId ? { ...n, is_read_by_me: true, my_read_at: data.read_at, read_count: n.read_count + 1 } : n)
      );
    }
  };

  // Delete notice
  const handleDeleteNotice = async (noticeId) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      const res = await fetch(`/api/notices/${noticeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotices((prev) => prev.filter(n => n.id !== noticeId));
      }
    } catch (err) {
      console.error('Failed to delete notice:', err);
    }
  };

  // Separate Urgent vs Regular notices
  const urgentNotices = notices.filter(n => n.priority === 'urgent');
  const regularNotices = notices.filter(n => n.priority === 'regular');

  const scrollToUrgent = () => {
    if (urgentSectionRef.current) {
      urgentSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      
      {/* Real-Time Push Alert Banner */}
      <PushAlertBanner onSelectNotice={scrollToUrgent} />

      {/* Top Navigation */}
      <Navbar 
        onOpenComposer={() => {
          setEditingNotice(null);
          setIsComposerOpen(true);
        }}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
      />

      {/* Hero Header / Filter Bar */}
      <div className="bg-white dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800/80 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-xl">
                <Flame className="w-5 h-5" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white m-0">
                NoticePulse Feed
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Urgency-based broadcast network, department alerts, and daily schedule tracker
            </p>
          </div>

          {/* Search and Department Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notices..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>
              )}
            </div>

            {/* Department Dropdown */}
            <div className="relative">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
              >
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchNotices}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Refresh feeds"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Switcher Tabs (All / Announcements / Timetable) */}
        <div className="max-w-7xl mx-auto flex items-center gap-2 mt-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" /> Dual Feed & Timetable
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'announcements'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Bell className="w-4 h-4" /> Regular Notices Only ({regularNotices.length})
          </button>

          <button
            onClick={() => setActiveTab('timetable')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'timetable'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" /> Timetable Tracker Only
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        
        {/* =========================================================================
            SECTION 1: URGENT NOTICES FEED (High Priority, Pulse Alerts, Crimson Accents)
           ========================================================================= */}
        <section ref={urgentSectionRef} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 m-0">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                Urgent Push Alert Feed
              </h2>
              <span className="bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-900">
                {urgentNotices.length} active
              </span>
            </div>

            {isAdmin && (
              <button
                onClick={() => {
                  setEditingNotice(null);
                  setIsComposerOpen(true);
                }}
                className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Post Urgent Notice
              </button>
            )}
          </div>

          {loadingNotices ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              Loading real-time notices...
            </div>
          ) : urgentNotices.length === 0 ? (
            <div className="p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-sm text-emerald-900 dark:text-emerald-300">
                No active urgent alerts at this moment
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                All campus departments are operating smoothly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {urgentNotices.map((notice) => (
                <UrgentNoticeCard
                  key={notice.id}
                  notice={notice}
                  onMarkAsRead={handleMarkAsRead}
                  onOpenReceipts={(n) => setReceiptsNotice(n)}
                  onEdit={(n) => {
                    setEditingNotice(n);
                    setIsComposerOpen(true);
                  }}
                  onDelete={handleDeleteNotice}
                />
              ))}
            </div>
          )}
        </section>


        {/* =========================================================================
            SECTION 2: DUAL REGULAR NOTICES & DAILY TIMETABLE TRACKER
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Regular Announcements Column */}
          {(activeTab === 'all' || activeTab === 'announcements') && (
            <section className={`${activeTab === 'announcements' ? 'lg:col-span-12' : 'lg:col-span-7'} space-y-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white m-0">
                    Department Announcements
                  </h2>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {regularNotices.length}
                  </span>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setEditingNotice(null);
                      setIsComposerOpen(true);
                    }}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Post Announcement
                  </button>
                )}
              </div>

              {loadingNotices ? (
                <div className="py-8 text-center text-slate-400 text-sm">
                  Loading announcements...
                </div>
              ) : regularNotices.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-sm">
                  No announcements found for {selectedDept}.
                </div>
              ) : (
                <div className="space-y-4">
                  {regularNotices.map((notice) => (
                    <RegularNoticeCard
                      key={notice.id}
                      notice={notice}
                      onMarkAsRead={handleMarkAsRead}
                      onOpenReceipts={(n) => setReceiptsNotice(n)}
                      onEdit={(n) => {
                        setEditingNotice(n);
                        setIsComposerOpen(true);
                      }}
                      onDelete={handleDeleteNotice}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Daily Timetable Tracker Column */}
          {(activeTab === 'all' || activeTab === 'timetable') && (
            <section className={`${activeTab === 'timetable' ? 'lg:col-span-12' : 'lg:col-span-5'}`}>
              <TimetableTracker
                onOpenAddSlot={() => {
                  setEditingSlot(null);
                  setIsSlotModalOpen(true);
                }}
                onEditSlot={(slot) => {
                  setEditingSlot(slot);
                  setIsSlotModalOpen(true);
                }}
                onDeleteSlot={async (slotId) => {
                  if (!window.confirm('Delete this timetable slot?')) return;
                  await fetch(`/api/timetable/${slotId}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                  });
                }}
              />
            </section>
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-900/50">
        <p className="font-semibold">NoticePulse • Smart Notice Board with Push Alerts & Timetable Tracker</p>
        <p className="mt-1 text-slate-400">FastAPI • SQLite • WebSockets • React & Tailwind CSS</p>
      </footer>

      {/* Modals */}
      <NoticeComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        editingNotice={editingNotice}
        onNoticeCreated={(savedNotice) => {
          fetchNotices();
        }}
      />

      <ReadReceiptsModal
        isOpen={!!receiptsNotice}
        onClose={() => setReceiptsNotice(null)}
        notice={receiptsNotice}
      />

      <TimetableSlotModal
        isOpen={isSlotModalOpen}
        onClose={() => setIsSlotModalOpen(false)}
        editingSlot={editingSlot}
        onSlotSaved={() => {
          // Trigger refresh in TimetableTracker via custom event or state
          window.dispatchEvent(new Event('refresh_timetable'));
        }}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Dashboard />
      </SocketProvider>
    </AuthProvider>
  );
}
