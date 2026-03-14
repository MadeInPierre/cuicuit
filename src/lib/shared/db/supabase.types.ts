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
            foreignKeyName: "ingredient_substitutions_substitute_ingredient_id_fkey"
            columns: ["substitute_ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_translations: {
        Row: {
          commonly_used: Database["public"]["Enums"]["commonly_used_level"]
          fts: unknown
          ingredient_id: string
          language_id: number
          name_general: string
          name_plural: string | null
          name_singular: string | null
        }
        Insert: {
          commonly_used?: Database["public"]["Enums"]["commonly_used_level"]
          fts?: unknown
          ingredient_id: string
          language_id: number
          name_general: string
          name_plural?: string | null
          name_singular?: string | null
        }
        Update: {
          commonly_used?: Database["public"]["Enums"]["commonly_used_level"]
          fts?: unknown
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
      recipe_ingredients: {
        Row: {
          details: string | null
          ingredient_id: string
          is_optional: boolean
          notes: string | null
          preparation: string | null
          quantity: number | null
          raw_input: string
          recipe_id: string
          unit: string | null
        }
        Insert: {
          details?: string | null
          ingredient_id: string
          is_optional?: boolean
          notes?: string | null
          preparation?: string | null
          quantity?: number | null
          raw_input: string
          recipe_id: string
          unit?: string | null
        }
        Update: {
          details?: string | null
          ingredient_id?: string
          is_optional?: boolean
          notes?: string | null
          preparation?: string | null
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
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
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
          courses: Database["public"]["Enums"]["course"][]
          created_at: string
          cuisines: Database["public"]["Enums"]["cuisine"][]
          description: string | null
          effort_level: Database["public"]["Enums"]["effort_level"]
          id: string
          image_ids: string[] | null
          language_id: number
          notes: string | null
          search_term: string | null
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
          times_of_day: Database["public"]["Enums"]["time_of_day"][]
          title: string
          tools: Database["public"]["Enums"]["recipe_tool"][]
          updated_at: string
        }
        Insert: {
          author_id: string
          cleanup_level: Database["public"]["Enums"]["cleanup_level"]
          cost_level: Database["public"]["Enums"]["cost_level"]
          courses: Database["public"]["Enums"]["course"][]
          created_at?: string
          cuisines: Database["public"]["Enums"]["cuisine"][]
          description?: string | null
          effort_level: Database["public"]["Enums"]["effort_level"]
          id?: string
          image_ids?: string[] | null
          language_id: number
          notes?: string | null
          search_term?: string | null
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
          times_of_day: Database["public"]["Enums"]["time_of_day"][]
          title: string
          tools: Database["public"]["Enums"]["recipe_tool"][]
          updated_at?: string
        }
        Update: {
          author_id?: string
          cleanup_level?: Database["public"]["Enums"]["cleanup_level"]
          cost_level?: Database["public"]["Enums"]["cost_level"]
          courses?: Database["public"]["Enums"]["course"][]
          created_at?: string
          cuisines?: Database["public"]["Enums"]["cuisine"][]
          description?: string | null
          effort_level?: Database["public"]["Enums"]["effort_level"]
          id?: string
          image_ids?: string[] | null
          language_id?: number
          notes?: string | null
          search_term?: string | null
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
          times_of_day?: Database["public"]["Enums"]["time_of_day"][]
          title?: string
          tools?: Database["public"]["Enums"]["recipe_tool"][]
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
          deleted_at: string | null
          id: string
          position: number
          recipe_id: string
          servings: number
          space_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          position?: number
          recipe_id: string
          servings?: number
          space_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
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
      space_plan_shopping_lists: {
        Row: {
          checked_at: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          ingredient_id: string | null
          meal_id: string | null
          meal_origin: string | null
          name: string | null
          quantity: number | null
          space_id: string
          type: string
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          checked_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          ingredient_id?: string | null
          meal_id?: string | null
          meal_origin?: string | null
          name?: string | null
          quantity?: number | null
          space_id: string
          type: string
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          checked_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          ingredient_id?: string | null
          meal_id?: string | null
          meal_origin?: string | null
          name?: string | null
          quantity?: number | null
          space_id?: string
          type?: string
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "space_plan_shopping_lists_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_plan_shopping_lists_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "space_plan_meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_plan_shopping_lists_space_id_fkey"
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
      [_ in never]: never
    }
    Functions: {
      get_shopping_recommendations: {
        Args: { space_id: string }
        Returns: {
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
        }[]
        SetofOptions: {
          from: "*"
          to: "ingredients"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      match_ingredient: {
        Args: {
          is_raw_import?: boolean
          lang_code: string
          n_matches?: number
          query_text: string
        }
        Returns: {
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
        }[]
        SetofOptions: {
          from: "*"
          to: "ingredients"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      slugify: { Args: { max_length?: number; value: string }; Returns: string }
      unaccent: { Args: { "": string }; Returns: string }
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
      course:
        | "appetizer"
        | "main"
        | "side"
        | "prep"
        | "salad"
        | "soup"
        | "dessert"
        | "snack"
        | "drink"
      cuisine:
        | "italian"
        | "mexican"
        | "indian"
        | "chinese"
        | "french"
        | "japanese"
        | "mediterranean"
        | "american"
        | "spanish"
        | "thai"
        | "greek"
        | "korean"
        | "vietnamese"
        | "middleeast"
        | "british"
        | "brazilian"
        | "caribbean"
        | "african"
      effort_level: "none" | "low" | "medium" | "high"
      ingredient_base_unit: "g" | "ml" | "unit"
      ingredient_substitution_strength:
        | "equivalent"
        | "close"
        | "far"
        | "variant"
      recipe_source_type: "website" | "user-manual"
      recipe_tool:
        | "blender"
        | "fryer"
        | "juicer"
        | "kettle"
        | "microwave"
        | "mixer"
        | "oven"
        | "scale"
        | "stove"
        | "toaster"
      skill_level: "beginner" | "intermediate" | "advanced" | "chef"
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
      time_of_day:
        | "breakfast"
        | "brunch"
        | "lunch"
        | "dinner"
        | "dessert"
        | "snack"
        | "drinks"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      cleanup_level: ["none", "low", "medium", "high"],
      commonly_used_level: ["daily", "common", "occasionally", "rare", "never"],
      cost_level: ["minimal", "budget", "average", "premium"],
      course: [
        "appetizer",
        "main",
        "side",
        "prep",
        "salad",
        "soup",
        "dessert",
        "snack",
        "drink",
      ],
      cuisine: [
        "italian",
        "mexican",
        "indian",
        "chinese",
        "french",
        "japanese",
        "mediterranean",
        "american",
        "spanish",
        "thai",
        "greek",
        "korean",
        "vietnamese",
        "middleeast",
        "british",
        "brazilian",
        "caribbean",
        "african",
      ],
      effort_level: ["none", "low", "medium", "high"],
      ingredient_base_unit: ["g", "ml", "unit"],
      ingredient_substitution_strength: [
        "equivalent",
        "close",
        "far",
        "variant",
      ],
      recipe_source_type: ["website", "user-manual"],
      recipe_tool: [
        "blender",
        "fryer",
        "juicer",
        "kettle",
        "microwave",
        "mixer",
        "oven",
        "scale",
        "stove",
        "toaster",
      ],
      skill_level: ["beginner", "intermediate", "advanced", "chef"],
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
      time_of_day: [
        "breakfast",
        "brunch",
        "lunch",
        "dinner",
        "dessert",
        "snack",
        "drinks",
      ],
    },
  },
} as const

