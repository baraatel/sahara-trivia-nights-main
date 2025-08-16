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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          created_at: string | null
          id: string
          setting_key: string
          setting_value: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          setting_key: string
          setting_value?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          setting_key?: string
          setting_value?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description_ar: string | null
          description_en: string | null
          id: string
          image_url: string | null
          is_free: boolean | null
          name_ar: string
          name_en: string
          price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          is_free?: boolean | null
          name_ar: string
          name_en: string
          price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          is_free?: boolean | null
          name_ar?: string
          name_en?: string
          price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      code_redemptions: {
        Row: {
          code_id: string
          id: string
          redeemed_at: string | null
          user_id: string
        }
        Insert: {
          code_id: string
          id?: string
          redeemed_at?: string | null
          user_id: string
        }
        Update: {
          code_id?: string
          id?: string
          redeemed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_redemptions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "redemption_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      game_answers: {
        Row: {
          answered_at: string
          game_id: string
          id: string
          is_correct: boolean | null
          question_id: string
          selected_answer: string | null
          time_taken: number | null
          user_id: string
        }
        Insert: {
          answered_at?: string
          game_id: string
          id?: string
          is_correct?: boolean | null
          question_id: string
          selected_answer?: string | null
          time_taken?: number | null
          user_id: string
        }
        Update: {
          answered_at?: string
          game_id?: string
          id?: string
          is_correct?: boolean | null
          question_id?: string
          selected_answer?: string | null
          time_taken?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_answers_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_players: {
        Row: {
          game_id: string
          id: string
          is_ready: boolean | null
          joined_at: string
          score: number | null
          user_id: string
        }
        Insert: {
          game_id: string
          id?: string
          is_ready?: boolean | null
          joined_at?: string
          score?: number | null
          user_id: string
        }
        Update: {
          game_id?: string
          id?: string
          is_ready?: boolean | null
          joined_at?: string
          score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_purchase_categories: {
        Row: {
          category_id: string
          created_at: string
          game_purchase_id: string
          id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          game_purchase_id: string
          id?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          game_purchase_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_game_purchase_categories_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_game_purchase_categories_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category_sales_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_game_purchase_categories_game_purchase"
            columns: ["game_purchase_id"]
            isOneToOne: false
            referencedRelation: "game_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      game_purchase_questions: {
        Row: {
          game_purchase_id: string
          id: string
          question_id: string
          shown_at: string
        }
        Insert: {
          game_purchase_id: string
          id?: string
          question_id: string
          shown_at?: string
        }
        Update: {
          game_purchase_id?: string
          id?: string
          question_id?: string
          shown_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_game_purchase_questions_game_purchase"
            columns: ["game_purchase_id"]
            isOneToOne: false
            referencedRelation: "game_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_game_purchase_questions_question"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_purchases: {
        Row: {
          created_at: string
          id: string
          is_used: boolean
          price: number
          purchased_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_used?: boolean
          price?: number
          purchased_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_used?: boolean
          price?: number
          purchased_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      games: {
        Row: {
          category_id: string
          created_at: string
          current_question: number | null
          ended_at: string | null
          host_id: string
          id: string
          max_players: number | null
          room_code: string
          started_at: string | null
          status: string | null
          total_questions: number | null
        }
        Insert: {
          category_id: string
          created_at?: string
          current_question?: number | null
          ended_at?: string | null
          host_id: string
          id?: string
          max_players?: number | null
          room_code: string
          started_at?: string | null
          status?: string | null
          total_questions?: number | null
        }
        Update: {
          category_id?: string
          created_at?: string
          current_question?: number | null
          ended_at?: string | null
          host_id?: string
          id?: string
          max_players?: number | null
          room_code?: string
          started_at?: string | null
          status?: string | null
          total_questions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "games_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category_sales_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_reports: {
        Row: {
          admin_response: string | null
          category_id: string | null
          description: string
          id: string
          issue_type: string
          priority: string | null
          purchase_id: string | null
          reported_at: string | null
          resolved_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          category_id?: string | null
          description: string
          id?: string
          issue_type: string
          priority?: string | null
          purchase_id?: string | null
          reported_at?: string | null
          resolved_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          admin_response?: string | null
          category_id?: string | null
          description?: string
          id?: string
          issue_type?: string
          priority?: string | null
          purchase_id?: string | null
          reported_at?: string | null
          resolved_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_reports_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_reports_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category_sales_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_reports_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "user_game_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          is_public: boolean | null
          mood: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          mood?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          mood?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string | null
          entry_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entry_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          entry_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          category_id: string
          correct_answer: string
          created_at: string
          difficulty_level: number | null
          explanation_ar: string | null
          explanation_en: string | null
          id: string
          option_a_ar: string
          option_a_en: string
          option_b_ar: string
          option_b_en: string
          option_c_ar: string
          option_c_en: string
          option_d_ar: string
          option_d_en: string
          question_ar: string
          question_en: string
          updated_at: string
        }
        Insert: {
          category_id: string
          correct_answer: string
          created_at?: string
          difficulty_level?: number | null
          explanation_ar?: string | null
          explanation_en?: string | null
          id?: string
          option_a_ar: string
          option_a_en: string
          option_b_ar: string
          option_b_en: string
          option_c_ar: string
          option_c_en: string
          option_d_ar: string
          option_d_en: string
          question_ar: string
          question_en: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          correct_answer?: string
          created_at?: string
          difficulty_level?: number | null
          explanation_ar?: string | null
          explanation_en?: string | null
          id?: string
          option_a_ar?: string
          option_a_en?: string
          option_b_ar?: string
          option_b_en?: string
          option_c_ar?: string
          option_c_en?: string
          option_d_ar?: string
          option_d_en?: string
          question_ar?: string
          question_en?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category_sales_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      redemption_codes: {
        Row: {
          code: string
          code_type: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          usage_count: number | null
          usage_limit: number | null
          value_data: Json
          value_type: string
        }
        Insert: {
          code: string
          code_type: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          usage_count?: number | null
          usage_limit?: number | null
          value_data: Json
          value_type: string
        }
        Update: {
          code?: string
          code_type?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          usage_count?: number | null
          usage_limit?: number | null
          value_data?: Json
          value_type?: string
        }
        Relationships: []
      }
      refund_history: {
        Row: {
          admin_id: string | null
          id: string
          notes: string | null
          processed_at: string | null
          purchase_id: string | null
          refund_amount: number
          refund_reason: string | null
          status: string | null
        }
        Insert: {
          admin_id?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          purchase_id?: string | null
          refund_amount: number
          refund_reason?: string | null
          status?: string | null
        }
        Update: {
          admin_id?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          purchase_id?: string | null
          refund_amount?: number
          refund_reason?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refund_history_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "user_game_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      refund_requests: {
        Row: {
          admin_notes: string | null
          id: string
          processed_at: string | null
          processed_by: string | null
          purchase_id: string | null
          reason: string
          refund_amount: number | null
          requested_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          purchase_id?: string | null
          reason: string
          refund_amount?: number | null
          requested_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          purchase_id?: string | null
          reason?: string
          refund_amount?: number | null
          requested_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refund_requests_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "user_game_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      user_cart: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          quantity: number | null
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          quantity?: number | null
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          quantity?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_cart_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_cart_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category_sales_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      user_game_purchases: {
        Row: {
          amount: number
          category_id: string
          currency: string | null
          id: string
          order_id: string
          order_status: string | null
          payment_provider: string
          purchased_at: string | null
          refund_amount: number | null
          refund_reason: string | null
          refund_status: string | null
          refunded_at: string | null
          status: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category_id: string
          currency?: string | null
          id?: string
          order_id?: string
          order_status?: string | null
          payment_provider: string
          purchased_at?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          refund_status?: string | null
          refunded_at?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string
          currency?: string | null
          id?: string
          order_id?: string
          order_status?: string | null
          payment_provider?: string
          purchased_at?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          refund_status?: string | null
          refunded_at?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_game_purchases_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_game_purchases_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category_sales_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_purchases: {
        Row: {
          category_id: string
          id: string
          purchase_price: number
          purchased_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          id?: string
          purchase_price: number
          purchased_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          id?: string
          purchase_price?: number
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_purchases_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_purchases_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category_sales_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          correct_answers: number | null
          created_at: string | null
          games_played: number | null
          id: string
          questions_answered: number | null
          total_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          correct_answers?: number | null
          created_at?: string | null
          games_played?: number | null
          id?: string
          questions_answered?: number | null
          total_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          correct_answers?: number | null
          created_at?: string | null
          games_played?: number | null
          id?: string
          questions_answered?: number | null
          total_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_violations: {
        Row: {
          action_taken: string | null
          created_at: string | null
          created_by: string | null
          description: string
          id: string
          is_resolved: boolean | null
          resolved_at: string | null
          severity: string | null
          user_id: string
          violation_type: string
        }
        Insert: {
          action_taken?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          id?: string
          is_resolved?: boolean | null
          resolved_at?: string | null
          severity?: string | null
          user_id: string
          violation_type: string
        }
        Update: {
          action_taken?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          id?: string
          is_resolved?: boolean | null
          resolved_at?: string | null
          severity?: string | null
          user_id?: string
          violation_type?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          username?: string
        }
        Relationships: []
      }
      visitor_analytics: {
        Row: {
          id: string
          ip_address: unknown | null
          page_path: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          visited_at: string | null
          visitor_id: string | null
        }
        Insert: {
          id?: string
          ip_address?: unknown | null
          page_path?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          visited_at?: string | null
          visitor_id?: string | null
        }
        Update: {
          id?: string
          ip_address?: unknown | null
          page_path?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          visited_at?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      category_sales_summary: {
        Row: {
          avg_price: number | null
          id: string | null
          name_ar: string | null
          name_en: string | null
          purchase_count: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      financial_summary: {
        Row: {
          avg_order_value: number | null
          completed_orders: number | null
          month: string | null
          refunded_orders: number | null
          total_orders: number | null
          total_refunds: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      leaderboard: {
        Row: {
          accuracy_percentage: number | null
          correct_answers: number | null
          full_name: string | null
          games_played: number | null
          id: string | null
          questions_answered: number | null
          rank: number | null
          total_score: number | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_redemption_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_room_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      insert_user_to_auth: {
        Args: { email: string; password: string }
        Returns: string
      }
      is_refund_eligible: {
        Args: { purchase_date: string }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          p_action_type: string
          p_admin_id: string
          p_details?: Json
          p_target_id: string
          p_target_type: string
        }
        Returns: string
      }
      user_can_view_game: {
        Args: { game_id: string }
        Returns: boolean
      }
      user_can_view_game_players: {
        Args: { target_game_id: string }
        Returns: boolean
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
  public: {
    Enums: {},
  },
} as const
