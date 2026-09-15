import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  Cpu,
  Globe,
  Trash2,
  Volume2,
  VolumeX,
  Keyboard,
  Type,
  Code2,
  ArrowDownToLine,
  EyeOff,
  Cloud,
  Check,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { ChatSession, AppSettings } from '../types';
import { SandyLogo } from './SandyLogo';
import { auth } from '../lib/firebase';
import { playCompletionChime } from '../utils/settings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  onClearAllSessions: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  sessions,
  onClearAllSessions,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'appearance' | 'privacy' | 'about'>('chat');
  const [cacheCleared, setCacheCleared] = useState(false);
  const currentUser = auth.currentUser;

  if (!isOpen) return null;

  const handleTestChime = () => {
    playCompletionChime();
  };

  const handlePurgeCache = () => {
    try {
      // Clear sessionStorage and transient keys
      sessionStorage.clear();
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <SandyLogo size="sm" />
            <div>
              <h2 className="text-sm font-semibold text-white leading-none">
                App Settings
              </h2>
              <span className="text-[11px] text-slate-400">Preferences & Controls</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-800/80 bg-slate-950/40 px-3 pt-2 gap-1 text-xs">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-2 rounded-t-lg font-medium transition-colors border-b-2 ${
              activeTab === 'chat'
                ? 'border-indigo-500 text-indigo-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Chat Controls
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-3 py-2 rounded-t-lg font-medium transition-colors border-b-2 ${
              activeTab === 'appearance'
                ? 'border-indigo-500 text-indigo-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Appearance
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-2 rounded-t-lg font-medium transition-colors border-b-2 ${
              activeTab === 'privacy'
                ? 'border-indigo-500 text-indigo-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Privacy & Security
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`px-3 py-2 rounded-t-lg font-medium transition-colors border-b-2 ${
              activeTab === 'about'
                ? 'border-indigo-500 text-indigo-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            About
          </button>
        </div>

        {/* Content area */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed flex-1">
          {/* TAB 1: CHAT CONTROLS */}
          {activeTab === 'chat' && (
            <div className="space-y-4">
              {/* Send Shortcut Toggle */}
              <div className="p-3.5 rounded-xl bg-slate-850/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Keyboard className="w-4 h-4 text-indigo-400" />
                    <span className="font-semibold text-slate-200">Send Shortcut</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-750">
                    <button
                      onClick={() => onUpdateSettings({ sendShortcut: 'enter' })}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                        settings.sendShortcut === 'enter'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Enter
                    </button>
                    <button
                      onClick={() => onUpdateSettings({ sendShortcut: 'ctrlEnter' })}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                        settings.sendShortcut === 'ctrlEnter'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Ctrl + Enter
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  {settings.sendShortcut === 'enter'
                    ? 'Press Enter to submit, Shift + Enter for a new line.'
                    : 'Press Ctrl/Cmd + Enter to submit, Enter for a new line.'}
                </p>
              </div>

              {/* Audio Notification Chime */}
              <div className="p-3.5 rounded-xl bg-slate-850/80 border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-slate-200 font-semibold">
                    {settings.soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-slate-500" />
                    )}
                    <span>Audio Chime on Completion</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Plays a soft, gentle sound when SandY finishes streaming an answer.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {settings.soundEnabled && (
                    <button
                      onClick={handleTestChime}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-[11px] text-slate-300 transition-colors"
                      title="Test Audio Chime"
                    >
                      Test
                    </button>
                  )}
                  <button
                    onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                    className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                      settings.soundEnabled ? 'bg-indigo-600 justify-end' : 'bg-slate-700 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                  </button>
                </div>
              </div>

              {/* Auto Scroll during Streaming */}
              <div className="p-3.5 rounded-xl bg-slate-850/80 border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-slate-200 font-semibold">
                    <ArrowDownToLine className="w-4 h-4 text-sky-400" />
                    <span>Auto-Scroll to Latest Response</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Automatically tracks bottom of conversation as tokens arrive in real-time.
                  </p>
                </div>
                <button
                  onClick={() => onUpdateSettings({ autoScroll: !settings.autoScroll })}
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                    settings.autoScroll ? 'bg-indigo-600 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              {/* Chat Font Size */}
              <div className="p-3.5 rounded-xl bg-slate-850/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-200 font-semibold">
                    <Type className="w-4 h-4 text-indigo-400" />
                    <span>Chat Font Size</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-750">
                    {(['normal', 'medium', 'large'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => onUpdateSettings({ fontSize: size })}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium capitalize transition-colors ${
                          settings.fontSize === size
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Adjusts typography scale across prompts, responses, and code blocks for readability.
                </p>
              </div>

              {/* Code Snippet Formatting */}
              <div className="p-3.5 rounded-xl bg-slate-850/80 border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-slate-200 font-semibold">
                    <Code2 className="w-4 h-4 text-amber-400" />
                    <span>Formatted Code Line Numbers</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Displays line markers in Python, TypeScript, HTML, and other code previews.
                  </p>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings({ codeLineNumbers: !settings.codeLineNumbers })
                  }
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                    settings.codeLineNumbers ? 'bg-indigo-600 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PRIVACY & SECURITY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              {/* Cloud Account & Storage Status */}
              <div className="p-3.5 rounded-xl bg-slate-850/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-slate-200">
                    <Cloud className="w-4 h-4 text-emerald-400" />
                    <span>Firebase Cloud Sync</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {currentUser ? 'Synced (Firestore)' : 'Guest Mode (Local Only)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {currentUser
                    ? `Authenticated as ${currentUser.email}. All chats are encrypted and stored in your private Firestore database.`
                    : 'Conversations remain strictly local to this browser session until you sign in with Google.'}
                </p>
              </div>

              {/* Incognito / Ephemeral Mode */}
              <div className="p-3.5 rounded-xl bg-slate-850/80 border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-slate-200 font-semibold">
                    <EyeOff className="w-4 h-4 text-purple-400" />
                    <span>Incognito / Ephemeral Session</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    When active, new queries are processed in memory and not permanently recorded.
                  </p>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings({ incognitoMode: !settings.incognitoMode })
                  }
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                    settings.incognitoMode ? 'bg-purple-600 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              {/* Purge Local Cache */}
              <div className="p-3.5 rounded-xl bg-slate-850/80 border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-200 block">Purge Memory & Image Cache</span>
                  <span className="text-[11px] text-slate-400 block">
                    Clears temporary upload memory, preview buffers, and unsent drafts safely.
                  </span>
                </div>
                <button
                  onClick={handlePurgeCache}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-medium transition-colors text-xs"
                >
                  {cacheCleared ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Purged!</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Purge Cache</span>
                    </>
                  )}
                </button>
              </div>

              {/* Clear History Danger Zone */}
              <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-300 font-semibold">
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Clear All Conversations</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {sessions.length} {sessions.length === 1 ? 'chat' : 'chats'}
                  </span>
                </div>
                <p className="text-[11px] text-rose-200/70">
                  Permanently deletes all saved chat sessions. This action cannot be undone.
                </p>
                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          'Are you sure you want to delete all saved conversations? This cannot be undone.'
                        )
                      ) {
                        onClearAllSessions();
                        onClose();
                      }
                    }}
                    disabled={sessions.length === 0}
                    className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-medium transition-colors ${
                      sessions.length > 0
                        ? 'border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 cursor-pointer'
                        : 'border-slate-800 bg-slate-850 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete All Chats</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ABOUT SANDY */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              {/* Secure App Identity Card (Download button removed completely) */}
              <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-200 flex items-center gap-2">
                    <span>Web App Identity</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      Protected Asset
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-xl shadow-black/50 border border-indigo-500/40 shrink-0 bg-slate-950 pointer-events-none select-none">
                    <img
                      src="/app-icon.png"
                      alt="SandY Web App Icon"
                      className="w-full h-full object-cover pointer-events-none select-none"
                      draggable="false"
                      onContextMenu={(e) => e.preventDefault()}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-1 text-slate-400 text-[11px]">
                    <p className="text-slate-200 font-medium">SandY Intelligence</p>
                    <p>
                      Official app icon locked & secured for browser identity, PWA manifest, and verified client branding.
                    </p>
                  </div>
                </div>
              </div>

              {/* Gemini Engine */}
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white text-xs block">
                    Powered by Google Gemini
                  </span>
                  <span className="text-[11px] text-slate-300 mt-0.5 block">
                    SandY Chat is designed with real-time SSE streaming, multimodal image analysis, and Google Search grounding.
                  </span>
                </div>
              </div>

              {/* Capabilities */}
              <div className="space-y-2">
                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-850/50 border border-slate-800">
                  <Cpu className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-white block">SandY Flash Lite & Flash 3.8</span>
                    <span className="text-[11px] text-slate-400 block">
                      Optimized for fast answers, zero wait-times, and deep multi-step reasoning.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-850/50 border border-slate-800">
                  <Globe className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-white block">Verified Google Grounding</span>
                    <span className="text-[11px] text-slate-400 block">
                      Live web search integration with clean clickable sources.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-850/50 border border-slate-800">
                  <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-white block">Enterprise Firestore Protection</span>
                    <span className="text-[11px] text-slate-400 block">
                      Role-isolated user security rules guaranteeing private, encrypted sessions.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
