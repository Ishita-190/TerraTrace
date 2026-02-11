'use client';

import React, { useEffect, useMemo, useState, useDeferredValue } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, AlertCircle } from 'lucide-react';

interface Complaint {
  id: string;
  damId: string;
  title: string;
  description: string;
  category: string;
  status: string;
  createdAt: string;
}

interface ComplaintsListProps {
  targetType?: 'dam' | 'forest';
  targetId?: string;
  limit?: number;
}

const categoryColors: Record<string, string> = {
  displacement: 'bg-red-100 text-red-800',
  compensation: 'bg-orange-100 text-orange-800',
  environmental: 'bg-green-100 text-green-800',
  'water-access': 'bg-blue-100 text-blue-800',
  health: 'bg-purple-100 text-purple-800',
  livelihood: 'bg-yellow-100 text-yellow-800',
  other: 'bg-gray-100 text-gray-800',
};

const statusColors: Record<string, string> = {
  open: 'bg-amber-100 text-amber-800',
  'in-review': 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

export const ComplaintsList: React.FC<ComplaintsListProps> = ({ targetType = 'dam', targetId, limit = 5 }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = limit;

  useEffect(() => {
    setLoading(true);
    const controller = new AbortController();
    const fetchComplaints = async () => {
      try {
        if (!targetId) {
          setComplaints([]);
          setLoading(false);
          return;
        }
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
        let url = `${apiUrl}/complaints`;
        url += targetType === 'dam' ? `?damId=${targetId}` : `?forestId=${targetId}`;

        const response = await fetch(url, { signal: controller.signal });
        const result = await response.json();

        if (result.success) {
          // Store full dataset and handle slicing via pagination to reduce re-renders
          setComplaints(result.data || []);
        }
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          console.error('Failed to fetch complaints:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
    return () => controller.abort();
  }, [targetType, targetId]);

  // Reset pagination when source target changes or page size changes
  useEffect(() => {
    setPage(1);
  }, [targetId, limit]);

  const visibleComplaints = useMemo(() => {
    return complaints.slice(0, page * pageSize);
  }, [complaints, page, pageSize]);

  const deferredVisibleComplaints = useDeferredValue(visibleComplaints);
  const hasMore = deferredVisibleComplaints.length < complaints.length;

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (complaints.length === 0) {
    return (
      <Card className="p-6 text-center">
        <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No complaints yet for this project</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Complaints</h3>
        <span className="text-xs text-muted-foreground">{complaints.length} total</span>
      </div>
      {deferredVisibleComplaints.map((complaint) => (
        <Card key={complaint.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-accent flex-shrink-0" />
                <h3 className="font-medium text-sm text-card-foreground line-clamp-1">
                  {complaint.title}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {complaint.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`text-xs ${categoryColors[complaint.category] || categoryColors.other}`}>
              {complaint.category}
            </Badge>
            <Badge className={`text-xs ${statusColors[complaint.status] || statusColors.open}`}>
              {complaint.status}
            </Badge>
            <span className="text-xs text-muted-foreground ml-auto">
              {new Date(complaint.createdAt).toLocaleDateString()}
            </span>
          </div>
        </Card>
      ))}
      {hasMore && (
        <div className="pt-2">
          <button
            className="w-full text-xs px-3 py-2 rounded-md border border-input hover:bg-muted"
            onClick={() => setPage((p) => p + 1)}
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
};
