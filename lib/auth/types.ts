export const ACCOUNT_TYPES = ['user', 'ngo', 'corporate'] as const

export type AccountType = (typeof ACCOUNT_TYPES)[number]
export type UserRole = AccountType | 'admin'

export interface AuthActionState {
  status: 'idle' | 'error' | 'success'
  message?: string
  fieldErrors?: Partial<Record<
    'name' | 'email' | 'password' | 'confirmPassword' | 'accountType',
    string
  >>
}

export const INITIAL_AUTH_STATE: AuthActionState = {
  status: 'idle',
}
