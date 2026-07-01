'use client';

import React, { useState } from 'react';
import { useVeltrixStore } from '@/lib/store';
import { Lead } from '@/types';
import { 
  Search, 
  Star, 
  CalendarPlus, 
  MessageSquare, 
  Clock, 
  Database, 
  Check, 
  X, 
  Plus, 
  Filter, 
  Mail, 
  Phone,
  Bookmark
} from 'lucide-react';

interface LeadsExcelTableProps {
  mode: 'leads' | 'opportunities';
}

export default function LeadsExcelTable({ mode }: LeadsExcelTableProps) {
  const { 
    leads, 
    updateLeadStatus, 
    updateLeadComment, 
    toggleSaveLeadToOpportunities,
    addMeeting,
    rotateLeadsData
  } = useVeltrixStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Inline comment state for tracker/feedback
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [tempCommentText, setTempCommentText] = useState('');
  const [savedFeedbackId, setSavedFeedbackId] = useState<string | null>(null);

  // Book Meeting modal state
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [selectedLeadForMeeting, setSelectedLeadForMeeting] = useState<Lead | null>(null);
  const [meetingForm, setMeetingForm] = useState({
    title: 'Intro Discovery Call',
    date: '',
    time: '10:00',
    notes: ''
  });

  // Filter & Sort leads
  const processedLeads = leads
    // Filter by mode
    .filter(lead => mode === 'leads' ? true : lead.savedToOpportunities)
    // Filter by search query
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
    // Filter by status dropdown
    .filter(lead => statusFilter === 'all' || lead.status === statusFilter)
    // Sort from newest (most recent createdAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Inline Comment Save Handler
  const handleCommentBlur = (leadId: string) => {
    updateLeadComment(leadId, tempCommentText);
    setEditingCommentId(null);
    setSavedFeedbackId(leadId);
    setTimeout(() => {
      setSavedFeedbackId(null);
    }, 1500);
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent, leadId: string) => {
    if (e.key === 'Enter') {
      updateLeadComment(leadId, tempCommentText);
      setEditingCommentId(null);
      setSavedFeedbackId(leadId);
      setTimeout(() => {
        setSavedFeedbackId(null);
      }, 1500);
    } else if (e.key === 'Escape') {
      setEditingCommentId(null);
    }
  };

  // Open Book Meeting Modal
  const openMeetingModal = (lead: Lead) => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedLeadForMeeting(lead);
    setMeetingForm({
      title: 'Intro Discovery Call',
      date: today,
      time: '10:00',
      notes: `Initial conversation with ${lead.firstName} about Veltrix CRM options.`
    });
    setIsMeetingModalOpen(true);
  };

  // Submit booked meeting
  const handleBookMeetingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForMeeting || !meetingForm.date || !meetingForm.time) return;

    addMeeting({
      leadName: `${selectedLeadForMeeting.firstName} ${selectedLeadForMeeting.lastName}`,
      company: selectedLeadForMeeting.company,
      title: meetingForm.title,
      date: meetingForm.date,
      time: meetingForm.time,
      notes: meetingForm.notes
    });

    // Auto-update lead status to contacted on booking a meeting
    updateLeadStatus(selectedLeadForMeeting.id, 'contacted');

    setIsMeetingModalOpen(false);
    setSelectedLeadForMeeting(null);
  };

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
    <div className="crm-panel bg-white shadow-sm border border-gray-300 rounded overflow-hidden">
      
      {/* Table Header and Workspace actions */}
      <div className="border-b border-gray-300 px-6 py-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Title */}
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full border shrink-0 ${
            mode === 'leads' ? 'bg-blue-550 border-blue-600' : 'bg-amber-550 border-amber-600'
          }`} />
          <h2 className="text-sm font-extrabold text-slate-800 tracking-tight capitalize">
            {mode === 'leads' ? 'Active Outbound Leads Sheet' : 'Preserved Opportunities List'}
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold font-mono">
            {processedLeads.length} Records
          </span>
        </div>

        {/* Filter and Ingest actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Search className="w-3.5 h-3.5 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Quick Excel filter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 w-48 text-[11px] rounded border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-700 placeholder-gray-400 transition-all font-semibold"
            />
          </div>

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

          {/* Scraper Rotation simulation button (only in leads mode) */}
          {mode === 'leads' && (
            <button
              onClick={rotateLeadsData}
              className="crm-btn flex items-center gap-1.5 py-1.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded text-[11px] font-bold shadow hover:from-blue-700 hover:to-indigo-700 transition-all"
              title="Simulates receiving fresh scraper data. Pinned opportunities remain; unsaved ones vanish."
            >
              <Database className="w-3.5 h-3.5" />
              <span>Simulate Lead Rotation</span>
            </button>
          )}
        </div>

      </div>

      {/* Leads Excel Sheet Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
          <thead>
            <tr className="bg-slate-50 border-b border-gray-300 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              <th className="w-36 px-4 py-2.5 text-center">Opp Status</th>
              <th className="w-48 px-4 py-2.5">Company</th>
              <th className="w-56 px-4 py-2.5">Contact Person</th>
              <th className="w-52 px-4 py-2.5">Email & Phone</th>
              <th className="w-32 px-4 py-2.5">Status</th>
              <th className="w-64 px-4 py-2.5">Internal Comment</th>
              <th className="w-36 px-4 py-2.5 text-center">Created At</th>
              <th className="w-24 px-4 py-2.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-xs text-slate-700 bg-white">
            {processedLeads.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center text-gray-400 font-bold bg-slate-25/30">
                  {mode === 'leads' 
                    ? "No leads match the query. Click 'Simulate Lead Rotation' above to load mock scraper items!"
                    : "No saved opportunities. Click the star icon on any lead in the Leads Sheet to save it!"
                  }
                </td>
              </tr>
            ) : (
              processedLeads.map((lead) => {
                let statusColor = 'bg-slate-100 text-slate-700 border-slate-350';
                if (lead.status === 'contacted') statusColor = 'bg-emerald-50 text-emerald-800 border-emerald-300';
                if (lead.status === 'skipped') statusColor = 'bg-amber-50 text-amber-800 border-amber-300';
                if (lead.status === 'disqualified') statusColor = 'bg-rose-50 text-rose-800 border-rose-300';

                return (
                  <tr
                    key={lead.id}
                    className={`hover:bg-slate-50/50 transition-colors border-b border-gray-150 ${
                      lead.savedToOpportunities ? 'bg-amber-50/10' : ''
                    }`}
                  >
                    {/* Pin/Save to Opportunities Column */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleSaveLeadToOpportunities(lead.id)}
                        className={`w-full py-1.5 px-2 rounded text-[10px] font-extrabold uppercase border flex items-center justify-center gap-1 transition-all shadow-sm ${
                          lead.savedToOpportunities 
                            ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800' 
                            : 'bg-white hover:bg-slate-50 border-gray-300 text-slate-650'
                        }`}
                        title={lead.savedToOpportunities ? "Saved in Opportunities" : "Transfer to Opportunities"}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${lead.savedToOpportunities ? 'fill-current text-amber-500' : 'text-slate-400'}`} />
                        <span>{lead.savedToOpportunities ? 'Preserved' : 'Move to Opp'}</span>
                      </button>
                    </td>

                    {/* Company Column */}
                    <td className="px-4 py-3 font-bold text-slate-800 truncate">
                      {lead.company}
                    </td>

                    {/* Contact Person Column */}
                    <td className="px-4 py-3 truncate">
                      <div className="font-semibold text-slate-800">
                        {lead.firstName} {lead.lastName}
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium">
                        {lead.title} • <span className="italic">{lead.industry}</span>
                      </div>
                    </td>

                    {/* Email & Phone Column */}
                    <td className="px-4 py-3 font-mono text-[10.5px] text-slate-600 truncate">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{lead.email}</span>
                      </div>
                      {lead.phone && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-slate-500">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                    </td>

                    {/* Status Selection Dropdown Column */}
                    <td className="px-4 py-3">
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

                    {/* Internal Comment Input Column */}
                    <td className="px-4 py-3 relative">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          defaultValue={lead.comment || ''}
                          onBlur={(e) => {
                            updateLeadComment(lead.id, e.target.value);
                            setSavedFeedbackId(lead.id);
                            setTimeout(() => setSavedFeedbackId(null), 1500);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          placeholder="Add comment..."
                          className="w-full px-2.5 py-1 border border-gray-250 hover:border-gray-350 focus:border-blue-500 rounded text-xs text-slate-800 bg-slate-50/50 hover:bg-white focus:bg-white transition-all focus:outline-none font-medium"
                        />
                      </div>
                      
                      {/* Checkmark notification for saved edits */}
                      {savedFeedbackId === lead.id && (
                        <span className="absolute right-6 top-1 text-[9px] text-emerald-650 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-250 flex items-center gap-0.5 animate-fade-in z-10 font-bold">
                          <Check className="w-2.5 h-2.5" /> Saved
                        </span>
                      )}
                    </td>

                    {/* Created At Column */}
                    <td className="px-4 py-3 text-center text-[10.5px] text-slate-400 font-semibold font-mono">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3 opacity-50" />
                        <span>{formatDate(lead.createdAt)}</span>
                      </div>
                    </td>

                    {/* Action Column */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => openMeetingModal(lead)}
                        className="p-1 px-2.5 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 hover:text-blue-800 text-[10px] font-extrabold flex items-center justify-center gap-1 transition-all mx-auto shadow-sm"
                        title="Book Meeting with Client"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                        <span>Book</span>
                      </button>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Book Meeting Modal */}
      {isMeetingModalOpen && selectedLeadForMeeting && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-300 rounded shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800">
                <CalendarPlus className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-extrabold uppercase tracking-wide">Book Client Meeting</h3>
              </div>
              <button
                onClick={() => {
                  setIsMeetingModalOpen(false);
                  setSelectedLeadForMeeting(null);
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleBookMeetingSubmit} className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-850">
                <span className="font-extrabold">Client Account:</span> {selectedLeadForMeeting.company} <br />
                <span className="font-extrabold">Contact:</span> {selectedLeadForMeeting.firstName} {selectedLeadForMeeting.lastName} ({selectedLeadForMeeting.title})
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Meeting Title / Topic</label>
                <input
                  required
                  type="text"
                  value={meetingForm.title}
                  onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Date</label>
                  <input
                    required
                    type="date"
                    value={meetingForm.date}
                    onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Time</label>
                  <input
                    required
                    type="time"
                    value={meetingForm.time}
                    onChange={(e) => setMeetingForm({ ...meetingForm, time: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Meeting Notes / Agenda</label>
                <textarea
                  value={meetingForm.notes}
                  onChange={(e) => setMeetingForm({ ...meetingForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-medium"
                  placeholder="Goals, target questions..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => {
                    setIsMeetingModalOpen(false);
                    setSelectedLeadForMeeting(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded text-xs font-bold text-slate-650 hover:bg-slate-50 bg-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-sm transition-colors"
                >
                  Confirm Meeting Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
