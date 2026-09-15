import React from 'react';
import {
  Sparkles,
  Code2,
  BookOpen,
  PenTool,
  Compass,
  ArrowUpRight,
} from 'lucide-react';
import { PROMPT_SUGGESTIONS } from '../data/constants';
import { SandyLogo } from './SandyLogo';

interface EmptyStateProps {
  onSelectPrompt: (promptText: string) => void;
  activePersonaName: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onSelectPrompt,
  activePersonaName,
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Code':
        return <Code2 className="w-4 h-4 text-sky-400" />;
      case 'Learn':
        return <BookOpen className="w-4 h-4 text-emerald-400" />;
      case 'Creative':
        return <PenTool className="w-4 h-4 text-purple-400" />;
      default:
        return <Compass className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-3xl mx-auto my-auto animate-in fade-in zoom-in-95 duration-200">
      {/* Central Professional SandY Logo */}
      <div className="relative mb-6">
        <SandyLogo size="xl" showGlow />
      </div>

      <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-2">
        How can <span className="text-indigo-400">SandY Chat</span> help you today?
      </h1>
      <p className="text-slate-400 text-sm max-w-md mx-auto mb-8">
        Your intelligent conversational partner powered by Google Gemini Intelligence. Persona active:{' '}
        <span className="text-slate-200 font-medium">{activePersonaName}</span>.
      </p>

      {/* Suggestion prompt cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
        {PROMPT_SUGGESTIONS.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(item.prompt)}
            className="group p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between shadow-sm cursor-pointer text-left"
          >
            <div className="flex items-start justify-between w-full mb-2">
              <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-slate-750 transition-colors">
                {getCategoryIcon(item.category)}
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
                {item.title}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2">
                {item.subtitle}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
