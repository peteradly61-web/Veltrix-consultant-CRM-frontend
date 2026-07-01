'use client';

import React, { useState } from 'react';
import { useVeltrixStore } from '@/lib/store';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Building2, 
  User 
} from 'lucide-react';

export default function BdrCalendar() {
  const { meetings } = useVeltrixStore();
  
  // Initialize to current date (July 2026 in the demo workspace state, or local system time)
  const [currentDate, setCurrentDate] = useState(() => {
    // Default to July 2026 to align with mock meeting logs, or use today's month/year
    return new Date(2026, 6, 1); // July is month index 6
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Calculate calendar days
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month); // Day of week (0 = Sunday, 6 = Saturday)

  const daysArray: (number | null)[] = [];
  
  // Fill initial offset blanks
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  
  // Fill days
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  // Group into weeks (rows of 7 days)
  const rows: (number | null)[][] = [];
  let tempWeek: (number | null)[] = [];
  
  daysArray.forEach((day, index) => {
    tempWeek.push(day);
    if (tempWeek.length === 7 || index === daysArray.length - 1) {
      // Pad last week if necessary
      while (tempWeek.length < 7) {
        tempWeek.push(null);
      }
      rows.push(tempWeek);
      tempWeek = [];
    }
  });

  // Weekdays header
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="crm-panel bg-white shadow-sm border border-gray-300 rounded overflow-hidden">
      
      {/* Calendar Header with Controls */}
      <div className="border-b border-gray-300 px-6 py-4 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-extrabold text-slate-800 tracking-tight">
            Meetings Calendar
          </h2>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-4">
          <h3 className="text-xs font-black text-slate-700 tracking-wide uppercase min-w-[120px] text-center">
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

      {/* Calendar Grid Table */}
      <div className="w-full border-collapse">
        {/* Weekday Columns */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-slate-50/50">
          {weekdays.map(day => (
            <div 
              key={day} 
              className="py-2 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid Rows */}
        <div className="divide-y divide-gray-200">
          {rows.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 divide-x divide-gray-200 min-h-[105px]">
              {week.map((dayNum, dayIndex) => {
                if (dayNum === null) {
                  return (
                    <div key={dayIndex} className="p-2 bg-slate-25/30" />
                  );
                }

                // Construct ISO Date string (YYYY-MM-DD) to query meetings
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayMeetings = meetings.filter(m => m.date === dateStr);
                const isToday = 
                  new Date().getDate() === dayNum && 
                  new Date().getMonth() === month && 
                  new Date().getFullYear() === year;

                return (
                  <div 
                    key={dayIndex} 
                    className={`p-2 bg-white flex flex-col justify-between hover:bg-slate-50/30 transition-colors ${
                      isToday ? 'ring-1 ring-blue-500/50' : ''
                    }`}
                  >
                    {/* Day number with highlights */}
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold ${
                        isToday 
                          ? 'w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold shadow-sm' 
                          : 'text-slate-500'
                      }`}>
                        {dayNum}
                      </span>
                      {dayMeetings.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                    </div>

                    {/* Meetings badge list */}
                    <div className="flex-1 flex flex-col gap-1.5 mt-2 justify-start overflow-y-auto max-h-[75px] scrollbar-thin">
                      {dayMeetings.map(m => (
                        <div
                          key={m.id}
                          className="bg-emerald-100 hover:bg-emerald-150 border border-emerald-250 text-emerald-850 font-bold text-[9px] px-1.5 py-0.5 rounded leading-tight truncate shadow-sm flex flex-col cursor-pointer transition-all"
                          title={`${m.title} at ${m.time} with ${m.leadName} (${m.company})`}
                        >
                          <div className="flex items-center gap-0.5 font-extrabold text-[8.5px] text-emerald-950">
                            <Clock className="w-2 h-2 shrink-0" />
                            <span>{m.time}</span>
                          </div>
                          <div className="truncate font-semibold text-[8px] mt-0.5 flex items-center gap-0.5">
                            <User className="w-2.5 h-2.5 shrink-0 opacity-70" />
                            <span className="truncate">{m.leadName}</span>
                          </div>
                          <div className="truncate text-[8px] opacity-75 font-normal flex items-center gap-0.5">
                            <Building2 className="w-2.5 h-2.5 shrink-0 opacity-70" />
                            <span className="truncate">{m.company}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
