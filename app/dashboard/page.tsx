"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { InteractiveMap } from "@/components/map/InteractiveMap";
import { Card } from "@/components/ui/card";

interface Dam {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  status: string;
  affectedPopulation: number;
  displacementPercentage: number;
  satelliteImagery: string;
  lastUpdated: string;
}

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    damsMonitored: 0,
    complaintsLogged: 0,
    affectedPopulation: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const [damsRes, complaintsRes] = await Promise.all([
          fetch(`${apiUrl}/dams`),
          fetch(`${apiUrl}/complaints`),
        ]);
        const damsData = await damsRes.json();
        const complaintsData = await complaintsRes.json();
        if (damsData.success) {
          const affectedPop = damsData.data.reduce(
            (sum: number, dam: Dam) => sum + dam.affectedPopulation,
            0
          );
          setStats({
            damsMonitored: damsData.data.length,
            complaintsLogged: complaintsData.data?.length || 0,
            affectedPopulation: affectedPop,
          });
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex h-[calc(100vh-64px)]">
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <p className="text-xs text-muted-foreground">Dams Monitored</p>
                <p className="text-2xl font-semibold">{stats.damsMonitored}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground">Complaints Logged</p>
                <p className="text-2xl font-semibold">{stats.complaintsLogged}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground">Affected Population</p>
                <p className="text-2xl font-semibold">{(stats.affectedPopulation / 1000).toFixed(0)}K</p>
              </Card>
            </div>
            <div className="h-[80vh]">
              <InteractiveMap />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}