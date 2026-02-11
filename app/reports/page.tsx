"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

interface Dam {
  id: string;
  name: string;
  affectedPopulation: number;
  displacementPercentage: number;
}

interface Forest {
  id: string;
  name: string;
  coveragePercent?: number;
}

interface MetricData {
  name: string;
  displacement?: number;
  affected?: number;
  coverage?: number;
}

export default function ReportsPage() {
  const [source, setSource] = useState<"dam" | "forest">("dam");
  const [dams, setDams] = useState<Dam[]>([]);
  const [forests, setForests] = useState<Forest[]>([]);
  const [metric, setMetric] = useState<string>("displacement");
  // Add loading state to improve UX while fetching
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
    setLoading(true);
    (async () => {
      try {
        console.log('[Reports] Fetching from:', apiUrl);
        const [dRes, fRes] = await Promise.all([
          fetch(`${apiUrl}/dams`),
          fetch(`${apiUrl}/forests`),
        ]);
        
        console.log('[Reports] Dams response status:', dRes.status);
        console.log('[Reports] Forests response status:', fRes.status);
        
        const [dJson, fJson] = await Promise.all([dRes.json(), fRes.json()]);
        
        console.log('[Reports] Dams JSON:', dJson);
        console.log('[Reports] Forests JSON:', fJson);
        
        if (dJson.success) setDams(dJson.data);
        if (fJson.success) setForests(fJson.data);
      } catch (err) {
        console.error("Failed to fetch reports data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cleanedData = useMemo(() => {
    if (source === "dam") {
      return dams
        .map((d) => ({ name: d.name, displacement: d.displacementPercentage ?? 0, affected: Math.round((d.affectedPopulation ?? 0) / 1000) }))
        .filter((row) => row.displacement > 0 || row.affected > 0);
    } else {
      return forests
        .map((f) => ({ name: f.name, coverage: Math.round(((f.coveragePercent ?? 0)) * 100) / 100 }))
        .filter((row) => row.coverage > 0);
    }
  }, [source, dams, forests]);

  const data = useMemo(() => {
    const rows = cleanedData;
    if (source === "dam") {
      const key = metric as "displacement" | "affected";
      return rows
        .sort((a, b) => {
          const aValue = key === "displacement" ? (a as any).displacement : (a as any).affected;
          const bValue = key === "displacement" ? (b as any).displacement : (b as any).affected;
          return (bValue || 0) - (aValue || 0);
        })
        .slice(0, 15);
    }
    return rows
      .sort((a, b) => ((b as any).coverage || 0) - ((a as any).coverage || 0))
      .slice(0, 15);
  }, [source, metric, cleanedData]);

  // Reset metric when source changes
  useEffect(() => {
    if (source === "forest") setMetric("coverage");
    else if (metric === "coverage") setMetric("displacement");
  }, [source]);

  const chartConfig = {
    displacement: { label: "Displacement %", color: "hsl(var(--chart-1))" },
    affected: { label: "Affected (K)", color: "hsl(var(--chart-2))" },
    coverage: { label: "Forest Coverage %", color: "hsl(var(--chart-3))" },
  } as const;

  // Summary statistics
  const summary = useMemo(() => {
    if (source === "dam") {
      const count = dams.length;
      const avgDisplacement = count
        ? Math.round(dams.reduce((s, d) => s + (d.displacementPercentage || 0), 0) / count)
        : 0;
      const totalAffectedK = Math.round(dams.reduce((s, d) => s + (d.affectedPopulation || 0), 0) / 1000);
      const top = [...dams].sort((a, b) => (b.displacementPercentage || 0) - (a.displacementPercentage || 0))[0];
      return {
        count,
        avgDisplacement,
        totalAffectedK,
        topDisplacement: top?.displacementPercentage || 0,
        topName: top?.name || "",
      };
    } else {
      const count = forests.length;
      const avgCoverage = count
        ? Math.round(forests.reduce((s, f) => s + (f.coveragePercent || 0), 0) / count)
        : 0;
      const top = [...forests].sort((a, b) => (b.coveragePercent || 0) - (a.coveragePercent || 0))[0];
      return {
        count,
        avgCoverage,
        topCoverage: top?.coveragePercent || 0,
        topName: top?.name || "",
      };
    }
  }, [source, dams, forests]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto p-4 space-y-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">{source === "dam" ? "Projects" : "Forests"}</p>
            <p className="text-2xl font-semibold">{source === "dam" ? dams.length : forests.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">
              {source === "dam" ? "Average Displacement" : "Average Coverage"}
            </p>
            <p className="text-2xl font-semibold">
              {source === "dam" ? `${summary.avgDisplacement}%` : `${summary.avgCoverage}%`}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">
              {source === "dam" ? "Total Affected (K)" : "Top Coverage"}
            </p>
            <p className="text-2xl font-semibold">
              {source === "dam" ? `${summary.totalAffectedK}K` : `${(summary as any).topCoverage ?? 0}%`}
            </p>
          </Card>
        </div>

        {/* Chart + Controls */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-sm">Project Impact Reports</h2>
              <Select value={source} onValueChange={(v) => setSource(v as "dam" | "forest")}> 
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dam">Dam</SelectItem>
                  <SelectItem value="forest">Forest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                {source === "dam" ? (
                  <>
                    <SelectItem value="displacement">Displacement %</SelectItem>
                    <SelectItem value="affected">Affected Population (K)</SelectItem>
                  </>
                ) : (
                  <SelectItem value="coverage">Forest Coverage %</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="h-[50vh] w-full grid grid-rows-1">
              <div className="h-full w-full bg-muted rounded-md animate-pulse" />
            </div>
          ) : data.length === 0 ? (
            <div className="h-[50vh] w-full flex items-center justify-center text-sm text-muted-foreground">
              No data available for the selected metric.
            </div>
          ) : (
            <ChartContainer
              config={{
                [metric]: { label: chartConfig[metric as keyof typeof chartConfig].label, color: chartConfig[metric as keyof typeof chartConfig].color },
              }}
              className="h-[50vh] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-10} height={60} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey={metric} fill={chartConfig[metric as keyof typeof chartConfig].color} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}

          {/* Summary paragraphs */}
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            {source === "dam" ? (
              <>
                <p>
                  Analyzing {summary.count} dam projects, the average displacement is {summary.avgDisplacement}% with a cumulative affected population of approximately {summary.totalAffectedK}K.
                </p>
                {summary.topName && (
                  <p>
                    The most impactful project by displacement is {summary.topName}, registering {(summary as any).topDisplacement}% displacement.
                  </p>
                )}
                <p>
                  These figures highlight the varying social impacts across regions; further analysis can correlate displacement with compensation measures and resettlement outcomes.
                </p>
              </>
            ) : (
              <>
                <p>
                  Across {summary.count} forests, average coverage stands at {summary.avgCoverage}% with % highest coverage observed at {(summary as any).topCoverage ?? 0}%.
                </p>
                {summary.topName && (
                  <p>
                    {summary.topName} exhibits the strongest coverage among the sampled sites, indicating relatively stable vegetation density.
                  </p>
                )}
                <p>
                  Trends in coverage provide indicators of ecological health; combining satellite-derived coverage with field data can contextualize conservation priorities.
                </p>
              </>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}