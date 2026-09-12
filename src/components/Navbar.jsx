import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Bell, 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  UserCheck, 
  ShieldCheck, 
  LogOut, 
  PlusCircle, 
  ChevronDown, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export const Navbar = ({ onOpenComposer, onOpenLoginModal }) => {
  const { user, isAdmin, logout, testAccounts, quickSwitch } = useAuth();
  const { isConnected, isAudioMuted, toggleMute, testAudioPing } = useSocket();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);

  // Initialize theme from system or localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('noticepulse_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('noticepulse_theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('noticepulse_theme', 'dark');
      setIsDarkMode(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand & Live Connection Indicator */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 text-white shadow-md shadow-red-500/20">
            <Radio className="w-5 h-5 animate-pulse" />
            <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
              isConnected ? 'bg-emerald-500' : 'bg-amber-400'
            }`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-red-600 to-amber-600 dark:from-red-400 dark:to-amber-400 bg-clip-text text-transparent">
                NoticePulse
              </span>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                isConnected 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                {isConnected ? 'Real-time Live' : 'Connecting'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              Smart Urgent Alert Stream & Timetable Tracker
            </p>
          </div>
        </div>

        {/* Center & Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Audio Chime Ping Toggle */}
          <div className="relative group">
            <button
              onClick={toggleMute}
              className={`p-2 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                isAudioMuted
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-100'
              }`}
              title={isAudioMuted ? 'Unmute push alert chimes' : 'Mute push alert chimes'}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-red-500" />}
              <span className="hidden md:inline text-xs font-semibold">
                {isAudioMuted ? 'Muted' : 'Audio Ping On'}
              </span>
            </button>
            
            {/* Quick Test Ping Button Tooltip */}
            {!isAudioMuted && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  testAudioPing();
                }}
                className="hidden group-hover:flex absolute -bottom-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-amber-300" /> Click to test chime
              </button>
            )}
          </div>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Admin Compose Notice Button */}
          {isAdmin && (
            <button
              onClick={onOpenComposer}
              className="px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm shadow-red-500/30 flex items-center gap-1.5 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Post Notice</span>
            </button>
          )}

          {/* Account & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowSwitchMenu(!showSwitchMenu)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                isAdmin 
                  ? 'bg-red-600 text-white ring-2 ring-red-300 dark:ring-red-900' 
                  : 'bg-indigo-600 text-white'
              }`}>
                {user ? user.name.charAt(0) : '?'}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  {user ? user.name : 'Not Logged In'}
                  {isAdmin ? (
                    <span className="bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 text-[10px] px-1.5 py-0.2 rounded font-bold uppercase">
                      Admin
                    </span>
                  ) : (
                    <span className="bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] px-1.5 py-0.2 rounded font-bold uppercase">
                      Member
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {user?.department || 'Select Role'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Quick Role Switcher Dropdown */}
            {showSwitchMenu && (
              <div 
                className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setShowSwitchMenu(false)}
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Active Account</p>
                    <p className="text-[11px] text-slate-500">{user?.email}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                    {user?.role}
                  </span>
                </div>

                <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 text-red-500" /> 1-Click Role Switcher
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                  {testAccounts.map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => quickSwitch(acc)}
                      className={`w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-between cursor-pointer ${
                        user?.id === acc.id ? 'bg-red-50/70 dark:bg-red-950/30' : ''
                      }`}
                    >
                      <div>
                        <p className={`font-semibold ${user?.id === acc.id ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {acc.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {acc.department} • {acc.email}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        acc.role === 'admin' 
                          ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' 
                          : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                      }`}>
                        {acc.role}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 px-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={onOpenLoginModal}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    Custom Login...
                  </button>
                  <button
                    onClick={logout}
                    className="text-[11px] text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <LogOut className="w-3 h-3" /> Log out
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
