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
    <div className="gradient-card border-2 border-slate-200 rounded-xl p-6 shadow-sm">
      {/* Amounts */}
      <div className="flex justify-between items-baseline mb-3">
        <div>
          <span className="text-3xl md:text-4xl font-bold text-slate-900">
            ₹{currentAmount.toLocaleString('en-IN')}
          </span>
          <span className="text-slate-600 ml-2 text-sm font-medium">raised</span>
        </div>
        <span className="text-base text-slate-600 font-medium">
          of ₹{goalAmount.toLocaleString('en-IN')}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 rounded-full h-3 mb-6 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-6 text-center">
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
          <p className="text-3xl font-bold text-blue-600">{progress.toFixed(0)}%</p>
          <p className="text-sm text-slate-600 font-medium mt-1">Funded</p>
        </div>
        <div className={`p-3 rounded-lg ${daysRemaining > 0 ? 'bg-green-50 border border-green-100' : 'bg-slate-100 border border-slate-200'}`}>
          <p className={`text-3xl font-bold ${daysRemaining > 0 ? 'text-green-600' : 'text-slate-600'}`}>
            {daysRemaining > 0 ? daysRemaining : 0}
          </p>
          <p className="text-sm text-slate-600 font-medium mt-1">
            {daysRemaining > 0 ? 'Days Left' : 'Campaign Ended'}
          </p>
        </div>
      </div>
    </div>
  )
}
