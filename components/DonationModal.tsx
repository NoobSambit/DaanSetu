'use client'

import { useState } from 'react'
import { createDonation, createSubscription } from '@/lib/services/donations'
import type { DonationCause } from '@/lib/types/database.types'

interface DonationModalProps {
  ngoId: string
  ngoName: string
  campaignId?: string
  campaignTitle?: string
  initiativeId?: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const PRESET_AMOUNTS = [100, 500, 1000, 5000]

const CAUSES: { value: DonationCause; label: string; emoji: string }[] = [
  { value: 'education', label: 'Education', emoji: '📚' },
  { value: 'hunger', label: 'Hunger Relief', emoji: '🍲' },
  { value: 'healthcare', label: 'Healthcare', emoji: '🏥' },
  { value: 'disaster', label: 'Disaster Relief', emoji: '🆘' },
  { value: 'general', label: 'General', emoji: '💝' },
]

export default function DonationModal({
  ngoId,
  ngoName,
  campaignId,
  campaignTitle,
  initiativeId,
  isOpen,
  onClose,
  onSuccess,
}: DonationModalProps) {
  const [amount, setAmount] = useState<string>('')
  const [customAmount, setCustomAmount] = useState<string>('')
  const [cause, setCause] = useState<DonationCause>('general')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [cadence, setCadence] = useState<'once' | 'monthly' | 'quarterly' | 'yearly'>('once')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleAmountSelect = (value: number) => {
    setAmount(value.toString())
    setCustomAmount('')
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    setAmount(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const donationAmount = parseFloat(amount)

    if (!donationAmount || donationAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (donationAmount < 10) {
      setError('Minimum donation amount is ₹10')
      return
    }

    setIsProcessing(true)

    try {
      const donation = {
        ngoId,
        amount: donationAmount,
        cause,
        isAnonymous,
        campaignId,
        initiativeId,
      }
      if (cadence === 'once') await createDonation(donation)
      else await createSubscription({ ...donation, cadence })

      // Success!
      onSuccess()
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process donation')
    } finally {
      setIsProcessing(false)
    }
  }

  const resetForm = () => {
    setAmount('')
    setCustomAmount('')
    setCause('general')
    setIsAnonymous(false)
    setCadence('once')
    setError(null)
  }

  const handleClose = () => {
    if (!isProcessing) {
      resetForm()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900">Make a Donation</h2>
            <p className="text-sm text-slate-600 mt-1.5">to {ngoName}</p>
            {campaignTitle && (
              <p className="text-sm text-blue-600 mt-1 font-medium">
                for: {campaignTitle}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-600 disabled:opacity-50 p-1 rounded-lg hover:bg-slate-100 transition-colors ml-2"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Amount Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              Donation Amount
            </label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleAmountSelect(preset)}
                  disabled={isProcessing}
                  className={`py-2.5 px-3 rounded-lg border-2 font-semibold transition-all ${
                    amount === preset.toString()
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                  } disabled:opacity-50`}
                >
                  ₹{preset}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">
                ₹
              </span>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                placeholder="Enter custom amount"
                disabled={isProcessing}
                className="input pl-8"
              />
            </div>
          </div>

          {/* Cause Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              Select Cause
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CAUSES.map((causeOption) => (
                <button
                  key={causeOption.value}
                  type="button"
                  onClick={() => setCause(causeOption.value)}
                  disabled={isProcessing}
                  className={`py-2.5 px-3 rounded-lg border-2 font-medium transition-all text-sm ${
                    cause === causeOption.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                  } disabled:opacity-50`}
                >
                  <span className="mr-1">{causeOption.emoji}</span>
                  {causeOption.label}
                </button>
              ))}
            </div>
          </div>

          {/* Anonymous Toggle */}
          <div><label className="block text-sm font-semibold text-slate-900 mb-2">Giving frequency</label><select value={cadence} onChange={(event)=>setCadence(event.target.value as typeof cadence)} className="input"><option value="once">One time</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option></select></div>
          <div className="flex items-center p-3 rounded-lg bg-slate-50 border border-slate-200">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              disabled={isProcessing}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 disabled:opacity-50"
            />
            <label htmlFor="anonymous" className="ml-3 text-sm text-slate-700 font-medium">
              Make this donation anonymous
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isProcessing}
              className="btn btn-secondary flex-1 py-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || !amount}
              className="btn btn-primary flex-1 py-3 font-semibold shadow-md hover:shadow-lg"
            >
              {isProcessing ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
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
                  Processing...
                </>
              ) : (
                `Donate ₹${amount || 0}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
