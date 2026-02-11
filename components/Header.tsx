'use client';

import React, { useEffect, useState } from 'react';
import { Droplets, Menu, Trees, Home, FileText, BarChart3, User, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('tt_token') : null;
    setIsAuthed(!!token);
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('tt_token');
    setIsAuthed(false);
    router.push('/login');
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-200",
      isScrolled && "shadow-lg"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold shadow-lg group-hover:shadow-xl transition-all duration-200 group-hover:scale-105">
              <Droplets className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">TerraTrace</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Environmental Justice Platform</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Button asChild variant="ghost" size="sm" className="hover:bg-blue-50 dark:hover:bg-blue-950/20">
              <Link href="/" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hover:bg-green-50 dark:hover:bg-green-950/20">
              <Link href="/complaints" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Complaints</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hover:bg-amber-50 dark:hover:bg-amber-950/20">
              <Link href="/compensation" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span>Compensation</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hover:bg-purple-50 dark:hover:bg-purple-950/20">
              <Link href="/reports" className="flex items-center gap-2">
                <Trees className="w-4 h-4" />
                <span>Reports</span>
              </Link>
            </Button>
            
            <div className="w-px h-6 bg-border mx-2" />
            
            {isAuthed ? (
              <>
                <Button asChild variant="ghost" size="sm" className="hover:bg-indigo-50 dark:hover:bg-indigo-950/20">
                  <Link href="/profile" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  className="hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-950/20"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </Button>
              </>
            ) : (
              <Button 
                asChild 
                variant="default" 
                size="sm"
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Link href="/login" className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Link>
              </Button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          {onMenuClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="md:hidden hover:bg-muted"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
