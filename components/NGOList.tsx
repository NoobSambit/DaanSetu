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
      {ngos.map((ngo, index) => (
        <Link
          key={ngo.id}
          href={`/ngos/${ngo.id}`}
          className="card p-6 block hover-lift group"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-xl font-semibold text-slate-900 flex-1 group-hover:text-blue-600 transition-colors">
              {ngo.name}
            </h3>
            <span className={`badge ${categoryColors[ngo.category]} ml-2 shrink-0`}>
              {categoryEmojis[ngo.category]}
            </span>
          </div>

          <p className="text-slate-600 text-sm mb-4 line-clamp-3 leading-relaxed">
            {ngo.description}
          </p>

          <div className="flex items-center text-sm text-slate-500">
            <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{ngo.city}, {ngo.state}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
