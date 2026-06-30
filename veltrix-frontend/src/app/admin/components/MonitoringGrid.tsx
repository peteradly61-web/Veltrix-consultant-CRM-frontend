'use client';

import { useVeltrixStore } from '@/lib/store';
import { Clock, Mail, BarChart3, Radio } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export default function MonitoringGrid() {
  const { bdrAgents, updateAgentStatus } = useVeltrixStore();
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const getMinutesSinceActive = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const getStatusConfig = (minutes: number) => {
    if (minutes >= 90) {
      return {
        label: 'Inactive (90m+)',
        colorClass: 'text-red-700 bg-red-50 border-red-200',
        dotClass: 'bg-red-500 animate-pulse'
      };
    }
    if (minutes >= 45) {
      return {
        label: 'Idle (45m+)',
        colorClass: 'text-amber-700 bg-amber-50 border-amber-200',
        dotClass: 'bg-amber-500 animate-pulse'
      };
    }
    return {
      label: 'Active (<15m)',
      colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      dotClass: 'bg-emerald-500'
    };
  };

  return (
    <div className="crm-panel bg-white">
      {/* Grid Header */}
      <div className="crm-panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-blue-500 animate-pulse" />
          <h2 className="text-sm font-bold text-slate-700">BDR Session Monitoring</h2>
        </div>
        <span className="text-xs text-gray-400">Live Agent Feeds</span>
      </div>

      {/* Grid Body */}
      <div className="p-6">
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {bdrAgents.map((agent) => {
            const minutes = getMinutesSinceActive(agent.lastActiveTime);
            const status = getStatusConfig(minutes);

            return (
              <div
                key={agent.id}
                className="bg-white border border-gray-250 rounded p-4 flex flex-col justify-between hover:border-gray-300 transition-colors"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{agent.name}</h3>
                      <p className="text-[10px] text-gray-400 font-mono">ID: {agent.id}</p>
                    </div>
                    {/* Status indicator tag */}
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${status.colorClass}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
                      {status.label}
                    </span>
                  </div>

                  {/* Relative active timer */}
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>
                      Active:{' '}
                      <span className="font-semibold text-slate-700">
                        {minutes === 0 ? 'Just now' : `${minutes}m ago`}
                      </span>
                    </span>
                  </div>

                  {/* Performance stats */}
                  <div className="space-y-2.5 mb-4">
                    {/* Emails sent */}
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-gray-400" /> Emails Sent
                      </span>
                      <span className="font-bold text-slate-800">{agent.emailsSent}</span>
                    </div>

                    {/* Open Rate */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-0.5">
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-3.5 h-3.5 text-gray-400" /> Open Rate
                        </span>
                        <span className="font-bold text-emerald-600">{agent.openRate}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${agent.openRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Reply Rate */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-0.5">
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-3.5 h-3.5 text-gray-400" /> Reply Rate
                        </span>
                        <span className="font-bold text-blue-600">{agent.replyRate}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full"
                          style={{ width: `${agent.replyRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulation tests */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Simulate:</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => updateAgentStatus(agent.id, 'active', 2)}
                      className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 transition-colors"
                      title="Active (Green)"
                    >
                      Active
                    </button>
                    <button
                      onClick={() => updateAgentStatus(agent.id, 'idle', 48)}
                      className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 transition-colors"
                      title="Idle (Yellow)"
                    >
                      Idle
                    </button>
                    <button
                      onClick={() => updateAgentStatus(agent.id, 'away', 95)}
                      className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 transition-colors"
                      title="Away (Red)"
                    >
                      Away
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
