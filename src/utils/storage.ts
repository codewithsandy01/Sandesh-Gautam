import { ChatSession } from '../types';

const STORAGE_KEY_SESSIONS = 'sandychat_sessions_v1';
const STORAGE_KEY_ACTIVE_ID = 'sandychat_active_id_v1';
const STORAGE_KEY_THEME = 'sandychat_theme_v1';

export function loadStoredSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load stored chat sessions', e);
    return [];
  }
}

export function saveStoredSessions(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to persist chat sessions', e);
  }
}

export function loadStoredActiveId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
  } catch {
    return null;
  }
}

export function saveStoredActiveId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
  } catch {}
}

export function createNewSession(
  model: string = 'gemini-3.8-flash',
  systemInstruction?: string,
  webSearchEnabled?: boolean
): ChatSession {
  return {
    id: 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
    title: 'New conversation',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
    model,
    systemInstruction,
    webSearchEnabled: webSearchEnabled ?? false,
  };
}

export function formatChatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function groupSessionsByDate(sessions: ChatSession[]): {
  today: ChatSession[];
  yesterday: ChatSession[];
  lastWeek: ChatSession[];
  older: ChatSession[];
} {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOfLastWeek = startOfToday - 7 * 24 * 60 * 60 * 1000;

  const today: ChatSession[] = [];
  const yesterday: ChatSession[] = [];
  const lastWeek: ChatSession[] = [];
  const older: ChatSession[] = [];

  for (const session of sessions) {
    const time = session.updatedAt || session.createdAt;
    if (time >= startOfToday) {
      today.push(session);
    } else if (time >= startOfYesterday) {
      yesterday.push(session);
    } else if (time >= startOfLastWeek) {
      lastWeek.push(session);
    } else {
      older.push(session);
    }
  }

  return { today, yesterday, lastWeek, older };
}
