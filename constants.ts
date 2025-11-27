import { User, UserRole, TimeLog } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Alex Rivera',
    role: UserRole.EMPLOYEE,
    department: 'Engineering',
    avatar: 'https://picsum.photos/100/100'
  },
  {
    id: 'u2',
    name: 'Sarah Chen',
    role: UserRole.HR,
    department: 'Human Resources',
    avatar: 'https://picsum.photos/101/101'
  },
  {
    id: 'u3',
    name: 'Jordan Smith',
    role: UserRole.EMPLOYEE,
    department: 'Design',
    avatar: 'https://picsum.photos/102/102'
  }
];

// Generate some initial mock logs for the HR dashboard to look good
const generateMockLogs = (): TimeLog[] => {
  const logs: TimeLog[] = [];
  const now = new Date();
  
  // Last 14 days
  for (let i = 0; i < 14; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Skip weekends for mock data mostly
    const day = date.getDay();
    if (day === 0 || day === 6) continue;

    MOCK_USERS.forEach(user => {
      if (user.role === UserRole.EMPLOYEE) {
        // 10% chance of sick leave
        const isSick = Math.random() < 0.1;

        if (isSick) {
           logs.push({
            id: `log-${dateStr}-${user.id}`,
            userId: user.id,
            userName: user.name,
            type: 'SICK_LEAVE',
            checkIn: date.toISOString(), // Just marks the day
            checkOut: date.toISOString(),
            durationMinutes: 0,
            status: 'completed',
            date: dateStr,
            remarks: 'Not feeling well'
          });
        } else {
          // Normal Work
          const checkIn = new Date(date);
          checkIn.setHours(8 + Math.random() * 2, Math.floor(Math.random() * 60));
          
          const durationHours = 8 + (Math.random() * 2 - 0.5);
          const checkOut = new Date(checkIn.getTime() + durationHours * 60 * 60 * 1000);

          logs.push({
            id: `log-${dateStr}-${user.id}`,
            userId: user.id,
            userName: user.name,
            type: 'OFFICE_WORK',
            checkIn: checkIn.toISOString(),
            checkOut: checkOut.toISOString(),
            durationMinutes: Math.floor(durationHours * 60),
            status: 'completed',
            date: dateStr,
            remarks: ''
          });
        }
      }
    });
  }
  return logs;
};

export const INITIAL_LOGS: TimeLog[] = generateMockLogs();