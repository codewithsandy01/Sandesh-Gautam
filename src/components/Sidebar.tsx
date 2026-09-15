import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  SlidersHorizontal,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';
import { ChatSession } from '../types';
import { groupSessionsByDate } from '../utils/storage';
import { SandyLogo } from './SandyLogo';
import { UserAuthProfile } from './UserAuthProfile';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onClearAllSessions: () => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  onOpenPersonaModal: () => void;
  onOpenSettingsModal: () => void;
  activePersonaName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onClearAllSessions,
  isOpen,
  onCloseMobile,
  onOpenPersonaModal,
  onOpenSettingsModal,
  activePersonaName,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredSessions = sessions.filter((session) =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { today, yesterday, lastWeek, older } = groupSessionsByDate(filteredSessions);

  const startRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const saveRename = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingSessionId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  const renderSessionGroup = (title: string, groupList: ChatSession[]) => {
    if (groupList.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </div>
        <div className="space-y-0.5">
          {groupList.map((session) => {
            const isActive = session.id === activeSessionId;
            const isEditing = session.id === editingSessionId;

            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                {isEditing ? (
                  <form
                    onSubmit={(e) => saveRename(session.id, e)}
                    className="flex items-center gap-1.5 w-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      autoFocus
                      className="flex-1 bg-slate-900 border border-indigo-500/60 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="p-1 hover:text-emerald-400 text-slate-300"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={cancelRename}
                      className="p-1 hover:text-rose-400 text-slate-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5 truncate flex-1 min-w-0 pr-2">
                      <MessageSquare
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-indigo-400' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{session.title}</span>
                    </div>

                    {/* Action buttons (Rename, Delete) */}
                    <div
                      className={`items-center gap-1 shrink-0 ${
                        isActive ? 'flex' : 'hidden group-hover:flex'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => startRename(session, e)}
                        className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        id="sandy-sidebar"
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'
        }`}
      >
        {/* Top Header of Sidebar */}
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <SandyLogo size="sm" />
            <span className="text-sm font-semibold text-white tracking-tight">
              SandY Chat
            </span>
          </div>

          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            title="Close sidebar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            id="sidebar-new-chat-btn"
            onClick={() => {
              onNewChat();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>

          {/* Search bar if chats exist */}
          {sessions.length > 2 && (
            <div className="mt-2.5 relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-800/80 rounded-lg text-xs text-slate-200 placeholder-slate-400 border border-slate-700/60 focus:outline-none focus:border-indigo-500/80"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sessions scrollable list */}
        <div className="flex-1 overflow-y-auto px-2 py-1">
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">
              No conversations yet. Start a chat with SandY!
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">
              No matching conversations found.
            </div>
          ) : (
            <>
              {renderSessionGroup('Today', today)}
              {renderSessionGroup('Yesterday', yesterday)}
              {renderSessionGroup('Previous 7 Days', lastWeek)}
              {renderSessionGroup('Older', older)}
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90 space-y-2">
          {/* Cloud Auth / Profile */}
          <div className="px-1 py-0.5 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Cloud Account</span>
            <UserAuthProfile compact={false} />
          </div>

          {/* Active persona quick-view */}
          <button
            onClick={onOpenPersonaModal}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800/80 transition-colors"
          >
            <div className="flex items-center gap-2 truncate">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <span className="truncate">Persona: {activePersonaName}</span>
            </div>
            <span className="text-[10px] text-slate-400">Change</span>
          </button>

          {/* Clear history button */}
          {sessions.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Clear all conversation history? This cannot be undone.')) {
                  onClearAllSessions();
                }
              }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear all chats</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
