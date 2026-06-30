'use client';

import { useVeltrixStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import LeadCard from './components/LeadCard';
import EmailEditor from './components/EmailEditor';
import ProgressTracker from './components/ProgressTracker';
import LeadsDirectoryTable from './components/LeadsDirectoryTable';
import { RefreshCw, Layers, Hammer } from 'lucide-react';

function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-slate-400">
      <Hammer className="w-12 h-12 mb-4 opacity-50" />
      <h2 className="text-xl font-bold text-slate-500 mb-2">{title} Module</h2>
      <p className="text-sm">This section is currently under development.</p>
    </div>
  );
}

export default function BdrWorkspace() {
  const { 
    user, 
    leads, 
    currentIndex, 
    resetBdrQueue,
    activeBdrTab,
    setActiveBdrTab
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
      <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center text-slate-500 text-xs">
        Verifying BDR Session Auth...
      </div>
    );
  }

  const currentLead = leads[currentIndex];
  const totalLeads = leads.length;

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex text-slate-800">
      
      {/* Persistent Left Navigation Sidebar */}
      <Sidebar activeTab="workspace" />

      {/* Main Workspace Panel Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        
        {/* Top Header bar */}
        <header className="h-14 border-b border-gray-300 bg-white flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-slate-800">Lead Queue Workspace</h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-semibold uppercase">
              Outbound BDR
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Queue info badge */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Layers className="w-4 h-4 text-blue-500" />
              <span>Queue status:</span>
              <span className="font-bold text-slate-700 font-mono">
                {currentIndex >= totalLeads ? totalLeads : currentIndex + 1} / {totalLeads}
              </span>
            </div>

            {/* Reset Button for testing */}
            <button
              onClick={resetBdrQueue}
              className="crm-btn-secondary py-1 px-2.5 flex items-center gap-1 text-[11px]"
              title="Reset Queue for demo"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Queue</span>
            </button>
          </div>
        </header>

        {/* Tab Sub-Header Navigation (Only for Leads) */}
        {(activeBdrTab === 'queue' || activeBdrTab === 'directory') && (
          <div className="bg-white border-b border-gray-300 px-8 py-2.5 flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveBdrTab('queue')}
              className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                activeBdrTab === 'queue'
                  ? 'bg-blue-600 border-blue-700 text-white shadow-sm'
                  : 'bg-white hover:bg-gray-50 border-gray-350 text-slate-600'
              }`}
            >
              Active Outbox Queue
            </button>
            <button
              onClick={() => setActiveBdrTab('directory')}
              className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                activeBdrTab === 'directory'
                  ? 'bg-blue-600 border-blue-700 text-white shadow-sm'
                  : 'bg-white hover:bg-gray-50 border-gray-350 text-slate-600'
              }`}
            >
              Leads Directory Table
            </button>
          </div>
        )}

        {/* Content Frame */}
        <main className="flex-1 p-8 max-w-6xl w-full mx-auto">
          {activeBdrTab === 'queue' && (
            <div className="grid lg:grid-cols-5 gap-8 items-start">
              
              {/* Left Workspace Widgets (lg:col-span-2) */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <LeadCard lead={currentLead} />
                <ProgressTracker />
              </div>

              {/* Right Editor Widget (lg:col-span-3) */}
              <div className="lg:col-span-3">
                <EmailEditor lead={currentLead} />
              </div>

            </div>
          )}
          
          {activeBdrTab === 'directory' && <LeadsDirectoryTable />}
          
          {activeBdrTab !== 'queue' && activeBdrTab !== 'directory' && (
            <PlaceholderView title={activeBdrTab.charAt(0).toUpperCase() + activeBdrTab.slice(1)} />
          )}
        </main>
      </div>

    </div>
  );
}
