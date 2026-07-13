export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      ngos: {
        Row: {
          id: string;
          name: string | null;
          description: string | null;
          city: string | null;
          state: string | null;
          category:
            | "education"
            | "food"
            | "health"
            | "women"
            | "animals"
            | "children"
            | "environment"
            | "livelihoods"
            | "disability"
            | "disaster-relief"
            | "elderly"
            | "human-rights"
            | "rural-development"
            | "arts-culture"
            | "other"
            | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
          user_id: string;
          legal_name: string | null;
          display_name: string | null;
          tagline: string | null;
          mission: string | null;
          founding_year: number | null;
          organization_type: string | null;
          logo_path: string | null;
          cover_image_path: string | null;
          address_line_1: string | null;
          address_line_2: string | null;
          postal_code: string | null;
          country_code: string;
          impact_areas: string[];
          beneficiary_groups: string[];
          program_summary: string | null;
          website_url: string | null;
          public_email: string | null;
          public_phone: string | null;
          social_links: Record<string, string>;
          vision: string | null;
          theory_of_change: string | null;
          core_values: string[];
          operating_states: string[];
          team_size: number | null;
          beneficiaries_reached: number | null;
          communities_served: number | null;
          volunteers_engaged: number | null;
          profile_status: "draft" | "published";
          onboarding_step: number;
          published_at: string | null;
          is_discoverable: boolean;
          accepts_donations: boolean;
          accepts_volunteers: boolean;
          is_verified: boolean;
          average_rating: number;
          total_reviews: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          description?: string | null;
          city?: string | null;
          state?: string | null;
          category?:
            | "education"
            | "food"
            | "health"
            | "women"
            | "animals"
            | "children"
            | "environment"
            | "livelihoods"
            | "disability"
            | "disaster-relief"
            | "elderly"
            | "human-rights"
            | "rural-development"
            | "arts-culture"
            | "other"
            | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
          user_id: string;
          legal_name?: string | null;
          display_name?: string | null;
          tagline?: string | null;
          mission?: string | null;
          founding_year?: number | null;
          organization_type?: string | null;
          logo_path?: string | null;
          cover_image_path?: string | null;
          address_line_1?: string | null;
          address_line_2?: string | null;
          postal_code?: string | null;
          country_code?: string;
          impact_areas?: string[];
          beneficiary_groups?: string[];
          program_summary?: string | null;
          website_url?: string | null;
          public_email?: string | null;
          public_phone?: string | null;
          social_links?: Record<string, string>;
          vision?: string | null;
          theory_of_change?: string | null;
          core_values?: string[];
          operating_states?: string[];
          team_size?: number | null;
          beneficiaries_reached?: number | null;
          communities_served?: number | null;
          volunteers_engaged?: number | null;
          profile_status?: "draft" | "published";
          onboarding_step?: number;
          published_at?: string | null;
          is_discoverable?: boolean;
          accepts_donations?: boolean;
          accepts_volunteers?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          description?: string | null;
          city?: string | null;
          state?: string | null;
          category?:
            | "education"
            | "food"
            | "health"
            | "women"
            | "animals"
            | "children"
            | "environment"
            | "livelihoods"
            | "disability"
            | "disaster-relief"
            | "elderly"
            | "human-rights"
            | "rural-development"
            | "arts-culture"
            | "other"
            | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
          user_id?: string;
          legal_name?: string | null;
          display_name?: string | null;
          tagline?: string | null;
          mission?: string | null;
          founding_year?: number | null;
          organization_type?: string | null;
          logo_path?: string | null;
          cover_image_path?: string | null;
          address_line_1?: string | null;
          address_line_2?: string | null;
          postal_code?: string | null;
          country_code?: string;
          impact_areas?: string[];
          beneficiary_groups?: string[];
          program_summary?: string | null;
          website_url?: string | null;
          public_email?: string | null;
          public_phone?: string | null;
          social_links?: Record<string, string>;
          vision?: string | null;
          theory_of_change?: string | null;
          core_values?: string[];
          operating_states?: string[];
          team_size?: number | null;
          beneficiaries_reached?: number | null;
          communities_served?: number | null;
          volunteers_engaged?: number | null;
          profile_status?: "draft" | "published";
          onboarding_step?: number;
          published_at?: string | null;
          is_discoverable?: boolean;
          accepts_donations?: boolean;
          accepts_volunteers?: boolean;
          updated_at?: string;
        };
      };
      ngo_verifications: {
        Row: {
          id: string;
          ngo_id: string;
          verification_status: "draft" | "pending" | "verified" | "rejected";
          verified_by: string | null;
          verification_date: string | null;
          verification_notes: string | null;
          documents_verified: boolean;
          registration_number: string | null;
          legal_name: string | null;
          registration_type: string | null;
          registration_date: string | null;
          registered_address: string | null;
          pan_number: string | null;
          ngo_darpan_id: string | null;
          has_12a: boolean;
          has_80g: boolean;
          has_fcra: boolean;
          submitted_at: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      ngo_verification_documents: {
        Row: {
          id: string;
          verification_id: string;
          ngo_id: string;
          document_type:
            "registration" | "pan" | "12a" | "80g" | "fcra" | "supporting";
          storage_path: string;
          original_name: string;
          mime_type: "application/pdf" | "image/jpeg" | "image/png";
          size_bytes: number;
          uploaded_by: string;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: "supporter" | "ngo" | "admin" | "corporate";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          role?: "supporter" | "ngo" | "admin" | "corporate";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          role?: "supporter" | "ngo" | "admin" | "corporate";
          created_at?: string;
          updated_at?: string;
        };
      };
      campaigns: {
        Row: {
          id: string;
          ngo_id: string;
          title: string;
          short_description: string;
          description: string;
          goal_amount: number;
          current_amount: number;
          deadline: string;
          image_url: string | null;
          category:
            "education" | "food" | "health" | "disaster" | "women" | "animals";
          status: "active" | "completed" | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ngo_id: string;
          title: string;
          short_description: string;
          description: string;
          goal_amount: number;
          current_amount?: number;
          deadline: string;
          image_url?: string | null;
          category:
            "education" | "food" | "health" | "disaster" | "women" | "animals";
          status?: "active" | "completed" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ngo_id?: string;
          title?: string;
          short_description?: string;
          description?: string;
          goal_amount?: number;
          current_amount?: number;
          deadline?: string;
          image_url?: string | null;
          category?:
            "education" | "food" | "health" | "disaster" | "women" | "animals";
          status?: "active" | "completed" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
      };
      campaign_updates: {
        Row: {
          id: string;
          campaign_id: string;
          text: string;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          text: string;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          text?: string;
          image_url?: string | null;
          created_at?: string;
        };
      };
      ngo_programs: {
        Row: {
          id: string;
          ngo_id: string;
          title: string;
          summary: string | null;
          description: string | null;
          category:
            | "education"
            | "food"
            | "health"
            | "women"
            | "animals"
            | "children"
            | "environment"
            | "livelihoods"
            | "disability"
            | "disaster-relief"
            | "elderly"
            | "human-rights"
            | "rural-development"
            | "arts-culture"
            | "other"
            | null;
          image_path: string | null;
          beneficiaries_reached: number | null;
          volunteers_needed: number | null;
          status: "draft" | "active" | "archived";
          starts_on: string | null;
          ends_on: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ngo_id: string;
          title: string;
          summary?: string | null;
          description?: string | null;
          category?:
            | "education"
            | "food"
            | "health"
            | "women"
            | "animals"
            | "children"
            | "environment"
            | "livelihoods"
            | "disability"
            | "disaster-relief"
            | "elderly"
            | "human-rights"
            | "rural-development"
            | "arts-culture"
            | "other"
            | null;
          image_path?: string | null;
          beneficiaries_reached?: number | null;
          volunteers_needed?: number | null;
          status?: "draft" | "active" | "archived";
          starts_on?: string | null;
          ends_on?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ngo_id?: string;
          title?: string;
          summary?: string | null;
          description?: string | null;
          category?:
            | "education"
            | "food"
            | "health"
            | "women"
            | "animals"
            | "children"
            | "environment"
            | "livelihoods"
            | "disability"
            | "disaster-relief"
            | "elderly"
            | "human-rights"
            | "rural-development"
            | "arts-culture"
            | "other"
            | null;
          image_path?: string | null;
          beneficiaries_reached?: number | null;
          volunteers_needed?: number | null;
          status?: "draft" | "active" | "archived";
          starts_on?: string | null;
          ends_on?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      ngo_updates: {
        Row: {
          id: string;
          ngo_id: string;
          title: string;
          body: string;
          image_path: string | null;
          status: "draft" | "published" | "archived";
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ngo_id: string;
          title: string;
          body: string;
          image_path?: string | null;
          status?: "draft" | "published" | "archived";
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ngo_id?: string;
          title?: string;
          body?: string;
          image_path?: string | null;
          status?: "draft" | "published" | "archived";
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ngo_gallery_images: {
        Row: {
          id: string;
          ngo_id: string;
          image_path: string;
          alt_text: string | null;
          caption: string | null;
          sort_order: number;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ngo_id: string;
          image_path: string;
          alt_text?: string | null;
          caption?: string | null;
          sort_order?: number;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ngo_id?: string;
          image_path?: string;
          alt_text?: string | null;
          caption?: string | null;
          sort_order?: number;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      ngo_service_areas: {
        Row: {
          id: string;
          ngo_id: string;
          state: string;
          district: string | null;
          city: string | null;
          latitude: number | null;
          longitude: number | null;
          programs_count: number | null;
          beneficiaries_reached: number | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ngo_id: string;
          state: string;
          district?: string | null;
          city?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          programs_count?: number | null;
          beneficiaries_reached?: number | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ngo_id?: string;
          state?: string;
          district?: string | null;
          city?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          programs_count?: number | null;
          beneficiaries_reached?: number | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      donations: {
        Row: {
          id: string;
          user_id: string;
          ngo_id: string;
          campaign_id: string | null;
          corporate_campaign_id: string | null;
          amount: number;
          cause: "education" | "hunger" | "healthcare" | "disaster" | "general";
          is_anonymous: boolean;
          payment_status: "pending" | "completed" | "failed";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ngo_id: string;
          campaign_id?: string | null;
          corporate_campaign_id?: string | null;
          amount: number;
          cause: "education" | "hunger" | "healthcare" | "disaster" | "general";
          is_anonymous?: boolean;
          payment_status?: "pending" | "completed" | "failed";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ngo_id?: string;
          campaign_id?: string | null;
          corporate_campaign_id?: string | null;
          amount?: number;
          cause?:
            "education" | "hunger" | "healthcare" | "disaster" | "general";
          is_anonymous?: boolean;
          payment_status?: "pending" | "completed" | "failed";
          created_at?: string;
        };
      };
      volunteer_profiles: {
        Row: {
          id: string;
          user_id: string;
          bio: string | null;
          city: string;
          skills: string[];
          availability: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bio?: string | null;
          city: string;
          skills?: string[];
          availability?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          bio?: string | null;
          city?: string;
          skills?: string[];
          availability?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      volunteer_opportunities: {
        Row: {
          id: string;
          ngo_id: string;
          title: string;
          description: string;
          city: string;
          required_skills: string[];
          date: string;
          total_needed: number;
          status: "active" | "closed" | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ngo_id: string;
          title: string;
          description: string;
          city: string;
          required_skills?: string[];
          date: string;
          total_needed: number;
          status?: "active" | "closed" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ngo_id?: string;
          title?: string;
          description?: string;
          city?: string;
          required_skills?: string[];
          date?: string;
          total_needed?: number;
          status?: "active" | "closed" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
      };
      volunteer_applications: {
        Row: {
          id: string;
          opportunity_id: string;
          user_id: string;
          status: "pending" | "accepted" | "rejected";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          opportunity_id: string;
          user_id: string;
          status?: "pending" | "accepted" | "rejected";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          opportunity_id?: string;
          user_id?: string;
          status?: "pending" | "accepted" | "rejected";
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_flags: {
        Row: {
          id: string;
          entity_type: "ngo" | "campaign";
          entity_id: string;
          reason: string;
          confidence: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: "ngo" | "campaign";
          entity_id: string;
          reason: string;
          confidence?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: "ngo" | "campaign";
          entity_id?: string;
          reason?: string;
          confidence?: string;
          created_at?: string;
        };
      };
      analytics_logs: {
        Row: {
          id: string;
          event_type:
            "donation_created" | "campaign_created" | "volunteer_applied";
          related_id: string;
          timestamp: string;
        };
        Insert: {
          id?: string;
          event_type:
            "donation_created" | "campaign_created" | "volunteer_applied";
          related_id: string;
          timestamp?: string;
        };
        Update: {
          id?: string;
          event_type?:
            "donation_created" | "campaign_created" | "volunteer_applied";
          related_id?: string;
          timestamp?: string;
        };
      };
      corporate_profiles: {
        Row: {
          id: string;
          user_id: string;
          company_name: string;
          industry: string;
          company_size: "1-50" | "51-200" | "201-500" | "501-1000" | "1000+";
          description: string | null;
          website: string | null;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_name: string;
          industry: string;
          company_size: "1-50" | "51-200" | "201-500" | "501-1000" | "1000+";
          description?: string | null;
          website?: string | null;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_name?: string;
          industry?: string;
          company_size?: "1-50" | "51-200" | "201-500" | "501-1000" | "1000+";
          description?: string | null;
          website?: string | null;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      corporate_campaigns: {
        Row: {
          id: string;
          corporate_id: string;
          title: string;
          description: string;
          cause:
            | "education"
            | "food"
            | "health"
            | "disaster"
            | "women"
            | "animals"
            | "environment";
          goal_amount: number;
          current_amount: number;
          deadline: string;
          image_url: string | null;
          status: "active" | "completed" | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          corporate_id: string;
          title: string;
          description: string;
          cause:
            | "education"
            | "food"
            | "health"
            | "disaster"
            | "women"
            | "animals"
            | "environment";
          goal_amount: number;
          current_amount?: number;
          deadline: string;
          image_url?: string | null;
          status?: "active" | "completed" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          corporate_id?: string;
          title?: string;
          description?: string;
          cause?:
            | "education"
            | "food"
            | "health"
            | "disaster"
            | "women"
            | "animals"
            | "environment";
          goal_amount?: number;
          current_amount?: number;
          deadline?: string;
          image_url?: string | null;
          status?: "active" | "completed" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
      };
      partnership_requests: {
        Row: {
          id: string;
          corporate_campaign_id: string;
          ngo_id: string;
          status: "pending" | "accepted" | "rejected";
          message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          corporate_campaign_id: string;
          ngo_id: string;
          status?: "pending" | "accepted" | "rejected";
          message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          corporate_campaign_id?: string;
          ngo_id?: string;
          status?: "pending" | "accepted" | "rejected";
          message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      corporate_employees: {
        Row: {
          id: string;
          corporate_id: string;
          name: string;
          email: string;
          designation: string | null;
          joined_at: string;
        };
        Insert: {
          id?: string;
          corporate_id: string;
          name: string;
          email: string;
          designation?: string | null;
          joined_at?: string;
        };
        Update: {
          id?: string;
          corporate_id?: string;
          name?: string;
          email?: string;
          designation?: string | null;
          joined_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          author_role: "supporter" | "ngo" | "corporate" | "admin";
          title: string;
          content: string;
          image_url: string | null;
          category: "update" | "story" | "announcement";
          view_count: number;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          author_role: "supporter" | "ngo" | "corporate" | "admin";
          title: string;
          content: string;
          image_url?: string | null;
          category: "update" | "story" | "announcement";
          view_count?: number;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          author_role?: "supporter" | "ngo" | "corporate" | "admin";
          title?: string;
          content?: string;
          image_url?: string | null;
          category?: "update" | "story" | "announcement";
          view_count?: number;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      post_likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      post_comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_type:
            | "donor_hero"
            | "volunteer_champ"
            | "csr_star"
            | "campaign_supporter"
            | "community_builder"
            | "impact_maker";
          earned_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_type:
            | "donor_hero"
            | "volunteer_champ"
            | "csr_star"
            | "campaign_supporter"
            | "community_builder"
            | "impact_maker";
          earned_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          badge_type?:
            | "donor_hero"
            | "volunteer_champ"
            | "csr_star"
            | "campaign_supporter"
            | "community_builder"
            | "impact_maker";
          earned_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type:
            | "campaign_milestone"
            | "volunteer_accepted"
            | "badge_unlocked"
            | "post_liked"
            | "post_commented"
            | "partnership_accepted";
          title: string;
          message: string;
          link: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type:
            | "campaign_milestone"
            | "volunteer_accepted"
            | "badge_unlocked"
            | "post_liked"
            | "post_commented"
            | "partnership_accepted";
          title: string;
          message: string;
          link?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?:
            | "campaign_milestone"
            | "volunteer_accepted"
            | "badge_unlocked"
            | "post_liked"
            | "post_commented"
            | "partnership_accepted";
          title?: string;
          message?: string;
          link?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

type NgoRow = Database["public"]["Tables"]["ngos"]["Row"];
export type NGOCategory = NonNullable<NgoRow["category"]>;
export type NGO = Omit<
  NgoRow,
  | "name"
  | "description"
  | "city"
  | "state"
  | "category"
  | "latitude"
  | "longitude"
> & {
  name: string;
  description: string;
  city: string;
  state: string;
  category: NGOCategory;
  latitude: number;
  longitude: number;
};
export type User = Database["public"]["Tables"]["users"]["Row"];
export type UserRole = Database["public"]["Tables"]["users"]["Row"]["role"];
export type Donation = Database["public"]["Tables"]["donations"]["Row"];
export type DonationCause =
  Database["public"]["Tables"]["donations"]["Row"]["cause"];
export type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
export type CampaignCategory =
  Database["public"]["Tables"]["campaigns"]["Row"]["category"];
export type CampaignStatus =
  Database["public"]["Tables"]["campaigns"]["Row"]["status"];
export type CampaignUpdate =
  Database["public"]["Tables"]["campaign_updates"]["Row"];
export type NGOProgram = Database["public"]["Tables"]["ngo_programs"]["Row"];
export type NGOProgramStatus =
  Database["public"]["Tables"]["ngo_programs"]["Row"]["status"];
export type NGOUpdate = Database["public"]["Tables"]["ngo_updates"]["Row"];
export type NGOUpdateStatus =
  Database["public"]["Tables"]["ngo_updates"]["Row"]["status"];
export type NGOGalleryImage =
  Database["public"]["Tables"]["ngo_gallery_images"]["Row"];
export type NGOServiceArea =
  Database["public"]["Tables"]["ngo_service_areas"]["Row"];
export type VolunteerProfile =
  Database["public"]["Tables"]["volunteer_profiles"]["Row"];
export type VolunteerOpportunity =
  Database["public"]["Tables"]["volunteer_opportunities"]["Row"];
export type VolunteerApplication =
  Database["public"]["Tables"]["volunteer_applications"]["Row"];
export type VolunteerOpportunityStatus =
  Database["public"]["Tables"]["volunteer_opportunities"]["Row"]["status"];
export type VolunteerApplicationStatus =
  Database["public"]["Tables"]["volunteer_applications"]["Row"]["status"];
export type AIFlag = Database["public"]["Tables"]["ai_flags"]["Row"];
export type AIFlagEntityType =
  Database["public"]["Tables"]["ai_flags"]["Row"]["entity_type"];
export type AnalyticsLog =
  Database["public"]["Tables"]["analytics_logs"]["Row"];
export type AnalyticsEventType =
  Database["public"]["Tables"]["analytics_logs"]["Row"]["event_type"];
export type CorporateProfile =
  Database["public"]["Tables"]["corporate_profiles"]["Row"];
export type CorporateSize =
  Database["public"]["Tables"]["corporate_profiles"]["Row"]["company_size"];
export type CorporateCampaign =
  Database["public"]["Tables"]["corporate_campaigns"]["Row"];
export type CorporateCampaignCause =
  Database["public"]["Tables"]["corporate_campaigns"]["Row"]["cause"];
export type CorporateCampaignStatus =
  Database["public"]["Tables"]["corporate_campaigns"]["Row"]["status"];
export type PartnershipRequest =
  Database["public"]["Tables"]["partnership_requests"]["Row"];
export type PartnershipRequestStatus =
  Database["public"]["Tables"]["partnership_requests"]["Row"]["status"];
export type CorporateEmployee =
  Database["public"]["Tables"]["corporate_employees"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type PostCategory =
  Database["public"]["Tables"]["posts"]["Row"]["category"];
export type PostAuthorRole =
  Database["public"]["Tables"]["posts"]["Row"]["author_role"];
export type PostLike = Database["public"]["Tables"]["post_likes"]["Row"];
export type PostComment = Database["public"]["Tables"]["post_comments"]["Row"];
export type UserBadge = Database["public"]["Tables"]["user_badges"]["Row"];
export type BadgeType =
  Database["public"]["Tables"]["user_badges"]["Row"]["badge_type"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type NotificationType =
  Database["public"]["Tables"]["notifications"]["Row"]["type"];
