'use client';

import { useVeltrixStore } from '@/lib/store';
import { Target, CheckCircle2, ChevronRight, Ban } from 'lucide-react';

export default function ProgressTracker() {
  const { dailyProgress } = useVeltrixStore();
  const { sent, skipped, disqualified, target } = dailyProgress;

  const totalProcessed = sent + skipped + disqualified;
  const progressPercent = Math.min(Math.round((totalProcessed / target) * 100), 100);

  return (
    <div className="crm-panel bg-white">
      {/* Panel Header */}
      <div className="crm-panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold text-slate-700">Daily Progress Tracker</span>
        </div>
        <span className="text-xs font-mono font-bold text-blue-600">
          {totalProcessed} / {target} leads
        </span>
      </div>

      {/* Panel Body */}
      <div className="p-6">
        {/* Progress Bar */}
        <div className="w-full bg-gray-250 rounded-full h-3 mb-6 overflow-hidden border border-gray-250 bg-gray-100">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Outcomes Grid */}
        <div className="grid grid-cols-3 gap-3">
          {/* Sent Card */}
          <div className="bg-gray-50 border border-gray-200 rounded p-3 flex flex-col items-center text-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 mb-1" />
            <span className="text-[10px] text-gray-500 font-semibold uppercase">Sent</span>
            <span className="text-base font-bold text-slate-800 mt-0.5">{sent}</span>
          </div>

          {/* Skipped Card */}
          <div className="bg-gray-50 border border-gray-200 rounded p-3 flex flex-col items-center text-center">
            <ChevronRight className="w-4 h-4 text-amber-500 mb-1" />
            <span className="text-[10px] text-gray-500 font-semibold uppercase">Skipped</span>
            <span className="text-base font-bold text-slate-800 mt-0.5">{skipped}</span>
          </div>

          {/* Disqualified Card */}
          <div className="bg-gray-50 border border-gray-200 rounded p-3 flex flex-col items-center text-center">
            <Ban className="w-4 h-4 text-red-500 mb-1" />
            <span className="text-[10px] text-gray-500 font-semibold uppercase">Bad Data</span>
            <span className="text-base font-bold text-slate-800 mt-0.5">{disqualified}</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-semibold">
          <span>Completion Rate: {progressPercent}%</span>
          {progressPercent >= 100 ? (
            <span className="text-emerald-600 font-bold">Daily Quota Reached!</span>
          ) : (
            <span>Remaining: {target - totalProcessed} leads</span>
          )}
        </div>
      </div>
    </div>
  );
}
