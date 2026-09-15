import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles,
  User,
  Copy,
  Check,
  Volume2,
  VolumeX,
  RotateCcw,
  ExternalLink,
  Globe,
  AlertCircle,
  Download,
  Paintbrush,
  Maximize2,
  X,
} from 'lucide-react';
import { ChatMessage, MessageImage } from '../types';
import { formatChatTimestamp } from '../utils/storage';
import { SandyLogo } from './SandyLogo';

interface MessageItemProps {
  message: ChatMessage;
  isLast: boolean;
  isStreaming: boolean;
  onRegenerate?: () => void;
  onRegenerateWithModel?: (modelId: string) => void;
  onEditImage?: (image: MessageImage) => void;
  fontSize?: 'normal' | 'medium' | 'large';
  codeLineNumbers?: boolean;
}

function cleanErrorText(raw: string): string {
  if (!raw) return 'An unexpected error occurred.';
  let text = raw;
  try {
    const parsed = JSON.parse(text);
    if (parsed.error?.message) text = parsed.error.message;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const inner = JSON.parse(match[0]);
        if (inner.error?.message) text = inner.error.message;
      } catch {}
    }
  }

  if (
    text.includes('503') ||
    text.includes('high demand') ||
    text.includes('UNAVAILABLE') ||
    text.includes('Service Unavailable')
  ) {
    return 'The model is currently experiencing high demand. Click "Retry with Flash Lite" below for an immediate response.';
  }

  return text;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isLast,
  isStreaming,
  onRegenerate,
  onRegenerateWithModel,
  onEditImage,
  fontSize = 'normal',
  codeLineNumbers = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showFullImageModal, setShowFullImageModal] = useState(false);
  const isAssistant = message.role === 'assistant';

  const fontClass =
    fontSize === 'large'
      ? 'text-base sm:text-lg'
      : fontSize === 'medium'
      ? 'text-[15px] sm:text-[16px]'
      : 'text-sm sm:text-base';

  useEffect(() => {
    return () => {
      if (isSpeaking && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSpeaking]);

  const handleCopy = () => {
    if (!message.content) return;
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSpeech = () => {
    if (!window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown text for smoother speech
    const cleanText = message.content
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/[*_#`]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleDownloadImage = (url: string, filename = 'sandy-chat-image.png') => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleTriggerEdit = () => {
    if (message.generatedImage && onEditImage) {
      const parts = message.generatedImage.url.split(',');
      const mime = parts[0]?.match(/:(.*?);/)?.[1] || 'image/png';
      const base64Data = parts[1] || '';
      onEditImage({
        mimeType: mime,
        data: base64Data,
        previewUrl: message.generatedImage.url,
      });
    }
  };

  return (
    <>
      {!isAssistant ? (
        /* User Message (Mera Chat) - Aligned to the RIGHT side */
        <div className="w-full flex justify-end px-2 sm:px-4 py-1.5 animate-in fade-in duration-200">
          <div className="flex flex-row-reverse items-start gap-2.5 sm:gap-3 max-w-[88%] sm:max-w-[78%]">
            {/* User Avatar on the RIGHT */}
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 shrink-0 mt-0.5 shadow-sm">
              <User className="w-4 h-4" />
            </div>

            {/* User Bubble & Info */}
            <div className="flex flex-col items-end min-w-0">
              {/* Header: Name & Timestamp */}
              <div className="flex items-center gap-2 mb-1 px-1 text-xs text-slate-400 flex-row-reverse">
                <span className="font-semibold text-slate-200">You</span>
                <span className="text-[11px] text-slate-500">
                  {formatChatTimestamp(message.timestamp)}
                </span>
              </div>

              {/* User attached image */}
              {message.image && (
                <div className="mb-2 max-w-sm rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-md">
                  <img
                    src={
                      message.image.previewUrl ||
                      `data:${message.image.mimeType};base64,${message.image.data}`
                    }
                    alt="Attached user upload"
                    className="max-h-64 w-auto object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* User Text Bubble */}
              <div className={`rounded-2xl rounded-tr-sm px-4 py-3 bg-indigo-600/90 text-white border border-indigo-500/30 shadow-md whitespace-pre-wrap leading-relaxed ${fontClass} break-words text-left`}>
                {message.content}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* SandY Intelligence Message - Aligned to the LEFT side */
        <div className="w-full flex justify-start px-2 sm:px-4 py-1.5 animate-in fade-in duration-200">
          <div className="flex items-start gap-2.5 sm:gap-3 max-w-[94%] sm:max-w-[85%] w-full sm:w-auto">
            {/* SandY Intelligence Logo Avatar on the LEFT */}
            <div className="shrink-0 mt-0.5">
              <SandyLogo size="sm" showGlow />
            </div>

            {/* Assistant Bubble & Info */}
            <div className="flex flex-col items-start min-w-0 w-full sm:max-w-3xl">
              {/* Header: Name & Timestamp on the Left */}
              <div className="flex items-center gap-2 mb-1.5 px-1 text-xs text-slate-400">
                <span className="font-semibold text-indigo-300">SandY Intelligence</span>
                <span className="text-[11px] text-slate-500">
                  {formatChatTimestamp(message.timestamp)}
                </span>
              </div>

              {/* Main SandY Bubble Card */}
              <div className="w-full rounded-2xl rounded-tl-sm p-4 sm:p-5 bg-slate-900/95 border border-slate-800 shadow-xl shadow-black/20 text-slate-100 text-left">
                {/* Generated or Edited Image Result */}
                {message.generatedImage && (
                  <div className="mb-4 p-3 rounded-2xl bg-slate-950/80 border border-purple-500/30 shadow-lg shadow-black/30">
                    <div className="relative group rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center">
                      <img
                        src={message.generatedImage.url}
                        alt={message.generatedImage.prompt}
                        className="w-full max-h-[480px] object-contain rounded-xl cursor-pointer"
                        onClick={() => setShowFullImageModal(true)}
                        referrerPolicy="no-referrer"
                      />

                      {/* Overlay actions on hover */}
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          onClick={() => setShowFullImageModal(true)}
                          className="p-2.5 rounded-xl bg-slate-900/90 text-white hover:bg-slate-800 transition-colors shadow-lg"
                          title="View Fullscreen"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDownloadImage(
                              message.generatedImage!.url,
                              `sandy-${Date.now()}.png`
                            )
                          }
                          className="p-2.5 rounded-xl bg-slate-900/90 text-white hover:bg-slate-800 transition-colors shadow-lg"
                          title="Download Image"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {onEditImage && (
                          <button
                            onClick={handleTriggerEdit}
                            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-purple-600 text-white hover:bg-purple-500 transition-colors shadow-lg text-xs font-semibold"
                            title="Edit this image with SandY"
                          >
                            <Paintbrush className="w-3.5 h-3.5" />
                            <span>Edit this image</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bottom Info & Action Strip */}
                    <div className="mt-3 flex items-center justify-between flex-wrap gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-purple-300 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>
                          {message.generatedImage.isEdit ? 'Edited Image' : 'Generated Image'} • SandY Studio
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleDownloadImage(
                              message.generatedImage!.url,
                              `sandy-${Date.now()}.png`
                            )
                          }
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs transition-colors border border-slate-700/60"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                        {onEditImage && (
                          <button
                            onClick={handleTriggerEdit}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs transition-colors border border-purple-500/40"
                          >
                            <Paintbrush className="w-3.5 h-3.5" />
                            <span>Edit with prompt</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Banner or Message Content */}
                {message.error ? (
                  <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-200 text-xs">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                      <span className="leading-relaxed font-normal">
                        {cleanErrorText(message.content)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      {onRegenerateWithModel && (
                        <button
                          onClick={() => onRegenerateWithModel('gemini-3.1-flash-lite')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 font-medium transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Retry with Flash Lite (Instant)</span>
                        </button>
                      )}
                      {onRegenerate && (
                        <button
                          onClick={onRegenerate}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors border border-slate-750"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retry</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  message.content && (
                    <div className={`text-slate-200 leading-relaxed ${fontClass}`}>
                      <div className="markdown-content">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ node, inline, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || '');
                              const language = match ? match[1] : '';
                              const codeString = String(children).replace(/\n$/, '');

                              if (!inline && language) {
                                return (
                                  <CodeBlock
                                    language={language}
                                    code={codeString}
                                    showLineNumbers={codeLineNumbers}
                                  />
                                );
                              }

                              if (!inline && codeString.includes('\n')) {
                                return (
                                  <CodeBlock
                                    language=""
                                    code={codeString}
                                    showLineNumbers={codeLineNumbers}
                                  />
                                );
                              }

                              return (
                                <code
                                  className="bg-slate-800/90 text-indigo-300 px-1.5 py-0.5 rounded text-[0.88em] font-mono border border-slate-700/60"
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )
                )}

                {/* Web Search Grounding Sources */}
                {message.groundingSources && message.groundingSources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 mb-2">
                      <Globe className="w-3.5 h-3.5" />
                      <span>Sources from Google Search:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {message.groundingSources.map((source, idx) => (
                        <a
                          key={idx}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors max-w-xs truncate"
                        >
                          <span className="truncate">{source.title || source.url}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Toolbar for SandY Intelligence */}
                {!message.error && message.content && (
                  <div className="flex items-center justify-start gap-1 pt-2 mt-3 border-t border-slate-800/60 text-slate-400">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs hover:text-white hover:bg-slate-800 transition-colors"
                      title="Copy response to clipboard"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 text-[11px]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Copy</span>
                        </>
                      )}
                    </button>

                    {window.speechSynthesis && (
                      <button
                        onClick={handleToggleSpeech}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                          isSpeaking
                            ? 'text-indigo-400 bg-indigo-500/10'
                            : 'hover:text-white hover:bg-slate-800'
                        }`}
                        title={isSpeaking ? 'Stop reading' : 'Read aloud'}
                      >
                        {isSpeaking ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                            <span className="text-[11px]">Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Listen</span>
                          </>
                        )}
                      </button>
                    )}

                    {isLast && !isStreaming && onRegenerate && (
                      <button
                        onClick={onRegenerate}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-xs hover:text-white hover:bg-slate-800 transition-colors"
                        title="Regenerate response"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Regenerate</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Modal */}
      {showFullImageModal && message.generatedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowFullImageModal(false)}
        >
          <button
            onClick={() => setShowFullImageModal(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-800"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={message.generatedImage.url}
            alt={message.generatedImage.prompt}
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            referrerPolicy="no-referrer"
          />
        </div>
      )}
    </>
  );
};

// Reusable CodeBlock with copy button, language tag, and optional line numbers
const CodeBlock: React.FC<{
  language: string;
  code: string;
  showLineNumbers?: boolean;
}> = ({ language, code, showLineNumbers = true }) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n');

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-750 bg-slate-950 font-mono text-xs">
      {/* Code Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900 border-b border-slate-800 text-slate-400">
        <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
          {language || 'code'}
        </span>
        <button
          onClick={copyCode}
          className="flex items-center gap-1 text-[11px] hover:text-white px-2 py-0.5 rounded hover:bg-slate-800 transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-3.5 overflow-x-auto text-slate-200">
        {showLineNumbers && lines.length > 1 ? (
          <table className="border-collapse w-full">
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="leading-relaxed">
                  <td className="pr-4 select-none text-right text-slate-600 font-mono text-[11px] align-top w-8">
                    {idx + 1}
                  </td>
                  <td className="whitespace-pre font-mono text-slate-200">{line || ' '}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <pre className="m-0 leading-relaxed font-mono">{code}</pre>
        )}
      </div>
    </div>
  );
};
