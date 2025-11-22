'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DonationModal from './DonationModal'
import Toast from './Toast'

interface DonateButtonProps {
  ngoId: string
  ngoName: string
  isAuthenticated: boolean
  campaignId?: string
  campaignTitle?: string
}

export default function DonateButton({
  ngoId,
  ngoName,
  isAuthenticated,
  campaignId,
  campaignTitle,
}: DonateButtonProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const handleDonateClick = () => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/ngos/' + ngoId)
      return
    }
    setIsModalOpen(true)
  }

  const handleDonationSuccess = () => {
    setIsModalOpen(false)
    setToast({
      message: 'Thank you! Your donation was successful.',
      type: 'success',
    })
  }

  return (
    <>
      <button
        onClick={handleDonateClick}
        className="btn btn-primary px-6 py-3 font-semibold shadow-md hover:shadow-lg"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Donate Now
      </button>

      {isAuthenticated && (
        <DonationModal
          ngoId={ngoId}
          ngoName={ngoName}
          campaignId={campaignId}
          campaignTitle={campaignTitle}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleDonationSuccess}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={!!toast}
          onClose={() => setToast(null)}
        />
      )}
    </>
  )
}
