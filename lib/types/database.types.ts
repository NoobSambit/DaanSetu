export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      action_rate_limits: {
        Row: {
          action: string
          hits: number
          user_id: string
          window_started_at: string
        }
        Insert: {
          action: string
          hits?: number
          user_id: string
          window_started_at: string
        }
        Update: {
          action?: string
          hits?: number
          user_id?: string
          window_started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_rate_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          activity_type: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_flags: {
        Row: {
          confidence: number | null
          content_id: string
          content_type: string
          created_at: string
          id: string
          reason: string
        }
        Insert: {
          confidence?: number | null
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          reason: string
        }
        Update: {
          confidence?: number | null
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          reason?: string
        }
        Relationships: []
      }
      analytics_logs: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_milestones: {
        Row: {
          achieved: boolean | null
          achieved_at: string | null
          campaign_id: string
          created_at: string | null
          description: string | null
          id: string
          milestone_order: number
          reward_description: string | null
          target_paise: number
          title: string
          updated_at: string
        }
        Insert: {
          achieved?: boolean | null
          achieved_at?: string | null
          campaign_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          milestone_order: number
          reward_description?: string | null
          target_paise: number
          title: string
          updated_at?: string
        }
        Update: {
          achieved?: boolean | null
          achieved_at?: string | null
          campaign_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          milestone_order?: number
          reward_description?: string | null
          target_paise?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_milestones_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_updates: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          image_url: string | null
          text: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          text: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_updates_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          approved_at: string | null
          beneficiary: Json
          beneficiary_consent: boolean
          category: string
          created_at: string
          creator_id: string
          deadline: string
          description: string
          evidence: Json
          id: string
          image_url: string | null
          moderation_notes: string | null
          ngo_id: string | null
          payout_account_id: string | null
          published_at: string | null
          raised_paise: number
          short_description: string
          status: string
          target_paise: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          approved_at?: string | null
          beneficiary?: Json
          beneficiary_consent?: boolean
          category: string
          created_at?: string
          creator_id: string
          deadline: string
          description: string
          evidence?: Json
          id?: string
          image_url?: string | null
          moderation_notes?: string | null
          ngo_id?: string | null
          payout_account_id?: string | null
          published_at?: string | null
          raised_paise?: number
          short_description: string
          status?: string
          target_paise: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          approved_at?: string | null
          beneficiary?: Json
          beneficiary_consent?: boolean
          category?: string
          created_at?: string
          creator_id?: string
          deadline?: string
          description?: string
          evidence?: Json
          id?: string
          image_url?: string | null
          moderation_notes?: string | null
          ngo_id?: string | null
          payout_account_id?: string | null
          published_at?: string | null
          raised_paise?: number
          short_description?: string
          status?: string
          target_paise?: number
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "ngos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_payout_account_id_fkey"
            columns: ["payout_account_id"]
            isOneToOne: false
            referencedRelation: "payout_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reports: {
        Row: {
          created_at: string | null
          description: string | null
          entity_id: string
          entity_type: string
          id: string
          reason: string
          reported_by: string
          resolution_notes: string | null
          resolved_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          entity_id: string
          entity_type: string
          id?: string
          reason: string
          reported_by: string
          resolution_notes?: string | null
          resolved_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          reason?: string
          reported_by?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_campaigns: {
        Row: {
          cause: string
          corporate_id: string
          created_at: string | null
          deadline: string
          description: string
          goal_paise: number
          id: string
          image_url: string | null
          raised_paise: number
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          cause: string
          corporate_id: string
          created_at?: string | null
          deadline: string
          description: string
          goal_paise: number
          id?: string
          image_url?: string | null
          raised_paise?: number
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          cause?: string
          corporate_id?: string
          created_at?: string | null
          deadline?: string
          description?: string
          goal_paise?: number
          id?: string
          image_url?: string | null
          raised_paise?: number
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "corporate_campaigns_corporate_id_fkey"
            columns: ["corporate_id"]
            isOneToOne: false
            referencedRelation: "corporate_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_employees: {
        Row: {
          corporate_id: string
          designation: string | null
          email: string
          id: string
          joined_at: string | null
          name: string
          user_id: string | null
        }
        Insert: {
          corporate_id: string
          designation?: string | null
          email: string
          id?: string
          joined_at?: string | null
          name: string
          user_id?: string | null
        }
        Update: {
          corporate_id?: string
          designation?: string | null
          email?: string
          id?: string
          joined_at?: string | null
          name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "corporate_employees_corporate_id_fkey"
            columns: ["corporate_id"]
            isOneToOne: false
            referencedRelation: "corporate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corporate_employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          corporate_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          status: string
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          corporate_id: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          status?: string
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          corporate_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          status?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "corporate_invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corporate_invitations_corporate_id_fkey"
            columns: ["corporate_id"]
            isOneToOne: false
            referencedRelation: "corporate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corporate_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_profiles: {
        Row: {
          company_name: string
          company_size: string
          created_at: string | null
          description: string | null
          id: string
          industry: string
          logo_url: string | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          company_name: string
          company_size: string
          created_at?: string | null
          description?: string | null
          id?: string
          industry: string
          logo_url?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          company_name?: string
          company_size?: string
          created_at?: string | null
          description?: string | null
          id?: string
          industry?: string
          logo_url?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "corporate_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      csr_initiatives: {
        Row: {
          campaign_id: string | null
          corporate_id: string
          created_at: string
          description: string
          ends_at: string
          id: string
          initiative_cap_paise: number | null
          match_percent: number
          per_employee_cap_paise: number | null
          starts_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          campaign_id?: string | null
          corporate_id: string
          created_at?: string
          description: string
          ends_at: string
          id?: string
          initiative_cap_paise?: number | null
          match_percent?: number
          per_employee_cap_paise?: number | null
          starts_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string | null
          corporate_id?: string
          created_at?: string
          description?: string
          ends_at?: string
          id?: string
          initiative_cap_paise?: number | null
          match_percent?: number
          per_employee_cap_paise?: number | null
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "csr_initiatives_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "csr_initiatives_corporate_id_fkey"
            columns: ["corporate_id"]
            isOneToOne: false
            referencedRelation: "corporate_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      csr_match_pledges: {
        Row: {
          allocated_donation_id: string | null
          created_at: string
          donation_id: string
          employee_id: string
          id: string
          initiative_id: string
          matched_paise: number
          status: string
          updated_at: string
        }
        Insert: {
          allocated_donation_id?: string | null
          created_at?: string
          donation_id: string
          employee_id: string
          id?: string
          initiative_id: string
          matched_paise: number
          status?: string
          updated_at?: string
        }
        Update: {
          allocated_donation_id?: string | null
          created_at?: string
          donation_id?: string
          employee_id?: string
          id?: string
          initiative_id?: string
          matched_paise?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "csr_match_pledges_allocated_donation_id_fkey"
            columns: ["allocated_donation_id"]
            isOneToOne: true
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "csr_match_pledges_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: true
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "csr_match_pledges_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "corporate_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "csr_match_pledges_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "csr_initiatives"
            referencedColumns: ["id"]
          },
        ]
      }
      csr_settlement_pledges: {
        Row: {
          pledge_id: string
          settlement_id: string
        }
        Insert: {
          pledge_id: string
          settlement_id: string
        }
        Update: {
          pledge_id?: string
          settlement_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "csr_settlement_pledges_pledge_id_fkey"
            columns: ["pledge_id"]
            isOneToOne: true
            referencedRelation: "csr_match_pledges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "csr_settlement_pledges_settlement_id_fkey"
            columns: ["settlement_id"]
            isOneToOne: false
            referencedRelation: "csr_settlements"
            referencedColumns: ["id"]
          },
        ]
      }
      csr_settlements: {
        Row: {
          amount_paise: number
          corporate_id: string
          created_at: string
          gateway_order_id: string
          gateway_payment_id: string | null
          id: string
          provider: string
          provider_amount_cents: number
          settled_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_paise: number
          corporate_id: string
          created_at?: string
          gateway_order_id: string
          gateway_payment_id?: string | null
          id?: string
          provider?: string
          provider_amount_cents: number
          settled_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_paise?: number
          corporate_id?: string
          created_at?: string
          gateway_order_id?: string
          gateway_payment_id?: string | null
          id?: string
          provider?: string
          provider_amount_cents?: number
          settled_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "csr_settlements_corporate_id_fkey"
            columns: ["corporate_id"]
            isOneToOne: false
            referencedRelation: "corporate_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount_paise: number
          campaign_id: string | null
          captured_at: string | null
          cause: string
          corporate_campaign_id: string | null
          corporate_employee_id: string | null
          corporate_id: string | null
          created_at: string
          csr_initiative_id: string | null
          gateway_order_id: string | null
          gateway_payment_id: string | null
          id: string
          is_anonymous: boolean
          is_csr_match: boolean
          is_demo: boolean
          is_recurring: boolean | null
          metadata: Json
          ngo_id: string | null
          payment_method: string | null
          provider: string
          receipt_number: string | null
          recurring_donation_id: string | null
          refunded_paise: number
          status: string
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount_paise: number
          campaign_id?: string | null
          captured_at?: string | null
          cause: string
          corporate_campaign_id?: string | null
          corporate_employee_id?: string | null
          corporate_id?: string | null
          created_at?: string
          csr_initiative_id?: string | null
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          id?: string
          is_anonymous?: boolean
          is_csr_match?: boolean
          is_demo?: boolean
          is_recurring?: boolean | null
          metadata?: Json
          ngo_id?: string | null
          payment_method?: string | null
          provider?: string
          receipt_number?: string | null
          recurring_donation_id?: string | null
          refunded_paise?: number
          status?: string
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount_paise?: number
          campaign_id?: string | null
          captured_at?: string | null
          cause?: string
          corporate_campaign_id?: string | null
          corporate_employee_id?: string | null
          corporate_id?: string | null
          created_at?: string
          csr_initiative_id?: string | null
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          id?: string
          is_anonymous?: boolean
          is_csr_match?: boolean
          is_demo?: boolean
          is_recurring?: boolean | null
          metadata?: Json
          ngo_id?: string | null
          payment_method?: string | null
          provider?: string
          receipt_number?: string | null
          recurring_donation_id?: string | null
          refunded_paise?: number
          status?: string
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_corporate_campaign_id_fkey"
            columns: ["corporate_campaign_id"]
            isOneToOne: false
            referencedRelation: "corporate_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_corporate_employee_id_fkey"
            columns: ["corporate_employee_id"]
            isOneToOne: false
            referencedRelation: "corporate_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_corporate_id_fkey"
            columns: ["corporate_id"]
            isOneToOne: false
            referencedRelation: "corporate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_csr_initiative_id_fkey"
            columns: ["csr_initiative_id"]
            isOneToOne: false
            referencedRelation: "csr_initiatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "ngos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      donor_tax_profiles: {
        Row: {
          address_ciphertext: string
          consented_at: string
          created_at: string
          id_code: string
          identifier_ciphertext: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_ciphertext: string
          consented_at: string
          created_at?: string
          id_code: string
          identifier_ciphertext: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_ciphertext?: string
          consented_at?: string
          created_at?: string
          id_code?: string
          identifier_ciphertext?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "donor_tax_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_queue: {
        Row: {
          attempts: number | null
          created_at: string | null
          error_message: string | null
          html_body: string
          id: string
          max_attempts: number | null
          metadata: Json | null
          recipient_email: string
          recipient_name: string | null
          sent_at: string | null
          status: string
          subject: string
          template_id: string | null
          text_body: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          html_body: string
          id?: string
          max_attempts?: number | null
          metadata?: Json | null
          recipient_email: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          template_id?: string | null
          text_body?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          html_body?: string
          id?: string
          max_attempts?: number | null
          metadata?: Json | null
          recipient_email?: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          template_id?: string | null
          text_body?: string | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          following_type: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          following_type: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          following_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          moderator_id: string
          reason: string
          report_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          moderator_id: string
          reason: string
          report_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          moderator_id?: string
          reason?: string
          report_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "content_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      ngo_gallery_images: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string
          id: string
          image_path: string
          is_featured: boolean
          ngo_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          id?: string
          image_path: string
          is_featured?: boolean
          ngo_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          id?: string
          image_path?: string
          is_featured?: boolean
          ngo_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ngo_gallery_images_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "ngos"
            referencedColumns: ["id"]
          },
        ]
      }
      ngo_programs: {
        Row: {
          beneficiaries_reached: number | null
          category: string | null
          created_at: string
          description: string | null
          ends_on: string | null
          id: string
          image_path: string | null
          ngo_id: string
          sort_order: number
          starts_on: string | null
          status: string
          summary: string | null
          title: string
          updated_at: string
          volunteers_needed: number | null
        }
        Insert: {
          beneficiaries_reached?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          ends_on?: string | null
          id?: string
          image_path?: string | null
          ngo_id: string
          sort_order?: number
          starts_on?: string | null
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
          volunteers_needed?: number | null
        }
        Update: {
          beneficiaries_reached?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          ends_on?: string | null
          id?: string
          image_path?: string | null
          ngo_id?: string
          sort_order?: number
          starts_on?: string | null
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
          volunteers_needed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ngo_programs_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "ngos"
            referencedColumns: ["id"]
          },
        ]
      }
      ngo_reviews: {
        Row: {
          created_at: string | null
          donation_id: string | null
          helpful_count: number | null
          hidden_at: string | null
          hidden_reason: string | null
          id: string
          is_verified_donor: boolean | null
          moderated_by: string | null
          ngo_id: string
          rating: number
          review_text: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          donation_id?: string | null
          helpful_count?: number | null
          hidden_at?: string | null
          hidden_reason?: string | null
          id?: string
          is_verified_donor?: boolean | null
          moderated_by?: string | null
          ngo_id: string
          rating: number
          review_text?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          donation_id?: string | null
          helpful_count?: number | null
          hidden_at?: string | null
          hidden_reason?: string | null
          id?: string
          is_verified_donor?: boolean | null
          moderated_by?: string | null
          ngo_id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ngo_reviews_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ngo_reviews_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ngo_reviews_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "ngos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ngo_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ngo_service_areas: {
        Row: {
          beneficiaries_reached: number | null
          city: string | null
          created_at: string
          district: string | null
          id: string
          latitude: number | null
          longitude: number | null
          ngo_id: string
          programs_count: number | null
          sort_order: number
          state: string
          updated_at: string
        }
        Insert: {
          beneficiaries_reached?: number | null
          city?: string | null
          created_at?: string
          district?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          ngo_id: string
          programs_count?: number | null
          sort_order?: number
          state: string
          updated_at?: string
        }
        Update: {
          beneficiaries_reached?: number | null
          city?: string | null
          created_at?: string
          district?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          ngo_id?: string
          programs_count?: number | null
          sort_order?: number
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ngo_service_areas_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "ngos"
            referencedColumns: ["id"]
          },
        ]
      }
      ngo_updates: {
        Row: {
          body: string
          created_at: string
          id: string
          image_path: string | null
          ngo_id: string
          published_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          image_path?: string | null
          ngo_id: string
          published_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          image_path?: string | null
          ngo_id?: string
          published_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ngo_updates_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "ngos"
            referencedColumns: ["id"]
          },
        ]
      }
      ngo_verification_documents: {
        Row: {
          created_at: string
          document_type: string
          encrypted_at: string | null
          encryption_version: number | null
          id: string
          mime_type: string
          ngo_id: string
          original_name: string
          size_bytes: number
          storage_path: string
          uploaded_by: string
          verification_id: string
        }
        Insert: {
          created_at?: string
          document_type: string
          encrypted_at?: string | null
          encryption_version?: number | null
          id?: string
          mime_type: string
          ngo_id: string
          original_name: string
          size_bytes: number
          storage_path: string
          uploaded_by: string
          verification_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          encrypted_at?: string | null
          encryption_version?: number | null
          id?: string
          mime_type?: string
          ngo_id?: string
          original_name?: string
          size_bytes?: number
          storage_path?: string
          uploaded_by?: string
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ngo_verification_documents_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "ngos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ngo_verification_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ngo_verification_documents_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "ngo_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      ngo_verifications: {
        Row: {
          created_at: string | null
          documents_verified: boolean | null
          has_12a: boolean
          has_80g: boolean
          has_fcra: boolean
          id: string
          legal_name: string | null
          ngo_darpan_id: string | null
          ngo_id: string
          pan_number: string | null
          registered_address: string | null
          registration_date: string | null
          registration_number: string | null
          registration_type: string | null
          reviewed_at: string | null
          submitted_at: string | null
          updated_at: string | null
          verification_date: string | null
          verification_notes: string | null
          verification_status: string
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          documents_verified?: boolean | null
          has_12a?: boolean
          has_80g?: boolean
          has_fcra?: boolean
          id?: string
          legal_name?: string | null
          ngo_darpan_id?: string | null
          ngo_id: string
          pan_number?: string | null
          registered_address?: string | null
          registration_date?: string | null
          registration_number?: string | null
          registration_type?: string | null
          reviewed_at?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          verification_date?: string | null
          verification_notes?: string | null
          verification_status?: string
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          documents_verified?: boolean | null
          has_12a?: boolean
          has_80g?: boolean
          has_fcra?: boolean
          id?: string
          legal_name?: string | null
          ngo_darpan_id?: string | null
          ngo_id?: string
          pan_number?: string | null
          registered_address?: string | null
          registration_date?: string | null
          registration_number?: string | null
          registration_type?: string | null
          reviewed_at?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          verification_date?: string | null
          verification_notes?: string | null
          verification_status?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ngo_verifications_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "ngos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ngo_verifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ngos: {
        Row: {
          accepts_csr: boolean
          accepts_donations: boolean
          accepts_volunteers: boolean
          address_line_1: string | null
          address_line_2: string | null
          average_rating: number | null
          beneficiaries_reached: number | null
          beneficiary_groups: string[]
          category: string | null
          city: string | null
          communities_served: number | null
          core_values: string[]
          country_code: string | null
          cover_image_path: string | null
          created_at: string
          description: string | null
          display_name: string | null
          founding_year: number | null
          id: string
          impact_areas: string[]
          is_discoverable: boolean
          is_verified: boolean | null
          latitude: number | null
          legal_name: string | null
          logo_path: string | null
          longitude: number | null
          mission: string | null
          name: string | null
          onboarding_step: number
          operating_states: string[]
          organization_type: string | null
          postal_code: string | null
          profile_status: string
          program_summary: string | null
          public_email: string | null
          public_phone: string | null
          published_at: string | null
          social_links: Json
          state: string | null
          tagline: string | null
          tax_exemption_80g: boolean
          team_size: number | null
          theory_of_change: string | null
          total_reviews: number | null
          updated_at: string
          user_id: string
          vision: string | null
          volunteers_engaged: number | null
          website_url: string | null
        }
        Insert: {
          accepts_csr?: boolean
          accepts_donations?: boolean
          accepts_volunteers?: boolean
          address_line_1?: string | null
          address_line_2?: string | null
          average_rating?: number | null
          beneficiaries_reached?: number | null
          beneficiary_groups?: string[]
          category?: string | null
          city?: string | null
          communities_served?: number | null
          core_values?: string[]
          country_code?: string | null
          cover_image_path?: string | null
          created_at?: string
          description?: string | null
          display_name?: string | null
          founding_year?: number | null
          id?: string
          impact_areas?: string[]
          is_discoverable?: boolean
          is_verified?: boolean | null
          latitude?: number | null
          legal_name?: string | null
          logo_path?: string | null
          longitude?: number | null
          mission?: string | null
          name?: string | null
          onboarding_step?: number
          operating_states?: string[]
          organization_type?: string | null
          postal_code?: string | null
          profile_status?: string
          program_summary?: string | null
          public_email?: string | null
          public_phone?: string | null
          published_at?: string | null
          social_links?: Json
          state?: string | null
          tagline?: string | null
          tax_exemption_80g?: boolean
          team_size?: number | null
          theory_of_change?: string | null
          total_reviews?: number | null
          updated_at?: string
          user_id: string
          vision?: string | null
          volunteers_engaged?: number | null
          website_url?: string | null
        }
        Update: {
          accepts_csr?: boolean
          accepts_donations?: boolean
          accepts_volunteers?: boolean
          address_line_1?: string | null
          address_line_2?: string | null
          average_rating?: number | null
          beneficiaries_reached?: number | null
          beneficiary_groups?: string[]
          category?: string | null
          city?: string | null
          communities_served?: number | null
          core_values?: string[]
          country_code?: string | null
          cover_image_path?: string | null
          created_at?: string
          description?: string | null
          display_name?: string | null
          founding_year?: number | null
          id?: string
          impact_areas?: string[]
          is_discoverable?: boolean
          is_verified?: boolean | null
          latitude?: number | null
          legal_name?: string | null
          logo_path?: string | null
          longitude?: number | null
          mission?: string | null
          name?: string | null
          onboarding_step?: number
          operating_states?: string[]
          organization_type?: string | null
          postal_code?: string | null
          profile_status?: string
          program_summary?: string | null
          public_email?: string | null
          public_phone?: string | null
          published_at?: string | null
          social_links?: Json
          state?: string | null
          tagline?: string | null
          tax_exemption_80g?: boolean
          team_size?: number | null
          theory_of_change?: string | null
          total_reviews?: number | null
          updated_at?: string
          user_id?: string
          vision?: string | null
          volunteers_engaged?: number | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ngos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      partnership_requests: {
        Row: {
          corporate_campaign_id: string
          created_at: string | null
          id: string
          message: string | null
          ngo_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          corporate_campaign_id: string
          created_at?: string | null
          id?: string
          message?: string | null
          ngo_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          corporate_campaign_id?: string
          created_at?: string | null
          id?: string
          message?: string | null
          ngo_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partnership_requests_corporate_campaign_id_fkey"
            columns: ["corporate_campaign_id"]
            isOneToOne: false
            referencedRelation: "corporate_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partnership_requests_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "ngos"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          gateway_event_id: string
          id: string
          payload: Json
          processed_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          gateway_event_id: string
          id?: string
          payload: Json
          processed_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          gateway_event_id?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          status?: string
        }
        Relationships: []
      }
      payment_orders: {
        Row: {
          amount_paise: number
          campaign_id: string
          cause: string
          corporate_employee_id: string | null
          created_at: string
          csr_initiative_id: string | null
          donor_id: string
          exchange_rate: number
          expires_at: string
          gateway_order_id: string
          id: string
          is_anonymous: boolean
          is_demo: boolean
          provider: string
          settlement_amount_minor: number
          settlement_currency: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_paise: number
          campaign_id: string
          cause?: string
          corporate_employee_id?: string | null
          created_at?: string
          csr_initiative_id?: string | null
          donor_id: string
          exchange_rate: number
          expires_at: string
          gateway_order_id: string
          id?: string
          is_anonymous?: boolean
          is_demo?: boolean
          provider?: string
          settlement_amount_minor: number
          settlement_currency?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_paise?: number
          campaign_id?: string
          cause?: string
          corporate_employee_id?: string | null
          created_at?: string
          csr_initiative_id?: string | null
          donor_id?: string
          exchange_rate?: number
          expires_at?: string
          gateway_order_id?: string
          id?: string
          is_anonymous?: boolean
          is_demo?: boolean
          provider?: string
          settlement_amount_minor?: number
          settlement_currency?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_orders_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_orders_corporate_employee_id_fkey"
            columns: ["corporate_employee_id"]
            isOneToOne: false
            referencedRelation: "corporate_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_orders_csr_initiative_id_fkey"
            columns: ["csr_initiative_id"]
            isOneToOne: false
            referencedRelation: "csr_initiatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_orders_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transfers: {
        Row: {
          amount_paise: number
          created_at: string
          donation_id: string | null
          failure_reason: string | null
          gateway_transfer_id: string | null
          id: string
          payout_account_id: string
          provider_batch_id: string | null
          provider_item_id: string | null
          reversed_at: string | null
          sender_batch_id: string | null
          sender_item_id: string | null
          settled_at: string | null
          settlement_amount_minor: number | null
          settlement_currency: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_paise: number
          created_at?: string
          donation_id?: string | null
          failure_reason?: string | null
          gateway_transfer_id?: string | null
          id?: string
          payout_account_id: string
          provider_batch_id?: string | null
          provider_item_id?: string | null
          reversed_at?: string | null
          sender_batch_id?: string | null
          sender_item_id?: string | null
          settled_at?: string | null
          settlement_amount_minor?: number | null
          settlement_currency?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_paise?: number
          created_at?: string
          donation_id?: string | null
          failure_reason?: string | null
          gateway_transfer_id?: string | null
          id?: string
          payout_account_id?: string
          provider_batch_id?: string | null
          provider_item_id?: string | null
          reversed_at?: string | null
          sender_batch_id?: string | null
          sender_item_id?: string | null
          settled_at?: string | null
          settlement_amount_minor?: number | null
          settlement_currency?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transfers_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transfers_payout_account_id_fkey"
            columns: ["payout_account_id"]
            isOneToOne: false
            referencedRelation: "payout_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_accounts: {
        Row: {
          activated_at: string | null
          beneficiary: Json
          beneficiary_review_note: string | null
          created_at: string
          gateway_account_id: string | null
          id: string
          ngo_id: string | null
          owner_id: string
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          beneficiary?: Json
          beneficiary_review_note?: string | null
          created_at?: string
          gateway_account_id?: string | null
          id?: string
          ngo_id?: string | null
          owner_id: string
          provider?: string
          status?: string
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          beneficiary?: Json
          beneficiary_review_note?: string | null
          created_at?: string
          gateway_account_id?: string | null
          id?: string
          ngo_id?: string | null
          owner_id?: string
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_accounts_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "ngos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_accounts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_bookmarks: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_views: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string | null
          post_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          post_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          post_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          approved_at: string | null
          author_id: string
          author_role: string
          category: string
          content: string
          created_at: string | null
          featured_at: string | null
          hidden_at: string | null
          hidden_reason: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_impact_story: boolean
          media: Json
          status: string
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          approved_at?: string | null
          author_id: string
          author_role: string
          category: string
          content: string
          created_at?: string | null
          featured_at?: string | null
          hidden_at?: string | null
          hidden_reason?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_impact_story?: boolean
          media?: Json
          status?: string
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          approved_at?: string | null
          author_id?: string
          author_role?: string
          category?: string
          content?: string
          created_at?: string | null
          featured_at?: string | null
          hidden_at?: string | null
          hidden_reason?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_impact_story?: boolean
          media?: Json
          status?: string
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      refund_requests: {
        Row: {
          amount_paise: number
          created_at: string
          donation_id: string
          gateway_refund_id: string | null
          id: string
          reason: string
          requester_id: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_paise: number
          created_at?: string
          donation_id: string
          gateway_refund_id?: string | null
          id?: string
          reason: string
          requester_id: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_paise?: number
          created_at?: string
          donation_id?: string
          gateway_refund_id?: string | null
          id?: string
          reason?: string
          requester_id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refund_requests_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refund_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refund_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_verifications: {
        Row: {
          evidence_url: string | null
          id: string
          skill: string
          user_id: string
          verification_type: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          evidence_url?: string | null
          id?: string
          skill: string
          user_id: string
          verification_type: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          evidence_url?: string | null
          id?: string
          skill?: string
          user_id?: string
          verification_type?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_verifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_invoices: {
        Row: {
          amount_paise: number
          created_at: string
          gateway_invoice_id: string
          gateway_payment_id: string | null
          id: string
          issued_at: string
          paid_at: string | null
          status: string
          subscription_id: string
        }
        Insert: {
          amount_paise: number
          created_at?: string
          gateway_invoice_id: string
          gateway_payment_id?: string | null
          id?: string
          issued_at: string
          paid_at?: string | null
          status: string
          subscription_id: string
        }
        Update: {
          amount_paise?: number
          created_at?: string
          gateway_invoice_id?: string
          gateway_payment_id?: string | null
          id?: string
          issued_at?: string
          paid_at?: string | null
          status?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount_paise: number
          campaign_id: string
          cancelled_at: string | null
          cause: string
          created_at: string
          current_end: string | null
          current_start: string | null
          donor_id: string
          exchange_rate: number | null
          gateway_plan_id: string
          gateway_subscription_id: string
          id: string
          interval: string
          is_anonymous: boolean
          provider: string
          settlement_amount_minor: number | null
          settlement_currency: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_paise: number
          campaign_id: string
          cancelled_at?: string | null
          cause?: string
          created_at?: string
          current_end?: string | null
          current_start?: string | null
          donor_id: string
          exchange_rate?: number | null
          gateway_plan_id: string
          gateway_subscription_id: string
          id?: string
          interval: string
          is_anonymous?: boolean
          provider?: string
          settlement_amount_minor?: number | null
          settlement_currency?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_paise?: number
          campaign_id?: string
          cancelled_at?: string | null
          cause?: string
          created_at?: string
          current_end?: string | null
          current_start?: string | null
          donor_id?: string
          exchange_rate?: number | null
          gateway_plan_id?: string
          gateway_subscription_id?: string
          id?: string
          interval?: string
          is_anonymous?: boolean
          provider?: string
          settlement_amount_minor?: number | null
          settlement_currency?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_certificates: {
        Row: {
          certificate_number: string
          created_at: string
          donation_id: string
          encrypted_at: string | null
          encryption_version: number | null
          financial_year: string
          id: string
          issued_at: string
          ngo_id: string
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          certificate_number: string
          created_at?: string
          donation_id: string
          encrypted_at?: string | null
          encryption_version?: number | null
          financial_year: string
          id?: string
          issued_at: string
          ngo_id: string
          storage_path: string
          uploaded_by: string
        }
        Update: {
          certificate_number?: string
          created_at?: string
          donation_id?: string
          encrypted_at?: string | null
          encryption_version?: number | null
          financial_year?: string
          id?: string
          issued_at?: string
          ngo_id?: string
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_certificates_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: true
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_certificates_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "ngos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_certificates_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_type: string
          earned_at: string | null
          id: string
          progress: number | null
          tier: string | null
          user_id: string
        }
        Insert: {
          badge_type: string
          earned_at?: string | null
          id?: string
          progress?: number | null
          tier?: string | null
          user_id: string
        }
        Update: {
          badge_type?: string
          earned_at?: string | null
          id?: string
          progress?: number | null
          tier?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          id: string
          linkedin_url: string | null
          location: string | null
          twitter_handle: string | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      volunteer_applications: {
        Row: {
          applied_at: string
          created_at: string
          id: string
          message: string | null
          opportunity_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string
          created_at?: string
          id?: string
          message?: string | null
          opportunity_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string
          created_at?: string
          id?: string
          message?: string | null
          opportunity_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "volunteer_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_certificates: {
        Row: {
          certificate_number: string
          created_at: string | null
          hours_completed: number
          id: string
          issue_date: string
          ngo_id: string
          opportunity_id: string
          pdf_url: string | null
          user_id: string
          verified_by: string | null
        }
        Insert: {
          certificate_number: string
          created_at?: string | null
          hours_completed: number
          id?: string
          issue_date?: string
          ngo_id: string
          opportunity_id: string
          pdf_url?: string | null
          user_id: string
          verified_by?: string | null
        }
        Update: {
          certificate_number?: string
          created_at?: string | null
          hours_completed?: number
          id?: string
          issue_date?: string
          ngo_id?: string
          opportunity_id?: string
          pdf_url?: string | null
          user_id?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_certificates_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "ngos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_certificates_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "volunteer_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_certificates_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_hours: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          hours: number
          id: string
          ngo_id: string
          opportunity_id: string
          review_note: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          status: string
          user_id: string
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          description?: string | null
          hours: number
          id?: string
          ngo_id: string
          opportunity_id: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          user_id: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          hours?: number
          id?: string
          ngo_id?: string
          opportunity_id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          user_id?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_hours_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "ngos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_hours_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "volunteer_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_hours_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_hours_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_hours_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_opportunities: {
        Row: {
          availability: string[]
          city: string
          created_at: string
          date: string
          description: string
          id: string
          ngo_id: string
          required_skills: string[]
          status: string
          title: string
          total_needed: number
          updated_at: string
        }
        Insert: {
          availability?: string[]
          city: string
          created_at?: string
          date: string
          description: string
          id?: string
          ngo_id: string
          required_skills?: string[]
          status?: string
          title: string
          total_needed: number
          updated_at?: string
        }
        Update: {
          availability?: string[]
          city?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          ngo_id?: string
          required_skills?: string[]
          status?: string
          title?: string
          total_needed?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_opportunities_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "ngos"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_profiles: {
        Row: {
          availability: string[]
          bio: string | null
          city: string
          created_at: string
          id: string
          skills: string[]
          total_hours: number | null
          updated_at: string
          user_id: string
          verified_skills: string[] | null
        }
        Insert: {
          availability?: string[]
          bio?: string | null
          city: string
          created_at?: string
          id?: string
          skills?: string[]
          total_hours?: number | null
          updated_at?: string
          user_id: string
          verified_skills?: string[] | null
        }
        Update: {
          availability?: string[]
          bio?: string | null
          city?: string
          created_at?: string
          id?: string
          skills?: string[]
          total_hours?: number | null
          updated_at?: string
          user_id?: string
          verified_skills?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_corporate_invitation: {
        Args: { invitation_token_hash: string }
        Returns: {
          accepted_at: string | null
          accepted_by: string | null
          corporate_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          status: string
          token_hash: string
        }
        SetofOptions: {
          from: "*"
          to: "corporate_invitations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      batch_increment_view_count: {
        Args: { post_ids: string[] }
        Returns: undefined
      }
      can_review_ngo: { Args: { target_ngo_id: string }; Returns: boolean }
      cancel_csr_settlement: {
        Args: { provider_order_id: string }
        Returns: {
          amount_paise: number
          corporate_id: string
          created_at: string
          gateway_order_id: string
          gateway_payment_id: string | null
          id: string
          provider: string
          provider_amount_cents: number
          settled_at: string | null
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "csr_settlements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      capture_csr_settlement: {
        Args: {
          captured_amount_cents: number
          provider_order_id: string
          provider_payload?: Json
          provider_payment_id: string
        }
        Returns: string
      }
      claim_paypal_payout_transfer: {
        Args: { donation_uuid: string; settlement_minor: number }
        Returns: {
          amount_paise: number
          created_at: string
          donation_id: string | null
          failure_reason: string | null
          gateway_transfer_id: string | null
          id: string
          payout_account_id: string
          provider_batch_id: string | null
          provider_item_id: string | null
          reversed_at: string | null
          sender_batch_id: string | null
          sender_item_id: string | null
          settled_at: string | null
          settlement_amount_minor: number | null
          settlement_currency: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "payment_transfers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cleanup_expired_stories: { Args: never; Returns: undefined }
      complete_paypal_refund: {
        Args: {
          gateway_refund_identifier: string
          refund_request_uuid: string
          refunded_amount_paise: number
        }
        Returns: {
          amount_paise: number
          created_at: string
          donation_id: string
          gateway_refund_id: string | null
          id: string
          reason: string
          requester_id: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "refund_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      consume_action_rate_limit: {
        Args: {
          action_name: string
          maximum_hits: number
          window_seconds: number
        }
        Returns: boolean
      }
      create_corporate_invitation: {
        Args: {
          invitation_expires_at: string
          invitation_token_hash: string
          invitation_url: string
          invited_email: string
        }
        Returns: {
          accepted_at: string | null
          accepted_by: string | null
          corporate_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          status: string
          token_hash: string
        }
        SetofOptions: {
          from: "*"
          to: "corporate_invitations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_csr_settlement_batch: {
        Args: {
          corporate_uuid: string
          pledge_uuids: string[]
          provider_amount_cents: number
          provider_order_id: string
          settlement_uuid: string
          total_amount_paise: number
        }
        Returns: undefined
      }
      create_supporter_campaign: {
        Args: {
          beneficiary_name: string
          beneficiary_relationship: string
          campaign_category: string
          campaign_deadline: string
          campaign_description: string
          campaign_image_url: string
          campaign_short_description: string
          campaign_target_paise: number
          campaign_title: string
          payout_email: string
        }
        Returns: string
      }
      get_follower_count: {
        Args: { entity_type_param: string; entity_uuid: string }
        Returns: number
      }
      get_following_count: { Args: { user_uuid: string }; Returns: number }
      get_post_comment_count: { Args: { post_uuid: string }; Returns: number }
      get_post_like_count: { Args: { post_uuid: string }; Returns: number }
      get_posts_with_stats: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          comment_count: number
          content: string
          created_at: string
          id: string
          image_url: string
          like_count: number
          user_id: string
          view_count: number
        }[]
      }
      get_trending_posts: {
        Args: { limit_count?: number }
        Returns: {
          engagement_score: number
          post_id: string
        }[]
      }
      get_unread_notification_count: {
        Args: { user_uuid: string }
        Returns: number
      }
      get_user_stats: {
        Args: { user_uuid: string }
        Returns: {
          badges_earned: number
          comments_made: number
          donation_count: number
          follower_count: number
          following_count: number
          posts_created: number
          total_donations: number
          volunteer_applications: number
        }[]
      }
      increment_post_view_count: {
        Args: { post_uuid: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_email_verified: { Args: never; Returns: boolean }
      is_following: {
        Args: {
          entity_type_param: string
          entity_uuid: string
          user_uuid: string
        }
        Returns: boolean
      }
      log_analytics: {
        Args: {
          p_entity_id: string
          p_entity_type: string
          p_event_type: string
          p_metadata?: Json
          p_user_id: string
        }
        Returns: string
      }
      moderate_reported_content: {
        Args: {
          decision_reason: string
          moderation_action: string
          report_uuid: string
        }
        Returns: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          moderator_id: string
          reason: string
          report_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "moderation_actions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reconcile_paypal_payout_transfer: {
        Args: {
          failure_detail?: string
          next_status: string
          provider_batch_identifier: string
          provider_item_identifier: string
          sender_batch_identifier: string
          sender_item_identifier: string
        }
        Returns: {
          amount_paise: number
          created_at: string
          donation_id: string | null
          failure_reason: string | null
          gateway_transfer_id: string | null
          id: string
          payout_account_id: string
          provider_batch_id: string | null
          provider_item_id: string | null
          reversed_at: string | null
          sender_batch_id: string | null
          sender_item_id: string | null
          settled_at: string | null
          settlement_amount_minor: number | null
          settlement_currency: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "payment_transfers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reconcile_paypal_subscription: {
        Args: { next_status: string; subscription_identifier: string }
        Returns: {
          amount_paise: number
          campaign_id: string
          cancelled_at: string | null
          cause: string
          created_at: string
          current_end: string | null
          current_start: string | null
          donor_id: string
          exchange_rate: number | null
          gateway_plan_id: string
          gateway_subscription_id: string
          id: string
          interval: string
          is_anonymous: boolean
          provider: string
          settlement_amount_minor: number | null
          settlement_currency: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_completed_payment: {
        Args: {
          credited_amount_paise: number
          demo_payment?: boolean
          order_identifier: string
          payment_identifier: string
          provider_payload?: Json
        }
        Returns: string
      }
      record_completed_subscription_payment: {
        Args: {
          payment_identifier: string
          provider_payload?: Json
          received_settlement_minor: number
          subscription_identifier: string
        }
        Returns: string
      }
      reverse_csr_settlement: {
        Args: {
          next_status: string
          provider_capture_id: string
          provider_event_id: string
        }
        Returns: {
          amount_paise: number
          corporate_id: string
          created_at: string
          gateway_order_id: string
          gateway_payment_id: string | null
          id: string
          provider: string
          provider_amount_cents: number
          settled_at: string | null
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "csr_settlements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reverse_paypal_capture: {
        Args: { capture_identifier: string }
        Returns: {
          amount_paise: number
          campaign_id: string | null
          captured_at: string | null
          cause: string
          corporate_campaign_id: string | null
          corporate_employee_id: string | null
          corporate_id: string | null
          created_at: string
          csr_initiative_id: string | null
          gateway_order_id: string | null
          gateway_payment_id: string | null
          id: string
          is_anonymous: boolean
          is_csr_match: boolean
          is_demo: boolean
          is_recurring: boolean | null
          metadata: Json
          ngo_id: string | null
          payment_method: string | null
          provider: string
          receipt_number: string | null
          recurring_donation_id: string | null
          refunded_paise: number
          status: string
          subscription_id: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "donations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_impact_story: {
        Args: {
          decision_reason: string
          post_uuid: string
          should_feature: boolean
        }
        Returns: {
          approved_at: string | null
          author_id: string
          author_role: string
          category: string
          content: string
          created_at: string | null
          featured_at: string | null
          hidden_at: string | null
          hidden_reason: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_impact_story: boolean
          media: Json
          status: string
          title: string
          updated_at: string | null
          view_count: number | null
        }
        SetofOptions: {
          from: "*"
          to: "posts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_ngo_verification: {
        Args: {
          decision_note: string
          next_status: string
          verification_uuid: string
        }
        Returns: {
          created_at: string | null
          documents_verified: boolean | null
          has_12a: boolean
          has_80g: boolean
          has_fcra: boolean
          id: string
          legal_name: string | null
          ngo_darpan_id: string | null
          ngo_id: string
          pan_number: string | null
          registered_address: string | null
          registration_date: string | null
          registration_number: string | null
          registration_type: string | null
          reviewed_at: string | null
          submitted_at: string | null
          updated_at: string | null
          verification_date: string | null
          verification_notes: string | null
          verification_status: string
          verified_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "ngo_verifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_partnership_request: {
        Args: { next_status: string; partnership_request_uuid: string }
        Returns: {
          corporate_campaign_id: string
          created_at: string | null
          id: string
          message: string | null
          ngo_id: string
          status: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "partnership_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_payout_account: {
        Args: {
          decision_note: string
          next_status: string
          payout_account_uuid: string
        }
        Returns: {
          activated_at: string | null
          beneficiary: Json
          beneficiary_review_note: string | null
          created_at: string
          gateway_account_id: string | null
          id: string
          ngo_id: string | null
          owner_id: string
          provider: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "payout_accounts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_refund_request: {
        Args: {
          decision: string
          decision_note: string
          refund_request_uuid: string
        }
        Returns: {
          amount_paise: number
          created_at: string
          donation_id: string
          gateway_refund_id: string | null
          id: string
          reason: string
          requester_id: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "refund_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_volunteer_application: {
        Args: { application_uuid: string; next_status: string }
        Returns: {
          applied_at: string
          created_at: string
          id: string
          message: string | null
          opportunity_id: string
          status: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "volunteer_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_volunteer_hours: {
        Args: {
          decision_note?: string
          hours_uuid: string
          next_status: string
        }
        Returns: {
          created_at: string | null
          date: string
          description: string | null
          hours: number
          id: string
          ngo_id: string
          opportunity_id: string
          review_note: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          status: string
          user_id: string
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "volunteer_hours"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      save_user_public_profile: {
        Args: {
          display_name: string
          profile_avatar_url: string
          profile_bio: string
          profile_linkedin_url: string
          profile_location: string
          profile_twitter_handle: string
          profile_website: string
        }
        Returns: undefined
      }
      submit_ngo_verification: {
        Args: { verification_uuid: string }
        Returns: {
          created_at: string | null
          documents_verified: boolean | null
          has_12a: boolean
          has_80g: boolean
          has_fcra: boolean
          id: string
          legal_name: string | null
          ngo_darpan_id: string | null
          ngo_id: string
          pan_number: string | null
          registered_address: string | null
          registration_date: string | null
          registration_number: string | null
          registration_type: string | null
          reviewed_at: string | null
          submitted_at: string | null
          updated_at: string | null
          verification_date: string | null
          verification_notes: string | null
          verification_status: string
          verified_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "ngo_verifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      transition_campaign: {
        Args: {
          campaign_uuid: string
          decision_note?: string
          next_status: string
        }
        Returns: {
          approved_at: string | null
          beneficiary: Json
          beneficiary_consent: boolean
          category: string
          created_at: string
          creator_id: string
          deadline: string
          description: string
          evidence: Json
          id: string
          image_url: string | null
          moderation_notes: string | null
          ngo_id: string | null
          payout_account_id: string | null
          published_at: string | null
          raised_paise: number
          short_description: string
          status: string
          target_paise: number
          title: string
          updated_at: string
          video_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "campaigns"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
