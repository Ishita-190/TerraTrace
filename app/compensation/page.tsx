"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

interface Document {
  id: string;
  title: string;
  type: string;
  status: string;
  uploadedAt: string;
  extractedData?: {
    compensation?: {
      amounts: string[];
      terms: string[];
    };
  };
}

export default function CompensationPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const response = await fetch(`${apiUrl}/documents`);
        const result = await response.json();
        if (result.success) setDocuments(result.data);
      } catch (err) {
        console.error("Failed to fetch documents:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  const processedCount = useMemo(() => documents.filter(d => d.status === "processed").length, [documents]);
  const progressPercent = useMemo(() => documents.length ? Math.round((processedCount / documents.length) * 100) : 0, [documents, processedCount]);

  const rows = useMemo(() => {
    return documents
      .filter(d => d.extractedData?.compensation)
      .map(d => ({
        title: d.title,
        amounts: d.extractedData?.compensation?.amounts?.join(", ") || "-",
        terms: d.extractedData?.compensation?.terms?.slice(0, 3).join(", ") || "-",
        status: d.status,
      }));
  }, [documents]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Documents</p>
            <p className="text-2xl font-semibold">{documents.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Processed</p>
            <p className="text-2xl font-semibold">{processedCount}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-2">Processing Progress</p>
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs mt-1">{progressPercent}%</p>
          </Card>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-sm">Compensation Details Extracted from Documents</h2>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="h-32 bg-muted animate-pulse rounded" />
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No compensation data extracted yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Amounts</TableHead>
                    <TableHead>Key Terms</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{row.title}</TableCell>
                      <TableCell>{row.amounts}</TableCell>
                      <TableCell>{row.terms}</TableCell>
                      <TableCell className="capitalize">{row.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}