'use client'

import { useState } from 'react'
import { createDonation } from '@/lib/services/donations'
import type { DonationCause } from '@/lib/types/database.types'

interface DonationModalProps {
  ngoId: string
  ngoName: string
  campaignId?: string
  campaignTitle?: string
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
  isOpen,
  onClose,
  onSuccess,
}: DonationModalProps) {
  const [amount, setAmount] = useState<string>('')
  const [customAmount, setCustomAmount] = useState<string>('')
  const [cause, setCause] = useState<DonationCause>('general')
  const [isAnonymous, setIsAnonymous] = useState(false)
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
      await createDonation({
        ngoId,
        amount: donationAmount,
        cause,
        isAnonymous,
        campaignId,
      })

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
    setError(null)
  }

  const handleClose = () => {
    if (!isProcessing) {
      resetForm()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Make a Donation</h2>
            <p className="text-sm text-gray-600 mt-1">to {ngoName}</p>
            {campaignTitle && (
              <p className="text-sm text-blue-600 mt-1 font-medium">
                for: {campaignTitle}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Amount Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Donation Amount
            </label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleAmountSelect(preset)}
                  disabled={isProcessing}
                  className={`py-2 px-3 rounded-lg border-2 font-semibold transition ${
                    amount === preset.toString()
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  } disabled:opacity-50`}
                >
                  ₹{preset}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                ₹
              </span>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                placeholder="Enter custom amount"
                disabled={isProcessing}
                className="w-full pl-8 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none disabled:opacity-50 disabled:bg-gray-50"
              />
            </div>
          </div>

          {/* Cause Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Select Cause
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CAUSES.map((causeOption) => (
                <button
                  key={causeOption.value}
                  type="button"
                  onClick={() => setCause(causeOption.value)}
                  disabled={isProcessing}
                  className={`py-2 px-3 rounded-lg border-2 font-medium transition text-sm ${
                    cause === causeOption.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  } disabled:opacity-50`}
                >
                  <span className="mr-1">{causeOption.emoji}</span>
                  {causeOption.label}
                </button>
              ))}
            </div>
          </div>

          {/* Anonymous Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              disabled={isProcessing}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
            />
            <label htmlFor="anonymous" className="ml-2 text-sm text-gray-700">
              Make this donation anonymous
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isProcessing}
              className="flex-1 py-3 px-4 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || !amount}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
