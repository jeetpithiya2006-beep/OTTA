import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storageService';
import { User, UserRole, Theme } from './types';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { HRDashboard } from './components/HRDashboard';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>('dark');

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

  const handleLogin = (selectedUser: User) => {
    setUser(selectedUser);
    StorageService.saveUser(selectedUser);
  };

  const handleLogout = () => {
    setUser(null);
    StorageService.clearUser();
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  if (loading) return null;

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout user={user} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
      {user.role === UserRole.HR ? (
        <HRDashboard theme={theme} />
      ) : (
        <EmployeeDashboard user={user} />
      )}
    </Layout>
  );
}

export default App;