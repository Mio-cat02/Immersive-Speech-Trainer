import React from 'react';
import { Message } from '../types';
import { Play, Pause } from 'lucide-react';

interface ChatBubbleProps {
  message: Message;
  personaColor: string;
  isAudioPlaying: boolean;
  onPlayAudio: () => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, personaColor, isAudioPlaying, onPlayAudio }) => {
  const isAI = message.role === 'ai';
  
  return (
    <div className={`flex w-full mb-6 ${isAI ? 'justify-start' : 'justify-end'}`}>
      <div 
        className={`max-w-[85%] rounded-2xl p-4 shadow-sm relative ${
          isAI 
            ? 'bg-white text-slate-800 rounded-tl-none border border-purple-50' 
            : `bg-gradient-to-br ${personaColor} text-white rounded-tr-none shadow-md`
        }`}
      >
        {/* Message Content */}
        <div className="text-lg leading-relaxed font-medium">
          {message.text}
        </div>

        {/* Translation (AI Only) */}
        {isAI && message.translation && (
          <div className="mt-2 pt-2 border-t border-purple-50 text-sm text-slate-500 font-normal">
            {message.translation}
          </div>
        )}

        {/* Audio Controls (AI Only) */}
        {isAI && message.audioData && (
          <button 
            onClick={onPlayAudio}
            className="absolute -right-3 -bottom-3 bg-white text-violet-600 p-2 rounded-full shadow-md border border-purple-50 hover:scale-105 transition-transform"
          >
            {isAudioPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          </button>
        )}
      </div>
    </div>
  );
};