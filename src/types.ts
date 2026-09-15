export interface MessageImage {
  mimeType: string;
  data: string; // base64 string without data:mime;base64, prefix
  previewUrl?: string;
}

export interface GroundingSource {
  title?: string;
  url?: string;
  snippet?: string;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  aspectRatio?: string;
  isEdit?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  image?: MessageImage;
  generatedImage?: GeneratedImage;
  groundingSources?: GroundingSource[];
  modelUsed?: string;
  error?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  model: string;
  systemInstruction?: string;
  webSearchEnabled?: boolean;
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  tag: string;
  icon: 'sparkles' | 'zap' | 'brain';
}

export interface PersonaOption {
  id: string;
  name: string;
  description: string;
  instruction: string;
  icon: string;
}

export interface AppSettings {
  sendShortcut: 'enter' | 'ctrlEnter';
  fontSize: 'normal' | 'medium' | 'large';
  soundEnabled: boolean;
  codeLineNumbers: boolean;
  autoScroll: boolean;
  incognitoMode: boolean;
  cloudSyncEnabled: boolean;
}

