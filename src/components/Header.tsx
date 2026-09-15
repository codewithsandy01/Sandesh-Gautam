import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Sparkles,
  ChevronDown,
  Globe,
  Plus,
  Share2,
  Settings,
  SlidersHorizontal,
  Zap,
  Check,
  Download,
  FileText,
} from 'lucide-react';
import { AVAILABLE_MODELS } from '../data/constants';
import { ChatSession } from '../types';
import { SandyLogo } from './SandyLogo';
import { UserAuthProfile } from './UserAuthProfile';

interface HeaderProps {
  currentSession: ChatSession | null;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  webSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  onNewChat: () => void;
  onOpenPersonaModal: () => void;
  onOpenSettingsModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSession,
  onToggleSidebar,
  selectedModel,
  onSelectModel,
  webSearchEnabled,
  onToggleWebSearch,
  onNewChat,
  onOpenPersonaModal,
  onOpenSettingsModal,
}) => {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  const activeModel =
    AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(e.target as Node)
      ) {
        setIsModelDropdownOpen(false);
      }
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(e.target as Node)
      ) {
        setIsExportMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportMarkdown = () => {
    if (!currentSession || currentSession.messages.length === 0) return;
    const content =
      `# ${currentSession.title}\n\n` +
      `*Generated with SandY Chat (${activeModel.name}) on ${new Date().toLocaleString()}*\n\n---\n\n` +
      currentSession.messages
        .map(
          (m) =>
            `### ${m.role === 'user' ? 'User' : 'SandY Chat'}\n\n${m.content}\n\n`
        )
        .join('---\n\n');

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSession.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
  };

  return (
    <header
      id="sandy-header"
      className="h-14 border-b border-slate-800 bg-slate-900/70 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between z-20 shrink-0 select-none sticky top-0"
    >
      {/* Left section: Sidebar toggle & Logo */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          id="toggle-sidebar-btn"
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500"
          title="Toggle Sidebar"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <SandyLogo size="sm" showGlow />
          <div className="flex items-baseline gap-1.5">
            <span className="font-semibold tracking-tight text-white text-base">
              SandY <span className="text-indigo-400 font-medium">Chat</span>
            </span>
            <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] uppercase font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Gemini
            </span>
          </div>
        </div>

        {/* Model dropdown */}
        <div className="relative" ref={modelDropdownRef}>
          <button
            id="model-selector-btn"
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 transition-colors"
          >
            <span className="truncate max-w-[110px] sm:max-w-none">
              {activeModel.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isModelDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-64 rounded-xl bg-slate-900 border border-slate-750 p-1.5 shadow-xl shadow-black/40 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Gemini Models
              </div>
              {AVAILABLE_MODELS.map((model) => {
                const isSelected = model.id === selectedModel;
                return (
                  <button
                    key={model.id}
                    onClick={() => {
                      onSelectModel(model.id);
                      setIsModelDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg flex items-start gap-2.5 transition-colors ${
                      isSelected
                        ? 'bg-indigo-600/15 border border-indigo-500/30 text-white'
                        : 'hover:bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-md mt-0.5 ${
                        model.id === 'gemini-3.8-flash'
                          ? 'bg-indigo-500/20 text-indigo-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {model.id === 'gemini-3.8-flash' ? (
                        <Sparkles className="w-3.5 h-3.5" />
                      ) : (
                        <Zap className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs text-white">
                          {model.name}
                        </span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                        {model.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Google Search Grounding toggle */}
        <button
          id="web-search-toggle-btn"
          onClick={onToggleWebSearch}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            webSearchEnabled
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/10'
              : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title={
            webSearchEnabled
              ? 'Google Search Grounding Active'
              : 'Enable Live Google Web Search Grounding'
          }
        >
          <Globe
            className={`w-3.5 h-3.5 ${
              webSearchEnabled ? 'text-emerald-400 animate-spin-slow' : 'text-slate-400'
            }`}
          />
          <span className="hidden md:inline">
            {webSearchEnabled ? 'Search On' : 'Search'}
          </span>
        </button>

        {/* Persona Customization */}
        <button
          id="persona-modal-btn"
          onClick={onOpenPersonaModal}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors focus:outline-none"
          title="AI Persona & System Prompt"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        {/* Export conversation dropdown */}
        {currentSession && currentSession.messages.length > 0 && (
          <div className="relative" ref={exportDropdownRef}>
            <button
              id="export-chat-btn"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors focus:outline-none"
              title="Export Conversation"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-slate-900 border border-slate-750 p-1.5 shadow-xl shadow-black/40 z-50">
                <button
                  onClick={handleExportMarkdown}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Export Notes (.md)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* User Auth & Firebase Profile */}
        <UserAuthProfile compact={true} />

        {/* Settings button */}
        <button
          id="settings-modal-btn"
          onClick={onOpenSettingsModal}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors focus:outline-none"
          title="Settings & App Info"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* New Chat quick button */}
        <button
          id="header-new-chat-btn"
          onClick={onNewChat}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm shadow-indigo-600/30 transition-colors"
          title="Start a new chat session"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>
    </header>
  );
};
