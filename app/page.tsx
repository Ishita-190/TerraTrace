'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { InteractiveMap } from '@/components/map/InteractiveMap';

export default function Home() {

  return (
    <div className="min-h-screen bg-background">
      <Header />


      <main className="flex-1 overflow-hidden">
        <div className="relative h-[calc(100vh-64px)]">
          <InteractiveMap />
        </div>
      </main>
    </div>
  );
}
