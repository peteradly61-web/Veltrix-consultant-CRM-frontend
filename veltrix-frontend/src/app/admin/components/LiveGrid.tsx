'use client';

import React from 'react';
import { useLiveLeads } from '@/hooks/useLiveLeads';
import { Radio, Database, Building2, Mail, Briefcase, Tag, Clock } from 'lucide-react';

export default function LiveGrid() {
  const { unassignedLeads, isLiveStreaming } = useLiveLeads();

  return (
    <div className="crm-panel bg-white">
      {/* Panel Header */}
      <div className="crm-panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <Radio className={`w-4 h-4 text-blue-500 ${isLiveStreaming ? 'animate-bounce' : ''}`} />
            {isLiveStreaming && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            )}
          </div>
          <h2 className="text-sm font-bold text-slate-700">Real-Time Ingestion Stream</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-semibold font-mono uppercase">
            WebSocket Status:
          </span>
          <div className="flex items-center gap-1.5">
            {/* Active status indicator dot that flashes green and fires a quick CSS animation pulse whenever isLiveStreaming evaluates to true */}
            <span className={`w-2 h-2 rounded-full transition-all duration-300 ${isLiveStreaming ? 'bg-emerald-500 scale-125 animate-pulse shadow-sm shadow-emerald-500/50' : 'bg-blue-500'}`} />
            <span className="text-[10px] text-gray-500 font-bold">
              {isLiveStreaming ? (
                <span className="text-emerald-600 font-extrabold animate-pulse">Streaming Lead...</span>
              ) : (
                'Listening'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="p-6 space-y-6">
        
        {/* Dynamic Metric Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unassigned Volume</p>
              <p className="text-2xl font-extrabold text-slate-800 mt-1">{unassignedLeads.length}</p>
            </div>
            <div className={`p-2.5 rounded-full ${isLiveStreaming ? 'bg-emerald-50 text-emerald-600 animate-pulse border border-emerald-250' : 'bg-slate-100 text-slate-500'}`}>
              <Database className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stream Activity</p>
              <p className="text-xs font-semibold text-slate-700 mt-2">
                {isLiveStreaming ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Incoming Scraper Payload
                  </span>
                ) : (
                  <span className="text-slate-500">Idle - Awaiting scraper connection</span>
                )}
              </p>
            </div>
            <div className={`p-2.5 rounded-full ${isLiveStreaming ? 'bg-emerald-50 text-emerald-600 border border-emerald-250' : 'bg-slate-100 text-slate-500'}`}>
              {isLiveStreaming ? (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              ) : (
                <Radio className="w-5 h-5" />
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Canvas List */}
        <div>
          <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider flex items-center gap-1.5">
            <span>Ingested Leads Queue</span>
            <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full font-mono font-bold lowercase">
              live
            </span>
          </h3>

          <div className="border border-gray-250 rounded overflow-hidden">
            <div className="max-h-[350px] overflow-y-auto divide-y divide-gray-150 bg-white">
              {unassignedLeads.length === 0 ? (
                <div className="p-8 text-center text-slate-450 text-xs">
                  <Database className="w-8 h-8 mx-auto mb-2 opacity-35" />
                  No unassigned leads found in the real-time stream.
                </div>
              ) : (
                unassignedLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-4 hover:bg-slate-55/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fadeIn"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-xs">{lead.contact_name}</span>
                        {lead.title && (
                          <span className="text-[10px] text-gray-500 font-semibold px-1.5 py-0.25 bg-gray-100 rounded border border-gray-200">
                            {lead.title}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[11px] text-gray-500">
                        <span className="flex items-center gap-1 font-semibold text-slate-600">
                          <Building2 className="w-3 h-3 text-slate-400" /> {lead.company_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" /> {lead.contact_email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-slate-400" /> {lead.industry}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center md:self-center gap-2">
                      <span className="text-[9px] font-mono text-gray-400 font-semibold flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-gray-400" />
                        {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold border bg-blue-50 border-blue-200 text-blue-700">
                        <Tag className="w-2.5 h-2.5" />
                        {lead.data_pool_name}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
