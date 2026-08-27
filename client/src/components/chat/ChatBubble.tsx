import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User as UserIcon, Copy, Check, Sparkles } from 'lucide-react';
import { Message } from '../../types/index.js';

interface ChatBubbleProps {
  message: Message;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedTime = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`group flex gap-4 w-full px-4 py-4 animate-fade-in ${
        isAssistant ? 'bg-surface-900/40 border-y border-slate-800/40' : 'bg-transparent'
      }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isAssistant ? (
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 shadow-md shadow-brand-500/20 text-white">
            <Sparkles className="w-4 h-4" />
          </div>
        ) : (
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
            <UserIcon className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Header (Role & Time) */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-300">
            {isAssistant ? 'AskFlow AI' : 'You'}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">{formattedTime}</span>
            {isAssistant && (
              <button
                onClick={handleCopy}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-200 transition-opacity rounded"
                title="Copy message"
                aria-label="Copy message"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Message Body */}
        {isAssistant ? (
          <div className="prose-ai">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
        )}
      </div>
    </div>
  );
};
