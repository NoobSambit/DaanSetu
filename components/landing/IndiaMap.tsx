"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Custom icon using L.divIcon to avoid Next.js static asset issues with default leaflet markers
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: "custom-leaflet-icon",
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

const markers = [
  { id: 1, position: [28.6139, 77.209] as [number, number], color: "#3b82f6", label: "Delhi" },
  { id: 2, position: [19.076, 72.8777] as [number, number], color: "#ef4444", label: "Mumbai" },
  { id: 3, position: [12.9716, 77.5946] as [number, number], color: "#22c55e", label: "Bangalore" },
  { id: 4, position: [22.5726, 88.3639] as [number, number], color: "#f59e0b", label: "Kolkata" },
  { id: 5, position: [17.385, 78.4867] as [number, number], color: "#a855f7", label: "Hyderabad" },
  { id: 6, position: [23.0225, 72.5714] as [number, number], color: "#f97316", label: "Ahmedabad" },
  { id: 7, position: [13.0827, 80.2707] as [number, number], color: "#06b6d4", label: "Chennai" },
  { id: 8, position: [26.9124, 75.7873] as [number, number], color: "#ec4899", label: "Jaipur" },
];

export default function IndiaMap() {
  // Bounding box for India to prevent panning outside
  const indiaBounds = L.latLngBounds(
    [6.5, 68.0], // South-West
    [35.5, 97.5] // North-East
  );

  return (
    <div className="w-full h-full rounded-[24px] overflow-hidden relative" style={{ zIndex: 0 }}>
      <style>{`
        /* Apply a subtle blue/slate tint to the map tiles to match the landing page theme */
        .theme-tiles {
          filter: grayscale(0.8) sepia(0.2) hue-rotate(180deg) brightness(0.95) contrast(1.1);
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
        }
        .leaflet-control-zoom a {
          color: #1e3a8a !important;
          background-color: #ffffff !important;
        }
        .leaflet-control-zoom a:hover {
          background-color: #f8fafc !important;
          color: #2563eb !important;
        }
      `}</style>
      <MapContainer
        center={[22.5937, 78.9629]}
        zoom={4.5}
        minZoom={4}
        maxZoom={10}
        maxBounds={indiaBounds}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true}
        zoomControl={true}
        zoomSnap={0.5}
        style={{ height: "100%", width: "100%", zIndex: 0, backgroundColor: "#f0f4f8" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          className="theme-tiles"
        />
        {markers.map((marker) => (
          <Marker 
            key={marker.id} 
            position={marker.position} 
            icon={createCustomIcon(marker.color)}
          >
            <Popup>
              <div className="text-xs font-semibold">{marker.label}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Overlay gradient to blend edges slightly (optional) */}
      <div className="absolute inset-0 pointer-events-none rounded-[24px] shadow-inner" style={{ zIndex: 10 }}></div>
    </div>
  );
}
