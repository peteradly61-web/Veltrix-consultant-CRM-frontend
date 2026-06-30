'use client';

import React, { useState } from 'react';
import { useVeltrixStore } from '@/lib/store';
import { Mail, BarChart3, Target, Users, Zap, Clock, TrendingUp, ChevronRight, Activity, ArrowUpRight, Award } from 'lucide-react';

export default function BDRPerformanceAnalytics() {
  const { bdrAgents } = useVeltrixStore();
  const [selectedAgentId, setSelectedAgentId] = useState<string>(bdrAgents[0]?.id || '');

  // Calculate overall metrics
  const totalEmailsSent = bdrAgents.reduce((sum, agent) => sum + agent.emailsSent, 0);
  
  // Weighted Averages
  const weightedOpenRate = totalEmailsSent > 0 
    ? Math.round((bdrAgents.reduce((sum, agent) => sum + (agent.emailsSent * agent.openRate), 0) / totalEmailsSent) * 10) / 10
    : 0;

  const weightedReplyRate = totalEmailsSent > 0
    ? Math.round((bdrAgents.reduce((sum, agent) => sum + (agent.emailsSent * agent.replyRate), 0) / totalEmailsSent) * 10) / 10
    : 0;

  const activeCount = bdrAgents.filter(a => a.status === 'active').length;
  const totalCount = bdrAgents.length;

  const selectedAgent = bdrAgents.find(a => a.id === selectedAgentId) || bdrAgents[0];

  // Specific agent conversion details
  const sentCount = selectedAgent?.emailsSent || 0;
  const openedCount = Math.round(sentCount * (selectedAgent?.openRate || 0) / 100);
  const repliedCount = Math.round(sentCount * (selectedAgent?.replyRate || 0) / 100);

  // Dynamic status evaluation
  const getEfficiencyRating = (emailsSent: number, replyRate: number) => {
    if (emailsSent >= 35 && replyRate >= 25) return { label: 'Elite Outfitter', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (emailsSent >= 20 && replyRate >= 15) return { label: 'Strong Performer', class: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (emailsSent >= 10) return { label: 'Standard execution', class: 'bg-slate-100 text-slate-700 border-slate-200' };
    return { label: 'Under-active', class: 'bg-red-50 text-red-700 border-red-200' };
  };

  const getStatusBadgeClass = (status: 'active' | 'idle' | 'away') => {
    switch (status) {
      case 'active': return 'bg-emerald-500';
      case 'idle': return 'bg-amber-500';
      case 'away': return 'bg-red-500';
    }
  };

  // Generate a customized recent timeline feed for selected agent
  const generateBdrTimeline = (agent: typeof bdrAgents[0]) => {
    if (!agent) return [];
    if (agent.emailsSent === 0) {
      return [{ id: 1, time: 'Offline', action: 'No operations recorded in this session.', recipient: 'System Admin', type: 'system' }];
    }
    
    const timeline = [];
    const isAway = agent.status === 'away';
    const isIdle = agent.status === 'idle';

    if (agent.emailsSent >= 1) {
      timeline.push({
        id: 1,
        time: isAway ? '2h ago' : isIdle ? '45m ago' : '6m ago',
        action: 'Sent Outbound Email Introduction',
        recipient: 'Sarah Chen (NanoFlow Automation)',
        type: 'sent'
      });
    }
    if (agent.emailsSent >= 4) {
      timeline.push({
        id: 2,
        time: isAway ? '4h ago' : isIdle ? '1h 10m ago' : '22m ago',
        action: 'Received Outbound Response (Warm Reply)',
        recipient: 'David Vance (Apex Supply Chain)',
        type: 'reply'
      });
    }
    if (agent.emailsSent >= 19) {
      timeline.push({
        id: 3,
        time: isIdle ? '2h 15m ago' : '45m ago',
        action: 'Sent Outbound Value Pitch',
        recipient: 'Marcus Aurelius (Stoic Growth Corp)',
        type: 'sent'
      });
    }
    if (agent.emailsSent >= 28) {
      timeline.push({
        id: 4,
        time: isIdle ? '4h ago' : '1h 30m ago',
        action: 'Disqualified Lead (Bounce Detected)',
        recipient: 'Jordan Brody (Core Infrastructure)',
        type: 'disqualify'
      });
    }
    if (agent.emailsSent >= 34) {
      timeline.push({
        id: 5,
        time: '3h ago',
        action: 'Sent Outbound Introduction Template',
        recipient: 'Elena Petrova (Cyberdyne Systems)',
        type: 'sent'
      });
    }

    return timeline;
  };

  const selectedAgentTimeline = generateBdrTimeline(selectedAgent);

  return (
    <div className="space-y-8">
      
      {/* 1. Header Overview */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">BDR Performance Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">Real-time outbound conversion reports and agent standings.</p>
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-500 font-semibold shadow-sm">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Last updated: </span>
          <span className="text-slate-800 font-bold font-mono">Just Now</span>
        </div>
      </div>

      {/* 2. Key Performance Indicators Row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI: Total Emails */}
        <div className="crm-panel bg-white p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Outbound Volume</p>
            <h3 className="text-2xl font-black text-slate-800 font-mono">{totalEmailsSent}</h3>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-emerald-500" />
              <span className="text-emerald-600 font-bold">14.2%</span> from last week
            </p>
          </div>
          <div className="w-10 h-10 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Mail className="w-5 h-5" />
          </div>
        </div>

        {/* KPI: Weighted Open Rate */}
        <div className="crm-panel bg-white p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Avg. Open Rate</p>
            <h3 className="text-2xl font-black text-slate-800 font-mono">{weightedOpenRate}%</h3>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-emerald-500" />
              <span className="text-emerald-600 font-bold">2.1%</span> average increase
            </p>
          </div>
          <div className="w-10 h-10 rounded bg-emerald-50 border border-emerald-250 flex items-center justify-center text-emerald-600">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>

        {/* KPI: Weighted Reply Rate */}
        <div className="crm-panel bg-white p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Avg. Reply Rate</p>
            <h3 className="text-2xl font-black text-slate-800 font-mono">{weightedReplyRate}%</h3>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-emerald-500" />
              <span className="text-emerald-600 font-bold">5.8%</span> target reply rate
            </p>
          </div>
          <div className="w-10 h-10 rounded bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* KPI: Active Ratio */}
        <div className="crm-panel bg-white p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Active Pipeline</p>
            <h3 className="text-2xl font-black text-slate-800 font-mono">{activeCount} / {totalCount}</h3>
            <p className="text-[10px] text-slate-400">
              <span className="text-slate-500 font-bold">{(activeCount / totalCount * 100).toFixed(0)}%</span> active reps online
            </p>
          </div>
          <div className="w-10 h-10 rounded bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* 3. Main Dashboard Panels */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column (2/3) - Standings and Leaderboard */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* BDR Comparison Standings */}
          <div className="crm-panel bg-white">
            <div className="crm-panel-header flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-bold uppercase text-slate-700">BDR Team Performance Rankings</h3>
              </div>
              <span className="text-[10px] text-gray-400">Click a row to inspect conversion detail</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Agent</th>
                    <th className="px-6 py-3 text-center">Status</th>
                    <th className="px-6 py-3 text-right">Sent</th>
                    <th className="px-6 py-3 text-center">Open Rate</th>
                    <th className="px-6 py-3 text-center">Reply Rate</th>
                    <th className="px-6 py-3">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 text-xs text-slate-700">
                  {bdrAgents.map((agent) => {
                    const rating = getEfficiencyRating(agent.emailsSent, agent.replyRate);
                    const isSelected = agent.id === selectedAgentId;

                    return (
                      <tr
                        key={agent.id}
                        onClick={() => setSelectedAgentId(agent.id)}
                        className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                          isSelected ? 'bg-blue-50/60 font-semibold border-l-4 border-l-blue-600' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 border flex items-center justify-center font-bold text-slate-600 text-[10px]">
                              {agent.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="text-slate-800 font-semibold">{agent.name}</p>
                              <p className="text-[9px] text-slate-400 font-mono">{agent.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] bg-slate-100 border text-slate-600 font-medium">
                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusBadgeClass(agent.status)}`} />
                            {agent.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">
                          {agent.emailsSent}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-mono text-emerald-600 font-bold">{agent.openRate}%</span>
                            <div className="w-16 bg-gray-150 h-1 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full"
                                style={{ width: `${agent.openRate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-mono text-blue-600 font-bold">{agent.replyRate}%</span>
                            <div className="w-16 bg-gray-150 h-1 rounded-full overflow-hidden">
                              <div
                                className="bg-blue-600 h-full rounded-full"
                                style={{ width: `${agent.replyRate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${rating.class}`}>
                            {rating.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Overall Performance Chart (Custom SVG Graphic) */}
          <div className="crm-panel bg-white p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-bold uppercase text-slate-700">Outbound Volume vs. Conversion Efficiency</h3>
              </div>
              <div className="flex items-center gap-4 text-[10px]">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-sm" />
                  <span className="text-slate-500 font-bold">Emails Sent</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" />
                  <span className="text-slate-500 font-bold">Open Rate (%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-indigo-500 rounded-sm" />
                  <span className="text-slate-500 font-bold">Reply Rate (%)</span>
                </div>
              </div>
            </div>

            {/* Custom Bar Comparison Graphic */}
            <div className="space-y-6">
              {bdrAgents.map((agent) => {
                const maxSent = Math.max(...bdrAgents.map(a => a.emailsSent), 50);
                const sentWidth = (agent.emailsSent / maxSent) * 100;

                return (
                  <div key={agent.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{agent.name}</span>
                      <span className="text-[10px] text-gray-500 font-semibold font-mono">
                        Sent: <span className="text-slate-800 font-bold">{agent.emailsSent}</span> | Open: <span className="text-emerald-600 font-bold">{agent.openRate}%</span> | Reply: <span className="text-indigo-600 font-bold">{agent.replyRate}%</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-12 items-center gap-3">
                      {/* Outbox Volume Bar (Takes 6 cols) */}
                      <div className="col-span-6 bg-gray-105 h-3 rounded-sm relative overflow-hidden border">
                        <div
                          className="bg-blue-500 h-full rounded-sm transition-all duration-500 ease-out hover:bg-blue-600"
                          style={{ width: `${sentWidth}%` }}
                        />
                      </div>
                      {/* Open Rate Bar (Takes 3 cols) */}
                      <div className="col-span-3 bg-gray-105 h-3 rounded-sm relative overflow-hidden border">
                        <div
                          className="bg-emerald-500 h-full rounded-sm transition-all duration-500 ease-out hover:bg-emerald-600"
                          style={{ width: `${agent.openRate}%` }}
                        />
                      </div>
                      {/* Reply Rate Bar (Takes 3 cols) */}
                      <div className="col-span-3 bg-gray-105 h-3 rounded-sm relative overflow-hidden border">
                        <div
                          className="bg-indigo-500 h-full rounded-sm transition-all duration-500 ease-out hover:bg-indigo-600"
                          style={{ width: `${agent.replyRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between text-[10px] text-slate-400">
              <p>Ranks are weighted based on volume (50% weight) and reply rate (50% weight).</p>
              <p className="font-bold text-slate-500">Veltrix Engine v1.1</p>
            </div>

          </div>

        </div>

        {/* Right Column (1/3) - Selected BDR Detailed Drilldown */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Detailed BDR Drilldown */}
          <div className="crm-panel bg-white">
            
            {/* Header with BDR identity */}
            <div className="crm-panel-header">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {selectedAgent.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">{selectedAgent.name}</h3>
                  <span className="inline-flex items-center gap-1 text-[9px] uppercase font-bold text-gray-400">
                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusBadgeClass(selectedAgent.status)}`} />
                    {selectedAgent.status} session
                  </span>
                </div>
              </div>
            </div>

            {/* Performance Content */}
            <div className="p-6 space-y-6">
              
              {/* Target Tracker Goal progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-slate-400" />
                    Daily Outbox Progress
                  </span>
                  <span className="font-mono text-slate-800">
                    <span className="font-bold">{sentCount}</span> / 50 sent
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-150 h-3 border rounded overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded transition-all duration-500 ease-out"
                    style={{ width: `${Math.min((sentCount / 50) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                  <span>Start (0)</span>
                  <span>Target (50)</span>
                </div>
              </div>

              {/* Conversion Funnel Analysis */}
              <div className="space-y-4 border-t border-gray-150 pt-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Conversion Funnel</h4>
                
                {/* Funnel visual layout */}
                <div className="space-y-3 pt-2">
                  
                  {/* Funnel Stage 1: Sent */}
                  <div className="relative">
                    <div className="bg-slate-900 border border-slate-950 text-white rounded p-3 flex justify-between items-center text-xs font-mono relative z-10">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold border border-slate-700">1</span>
                        <span className="font-bold font-sans text-slate-300">Outbox Sent</span>
                      </div>
                      <span className="font-bold">{sentCount} leads</span>
                    </div>
                    {/* Funnel Slope Connector */}
                    <div className="h-4 w-[90%] mx-auto bg-slate-850/20 border-l border-r border-slate-300/40 relative -my-[1px]"></div>
                  </div>

                  {/* Funnel Stage 2: Opened */}
                  <div className="relative">
                    <div className="bg-emerald-700 border border-emerald-850 text-white rounded p-3 flex justify-between items-center text-xs font-mono relative z-10 w-[92%] mx-auto shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-800 flex items-center justify-center text-[10px] font-bold border border-emerald-600">2</span>
                        <span className="font-bold font-sans text-emerald-100">Opened</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold block">{openedCount} opened</span>
                        <span className="text-[9px] text-emerald-200 uppercase font-sans font-bold">{selectedAgent.openRate}% rate</span>
                      </div>
                    </div>
                    {/* Funnel Slope Connector */}
                    <div className="h-4 w-[76%] mx-auto bg-emerald-700/10 border-l border-r border-emerald-300/20 relative -my-[1px]"></div>
                  </div>

                  {/* Funnel Stage 3: Replied */}
                  <div className="relative">
                    <div className="bg-indigo-700 border border-indigo-850 text-white rounded p-3 flex justify-between items-center text-xs font-mono relative z-10 w-[78%] mx-auto shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-800 flex items-center justify-center text-[10px] font-bold border border-indigo-600">3</span>
                        <span className="font-bold font-sans text-indigo-100">Warm Replies</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold block">{repliedCount} replies</span>
                        <span className="text-[9px] text-indigo-200 uppercase font-sans font-bold">{selectedAgent.replyRate}% rate</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Recent Activity Log Feed */}
              <div className="space-y-3 border-t border-gray-150 pt-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Rep Activity Logs</h4>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {selectedAgentTimeline.map((item) => (
                    <div key={item.id} className="p-2.5 rounded border border-gray-200 bg-gray-50 text-[10px] leading-relaxed">
                      <div className="flex justify-between items-center text-gray-400 font-bold mb-1">
                        <span className="font-mono text-[9px]">{item.time}</span>
                        <span className="uppercase text-[8px] tracking-wider text-slate-500">Socket</span>
                      </div>
                      <p className="text-slate-800 font-semibold">{item.action}</p>
                      <p className="text-slate-400 mt-0.5 truncate font-mono">Target: {item.recipient}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
            
            {/* Footer console hints */}
            <div className="p-4 border-t border-gray-150 bg-gray-50 rounded-b text-[10px] text-gray-500 leading-normal flex items-start gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
              <span>
                Simulate status updates using BDR cards in the <strong>Operations Command Center</strong> tab.
              </span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
