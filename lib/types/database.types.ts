export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      ngos: {
        Row: {
          id: string
          name: string
          description: string
          city: string
          state: string
          category: 'education' | 'food' | 'health' | 'women' | 'animals'
          latitude: number
          longitude: number
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          city: string
          state: string
          category: 'education' | 'food' | 'health' | 'women' | 'animals'
          latitude: number
          longitude: number
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          city?: string
          state?: string
          category?: 'education' | 'food' | 'health' | 'women' | 'animals'
          latitude?: number
          longitude?: number
          created_at?: string
          user_id?: string
        }
      }
      users: {
        Row: {
          id: string
          name: string
          email: string
          role: 'user' | 'ngo' | 'admin'
          created_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          role?: 'user' | 'ngo' | 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: 'user' | 'ngo' | 'admin'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type NGO = Database['public']['Tables']['ngos']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type NGOCategory = Database['public']['Tables']['ngos']['Row']['category']
