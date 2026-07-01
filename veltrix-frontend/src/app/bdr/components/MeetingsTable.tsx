'use client';

import React, { useState } from 'react';
import { useVeltrixStore } from '@/lib/store';
import { 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  FileText, 
  User, 
  Building2, 
  X,
  Check
} from 'lucide-react';

export default function MeetingsTable() {
  const { user, meetings, leads, addMeeting } = useVeltrixStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states for manually booking a meeting
  const [newMeetingForm, setNewMeetingForm] = useState({
    leadName: '',
    company: '',
    title: 'Intro Discovery Call',
    date: '',
    time: '10:00',
    notes: ''
  });

  // Filter meetings
  const filteredMeetings = meetings
    .filter(meet => {
      if (user?.role === 'bdr') {
        return meet.bookedBy === user.name;
      }
      return true;
    })
    .filter(meet => {
      const query = searchQuery.toLowerCase();
      return (
        meet.company.toLowerCase().includes(query) ||
        meet.leadName.toLowerCase().includes(query) ||
        meet.title.toLowerCase().includes(query) ||
        (meet.notes && meet.notes.toLowerCase().includes(query))
      );
    });

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetingForm.leadName || !newMeetingForm.company || !newMeetingForm.date || !newMeetingForm.time) return;

    addMeeting({
      leadName: newMeetingForm.leadName,
      company: newMeetingForm.company,
      title: newMeetingForm.title,
      date: newMeetingForm.date,
      time: newMeetingForm.time,
      notes: newMeetingForm.notes
    });

    // Reset Form
    setNewMeetingForm({
      leadName: '',
      company: '',
      title: 'Intro Discovery Call',
      date: '',
      time: '10:00',
      notes: ''
    });
    setIsAddModalOpen(false);
  };

  // Prepopulate form fields if they select an existing lead
  const handleLeadSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) return;

    const lead = leads.find(l => l.id === selectedId);
    if (lead) {
      setNewMeetingForm(prev => ({
        ...prev,
        leadName: `${lead.firstName} ${lead.lastName}`,
        company: lead.company
      }));
    }
  };

  return (
    <div className="crm-panel bg-white shadow-sm border border-gray-300 rounded overflow-hidden">
      
      {/* Title & Actions Bar */}
      <div className="border-b border-gray-300 px-6 py-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Title */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-extrabold text-slate-800 tracking-tight">
            Booked Meetings Log
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold font-mono">
            {filteredMeetings.length} Scheduled
          </span>
        </div>

        {/* Search & Add Action */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Search className="w-3.5 h-3.5 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 w-48 text-[11px] rounded border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-700 placeholder-gray-400 transition-all font-semibold"
            />
          </div>

          {/* Log Meeting Button */}
          <button
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              setNewMeetingForm(prev => ({ ...prev, date: today }));
              setIsAddModalOpen(true);
            }}
            className="crm-btn py-1.5 px-3 flex items-center gap-1 text-[11px] font-bold shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>Book Meeting</span>
          </button>
        </div>

      </div>

      {/* Meetings Excel Table */}
      <div className="overflow-x-auto font-sans">
        <table className="w-full text-left border-collapse table-fixed min-w-[850px]">
          <thead>
            <tr className="bg-slate-50 border-b border-gray-300 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              <th className="w-48 px-6 py-2.5">Company</th>
              <th className="w-48 px-6 py-2.5">Client Representative</th>
              <th className="w-52 px-6 py-2.5">Meeting Topic</th>
              <th className="w-32 px-6 py-2.5 text-center">Scheduled Date</th>
              <th className="w-24 px-6 py-2.5 text-center">Time (EST)</th>
              <th className="px-6 py-2.5">Meeting Notes</th>
              <th className="w-36 px-6 py-2.5 text-center">Logged At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-xs text-slate-700 bg-white">
            {filteredMeetings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-gray-400 font-bold bg-slate-25/30">
                  No meetings have been logged yet. Book one from the Leads Sheet or click 'Book Meeting'!
                </td>
              </tr>
            ) : (
              filteredMeetings.map((meet) => (
                <tr
                  key={meet.id}
                  className="hover:bg-slate-50/50 transition-colors border-b border-gray-150"
                >
                  {/* Company */}
                  <td className="px-6 py-3.5 font-bold text-slate-800 truncate">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{meet.company}</span>
                    </div>
                  </td>

                  {/* Client Name */}
                  <td className="px-6 py-3.5 font-semibold text-slate-750 truncate">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{meet.leadName}</span>
                    </div>
                  </td>

                  {/* Topic */}
                  <td className="px-6 py-3.5 text-slate-800 font-medium truncate">
                    {meet.title}
                  </td>

                  {/* Date */}
                  <td className="px-6 py-3.5 text-center font-semibold text-blue-700">
                    {meet.date}
                  </td>

                  {/* Time */}
                  <td className="px-6 py-3.5 text-center font-mono font-bold text-slate-600">
                    {meet.time}
                  </td>

                  {/* Notes */}
                  <td className="px-6 py-3.5 text-slate-500 italic truncate" title={meet.notes}>
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-slate-350 shrink-0" />
                      <span className="truncate">{meet.notes || 'No agenda notes.'}</span>
                    </div>
                  </td>

                  {/* Created At */}
                  <td className="px-6 py-3.5 text-center text-[10px] text-slate-400 font-medium font-mono">
                    {new Date(meet.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Book Meeting Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-300 rounded shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-extrabold uppercase tracking-wide">Schedule New Meeting</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Optional Link to Lead selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Pre-fill From Outbound Leads</label>
                <select
                  onChange={handleLeadSelectChange}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-650 bg-white font-semibold"
                >
                  <option value="">-- Or enter details manually below --</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.company} ({l.firstName} {l.lastName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Company Name</label>
                  <input
                    required
                    type="text"
                    value={newMeetingForm.company}
                    onChange={(e) => setNewMeetingForm({ ...newMeetingForm, company: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-medium"
                    placeholder="e.g. Acme Corp"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Client Representative</label>
                  <input
                    required
                    type="text"
                    value={newMeetingForm.leadName}
                    onChange={(e) => setNewMeetingForm({ ...newMeetingForm, leadName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-medium"
                    placeholder="e.g. Jane Doe"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Meeting Topic / Title</label>
                <input
                  required
                  type="text"
                  value={newMeetingForm.title}
                  onChange={(e) => setNewMeetingForm({ ...newMeetingForm, title: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Date</label>
                  <input
                    required
                    type="date"
                    value={newMeetingForm.date}
                    onChange={(e) => setNewMeetingForm({ ...newMeetingForm, date: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Time</label>
                  <input
                    required
                    type="time"
                    value={newMeetingForm.time}
                    onChange={(e) => setNewMeetingForm({ ...newMeetingForm, time: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Meeting Notes / Agenda</label>
                <textarea
                  value={newMeetingForm.notes}
                  onChange={(e) => setNewMeetingForm({ ...newMeetingForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-medium"
                  placeholder="Goals, target questions..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-xs font-bold text-slate-650 hover:bg-slate-50 bg-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-sm transition-colors"
                >
                  Log Scheduled Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
