import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Image as ImageIcon,
  Mic,
  MicOff,
  Globe,
  X,
  Paintbrush,
  Sparkles,
  Volume2,
  Ratio,
} from 'lucide-react';
import { MessageImage } from '../types';

interface ChatInputProps {
  onSendMessage: (content: string, image?: MessageImage) => void;
  onGenerateImage?: (prompt: string, image?: MessageImage, aspectRatio?: string) => void;
  isStreaming: boolean;
  isGeneratingImage?: boolean;
  onStopStreaming: () => void;
  webSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  placeholder?: string;
  externalAttachedImage?: MessageImage | null;
  onClearExternalImage?: () => void;
  sendShortcut?: 'enter' | 'ctrlEnter';
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onGenerateImage,
  isStreaming,
  isGeneratingImage = false,
  onStopStreaming,
  webSearchEnabled,
  onToggleWebSearch,
  placeholder = 'Ask SandY anything...',
  externalAttachedImage,
  onClearExternalImage,
  sendShortcut = 'enter',
}) => {
  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState<MessageImage | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImageMode, setIsImageMode] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('1:1');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Sync external image if passed (e.g. when user clicks "Edit this image")
  useEffect(() => {
    if (externalAttachedImage) {
      setAttachedImage(externalAttachedImage);
      setIsImageMode(true);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [externalAttachedImage]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [input]);

  // Web Speech API initialization
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        setRecordingError(null);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const newText = (finalTranscript || interimTranscript).trim();
        if (newText) {
          setInput((prev) => {
            if (!prev.trim()) return newText;
            if (prev.endsWith(' ')) return `${prev}${newText}`;
            return `${prev} ${newText}`;
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition status:', event.error);
        if (event.error === 'not-allowed') {
          setRecordingError('Microphone permission denied. Please allow microphone access.');
        } else if (event.error === 'no-speech') {
          // Non-critical, keep listening or let user stop
        } else {
          setRecordingError(`Speech error: ${event.error}`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn('Web Speech API is not supported in this browser.');
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Toggle Voice Dictation via Web Speech API
  const handleToggleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition || !recognitionRef.current) {
      alert(
        'The Web Speech API is not supported in this browser. Please try Chrome, Edge, or Safari.'
      );
      return;
    }

    if (isRecording) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsRecording(false);
    } else {
      setRecordingError(null);
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err: any) {
        console.error('Failed to start speech recognition:', err);
        setRecordingError('Could not start voice input. Please check microphone permissions.');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (sendShortcut === 'ctrlEnter') {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit();
      }
    } else {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  const handleSubmit = () => {
    if (isStreaming || isGeneratingImage) {
      onStopStreaming();
      return;
    }

    const trimmed = input.trim();
    if (!trimmed && !attachedImage) return;

    if (isRecording && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsRecording(false);
    }

    if (isImageMode && onGenerateImage) {
      onGenerateImage(trimmed, attachedImage || undefined, aspectRatio);
    } else {
      onSendMessage(trimmed, attachedImage || undefined);
    }

    setInput('');
    setAttachedImage(null);
    if (onClearExternalImage) onClearExternalImage();

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Image upload handling
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WebP, etc.).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        const base64Data = result.split(',')[1];
        setAttachedImage({
          mimeType: file.type,
          data: base64Data,
          previewUrl: result,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    }
  };

  const removeAttachedImage = () => {
    setAttachedImage(null);
    if (onClearExternalImage) onClearExternalImage();
  };

  return (
    <div
      className="p-3 sm:p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent sticky bottom-0 z-10"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="max-w-3xl mx-auto">
        {/* Voice Recording Active Banner */}
        {isRecording && (
          <div className="mb-2 px-3 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span className="font-medium">Voice Input Active</span>
              <span className="text-rose-400/80 hidden sm:inline">
                Listening... Speak naturally to dictate your message.
              </span>
            </div>
            <button
              onClick={handleToggleVoiceInput}
              className="px-2 py-0.5 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-[11px] font-medium transition-colors"
            >
              Stop Dictation
            </button>
          </div>
        )}

        {/* Recording Error Alert */}
        {recordingError && (
          <div className="mb-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
            <span>{recordingError}</span>
            <button
              onClick={() => setRecordingError(null)}
              className="text-amber-400 hover:text-white ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Image Mode Banner if active */}
        {isImageMode && (
          <div className="mb-2 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between text-xs text-purple-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span className="font-semibold text-white">
                {attachedImage ? 'Edit Image Mode' : 'Create Image Mode'}
              </span>
              <span className="text-purple-300/80 hidden sm:inline">
                (Powered by gemini-3.1-flash-image)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Aspect Ratio Selector */}
              <div className="flex items-center gap-1 bg-slate-900/80 rounded-lg p-0.5 border border-purple-500/20 text-[11px]">
                {(['1:1', '16:9', '9:16', '4:3'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-1.5 py-0.5 rounded ${
                      aspectRatio === ratio
                        ? 'bg-purple-600 text-white font-medium'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsImageMode(false)}
                className="p-1 text-slate-400 hover:text-white"
                title="Exit Image Mode"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Input Box */}
        <div
          className={`relative rounded-2xl bg-slate-900 border transition-all shadow-xl shadow-black/20 ${
            isDragging
              ? 'border-indigo-500 ring-2 ring-indigo-500/30'
              : isImageMode
              ? 'border-purple-500/60 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/40'
              : 'border-slate-750 focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/40'
          }`}
        >
          {/* Image preview badge */}
          {attachedImage && (
            <div className="p-3 pb-0 flex items-center">
              <div className="relative inline-block rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                <img
                  src={attachedImage.previewUrl}
                  alt="Attachment"
                  className="h-16 w-auto object-cover"
                />
                <button
                  type="button"
                  onClick={removeAttachedImage}
                  className="absolute top-1 right-1 p-0.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white shadow"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="ml-3 text-xs text-slate-400">
                <span className="font-medium text-slate-200 block">
                  {isImageMode ? 'Base image for editing' : 'Image attached'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {isImageMode
                    ? 'SandY will modify this image based on your prompt'
                    : 'SandY will analyze this image'}
                </span>
              </div>
            </div>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording
                ? 'Listening to your voice dictation...'
                : isImageMode
                ? attachedImage
                  ? 'Describe the edits you want to make to this image (e.g. "Add sunglasses and a sunset background")...'
                  : 'Describe the image you want SandY to create (e.g. "A retro synthwave astronaut on Mars, vibrant neon colors")...'
                : placeholder
            }
            className="w-full bg-transparent text-slate-100 placeholder-slate-400 px-4 pt-3.5 pb-2 text-sm sm:text-base resize-none focus:outline-none leading-relaxed min-h-[48px]"
          />

          {/* Controls Bar */}
          <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
            {/* Left Tools */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Attach Image Button */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                id="image-file-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors ${
                  attachedImage ? 'text-indigo-400 bg-indigo-500/10' : ''
                }`}
                title="Attach an image"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              {/* Create & Edit Image Feature Button */}
              <button
                type="button"
                onClick={() => setIsImageMode(!isImageMode)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isImageMode
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title="Create or edit images with gemini-3.1-flash-image"
              >
                <Paintbrush className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden xs:inline">
                  {attachedImage ? 'Edit Image' : 'Create Image'}
                </span>
              </button>

              {/* Web Search Grounding Toggle */}
              {!isImageMode && (
                <button
                  type="button"
                  onClick={onToggleWebSearch}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    webSearchEnabled
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                  title="Toggle Google Web Search Grounding"
                >
                  <Globe
                    className={`w-3.5 h-3.5 ${
                      webSearchEnabled ? 'text-emerald-400' : ''
                    }`}
                  />
                  <span className="hidden xs:inline">Search</span>
                </button>
              )}

              {/* DEDICATED VOICE INPUT BUTTON (Browser Web Speech API) */}
              <button
                id="voice-input-button"
                type="button"
                onClick={handleToggleVoiceInput}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isRecording
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 ring-2 ring-rose-500/20 animate-pulse'
                    : 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60'
                }`}
                title={
                  isRecording
                    ? 'Stop dictating voice input'
                    : 'Voice Input: Click to dictate your message using Web Speech API'
                }
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-3.5 h-3.5 text-rose-400" />
                    <span className="font-semibold text-rose-300">Listening...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Voice Input</span>
                  </>
                )}
              </button>
            </div>

            {/* Right: Send / Stop button */}
            <div>
              {isStreaming || isGeneratingImage ? (
                <button
                  type="button"
                  onClick={onStopStreaming}
                  className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-all shadow-sm"
                  title="Stop generating"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              ) : (
                <button
                  id="send-message-button"
                  type="button"
                  disabled={!input.trim() && !attachedImage}
                  onClick={handleSubmit}
                  className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all ${
                    input.trim() || attachedImage
                      ? isImageMode
                        ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 cursor-pointer'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 cursor-pointer'
                      : 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                  title={isImageMode ? 'Generate Image' : 'Send message (Enter)'}
                >
                  {isImageMode ? (
                    <Sparkles className="w-4 h-4" />
                  ) : (
                    <ArrowUp className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sub-text */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 pt-1.5">
          <span>
            {isImageMode
              ? 'SandY Image Studio: Create or edit images with natural text prompts.'
              : 'Dictate with Voice Input, search live facts, or attach images.'}
          </span>
          <span className="hidden sm:inline">Press Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
};
