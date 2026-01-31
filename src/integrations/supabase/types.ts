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
      community_posts: {
        Row: {
          category: string | null
          comments_count: number | null
          content: string
          created_at: string | null
          id: string
          is_approved: boolean | null
          is_pinned: boolean | null
          likes_count: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          comments_count?: number | null
          content: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          comments_count?: number | null
          content?: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
          created_at: string | null
          financial_goals: string[] | null
          id: string
          monthly_income: number | null
          risk_profile: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          financial_goals?: string[] | null
          id?: string
          monthly_income?: number | null
          risk_profile?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          financial_goals?: string[] | null
          id?: string
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
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          title?: string
          type?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
