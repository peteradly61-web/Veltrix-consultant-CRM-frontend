'use client';

import { Lead } from '@/types';
import { useVeltrixStore } from '@/lib/store';
import { Send, SkipForward, AlertOctagon, Mail, FileText, Info } from 'lucide-react';
import React from 'react';

interface EmailEditorProps {
  lead?: Lead;
}

export default function EmailEditor({ lead }: EmailEditorProps) {
  const {
    templates,
    selectedTemplateId,
    emailSubject,
    emailBody,
    selectTemplate,
    updateEmailSubject,
    updateEmailBody,
    sendEmail,
    skipLead,
    disqualifyLead
  } = useVeltrixStore();

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    selectTemplate(e.target.value);
  };

  const handleSend = () => {
    if (lead) {
      sendEmail(lead.id);
    }
  };

  const handleSkip = () => {
    if (lead) {
      skipLead(lead.id);
    }
  };

  const handleDisqualify = () => {
    if (lead) {
      disqualifyLead(lead.id);
    }
  };

  const insertVariable = (variable: string) => {
    updateEmailBody(emailBody + variable);
  };

  if (!lead) {
    return (
      <div className="crm-panel p-8 flex flex-col items-center justify-center text-center h-[500px]">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4 border border-gray-200">
          <Mail className="w-6 h-6" />
        </div>
        <p className="text-gray-500 font-medium">All leads processed in today\'s batch.</p>
        <p className="text-xs text-gray-400 mt-2">Check the operations dashboard or reset the queue above.</p>
      </div>
    );
  }

  return (
    <div className="crm-panel flex flex-col justify-between h-[600px] bg-white">
      {/* Panel Header */}
      <div className="crm-panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold text-slate-700">Email Composer</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">Template:</span>
          <select
            value={selectedTemplateId}
            onChange={handleTemplateChange}
            className="crm-input py-1 cursor-pointer font-semibold"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Panel Body */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Subject Line */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Subject Line</label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => updateEmailSubject(e.target.value)}
              className="w-full crm-input py-2"
              placeholder="Email Subject"
            />
          </div>

          {/* Body Textarea */}
          <div className="flex-1 flex flex-col">
            <label className="block text-xs font-semibold text-gray-500 mb-1 flex justify-between">
              <span>Body Draft</span>
              <span className="text-[10px] text-gray-400 flex items-center gap-1 font-normal">
                <Info className="w-3 h-3" /> Double-click variable tag to append
              </span>
            </label>
            <textarea
              value={emailBody}
              onChange={(e) => updateEmailBody(e.target.value)}
              className="w-full crm-input font-mono text-xs leading-relaxed resize-none h-64 focus:outline-none"
              placeholder="Type your email body here..."
            />
          </div>

          {/* Variable pills */}
          <div>
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Dynamic Fields:</span>
              {['{first_name}', '{company_name}', '{title}', '{industry}'].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertVariable(v)}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 transition-colors"
                  title="Click to append"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Buttons Footer */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100 mt-6">
          <button
            onClick={handleDisqualify}
            className="flex-1 crm-btn-danger flex items-center justify-center gap-2 py-2"
          >
            <AlertOctagon className="w-4 h-4" />
            Bad Data / Disqualify
          </button>

          <button
            onClick={handleSkip}
            className="flex-1 crm-btn-secondary flex items-center justify-center gap-2 py-2"
          >
            <SkipForward className="w-4 h-4" />
            Skip Lead
          </button>

          <button
            onClick={handleSend}
            className="flex-[2] bg-emerald-600 hover:bg-emerald-700 border border-emerald-700 text-white font-bold rounded flex items-center justify-center gap-2 py-2 text-xs transition-colors"
          >
            <Send className="w-4 h-4" />
            Send Email & Next
          </button>
        </div>
      </div>
    </div>
  );
}
