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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          points: number | null
          requirement: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          points?: number | null
          requirement?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          points?: number | null
          requirement?: Json | null
        }
        Relationships: []
      }
      budget_alerts: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          limit_amount: number
          period: string | null
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          limit_amount: number
          period?: string | null
          user_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          limit_amount?: number
          period?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_alerts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "transaction_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          badge_reward: string | null
          challenge_type: string
          created_at: string | null
          description: string | null
          difficulty: string | null
          duration_days: number
          end_date: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          max_participants: number | null
          points_reward: number | null
          start_date: string | null
          target_metric: string | null
          target_value: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          badge_reward?: string | null
          challenge_type: string
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_days: number
          end_date?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          points_reward?: number | null
          start_date?: string | null
          target_metric?: string | null
          target_value?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          badge_reward?: string | null
          challenge_type?: string
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_days?: number
          end_date?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          points_reward?: number | null
          start_date?: string | null
          target_metric?: string | null
          target_value?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          room_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          room_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          room_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          category: string | null
          comments_count: number | null
          content: string
          created_at: string | null
          id: string
          is_approved: boolean | null
          is_discussion: boolean | null
          is_pinned: boolean | null
          likes_count: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          category?: string | null
          comments_count?: number | null
          content: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          is_discussion?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          category?: string | null
          comments_count?: number | null
          content?: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          is_discussion?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: []
      }
      course_modules: {
        Row: {
          content: string | null
          course_id: string
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          has_quiz: boolean | null
          id: string
          is_free: boolean | null
          media_type: string | null
          order_index: number | null
          thumbnail_url: string | null
          title: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          course_id: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          has_quiz?: boolean | null
          id?: string
          is_free?: boolean | null
          media_type?: string | null
          order_index?: number | null
          thumbnail_url?: string | null
          title: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          course_id?: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          has_quiz?: boolean | null
          id?: string
          is_free?: boolean | null
          media_type?: string | null
          order_index?: number | null
          thumbnail_url?: string | null
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "educational_content"
            referencedColumns: ["id"]
          },
        ]
      }
      course_quizzes: {
        Row: {
          course_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_final_quiz: boolean | null
          module_id: string | null
          order_index: number | null
          passing_score: number | null
          time_limit_minutes: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_final_quiz?: boolean | null
          module_id?: string | null
          order_index?: number | null
          passing_score?: number | null
          time_limit_minutes?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_final_quiz?: boolean | null
          module_id?: string | null
          order_index?: number | null
          passing_score?: number | null
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "educational_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_quizzes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          created_at: string | null
          creditor: string
          current_amount: number
          due_date: string | null
          id: string
          interest_rate: number | null
          monthly_payment: number | null
          notes: string | null
          original_amount: number
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          creditor: string
          current_amount: number
          due_date?: string | null
          id?: string
          interest_rate?: number | null
          monthly_payment?: number | null
          notes?: string | null
          original_amount: number
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          creditor?: string
          current_amount?: number
          due_date?: string | null
          id?: string
          interest_rate?: number | null
          monthly_payment?: number | null
          notes?: string | null
          original_amount?: number
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ebook_downloads: {
        Row: {
          downloaded_at: string | null
          id: string
          is_free_download: boolean | null
          product_id: string | null
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          downloaded_at?: string | null
          id?: string
          is_free_download?: boolean | null
          product_id?: string | null
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          downloaded_at?: string | null
          id?: string
          is_free_download?: boolean | null
          product_id?: string | null
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ebook_downloads_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ebook_downloads_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      educational_content: {
        Row: {
          category: string
          content: string | null
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          duration_minutes: number | null
          id: string
          is_premium: boolean | null
          is_published: boolean | null
          points_reward: number | null
          slug: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          category: string
          content?: string | null
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          id?: string
          is_premium?: boolean | null
          is_published?: boolean | null
          points_reward?: number | null
          slug: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          category?: string
          content?: string | null
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          id?: string
          is_premium?: boolean | null
          is_published?: boolean | null
          points_reward?: number | null
          slug?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      financial_goals: {
        Row: {
          annual_expenses: number | null
          color: string | null
          created_at: string | null
          current_amount: number | null
          description: string | null
          fire_type: string | null
          goal_type: string
          icon: string | null
          id: string
          is_fire_goal: boolean | null
          monthly_contribution: number | null
          name: string
          notes: string | null
          priority: Database["public"]["Enums"]["goal_priority"] | null
          safe_withdrawal_rate: number | null
          status: Database["public"]["Enums"]["goal_status"] | null
          target_amount: number
          target_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          annual_expenses?: number | null
          color?: string | null
          created_at?: string | null
          current_amount?: number | null
          description?: string | null
          fire_type?: string | null
          goal_type: string
          icon?: string | null
          id?: string
          is_fire_goal?: boolean | null
          monthly_contribution?: number | null
          name: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["goal_priority"] | null
          safe_withdrawal_rate?: number | null
          status?: Database["public"]["Enums"]["goal_status"] | null
          target_amount: number
          target_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          annual_expenses?: number | null
          color?: string | null
          created_at?: string | null
          current_amount?: number | null
          description?: string | null
          fire_type?: string | null
          goal_type?: string
          icon?: string | null
          id?: string
          is_fire_goal?: boolean | null
          monthly_contribution?: number | null
          name?: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["goal_priority"] | null
          safe_withdrawal_rate?: number | null
          status?: Database["public"]["Enums"]["goal_status"] | null
          target_amount?: number
          target_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      financial_profiles: {
        Row: {
          age_range: string | null
          created_at: string | null
          financial_goals: string[] | null
          id: string
          investment_experience: string | null
          investment_horizon: string | null
          monthly_income: number | null
          risk_profile: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age_range?: string | null
          created_at?: string | null
          financial_goals?: string[] | null
          id?: string
          investment_experience?: string | null
          investment_horizon?: string | null
          monthly_income?: number | null
          risk_profile?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age_range?: string | null
          created_at?: string | null
          financial_goals?: string[] | null
          id?: string
          investment_experience?: string | null
          investment_horizon?: string | null
          monthly_income?: number | null
          risk_profile?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      financial_reports: {
        Row: {
          created_at: string | null
          data: Json
          file_url: string | null
          generated_at: string | null
          id: string
          period_end: string
          period_start: string
          report_name: string
          report_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          file_url?: string | null
          generated_at?: string | null
          id?: string
          period_end: string
          period_start: string
          report_name: string
          report_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          file_url?: string | null
          generated_at?: string | null
          id?: string
          period_end?: string
          period_start?: string
          report_name?: string
          report_type?: string
          user_id?: string
        }
        Relationships: []
      }
      income_sources: {
        Row: {
          business_type: Database["public"]["Enums"]["business_type"]
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          initial_investment: number | null
          monthly_expenses: number | null
          monthly_revenue: number | null
          name: string
          notes: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_type: Database["public"]["Enums"]["business_type"]
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          initial_investment?: number | null
          monthly_expenses?: number | null
          monthly_revenue?: number | null
          name: string
          notes?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_type?: Database["public"]["Enums"]["business_type"]
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          initial_investment?: number | null
          monthly_expenses?: number | null
          monthly_revenue?: number | null
          name?: string
          notes?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          actual_return: number | null
          amount: number
          created_at: string | null
          current_value: number | null
          expected_return: number | null
          id: string
          maturity_date: string | null
          name: string
          notes: string | null
          risk_level: string | null
          start_date: string | null
          status: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_return?: number | null
          amount: number
          created_at?: string | null
          current_value?: number | null
          expected_return?: number | null
          id?: string
          maturity_date?: string | null
          name: string
          notes?: string | null
          risk_level?: string | null
          start_date?: string | null
          status?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_return?: number | null
          amount?: number
          created_at?: string | null
          current_value?: number | null
          expected_return?: number | null
          id?: string
          maturity_date?: string | null
          name?: string
          notes?: string | null
          risk_level?: string | null
          start_date?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      market_data_cache: {
        Row: {
          created_at: string | null
          data: Json
          data_type: string
          expires_at: string | null
          fetched_at: string | null
          id: string
          source: string
          symbol: string | null
        }
        Insert: {
          created_at?: string | null
          data: Json
          data_type: string
          expires_at?: string | null
          fetched_at?: string | null
          id?: string
          source: string
          symbol?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json
          data_type?: string
          expires_at?: string | null
          fetched_at?: string | null
          id?: string
          source?: string
          symbol?: string | null
        }
        Relationships: []
      }
      marketplace_products: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          download_count: number | null
          file_url: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          is_subscription_included: boolean | null
          price: number
          product_type: string
          requires_subscription: boolean | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          download_count?: number | null
          file_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          is_subscription_included?: boolean | null
          price?: number
          product_type: string
          requires_subscription?: boolean | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          download_count?: number | null
          file_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          is_subscription_included?: boolean | null
          price?: number
          product_type?: string
          requires_subscription?: boolean | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      marketplace_purchases: {
        Row: {
          id: string
          product_id: string
          purchase_price: number
          purchased_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          product_id: string
          purchase_price: number
          purchased_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          product_id?: string
          purchase_price?: number
          purchased_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      monetization_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      news: {
        Row: {
          category: string
          content: string | null
          created_at: string
          fetched_at: string | null
          id: string
          image_url: string | null
          is_approved: boolean | null
          is_featured: boolean | null
          published_at: string | null
          source: string
          summary: string | null
          title: string
          updated_at: string
          url: string | null
          views_count: number | null
        }
        Insert: {
          category?: string
          content?: string | null
          created_at?: string
          fetched_at?: string | null
          id?: string
          image_url?: string | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          published_at?: string | null
          source: string
          summary?: string | null
          title: string
          updated_at?: string
          url?: string | null
          views_count?: number | null
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string
          fetched_at?: string | null
          id?: string
          image_url?: string | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          published_at?: string | null
          source?: string
          summary?: string | null
          title?: string
          updated_at?: string
          url?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          message: string | null
          metadata: Json | null
          priority: string | null
          read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          priority?: string | null
          read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          priority?: string | null
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payout_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          currency: string | null
          id: string
          payment_details: Json
          payment_method: string
          processed_at: string | null
          processed_by: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          payment_details: Json
          payment_method: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          payment_details?: Json
          payment_method?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_approved: boolean | null
          likes_count: number | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          likes_count?: number | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          likes_count?: number | null
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      price_entries: {
        Row: {
          created_at: string | null
          currency: string | null
          id: string
          is_essential: boolean | null
          is_verified: boolean | null
          notes: string | null
          price: number
          product_id: string | null
          product_name: string
          purchase_date: string | null
          quantity: number | null
          store_id: string | null
          store_name: string
          unit: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          id?: string
          is_essential?: boolean | null
          is_verified?: boolean | null
          notes?: string | null
          price: number
          product_id?: string | null
          product_name: string
          purchase_date?: string | null
          quantity?: number | null
          store_id?: string | null
          store_name: string
          unit?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          id?: string
          is_essential?: boolean | null
          is_verified?: boolean | null
          notes?: string | null
          price?: number
          product_id?: string | null
          product_name?: string
          purchase_date?: string | null
          quantity?: number | null
          store_id?: string | null
          store_name?: string
          unit?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_entries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "price_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_entries_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      price_products: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_essential: boolean | null
          name: string
          unit: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_essential?: boolean | null
          name: string
          unit?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_essential?: boolean | null
          name?: string
          unit?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          currency: string | null
          email: string | null
          id: string
          language: string | null
          name: string | null
          notification_preferences: Json | null
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          id?: string
          language?: string | null
          name?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          id?: string
          language?: string | null
          name?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          correct_answer: string
          created_at: string | null
          explanation: string | null
          id: string
          options: Json | null
          order_index: number | null
          points: number | null
          question_text: string
          question_type: string | null
          quiz_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          explanation?: string | null
          id?: string
          options?: Json | null
          order_index?: number | null
          points?: number | null
          question_text: string
          question_type?: string | null
          quiz_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          explanation?: string | null
          id?: string
          options?: Json | null
          order_index?: number | null
          points?: number | null
          question_text?: string
          question_type?: string | null
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "course_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          commission_rate: number | null
          created_at: string
          id: string
          is_active: boolean | null
          successful_referrals: number | null
          total_earnings: number | null
          total_referrals: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          code: string
          commission_rate?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          successful_referrals?: number | null
          total_earnings?: number | null
          total_referrals?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string
          commission_rate?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          successful_referrals?: number | null
          total_earnings?: number | null
          total_referrals?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      savings_goals: {
        Row: {
          color: string | null
          created_at: string | null
          end_date: string | null
          icon: string | null
          id: string
          interest_rate: number | null
          monthly_contribution: number | null
          name: string
          saved_amount: number | null
          start_date: string | null
          status: string | null
          target_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          end_date?: string | null
          icon?: string | null
          id?: string
          interest_rate?: number | null
          monthly_contribution?: number | null
          name: string
          saved_amount?: number | null
          start_date?: string | null
          status?: string | null
          target_amount: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          end_date?: string | null
          icon?: string | null
          id?: string
          interest_rate?: number | null
          monthly_contribution?: number | null
          name?: string
          saved_amount?: number | null
          start_date?: string | null
          status?: string | null
          target_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          city: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_verified: boolean | null
          location: string | null
          name: string
          store_type: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_verified?: boolean | null
          location?: string | null
          name: string
          store_type?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_verified?: boolean | null
          location?: string | null
          name?: string
          store_type?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          currency: string | null
          ebook_limit: number
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          ebook_limit?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          ebook_limit?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      transaction_categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          type: string
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          type: string
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          date: string
          description: string | null
          id: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "transaction_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_certificates: {
        Row: {
          certificate_number: string
          completion_date: string | null
          course_id: string
          course_title: string | null
          created_at: string | null
          id: string
          issued_at: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          certificate_number: string
          completion_date?: string | null
          course_id: string
          course_title?: string | null
          created_at?: string | null
          id?: string
          issued_at?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          certificate_number?: string
          completion_date?: string | null
          course_id?: string
          course_title?: string | null
          created_at?: string | null
          id?: string
          issued_at?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "educational_content"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenges: {
        Row: {
          challenge_id: string
          completed_at: string | null
          current_progress: number | null
          id: string
          joined_at: string | null
          notes: string | null
          points_earned: number | null
          status: Database["public"]["Enums"]["challenge_status"] | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          current_progress?: number | null
          id?: string
          joined_at?: string | null
          notes?: string | null
          points_earned?: number | null
          status?: Database["public"]["Enums"]["challenge_status"] | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          current_progress?: number | null
          id?: string
          joined_at?: string | null
          notes?: string | null
          points_earned?: number | null
          status?: Database["public"]["Enums"]["challenge_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_content_progress: {
        Row: {
          completed_at: string | null
          content_id: string
          created_at: string | null
          id: string
          is_completed: boolean | null
          notes: string | null
          progress_percentage: number | null
          quiz_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          content_id: string
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          progress_percentage?: number | null
          quiz_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          content_id?: string
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          progress_percentage?: number | null
          quiz_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_content_progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "educational_content"
            referencedColumns: ["id"]
          },
        ]
      }
      user_earnings: {
        Row: {
          amount: number
          approved_at: string | null
          created_at: string
          currency: string | null
          description: string | null
          earning_type: string
          id: string
          paid_at: string | null
          source_id: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          earning_type: string
          id?: string
          paid_at?: string | null
          source_id?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          earning_type?: string
          id?: string
          paid_at?: string | null
          source_id?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_gamification: {
        Row: {
          challenges_completed: number | null
          created_at: string | null
          current_level: number | null
          current_streak: number | null
          goals_achieved: number | null
          id: string
          last_activity_at: string | null
          lessons_completed: number | null
          level_name: string | null
          longest_streak: number | null
          rank_position: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          challenges_completed?: number | null
          created_at?: string | null
          current_level?: number | null
          current_streak?: number | null
          goals_achieved?: number | null
          id?: string
          last_activity_at?: string | null
          lessons_completed?: number | null
          level_name?: string | null
          longest_streak?: number | null
          rank_position?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          challenges_completed?: number | null
          created_at?: string | null
          current_level?: number | null
          current_streak?: number | null
          goals_achieved?: number | null
          id?: string
          last_activity_at?: string | null
          lessons_completed?: number | null
          level_name?: string | null
          longest_streak?: number | null
          rank_position?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_module_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          module_id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          module_id: string
          notes?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          module_id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_news_favorites: {
        Row: {
          created_at: string
          id: string
          news_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          news_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          news_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_news_favorites_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
        ]
      }
      user_product_follows: {
        Row: {
          created_at: string
          id: string
          lowest_price_seen: number | null
          product_id: string | null
          product_name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lowest_price_seen?: number | null
          product_id?: string | null
          product_name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lowest_price_seen?: number | null
          product_id?: string | null
          product_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_product_follows_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "price_products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quiz_attempts: {
        Row: {
          answers: Json | null
          completed_at: string | null
          created_at: string | null
          id: string
          passed: boolean | null
          quiz_id: string
          score: number | null
          started_at: string | null
          total_points: number | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          passed?: boolean | null
          quiz_id: string
          score?: number | null
          started_at?: string | null
          total_points?: number | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          passed?: boolean | null
          quiz_id?: string
          score?: number | null
          started_at?: string | null
          total_points?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "course_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_referrals: {
        Row: {
          activated_at: string | null
          created_at: string
          id: string
          referral_code: string
          referred_id: string
          referrer_id: string
          reward_earned: number | null
          status: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_id: string
          referrer_id: string
          reward_earned?: number | null
          status?: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          reward_earned?: number | null
          status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          payment_method: string | null
          payment_proof_url: string | null
          plan_id: string | null
          rejection_reason: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          payment_method?: string | null
          payment_proof_url?: string | null
          plan_id?: string | null
          rejection_reason?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          payment_method?: string | null
          payment_proof_url?: string | null
          plan_id?: string | null
          rejection_reason?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_download_free_ebook: { Args: { p_user_id: string }; Returns: boolean }
      demote_from_admin: { Args: { target_user_id: string }; Returns: boolean }
      get_user_balance: {
        Args: { p_user_id: string }
        Returns: {
          available_balance: number
          total_earned: number
          total_paid: number
          total_pending: number
        }[]
      }
      get_user_free_downloads: { Args: { p_user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      process_referral_signup: {
        Args: { p_referral_code: string; p_referred_id: string }
        Returns: boolean
      }
      promote_to_admin: { Args: { target_user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      business_type:
        | "side_hustle"
        | "freelance"
        | "small_business"
        | "investment"
        | "passive_income"
      challenge_status: "upcoming" | "active" | "completed" | "expired"
      content_type: "article" | "video" | "course" | "quiz" | "calculator"
      goal_priority: "low" | "medium" | "high" | "critical"
      goal_status: "active" | "completed" | "paused" | "cancelled"
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
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      business_type: [
        "side_hustle",
        "freelance",
        "small_business",
        "investment",
        "passive_income",
      ],
      challenge_status: ["upcoming", "active", "completed", "expired"],
      content_type: ["article", "video", "course", "quiz", "calculator"],
      goal_priority: ["low", "medium", "high", "critical"],
      goal_status: ["active", "completed", "paused", "cancelled"],
    },
  },
} as const
