export interface NgoProfileState {
  status: 'idle' | 'success' | 'error'
  message?: string
  fieldErrors?: Record<string, string>
  nextStep?: number
  completionPercentage?: number
  verificationId?: string
}

export const INITIAL_NGO_PROFILE_STATE: NgoProfileState = { status: 'idle' }
