/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MessageItem } from './components/MessageItem';
import { ChatInput } from './components/ChatInput';
import { EmptyState } from './components/EmptyState';
import { PersonaModal } from './components/PersonaModal';
import { SettingsModal } from './components/SettingsModal';
import { ChatMessage, ChatSession, MessageImage, AppSettings } from './types';
import { PERSONAS } from './data/constants';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, testFirestoreConnection } from './lib/firebase';
import {
  subscribeToUserSessions,
  saveSessionToFirestore,
  deleteSessionFromFirestore,
} from './lib/firestoreChat';
import {
  loadStoredSessions,
  saveStoredSessions,
  loadStoredActiveId,
  saveStoredActiveId,
  createNewSession,
} from './utils/storage';
import {
  loadStoredSettings,
  saveStoredSettings,
  playCompletionChime,
} from './utils/settings';

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const stored = loadStoredSessions();
    if (stored.length > 0) return stored;
    const initial = createNewSession();
    return [initial];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const storedId = loadStoredActiveId();
    if (storedId && sessions.some((s) => s.id === storedId)) {
      return storedId;
    }
    return sessions[0]?.id || '';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-flash-lite');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [activePersonaId, setActivePersonaId] = useState('default');
  const [customInstruction, setCustomInstruction] = useState('');
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [stagedImageForEdit, setStagedImageForEdit] = useState<MessageImage | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<AppSettings>(loadStoredSettings);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      saveStoredSettings(updated);
      return updated;
    });
  };

  // Initial connection test & Auth listener
  useEffect(() => {
    testFirestoreConnection();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore sync when authenticated
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToUserSessions(
      currentUser.uid,
      (cloudSessions) => {
        if (cloudSessions && cloudSessions.length > 0) {
          setSessions(cloudSessions);
          setActiveSessionId((prev) =>
            cloudSessions.some((s) => s.id === prev) ? prev : cloudSessions[0].id
          );
        }
      }
    );
    return () => unsubscribe();
  }, [currentUser]);

  // Get active session
  const activeSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Save active session to Firestore when updated and user is signed in
  useEffect(() => {
    if (
      !settings.incognitoMode &&
      currentUser &&
      activeSession &&
      activeSession.messages &&
      activeSession.messages.length > 0
    ) {
      saveSessionToFirestore(currentUser.uid, activeSession).catch((err) => {
        console.warn('Firestore sync background notice:', err);
      });
    }
  }, [currentUser, activeSession?.messages?.length, activeSession?.title, settings.incognitoMode]);

  // Save sessions to storage whenever updated
  useEffect(() => {
    if (!settings.incognitoMode) {
      saveStoredSessions(sessions);
    }
  }, [sessions, settings.incognitoMode]);

  // Save active session id
  useEffect(() => {
    if (activeSessionId && !settings.incognitoMode) {
      saveStoredActiveId(activeSessionId);
    }
  }, [activeSessionId, settings.incognitoMode]);

  // Scroll to bottom helper
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, [activeSessionId]);

  useEffect(() => {
    if (isStreaming && settings.autoScroll) {
      scrollToBottom('smooth');
    }
  }, [activeSession?.messages, isStreaming, settings.autoScroll]);

  // Find active persona instruction
  const getActiveSystemInstruction = (): string => {
    if (activePersonaId === 'custom' && customInstruction.trim()) {
      return customInstruction.trim();
    }
    const found = PERSONAS.find((p) => p.id === activePersonaId);
    return found ? found.instruction : PERSONAS[0].instruction;
  };

  const getActivePersonaName = (): string => {
    if (activePersonaId === 'custom') return 'Custom';
    const found = PERSONAS.find((p) => p.id === activePersonaId);
    return found ? found.name : 'Default';
  };

  // Start a new chat session
  const handleNewChat = () => {
    if (isStreaming) {
      handleStopStreaming();
    }
    const newSession = createNewSession(
      selectedModel,
      getActiveSystemInstruction(),
      webSearchEnabled
    );
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  // Delete a session
  const handleDeleteSession = (id: string) => {
    if (currentUser) {
      deleteSessionFromFirestore(currentUser.uid, id).catch((err) => {
        console.warn('Firestore session delete error:', err);
      });
    }
    const updated = sessions.filter((s) => s.id !== id);
    if (updated.length === 0) {
      const fresh = createNewSession();
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
    } else {
      setSessions(updated);
      if (activeSessionId === id) {
        setActiveSessionId(updated[0].id);
      }
    }
  };

  // Rename a session
  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
  };

  // Clear all sessions
  const handleClearAllSessions = () => {
    if (isStreaming) {
      handleStopStreaming();
    }
    const fresh = createNewSession();
    setSessions([fresh]);
    setActiveSessionId(fresh.id);
  };

  // Stop current streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  // Core Send Message logic
  const handleSendMessage = async (
    content: string,
    image?: MessageImage,
    overrideModel?: string
  ) => {
    if (!content.trim() && !image) return;

    const modelToUse = overrideModel || selectedModel;
    if (overrideModel && overrideModel !== selectedModel) {
      setSelectedModel(overrideModel);
    }

    // Create user message
    const userMessage: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
      image,
    };

    // Placeholder assistant message for streaming
    const assistantMessageId = 'msg_' + (Date.now() + 1);
    const initialAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      modelUsed: modelToUse,
    };

    // Determine updated title if first message
    let sessionTitle = activeSession.title;
    if (activeSession.messages.length === 0) {
      sessionTitle =
        content.trim().slice(0, 36) + (content.trim().length > 36 ? '...' : '') ||
        'Image Analysis';
    }

    const currentSessionMessages = [...activeSession.messages, userMessage];

    // Optimistically update state
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? {
              ...s,
              title: sessionTitle,
              updatedAt: Date.now(),
              messages: [...currentSessionMessages, initialAssistantMessage],
            }
          : s
      )
    );

    setIsStreaming(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    let accumulatedContent = '';

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: currentSessionMessages,
          model: modelToUse,
          systemInstruction: getActiveSystemInstruction(),
          webSearch: webSearchEnabled,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Readable stream not supported on response.');
      }

      const decoder = new TextDecoder();
      accumulatedContent = '';
      let accumulatedSources: any[] = [];
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.replace(/^data: /, '');

          try {
            const data = JSON.parse(jsonStr);

            if (data.error) {
              accumulatedContent = data.error;
              setSessions((prev) =>
                prev.map((s) =>
                  s.id === activeSession.id
                    ? {
                        ...s,
                        messages: s.messages.map((m) =>
                          m.id === assistantMessageId
                            ? { ...m, content: accumulatedContent, error: true }
                            : m
                        ),
                      }
                    : s
                )
              );
              break;
            }

            if (data.text) {
              accumulatedContent += data.text;
            }

            if (data.groundingSources && Array.isArray(data.groundingSources)) {
              accumulatedSources = data.groundingSources;
            }

            // Update live message
            setSessions((prev) =>
              prev.map((s) =>
                s.id === activeSession.id
                  ? {
                      ...s,
                      messages: s.messages.map((m) =>
                        m.id === assistantMessageId
                          ? {
                              ...m,
                              content: accumulatedContent,
                              modelUsed: data.modelUsed || m.modelUsed,
                              groundingSources: accumulatedSources,
                            }
                          : m
                      ),
                    }
                  : s
              )
            );
          } catch (e) {
            // Ignore parse errors on partial chunks
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream generation aborted by user.');
      } else {
        console.error('Chat error:', err);
        const errorText =
          err.message || 'Failed to connect with SandY Chat. Please try again.';
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSession.id
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMessageId
                      ? {
                          ...m,
                          content:
                            accumulatedContent ||
                            `Connection Error: ${errorText}`,
                          error: true,
                        }
                      : m
                  ),
                }
              : s
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
      if (settings.soundEnabled && accumulatedContent) {
        playCompletionChime();
      }
      if (currentUser && !settings.incognitoMode && activeSession) {
        saveSessionToFirestore(currentUser.uid, {
          ...activeSession,
          messages: activeSession.messages.map((m) =>
            m.id === assistantMessageId ? { ...m, content: accumulatedContent } : m
          ),
        }).catch((err) => console.warn('Firestore final sync notice:', err));
      }
    }
  };

  // Regenerate last response with optional model override
  const handleRegenerate = (overrideModel?: string) => {
    if (activeSession.messages.length < 2) return;
    const lastUserMessage = [...activeSession.messages]
      .reverse()
      .find((m) => m.role === 'user');
    if (!lastUserMessage) return;

    if (overrideModel) {
      setSelectedModel(overrideModel);
    }

    // Remove the last assistant message
    const trimmed = activeSession.messages.slice(0, -1);
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id ? { ...s, messages: trimmed } : s
      )
    );

    // Resend
    handleSendMessage(lastUserMessage.content, lastUserMessage.image, overrideModel);
  };

  // Create or Edit Images using gemini-3.1-flash-image
  const handleGenerateOrEditImage = async (
    prompt: string,
    image?: MessageImage,
    aspectRatio = '1:1'
  ) => {
    if (!prompt.trim()) return;

    const isEdit = Boolean(image);
    const userMessage: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: isEdit
        ? `Edit this image: "${prompt.trim()}"`
        : `Create an image: "${prompt.trim()}"`,
      timestamp: Date.now(),
      image,
    };

    const assistantMessageId = 'msg_' + (Date.now() + 1);
    const placeholderAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: isEdit
        ? `🎨 Modifying image with prompt: *"${prompt.trim()}"* using **gemini-3.1-flash-image**...`
        : `🎨 Creating image with prompt: *"${prompt.trim()}"* using **gemini-3.1-flash-image**...`,
      timestamp: Date.now(),
      modelUsed: 'gemini-3.1-flash-image',
    };

    let sessionTitle = activeSession.title;
    if (activeSession.messages.length === 0) {
      sessionTitle = isEdit
        ? `Edit: ${prompt.trim().slice(0, 24)}`
        : `Image: ${prompt.trim().slice(0, 24)}`;
    }

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? {
              ...s,
              title: sessionTitle,
              updatedAt: Date.now(),
              messages: [...s.messages, userMessage, placeholderAssistantMessage],
            }
          : s
      )
    );

    setIsGeneratingImage(true);

    try {
      const response = await fetch('/api/image/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          image: image ? { data: image.data, mimeType: image.mimeType } : undefined,
          aspectRatio,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate image.');
      }

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantMessageId
                    ? {
                        ...m,
                        content:
                          data.text ||
                          (isEdit
                            ? `Here is your edited image based on your request:`
                            : `Here is your generated image based on: *"${prompt.trim()}"*`),
                        generatedImage: {
                          url: data.imageUrl,
                          prompt: prompt.trim(),
                          aspectRatio,
                          isEdit,
                        },
                      }
                    : m
                ),
              }
            : s
        )
      );
    } catch (err: any) {
      console.error('Image generation error:', err);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantMessageId
                    ? {
                        ...m,
                        content: `Image generation failed: ${
                          err.message || 'Unable to connect to Gemini Image Studio.'
                        }`,
                        error: true,
                      }
                    : m
                ),
              }
            : s
        )
      );
    } finally {
      setIsGeneratingImage(false);
      setStagedImageForEdit(null);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => {
          if (isStreaming) handleStopStreaming();
          setActiveSessionId(id);
        }}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onClearAllSessions={handleClearAllSessions}
        isOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
        onOpenPersonaModal={() => setIsPersonaModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        activePersonaName={getActivePersonaName()}
      />

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        {/* Top Header */}
        <Header
          currentSession={activeSession}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          selectedModel={selectedModel}
          onSelectModel={(id) => setSelectedModel(id)}
          webSearchEnabled={webSearchEnabled}
          onToggleWebSearch={() => setWebSearchEnabled(!webSearchEnabled)}
          onNewChat={handleNewChat}
          onOpenPersonaModal={() => setIsPersonaModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        />

        {/* Incognito Notice Banner if active */}
        {settings.incognitoMode && (
          <div className="bg-purple-950/60 border-b border-purple-500/20 px-4 py-1.5 flex items-center justify-between text-xs text-purple-200">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
              <span className="font-medium">Incognito Session Active</span>
              <span className="text-purple-300/70 hidden sm:inline">— Chats are ephemeral and not saved to cloud or history.</span>
            </span>
            <button
              onClick={() => handleUpdateSettings({ incognitoMode: false })}
              className="text-purple-300 hover:text-white underline text-[11px]"
            >
              Turn off
            </button>
          </div>
        )}

        {/* Message Stream or Empty State */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
          {activeSession.messages.length === 0 ? (
            <EmptyState
              onSelectPrompt={(text) => handleSendMessage(text)}
              activePersonaName={getActivePersonaName()}
            />
          ) : (
            <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-4 space-y-3 pb-8">
              {activeSession.messages.map((message, index) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  isLast={index === activeSession.messages.length - 1}
                  isStreaming={
                    isStreaming && index === activeSession.messages.length - 1
                  }
                  onRegenerate={() => handleRegenerate()}
                  onRegenerateWithModel={(mId) => handleRegenerate(mId)}
                  onEditImage={(img) => setStagedImageForEdit(img)}
                  fontSize={settings.fontSize}
                  codeLineNumbers={settings.codeLineNumbers}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Chat Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onGenerateImage={handleGenerateOrEditImage}
          isStreaming={isStreaming}
          isGeneratingImage={isGeneratingImage}
          onStopStreaming={handleStopStreaming}
          webSearchEnabled={webSearchEnabled}
          onToggleWebSearch={() => setWebSearchEnabled(!webSearchEnabled)}
          externalAttachedImage={stagedImageForEdit}
          onClearExternalImage={() => setStagedImageForEdit(null)}
          sendShortcut={settings.sendShortcut}
          placeholder={`Message SandY (${
            selectedModel === 'gemini-3.8-flash' ? 'Flash 3.8' : 'Flash Lite'
          })...`}
        />
      </main>

      {/* Persona Customization Modal */}
      <PersonaModal
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
        currentPersonaId={activePersonaId}
        customInstruction={customInstruction}
        onSelectPersona={(personaId, customText) => {
          setActivePersonaId(personaId);
          if (customText !== undefined) setCustomInstruction(customText);
        }}
      />

      {/* Settings & Info Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        sessions={sessions}
        onClearAllSessions={handleClearAllSessions}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
}
