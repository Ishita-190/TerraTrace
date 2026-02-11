'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, Send, Loader } from 'lucide-react';
import { toast } from 'sonner';

interface ComplaintFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedType?: 'dam' | 'forest';
  targetId?: string;
  targetName?: string;
  onComplaintSubmitted?: () => void;
}

interface FormData {
  title: string;
  description: string;
  category: string;
  complainantName: string;
  contactInfo: string;
}

export const ComplaintForm: React.FC<ComplaintFormProps> = ({
  open,
  onOpenChange,
  selectedType = 'dam',
  targetId,
  targetName,
  onComplaintSubmitted,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: 'displacement',
    complainantName: '',
    contactInfo: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!targetId) {
    toast.error('Please select a dam/forest first');
       return;
     }

    if (!formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
      const response = await fetch(`${apiUrl}/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(selectedType === 'dam' ? { damId: targetId } : { forestId: targetId }),
          title: formData.title,
          description: formData.description,
          category: formData.category,
          complainantName: formData.complainantName || 'Anonymous',
          contactInfo: formData.contactInfo,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit complaint');

      const result = await response.json();
      
      if (result.success) {
        toast.success('Complaint submitted successfully!');
        setFormData({
          title: '',
          description: '',
          category: 'displacement',
          complainantName: '',
          contactInfo: '',
        });
        onOpenChange(false);
        onComplaintSubmitted?.();
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast.error('Failed to submit complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-accent" />
            Log a Complaint
          </DialogTitle>
          <DialogDescription>
            {targetName ? `Report an issue related to ${targetName}` : `Report an issue related to a ${selectedType} project`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Title <span className="text-accent">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Brief summary of the issue"
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-card-foreground"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-card-foreground"
            >
              <option value="displacement">Displacement</option>
              <option value="compensation">Compensation</option>
              <option value="environmental">Environmental</option>
              <option value="water-access">Water Access</option>
              <option value="health">Health & Safety</option>
              <option value="livelihood">Livelihood Impact</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Description <span className="text-accent">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detailed description of the issue"
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-card-foreground resize-none"
            />
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Your Name
              </label>
              <input
                type="text"
                name="complainantName"
                value={formData.complainantName}
                onChange={handleChange}
                placeholder="Optional - leave blank for anonymous"
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-card-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Contact Email/Phone
              </label>
              <input
                type="text"
                name="contactInfo"
                value={formData.contactInfo}
                onChange={handleChange}
                placeholder="Optional - for follow-up"
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-card-foreground"
              />
            </div>
          </div>

          {/* Privacy Notice */}
          <Card className="bg-primary/5 border-primary/20 p-3">
            <p className="text-xs text-muted-foreground">
              Your complaint will be documented and can be submitted anonymously. Your data is protected and only used for this investigation.
            </p>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 pt-4 sticky bottom-0 bg-background py-3">
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
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Complaint
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
