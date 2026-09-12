import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  MapPin, 
  Plus, 
  Trash2, 
  Edit2, 
  CalendarDays, 
  BookOpen, 
  Radio, 
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const TimetableTracker = ({ onOpenAddSlot, onEditSlot, onDeleteSlot }) => {
  const { isAdmin } = useAuth();
  
  // Determine current day of week
  const getTodayName = () => {
    const dayIndex = new Date().getDay(); // 0 is Sun, 1 is Mon...
    const map = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = map[dayIndex];
    return DAYS.includes(today) ? today : 'Monday';
  };

  const [selectedDay, setSelectedDay] = useState(getTodayName());
  const [selectedDept, setSelectedDept] = useState('All');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch slots for selectedDay and dept
  const fetchSlots = async () => {
    try {
      setLoading(true);
      let url = `/api/timetable?day_of_week=${selectedDay}`;
      if (selectedDept !== 'All') {
        url += `&department=${encodeURIComponent(selectedDept)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSlots(data);
      }
    } catch (err) {
      console.error('Failed to fetch timetable slots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();

    const handleRefresh = () => fetchSlots();
    window.addEventListener('refresh_timetable', handleRefresh);
    return () => window.removeEventListener('refresh_timetable', handleRefresh);
  }, [selectedDay, selectedDept]);

  // Format current time HH:MM
  const currentHours = String(currentTime.getHours()).padStart(2, '0');
  const currentMinutes = String(currentTime.getMinutes()).padStart(2, '0');
  const currentHM = `${currentHours}:${currentMinutes}`;
  const isSelectedDayToday = selectedDay.toLowerCase() === getTodayName().toLowerCase();

  // Helper to check if slot is active right now
  const isSlotLive = (slot) => {
    if (!isSelectedDayToday) return false;
    return currentHM >= slot.start_time && currentHM < slot.end_time;
  };

  // Helper to calculate progress percentage for active slot
  const getSlotProgress = (slot) => {
    const [startH, startM] = slot.start_time.split(':').map(Number);
    const [endH, endM] = slot.end_time.split(':').map(Number);
    const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    const elapsedMinutes = (currentTime.getHours() * 60 + currentTime.getMinutes()) - (startH * 60 + startM);
    return Math.min(100, Math.max(0, Math.round((elapsedMinutes / totalMinutes) * 100)));
  };

  // Helper to check next upcoming slot
  const isNextUpcoming = (slot) => {
    if (!isSelectedDayToday) return false;
    // Find slots today starting after currentHM
    const upcomingToday = slots
      .filter(s => s.start_time > currentHM)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
    return upcomingToday.length > 0 && upcomingToday[0].id === slot.id;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm">
      
      {/* Header with Live Clock & Admin Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Daily Timetable Tracker
            </h3>
            {isSelectedDayToday && (
              <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Today
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time schedule tracking with automatic active period detection
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Digital Clock */}
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2 shadow-inner">
            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          {/* Admin Add Slot */}
          {isAdmin && (
            <button
              onClick={onOpenAddSlot}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Slot
            </button>
          )}
        </div>
      </div>

      {/* Weekday Selector Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-4 scrollbar-none">
        {DAYS.map((day) => {
          const isToday = day.toLowerCase() === getTodayName().toLowerCase();
          const isSelected = selectedDay === day;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {day}
              {isToday && (
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Department Filter Pills */}
      <div className="flex items-center gap-2 pb-5 text-xs">
        <span className="text-slate-400 font-medium">Department:</span>
        {['All', 'CSE', 'IT', 'Exams'].map((dept) => (
          <button
            key={dept}
            onClick={() => setSelectedDept(dept)}
            className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
              selectedDept === dept
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* Slots List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Loading timetable schedule...
          </div>
        ) : slots.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <BookOpen className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              No timetable slots scheduled for {selectedDay}.
            </p>
            {isAdmin && (
              <button
                onClick={onOpenAddSlot}
                className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
              >
                + Add first slot for {selectedDay}
              </button>
            )}
          </div>
        ) : (
          slots.map((slot) => {
            const live = isSlotLive(slot);
            const next = isNextUpcoming(slot);
            const progress = live ? getSlotProgress(slot) : 0;

            return (
              <div
                key={slot.id}
                className={`relative rounded-2xl p-4 sm:p-5 transition-all duration-300 border ${
                  live
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-500 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/30'
                    : next
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-400/80'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                {/* Status Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
                      {slot.start_time} - {slot.end_time}
                    </span>

                    {live && (
                      <span className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        Live Now
                      </span>
                    )}

                    {next && (
                      <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full">
                        Upcoming Next
                      </span>
                    )}

                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300">
                      {slot.department}
                    </span>
                  </div>

                  {/* Admin inline controls */}
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditSlot(slot)}
                        className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition cursor-pointer"
                        title="Edit slot"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteSlot(slot.id)}
                        className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded transition cursor-pointer"
                        title="Delete slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Subject Title & Room */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mt-1">
                  <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    {slot.title}
                  </h4>
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span>{slot.room}</span>
                  </div>
                </div>

                {/* Progress bar for currently live class */}
                {live && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mb-1">
                      <span>Period In Progress ({progress}%)</span>
                      <span>Ends at {slot.end_time}</span>
                    </div>
                    <div className="w-full bg-emerald-200 dark:bg-emerald-950 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
