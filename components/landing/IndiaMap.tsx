"use client";

import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import type { LandingNgo } from "@/lib/landing/repository";

const categoryColors: Record<string, string> = {
  education: "#3b82f6",
  health: "#ef4444",
  food: "#f59e0b",
  women: "#a855f7",
  environment: "#22c55e",
  animals: "#f97316",
  other: "#64748b",
};

function createCustomIcon(color: string) {
  return L.divIcon({
    className: "custom-leaflet-icon",
    html: `<div style="background-color:${color};width:14px;height:14px;border-radius:50%;border:2.5px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export default function IndiaMap({ ngos }: { ngos: LandingNgo[] }) {
  const indiaBounds = L.latLngBounds([6.5, 68], [35.5, 97.5]);
  const locations = ngos.filter(
    (ngo) =>
      ngo.latitude !== null &&
      ngo.longitude !== null &&
      Number.isFinite(ngo.latitude) &&
      Number.isFinite(ngo.longitude),
  );

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-[24px]"
      style={{ zIndex: 0 }}
    >
      <MapContainer
        center={[22.5937, 78.9629]}
        zoom={4.5}
        minZoom={4}
        maxZoom={10}
        maxBounds={indiaBounds}
        maxBoundsViscosity={1}
        scrollWheelZoom
        zoomControl
        zoomSnap={0.5}
        style={{
          height: "100%",
          width: "100%",
          zIndex: 0,
          backgroundColor: "#f0f4f8",
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((ngo) => (
          <Marker
            key={ngo.id}
            position={[ngo.latitude!, ngo.longitude!]}
            icon={createCustomIcon(
              categoryColors[ngo.category ?? "other"] ?? categoryColors.other,
            )}
          >
            <Popup>
              <div className="text-xs font-semibold">{ngo.name}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {locations.length === 0 && (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 z-[500] rounded-lg bg-white/95 p-3 text-center text-xs font-semibold text-slate-600 shadow">
          Published NGO locations will appear here.
        </div>
      )}
    </div>
  );
}
