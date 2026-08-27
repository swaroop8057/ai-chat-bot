import React from 'react';
import { Plus, MessageSquare, Trash2, Clock } from 'lucide-react';
import { Conversation } from '../../types/index.js';

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  loading: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onDelete,
  loading,
}) => {
  return (
    <div className="flex flex-col h-full bg-surface-900/60 border-r border-slate-800/80">
      {/* Top action: New Chat Button */}
      <div className="p-3 border-b border-slate-800/60">
        <button
          onClick={onNewChat}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-md shadow-brand-500/20 active:scale-[0.98] transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Chat History ({conversations.length})
        </div>

        {loading && conversations.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-slate-400 animate-pulse">
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-700 mb-2" />
            <p className="text-xs text-slate-400">No conversations yet</p>
            <p className="text-[11px] text-slate-400 mt-1">Start a new chat to begin</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = activeId === conv.id;
            return (
              <div
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`group relative flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl cursor-pointer text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-600/20 text-brand-200 border border-brand-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                  <span className="truncate">{conv.title}</span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => onDelete(conv.id, e)}
                    className="p-1 text-slate-400 hover:text-red-400 rounded transition-colors"
                    title="Delete chat"
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
