"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DocumentViewer } from "@/components/documents/DocumentViewer";
import { DocumentUpload } from "@/components/documents/DocumentUpload";
import { ComplaintForm } from "@/components/complaints/ComplaintForm";
import { ComplaintsList } from "@/components/complaints/ComplaintsList";
import { AlertCircle, FileText, MessageSquare } from "lucide-react";

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

export default function ProjectDetailsPage() {
  const params = useParams();
  const damId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const [dam, setDam] = useState<Dam | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [complaintOpen, setComplaintOpen] = useState(false);

  useEffect(() => {
    const fetchDam = async () => {
      if (!damId) return;
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const res = await fetch(`${apiUrl}/dams/${damId}`);
        const result = await res.json();
        if (result.success) {
          setDam(result.data);
        }
      } catch (err) {
        console.error("Failed to fetch dam:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDam();
  }, [damId]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto p-4 space-y-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <Card key={i} className="h-24 bg-muted animate-pulse" />
            ))}
          </div>
        ) : dam ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <h2 className="font-semibold text-sm mb-2">{dam.name}</h2>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="font-medium capitalize">{dam.status}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Affected</span><span className="font-medium">{dam.affectedPopulation.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Displacement</span><span className="font-medium">{dam.displacementPercentage}%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Last Updated</span><span>{new Date(dam.lastUpdated).toLocaleDateString()}</span></div>
                </div>
              </Card>
              <Card className="p-4">
                <h2 className="font-semibold text-sm mb-2 flex items-center"><FileText className="w-4 h-4 mr-2 text-primary" />Documents</h2>
                <div className="space-y-2">
                  <Button size="sm" variant="outline" onClick={() => setUploadOpen(true)} className="w-full">Upload Document</Button>
                  <DocumentViewer damId={dam.id} />
                </div>
              </Card>
              <Card className="p-4">
                <h2 className="font-semibold text-sm mb-2 flex items-center"><AlertCircle className="w-4 h-4 mr-2 text-accent" />Complaints</h2>
                <div className="space-y-2">
                  <Button size="sm" variant="outline" onClick={() => setComplaintOpen(true)} className="w-full">Log Complaint</Button>
                  <ComplaintsList damId={dam.id} />
                </div>
              </Card>
            </div>
          </>
        ) : (
          <Card className="p-6 text-center">
            <AlertCircle className="w-8 h-8 text-accent mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Dam not found</p>
          </Card>
        )}
      </main>

      <DocumentUpload open={uploadOpen} onOpenChange={setUploadOpen} damId={dam?.id} damName={dam?.name} />
      <ComplaintForm open={complaintOpen} onOpenChange={setComplaintOpen} damId={dam?.id} damName={dam?.name} />
    </div>
  );
}