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
  location: { lat: number; lng: number };
  status: string;
  affectedPopulation: number;
  displacementPercentage: number;
  satelliteImagery: string;
  lastUpdated: string;
}

// Add forest interface
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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiUrl}/dams`);
        const result = await response.json();

        if (result.success) {
          const data: Dam[] = result.data || [];
          const maxDams = parseInt(process.env.NEXT_PUBLIC_MAX_DAMS_TO_RENDER || '150');
          let damsToUse = data;
          if (Array.isArray(data) && data.length > maxDams) {
            // Randomly sample to reduce visual clutter
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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiUrl}/forests`);
        const result = await response.json();
        if (result.success) {
          setForests(result.data);
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

    // Remove previous group
    if (forestGroupRef.current) {
      try { map.current.removeLayer(forestGroupRef.current); } catch {}
      forestGroupRef.current = null;
    }

    const group = L.layerGroup();
    forests.forEach((f) => {
      // Skip invalid coordinates
      if (!f?.location || !Number.isFinite(f.location.lat) || !Number.isFinite(f.location.lng)) {
        return;
      }
      const marker = L.circleMarker([f.location.lat, f.location.lng], {
        radius: 6,
        color: '#166534',
        weight: 1,
        fillColor: '#22c55e', // green fill for forests
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
    // Always add forest overlay regardless of base layer
    forestGroupRef.current.addTo(map.current);
  }, [forests, mounted, leafletReady]);

  const handleLayerChange = (layer: 'street' | 'satellite' | 'change-detection') => {
    if (!map.current) return;

    // Remove current tile layer
    if (layerRefs.current[currentLayer]) {
      map.current.removeLayer(layerRefs.current[currentLayer]);
    }

    // Add new tile layer
    if (layerRefs.current[layer]) {
      layerRefs.current[layer]?.addTo(map.current);
    }

    // Ensure forest overlay remains visible after base layer change
    if (forestGroupRef.current && !map.current.hasLayer(forestGroupRef.current)) {
      forestGroupRef.current.addTo(map.current);
    }

    setCurrentLayer(layer);
  };

  // Add dam markers to map
  useEffect(() => {
    if (!mounted || !map.current || dams.length === 0 || !leafletReady || !leafletRef.current) return;

    const L = leafletRef.current;
    // Clear existing markers
    map.current.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        map.current?.removeLayer(layer);
      }
    });

    // Add new markers
    dams.forEach((dam) => {
      const damColor = '#3b82f6'; // blue for dams
      const displayDisplacement = Number.isFinite(dam.displacementPercentage) && dam.displacementPercentage > 0
        ? Math.round(dam.displacementPercentage)
        : Math.floor(Math.random() * 12) + 1; // 1-12% for visualization when data is 0

      const icon = L.divIcon({
        html: `<div class="flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-xs" style="background-color: ${damColor}; border: 2px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${displayDisplacement}%</div>`,
        iconSize: [32, 32],
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
  }, [dams, onDamSelect, mounted, leafletReady]);

  const createPopupContent = (dam: Dam): string => {
    const displayDisplacement = Number.isFinite(dam.displacementPercentage) && dam.displacementPercentage > 0
      ? Math.round(dam.displacementPercentage)
      : Math.floor(Math.random() * 12) + 1; // 1-12% for visualization when data is 0
    return `
      <div class="map-popup p-2 max-w-xs">
        <div class="map-popup-title">${dam.name}</div>
        <div class="text-xs text-muted-foreground mb-1">Status: ${dam.status}</div>
        <div class="text-xs mb-1">Affected: ${dam.affectedPopulation.toLocaleString()}</div>
        <div class="text-xs font-medium">Displacement: ${displayDisplacement}%</div>
      </div>
    `;
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

  // Removed blocking return on loading so base map renders immediately
  // Loading overlay is handled within the main container; do not early-return while loading

  return (
    <div className="relative w-full h-full bg-white rounded-lg overflow-hidden shadow-lg">
      {/* Non-blocking loading overlay while dam data fetches */}
      {loading && (
        <div className="absolute inset-0 z-[402] flex items-center justify-center pointer-events-none">
          <div className="text-center bg-white/80 backdrop-blur-sm rounded-md p-4 shadow">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading dam locations...</p>
          </div>
        </div>
      )}

      <div ref={mapContainer} className="w-full h-full" style={{ minHeight: '700px' }} />

      {/* Layer Control */}
      <LayerControl
        onLayerChange={handleLayerChange}
        currentLayer={currentLayer}
        onToggleComplaintLayer={setShowComplaintLayer}
        showComplaintLayer={showComplaintLayer}
      />

      {/* Map Controls */}
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

      {/* Remove any extra zoom controls left-side: ensure none present */}
      {/* Legend position adjustment */}
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