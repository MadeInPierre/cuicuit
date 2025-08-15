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
          variables?: Json
          operationName?: string
          query?: string
          extensions?: Json
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
      courses: {
        Row: {
          id: string
        }
        Insert: {
          id: string
        }
        Update: {
          id?: string
        }
        Relationships: []
      }
      cuisines: {
        Row: {
          id: string
          region: string | null
        }
        Insert: {
          id: string
          region?: string | null
        }
        Update: {
          id?: string
          region?: string | null
        }
        Relationships: []
      }
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
          fts: unknown | null
          ingredient_id: string
          language_id: number
          name_general: string
          name_plural: string | null
          name_singular: string | null
        }
        Insert: {
          commonly_used?: Database["public"]["Enums"]["commonly_used_level"]
          fts?: unknown | null
          ingredient_id: string
          language_id: number
          name_general: string
          name_plural?: string | null
          name_singular?: string | null
        }
        Update: {
          commonly_used?: Database["public"]["Enums"]["commonly_used_level"]
          fts?: unknown | null
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
      recipe_courses: {
        Row: {
          course_id: string
          recipe_id: string
        }
        Insert: {
          course_id: string
          recipe_id: string
        }
        Update: {
          course_id?: string
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_courses_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_cuisines: {
        Row: {
          cuisine_id: string
          recipe_id: string
        }
        Insert: {
          cuisine_id: string
          recipe_id: string
        }
        Update: {
          cuisine_id?: string
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_cuisines_cuisine_id_fkey"
            columns: ["cuisine_id"]
            isOneToOne: false
            referencedRelation: "cuisines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_cuisines_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          details: string | null
          ingredient_id: string
          notes: string | null
          quantity: number | null
          raw_input: string
          recipe_id: string
          unit: string | null
        }
        Insert: {
          details?: string | null
          ingredient_id: string
          notes?: string | null
          quantity?: number | null
          raw_input: string
          recipe_id: string
          unit?: string | null
        }
        Update: {
          details?: string | null
          ingredient_id?: string
          notes?: string | null
          quantity?: number | null
          raw_input?: string
          recipe_id?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients_with_translations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_tags: {
        Row: {
          recipe_id: string
          tag_id: number
        }
        Insert: {
          recipe_id: string
          tag_id: number
        }
        Update: {
          recipe_id?: string
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipe_tags_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_times_of_day: {
        Row: {
          recipe_id: string
          timeofday_id: string
        }
        Insert: {
          recipe_id: string
          timeofday_id: string
        }
        Update: {
          recipe_id?: string
          timeofday_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_times_of_day_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_times_of_day_timeofday_id_fkey"
            columns: ["timeofday_id"]
            isOneToOne: false
            referencedRelation: "times_of_day"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_tools: {
        Row: {
          recipe_id: string
          tool_id: string
        }
        Insert: {
          recipe_id: string
          tool_id: string
        }
        Update: {
          recipe_id?: string
          tool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_tools_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          author_id: string
          cleanup_level: Database["public"]["Enums"]["cleanup_level"]
          cost_level: Database["public"]["Enums"]["cost_level"]
          created_at: string
          description: string | null
          effort_level: Database["public"]["Enums"]["effort_level"]
          id: string
          image_ids: string[] | null
          language_id: number
          notes: string | null
          servings: number
          skill_level: Database["public"]["Enums"]["skill_level"]
          slug: string
          source_type: Database["public"]["Enums"]["recipe_source_type"]
          source_url: string | null
          steps: string[] | null
          time_cook_minutes: number | null
          time_prep_minutes: number | null
          time_rest_minutes: number | null
          time_total_minutes: number | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          cleanup_level: Database["public"]["Enums"]["cleanup_level"]
          cost_level: Database["public"]["Enums"]["cost_level"]
          created_at?: string
          description?: string | null
          effort_level: Database["public"]["Enums"]["effort_level"]
          id?: string
          image_ids?: string[] | null
          language_id: number
          notes?: string | null
          servings: number
          skill_level: Database["public"]["Enums"]["skill_level"]
          slug: string
          source_type: Database["public"]["Enums"]["recipe_source_type"]
          source_url?: string | null
          steps?: string[] | null
          time_cook_minutes?: number | null
          time_prep_minutes?: number | null
          time_rest_minutes?: number | null
          time_total_minutes?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          cleanup_level?: Database["public"]["Enums"]["cleanup_level"]
          cost_level?: Database["public"]["Enums"]["cost_level"]
          created_at?: string
          description?: string | null
          effort_level?: Database["public"]["Enums"]["effort_level"]
          id?: string
          image_ids?: string[] | null
          language_id?: number
          notes?: string | null
          servings?: number
          skill_level?: Database["public"]["Enums"]["skill_level"]
          slug?: string
          source_type?: Database["public"]["Enums"]["recipe_source_type"]
          source_url?: string | null
          steps?: string[] | null
          time_cook_minutes?: number | null
          time_prep_minutes?: number | null
          time_rest_minutes?: number | null
          time_total_minutes?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
        ]
      }
      space_members: {
        Row: {
          created_at: string
          space_id: string
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          space_id: string
          theme: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          space_id?: string
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_members_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_plan_meals: {
        Row: {
          created_at: string | null
          id: string
          position: number
          recipe_id: string
          servings: number
          space_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          position?: number
          recipe_id: string
          servings?: number
          space_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          position?: number
          recipe_id?: string
          servings?: number
          space_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "space_plan_meals_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_plan_meals_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          author_id: string
          created_at: string
          icon: string
          id: string
          initial_theme: string
          locale: string
          name: string
          updated_at: string
        }
        Insert: {
          author_id: string
          created_at?: string
          icon: string
          id?: string
          initial_theme: string
          locale: string
          name: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          created_at?: string
          icon?: string
          id?: string
          initial_theme?: string
          locale?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      times_of_day: {
        Row: {
          id: string
        }
        Insert: {
          id: string
        }
        Update: {
          id?: string
        }
        Relationships: []
      }
      tools: {
        Row: {
          id: string
        }
        Insert: {
          id: string
        }
        Update: {
          id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          first_name: string
          last_name: string
          onboarding_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          first_name: string
          last_name: string
          onboarding_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          first_name?: string
          last_name?: string
          onboarding_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_public_profiles: {
        Row: {
          created_at: string
          icon: string
          image_url: string | null
          updated_at: string
          user_id: string
          user_name: string
        }
        Insert: {
          created_at?: string
          icon: string
          image_url?: string | null
          updated_at?: string
          user_id: string
          user_name: string
        }
        Update: {
          created_at?: string
          icon?: string
          image_url?: string | null
          updated_at?: string
          user_id?: string
          user_name?: string
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
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
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
        Returns: string
      }
      match_ingredient: {
        Args:
          | { lang: string; query: string }
          | { lang: string; query: string; n_matches?: number }
        Returns: {
          commonly_used: Database["public"]["Enums"]["commonly_used_level"]
          fts: unknown | null
          ingredient_id: string
          language_id: number
          name_general: string
          name_plural: string | null
          name_singular: string | null
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      slugify: {
        Args: { value: string; max_length?: number }
        Returns: string
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
      unaccent: {
        Args: { "": string }
        Returns: string
      }
      unaccent_init: {
        Args: { "": unknown }
        Returns: unknown
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
      cleanup_level: "none" | "low" | "medium" | "high"
      commonly_used_level:
        | "daily"
        | "common"
        | "occasionally"
        | "rare"
        | "never"
      cost_level: "minimal" | "budget" | "average" | "premium"
      effort_level: "none" | "low" | "medium" | "high"
      group_condition: "all" | "at_least_one" | "at_least_n"
      ingredient_base_unit: "g" | "ml" | "unit"
      ingredient_substitution_strength:
        | "equivalent"
        | "close"
        | "far"
        | "variant"
      recipe_region:
        | "africa"
        | "asia"
        | "europe"
        | "north-america"
        | "south-america"
        | "oceania"
      recipe_source_type: "website" | "user-manual"
      skill_level: "beginner" | "intermediate" | "advanced" | "chef"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      cleanup_level: ["none", "low", "medium", "high"],
      commonly_used_level: ["daily", "common", "occasionally", "rare", "never"],
      cost_level: ["minimal", "budget", "average", "premium"],
      effort_level: ["none", "low", "medium", "high"],
      group_condition: ["all", "at_least_one", "at_least_n"],
      ingredient_base_unit: ["g", "ml", "unit"],
      ingredient_substitution_strength: [
        "equivalent",
        "close",
        "far",
        "variant",
      ],
      recipe_region: [
        "africa",
        "asia",
        "europe",
        "north-america",
        "south-america",
        "oceania",
      ],
      recipe_source_type: ["website", "user-manual"],
      skill_level: ["beginner", "intermediate", "advanced", "chef"],
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

