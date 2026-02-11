'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Check, AlertCircle, Loader } from 'lucide-react';

interface ExtractedData {
  compensation?: {
    amounts: string[];
    terms: string[];
  };
  affectedPopulation: string[];
  timeline: string[];
  environmentalImpact: string[];
  summary?: Record<string, boolean>;
}

interface Document {
  id: string;
  title: string;
  type: string;
  status: string;
  uploadedAt: string;
  extractedData?: ExtractedData;
}

interface DocumentViewerProps {
  targetType?: 'dam' | 'forest';
  targetId?: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ targetType = 'dam', targetId }) => {
   const [documents, setDocuments] = useState<Document[]>([]);
   const [loading, setLoading] = useState(true);
   const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
 
   useEffect(() => {
    setLoading(true);
    const fetchDocuments = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
        let url = `${apiUrl}/documents`;
        if (!targetId) {
          setDocuments([]);
          setLoading(false);
          return;
        }
        url += targetType === 'dam' ? `?damId=${targetId}` : `?forestId=${targetId}`;

        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
          setDocuments(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [targetType, targetId]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <Card className="p-6 text-center">
        <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <Card
          key={doc.id}
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setSelectedDoc(selectedDoc?.id === doc.id ? null : doc)}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-start gap-3 flex-1">
              <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-card-foreground line-clamp-1">
                  {doc.title}
                </h3>
                <p className="text-xs text-muted-foreground">{doc.type}</p>
              </div>
            </div>

            {doc.status === 'processed' ? (
              <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : doc.status === 'pending' ? (
              <Loader className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
          </div>

          {/* Expanded Details */}
          {selectedDoc?.id === doc.id && doc.extractedData && (
            <div className="mt-4 pt-4 border-t border-border space-y-3">
              {/* Compensation Info */}
              {doc.extractedData.compensation?.amounts && doc.extractedData.compensation.amounts.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">
                    Compensation Amounts
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {doc.extractedData.compensation.amounts.slice(0, 3).map((amount, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {amount}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Affected Population */}
              {doc.extractedData.affectedPopulation && doc.extractedData.affectedPopulation.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">
                    Population Impact
                  </h4>
                  <div className="space-y-1">
                    {doc.extractedData.affectedPopulation.slice(0, 2).map((pop, idx) => (
                      <p key={idx} className="text-xs text-card-foreground">
                        {pop}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              {doc.extractedData.timeline && doc.extractedData.timeline.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">
                    Key Dates
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {doc.extractedData.timeline.slice(0, 3).map((date, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {date}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Environmental Impact */}
              {doc.extractedData.environmentalImpact && doc.extractedData.environmentalImpact.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">
                    Environmental Concerns
                  </h4>
                  <p className="text-xs text-card-foreground line-clamp-2">
                    {doc.extractedData.environmentalImpact[0]}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground mt-2">
            {new Date(doc.uploadedAt).toLocaleDateString()}
          </div>
        </Card>
      ))}
    </div>
  );
};
