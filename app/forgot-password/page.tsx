import type { Metadata } from 'next'

import AuthShell from '@/components/auth/AuthShell'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'

export const metadata: Metadata = {
  title: 'Recover password | DaanSetu',
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Recover your account"
      description="Enter your email and we will send a secure password reset link."
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
