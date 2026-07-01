'use client';

import React, { useState } from 'react';
import { useVeltrixStore } from '@/lib/store';
import { 
  CalendarRange, 
  Search, 
  Clock, 
  FileText, 
  User, 
  Building2,
  Sparkles,
  Bookmark
} from 'lucide-react';

export default function AdminMeetings() {
  const { meetings } = useVeltrixStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [bdrFilter, setBdrFilter] = useState<string>('all');

  // Extract all unique BDR names who booked meetings
  const bdrNames = Array.from(
    new Set(meetings.map(m => m.bookedBy || 'Alex Rivera'))
  );

  // BDR style map helper
  const getBdrStyles = (name?: string) => {
    const normalized = name ? name.toLowerCase() : '';
    if (normalized.includes('alex')) return { bg: 'bg-emerald-50 text-emerald-800 border-emerald-250', dot: 'bg-emerald-500' };
    if (normalized.includes('jordan')) return { bg: 'bg-indigo-50 text-indigo-800 border-indigo-250', dot: 'bg-indigo-500' };
    if (normalized.includes('elena')) return { bg: 'bg-purple-50 text-purple-800 border-purple-250', dot: 'bg-purple-500' };
    if (normalized.includes('marcus')) return { bg: 'bg-amber-50 text-amber-800 border-amber-250', dot: 'bg-amber-500' };
    if (normalized.includes('sarah')) return { bg: 'bg-rose-50 text-rose-800 border-rose-250', dot: 'bg-rose-500' };
    return { bg: 'bg-slate-50 text-slate-800 border-slate-250', dot: 'bg-slate-500' };
  };

  // Filter meetings list
  const filteredMeetings = meetings
    .filter(meet => {
      const query = searchQuery.toLowerCase();
      return (
        meet.company.toLowerCase().includes(query) ||
        meet.leadName.toLowerCase().includes(query) ||
        meet.title.toLowerCase().includes(query) ||
        (meet.notes && meet.notes.toLowerCase().includes(query))
      );
    })
    .filter(meet => {
      if (bdrFilter === 'all') return true;
      const owner = meet.bookedBy || 'Alex Rivera';
      return owner === bdrFilter;
    })
    .sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime());

  return (
    <div className="space-y-6">
      
      {/* Overview Header */}
      <div className="flex items-center justify-between border-b border-gray-250 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-blue-600" />
            <span>Booked Meetings Hub</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Consolidated log of meetings booked by BDRs for outbound discovery.</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500 bg-white border border-gray-300 rounded-md px-3 py-1.5 font-bold shadow-sm">
          <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span>Meetings Booked: </span>
          <span className="text-slate-800 font-extrabold ml-1">{meetings.length} Total</span>
        </div>
      </div>

      {/* Main Panel */}
      <div className="crm-panel bg-white shadow-sm border border-gray-300 rounded overflow-hidden">
        
        {/* Controls Header */}
        <div className="border-b border-gray-300 px-6 py-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase text-slate-700">Team Booked Meetings</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold font-mono">
              {filteredMeetings.length} Scheduled
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <Search className="w-3.5 h-3.5 text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Search meetings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 w-48 text-[11px] rounded border border-gray-300 focus:outline-none focus:border-blue-500 bg-white text-slate-700 placeholder-gray-400 font-semibold"
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
          </div>
        </div>

        {/* Meetings Table Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[850px]">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-300 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="w-48 px-6 py-2.5">Company</th>
                <th className="w-44 px-6 py-2.5">Booked By (BDR)</th>
                <th className="w-48 px-6 py-2.5">Client Representative</th>
                <th className="w-48 px-6 py-2.5">Meeting Topic</th>
                <th className="w-32 px-6 py-2.5 text-center">Scheduled Date</th>
                <th className="w-24 px-6 py-2.5 text-center">Time (EST)</th>
                <th className="px-6 py-2.5">Agenda / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-xs text-slate-700 bg-white">
              {filteredMeetings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-gray-400 font-bold bg-slate-25/30">
                    No scheduled meetings logged matching criteria.
                  </td>
                </tr>
              ) : (
                filteredMeetings.map((meet) => {
                  const bookedBy = meet.bookedBy || 'Alex Rivera';
                  const bdrStyles = getBdrStyles(bookedBy);

                  return (
                    <tr key={meet.id} className="hover:bg-slate-50/50 transition-colors border-b border-gray-150">
                      
                      {/* Company */}
                      <td className="px-6 py-3.5 font-bold text-slate-800 truncate">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{meet.company}</span>
                        </div>
                      </td>

                      {/* Booked By */}
                      <td className="px-6 py-3.5 font-bold truncate">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] border flex items-center gap-1.5 w-max font-extrabold ${bdrStyles.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${bdrStyles.dot}`} />
                          <span>{bookedBy}</span>
                        </span>
                      </td>

                      {/* Client Representative */}
                      <td className="px-6 py-3.5 font-semibold text-slate-750 truncate">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{meet.leadName}</span>
                        </div>
                      </td>

                      {/* Topic */}
                      <td className="px-6 py-3.5 text-slate-800 font-semibold truncate">
                        {meet.title}
                      </td>

                      {/* Scheduled Date */}
                      <td className="px-6 py-3.5 text-center font-bold text-blue-700">
                        {meet.date}
                      </td>

                      {/* Scheduled Time */}
                      <td className="px-6 py-3.5 text-center font-mono font-bold text-slate-650">
                        {meet.time}
                      </td>

                      {/* Agenda Notes */}
                      <td className="px-6 py-3.5 text-slate-500 italic truncate" title={meet.notes}>
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3 h-3 text-slate-350 shrink-0" />
                          <span className="truncate">{meet.notes || 'No agenda notes.'}</span>
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
