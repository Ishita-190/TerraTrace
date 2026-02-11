'use client';

import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, Upload, Loader, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedType?: 'dam' | 'forest';
  targetId?: string;
  targetName?: string;
  onDocumentUploaded?: () => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  open,
  onOpenChange,
  selectedType = 'dam',
  targetId,
  targetName,
  onDocumentUploaded,
}) => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('pdf');
  const [title, setTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Only PDF, TXT, and DOC files are allowed');
        return;
      }

      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.split('.')[0]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetId) {
      toast.error('Please select a dam/forest first');
      return;
    }

    if (!file || !title) {
      toast.error('Please select a file and enter a title');
      return;
    }

    setLoading(true);

    try {
      // In a real application, you would upload the file to cloud storage
      // and get a URL back. For now, we'll simulate this.
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
      const response = await fetch(`${apiUrl}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(selectedType === 'dam' ? { damId: targetId } : { forestId: targetId }),
          title,
          type: documentType,
          documentUrl: `uploads/${targetId}/${file.name}`,
        }),
      });

      if (!response.ok) throw new Error('Failed to upload document');

      const result = await response.json();

      if (result.success) {
        toast.success('Document uploaded successfully! NLP processing started.');
        setFile(null);
        setTitle('');
        onOpenChange(false);
        onDocumentUploaded?.();
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2 text-primary" />
            Upload Document
          </DialogTitle>
          <DialogDescription>
            {targetName ? `Upload RTI, PDF, or compensation documents for ${targetName}` : 'Upload RTI, PDF, or compensation documents'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Document Type */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Document Type
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-card-foreground"
            >
              <option value="pdf">PDF Document</option>
              <option value="rti">RTI Response</option>
              <option value="report">Government Report</option>
              <option value="compensation">Compensation Scheme</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Document Title <span className="text-accent">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Compensation Scheme 2024"
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-card-foreground"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Select File <span className="text-accent">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.txt,.doc,.docx"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-input rounded-lg p-6 hover:border-primary transition-colors text-center"
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium text-card-foreground">
                {file ? file.name : 'Click to select or drag and drop'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">PDF, TXT, DOC up to 10MB</p>
            </button>
          </div>

          {/* NLP Processing Info */}
          <Card className="bg-primary/5 border-primary/20 p-3">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-card-foreground mb-1">NLP Processing</p>
                <p>Documents will be automatically analyzed to extract compensation information and key terms related to displacement.</p>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !file}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload & Process
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
