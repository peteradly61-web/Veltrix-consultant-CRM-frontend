'use client';

import { useVeltrixStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import LeadsExcelTable from './components/LeadsExcelTable';
import MeetingsTable from './components/MeetingsTable';
import BdrCalendar from './components/BdrCalendar';
import { RefreshCw, LayoutGrid, Layers, Hammer, Activity, Menu } from 'lucide-react';

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
    resetBdrQueue,
    activeBdrTab,
    rotateLeadsData,
    setSidebarOpen
  } = useVeltrixStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({ totalLeadsCount: 0, savedOpportunitiesCount: 0 });

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

  useEffect(() => {
    if (!mounted || !user) return;
    const fetchStats = async () => {
      try {
        const resLeads = await fetch(`/api/data-vault/all-leads?limit=1&bdr=${user.name}`);
        const jsonLeads = await resLeads.json();
        const resOpps = await fetch(`/api/data-vault/all-leads?limit=1&bdr=${user.name}&opportunities=true`);
        const jsonOpps = await resOpps.json();
        
        setStats({
          totalLeadsCount: jsonLeads.pagination?.total || 0,
          savedOpportunitiesCount: jsonOpps.pagination?.total || 0
        });
      } catch (err) {
        console.error('Failed to fetch BDR stats:', err);
      }
    };
    fetchStats();
  }, [mounted, user, activeBdrTab]);

  if (!mounted || !user || user.role !== 'bdr') {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center text-slate-500 text-xs font-semibold">
        Verifying BDR Session Auth...
      </div>
    );
  }

  const { totalLeadsCount, savedOpportunitiesCount } = stats;

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex text-slate-800 font-sans overflow-x-hidden">
      
      {/* Persistent Left Navigation Sidebar */}
      <Sidebar activeTab="workspace" />

      {/* Main Workspace Panel Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        
        {/* Top Header bar */}
        <header className="h-14 border-b border-gray-300 bg-white flex items-center justify-between px-4 md:px-8 shrink-0 shadow-sm">
          <div className="flex items-center gap-2">
            {/* Hamburger menu for mobile */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 -ml-1 rounded md:hidden text-slate-600 hover:bg-slate-100 transition-colors mr-1"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-xs md:text-sm font-extrabold text-slate-900 tracking-tight">BDR Work Desk</h1>
              <span className="hidden sm:inline-block text-[9px] px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-extrabold uppercase tracking-wide">
                BDR Rep
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Quick stats info badge */}
            <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs">
              <div className="flex items-center gap-1 text-slate-500 font-semibold">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Leads Pool:</span>
                <span className="inline sm:hidden">Leads:</span>
                <span className="font-bold text-slate-800">{totalLeadsCount}</span>
              </div>
              <div className="w-px h-3 bg-gray-300" />
              <div className="flex items-center gap-1 text-slate-500 font-semibold">
                <Activity className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Opportunities:</span>
                <span className="inline sm:hidden">Opps:</span>
                <span className="font-bold text-slate-800">{savedOpportunitiesCount}</span>
              </div>
            </div>

            {/* Reset Button for testing */}
            <button
              onClick={resetBdrQueue}
              className="crm-btn-secondary py-1.5 px-2 md:px-3 flex items-center gap-1 text-[11px] font-bold border-gray-350 hover:bg-slate-50"
              title="Reset workspace leads to default mock data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Data</span>
            </button>
          </div>
        </header>

        {/* Content Frame */}
        <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto space-y-6">
          
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

          {activeBdrTab === 'calendar' && (
            <BdrCalendar />
          )}
          
          {activeBdrTab !== 'queue' && activeBdrTab !== 'opportunities' && activeBdrTab !== 'meetings' && activeBdrTab !== 'calendar' && (
            <PlaceholderView title={activeBdrTab.charAt(0).toUpperCase() + activeBdrTab.slice(1)} />
          )}
        </main>
      </div>

    </div>
  );
}
