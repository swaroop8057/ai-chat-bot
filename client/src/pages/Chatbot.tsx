import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Sparkles, 
  MessageSquare, 
  PanelLeftClose, 
  PanelLeftOpen, 
  AlertCircle, 
  Trash2, 
  Lightbulb, 
  Code2, 
  PenLine, 
  Compass 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../lib/api.js';
import { Conversation, Message } from '../types/index.js';
import { ChatBubble } from '../components/chat/ChatBubble.js';
import { ChatInput } from '../components/chat/ChatInput.js';
import { ConversationList } from '../components/chat/ConversationList.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';

const STARTER_PROMPTS = [
  {
    icon: Code2,
    title: 'Explain React Server Components',
    prompt: 'Can you explain React Server Components (RSC) and how they differ from Client Components with code examples?',
  },
  {
    icon: Lightbulb,
    title: 'Brainstorm AI Startup Ideas',
    prompt: 'Give me 3 innovative SaaS startup ideas that leverage Google Gemini API and Supabase.',
  },
  {
    icon: PenLine,
    title: 'Draft a Professional Email',
    prompt: 'Draft a concise, professional follow-up email to a prospective client after a successful demo meeting.',
  },
  {
    icon: Compass,
    title: 'Design Full-Stack Architecture',
    prompt: 'What are the best practices for structuring a scalable React, Node.js Express, and PostgreSQL application?',
  },
];

export const Chatbot: React.FC = () => {
  const { id: routeConvId } = useParams<{ id?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(routeConvId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [messages, sendingMessage]);

  // Load user conversations
  const loadConversations = async () => {
    try {
      const data = await api.getConversations(token);
      setConversations(data || []);
    } catch (err: any) {
      console.error('Error loading conversations:', err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [token]);

  // Check query params for "?new=true"
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setActiveConversationId(null);
      setMessages([]);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  // Load messages whenever activeConversationId changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    async function fetchMessages() {
      setLoadingHistory(true);
      setError(null);
      try {
        const conv = await api.getConversation(activeConversationId!, token);
        if (isMounted && conv) {
          setMessages(conv.messages || []);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load conversation messages');
        }
      } finally {
        if (isMounted) setLoadingHistory(false);
      }
    }

    fetchMessages();

    return () => {
      isMounted = false;
    };
  }, [activeConversationId, token]);

  // Handle select conversation
  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    navigate(`/chat/${id}`, { replace: true });
  };

  // Handle start new chat
  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    navigate('/chat', { replace: true });
  };

  // Handle delete conversation
  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;

    try {
      await api.deleteConversation(id, token);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        handleNewChat();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete conversation');
    }
  };

  // Handle sending a message
  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputMessage).trim();
    if (!content || sendingMessage) return;

    setError(null);
    setInputMessage('');
    setSendingMessage(true);

    // Optimistically add user message to UI
    const optimisticUserMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConversationId || 'new',
      user_id: 'user',
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUserMsg]);

    try {
      const response = await api.sendMessage(
        content,
        activeConversationId,
        undefined,
        token
      );

      // If this was a new conversation, set active ID and update list
      if (response.isNewConversation || !activeConversationId) {
        setActiveConversationId(response.conversationId);
        navigate(`/chat/${response.conversationId}`, { replace: true });
        await loadConversations();
      }

      // Replace optimistic message with actual DB messages
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== optimisticUserMsg.id);
        return [...filtered, response.userMessage, response.assistantMessage];
      });
    } catch (err: any) {
      setError(err.message || 'Failed to send message to Gemini API');
    } finally {
      setSendingMessage(false);
    }
  };

  const activeConvTitle = conversations.find((c) => c.id === activeConversationId)?.title || 'New Conversation';

  return (
    <div className="flex h-full overflow-hidden bg-surface-950">
      {/* Collapsible Conversation History Drawer for Desktop */}
      <div
        className={`hidden md:block transition-all duration-300 ease-in-out ${
          showHistoryDrawer ? 'w-64' : 'w-0 overflow-hidden'
        }`}
      >
        <ConversationList
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={handleSelectConversation}
          onNewChat={handleNewChat}
          onDelete={handleDeleteConversation}
          loading={false}
        />
      </div>

      {/* Main Chat Interface */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-surface-900/60 backdrop-blur-md z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
              className="hidden md:flex p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              title={showHistoryDrawer ? 'Hide chat history' : 'Show chat history'}
            >
              {showHistoryDrawer ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/30 text-brand-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-white truncate font-heading">
                  {activeConvTitle}
                </h2>
                <p className="text-[11px] text-slate-400">Google Gemini 2.5 Flash</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-300 bg-brand-500/15 hover:bg-brand-500/25 border border-brand-500/30 rounded-xl transition-all"
          >
            <span>+ New Chat</span>
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between text-red-300 text-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200 text-sm">✕</button>
          </div>
        )}

        {/* Message Stream Area */}
        <div className="flex-1 overflow-y-auto">
          {loadingHistory ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner text="Retrieving conversation history..." />
            </div>
          ) : messages.length === 0 ? (
            /* Empty State & Starter Prompts */
            <div className="flex flex-col items-center justify-center min-h-full p-6 text-center max-w-2xl mx-auto space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-xl shadow-brand-500/25">
                <Sparkles className="w-8 h-8 text-white animate-pulse-subtle" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white font-heading">
                  What would you like to ask AskFlow AI?
                </h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Type any question below, or select one of these suggested starters to begin:
                </p>
              </div>

              {/* Starter Prompts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                {STARTER_PROMPTS.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(item.prompt)}
                      className="group p-4 rounded-2xl bg-surface-900/90 hover:bg-slate-800/80 border border-slate-800 hover:border-brand-500/40 text-left transition-all duration-200 shadow-md hover:shadow-brand-500/10"
                    >
                      <div className="flex items-center gap-2 mb-1.5 text-brand-400 group-hover:text-brand-300">
                        <Icon className="w-4 h-4" />
                        <span className="text-xs font-bold text-slate-200 group-hover:text-white">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {item.prompt}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Active Messages List */
            <div className="divide-y divide-slate-800/40 py-2">
              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
              ))}

              {/* Loading AI Response Indicator */}
              {sendingMessage && (
                <div className="flex items-center gap-3 px-6 py-4 bg-surface-900/30 border-t border-slate-800/30 animate-fade-in">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white">
                    <Sparkles className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                    <span>AskFlow AI is thinking</span>
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" />
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="pt-2 bg-gradient-to-t from-surface-950 via-surface-950 to-transparent">
          <ChatInput
            value={inputMessage}
            onChange={setInputMessage}
            onSend={() => handleSendMessage()}
            loading={sendingMessage}
            placeholder={
              messages.length === 0
                ? 'Ask a question or select a starter prompt...'
                : 'Reply to AskFlow AI...'
            }
          />
        </div>
      </div>
    </div>
  );
};
