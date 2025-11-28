import React, { useState, useEffect } from 'react';
import { TimeLog } from '../types';
import { StorageService } from '../services/storageService';
import { Card } from './Card';
import { format } from 'date-fns';
import { Activity, Clock } from 'lucide-react';

export const CompanyActivity: React.FC = () => {
  const [logs, setLogs] = useState<TimeLog[]>([]);

  useEffect(() => {
    // Load logs and sort by checkIn time descending (newest first)
    const allLogs = StorageService.getLogs();
    const sortedLogs = allLogs.sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());
    setLogs(sortedLogs); // Show all logs, or slice if performance is an issue: .slice(0, 50)
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2 py-4">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center justify-center gap-3">
          <Activity className="h-8 w-8 text-blue-500" />
          Company Activity
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium">
          Real-time feed of office attendance and leaves
        </p>
      </div>

      <Card className="overflow-hidden p-0 border-zinc-200 dark:border-zinc-800/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-800/20 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium">Employee</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Check In</th>
                <th className="px-6 py-4 font-medium">Check Out</th>
                <th className="px-6 py-4 font-medium text-right">Duration</th>
                <th className="px-6 py-4 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/50">
              {logs.length === 0 ? (
                 <tr>
                   <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">No activity records found</td>
                 </tr>
              ) : (
                logs.map((log) => (
                  <tr 
                    key={log.id} 
                    className={`group transition-colors ${
                      log.status === 'active' 
                        ? 'bg-emerald-50/60 dark:bg-emerald-900/10 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/20' 
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
                    }`}
                  >
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                      {log.userName}
                    </td>
                    <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                      {format(new Date(log.checkIn), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium uppercase tracking-wide ${
                        log.type === 'OFFICE_WORK' 
                          ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' 
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {log.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300 font-medium">
                      {log.type === 'OFFICE_WORK' ? format(new Date(log.checkIn), 'h:mm a') : '-'}
                    </td>
                    <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                      {log.type === 'OFFICE_WORK' && log.checkOut ? format(new Date(log.checkOut), 'h:mm a') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-500 dark:text-zinc-400">
                      {log.type === 'OFFICE_WORK' && log.durationMinutes ? `${Math.floor(log.durationMinutes / 60)}h ${log.durationMinutes % 60}m` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        log.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20' 
                          : 'bg-zinc-100 dark:bg-zinc-100/5 text-zinc-500 dark:text-zinc-400 ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700/50'
                      }`}>
                        {log.status === 'active' ? 'Active' : 'Done'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};