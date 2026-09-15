import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Code2,
  PenTool,
  Zap,
  GraduationCap,
  Sliders,
  Check,
} from 'lucide-react';
import { PERSONAS } from '../data/constants';
import { PersonaOption } from '../types';

interface PersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPersonaId: string;
  customInstruction: string;
  onSelectPersona: (personaId: string, customText?: string) => void;
}

export const PersonaModal: React.FC<PersonaModalProps> = ({
  isOpen,
  onClose,
  currentPersonaId,
  customInstruction,
  onSelectPersona,
}) => {
  const [selectedId, setSelectedId] = useState(currentPersonaId);
  const [customText, setCustomText] = useState(customInstruction);

  if (!isOpen) return null;

  const getPersonaIcon = (iconName: string) => {
    switch (iconName) {
      case 'Code2':
        return <Code2 className="w-4 h-4 text-sky-400" />;
      case 'PenTool':
        return <PenTool className="w-4 h-4 text-purple-400" />;
      case 'Zap':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'GraduationCap':
        return <GraduationCap className="w-4 h-4 text-emerald-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
    }
  };

  const handleSave = () => {
    onSelectPersona(selectedId, customText);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">
              AI Persona & System Guidance
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          <p className="text-xs text-slate-400">
            Select a specialized AI personality to guide how SandY Chat reasons, formats, and communicates.
          </p>

          <div className="space-y-2">
            {PERSONAS.map((persona) => {
              const isSelected = selectedId === persona.id;
              return (
                <div
                  key={persona.id}
                  onClick={() => setSelectedId(persona.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? 'bg-indigo-600/10 border-indigo-500/50 text-white'
                      : 'bg-slate-850/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-slate-800 shrink-0 mt-0.5">
                    {getPersonaIcon(persona.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">
                        {persona.name}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-indigo-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      {persona.description}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Custom option */}
            <div
              onClick={() => setSelectedId('custom')}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                selectedId === 'custom'
                  ? 'bg-indigo-600/10 border-indigo-500/50 text-white'
                  : 'bg-slate-850/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="p-2 rounded-lg bg-slate-800 shrink-0 mt-0.5">
                <Sliders className="w-4 h-4 text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">
                    Custom Instructions
                  </span>
                  {selectedId === 'custom' && (
                    <Check className="w-4 h-4 text-indigo-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Provide your own unique prompt rules and response persona.
                </p>
              </div>
            </div>
          </div>

          {/* Custom prompt text area if custom selected */}
          {selectedId === 'custom' && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Custom System Prompt:
              </label>
              <textarea
                rows={4}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="E.g., You are SandY Chat, specialized in astrophysics and always give math formulas in LaTeX..."
                className="w-full bg-slate-950 border border-slate-750 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-colors"
          >
            Apply Persona
          </button>
        </div>
      </div>
    </div>
  );
};
