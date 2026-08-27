import React, { useRef, useEffect } from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  loading: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  loading,
  placeholder = 'Ask anything to AskFlow AI...',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on input content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !loading) {
        onSend();
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4">
      <div className="relative flex flex-col rounded-2xl bg-surface-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md focus-within:border-brand-500/70 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all duration-200">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={loading}
          className="w-full px-4 pt-3.5 pb-2 bg-transparent text-sm text-slate-100 placeholder-slate-400 focus:outline-none resize-none min-h-[48px] max-h-[180px]"
        />

        <div className="flex items-center justify-between px-3 pb-2.5 pt-1 border-t border-slate-800/40">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Powered by Google Gemini</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[11px] text-slate-400">
              <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-800 border border-slate-700 rounded font-mono text-slate-400">Enter</kbd> to send
            </span>
            <button
              onClick={onSend}
              disabled={!value.trim() || loading}
              className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 ${
                value.trim() && !loading
                  ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/25 active:scale-95'
                  : 'bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
              aria-label="Send message"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-400">
        AskFlow AI is connected to secure Express backend with Supabase RLS and Gemini API.
      </p>
    </div>
  );
};
