import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessagesSquare, Plus, ArrowRight, Sparkles, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../lib/api.js';
import { DashboardStats } from '../types/index.js';

export const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats>({
    totalConversations: 0,
    totalMessages: 0,
    recentConversations: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchStats() {
      try {
        setLoading(true);
        const data = await api.getDashboardStats(token);
        if (isMounted && data) {
          setStats(data);
        }
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleStartNewChat = () => {
    navigate('/chat?new=true');
  };

  const handleViewAllChats = () => {
    navigate('/chat');
  };

  return (
    <div className="min-h-full p-6 sm:p-8 lg:p-10 max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Welcome Message */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-surface-900 via-surface-900 to-brand-950/40 border border-slate-800/80 p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-brand-300 bg-brand-500/15 border border-brand-500/25">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>AskFlow AI Assistant</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
            Welcome back, {user?.name || 'Explorer'}!
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            Here is your AI conversation overview. Ask questions, generate ideas, analyze code, and collaborate in real-time.
          </p>
        </div>
      </div>

      {/* Two Simple Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Total AI Conversations */}
        <div
          onClick={handleViewAllChats}
          className="glass-card glass-card-hover rounded-3xl p-7 flex flex-col justify-between cursor-pointer border border-slate-800 relative group overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Conversation Metrics
              </span>
              <h2 className="text-xl font-bold text-white font-heading">
                Total AI Conversations
              </h2>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-500/15 border border-brand-500/30 text-brand-400 group-hover:scale-110 transition-transform duration-200">
              <MessagesSquare className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-8 mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-white tracking-tight font-heading">
                {loading ? '—' : stats.totalConversations}
              </span>
              <span className="text-sm font-medium text-slate-400">
                conversations recorded
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs font-semibold text-brand-400 group-hover:text-brand-300">
            <span>View all conversations</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: Start New Chat Button */}
        <div className="glass-card glass-card-hover rounded-3xl p-7 flex flex-col justify-between border border-slate-800 relative group overflow-hidden bg-gradient-to-br from-surface-900 to-indigo-950/30">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Quick Action
              </span>
              <h2 className="text-xl font-bold text-white font-heading">
                Start New Chat
              </h2>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 group-hover:scale-110 transition-transform duration-200">
              <MessageCircle className="w-6 h-6" />
            </div>
          </div>

          <p className="text-sm text-slate-400 mt-4 mb-6 leading-relaxed">
            Begin a brand new interactive session with Google Gemini. Get answers, write content, solve coding challenges, and more.
          </p>

          <div>
            <button
              onClick={handleStartNewChat}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-brand-600 via-indigo-600 to-indigo-700 hover:from-brand-500 hover:to-indigo-600 shadow-xl shadow-brand-500/25 active:scale-[0.99] transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>Start New Chat</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
