import React, { useState, useEffect, useRef } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { LogIn, LogOut, Cloud, CloudOff, User as UserIcon, CheckCircle2 } from 'lucide-react';
import { auth, loginWithGoogle, logoutUser, testFirestoreConnection } from '../lib/firebase';

interface UserAuthProfileProps {
  compact?: boolean;
}

export const UserAuthProfile: React.FC<UserAuthProfileProps> = ({ compact = false }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        testFirestoreConnection().then((connected) => setIsCloudConnected(connected));
      } else {
        setIsCloudConnected(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      setIsMenuOpen(false);
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <button
        id="firebase-signin-btn"
        onClick={handleLogin}
        disabled={isLoading}
        className={`inline-flex items-center gap-1.5 rounded-lg border font-medium transition-all ${
          compact
            ? 'px-2 py-1.5 text-xs bg-slate-800/80 border-slate-700 text-slate-200 hover:text-white hover:bg-slate-750'
            : 'px-3 py-1.5 text-xs bg-indigo-600/20 border-indigo-500/30 text-indigo-200 hover:bg-indigo-600/30'
        }`}
        title="Sign in with Google to sync conversations to Firebase Firestore"
      >
        <LogIn className="w-3.5 h-3.5 text-indigo-400" />
        <span>{isLoading ? 'Signing in...' : 'Sign in'}</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        id="firebase-user-profile-btn"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:bg-slate-750 transition-colors focus:outline-none"
        title={`Signed in as ${currentUser.displayName || currentUser.email}`}
      >
        {currentUser.photoURL ? (
          <img
            src={currentUser.photoURL}
            alt={currentUser.displayName || 'User'}
            className="w-5 h-5 rounded-full object-cover border border-indigo-400/40"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-indigo-600/40 flex items-center justify-center text-[10px] font-bold text-indigo-300">
            {currentUser.displayName?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
        <span className="text-xs text-slate-200 max-w-[100px] sm:max-w-[130px] truncate">
          {currentUser.displayName?.split(' ')[0] || currentUser.email?.split('@')[0]}
        </span>
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Firestore Connected" />
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 p-3 shadow-2xl shadow-black/60 z-50 text-left">
          <div className="flex items-center gap-2.5 pb-2.5 mb-2.5 border-b border-slate-800">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt=""
                className="w-8 h-8 rounded-full border border-indigo-400/30"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-xs font-semibold text-indigo-300">
                <UserIcon className="w-4 h-4" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-100 truncate">
                {currentUser.displayName || 'Authenticated User'}
              </div>
              <div className="text-[11px] text-slate-400 truncate">{currentUser.email}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] mb-2">
            <Cloud className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Firestore Cloud Sync: Active</span>
          </div>

          <button
            id="firebase-signout-btn"
            onClick={handleLogout}
            disabled={isLoading}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
