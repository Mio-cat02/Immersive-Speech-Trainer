import React from 'react';
import { Sparkles } from 'lucide-react';

interface ScriptHelperProps {
  text: string;
  translation: string;
  visible: boolean;
}

export const ScriptHelper: React.FC<ScriptHelperProps> = ({ text, translation, visible }) => {
  if (!visible || !text) return null;

  return (
    <div className="mb-4 mx-4 bg-violet-50/90 backdrop-blur-sm border border-violet-100 rounded-xl p-4 animate-in slide-in-from-bottom-5 fade-in duration-500 shadow-sm">
      <div className="flex items-center gap-2 mb-2 text-violet-600 text-xs font-bold uppercase tracking-wider">
        <Sparkles size={12} />
        <span>Helper</span>
      </div>
      <p className="text-lg font-semibold text-violet-900 mb-1 leading-snug">
        "{text}"
      </p>
      {translation && (
        <p className="text-sm text-violet-400">
          {translation}
        </p>
      )}
    </div>
  );
};