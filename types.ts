export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  HR = 'HR'
}

export interface User {
  id: string;
  name: string;
  email: string; // Added email
  role: UserRole;
  avatar?: string;
  department?: string;
}

export type LogType = 'OFFICE_WORK' | 'SICK_LEAVE' | 'CASUAL_LEAVE' | 'OTHER';

export interface TimeLog {
  id: string;
  userId: string;
  userName: string;
  type: LogType;
  checkIn: string; // ISO string
  checkOut?: string; // ISO string
  durationMinutes?: number;
  status: 'active' | 'completed';
  date: string; // YYYY-MM-DD
  remarks?: string;
}

export interface AnalyticsSummary {
  totalHours: number;
  avgHoursPerDay: number;
  onTimeArrivals: number;
  activeEmployees: number;
}

export type Theme = 'light' | 'dark';

export type ViewMode = 'dashboard' | 'activity';