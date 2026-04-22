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
  public: {
    Tables: {
      branch_inventory: {
        Row: {
          branch_id: string
          id: string
          in_stock: boolean
          product_id: number
          stock: number
          updated_at: string
        }
        Insert: {
          branch_id: string
          id?: string
          in_stock?: boolean
          product_id: number
          stock?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string
          id?: string
          in_stock?: boolean
          product_id?: number
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_inventory_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_reviews: {
        Row: {
          branch_id: string
          comment: string | null
          created_at: string
          id: string
          order_id: string | null
          rating: number
          user_id: string
        }
        Insert: {
          branch_id: string
          comment?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          rating: number
          user_id: string
        }
        Update: {
          branch_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_reviews_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          active: boolean
          address: string
          closes_at: string | null
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          name: string
          opens_at: string | null
          phone: string | null
          slug: string
        }
        Insert: {
          active?: boolean
          address: string
          closes_at?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          opens_at?: string | null
          phone?: string | null
          slug: string
        }
        Update: {
          active?: boolean
          address?: string
          closes_at?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          opens_at?: string | null
          phone?: string | null
          slug?: string
        }
        Relationships: []
      }
      customer_flags: {
        Row: {
          branch_id: string
          created_at: string
          customer_id: string
          flagged_by: string
          id: string
          order_id: string | null
          reason: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          customer_id: string
          flagged_by: string
          id?: string
          order_id?: string | null
          reason?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          customer_id?: string
          flagged_by?: string
          id?: string
          order_id?: string | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_flags_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_flags_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          accepted_at: string | null
          address: string
          assigned_to: string | null
          branch_id: string | null
          city: string
          created_at: string
          delivery_fee: number
          deposit_amount: number
          deposit_paid: boolean
          full_name: string
          id: string
          items: Json
          momo_phone: string
          notes: string | null
          phone: string
          picked_up_at: string | null
          pickup_time: string | null
          ready_at: string | null
          status: string
          subtotal: number
          total: number
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          address: string
          assigned_to?: string | null
          branch_id?: string | null
          city?: string
          created_at?: string
          delivery_fee?: number
          deposit_amount?: number
          deposit_paid?: boolean
          full_name: string
          id?: string
          items: Json
          momo_phone: string
          notes?: string | null
          phone: string
          picked_up_at?: string | null
          pickup_time?: string | null
          ready_at?: string | null
          status?: string
          subtotal: number
          total: number
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          address?: string
          assigned_to?: string | null
          branch_id?: string | null
          city?: string
          created_at?: string
          delivery_fee?: number
          deposit_amount?: number
          deposit_paid?: boolean
          full_name?: string
          id?: string
          items?: Json
          momo_phone?: string
          notes?: string | null
          phone?: string
          picked_up_at?: string | null
          pickup_time?: string | null
          ready_at?: string | null
          status?: string
          subtotal?: number
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      products_i18n: {
        Row: {
          category: string | null
          lang: string
          name: string
          product_id: number
          unit: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          lang: string
          name: string
          product_id: number
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          lang?: string
          name?: string
          product_id?: number
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          branch_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_branch_role: {
        Args: {
          _branch_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      seed_branch_inventory: {
        Args: { _product_ids: number[] }
        Returns: number
      }
      user_branch_id: { Args: { _user_id: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "branch_manager" | "branch_staff" | "customer"
      order_status:
        | "pending_payment"
        | "pending"
        | "accepted"
        | "preparing"
        | "ready"
        | "picked_up"
        | "cancelled"
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
      app_role: ["admin", "branch_manager", "branch_staff", "customer"],
      order_status: [
        "pending_payment",
        "pending",
        "accepted",
        "preparing",
        "ready",
        "picked_up",
        "cancelled",
      ],
    },
  },
} as const
