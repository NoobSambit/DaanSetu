interface LeaderboardEntry {
  rank: number;
  name: string;
  subtitle: string;
  badge: string | null;
}

interface LeaderboardSectionProps {
  title: string;
  description: string;
  icon: string;
  entries: LeaderboardEntry[];
  emptyMessage: string;
}

export default function LeaderboardSection({
  title,
  description,
  icon,
  entries,
  emptyMessage,
}: LeaderboardSectionProps) {
  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  return (
    <section className="panel overflow-hidden">
      {/* Section Header */}
      <div className="border-b bg-slate-50 px-5 py-4 sm:px-6">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
      </div>

      {/* Entries List */}
      <div className="divide-y divide-slate-200">
        {entries.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          entries.map((entry) => (
            <article
              key={entry.rank}
              className={`flex items-center space-x-4 px-5 py-4 transition sm:px-6 ${
                entry.rank <= 3 ? "bg-amber-50" : "hover:bg-slate-50"
              }`}
            >
              {/* Rank/Medal */}
              <div className="flex-shrink-0 w-12 text-center">
                {getMedalEmoji(entry.rank) ? (
                  <span className="text-2xl">{getMedalEmoji(entry.rank)}</span>
                ) : (
                  <span className="text-lg font-bold text-gray-400">
                    #{entry.rank}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {entry.name}
                </p>
                <p className="text-sm text-gray-600">{entry.subtitle}</p>
              </div>

              {/* Badge */}
              {entry.badge && (
                <div className="flex-shrink-0">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {entry.badge}
                  </span>
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
