interface CampaignProgressProps {
  currentAmount: number
  goalAmount: number
  progress: number
  daysRemaining: number
}

export default function CampaignProgress({
  currentAmount,
  goalAmount,
  progress,
  daysRemaining,
}: CampaignProgressProps) {
  return (
    <div className="border-2 border-gray-200 rounded-lg p-6">
      {/* Amounts */}
      <div className="flex justify-between items-baseline mb-2">
        <div>
          <span className="text-3xl font-bold text-gray-900">
            ₹{currentAmount.toLocaleString('en-IN')}
          </span>
          <span className="text-gray-600 ml-2">raised</span>
        </div>
        <span className="text-lg text-gray-600">
          of ₹{goalAmount.toLocaleString('en-IN')}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
        <div
          className="bg-blue-600 h-3 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-blue-600">{progress.toFixed(0)}%</p>
          <p className="text-sm text-gray-600">Funded</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-600">
            {daysRemaining > 0 ? daysRemaining : 0}
          </p>
          <p className="text-sm text-gray-600">
            {daysRemaining > 0 ? 'Days Left' : 'Campaign Ended'}
          </p>
        </div>
      </div>
    </div>
  )
}
