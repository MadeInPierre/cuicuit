export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ingredient_substitutions: {
        Row: {
          id: string
          original_ingredient_id: string
          original_to_substitute_ratio: number
          strength: Database["public"]["Enums"]["ingredient_substitution_strength"]
          substitute_ingredient_id: string
        }
        Insert: {
          id?: string
          original_ingredient_id: string
          original_to_substitute_ratio?: number
          strength: Database["public"]["Enums"]["ingredient_substitution_strength"]
          substitute_ingredient_id: string
        }
        Update: {
          id?: string
          original_ingredient_id?: string
          original_to_substitute_ratio?: number
          strength?: Database["public"]["Enums"]["ingredient_substitution_strength"]
          substitute_ingredient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_substitutions_original_ingredient_id_fkey"
            columns: ["original_ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_substitutions_original_ingredient_id_fkey"
            columns: ["original_ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients_with_translations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_substitutions_substitute_ingredient_id_fkey"
            columns: ["substitute_ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_substitutions_substitute_ingredient_id_fkey"
            columns: ["substitute_ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients_with_translations"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_translations: {
        Row: {
          commonly_used: Database["public"]["Enums"]["commonly_used_level"]
          ingredient_id: string
          language_id: number
          name_general: string
          name_plural: string | null
          name_singular: string | null
        }
        Insert: {
          commonly_used?: Database["public"]["Enums"]["commonly_used_level"]
          ingredient_id: string
          language_id: number
          name_general: string
          name_plural?: string | null
          name_singular?: string | null
        }
        Update: {
          commonly_used?: Database["public"]["Enums"]["commonly_used_level"]
          ingredient_id?: string
          language_id?: number
          name_general?: string
          name_plural?: string | null
          name_singular?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_translations_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_translations_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients_with_translations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_translations_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          aisle: Database["public"]["Enums"]["supermarket_aisle"] | null
          base_unit: Database["public"]["Enums"]["ingredient_base_unit"]
          embedding: string | null
          g_per_ml: number | null
          g_per_unit: Json | null
          hierarchy: string[]
          id: string
          slug: string
          slug_general: string
          unit_frequencies: Json | null
        }
        Insert: {
          aisle?: Database["public"]["Enums"]["supermarket_aisle"] | null
          base_unit: Database["public"]["Enums"]["ingredient_base_unit"]
          embedding?: string | null
          g_per_ml?: number | null
          g_per_unit?: Json | null
          hierarchy: string[]
          id?: string
          slug: string
          slug_general: string
          unit_frequencies?: Json | null
        }
        Update: {
          aisle?: Database["public"]["Enums"]["supermarket_aisle"] | null
          base_unit?: Database["public"]["Enums"]["ingredient_base_unit"]
          embedding?: string | null
          g_per_ml?: number | null
          g_per_unit?: Json | null
          hierarchy?: string[]
          id?: string
          slug?: string
          slug_general?: string
          unit_frequencies?: Json | null
        }
        Relationships: []
      }
      languages: {
        Row: {
          code: string
          country_en: string
          country_local: string
          emoji: string | null
          id: number
          lang: string
          name_en: string
          name_local: string
        }
        Insert: {
          code: string
          country_en: string
          country_local: string
          emoji?: string | null
          id?: number
          lang: string
          name_en: string
          name_local: string
        }
        Update: {
          code?: string
          country_en?: string
          country_local?: string
          emoji?: string | null
          id?: number
          lang?: string
          name_en?: string
          name_local?: string
        }
        Relationships: []
      }
    }
    Views: {
      ingredients_with_translations: {
        Row: {
          aisle: Database["public"]["Enums"]["supermarket_aisle"] | null
          base_unit: Database["public"]["Enums"]["ingredient_base_unit"] | null
          commonly_used:
            | Database["public"]["Enums"]["commonly_used_level"]
            | null
          embedding: string | null
          g_per_ml: number | null
          g_per_unit: Json | null
          hierarchy: string[] | null
          id: string | null
          ingredient_id: string | null
          lang: string | null
          language_id: number | null
          name_general: string | null
          name_plural: string | null
          name_singular: string | null
          slug: string | null
          slug_general: string | null
          unit_frequencies: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_translations_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_translations_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients_with_translations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_translations_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
        ]
      }
      supermarket_aisles: {
        Row: {
          aisle: Database["public"]["Enums"]["supermarket_aisle"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      commonly_used_level:
        | "daily"
        | "common"
        | "occasionally"
        | "rare"
        | "never"
      group_condition: "all" | "at_least_one" | "at_least_n"
      ingredient_base_unit: "g" | "ml" | "unit"
      ingredient_substitution_strength:
        | "equivalent"
        | "close"
        | "far"
        | "variant"
      substitution_strength: "equivalent" | "close" | "far"
      supermarket_aisle:
        | "beverages"
        | "bread-pastries"
        | "care-health"
        | "frozen-convenience"
        | "fruits-vegetables"
        | "grain-products"
        | "home-garden"
        | "household"
        | "ingredients-spices"
        | "meat-fish"
        | "milk-cheese"
        | "pet-supplies"
        | "snacks-sweets"
        | "unknown"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      commonly_used_level: ["daily", "common", "occasionally", "rare", "never"],
      group_condition: ["all", "at_least_one", "at_least_n"],
      ingredient_base_unit: ["g", "ml", "unit"],
      ingredient_substitution_strength: [
        "equivalent",
        "close",
        "far",
        "variant",
      ],
      substitution_strength: ["equivalent", "close", "far"],
      supermarket_aisle: [
        "beverages",
        "bread-pastries",
        "care-health",
        "frozen-convenience",
        "fruits-vegetables",
        "grain-products",
        "home-garden",
        "household",
        "ingredients-spices",
        "meat-fish",
        "milk-cheese",
        "pet-supplies",
        "snacks-sweets",
        "unknown",
      ],
    },
  },
} as const
