import { TimeLog, User } from '../types';
import { GOOGLE_SCRIPT_URL } from '../constants';

// This service handles sending data to your Google Apps Script Web App
export const GoogleSheetsService = {
  
  // Send a new user to the "Users" sheet
  syncUser: async (user: User) => {
    if (!GOOGLE_SCRIPT_URL) return;

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Important for Google Apps Script Web Apps
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'ADD_USER',
          data: user
        })
      });
      console.log('Synced user to Google Sheets');
    } catch (error) {
      console.error('Failed to sync user to Google Sheets:', error);
    }
  },

  // Send a log entry (check-in/out) to the "Attendance" sheet
  syncLog: async (log: TimeLog, userEmail?: string) => {
    if (!GOOGLE_SCRIPT_URL) return;

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'LOG_ATTENDANCE',
          data: {
            ...log,
            email: userEmail || 'unknown@otta.com' 
          }
        })
      });
      console.log('Synced log to Google Sheets');
    } catch (error) {
      console.error('Failed to sync log to Google Sheets:', error);
    }
  }
};