'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { NGO, NGOCategory } from '@/lib/types/database.types'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface NGOMapProps {
  ngos: NGO[]
  center?: [number, number]
  zoom?: number
}

// Fix for default marker icons in Next.js
const createCustomIcon = (category: NGOCategory) => {
  const colors: Record<NGOCategory, string> = {
    education: '#3b82f6',
    food: '#10b981',
    health: '#ef4444',
    women: '#a855f7',
    animals: '#f97316',
  }

  const color = colors[category]

  return new Icon({
    iconUrl: `data:image/svg+xml,${encodeURIComponent(`
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <path fill="${color}" d="M16 2C11.03 2 7 6.03 7 11c0 5.25 9 17 9 17s9-11.75 9-17c0-4.97-4.03-9-9-9zm0 12.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
      </svg>
    `)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })
}

export default function NGOMap({ ngos, center, zoom = 6 }: NGOMapProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Default center to India if no center provided
  const defaultCenter: [number, number] = center || [20.5937, 78.9629]

  // Don't render map on server side
  if (!isMounted) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    )
  }

  const categoryEmojis: Record<NGOCategory, string> = {
    education: '📚',
    food: '🍲',
    health: '🏥',
    women: '👩',
    animals: '🐾',
  }

  return (
    <MapContainer
      center={defaultCenter}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {ngos.map((ngo) => (
        <Marker
          key={ngo.id}
          position={[ngo.latitude, ngo.longitude]}
          icon={createCustomIcon(ngo.category)}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{ngo.name}</h3>
                <span className="text-lg ml-2">
                  {categoryEmojis[ngo.category]}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {ngo.description}
              </p>
              <div className="text-xs text-gray-500 mb-3">
                📍 {ngo.city}, {ngo.state}
              </div>
              <Link
                href={`/ngos/${ngo.id}`}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View Details →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
