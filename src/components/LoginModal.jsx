import React, { useState } from 'react';
import { X, Lock, Mail, Shield, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginModal = ({ isOpen, onClose }) => {
  const { login, testAccounts, quickSwitch } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await login(email, password);
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (account) => {
    try {
      setLoading(true);
      setError('');
      await quickSwitch(account);
      onClose();
    } catch (err) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center border-b border-slate-100 dark:border-slate-800 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-red-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-xl text-slate-900 dark:text-white">
            NoticePulse Sign In
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Access department broadcasts, urgent alerts, and class timetables
          </p>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-900">
              {error}
            </div>
          )}

          {/* 1-Click Fast Seed Logins */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Instant 1-Click Demo Accounts
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin({ email: 'admin@test.com', default_password: 'admin123', role: 'admin' })}
                className="p-3 rounded-2xl border-2 border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 text-left hover:border-red-500 transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-red-700 dark:text-red-300 uppercase">Admin</span>
                  <span className="text-[10px] bg-red-200 dark:bg-red-900/80 text-red-800 dark:text-red-200 px-1.5 py-0.2 rounded font-bold">Dean</span>
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">Dr. Sarah</p>
                <p className="text-[10px] text-slate-500">admin@test.com</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin({ email: 'member@test.com', default_password: 'member123', role: 'member' })}
                className="p-3 rounded-2xl border-2 border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 text-left hover:border-indigo-500 transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 uppercase">Member</span>
                  <span className="text-[10px] bg-indigo-200 dark:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200 px-1.5 py-0.2 rounded font-bold">CSE</span>
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">Alex Rivera</p>
                <p className="text-[10px] text-slate-500">member@test.com</p>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <hr className="flex-1 border-slate-200 dark:border-slate-800" />
            <span className="text-[11px] font-bold text-slate-400 uppercase">Or custom email</span>
            <hr className="flex-1 border-slate-200 dark:border-slate-800" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@test.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
