'use client'

import { useState } from 'react'
import { exportNGOReport } from '@/lib/services/analytics'

interface DownloadReportButtonProps {
  ngoId: string
  ngoName: string
}

export default function DownloadReportButton({ ngoId, ngoName }: DownloadReportButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    try {
      setLoading(true)

      // Fetch report data
      const reportData = await exportNGOReport(ngoId)

      // Convert to CSV
      const headers = ['Type', 'Title', 'Goal/Applications', 'Raised', 'Created', 'Deadline']
      const csvRows = [headers.join(',')]

      reportData.forEach((row: any) => {
        if (row.type === 'Campaign') {
          csvRows.push([
            row.type,
            `"${row.title}"`,
            row.goal,
            row.raised,
            row.created,
            row.deadline || '',
          ].join(','))
        } else {
          csvRows.push([
            row.type,
            `"${row.title}"`,
            row.applications || 0,
            '',
            row.created,
            '',
          ].join(','))
        }
      })

      const csvContent = csvRows.join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${ngoName.replace(/[^a-z0-9]/gi, '_')}_impact_report.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading report:', error)
      alert('Failed to download report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Generating...
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download Impact Report (CSV)
        </>
      )}
    </button>
  )
}
