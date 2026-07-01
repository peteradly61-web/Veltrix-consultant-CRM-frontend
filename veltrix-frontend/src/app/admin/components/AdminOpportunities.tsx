'use client';

import React, { useState } from 'react';
import { useVeltrixStore } from '@/lib/store';
import { Lead } from '@/types';
import { 
  Search, 
  Layers, 
  Mail, 
  Phone, 
  Clock, 
  User, 
  Building2, 
  Bookmark,
  Sparkles
} from 'lucide-react';

export default function AdminOpportunities() {
  const { leads, updateLeadStatus, updateLeadComment } = useVeltrixStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [bdrFilter, setBdrFilter] = useState<string>('all');

  // Filter leads to get saved opportunities
  const opportunities = leads.filter(l => l.savedToOpportunities);

  // Extract all unique BDR names who saved opportunities
  const bdrNames = Array.from(
    new Set(opportunities.map(l => l.savedBy || 'Alex Rivera'))
  );

  // Helper for BDR color attribution
  const getBdrStyles = (name?: string) => {
    const normalized = name ? name.toLowerCase() : '';
    if (normalized.includes('alex')) return { bg: 'bg-emerald-50 text-emerald-800 border-emerald-250', dot: 'bg-emerald-500' };
    if (normalized.includes('jordan')) return { bg: 'bg-indigo-50 text-indigo-800 border-indigo-250', dot: 'bg-indigo-500' };
    if (normalized.includes('elena')) return { bg: 'bg-purple-50 text-purple-800 border-purple-250', dot: 'bg-purple-500' };
    if (normalized.includes('marcus')) return { bg: 'bg-amber-50 text-amber-800 border-amber-250', dot: 'bg-amber-500' };
    if (normalized.includes('sarah')) return { bg: 'bg-rose-50 text-rose-800 border-rose-250', dot: 'bg-rose-500' };
    return { bg: 'bg-slate-50 text-slate-800 border-slate-250', dot: 'bg-slate-500' };
  };

  // Process and filter opportunities
  const filteredOpp = opportunities
    .filter(lead => {
      const query = searchQuery.toLowerCase();
      return (
        lead.company.toLowerCase().includes(query) ||
        lead.firstName.toLowerCase().includes(query) ||
        lead.lastName.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query) ||
        lead.industry.toLowerCase().includes(query) ||
        (lead.comment && lead.comment.toLowerCase().includes(query))
      );
    })
    .filter(lead => statusFilter === 'all' || lead.status === statusFilter)
    .filter(lead => {
      if (bdrFilter === 'all') return true;
      const owner = lead.savedBy || 'Alex Rivera';
      return owner === bdrFilter;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Formatted date helper
  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Header */}
      <div className="flex items-center justify-between border-b border-gray-250 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>Opportunities Hub</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Centralized list of client opportunities preserved by BDR representatives.</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500 bg-white border border-gray-300 rounded-md px-3 py-1.5 font-bold shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Total Pipeline:</span>
          <span className="text-slate-800 font-extrabold ml-1">{opportunities.length} Saved</span>
        </div>
      </div>

      {/* Table controls */}
      <div className="crm-panel bg-white shadow-sm border border-gray-300 rounded overflow-hidden">
        <div className="border-b border-gray-300 px-6 py-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-amber-500 fill-current" />
            <h3 className="text-xs font-bold uppercase text-slate-700">Team Saved Opportunities</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold font-mono">
              {filteredOpp.length} Results
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <Search className="w-3.5 h-3.5 text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Filter opportunities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 w-44 text-[11px] rounded border border-gray-300 focus:outline-none focus:border-blue-500 bg-white text-slate-700 placeholder-gray-400 font-semibold"
              />
            </div>

            {/* BDR Filter */}
            <select
              value={bdrFilter}
              onChange={(e) => setBdrFilter(e.target.value)}
              className="px-2 py-1.5 text-[11px] font-bold rounded border border-gray-300 bg-white text-slate-600 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All BDRs</option>
              {bdrNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1.5 text-[11px] font-bold rounded border border-gray-300 bg-white text-slate-600 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="skipped">Skipped</option>
              <option value="disqualified">Disqualified</option>
            </select>
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-300 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="w-48 px-6 py-2.5">Company</th>
                <th className="w-48 px-6 py-2.5">BDR Owner</th>
                <th className="w-56 px-6 py-2.5">Contact Person</th>
                <th className="w-52 px-6 py-2.5">Email & Phone</th>
                <th className="w-32 px-6 py-2.5">Status</th>
                <th className="px-6 py-2.5">Internal Comment</th>
                <th className="w-36 px-6 py-2.5 text-center">Saved Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-xs text-slate-700 bg-white">
              {filteredOpp.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-gray-400 font-bold bg-slate-25/30">
                    No matching opportunities found.
                  </td>
                </tr>
              ) : (
                filteredOpp.map((lead) => {
                  const bdrOwner = lead.savedBy || 'Alex Rivera';
                  const bdrStyles = getBdrStyles(bdrOwner);
                  
                  let statusColor = 'bg-slate-100 text-slate-700 border-slate-350';
                  if (lead.status === 'contacted') statusColor = 'bg-emerald-50 text-emerald-800 border-emerald-300';
                  if (lead.status === 'skipped') statusColor = 'bg-amber-50 text-amber-800 border-amber-300';
                  if (lead.status === 'disqualified') statusColor = 'bg-rose-50 text-rose-800 border-rose-300';

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors border-b border-gray-150">
                      
                      {/* Company */}
                      <td className="px-6 py-3.5 font-bold text-slate-800 truncate">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{lead.company}</span>
                        </div>
                      </td>

                      {/* BDR Owner */}
                      <td className="px-6 py-3.5 font-bold truncate">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] border flex items-center gap-1.5 w-max font-extrabold ${bdrStyles.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${bdrStyles.dot}`} />
                          <span>{bdrOwner}</span>
                        </span>
                      </td>

                      {/* Contact Person */}
                      <td className="px-6 py-3.5 truncate">
                        <div className="font-semibold text-slate-800">
                          {lead.firstName} {lead.lastName}
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium truncate">
                          {lead.title} • <span className="italic">{lead.industry}</span>
                        </div>
                      </td>

                      {/* Email & Phone */}
                      <td className="px-6 py-3.5 font-mono text-[10.5px] text-slate-650 truncate">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                        {lead.phone && (
                          <div className="flex items-center gap-1.5 mt-0.5 text-slate-500">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Status Selection */}
                      <td className="px-6 py-3.5">
                        <select
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value as Lead['status'])}
                          className={`px-2 py-1 rounded text-[10px] font-extrabold uppercase border focus:outline-none transition-colors ${statusColor}`}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="skipped">Skipped</option>
                          <option value="disqualified">Disqualified</option>
                        </select>
                      </td>

                      {/* Comment Input */}
                      <td className="px-6 py-3.5">
                        <input
                          type="text"
                          defaultValue={lead.comment || ''}
                          onBlur={(e) => updateLeadComment(lead.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          placeholder="No commentary logged."
                          className="w-full px-2 py-1 border border-gray-200 hover:border-gray-300 focus:border-blue-500 rounded text-xs text-slate-850 bg-slate-50/30 hover:bg-white focus:bg-white transition-all focus:outline-none"
                        />
                      </td>

                      {/* Saved Date */}
                      <td className="px-6 py-3.5 text-center text-[10.5px] text-slate-400 font-semibold font-mono">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="w-3.5 h-3.5 opacity-55" />
                          <span>{formatDate(lead.createdAt)}</span>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
