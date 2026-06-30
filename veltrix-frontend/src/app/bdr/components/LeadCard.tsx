'use client';

import { Lead } from '@/types';
import { Building2, Briefcase, Tag, Mail, Phone, UserCheck } from 'lucide-react';

interface LeadCardProps {
  lead?: Lead;
}

export default function LeadCard({ lead }: LeadCardProps) {
  if (!lead) {
    return (
      <div className="crm-panel p-8 flex flex-col items-center justify-center text-center h-[340px]">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4 border border-gray-200">
          <UserCheck className="w-6 h-6" />
        </div>
        <p className="text-gray-500 font-medium">No lead active in queue</p>
      </div>
    );
  }

  return (
    <div className="crm-panel flex flex-col justify-between h-[340px] relative overflow-hidden bg-white">
      {/* Panel Header */}
      <div className="crm-panel-header flex items-center justify-between">
        <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
          Prospect Information
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-200 text-gray-700 border border-gray-300">
          ID: #{lead.id.split('-')[1] || lead.id}
        </span>
      </div>

      {/* Panel Body */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Prospect Name */}
          <div className="mb-4">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Full Name</p>
            <h2 className="text-xl font-bold text-slate-800">
              {lead.firstName} {lead.lastName}
            </h2>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Job Title</p>
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="truncate">{lead.title}</span>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Company</p>
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="truncate">{lead.company}</span>
              </div>
            </div>

            <div className="col-span-2">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Industry Sector</p>
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Tag className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{lead.industry}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact details footer */}
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1.5 truncate">
            <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate" title={lead.email}>{lead.email}</span>
          </div>
          {lead.phone && (
            <div className="flex items-center gap-1.5 truncate">
              <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate" title={lead.phone}>{lead.phone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
