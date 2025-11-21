import Link from 'next/link'
import type { NGO, NGOCategory } from '@/lib/types/database.types'

interface NGOListProps {
  ngos: NGO[]
}

const categoryEmojis: Record<NGOCategory, string> = {
  education: '📚',
  food: '🍲',
  health: '🏥',
  women: '👩',
  animals: '🐾',
}

const categoryColors: Record<NGOCategory, string> = {
  education: 'bg-blue-100 text-blue-800',
  food: 'bg-green-100 text-green-800',
  health: 'bg-red-100 text-red-800',
  women: 'bg-purple-100 text-purple-800',
  animals: 'bg-orange-100 text-orange-800',
}

export default function NGOList({ ngos }: NGOListProps) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {ngos.map((ngo) => (
        <Link
          key={ngo.id}
          href={`/ngos/${ngo.id}`}
          className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-6 block"
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-semibold text-gray-900 flex-1">
              {ngo.name}
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${categoryColors[ngo.category]} ml-2 shrink-0`}>
              {categoryEmojis[ngo.category]}
            </span>
          </div>

          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {ngo.description}
          </p>

          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {ngo.city}, {ngo.state}
          </div>
        </Link>
      ))}
    </div>
  )
}
