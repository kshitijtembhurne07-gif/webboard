import React from 'react';
import { BellRing, X, ArrowRight, ShieldAlert } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export const PushAlertBanner = ({ onSelectNotice }) => {
  const { activeUrgentAlert, dismissAlert } = useSocket();

  if (!activeUrgentAlert) return null;

  return (
    <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-xl px-4 py-3 border-b-2 border-red-400 relative animate-in slide-in-from-top duration-300 z-50">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 backdrop-blur-md rounded-full animate-bounce">
            <BellRing className="w-5 h-5 text-yellow-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-white/25 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> High Priority Alert
              </span>
              <span className="bg-amber-400 text-slate-950 text-xs font-bold px-2 py-0.5 rounded-full">
                {activeUrgentAlert.department_tag || 'All Departments'}
              </span>
              <span className="text-xs text-white/80 hidden md:inline">
                Just now
              </span>
            </div>
            <h4 className="font-bold text-sm sm:text-base mt-0.5 line-clamp-1">
              {activeUrgentAlert.title}
            </h4>
            <p className="text-xs text-white/90 line-clamp-1 max-w-2xl">
              {activeUrgentAlert.content}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => {
              if (onSelectNotice) onSelectNotice(activeUrgentAlert);
              dismissAlert();
            }}
            className="px-3.5 py-1.5 bg-white text-red-700 hover:bg-red-50 text-xs font-bold rounded-lg transition-all shadow flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            View Alert <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={dismissAlert}
            className="p-1.5 hover:bg-white/20 rounded-lg transition text-white/90 hover:text-white cursor-pointer"
            title="Dismiss notification"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
