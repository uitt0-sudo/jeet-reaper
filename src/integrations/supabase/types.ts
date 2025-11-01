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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      cashbacks: {
        Row: {
          amount: number
          claimed_at: string | null
          created_at: string | null
          id: string
          transaction_signature: string | null
          wallet_address: string
        }
        Insert: {
          amount: number
          claimed_at?: string | null
          created_at?: string | null
          id?: string
          transaction_signature?: string | null
          wallet_address: string
        }
        Update: {
          amount?: number
          claimed_at?: string | null
          created_at?: string | null
          id?: string
          transaction_signature?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      daily_random_rewards: {
        Row: {
          created_at: string | null
          id: string
          reward_date: string
          selected_rank: number | null
          sol_amount: number | null
          sol_price: number | null
          usd_value: number | null
          wallet_address: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reward_date: string
          selected_rank?: number | null
          sol_amount?: number | null
          sol_price?: number | null
          usd_value?: number | null
          wallet_address: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reward_date?: string
          selected_rank?: number | null
          sol_amount?: number | null
          sol_price?: number | null
          usd_value?: number | null
          wallet_address?: string
        }
        Relationships: []
      }
      rewards: {
        Row: {
          claimed_at: string | null
          created_at: string | null
          id: string
          reward_amount: number
          transaction_signature: string | null
          wallet_address: string
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string | null
          id?: string
          reward_amount: number
          transaction_signature?: string | null
          wallet_address: string
        }
        Update: {
          claimed_at?: string | null
          created_at?: string | null
          id?: string
          reward_amount?: number
          transaction_signature?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      token_metadata: {
        Row: {
          logo: string | null
          mint: string
          name: string
          symbol: string
          updated_at: string
        }
        Insert: {
          logo?: string | null
          mint: string
          name: string
          symbol: string
          updated_at?: string
        }
        Update: {
          logo?: string | null
          mint?: string
          name?: string
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      token_prices: {
        Row: {
          ath_price: number | null
          market_cap: number | null
          mint: string
          price: number
          price_change_24h: number | null
          updated_at: string
        }
        Insert: {
          ath_price?: number | null
          market_cap?: number | null
          mint: string
          price: number
          price_change_24h?: number | null
          updated_at?: string
        }
        Update: {
          ath_price?: number | null
          market_cap?: number | null
          mint?: string
          price?: number
          price_change_24h?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      wallet_analyses: {
        Row: {
          analysis_date_range: Json | null
          analyzed_at: string
          avg_hold_time: number
          coins_traded: number
          created_at: string
          expires_at: string | null
          id: string
          top_regretted_tokens: Json | null
          total_events: number
          total_regret: number
          wallet_address: string
          win_rate: number
        }
        Insert: {
          analysis_date_range?: Json | null
          analyzed_at?: string
          avg_hold_time?: number
          coins_traded?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          top_regretted_tokens?: Json | null
          total_events?: number
          total_regret?: number
          wallet_address: string
          win_rate?: number
        }
        Update: {
          analysis_date_range?: Json | null
          analyzed_at?: string
          avg_hold_time?: number
          coins_traded?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          top_regretted_tokens?: Json | null
          total_events?: number
          total_regret?: number
          wallet_address?: string
          win_rate?: number
        }
        Relationships: []
      }
      wallet_holders: {
        Row: {
          cashback_claimed: boolean | null
          created_at: string | null
          holdings: number | null
          last_cashback_at: string | null
          last_reward_at: string | null
          last_scan: string | null
          random_reward_claimed: boolean | null
          total_cashback: number | null
          total_rewards: number | null
          updated_at: string | null
          wallet_address: string
        }
        Insert: {
          cashback_claimed?: boolean | null
          created_at?: string | null
          holdings?: number | null
          last_cashback_at?: string | null
          last_reward_at?: string | null
          last_scan?: string | null
          random_reward_claimed?: boolean | null
          total_cashback?: number | null
          total_rewards?: number | null
          updated_at?: string | null
          wallet_address: string
        }
        Update: {
          cashback_claimed?: boolean | null
          created_at?: string | null
          holdings?: number | null
          last_cashback_at?: string | null
          last_reward_at?: string | null
          last_scan?: string | null
          random_reward_claimed?: boolean | null
          total_cashback?: number | null
          total_rewards?: number | null
          updated_at?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      wallet_scan_logs: {
        Row: {
          analyzed_at: string | null
          created_at: string | null
          holdings: number | null
          id: string
          wallet_address: string
        }
        Insert: {
          analyzed_at?: string | null
          created_at?: string | null
          holdings?: number | null
          id?: string
          wallet_address: string
        }
        Update: {
          analyzed_at?: string | null
          created_at?: string | null
          holdings?: number | null
          id?: string
          wallet_address?: string
        }
        Relationships: []
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
