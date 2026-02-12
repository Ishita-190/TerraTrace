'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, MapPin, TrendingUp } from 'lucide-react';
import { LayerControl } from './LayerControl';
import { initSatelliteLayer, initStreetLayer, initChangeDetectionLayer } from './SatelliteLayer';

interface Dam {
  id: string;
  name: string;
  reservoirName?: string;
  river?: string;
  country?: string;
  usage?: string;
  location: { lat: number; lng: number };
  year?: number;
  height?: number;
  length?: number;
  area?: number;
  status?: string;
}

interface Forest {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  coveragePercent?: number;
}

interface InteractiveMapProps {
  onDamSelect?: (dam: Dam | null) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ onDamSelect }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const [dams, setDams] = useState<Dam[]>([]);
  const [forests, setForests] = useState<Forest[]>([]);
  const forestGroupRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [selectedDam, setSelectedDam] = useState<Dam | null>(null);
  const [currentLayer, setCurrentLayer] = useState<'street' | 'satellite' | 'change-detection'>('street');
  const [showComplaintLayer, setShowComplaintLayer] = useState(false);
  const layerRefs = useRef<any>({
    street: null,
    satellite: null,
    'change-detection': null,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Dynamically load Leaflet on client
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = await import('leaflet');
        if (!cancelled) {
          leafletRef.current = (mod as any).default || mod;
          setLeafletReady(true);
        }
      } catch (err) {
        console.error('Failed to load Leaflet:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mounted || !mapContainer.current || map.current || !leafletReady || !leafletRef.current) return;

    const L = leafletRef.current;
    const centerLat = parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LAT || '23.1815');
    const centerLng = parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LNG || '79.9864');

    try {
      map.current = L.map(mapContainer.current, { zoomControl: false }).setView([centerLat, centerLng], 5);

      // Initialize all tile layers
      layerRefs.current.street = initStreetLayer(L, map.current);
      layerRefs.current.satellite = initSatelliteLayer(L, map.current);
      layerRefs.current['change-detection'] = initChangeDetectionLayer(L, map.current);

      // Add default street layer
      if (layerRefs.current.street) {
        layerRefs.current.street.addTo(map.current);
      }

      // Clear selection when clicking on map background
      map.current.on('click', () => {
        setSelectedDam(null);
        onDamSelect?.(null);
      });
    } catch (error) {
      console.error('Map initialization error:', error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mounted, leafletReady]);

  // Fetch dams from backend
  useEffect(() => {
    const fetchDams = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        const response = await fetch(`${apiUrl}/dams?limit=500`);
        const result = await response.json();

        if (result.success) {
          const data: Dam[] = result.data || [];
          const maxDams = parseInt(process.env.NEXT_PUBLIC_MAX_DAMS_TO_RENDER || '500');
          let damsToUse = data;
          if (Array.isArray(data) && data.length > maxDams) {
            damsToUse = [...data].sort(() => Math.random() - 0.5).slice(0, maxDams);
          }
          setDams(damsToUse);
        }
      } catch (error) {
        console.error('Failed to fetch dams:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDams();
  }, []);

  // Fetch forests from backend
  useEffect(() => {
    const fetchForests = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        const response = await fetch(`${apiUrl}/forest-coverage`);
        const result = await response.json();
        if (result.success) {
          // Transform forest coverage data to map points with proper state names
          const forestData = result.data.map((forest: any) => ({
            id: forest.id,
            name: forest.state,
            location: { 
              lat: 20.5937 + (Math.random() - 0.5) * 10, // Approximate center of India with some randomization
              lng: 78.9629 + (Math.random() - 0.5) * 10 
            },
            coveragePercent: forest.changePercent ? parseFloat(forest.changePercent) : null,
            coverage: forest.coverage,
            change: forest.change,
            changePercent: forest.changePercent
          }));
          setForests(forestData);
        }
      } catch (error) {
        console.error('Failed to fetch forests:', error);
      }
    };
    fetchForests();
  }, []);

  // Build forest overlay layer group when forests are loaded
  useEffect(() => {
    if (!mounted || !map.current || forests.length === 0 || !leafletReady || !leafletRef.current) return;
    const L = leafletRef.current;

    if (forestGroupRef.current) {
      try { map.current.removeLayer(forestGroupRef.current); } catch {}
      forestGroupRef.current = null;
    }

    const group = L.layerGroup();
    forests.forEach((f) => {
      if (!f?.location || !Number.isFinite(f.location.lat) || !Number.isFinite(f.location.lng)) {
        return;
      }
      const marker = L.circleMarker([f.location.lat, f.location.lng], {
        radius: 6,
        color: '#166534',
        weight: 1,
        fillColor: '#22c55e',
        fillOpacity: 0.7,
      }).bindPopup(`
        <div class="map-popup p-2 max-w-xs">
          <div class="map-popup-title">${f.name || 'Forest'}</div>
          ${typeof f.coveragePercent === 'number' ? `<div class="text-xs">Coverage: ${f.coveragePercent}%</div>` : ''}
        </div>
      `);
      marker.addTo(group);
    });

    forestGroupRef.current = group;
    forestGroupRef.current.addTo(map.current);
  }, [forests, mounted, leafletReady]);

  // Add dam markers to map
  useEffect(() => {
    console.log('[Map] Dams effect triggered');
    console.log('[Map] Dams state length:', dams.length);
    console.log('[Map] Mounted:', mounted);
    console.log('[Map] Leaflet ready:', leafletReady);
    console.log('[Map] Map exists:', !!map.current);
    
    if (!mounted || !map.current || dams.length === 0 || !leafletReady || !leafletRef.current) {
      console.log('[Map] Early return - conditions not met');
      return;
    }

    console.log('[Map] Adding dam markers to map...');
    const L = leafletRef.current;
    
    // Clear existing markers
    map.current.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        map.current?.removeLayer(layer);
      }
    });

    // Create bounds for auto-fitting
    const bounds = L.latLngBounds([]);
    let validDams = 0;

    // Add new markers
    dams.forEach((dam) => {
      if (!Number.isFinite(dam.location.lat) || !Number.isFinite(dam.location.lng)) {
        console.log('[Map] Skipping dam with invalid coordinates:', dam.name);
        return;
      }
      
      validDams++;
      bounds.extend([dam.location.lat, dam.location.lng]);
      
      const damColor = '#3b82f6';
      const displayValue = dam.height ? Math.round(dam.height) : (dam.area ? Math.round(dam.area) : Math.floor(Math.random() * 100) + 1);

      const icon = L.divIcon({
        html: `<div class="flex items-center justify-center w-5 h-5 rounded-full text-white font-bold text-xs" style="background-color: ${damColor}; border: 2px solid #ffffff; box-shadow: 0 1px 4px rgba(0,0,0,0.3);">${displayValue}</div>`,
        iconSize: [20, 20],
        className: 'custom-marker',
      });

      const marker = L.marker([dam.location.lat, dam.location.lng], { icon })
        .bindPopup(createPopupContent(dam))
        .addTo(map.current!);

      marker.on('click', () => {
        setSelectedDam(dam);
        onDamSelect?.(dam);
      });
    });

    console.log(`[Map] Added ${validDams} dam markers`);
    
    // Auto-fit map to show all dams
    if (validDams > 0 && bounds.isValid()) {
      console.log('[Map] Auto-fitting map to dam bounds');
      map.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [dams, onDamSelect, mounted, leafletReady]);

  const createPopupContent = (dam: Dam): string => {
    return `
      <div class="map-popup p-2 max-w-xs">
        <div class="map-popup-title">${dam.name}</div>
        ${dam.country ? `<div class="text-xs text-muted-foreground mb-1">Country: ${dam.country}</div>` : ''}
        ${dam.river ? `<div class="text-xs mb-1">River: ${dam.river}</div>` : ''}
        ${dam.usage ? `<div class="text-xs mb-1">Usage: ${dam.usage}</div>` : ''}
        ${dam.year ? `<div class="text-xs mb-1">Year: ${dam.year}</div>` : ''}
        ${dam.height ? `<div class="text-xs mb-1">Height: ${dam.height}m</div>` : ''}
        ${dam.area ? `<div class="text-xs font-medium">Area: ${dam.area} km²</div>` : ''}
        ${dam.status ? `<div class="text-xs font-medium">Status: ${dam.status}</div>` : ''}
      </div>
    `;
  };

  const handleLayerChange = (layer: 'street' | 'satellite' | 'change-detection') => {
    if (!map.current) return;

    if (layerRefs.current[currentLayer]) {
      map.current.removeLayer(layerRefs.current[currentLayer]);
    }

    if (layerRefs.current[layer]) {
      layerRefs.current[layer]?.addTo(map.current);
    }

    if (forestGroupRef.current && !map.current.hasLayer(forestGroupRef.current)) {
      forestGroupRef.current.addTo(map.current);
    }

    setCurrentLayer(layer);
  };

  const handleZoomIn = () => map.current?.zoomIn();
  const handleZoomOut = () => map.current?.zoomOut();

  if (!mounted) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-white rounded-lg overflow-hidden shadow-lg">
      {loading && (
        <div className="absolute inset-0 z-[402] flex items-center justify-center pointer-events-none">
          <div className="text-center bg-white/80 backdrop-blur-sm rounded-md p-4 shadow">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading dam locations...</p>
          </div>
        </div>
      )}

      <div ref={mapContainer} className="w-full h-full" style={{ minHeight: '700px' }} />

      <LayerControl
        onLayerChange={handleLayerChange}
        currentLayer={currentLayer}
        onToggleComplaintLayer={setShowComplaintLayer}
        showComplaintLayer={showComplaintLayer}
      />

      <div className="absolute top-4 right-4 space-y-2 z-[401]">
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomIn}
          className="bg-white/90 backdrop-blur-sm"
        >
          +
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomOut}
          className="bg-white/90 backdrop-blur-sm"
        >
          −
        </Button>
      </div>

      <div className="absolute bottom-6 right-4 z-[401]">
        <Card className="bg-white/95 backdrop-blur-sm p-3 shadow-lg">
          <h3 className="font-semibold text-sm mb-2 flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-primary" />
            Map Legend
          </h3>
          <div className="space-y-1 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#3b82f6' }} />
              Dams (blue)
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#22c55e' }} />
              Forests (green)
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
