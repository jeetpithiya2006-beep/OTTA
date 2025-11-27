import React from 'react';
import { User, UserRole, Theme } from '../types';
import { LogOut, User as UserIcon, ShieldCheck, Sun, Moon } from 'lucide-react';
import { Button } from './Button';

interface LayoutProps {
  user: User;
  children: React.ReactNode;
  onLogout: () => void;
  theme: Theme;
  toggleTheme: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ user, children, onLogout, theme, toggleTheme }) => {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors duration-300">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-zinc-950/60 transition-colors duration-300">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-zinc-900 dark:bg-white rounded-lg flex items-center justify-center transition-colors duration-300">
              <span className="font-bold text-white dark:text-zinc-950">O</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">OTTA</span>
          </div>

          <div className="flex items-center space-x-4">
             <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleTheme}
              className="rounded-full w-9 h-9 p-0 flex items-center justify-center"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-sm font-medium text-zinc-900 dark:text-white">{user.name}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-500 flex items-center">
                {user.role === UserRole.HR ? <ShieldCheck size={10} className="mr-1" /> : <UserIcon size={10} className="mr-1" />}
                {user.department}
              </span>
            </div>
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="h-8 w-8 rounded-full ring-2 ring-zinc-200 dark:ring-zinc-800"
            />
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-900 py-6 transition-colors duration-300">
        <div className="container mx-auto px-4 text-center text-xs text-zinc-500 dark:text-zinc-600">
          &copy; {new Date().getFullYear()} OTTA Inc. Premium Time Tracking.
        </div>
      </footer>
    </div>
  );
};