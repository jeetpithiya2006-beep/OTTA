import React, { useState, useMemo, useEffect } from 'react';
import { TimeLog, Theme, User, UserRole } from '../types';
import { StorageService } from '../services/storageService';
import { GeminiService } from '../services/geminiService';
import { Card } from './Card';
import { Button } from './Button';
import { Modal } from './Modal';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Users, Clock, Sparkles, TrendingUp, FileSpreadsheet, Trash2, LayoutDashboard, UserPlus, Mail } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { format, parseISO, startOfDay, endOfDay, eachDayOfInterval, isSameDay } from 'date-fns';
import * as XLSX from 'xlsx';

interface HRDashboardProps {
  theme?: Theme;
}

export const HRDashboard: React.FC<HRDashboardProps> = ({ theme = 'dark' }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'team'>('overview');
  
  // Data States
  const [logs] = useState<TimeLog[]>(StorageService.getLogs());
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // UI States
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  
  // New User Form State
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: UserRole.EMPLOYEE,
    department: ''
  });

  useEffect(() => {
    setUsers(StorageService.getUsers());
    setCurrentUser(StorageService.getUser());
  }, []);

  // Export State
  const [exportRange, setExportRange] = useState({
    start: format(new Date().setDate(new Date().getDate() - 7), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  // Derived Statistics
  const stats = useMemo(() => {
    const totalHours = logs.reduce((acc, log) => acc + (log.durationMinutes || 0), 0) / 60;
    const uniqueEmployees = new Set(logs.map(l => l.userId)).size;
    const avgShift = logs.length ? (totalHours / logs.filter(l => l.status === 'completed' && l.type === 'OFFICE_WORK').length) : 0;
    return { totalHours, uniqueEmployees, avgShift };
  }, [logs]);

  // Chart Data: Hours per Day
  const chartData = useMemo(() => {
    const data: Record<string, number> = {};
    logs.forEach(log => {
      if (log.type === 'OFFICE_WORK') {
        const day = new Date(log.checkIn).toLocaleDateString('en-US', { weekday: 'short' });
        data[day] = (data[day] || 0) + (log.durationMinutes || 0) / 60;
      }
    });
    return Object.entries(data).map(([name, hours]) => ({ name, hours: parseFloat(hours.toFixed(1)) }));
  }, [logs]);

  // Chart Data: Status Distribution
  const pieData = useMemo(() => {
    const active = logs.filter(l => l.status === 'active').length;
    const completed = logs.filter(l => l.status === 'completed' && l.type === 'OFFICE_WORK').length;
    const leaves = logs.filter(l => l.type !== 'OFFICE_WORK').length;
    return [
      { name: 'Active Now', value: active },
      { name: 'Completed', value: completed },
      { name: 'Leaves', value: leaves }
    ];
  }, [logs]);

  const COLORS = ['#22c55e', theme === 'dark' ? '#52525b' : '#a1a1aa', '#eab308'];
  const CHART_TEXT_COLOR = theme === 'dark' ? '#71717a' : '#52525b';
  const CHART_BAR_COLOR = theme === 'dark' ? '#fff' : '#18181b';
  const TOOLTIP_BG = theme === 'dark' ? '#18181b' : '#fff';
  const TOOLTIP_BORDER = theme === 'dark' ? '#27272a' : '#e4e4e7';
  const TOOLTIP_TEXT = theme === 'dark' ? '#fff' : '#18181b';

  const handleGenerateInsight = async () => {
    setLoadingInsight(true);
    const result = await GeminiService.analyzeAttendance(logs);
    setInsight(result || "No insights available.");
    setLoadingInsight(false);
  };

  const handleExportExcel = () => {
    if (!exportRange.start || !exportRange.end) {
      alert("Please select both start and end dates.");
      return;
    }

    const start = startOfDay(parseISO(exportRange.start));
    const end = endOfDay(parseISO(exportRange.end));
    const workbook = XLSX.utils.book_new();

    const allUserIds = Array.from(new Set(logs.map(l => l.userId)));

    if (allUserIds.length === 0) {
      alert("No data found.");
      return;
    }

    allUserIds.forEach(userId => {
      const userLogs = logs.filter(l => l.userId === userId);
      const employeeName = userLogs[0]?.userName || `User ${userId}`;

      const sheetData = [];
      sheetData.push(["Date", "Day", "Nature of Work", "Time In", "Time Out", "Hours", "Remarks"]);

      const days = eachDayOfInterval({ start, end });
      
      days.forEach(day => {
        const dateStr = format(day, 'MM/dd/yyyy');
        const dayName = format(day, 'EEEE');
        const log = userLogs.find(l => isSameDay(parseISO(l.date), day));
        
        if (log) {
          if (log.type === 'OFFICE_WORK') {
            sheetData.push([
              dateStr,
              dayName,
              "OFFICE WORK",
              format(new Date(log.checkIn), 'hh:mm a'),
              log.checkOut ? format(new Date(log.checkOut), 'hh:mm a') : 'Active',
              log.durationMinutes ? (log.durationMinutes / 60).toFixed(2) : '',
              log.remarks || ''
            ]);
          } else {
            const label = log.type.replace('_', ' '); 
            sheetData.push([
              dateStr,
              dayName,
              label,
              "",
              "",
              "",
              log.remarks || ''
            ]);
          }
        } else {
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          sheetData.push([
            dateStr,
            dayName,
            isWeekend ? "" : "ABSENT",
            "",
            "",
            "",
            ""
          ]);
        }
      });

      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
      worksheet['!cols'] = [{wch: 15}, {wch: 15}, {wch: 20}, {wch: 15}, {wch: 15}, {wch: 10}, {wch: 30}];
      const sheetName = employeeName.replace(/[^\w\s]/gi, '').substring(0, 30);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    XLSX.writeFile(workbook, `Attendance_Report_${exportRange.start}_to_${exportRange.end}.xlsx`);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const user: User = {
      id: crypto.randomUUID(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newUser.name)}&background=random`
    };
    StorageService.addUser(user);
    setUsers(StorageService.getUsers());
    setIsAddUserModalOpen(false);
    setNewUser({ name: '', email: '', role: UserRole.EMPLOYEE, department: '' });
  };

  const handleRemoveUser = (userId: string) => {
    if (confirm("Are you sure you want to remove this user? This action cannot be undone.")) {
      StorageService.removeUser(userId);
      setUsers(StorageService.getUsers());
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
      
      {/* Tabs */}
      <div className="flex space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-1 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'overview' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-b-2 border-zinc-900 dark:border-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
        >
          <LayoutDashboard className="w-4 h-4 mr-2" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'team' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-b-2 border-zinc-900 dark:border-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
        >
          <Users className="w-4 h-4 mr-2" />
          Team Management
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Top Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                <Users size={24} />
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium uppercase tracking-wider">Active Employees</p>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.uniqueEmployees}</h3>
              </div>
            </Card>
            <Card className="flex items-center space-x-4">
              <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium uppercase tracking-wider">Total Hours (All Time)</p>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.totalHours.toFixed(1)}h</h3>
              </div>
            </Card>
            <Card className="flex items-center space-x-4">
              <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium uppercase tracking-wider">Avg Shift Length</p>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.avgShift.toFixed(1)}h</h3>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Chart */}
            <Card title="Weekly Work Volume" className="lg:col-span-2">
              <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#27272a" : "#e4e4e7"} vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke={CHART_TEXT_COLOR} 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke={CHART_TEXT_COLOR} 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `${value}h`}
                    />
                    <Tooltip 
                      cursor={{ fill: theme === 'dark' ? '#27272a' : '#f4f4f5' }}
                      contentStyle={{ backgroundColor: TOOLTIP_BG, border: `1px solid ${TOOLTIP_BORDER}`, borderRadius: '8px', color: TOOLTIP_TEXT }}
                    />
                    <Bar dataKey="hours" fill={CHART_BAR_COLOR} radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Status Pie Chart */}
            <Card title="Attendance Distribution">
              <div className="h-64 mt-4 flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: TOOLTIP_BG, border: `1px solid ${TOOLTIP_BORDER}`, borderRadius: '8px', color: TOOLTIP_TEXT }} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-zinc-900 dark:text-white">{pieData[0].value}</span>
                  <span className="text-xs text-zinc-500 uppercase">Active</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Export & AI Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Export Section */}
             <Card 
              title="Export Reports" 
              subtitle="Generate multi-sheet Excel report per employee"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Start Date</label>
                    <div className="relative">
                      <input 
                        type="date" 
                        value={exportRange.start}
                        onChange={(e) => setExportRange({...exportRange, start: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg text-sm px-3 py-2.5 outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 dark:[&::-webkit-calendar-picker-indicator]:invert"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">End Date</label>
                    <div className="relative">
                      <input 
                        type="date" 
                        value={exportRange.end}
                        onChange={(e) => setExportRange({...exportRange, end: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg text-sm px-3 py-2.5 outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 dark:[&::-webkit-calendar-picker-indicator]:invert"
                      />
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleExportExcel}
                  className="w-full bg-green-600 hover:bg-green-500 text-white dark:bg-green-600 dark:hover:bg-green-500 border-none"
                >
                  <FileSpreadsheet className="mr-2" size={18} />
                  Download Full Report
                </Button>
                <p className="text-xs text-zinc-400 text-center">
                  Includes individual sheets for all employees with full daily breakdown.
                </p>
              </div>
            </Card>

            {/* AI Insights Section */}
            <Card 
              title="AI Workforce Analysis" 
              subtitle="Powered by Gemini 2.5 Flash"
              action={
                <Button 
                  onClick={handleGenerateInsight} 
                  isLoading={loadingInsight} 
                  variant="outline"
                  size="sm"
                >
                  <Sparkles size={14} className="mr-2" /> Generate Report
                </Button>
              }
            >
              <div className="bg-zinc-50 dark:bg-zinc-950/50 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800/50 min-h-[150px] max-h-[200px] overflow-y-auto custom-scrollbar">
                {loadingInsight ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-3">
                    <div className="w-6 h-6 border-2 border-zinc-400 dark:border-zinc-700 border-t-zinc-900 dark:border-t-white rounded-full animate-spin" />
                    <p className="text-sm">Analyzing logs patterns...</p>
                  </div>
                ) : insight ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{insight}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-center">
                    <Sparkles className="mb-2 opacity-20" size={32} />
                    <p className="text-sm">Click "Generate Report" to let AI analyze attendance trends,<br/>punctuality, and potential burnout risks.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
          
          {/* Recent Logs Table */}
          <Card title="Recent Logs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-800/20 border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-4 py-3 font-medium">Employee</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Check In</th>
                    <th className="px-4 py-3 font-medium">Check Out</th>
                    <th className="px-4 py-3 font-medium text-right">Duration</th>
                    <th className="px-4 py-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {logs.slice(0, 10).map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">{log.userName}</td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{log.date}</td>
                      <td className="px-4 py-3 text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">
                        {log.type.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                         {log.type === 'OFFICE_WORK' ? format(new Date(log.checkIn), 'HH:mm') : '-'}
                      </td>
                      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                        {log.type === 'OFFICE_WORK' && log.checkOut ? format(new Date(log.checkOut), 'HH:mm') : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">
                        {log.type === 'OFFICE_WORK' && log.durationMinutes ? `${(log.durationMinutes/60).toFixed(1)}h` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          log.status === 'active' 
                            ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-600/20 dark:ring-green-500/20' 
                            : 'bg-zinc-100 dark:bg-zinc-700/30 text-zinc-500 dark:text-zinc-400 ring-1 ring-inset ring-zinc-500/10 dark:ring-zinc-700/50'
                        }`}>
                          {log.status === 'active' ? 'Active' : 'Done'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'team' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card 
            title="Team Members" 
            subtitle="Manage your employees and their roles"
            action={
              <Button onClick={() => setIsAddUserModalOpen(true)}>
                <UserPlus size={16} className="mr-2" /> Add Employee
              </Button>
            }
          >
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-800/20 border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Department</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                          <span className="font-medium text-zinc-900 dark:text-white">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          user.role === 'HR' 
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400' 
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{user.department}</td>
                      <td className="px-4 py-3 text-right">
                         {user.id !== currentUser?.id && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() => handleRemoveUser(user.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                         )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Add User Modal */}
      <Modal isOpen={isAddUserModalOpen} onClose={() => setIsAddUserModalOpen(false)} title="Add New Employee">
        <form onSubmit={handleAddUser} className="space-y-6">
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Full Name</label>
            <input
              type="text"
              required
              value={newUser.name}
              onChange={e => setNewUser({...newUser, name: e.target.value})}
              className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg p-3 outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={newUser.email}
                onChange={e => setNewUser({...newUser, email: e.target.value})}
                className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg p-3 pl-10 outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10"
                placeholder="e.g. john@company.com"
              />
              <Mail className="absolute left-3 top-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" size={16} />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Department</label>
            <input
              type="text"
              required
              value={newUser.department}
              onChange={e => setNewUser({...newUser, department: e.target.value})}
              className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg p-3 outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10"
              placeholder="e.g. Marketing"
            />
          </div>

          <div>
             <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Role</label>
             <select
              value={newUser.role}
              onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
              className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg p-3 outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10"
             >
               <option value="EMPLOYEE">Employee</option>
               <option value="HR">HR Manager</option>
             </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsAddUserModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">Create Account</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};