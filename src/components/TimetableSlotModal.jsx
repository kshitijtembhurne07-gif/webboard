import React, { useState, useEffect } from 'react';
import { X, CalendarDays, Clock, MapPin, Building, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DEPARTMENTS = ['CSE', 'IT', 'Exams', 'Admin', 'Mechanical', 'All Departments'];

export const TimetableSlotModal = ({ isOpen, onClose, onSlotSaved, editingSlot }) => {
  const { token } = useAuth();
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [room, setRoom] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingSlot) {
      setDayOfWeek(editingSlot.day_of_week);
      setStartTime(editingSlot.start_time);
      setEndTime(editingSlot.end_time);
      setTitle(editingSlot.title);
      setDepartment(editingSlot.department);
      setRoom(editingSlot.room);
    } else {
      setDayOfWeek('Monday');
      setStartTime('09:00');
      setEndTime('10:00');
      setTitle('');
      setDepartment('CSE');
      setRoom('');
    }
    setError('');
  }, [editingSlot, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !room.trim()) {
      setError('Please provide title and room.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const payload = {
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        title: title.trim(),
        department,
        room: room.trim()
      };

      const url = editingSlot ? `/api/timetable/${editingSlot.id}` : '/api/timetable';
      const method = editingSlot ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to save timetable slot');
      }

      const saved = await res.json();
      onSlotSaved(saved);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            <h3 className="font-extrabold text-base sm:text-lg">
              {editingSlot ? 'Edit Timetable Slot' : 'Add Timetable Slot'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Day of Week
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
              >
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
              >
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Subject / Event Title
            </label>
            <input
              type="text"
              placeholder="e.g., CS301 Data Structures & Algorithms"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Room / Lab Location
            </label>
            <input
              type="text"
              placeholder="e.g., Lab 302, Innovation Suite"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : editingSlot ? 'Update Slot' : 'Save Slot'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
