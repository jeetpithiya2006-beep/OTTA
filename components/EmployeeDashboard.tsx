import React, { useState, useEffect } from 'react';
import { User, TimeLog, LogType } from '../types';
import { StorageService } from '../services/storageService';
import { Card } from './Card';
import { Button } from './Button';
import { Modal } from './Modal';
import { Clock, LogIn, LogOut, Timer, Briefcase, Stethoscope, Palmtree, Calendar } from 'lucide-react';
import { format, differenceInSeconds } from 'date-fns';

interface EmployeeDashboardProps {
  user: User;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ user }) => {
  const [activeLog, setActiveLog] = useState<TimeLog | undefined>(undefined);
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [elapsed, setElapsed] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Manual Entry State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'OFFICE_WORK' as LogType,
    startTime: '09:00',
    endTime: '17:00',
    notes: ''
  });

  useEffect(() => {
    loadData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [user.id]);

  useEffect(() => {
    let interval: any;
    if (activeLog && activeLog.type === 'OFFICE_WORK') {
      interval = setInterval(() => {
        const start = new Date(activeLog.checkIn);
        const now = new Date();
        setElapsed(differenceInSeconds(now, start));
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [activeLog]);

  const loadData = () => {
    setActiveLog(StorageService.getActiveLog(user.id));
    const allLogs = StorageService.getLogs();
    setLogs(allLogs.filter(l => l.userId === user.id).sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime()));
  };

  const handleCheckIn = () => {
    const now = new Date();
    const newLog: TimeLog = {
      id: crypto.randomUUID(),
      userId: user.id,
      userName: user.name,
      type: 'OFFICE_WORK',
      checkIn: now.toISOString(),
      status: 'active',
      date: now.toISOString().split('T')[0]
    };
    StorageService.saveLog(newLog);
    setActiveLog(newLog);
    loadData();
  };

  const handleCheckOut = () => {
    if (!activeLog) return;
    const now = new Date();
    const checkInTime = new Date(activeLog.checkIn);
    const durationMinutes = Math.floor(differenceInSeconds(now, checkInTime) / 60);

    const updatedLog: TimeLog = {
      ...activeLog,
      checkOut: now.toISOString(),
      status: 'completed',
      durationMinutes
    };
    StorageService.saveLog(updatedLog);
    setActiveLog(undefined);
    loadData();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let checkInStr, checkOutStr, durationMinutes;

    if (manualEntry.type === 'OFFICE_WORK') {
      const startDateTime = new Date(`${manualEntry.date}T${manualEntry.startTime}`);
      const endDateTime = new Date(`${manualEntry.date}T${manualEntry.endTime}`);

      if (endDateTime <= startDateTime) {
        alert("End time must be after start time");
        return;
      }
      
      checkInStr = startDateTime.toISOString();
      checkOutStr = endDateTime.toISOString();
      durationMinutes = Math.floor(differenceInSeconds(endDateTime, startDateTime) / 60);
    } else {
      const dateObj = new Date(manualEntry.date);
      checkInStr = dateObj.toISOString();
      checkOutStr = dateObj.toISOString();
      durationMinutes = 0;
    }

    const newLog: TimeLog = {
      id: crypto.randomUUID(),
      userId: user.id,
      userName: user.name,
      type: manualEntry.type,
      checkIn: checkInStr,
      checkOut: checkOutStr,
      status: 'completed',
      durationMinutes,
      date: manualEntry.date,
      remarks: manualEntry.notes
    };

    StorageService.saveLog(newLog);
    loadData();
    setIsManualModalOpen(false);
  };

  const todaysLogs = logs.filter(l => l.date === format(new Date(), 'yyyy-MM-dd'));
  const firstCheckIn = todaysLogs.find(l => l.type === 'OFFICE_WORK')?.checkIn;
  const lastCheckOut = todaysLogs.filter(l => l.type === 'OFFICE_WORK' && l.status === 'completed').pop()?.checkOut;
  const totalHoursToday = todaysLogs.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0) + Math.floor(elapsed / 60);

  const getLogTypeLabel = (type: LogType) => {
    switch (type) {
      case 'OFFICE_WORK': return 'Office Work';
      case 'SICK_LEAVE': return 'Sick Leave';
      case 'CASUAL_LEAVE': return 'Casual Leave';
      case 'OTHER': return 'Other';
      default: return type;
    }
  };

  const getLogTypeIcon = (type: LogType) => {
    switch (type) {
      case 'OFFICE_WORK': return <Briefcase size={16} />;
      case 'SICK_LEAVE': return <Stethoscope size={16} />;
      case 'CASUAL_LEAVE': return <Palmtree size={16} />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="text-center space-y-2 py-4">
        <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Welcome, {user.name}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium">{user.department} &bull; {user.email}</p>
      </div>

      <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 md:p-12 shadow-xl flex flex-col items-center justify-center space-y-8 relative overflow-hidden transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
        
        <div className="flex flex-wrap justify-center gap-3">
          <div className={`
            px-4 py-1.5 rounded-full text-sm font-medium border flex items-center gap-2
            ${activeLog 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'}
          `}>
            <div className={`w-2 h-2 rounded-full ${activeLog ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400 dark:bg-zinc-500'}`} />
            {activeLog ? 'Currently Working' : 'Checked Out'}
          </div>
        </div>

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400 font-medium">
            <Calendar size={16} />
            {format(currentTime, 'EEEE, MMMM do, yyyy')}
          </div>
          <div className="text-7xl md:text-9xl font-bold text-zinc-900 dark:text-white tracking-tighter tabular-nums drop-shadow-sm dark:drop-shadow-2xl transition-colors duration-300">
            {format(currentTime, 'h:mm:ss')}
            <span className="text-2xl md:text-4xl text-zinc-400 dark:text-zinc-500 ml-2 font-light">{format(currentTime, 'a')}</span>
          </div>
        </div>

        <div className="flex gap-4 w-full max-w-md">
           {!activeLog ? (
             <Button 
               onClick={handleCheckIn}
               className="flex-1 h-14 text-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
             >
               <LogIn className="mr-2" size={20} /> Check In
             </Button>
           ) : (
             <Button 
               onClick={handleCheckOut}
               className="flex-1 h-14 text-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700"
             >
               <LogOut className="mr-2" size={20} /> Check Out
             </Button>
           )}
           <Button 
             variant="outline" 
             className="h-14 px-6 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
             onClick={() => setIsManualModalOpen(true)}
             title="Log past activity or leave"
           >
             Log
           </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-medium px-1">
          <Timer size={18} />
          <h3>Today's Summary</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="flex flex-col justify-center p-6 bg-white/50 dark:bg-zinc-900/30">
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Check In</span>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <LogIn size={20} />
              </div>
              <span className="text-2xl font-semibold text-zinc-900 dark:text-white">
                {firstCheckIn ? format(new Date(firstCheckIn), 'h:mm a') : '--:--'}
              </span>
            </div>
          </Card>
          
          <Card className="flex flex-col justify-center p-6 bg-white/50 dark:bg-zinc-900/30">
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Check Out</span>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <LogOut size={20} />
              </div>
              <span className="text-2xl font-semibold text-zinc-900 dark:text-white">
                {lastCheckOut ? format(new Date(lastCheckOut), 'h:mm a') : '--:--'}
              </span>
            </div>
          </Card>

          <Card className="flex flex-col justify-center p-6 bg-white/50 dark:bg-zinc-900/30">
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Hours Worked</span>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Clock size={20} />
              </div>
              <span className="text-2xl font-semibold text-zinc-900 dark:text-white">
                {Math.floor(totalHoursToday / 60)}h {totalHoursToday % 60}m
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* History Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-medium">
            <Clock size={18} />
            <h3>Attendance History</h3>
          </div>
        </div>
        
        <Card className="overflow-hidden p-0 border-zinc-200 dark:border-zinc-800/50">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Check In</th>
                  <th className="px-6 py-4 font-medium">Check Out</th>
                  <th className="px-6 py-4 font-medium">Total Hours</th>
                  <th className="px-6 py-4 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/50">
                {logs.length === 0 ? (
                   <tr>
                     <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">No attendance records found</td>
                   </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                        {format(new Date(log.checkIn), 'EEE, MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
                          log.type === 'OFFICE_WORK' 
                            ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' 
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {getLogTypeIcon(log.type)}
                          {getLogTypeLabel(log.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-900 dark:text-zinc-100 font-medium">
                        {log.type === 'OFFICE_WORK' ? format(new Date(log.checkIn), 'h:mm a') : '-'}
                      </td>
                      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                        {log.type === 'OFFICE_WORK' && log.checkOut ? format(new Date(log.checkOut), 'h:mm a') : '-'}
                      </td>
                      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                        {log.type === 'OFFICE_WORK' && log.durationMinutes ? `${Math.floor(log.durationMinutes / 60)}h ${log.durationMinutes % 60}m` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          log.status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20' 
                            : 'bg-zinc-100 dark:bg-zinc-100/5 text-zinc-500 dark:text-zinc-400 ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700/50'
                        }`}>
                          {log.status === 'active' ? 'Active' : 'Completed'}
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

      <Modal 
        isOpen={isManualModalOpen} 
        onClose={() => setIsManualModalOpen(false)} 
        title="Log Activity"
      >
        <form onSubmit={handleManualSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={manualEntry.date}
                  onChange={e => setManualEntry({...manualEntry, date: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/20 focus:border-zinc-400 dark:focus:border-zinc-700 outline-none p-3 pl-10 appearance-none dark:[&::-webkit-calendar-picker-indicator]:invert"
                />
                <Calendar className="absolute left-3 top-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" size={16} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Nature of Work
              </label>
              <select
                value={manualEntry.type}
                onChange={e => setManualEntry({...manualEntry, type: e.target.value as LogType})}
                className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/20 focus:border-zinc-400 dark:focus:border-zinc-700 outline-none p-3"
              >
                <option value="OFFICE_WORK">Office Work</option>
                <option value="SICK_LEAVE">Sick Leave</option>
                <option value="CASUAL_LEAVE">Casual Leave</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {manualEntry.type === 'OFFICE_WORK' && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    Start Time
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      required
                      value={manualEntry.startTime}
                      onChange={e => setManualEntry({...manualEntry, startTime: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/20 focus:border-zinc-400 dark:focus:border-zinc-700 outline-none p-3 pl-10 dark:[&::-webkit-calendar-picker-indicator]:invert"
                    />
                    <Clock className="absolute left-3 top-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" size={16} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    End Time
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      required
                      value={manualEntry.endTime}
                      onChange={e => setManualEntry({...manualEntry, endTime: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/20 focus:border-zinc-400 dark:focus:border-zinc-700 outline-none p-3 pl-10 dark:[&::-webkit-calendar-picker-indicator]:invert"
                    />
                    <Clock className="absolute left-3 top-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" size={16} />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Remarks / Reason
              </label>
              <textarea
                value={manualEntry.notes}
                onChange={e => setManualEntry({...manualEntry, notes: e.target.value})}
                placeholder={manualEntry.type === 'OFFICE_WORK' ? "Optional notes..." : "Reason for leave..."}
                rows={3}
                className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/20 focus:border-zinc-400 dark:focus:border-zinc-700 outline-none p-3 resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="ghost" 
              className="flex-1"
              onClick={() => setIsManualModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
            >
              Submit Entry
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};