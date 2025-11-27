export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  HR = 'HR'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  department?: string;
}

export type LogType = 'OFFICE_WORK' | 'SICK_LEAVE' | 'CASUAL_LEAVE' | 'OTHER';

export interface TimeLog {
  id: string;
  userId: string;
  userName: string;
  type: LogType; // Added log type
  checkIn: string; // ISO string (start of day for leaves)
  checkOut?: string; // ISO string
  durationMinutes?: number;
  status: 'active' | 'completed';
  date: string; // YYYY-MM-DD for grouping
  remarks?: string;
}

export interface AnalyticsSummary {
  totalHours: number;
  avgHoursPerDay: number;
  onTimeArrivals: number;
  activeEmployees: number;
}

export type Theme = 'light' | 'dark';