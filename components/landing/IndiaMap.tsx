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

export default function IndiaMap({ markers }: { markers: Array<{ id: string; latitude: number; longitude: number; name: string }> }) {
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
            position={[marker.latitude, marker.longitude]}
            icon={createCustomIcon("#2563eb")}
          >
            <Popup>
              <div className="text-xs font-semibold">{marker.name}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Overlay gradient to blend edges slightly (optional) */}
      <div className="absolute inset-0 pointer-events-none rounded-[24px] shadow-inner" style={{ zIndex: 10 }}></div>
    </div>
  );
}
