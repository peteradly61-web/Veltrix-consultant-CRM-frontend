'use client';

import React, { useState } from 'react';
import { useVeltrixStore } from '@/lib/store';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Building2, 
  User,
  Sparkles,
  Users
} from 'lucide-react';

export default function AdminCalendar() {
  const { meetings } = useVeltrixStore();
  
  // Initialize to July 2026 to align with mock meeting logs
  const [currentDate, setCurrentDate] = useState(() => {
    return new Date(2026, 6, 1); // July is index 6
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // BDR style map helper
  const getBdrColors = (name?: string) => {
    const normalized = name ? name.toLowerCase() : '';
    if (normalized.includes('alex')) return { bg: 'bg-emerald-100 border-emerald-200 text-emerald-900 hover:bg-emerald-150', dot: 'bg-emerald-500' };
    if (normalized.includes('jordan')) return { bg: 'bg-indigo-100 border-indigo-200 text-indigo-900 hover:bg-indigo-150', dot: 'bg-indigo-500' };
    if (normalized.includes('elena')) return { bg: 'bg-purple-100 border-purple-200 text-purple-900 hover:bg-purple-150', dot: 'bg-purple-500' };
    if (normalized.includes('marcus')) return { bg: 'bg-amber-100 border-amber-200 text-amber-900 hover:bg-amber-150', dot: 'bg-amber-500' };
    if (normalized.includes('sarah')) return { bg: 'bg-rose-100 border-rose-200 text-rose-900 hover:bg-rose-150', dot: 'bg-rose-500' };
    return { bg: 'bg-slate-100 border-slate-200 text-slate-900 hover:bg-slate-150', dot: 'bg-slate-500' };
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  const daysArray: (number | null)[] = [];
  
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  const rows: (number | null)[][] = [];
  let tempWeek: (number | null)[] = [];
  
  daysArray.forEach((day, index) => {
    tempWeek.push(day);
    if (tempWeek.length === 7 || index === daysArray.length - 1) {
      while (tempWeek.length < 7) {
        tempWeek.push(null);
      }
      rows.push(tempWeek);
      tempWeek = [];
    }
  });

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      
      {/* Overview Header */}
      <div className="flex items-center justify-between border-b border-gray-250 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            <span>Consolidated Team Calendar</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Aggregated calendar showing booked meetings across all outbound agents.</p>
        </div>
        
        {/* Color Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500 bg-white border border-gray-300 rounded px-3 py-1.5 shadow-sm">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Alex Rivera</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span>Jordan Vance</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span>Elena Rostova</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Marcus Brody</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Sarah Jenkins</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid Box */}
      <div className="crm-panel bg-white shadow-sm border border-gray-300 rounded overflow-hidden">
        
        {/* Calendar Title & Month controls */}
        <div className="border-b border-gray-300 px-6 py-4 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600 animate-pulse" />
            <h3 className="text-xs font-bold uppercase text-slate-700">Team Calendar Session</h3>
          </div>

          <div className="flex items-center gap-4">
            <h3 className="text-xs font-black text-slate-700 tracking-wide uppercase min-w-[125px] text-center">
              {monthNames[month]} {year}
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={prevMonth}
                className="p-1 border border-gray-300 rounded hover:bg-slate-50 text-slate-650 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1 border border-gray-300 rounded hover:bg-slate-50 text-slate-650 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Days Table */}
        <div className="w-full border-collapse">
          {/* Weekday titles */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-slate-50/50">
            {weekdays.map(day => (
              <div 
                key={day} 
                className="py-2.5 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Weeks Grid */}
          <div className="divide-y divide-gray-200 bg-slate-50/10">
            {rows.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 divide-x divide-gray-200 min-h-[115px]">
                {week.map((dayNum, dayIndex) => {
                  if (dayNum === null) {
                    return (
                      <div key={dayIndex} className="p-2 bg-slate-25/20" />
                    );
                  }

                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const dayMeetings = meetings.filter(m => m.date === dateStr);
                  const isToday = 
                    new Date().getDate() === dayNum && 
                    new Date().getMonth() === month && 
                    new Date().getFullYear() === year;

                  return (
                    <div 
                      key={dayIndex} 
                      className={`p-2.5 bg-white flex flex-col justify-between hover:bg-slate-55/30 transition-all ${
                        isToday ? 'ring-1 ring-blue-500/50 bg-blue-50/5' : ''
                      }`}
                    >
                      {/* Day Number Header */}
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold ${
                          isToday 
                            ? 'w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold shadow-sm' 
                            : 'text-slate-500'
                        }`}>
                          {dayNum}
                        </span>
                        {dayMeetings.length > 0 && (
                          <span className="text-[9px] px-1.5 py-0.25 rounded-full bg-slate-100 text-slate-500 font-extrabold font-mono">
                            {dayMeetings.length}
                          </span>
                        )}
                      </div>

                      {/* Day Events list */}
                      <div className="flex-1 flex flex-col gap-1.5 mt-2 justify-start overflow-y-auto max-h-[85px] scrollbar-thin">
                        {dayMeetings.map(m => {
                          const repName = m.bookedBy || 'Alex Rivera';
                          const bdrColors = getBdrColors(repName);

                          return (
                            <div
                              key={m.id}
                              className={`border font-bold text-[9px] px-2 py-1 rounded leading-tight truncate shadow-sm flex flex-col cursor-pointer transition-all border-l-4 ${bdrColors.bg}`}
                              title={`${m.title} booked by ${repName} with ${m.leadName} (${m.company})`}
                            >
                              <div className="flex items-center justify-between text-[7.5px] uppercase font-black tracking-wide border-b border-black/5 pb-0.5 mb-0.5 opacity-90">
                                <span>{repName.split(' ')[0]}</span>
                                <span className="font-mono">{m.time}</span>
                              </div>
                              <div className="truncate font-semibold text-[8px] flex items-center gap-0.5">
                                <User className="w-2.5 h-2.5 shrink-0 opacity-60" />
                                <span className="truncate">{m.leadName}</span>
                              </div>
                              <div className="truncate text-[7.5px] opacity-75 font-normal flex items-center gap-0.5 mt-0.25">
                                <Building2 className="w-2.5 h-2.5 shrink-0 opacity-60" />
                                <span className="truncate">{m.company}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
