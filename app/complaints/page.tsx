"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ComplaintForm } from "@/components/complaints/ComplaintForm";
import { ComplaintsList } from "@/components/complaints/ComplaintsList";
import { DocumentUpload } from "@/components/documents/DocumentUpload";
import { DocumentViewer } from "@/components/documents/DocumentViewer";
import { AlertCircle, MessageSquare } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function ComplaintsEvidencePage() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [source, setSource] = useState<"dam" | "forest">("dam");
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    setProjectName("");
  }, [source]);

  const isValidProject = projectName.trim().length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto p-4 space-y-4">
        <div className="text-center py-6">
          <h1 className="text-3xl font-bold mb-2">
            Complaints & Evidence Portal
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Submit complaints and upload evidence for dam and forest projects.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Card */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">
                  Submit Complaint & Evidence
                </h2>
                <p className="text-sm text-muted-foreground">
                  Report issues and upload documents
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Project Type */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Project Type
                </label>
                <Select
                  value={source}
                  onValueChange={(value: "dam" | "forest") =>
                    setSource(value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dam">Dam Project</SelectItem>
                    <SelectItem value="forest">Forest Area</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Project Name Input */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {source === "dam" ? "Dam Name" : "Forest Name"}
                </label>

                <Input
                  placeholder={
                    source === "dam"
                      ? "Enter dam name..."
                      : "Enter forest name..."
                  }
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />

                {isValidProject && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => setComplaintOpen(true)}
                    >
                      Submit Complaint
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setUploadOpen(true)}
                    >
                      Upload Evidence
                    </Button>
                  </div>
                )}
              </div>

              {/* Show Data Only After Valid Input */}
              {isValidProject && (
                <div className="space-y-4 mt-6">
                  <ComplaintsList
                    targetType={source}
                    targetId={projectName.trim()}
                  />
                  <DocumentViewer
                    targetType={source}
                    targetId={projectName.trim()}
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Guidelines Card */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-lime-100 dark:bg-lime-900 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-lime-600 dark:text-lime-400" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Guidelines</h2>
                <p className="text-sm text-muted-foreground">
                  How to contribute
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-medium mb-2 text-sm">
                  Submitting Complaints
                </h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>Provide detailed descriptions</li>
                  <li>Include specific locations</li>
                  <li>Submit anonymously if preferred</li>
                </ul>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-medium mb-2 text-sm">
                  Uploading Evidence
                </h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>RTI responses</li>
                  <li>Government reports</li>
                  <li>Photos and videos</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Modals */}
      <DocumentUpload
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        selectedType={source}
        targetId={projectName.trim() || undefined}
        targetName={projectName.trim() || undefined}
      />

      <ComplaintForm
        open={complaintOpen}
        onOpenChange={setComplaintOpen}
        selectedType={source}
        targetId={projectName.trim() || undefined}
        targetName={projectName.trim() || undefined}
      />
    </div>
  );
}
