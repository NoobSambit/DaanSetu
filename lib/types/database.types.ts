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
      campaigns: {
        Row: {
          id: string
          ngo_id: string
          title: string
          short_description: string
          description: string
          goal_amount: number
          current_amount: number
          deadline: string
          image_url: string | null
          category: 'education' | 'food' | 'health' | 'disaster' | 'women' | 'animals'
          status: 'active' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ngo_id: string
          title: string
          short_description: string
          description: string
          goal_amount: number
          current_amount?: number
          deadline: string
          image_url?: string | null
          category: 'education' | 'food' | 'health' | 'disaster' | 'women' | 'animals'
          status?: 'active' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ngo_id?: string
          title?: string
          short_description?: string
          description?: string
          goal_amount?: number
          current_amount?: number
          deadline?: string
          image_url?: string | null
          category?: 'education' | 'food' | 'health' | 'disaster' | 'women' | 'animals'
          status?: 'active' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      campaign_updates: {
        Row: {
          id: string
          campaign_id: string
          text: string
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          text: string
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          text?: string
          image_url?: string | null
          created_at?: string
        }
      }
      donations: {
        Row: {
          id: string
          user_id: string
          ngo_id: string
          campaign_id: string | null
          amount: number
          cause: 'education' | 'hunger' | 'healthcare' | 'disaster' | 'general'
          is_anonymous: boolean
          payment_status: 'pending' | 'completed' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ngo_id: string
          campaign_id?: string | null
          amount: number
          cause: 'education' | 'hunger' | 'healthcare' | 'disaster' | 'general'
          is_anonymous?: boolean
          payment_status?: 'pending' | 'completed' | 'failed'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          ngo_id?: string
          campaign_id?: string | null
          amount?: number
          cause?: 'education' | 'hunger' | 'healthcare' | 'disaster' | 'general'
          is_anonymous?: boolean
          payment_status?: 'pending' | 'completed' | 'failed'
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
export type Donation = Database['public']['Tables']['donations']['Row']
export type DonationCause = Database['public']['Tables']['donations']['Row']['cause']
export type Campaign = Database['public']['Tables']['campaigns']['Row']
export type CampaignCategory = Database['public']['Tables']['campaigns']['Row']['category']
export type CampaignStatus = Database['public']['Tables']['campaigns']['Row']['status']
export type CampaignUpdate = Database['public']['Tables']['campaign_updates']['Row']
