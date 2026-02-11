'use client';

import React, { useState } from 'react';
import { X, MessageSquare, FileText, Layers, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  stats?: {
    damsMonitored: number;
    complaintsLogged: number;
    affectedPopulation: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  stats = {
    damsMonitored: 0,
    complaintsLogged: 0,
    affectedPopulation: 0,
  },
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative w-64 h-screen bg-sidebar-background border-r border-sidebar-border transition-transform duration-300 ease-in-out z-50 md:z-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Close button for mobile */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 md:hidden"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Sidebar Content */}
        <div className="p-6 h-full overflow-y-auto flex flex-col">
          {/* Stats */}
          <div className="space-y-3 mb-8 mt-8 md:mt-0">
            <Card className="bg-white/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-sidebar-foreground">Dams Monitored</span>
                <span className="font-bold text-primary">{stats.damsMonitored}</span>
              </div>
            </Card>
            <Card className="bg-white/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-sidebar-foreground">Complaints</span>
                <span className="font-bold text-secondary">{stats.complaintsLogged}</span>
              </div>
            </Card>
            <Card className="bg-white/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-sidebar-foreground">Affected Pop.</span>
                <span className="font-bold text-accent text-xs">
                  {(stats.affectedPopulation / 1000000).toFixed(1)}M
                </span>
              </div>
            </Card>
          </div>

          {/* Navigation */}
          <nav className="space-y-2 mb-8">
            <Button asChild variant={activeTab === 'overview' ? 'default' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('overview')}>
              <Link href="/dashboard"><Home className="w-4 h-4 mr-2" />Overview</Link>
            </Button>
            <Button asChild variant={activeTab === 'complaints' ? 'default' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('complaints')}>
              <Link href="/complaints"><MessageSquare className="w-4 h-4 mr-2" />Complaints</Link>
            </Button>
            <Button asChild variant={activeTab === 'documents' ? 'default' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('documents')}>
              <Link href="/projects"><FileText className="w-4 h-4 mr-2" />Documents</Link>
            </Button>
            <Button asChild variant={activeTab === 'profile' ? 'default' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('profile')}>
              <Link href="/profile"><Home className="w-4 h-4 mr-2" />Profile</Link>
            </Button>
          </nav>

          {/* Info Box */}
          <Card className="bg-primary/5 border-primary/20 p-4 mt-auto">
            <h3 className="font-semibold text-sm text-card-foreground mb-2">About TerraTrace</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              TerraTrace provides transparent monitoring of dam projects and their impact on displaced populations using satellite imagery and public data.
            </p>
          </Card>
        </div>
      </aside>
    </>
  );
};
