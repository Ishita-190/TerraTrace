'use client';

import React from 'react';

// Remove direct Leaflet require; accept L as a parameter from caller

interface SatelliteLayerProps {
  map: any;
  isVisible: boolean;
}

export const initSatelliteLayer = (L: any, map: any): any => {
  if (!map || !L) return null;

  // Sentinel-2 satellite imagery via USGS
  const satelliteLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      attribution:
        'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEE, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 18,
      minZoom: 1,
    }
  );

  return satelliteLayer;
};

export const initStreetLayer = (L: any, map: any): any => {
  if (!map || !L) return null;

  const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  });

  return streetLayer;
};

// Sentinel-2 Analysis layer (previously change detection)
export const initChangeDetectionLayer = (L: any, map: any): any => {
  if (!map || !L) return null;

  // Use a noticeable style layer for Sentinel-2 analysis (placeholder)
  const changeLayer = L.tileLayer(
    'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    {
      attribution: '© OpenTopoMap contributors',
      maxZoom: 17,
      minZoom: 1,
    }
  );

  return changeLayer;
};

// New forest cover layer
export const initForestLayer = (L: any, map: any): any => {
  if (!map || !L) return null;

  // Global Forest Change tiles (placeholder public tileset for demo)
  const forestLayer = L.tileLayer(
    'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    {
      attribution: '© OpenStreetMap, HOT OSM',
      maxZoom: 19,
    }
  );

  return forestLayer;
};
