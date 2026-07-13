"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { NGO, NGOCategory } from "@/lib/types/database.types";
import Link from "next/link";
import { useEffect, useState } from "react";

interface NGOMapProps {
  ngos: NGO[];
  center?: [number, number];
  zoom?: number;
}

// Fix for default marker icons in Next.js
const createCustomIcon = (category: NGOCategory) => {
  const colors: Record<NGOCategory, string> = {
    education: "#3b82f6",
    food: "#10b981",
    health: "#ef4444",
    women: "#a855f7",
    animals: "#f97316",
    children: "#06b6d4",
    environment: "#16a34a",
    livelihoods: "#ca8a04",
    disability: "#6366f1",
    "disaster-relief": "#dc2626",
    elderly: "#78716c",
    "human-rights": "#9333ea",
    "rural-development": "#65a30d",
    "arts-culture": "#db2777",
    other: "#64748b",
  };

  const color = colors[category];

  return new Icon({
    iconUrl: `data:image/svg+xml,${encodeURIComponent(`
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <path fill="${color}" d="M16 2C11.03 2 7 6.03 7 11c0 5.25 9 17 9 17s9-11.75 9-17c0-4.97-4.03-9-9-9zm0 12.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
      </svg>
    `)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export default function NGOMap({ ngos, center, zoom = 6 }: NGOMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Default center to India if no center provided
  const defaultCenter: [number, number] = center || [20.5937, 78.9629];

  // Don't render map on server side
  if (!isMounted) {
    return (
      <div className="w-full h-full bg-slate-100 flex items-center justify-center rounded-xl">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin h-8 w-8 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <div className="text-slate-600 font-medium">Loading map...</div>
        </div>
      </div>
    );
  }

  const categoryEmojis: Record<NGOCategory, string> = {
    education: "📚",
    food: "🍲",
    health: "🏥",
    women: "👩",
    animals: "🐾",
    children: "CH",
    environment: "EN",
    livelihoods: "LI",
    disability: "DI",
    "disaster-relief": "DR",
    elderly: "EL",
    "human-rights": "HR",
    "rural-development": "RD",
    "arts-culture": "AC",
    other: "NG",
  };

  return (
    <MapContainer
      center={defaultCenter}
      zoom={zoom}
      style={{ height: "100%", width: "100%", borderRadius: "0.75rem" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {ngos
        .filter(
          (ngo) =>
            Number.isFinite(ngo.latitude) && Number.isFinite(ngo.longitude),
        )
        .map((ngo) => (
          <Marker
            key={ngo.id}
            position={[ngo.latitude, ngo.longitude]}
            icon={createCustomIcon(ngo.category)}
          >
            <Popup>
              <div className="p-3 min-w-[220px]">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-slate-900 text-base">
                    {ngo.name}
                  </h3>
                  <span className="text-xl ml-2">
                    {categoryEmojis[ngo.category]}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-3 line-clamp-2 leading-relaxed">
                  {ngo.description}
                </p>
                <div className="text-xs text-slate-500 mb-3 font-medium">
                  📍 {ngo.city}, {ngo.state}
                </div>
                <Link
                  href={`/ngos/${ngo.id}`}
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-semibold"
                >
                  View Details
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
