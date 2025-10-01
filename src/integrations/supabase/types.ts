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
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          expiry_date: string | null
          id: string
          is_active: boolean
          product_id: string
          updated_at: string
          usage_limit: number | null
          used_count: number
          user_id: string
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_type: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          product_id: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          user_id: string
          value: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          product_id?: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_coupons_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_read_status: {
        Row: {
          created_at: string | null
          id: string
          notification_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notification_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notification_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          sender: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          sender?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          sender?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string
          currency: string
          features: string[]
          id: string
          is_active: boolean
          max_products: number
          name: string
          price: number
          transaction_fee: number
          updated_at: string
          withdrawal_time: string
        }
        Insert: {
          created_at?: string
          currency?: string
          features?: string[]
          id?: string
          is_active?: boolean
          max_products: number
          name: string
          price: number
          transaction_fee: number
          updated_at?: string
          withdrawal_time: string
        }
        Update: {
          created_at?: string
          currency?: string
          features?: string[]
          id?: string
          is_active?: boolean
          max_products?: number
          name?: string
          price?: number
          transaction_fee?: number
          updated_at?: string
          withdrawal_time?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          checkout_background_color: string | null
          checkout_button_color: string | null
          checkout_text_color: string | null
          checkout_timer_enabled: boolean | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          checkout_background_color?: string | null
          checkout_button_color?: string | null
          checkout_text_color?: string | null
          checkout_timer_enabled?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          checkout_background_color?: string | null
          checkout_button_color?: string | null
          checkout_text_color?: string | null
          checkout_timer_enabled?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_holder_name: string | null
          account_number: string | null
          avatar_url: string | null
          balance: number | null
          bank_name: string | null
          created_at: string
          digital_wallet_identifier: string | null
          digital_wallet_type: string | null
          email: string
          fantasy_name: string | null
          id: string
          id_back_url: string | null
          id_front_url: string | null
          is_two_factor_enabled: boolean
          kyc_rejection_reason: string | null
          kyc_reviewed_at: string | null
          kyc_status: string | null
          kyc_submitted_at: string | null
          name: string
          phone: string | null
          plano_assinatura: string
          preferred_theme: string | null
          selfie_url: string | null
          status: string
          trial_end_date: string | null
          two_factor_secret: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_holder_name?: string | null
          account_number?: string | null
          avatar_url?: string | null
          balance?: number | null
          bank_name?: string | null
          created_at?: string
          digital_wallet_identifier?: string | null
          digital_wallet_type?: string | null
          email: string
          fantasy_name?: string | null
          id?: string
          id_back_url?: string | null
          id_front_url?: string | null
          is_two_factor_enabled?: boolean
          kyc_rejection_reason?: string | null
          kyc_reviewed_at?: string | null
          kyc_status?: string | null
          kyc_submitted_at?: string | null
          name: string
          phone?: string | null
          plano_assinatura?: string
          preferred_theme?: string | null
          selfie_url?: string | null
          status?: string
          trial_end_date?: string | null
          two_factor_secret?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_holder_name?: string | null
          account_number?: string | null
          avatar_url?: string | null
          balance?: number | null
          bank_name?: string | null
          created_at?: string
          digital_wallet_identifier?: string | null
          digital_wallet_type?: string | null
          email?: string
          fantasy_name?: string | null
          id?: string
          id_back_url?: string | null
          id_front_url?: string | null
          is_two_factor_enabled?: boolean
          kyc_rejection_reason?: string | null
          kyc_reviewed_at?: string | null
          kyc_status?: string | null
          kyc_submitted_at?: string | null
          name?: string
          phone?: string | null
          plano_assinatura?: string
          preferred_theme?: string | null
          selfie_url?: string | null
          status?: string
          trial_end_date?: string | null
          two_factor_secret?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recovery_codes: {
        Row: {
          created_at: string
          hashed_code: string
          id: string
          updated_at: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          hashed_code: string
          id?: string
          updated_at?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          hashed_code?: string
          id?: string
          updated_at?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          customer_email: string
          customer_name: string | null
          id: string
          payment_link: string | null
          payment_method: string | null
          product_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          customer_email: string
          customer_name?: string | null
          id?: string
          payment_link?: string | null
          payment_method?: string | null
          product_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_email?: string
          customer_name?: string | null
          id?: string
          payment_link?: string | null
          payment_method?: string | null
          product_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan_id: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_attempts: {
        Row: {
          attempt_number: number
          created_at: string
          error_message: string | null
          http_status: number | null
          id: string
          next_retry_at: string | null
          response_body: string | null
          succeeded: boolean
          webhook_endpoint_id: string
          webhook_event_id: string
        }
        Insert: {
          attempt_number?: number
          created_at?: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          next_retry_at?: string | null
          response_body?: string | null
          succeeded?: boolean
          webhook_endpoint_id: string
          webhook_event_id: string
        }
        Update: {
          attempt_number?: number
          created_at?: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          next_retry_at?: string | null
          response_body?: string | null
          succeeded?: boolean
          webhook_endpoint_id?: string
          webhook_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_attempts_webhook_endpoint_id_fkey"
            columns: ["webhook_endpoint_id"]
            isOneToOne: false
            referencedRelation: "webhook_endpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_attempts_webhook_event_id_fkey"
            columns: ["webhook_event_id"]
            isOneToOne: false
            referencedRelation: "webhook_events"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_endpoints: {
        Row: {
          created_at: string
          events: string[]
          failure_count: number
          id: string
          is_active: boolean
          last_failure_at: string | null
          secret_key: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          events?: string[]
          failure_count?: number
          id?: string
          is_active?: boolean
          last_failure_at?: string | null
          secret_key: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          events?: string[]
          failure_count?: number
          id?: string
          is_active?: boolean
          last_failure_at?: string | null
          secret_key?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          api_version: string
          created_at: string
          data: Json
          event_type: string
          id: string
          user_id: string
        }
        Insert: {
          api_version?: string
          created_at?: string
          data: Json
          event_type: string
          id?: string
          user_id: string
        }
        Update: {
          api_version?: string
          created_at?: string
          data?: Json
          event_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          account_number: string | null
          amount: number
          bank_name: string | null
          created_at: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number?: string | null
          amount: number
          bank_name?: string | null
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string | null
          amount?: number
          bank_name?: string | null
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_webhook_event: {
        Args: { p_data: Json; p_event_type: string; p_user_id: string }
        Returns: string
      }
      generate_webhook_secret: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_current_plan: {
        Args: { user_uuid: string }
        Returns: {
          features: string[]
          max_products: number
          plan_name: string
          transaction_fee: number
          withdrawal_time: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
