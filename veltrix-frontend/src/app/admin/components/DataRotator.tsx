'use client';

import { useVeltrixStore } from '@/lib/store';
import { Layers, UserPlus, Database, Share2 } from 'lucide-react';
import React, { useState } from 'react';

export default function DataRotator() {
  const { dataPools, bdrAgents, batches, allocateBatch } = useVeltrixStore();

  const [selectedPoolId, setSelectedPoolId] = useState(dataPools[0]?.id || '');
  const [selectedBdrId, setSelectedBdrId] = useState(bdrAgents[0]?.id || '');
  const [leadCount, setLeadCount] = useState<number>(100);

  const activePool = dataPools.find(p => p.id === selectedPoolId);

  const handleAllocate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoolId || !selectedBdrId || leadCount <= 0) return;
    allocateBatch(selectedPoolId, selectedBdrId, leadCount);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* 1. Master Pools Grid Panel (lg:col-span-2) */}
      <div className="lg:col-span-2 crm-panel bg-white flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="crm-panel-header flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-bold text-slate-700">Master Data Pools</h2>
          </div>

          <div className="p-6 space-y-4">
            {dataPools.map((pool) => {
              const allocatedPercent = Math.round((pool.allocatedLeads / pool.totalLeads) * 100);
              return (
                <div
                  key={pool.id}
                  className="bg-gray-50 border border-gray-200 rounded p-4 transition-colors"
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-bold text-xs text-slate-800">{pool.name}</span>
                    <span className="text-[10px] text-gray-500 font-semibold font-mono">
                      {pool.unallocatedLeads} remaining
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-500 mb-2">
                    <div>
                      <p className="font-bold uppercase text-[9px] text-gray-400">Total Leads</p>
                      <p className="font-semibold text-slate-700">{pool.totalLeads}</p>
                    </div>
                    <div>
                      <p className="font-bold uppercase text-[9px] text-gray-400">Allocated</p>
                      <p className="font-semibold text-slate-700">{pool.allocatedLeads}</p>
                    </div>
                    <div>
                      <p className="font-bold uppercase text-[9px] text-gray-400">Unallocated</p>
                      <p className="font-semibold text-blue-600">{pool.unallocatedLeads}</p>
                    </div>
                  </div>

                  {/* Allocation Visual Bar */}
                  <div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden border border-gray-300">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{ width: `${allocatedPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-450 mt-1 font-semibold">
                      <span>Allocated: {allocatedPercent}%</span>
                      <span>Unallocated: {100 - allocatedPercent}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* History Active Batches */}
        <div className="p-6 pt-0 border-t border-gray-150 mt-4">
          <div className="flex items-center gap-2 mb-3 pt-4">
            <Share2 className="w-4 h-4 text-blue-500" />
            <h3 className="text-xs font-bold text-slate-700">Active Batch Rotator Log</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 uppercase font-mono text-[9px] font-bold">
                  <th className="py-2">Batch Name</th>
                  <th className="py-2">Target BDR</th>
                  <th className="py-2">Pool Origin</th>
                  <th className="py-2 text-right">Count</th>
                  <th className="py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr key={batch.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="py-2 font-bold text-slate-800">{batch.name}</td>
                    <td className="py-2 text-slate-655">{batch.bdrName}</td>
                    <td className="py-2 text-slate-500 truncate max-w-[120px]">{batch.poolName}</td>
                    <td className="py-2 text-right font-mono text-slate-750 font-semibold">{batch.leadCount}</td>
                    <td className="py-2 text-right">
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          batch.status === 'completed'
                            ? 'bg-gray-100 border border-gray-200 text-gray-500'
                            : 'bg-blue-50 border border-blue-200 text-blue-700'
                        }`}
                      >
                        {batch.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. Batch Allocation Controller Card (lg:col-span-1) */}
      <div className="lg:col-span-1 crm-panel bg-white">
        {/* Header */}
        <div className="crm-panel-header flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-500" />
          <h2 className="text-sm font-bold text-slate-700">Batch Allocations</h2>
        </div>

        <div className="p-6">
          <form onSubmit={handleAllocate} className="space-y-4">
            {/* Pool Select */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Select Source Pool</label>
              <select
                value={selectedPoolId}
                onChange={(e) => setSelectedPoolId(e.target.value)}
                className="w-full crm-input cursor-pointer"
              >
                {dataPools.map((pool) => (
                  <option key={pool.id} value={pool.id}>
                    {pool.name} ({pool.unallocatedLeads} left)
                  </option>
                ))}
              </select>
            </div>

            {/* BDR Select */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Select Target Rep</label>
              <select
                value={selectedBdrId}
                onChange={(e) => setSelectedBdrId(e.target.value)}
                className="w-full crm-input cursor-pointer"
              >
                {bdrAgents.map((bdr) => (
                  <option key={bdr.id} value={bdr.id}>
                    {bdr.name} ({bdr.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Leads Count input */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Lead Allocations Count</label>
              <input
                type="number"
                min={1}
                max={activePool ? activePool.unallocatedLeads : 9999}
                value={leadCount}
                onChange={(e) => setLeadCount(parseInt(e.target.value) || 0)}
                className="w-full crm-input"
                placeholder="Leads count"
              />
              {activePool && (
                <p className="text-[10px] text-gray-400 mt-1">
                  Max available: {activePool.unallocatedLeads} leads
                </p>
              )}
            </div>

            {/* Action Trigger */}
            <button
              type="submit"
              disabled={!activePool || activePool.unallocatedLeads < leadCount || leadCount <= 0}
              className="w-full py-2 crm-btn-primary flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Allocate & Sync Batch
            </button>
          </form>

          {/* Small warning for full pools */}
          {activePool && activePool.unallocatedLeads === 0 && (
            <div className="mt-4 p-3 rounded bg-red-50 border border-red-200 text-red-750 text-[10px] leading-relaxed">
              The selected pool has no unallocated leads left. Please select another source pool.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
