import { TimeLog, User, Theme } from '../types';
import { INITIAL_LOGS, MOCK_USERS } from '../constants';

const KEYS = {
  USER: 'otta_user',
  USERS_LIST: 'otta_users_list',
  LOGS: 'otta_logs',
  THEME: 'otta_theme'
};

export const StorageService = {
  saveUser: (user: User) => {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  },

  getUser: (): User | null => {
    const data = localStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  clearUser: () => {
    localStorage.removeItem(KEYS.USER);
  },

  // User Management
  getUsers: (): User[] => {
    const data = localStorage.getItem(KEYS.USERS_LIST);
    if (!data) {
      localStorage.setItem(KEYS.USERS_LIST, JSON.stringify(MOCK_USERS));
      return MOCK_USERS;
    }
    return JSON.parse(data);
  },

  saveUsers: (users: User[]) => {
    localStorage.setItem(KEYS.USERS_LIST, JSON.stringify(users));
  },

  addUser: (user: User) => {
    const users = StorageService.getUsers();
    users.push(user);
    StorageService.saveUsers(users);
  },

  removeUser: (userId: string) => {
    const users = StorageService.getUsers();
    const filtered = users.filter(u => u.id !== userId);
    StorageService.saveUsers(filtered);
  },

  // Logs Management
  getLogs: (): TimeLog[] => {
    const data = localStorage.getItem(KEYS.LOGS);
    if (!data) {
      // Initialize with mock data if empty for demo purposes
      localStorage.setItem(KEYS.LOGS, JSON.stringify(INITIAL_LOGS));
      return INITIAL_LOGS;
    }
    return JSON.parse(data);
  },

  saveLog: (log: TimeLog) => {
    const logs = StorageService.getLogs();
    const existingIndex = logs.findIndex(l => l.id === log.id);
    
    if (existingIndex >= 0) {
      logs[existingIndex] = log;
    } else {
      logs.push(log);
    }
    
    localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
  },
  
  // Helper to find active log for a user
  getActiveLog: (userId: string): TimeLog | undefined => {
    const logs = StorageService.getLogs();
    return logs.find(l => l.userId === userId && l.status === 'active');
  },

  // Theme Management
  getTheme: (): Theme => {
    return (localStorage.getItem(KEYS.THEME) as Theme) || 'dark';
  },

  saveTheme: (theme: Theme) => {
    localStorage.setItem(KEYS.THEME, theme);
  }
};