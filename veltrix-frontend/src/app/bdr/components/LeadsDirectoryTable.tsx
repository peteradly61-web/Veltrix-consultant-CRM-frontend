'use client';

import React, { useState } from 'react';
import { useVeltrixStore } from '@/lib/store';
import { Lead } from '@/types';
import { Search, Plus, ChevronLeft, ChevronRight, Filter, Settings, ShieldAlert, Circle, Check, X, User } from 'lucide-react';

export default function LeadsDirectoryTable() {
  const { user, currentIndex } = useVeltrixStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Server-side Leads State
  const [dbLeads, setDbLeads] = useState<any[]>([]);
  const [loadingDbLeads, setLoadingDbLeads] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);
  const limit = 50;

  // Form states for creating a new lead
  const [newLeadForm, setNewLeadForm] = useState({
    firstName: '',
    lastName: '',
    company: '',
    email: '',
    title: '',
    industry: '',
    phone: '',
  });

  const stateStore = useVeltrixStore();

  const parseNameFromEmail = (email: string) => {
    if (!email) return { firstName: 'Contact', lastName: 'Person' };
    const username = email.split('@')[0];
    const splitChars = ['.', '_', '-'];
    for (const char of splitChars) {
      if (username.includes(char)) {
        const parts = username.split(char);
        if (parts.length >= 2) {
          const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
          const last = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
          return { firstName: first, lastName: last };
        }
      }
    }
    const formattedFirst = username.charAt(0).toUpperCase() + username.slice(1);
    return { firstName: formattedFirst, lastName: 'Rep' };
  };

  // API Fetcher for BDR Leads
  const fetchDbLeads = async () => {
    if (!user) return;
    setLoadingDbLeads(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: searchQuery,
        status: statusFilter,
        bdr: user.role === 'bdr' ? user.name : 'all'
      });
      const res = await fetch(`/api/data-vault/all-leads?${queryParams.toString()}`);
      const json = await res.json();
      if (json.success) {
        setDbLeads(json.data);
        setTotalPages(json.pagination.totalPages);
        setTotalLeadsCount(json.pagination.total);
      }
    } catch (err) {
      console.error('Failed to fetch directory leads:', err);
    } finally {
      setLoadingDbLeads(false);
    }
  };

  React.useEffect(() => {
    fetchDbLeads();
  }, [page, searchQuery, statusFilter, user]);

  React.useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedLeadIds(filteredLeads.map(l => l.email));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleSelectRow = (email: string) => {
    setSelectedLeadIds(prev => 
      prev.includes(email) ? prev.filter(id => id !== email) : [...prev, email]
    );
  };

  // Map database leads
  const filteredLeads = dbLeads.map(lead => {
    const { firstName, lastName } = parseNameFromEmail(lead.email);
    return {
      ...lead,
      firstName,
      lastName
    };
  });

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.company || !newLeadForm.email || !newLeadForm.firstName) return;

    const assignmentsToAdd = [{
      email: newLeadForm.email.toLowerCase(),
      assignedTo: user?.name || 'Alex Rivera',
      status: 'new',
      comment: `Manual creation.\nCompany: ${newLeadForm.company}\nPhone: ${newLeadForm.phone || 'N/A'}\nIndustry: ${newLeadForm.industry || 'N/A'}`
    }];

    try {
      const res = await fetch('/api/data-vault/all-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign',
          assignments: assignmentsToAdd
        })
      });
      const json = await res.json();
      if (json.success) {
        fetchDbLeads();
        stateStore.addRealtimeLog(`Lead ${newLeadForm.company} created manually on disk.`, 'success');
      } else {
        alert(`Failed to create lead: ${json.error}`);
      }
    } catch (err) {
      console.error(err);
    }

    // Reset Form & Close Modal
    setNewLeadForm({
      firstName: '',
      lastName: '',
      company: '',
      email: '',
      title: '',
      industry: '',
      phone: '',
    });
    setIsCreateModalOpen(false);
  };

  return (
    <div className="crm-panel bg-white shadow-sm border border-gray-300">
      
      {/* Table Title and Actions bar */}
      <div className="crm-panel-header flex items-center justify-between border-b border-gray-300 px-6 py-4">
        
        {/* Title with green indicator dot */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-600 shrink-0" />
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">Leads</h2>
        </div>

        {/* Search, Filter and Add Actions */}
        <div className="flex items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Search className="w-3.5 h-3.5 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 w-48 text-[11px] rounded border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-700 placeholder-gray-400 transition-all font-semibold"
            />
          </div>

          {/* Status filter dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1.5 text-[11px] font-bold rounded border border-gray-300 bg-white text-slate-600 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="skipped">Skipped</option>
            <option value="disqualified">Disqualified</option>
          </select>

          {/* Create Lead Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="crm-btn py-1.5 px-3 flex items-center gap-1 text-[11px] font-bold shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>Create Lead</span>
          </button>
        </div>

      </div>

      {/* Pagination & Mass selection actions */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-2 flex items-center justify-between text-[10px] font-semibold text-slate-500">
        <div>
          {selectedLeadIds.length > 0 && (
            <span className="bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded font-bold">
              {selectedLeadIds.length} Selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="font-bold">
            {totalLeadsCount > 0 ? Math.min(totalLeadsCount, (page - 1) * limit + 1) : 0}-
            {Math.min(totalLeadsCount, page * limit)} of {totalLeadsCount}
          </span>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded hover:bg-gray-200 text-slate-500 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 rounded hover:bg-gray-200 text-slate-500 disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* High-density grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="w-10 px-6 py-3">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={filteredLeads.length > 0 && selectedLeadIds.length === filteredLeads.length}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Assigned User</th>
              <th className="px-6 py-3">Created At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-150 text-xs text-slate-700 bg-white">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-semibold">
                  No records found matching current query parameters.
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => {
                const isSelected = selectedLeadIds.includes(lead.email);
                const isQueueActive = false;

                let statusBadge = 'bg-slate-100 text-slate-700 border-slate-200';
                if (lead.status === 'contacted') statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-250';
                if (lead.status === 'skipped') statusBadge = 'bg-amber-50 text-amber-700 border-amber-250';
                if (lead.status === 'disqualified') statusBadge = 'bg-red-50 text-red-700 border-red-250';

                return (
                  <tr
                    key={lead.id}
                    className={`transition-colors hover:bg-slate-50/60 ${
                      isSelected ? 'bg-blue-50/20' : ''
                    } ${isQueueActive ? 'bg-yellow-50/30' : ''}`}
                  >
                    <td className="px-6 py-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectRow(lead.email)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-3.5">
                      <div>
                        <span className="font-bold text-slate-800 block text-[12px]">
                          {lead.company}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {lead.firstName} {lead.lastName} — {lead.title || 'Purchasing Manager'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${statusBadge}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-[11px] text-slate-650">
                      {lead.email}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-slate-100 border flex items-center justify-center font-bold text-[9px] text-slate-600">
                        {user?.name ? user.name.slice(0, 2).toUpperCase() : 'BDR'}
                      </div>
                      <span className="font-semibold text-[11px]">{user?.name || 'BDR'}</span>
                    </td>
                    <td className="px-6 py-3.5 text-[11px] text-slate-400 font-medium font-sans">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Lead Modal Overlay */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-300 rounded shadow-xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="bg-slate-50 border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Create Lead</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateLead} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">First Name</label>
                  <input
                    required
                    type="text"
                    value={newLeadForm.firstName}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, firstName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-700 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Last Name</label>
                  <input
                    required
                    type="text"
                    value={newLeadForm.lastName}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, lastName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-700 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Company Name</label>
                <input
                  required
                  type="text"
                  value={newLeadForm.company}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, company: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-700 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Email Address</label>
                <input
                  required
                  type="email"
                  value={newLeadForm.email}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-700 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Job Title</label>
                  <input
                    type="text"
                    value={newLeadForm.title}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, title: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-700 bg-white"
                    placeholder="e.g. Director of IT"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Industry</label>
                  <input
                    type="text"
                    value={newLeadForm.industry}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, industry: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-700 bg-white"
                    placeholder="e.g. Tech, Finance"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Phone Number</label>
                <input
                  type="text"
                  value={newLeadForm.phone}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-700 bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-xs font-bold text-slate-650 hover:bg-slate-55 bg-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-sm transition-colors"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
