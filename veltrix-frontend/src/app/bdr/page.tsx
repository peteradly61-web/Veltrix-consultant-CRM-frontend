'use client';

import { useVeltrixStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import LeadsExcelTable from './components/LeadsExcelTable';
import MeetingsTable from './components/MeetingsTable';
import { RefreshCw, LayoutGrid, Layers, Hammer, Activity } from 'lucide-react';

function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="crm-panel bg-white shadow-sm border border-gray-300 rounded p-12 flex flex-col items-center justify-center min-h-[350px] text-slate-400">
      <Hammer className="w-12 h-12 mb-4 text-blue-600 opacity-60 animate-bounce" />
      <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">{title} Dashboard</h2>
      <p className="text-xs text-slate-500 font-medium">This module is currently synced and waiting offline activity.</p>
    </div>
  );
}

export default function BdrWorkspace() {
  const { 
    user, 
    leads, 
    resetBdrQueue,
    activeBdrTab,
    rotateLeadsData
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
    } else if (user.role !== 'bdr') {
      router.push('/');
    }
  }, [user, router, mounted]);

  if (!mounted || !user || user.role !== 'bdr') {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center text-slate-500 text-xs font-semibold">
        Verifying BDR Session Auth...
      </div>
    );
  }

  const totalLeadsCount = leads.length;
  const savedOpportunitiesCount = leads.filter(l => l.savedToOpportunities).length;

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex text-slate-800 font-sans">
      
      {/* Persistent Left Navigation Sidebar */}
      <Sidebar activeTab="workspace" />

      {/* Main Workspace Panel Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        
        {/* Top Header bar */}
        <header className="h-14 border-b border-gray-300 bg-white flex items-center justify-between px-8 shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <h1 className="text-sm font-extrabold text-slate-900 tracking-tight">BDR Work Desk</h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-extrabold uppercase tracking-wide">
              Outbound Representative
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick stats info badge */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1 text-slate-500 font-semibold">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Leads Pool:</span>
                <span className="font-bold text-slate-800">{totalLeadsCount}</span>
              </div>
              <div className="w-px h-3 bg-gray-300" />
              <div className="flex items-center gap-1 text-slate-500 font-semibold">
                <Activity className="w-3.5 h-3.5 text-amber-500" />
                <span>Opportunities:</span>
                <span className="font-bold text-slate-800">{savedOpportunitiesCount}</span>
              </div>
            </div>

            {/* Reset Button for testing */}
            <button
              onClick={resetBdrQueue}
              className="crm-btn-secondary py-1.5 px-3 flex items-center gap-1 text-[11px] font-bold border-gray-350 hover:bg-slate-50"
              title="Reset workspace leads to default mock data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Data</span>
            </button>
          </div>
        </header>

        {/* Content Frame */}
        <main className="flex-1 p-8 max-w-6xl w-full mx-auto space-y-6">
          
          {/* Main workspace tab router */}
          {activeBdrTab === 'queue' && (
            <LeadsExcelTable mode="leads" />
          )}

          {activeBdrTab === 'opportunities' && (
            <LeadsExcelTable mode="opportunities" />
          )}

          {activeBdrTab === 'meetings' && (
            <MeetingsTable />
          )}
          
          {activeBdrTab !== 'queue' && activeBdrTab !== 'opportunities' && activeBdrTab !== 'meetings' && (
            <PlaceholderView title={activeBdrTab.charAt(0).toUpperCase() + activeBdrTab.slice(1)} />
          )}
        </main>
      </div>

    </div>
  );
}
