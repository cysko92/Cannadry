export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_name: string | null
          company_id: string | null
          created_at: string
          data: Json
          entity: string
          entity_id: string | null
          id: number
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_name?: string | null
          company_id?: string | null
          created_at?: string
          data?: Json
          entity: string
          entity_id?: string | null
          id?: never
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_name?: string | null
          company_id?: string | null
          created_at?: string
          data?: Json
          entity?: string
          entity_id?: string | null
          id?: never
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          company_id: string
          created_at: string
          id: string
          lot_id: string
          quantity_units: number
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          lot_id: string
          quantity_units: number
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          lot_id?: string
          quantity_units?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "product_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at: string
          id: string
          legal_name: string
          licence_number: string
          licence_type: string
          province: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["company_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at?: string
          id?: string
          legal_name: string
          licence_number: string
          licence_type: string
          province: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["company_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          created_at?: string
          id?: string
          legal_name?: string
          licence_number?: string
          licence_type?: string
          province?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["company_status"]
          updated_at?: string
        }
        Relationships: []
      }
      licence_documents: {
        Row: {
          company_id: string
          file_name: string
          id: string
          storage_path: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          company_id: string
          file_name: string
          id?: string
          storage_path: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          company_id?: string
          file_name?: string
          id?: string
          storage_path?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "licence_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      order_events: {
        Row: {
          actor_id: string | null
          actor_name: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["order_status"] | null
          id: string
          note: string | null
          order_id: string
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: string
          note?: string | null
          order_id: string
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: string
          note?: string | null
          order_id?: string
          to_status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          line_total_cents: number
          lot_id: string
          order_id: string
          product_id: string
          quantity_units: number
          snapshot: Json
          unit_price_cents: number
        }
        Insert: {
          id?: string
          line_total_cents: number
          lot_id: string
          order_id: string
          product_id: string
          quantity_units: number
          snapshot: Json
          unit_price_cents: number
        }
        Update: {
          id?: string
          line_total_cents?: number
          lot_id?: string
          order_id?: string
          product_id?: string
          quantity_units?: number
          snapshot?: Json
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "product_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "catalogue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          company_id: string
          created_at: string
          id: string
          invoice_path: string | null
          notes: string | null
          placed_by: string
          po_number: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal_cents: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          invoice_path?: string | null
          notes?: string | null
          placed_by: string
          po_number?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_cents?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          invoice_path?: string | null
          notes?: string | null
          placed_by?: string
          po_number?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      producers: {
        Row: {
          active: boolean
          city: string | null
          created_at: string
          description: string | null
          id: string
          licence_number: string
          name: string
          province: string | null
        }
        Insert: {
          active?: boolean
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          licence_number: string
          name: string
          province?: string | null
        }
        Update: {
          active?: boolean
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          licence_number?: string
          name?: string
          province?: string | null
        }
        Relationships: []
      }
      product_lots: {
        Row: {
          active: boolean
          cbd_pct: number | null
          coa_path: string | null
          created_at: string
          harvest_date: string | null
          id: string
          lot_number: string
          packaging_date: string | null
          product_id: string
          stock_units: number
          terpenes: Json
          thc_pct: number | null
        }
        Insert: {
          active?: boolean
          cbd_pct?: number | null
          coa_path?: string | null
          created_at?: string
          harvest_date?: string | null
          id?: string
          lot_number: string
          packaging_date?: string | null
          product_id: string
          stock_units?: number
          terpenes?: Json
          thc_pct?: number | null
        }
        Update: {
          active?: boolean
          cbd_pct?: number | null
          coa_path?: string | null
          created_at?: string
          harvest_date?: string | null
          id?: string
          lot_number?: string
          packaging_date?: string | null
          product_id?: string
          stock_units?: number
          terpenes?: Json
          thc_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "catalogue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          format: string
          id: string
          image_path: string | null
          lead_time_days: number
          min_order_units: number
          name: string
          price_per_unit_cents: number
          producer_id: string
          size_label: string
          status: Database["public"]["Enums"]["product_status"]
          units_per_case: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          format: string
          id?: string
          image_path?: string | null
          lead_time_days?: number
          min_order_units?: number
          name: string
          price_per_unit_cents: number
          producer_id: string
          size_label: string
          status?: Database["public"]["Enums"]["product_status"]
          units_per_case: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          format?: string
          id?: string
          image_path?: string | null
          lead_time_days?: number
          min_order_units?: number
          name?: string
          price_per_unit_cents?: number
          producer_id?: string
          size_label?: string
          status?: Database["public"]["Enums"]["product_status"]
          units_per_case?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "producers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string | null
          company_role: string
          created_at: string
          email: string
          full_name: string
          id: string
          is_admin: boolean
          phone: string | null
        }
        Insert: {
          company_id?: string | null
          company_role?: string
          created_at?: string
          email: string
          full_name: string
          id: string
          is_admin?: boolean
          phone?: string | null
        }
        Update: {
          company_id?: string | null
          company_role?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_admin?: boolean
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      catalogue: {
        Row: {
          category_id: string | null
          category_name: string | null
          category_slug: string | null
          cbd_max: number | null
          cbd_min: number | null
          created_at: string | null
          description: string | null
          format: string | null
          id: string | null
          lead_time_days: number | null
          lot_count: number | null
          min_order_units: number | null
          name: string | null
          price_per_unit_cents: number | null
          producer_id: string | null
          producer_licence: string | null
          producer_name: string | null
          size_label: string | null
          status: Database["public"]["Enums"]["product_status"] | null
          stock_units: number | null
          thc_max: number | null
          thc_min: number | null
          units_per_case: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "producers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_access_request: {
        Args: {
          p_address: string
          p_company_id: string
          p_contact_email: string
          p_contact_name: string
          p_contact_phone: string
          p_document_name: string
          p_document_path: string
          p_legal_name: string
          p_licence_number: string
          p_licence_type: string
          p_province: string
          p_user_id: string
        }
        Returns: string
      }
      current_company_id: { Args: never; Returns: string }
      is_active_buyer: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      place_order: { Args: { p_notes?: string }; Returns: string }
      review_company: {
        Args: {
          p_company_id: string
          p_decision: Database["public"]["Enums"]["company_status"]
          p_note?: string
        }
        Returns: undefined
      }
      set_company_status: {
        Args: {
          p_company_id: string
          p_note?: string
          p_status: Database["public"]["Enums"]["company_status"]
        }
        Returns: undefined
      }
      set_order_invoice: {
        Args: { p_order_id: string; p_path: string }
        Returns: undefined
      }
      set_order_status: {
        Args: {
          p_note?: string
          p_order_id: string
          p_status: Database["public"]["Enums"]["order_status"]
        }
        Returns: undefined
      }
      write_audit: {
        Args: {
          p_action: string
          p_company_id: string
          p_data?: Json
          p_entity: string
          p_entity_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      company_status: "pending" | "approved" | "rejected" | "suspended"
      order_status:
        | "submitted"
        | "accepted"
        | "rejected"
        | "shipped"
        | "delivered"
        | "cancelled"
      product_status: "draft" | "published" | "archived"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
    Enums: {
      company_status: ["pending", "approved", "rejected", "suspended"],
      order_status: [
        "submitted",
        "accepted",
        "rejected",
        "shipped",
        "delivered",
        "cancelled",
      ],
      product_status: ["draft", "published", "archived"],
    },
  },
} as const

