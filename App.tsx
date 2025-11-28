import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storageService';
import { User, UserRole, Theme, ViewMode, TimeLog } from './types';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { HRDashboard } from './components/HRDashboard';
import { CompanyActivity } from './components/CompanyActivity';
import { Toast, ToastType } from './components/Toast';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>('dark');
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false
  });

  useEffect(() => {
    // Check for persisted session
    const savedUser = StorageService.getUser();
    if (savedUser) {
      setUser(savedUser);
    }
    
    // Load theme
    const savedTheme = StorageService.getTheme();
    setTheme(savedTheme);
    
    setLoading(false);
  }, []);

  useEffect(() => {
    // Apply theme class to html element
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    StorageService.saveTheme(theme);
  }, [theme]);

  // Handle Notifications (Same Tab & Cross Tab)
  useEffect(() => {
    const handleLogUpdate = (log: TimeLog) => {
      // Determine Notification Type
      if (log.status === 'active') {
        showToast(`${log.userName} checked in.`, 'check-in');
      } else if (log.status === 'completed' && log.type === 'OFFICE_WORK') {
        showToast(`${log.userName} checked out.`, 'check-out');
      }
    };

    // 1. Listen for same-tab updates (dispatched by StorageService)
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<TimeLog>;
      handleLogUpdate(customEvent.detail);
    };

    // 2. Listen for cross-tab updates (native localStorage event)
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'otta_logs' && e.newValue) {
        const newLogs: TimeLog[] = JSON.parse(e.newValue);
        const oldLogs: TimeLog[] = e.oldValue ? JSON.parse(e.oldValue) : [];
        
        // Find the diff to see what changed (simple heuristic: look for last modified)
        // Since we append or update, checking the last element isn't always enough if it was an update.
        // For simplicity in this demo, we'll just check the very last operation if possible, 
        // or compare lengths/timestamps. 
        // A robust way is to find the log that changed.
        
        // Let's just find the log with the most recent ID or modification
        // But for this simple implementation, let's assume the action happened at the end of the array or was an update.
        // We will just grab the latest log by date/time.
        const sortedLogs = [...newLogs].sort((a, b) => {
           // Sort by either checkOut (if completed) or checkIn (if active)
           const timeA = a.checkOut ? new Date(a.checkOut).getTime() : new Date(a.checkIn).getTime();
           const timeB = b.checkOut ? new Date(b.checkOut).getTime() : new Date(b.checkIn).getTime();
           return timeB - timeA;
        });

        const latestLog = sortedLogs[0];
        
        // To avoid spamming on page load, check if the change happened JUST now (within last 2 seconds)
        const logTime = latestLog.checkOut ? new Date(latestLog.checkOut) : new Date(latestLog.checkIn);
        const now = new Date();
        const diff = now.getTime() - logTime.getTime();

        if (latestLog && diff < 5000) { // 5 second threshold
           handleLogUpdate(latestLog);
        }
      }
    };

    window.addEventListener('otta-log-update', handleCustomEvent);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('otta-log-update', handleCustomEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type, isVisible: true });
  };

  const handleLogin = (selectedUser: User) => {
    setUser(selectedUser);
    StorageService.saveUser(selectedUser);
  };

  const handleLogout = () => {
    setUser(null);
    StorageService.clearUser();
    setCurrentView('dashboard'); // Reset view on logout
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  if (loading) return null;

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <>
      <Layout 
        user={user} 
        onLogout={handleLogout} 
        theme={theme} 
        toggleTheme={toggleTheme}
        currentView={currentView}
        onViewChange={setCurrentView}
      >
        {currentView === 'activity' ? (
          <CompanyActivity />
        ) : (
          user.role === UserRole.HR ? (
            <HRDashboard theme={theme} />
          ) : (
            <EmployeeDashboard user={user} />
          )
        )}
      </Layout>
      <Toast 
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </>
  );
}

export default App;
