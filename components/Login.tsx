import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { User, UserRole } from '../types';
import { Button } from './Button';
import { Card } from './Card';
import { Clock, ShieldCheck, User as UserIcon } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    setUsers(StorageService.getUsers());
  }, []);

  const handleLogin = () => {
    if (selectedUser) {
      onLogin(selectedUser);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-zinc-800 dark:via-zinc-950 dark:to-zinc-950 transition-colors duration-300">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-zinc-200 dark:border-white/10 shadow-lg dark:shadow-2xl">
            <Clock className="h-8 w-8 text-zinc-900 dark:text-white" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Sign in to your OTTA workspace
          </p>
        </div>

        <Card className="space-y-6">
          <div className="space-y-4">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Select Account</label>
            <div className="grid gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
              {users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`
                    cursor-pointer relative flex items-center space-x-3 rounded-lg border px-4 py-3 transition-all
                    ${selectedUser?.id === user.id 
                      ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900 dark:border-white dark:bg-white/10 dark:ring-white' 
                      : 'border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:bg-zinc-800 dark:hover:border-zinc-700'
                    }
                  `}
                >
                  <div className={`
                    flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center
                    ${user.role === UserRole.HR ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'}
                  `}>
                    {user.role === UserRole.HR ? <ShieldCheck size={20} /> : <UserIcon size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">
                      {user.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500 truncate flex flex-col">
                      <span>{user.email}</span>
                      <span className="opacity-75">{user.role} &bull; {user.department || 'General'}</span>
                    </p>
                  </div>
                  {selectedUser?.id === user.id && (
                    <div className="h-2 w-2 rounded-full bg-zinc-900 dark:bg-white shadow-[0_0_10px_rgba(0,0,0,0.2)] dark:shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleLogin} 
            disabled={!selectedUser} 
            className="w-full"
            size="lg"
          >
            Continue as {selectedUser?.name.split(' ')[0] || 'User'}
          </Button>
        </Card>
      </div>
    </div>
  );
};