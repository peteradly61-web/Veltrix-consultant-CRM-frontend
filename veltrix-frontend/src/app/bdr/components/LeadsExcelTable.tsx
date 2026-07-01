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
  Bookmark,
  Pencil,
  Send,
  Info,
  FileText
} from 'lucide-react';

interface LeadsExcelTableProps {
  mode: 'leads' | 'opportunities';
}

export default function LeadsExcelTable({ mode }: LeadsExcelTableProps) {
  const { 
    user,
    leads, 
    updateLead,
    sendLeadEmailStandalone,
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

  // Edit Client Details modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<Lead | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    industry: '',
    status: 'new' as Lead['status'],
    comment: ''
  });

  const openEditModal = (lead: Lead) => {
    setSelectedLeadForEdit(lead);
    setEditForm({
      firstName: lead.firstName || '',
      lastName: lead.lastName || '',
      email: lead.email || '',
      phone: lead.phone || '',
      company: lead.company || '',
      title: lead.title || '',
      industry: lead.industry || '',
      status: lead.status || 'new',
      comment: lead.comment || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForEdit) return;
    
    updateLead(selectedLeadForEdit.id, {
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      email: editForm.email,
      phone: editForm.phone,
      company: editForm.company,
      title: editForm.title,
      industry: editForm.industry,
      comment: editForm.comment
    });

    if (editForm.status !== selectedLeadForEdit.status) {
      updateLeadStatus(selectedLeadForEdit.id, editForm.status);
    }

    setIsEditModalOpen(false);
    setSelectedLeadForEdit(null);
  };

  // Direct Email modal state
  const { templates } = useVeltrixStore();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedLeadForEmail, setSelectedLeadForEmail] = useState<Lead | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('temp-1');

  const replaceVariablesLocal = (text: string, lead: Lead) => {
    return text
      .replace(/{first_name}/g, lead.firstName)
      .replace(/{last_name}/g, lead.lastName)
      .replace(/{company_name}/g, lead.company)
      .replace(/{title}/g, lead.title)
      .replace(/{industry}/g, lead.industry)
      .replace(/{email}/g, lead.email);
  };

  const openEmailModal = (lead: Lead) => {
    setSelectedLeadForEmail(lead);
    const defaultTemplate = templates.find(t => t.id === 'temp-1') || templates[0];
    if (defaultTemplate) {
      setSelectedTemplateId(defaultTemplate.id);
      setEmailSubject(replaceVariablesLocal(defaultTemplate.subject, lead));
      setEmailBody(replaceVariablesLocal(defaultTemplate.body, lead));
    } else {
      setSelectedTemplateId('');
      setEmailSubject('');
      setEmailBody('');
    }
    setIsEmailModalOpen(true);
  };

  const handleTemplateChangeLocal = (templateId: string, lead: Lead) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplateId(templateId);
      setEmailSubject(replaceVariablesLocal(template.subject, lead));
      setEmailBody(replaceVariablesLocal(template.body, lead));
    }
  };

  const handleSendEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForEmail) return;
    
    sendLeadEmailStandalone(selectedLeadForEmail.id);
    setIsEmailModalOpen(false);
    setSelectedLeadForEmail(null);
  };

  const processedLeads = leads
    // Filter by mode
    .filter(lead => mode === 'leads' ? true : lead.savedToOpportunities)
    // Filter by assigned BDR if the user is a BDR
    .filter(lead => {
      if (user?.role === 'bdr') {
        return lead.assignedTo === user.name;
      }
      return true;
    })
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
                if (lead.status === 'replied') statusColor = 'bg-purple-50 text-purple-800 border-purple-300';
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
                        <button
                          onClick={() => openEmailModal(lead)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-bold transition-all text-left truncate"
                          title={`Click to draft outbound email directly to ${lead.email}`}
                        >
                          <Mail className="w-3 h-3 text-blue-500 shrink-0" />
                          <span className="truncate">{lead.email}</span>
                        </button>
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
                        {(lead.status === 'contacted' || lead.status === 'replied') && (
                          <option value="replied">Replied</option>
                        )}
                        <option value="skipped">Skipped</option>
                        <option value="disqualified">Disqualified</option>
                      </select>
                    </td>

                    {/* Internal Comment Input Column - Clicking opens lead editor */}
                    <td className="px-4 py-3">
                      <div 
                        onClick={() => openEditModal(lead)}
                        className="cursor-pointer hover:bg-slate-50 border border-gray-250 hover:border-gray-350 rounded px-2.5 py-1 text-slate-650 hover:text-slate-900 transition-all text-xs min-h-[30px] flex items-center justify-between font-medium group bg-slate-50/50"
                        title="Click to view/edit client data and log comments"
                      >
                        <span className="truncate pr-2">
                          {lead.comment || <span className="text-slate-400 italic">Click to edit details / comment</span>}
                        </span>
                        <Pencil className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
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
      </div>      {/* Edit Client Profile & Commentary Modal */}
      {isEditModalOpen && selectedLeadForEdit && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-300 rounded shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800">
                <Pencil className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-extrabold uppercase tracking-wide">Edit Client Details</h3>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedLeadForEdit(null);
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">First Name</label>
                  <input
                    required
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Last Name</label>
                  <input
                    required
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Company</label>
                  <input
                    required
                    type="text"
                    value={editForm.company}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Job Title</label>
                  <input
                    required
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Email Address</label>
                  <input
                    required
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Industry</label>
                  <input
                    required
                    type="text"
                    value={editForm.industry}
                    onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Lead['status'] })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-semibold"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    {(selectedLeadForEdit.status === 'contacted' || selectedLeadForEdit.status === 'replied' || editForm.status === 'replied') && (
                      <option value="replied">Replied</option>
                    )}
                    <option value="skipped">Skipped</option>
                    <option value="disqualified">Disqualified</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Commentary</label>
                <textarea
                  value={editForm.comment}
                  onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                  rows={4}
                  autoFocus
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-medium leading-relaxed"
                  placeholder="Log details of the client conversation..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedLeadForEdit(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded text-xs font-bold text-slate-650 hover:bg-slate-50 bg-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-sm transition-colors"
                >
                  Save Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Composer Modal */}
      {isEmailModalOpen && selectedLeadForEmail && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-300 rounded shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800">
                <Mail className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-extrabold uppercase tracking-wide">Draft Outbound Email</h3>
              </div>
              <button
                onClick={() => {
                  setIsEmailModalOpen(false);
                  setSelectedLeadForEmail(null);
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSendEmailSubmit} className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-850 flex items-center justify-between">
                <div>
                  <span className="font-extrabold">Recipient:</span> {selectedLeadForEmail.firstName} {selectedLeadForEmail.lastName} ({selectedLeadForEmail.email}) <br />
                  <span className="font-extrabold">Company:</span> {selectedLeadForEmail.company}
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className="text-[9px] font-bold text-blue-500 uppercase">Email Template</span>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleTemplateChangeLocal(e.target.value, selectedLeadForEmail)}
                    className="px-2 py-1 text-[11px] font-bold rounded border border-blue-300 bg-white text-slate-600 focus:outline-none focus:border-blue-500"
                  >
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Subject Line</label>
                <input
                  required
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-semibold"
                  placeholder="Subject Line"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Email Body</label>
                  <span className="text-[9px] text-gray-400 flex items-center gap-1 font-normal">
                    <Info className="w-3 h-3" /> Auto-populated templates use lead details
                  </span>
                </div>
                <textarea
                  required
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-medium leading-relaxed font-mono"
                  placeholder="Draft your email body here..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => {
                    setIsEmailModalOpen(false);
                    setSelectedLeadForEmail(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded text-xs font-bold text-slate-655 hover:bg-slate-50 bg-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Email</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
