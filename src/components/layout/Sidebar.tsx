import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Home,
  Brain,
  History,
  User,
  Trophy
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Take Quiz', href: '/quiz', icon: Brain },
    { name: 'History', href: '/history', icon: History },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const [avatar, setAvatar] = useState<string>('');

  useEffect(() => {
    // Load user's avatar from storage
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) {
      setAvatar(savedAvatar);
    }
  }, []);

  return (
    <aside className="fixed top-8 left-8 z-30 flex flex-col items-center bg-white rounded-3xl shadow-xl py-6 px-2 gap-4" style={{ width: 72, minHeight: '80vh' }}>
      <div className="flex flex-col gap-4 flex-1 w-full">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200',
                isActive
                  ? 'bg-[#FFD6DD] text-[#1A1A1A] shadow-md'
                  : 'bg-white text-[#6B6B6B] hover:bg-[#E9E1FA] hover:text-[#1A1A1A]'
              )}
            >
              <Icon className="w-6 h-6" />
            </Link>
          );
        })}
      </div>
      {/* User Avatar at the bottom */}
      <div className="mt-auto mb-2">
        <div className="w-12 h-12 rounded-full shadow-lg border-4 border-[#FFE8A3] overflow-hidden">
          {avatar ? (
            <img 
              src={avatar} 
              alt="User Avatar" 
              className="w-full h-full object-cover"
            />
          ) : (
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" 
              alt="User Avatar" 
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
