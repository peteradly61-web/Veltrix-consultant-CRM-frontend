'use client';

import { useVeltrixStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import MonitoringGrid from './components/MonitoringGrid';
import DataRotator from './components/DataRotator';
import BDRPerformanceAnalytics from './components/BDRPerformanceAnalytics';
import UserManagement from './components/UserManagement';
import { ShieldAlert, Sparkles, Terminal, Bell, Hammer } from 'lucide-react';

function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-slate-400">
      <Hammer className="w-12 h-12 mb-4 opacity-50" />
      <h2 className="text-xl font-bold text-slate-500 mb-2">{title} Module</h2>
      <p className="text-sm">This section is currently under development.</p>
    </div>
  );
}

export default function AdminCommandCenter() {
  const { 
    user, 
    realtimeLogs,
    activeAdminTab,
    setActiveAdminTab
  } = useVeltrixStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!user) {
      router.push('/');
    } else if (user.role !== 'admin') {
      router.push('/');
    }
  }, [user, router, mounted]);

  if (!mounted || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center text-slate-500 text-xs">
        Verifying Operations Session Auth...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex text-slate-800">
      
      {/* Persistent Left Navigation Sidebar */}
      <Sidebar activeTab="console" />

      {/* Main Command Panel Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        
        {/* Top Header bar */}
        <header className="h-14 border-b border-gray-300 bg-white flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-slate-800">SaaS Operations Console</h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-semibold uppercase">
              System Admin
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-gray-500 font-semibold">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>Outbound Command Hub</span>
          </div>
        </header>

        {/* Tab Sub-Header Navigation */}
        {(activeAdminTab === 'operations' || activeAdminTab === 'performance') && (
          <div className="bg-white border-b border-gray-300 px-8 py-2.5 flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveAdminTab('operations')}
              className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                activeAdminTab === 'operations'
                  ? 'bg-blue-600 border-blue-700 text-white shadow-sm'
                  : 'bg-white hover:bg-gray-50 border-gray-350 text-slate-600'
              }`}
            >
              Operations Command Center
            </button>
            <button
              onClick={() => setActiveAdminTab('performance')}
              className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                activeAdminTab === 'performance'
                  ? 'bg-blue-600 border-blue-700 text-white shadow-sm'
                  : 'bg-white hover:bg-gray-50 border-gray-350 text-slate-600'
              }`}
            >
              BDR Performance Dashboard
            </button>
          </div>
        )}

        {/* Content Frame */}
        <main className="flex-1 p-8 space-y-8 max-w-[1400px] w-full mx-auto">
          {activeAdminTab === 'operations' && (
            <div className="grid lg:grid-cols-4 gap-8">
              
              {/* Main monitoring and rotator panel (lg:col-span-3) */}
              <div className="lg:col-span-3 space-y-8">
                <MonitoringGrid />
                <DataRotator />
              </div>

              {/* Supabase realtime broadcasts sidebar (lg:col-span-1) */}
              <div className="lg:col-span-1">
                <div className="crm-panel bg-white h-[650px] flex flex-col">
                  {/* Header */}
                  <div className="crm-panel-header flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-500 animate-pulse" />
                      <span className="text-xs font-bold uppercase text-slate-700">Supabase Broadcasts</span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>

                  {/* Event Logs list */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {realtimeLogs.length === 0 ? (
                      <div className="text-gray-400 text-xs text-center py-12">No event payloads received.</div>
                    ) : (
                      realtimeLogs.map((log) => {
                        let typeColor = 'text-gray-600 border-gray-200 bg-gray-50';
                        if (log.type === 'success') typeColor = 'text-emerald-700 border-emerald-250 bg-emerald-50';
                        if (log.type === 'warning') typeColor = 'text-amber-700 border-amber-250 bg-amber-50';
                        if (log.type === 'error') typeColor = 'text-red-700 border-red-250 bg-red-50';

                        return (
                          <div
                            key={log.id}
                            className={`p-3 rounded border text-[11px] font-mono leading-relaxed transition-all ${typeColor}`}
                          >
                            <div className="flex justify-between items-center mb-1 text-[9px] text-gray-400 font-sans">
                              <span>Socket Payload</span>
                              <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="font-semibold">{log.message}</p>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Console Log Help footer */}
                  <div className="p-4 border-t border-gray-150 bg-gray-50 rounded-b text-[10px] text-gray-500 leading-normal flex items-start gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <span>
                      Simulate events by dispatching queue actions in the BDR workspace, or clicking agent simulation buttons.
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}
          
          {activeAdminTab === 'performance' && <BDRPerformanceAnalytics />}
          
          {activeAdminTab === 'accounts' && <UserManagement />}

          {activeAdminTab !== 'operations' && activeAdminTab !== 'performance' && activeAdminTab !== 'accounts' && (
            <PlaceholderView title={activeAdminTab.charAt(0).toUpperCase() + activeAdminTab.slice(1)} />
          )}
        </main>
      </div>

    </div>
  );
}
