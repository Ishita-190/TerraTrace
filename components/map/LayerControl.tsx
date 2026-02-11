'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layers, Satellite, Map as MapIcon, Eye, EyeOff } from 'lucide-react';

interface LayerControlProps {
  onLayerChange: (layer: 'street' | 'satellite' | 'change-detection') => void;
  currentLayer: 'street' | 'satellite' | 'change-detection';
  onToggleComplaintLayer?: (visible: boolean) => void;
  showComplaintLayer?: boolean;
}

export const LayerControl: React.FC<LayerControlProps> = ({
  onLayerChange,
  currentLayer,
  onToggleComplaintLayer,
  showComplaintLayer = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const layers = [
    { id: 'street', name: 'Street Map', icon: MapIcon, description: 'Standard OSM' },
    { id: 'satellite', name: 'Satellite', icon: Satellite, description: 'Esri World Imagery' },
    { id: 'change-detection', name: 'Sentinel-2 Analysis', icon: Layers, description: 'Sentinel-2 Analysis' },
  ];

  return (
    <div className="absolute top-4 left-24 z-[401] w-72">
      <Card className="bg-white/95 backdrop-blur-sm shadow-lg overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors border-b border-border"
        >
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">Map Layers</span>
          </div>
          <span className="text-xs text-muted-foreground">{isExpanded ? '−' : '+'}</span>
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="p-4 space-y-3 border-b border-border">
            {/* Base Layers */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase">Base Layer</h4>
              {layers.map((layer) => {
                const LayerIcon = layer.icon;
                const isSelected = currentLayer === layer.id;
                return (
                  <button
                    key={layer.id}
                    onClick={() => onLayerChange(layer.id as 'street' | 'satellite' | 'change-detection')}
                    className={`w-full p-2 rounded flex items-start space-x-2 transition-colors ${
                      isSelected
                        ? 'bg-primary/10 border border-primary/30'
                        : 'hover:bg-muted/50 border border-transparent'
                    }`}
                  >
                    <LayerIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="text-left flex-1 min-w-0">
                      <div className="text-sm font-medium text-card-foreground">{layer.name}</div>
                      <div className="text-xs text-muted-foreground">{layer.description}</div>
                    </div>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                  </button>
                );
              })}
            </div>

            {/* Overlay Layers */}
            <div className="pt-3 space-y-2 border-t border-border">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase">Overlays</h4>
              <button
                onClick={() => onToggleComplaintLayer?.(!showComplaintLayer)}
                className={`w-full p-2 rounded flex items-center justify-between transition-colors ${
                  showComplaintLayer
                    ? 'bg-accent/10 border border-accent/30'
                    : 'hover:bg-muted/50 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {showComplaintLayer ? (
                    <Eye className="w-4 h-4 text-accent" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium text-card-foreground">Complaint Hotspots</span>
                </div>
                <div className={`w-3 h-3 rounded ${showComplaintLayer ? 'bg-accent' : 'bg-muted'}`} />
              </button>
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className="p-3 bg-muted/20 text-xs text-muted-foreground">
          <p>Currently viewing: <span className="font-medium text-card-foreground">{layers.find(l => l.id === currentLayer)?.name}</span></p>
        </div>
      </Card>
    </div>
  );
};
