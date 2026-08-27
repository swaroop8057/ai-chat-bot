import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';
import { Menu, Sparkles } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-950 text-slate-100">
      {/* Left Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden lg:pl-72">
        {/* Mobile Header Bar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-surface-900 lg:hidden z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-400 rounded-lg hover:bg-slate-800 hover:text-slate-200"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-600">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white font-heading">AskFlow AI</span>
          </div>

          <div className="w-9" /> {/* Spacer */}
        </header>

        {/* Dynamic Page Outlet */}
        <main className="flex-1 overflow-y-auto relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
