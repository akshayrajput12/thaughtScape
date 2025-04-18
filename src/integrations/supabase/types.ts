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
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_users_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string
          thought_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          thought_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          thought_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_thought_id_fkey"
            columns: ["thought_id"]
            isOneToOne: false
            referencedRelation: "thoughts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      call_logs: {
        Row: {
          call_type: string
          caller_id: string
          created_at: string
          duration: number | null
          end_time: string | null
          id: string
          recipient_id: string
          start_time: string
          status: string
        }
        Insert: {
          call_type: string
          caller_id: string
          created_at?: string
          duration?: number | null
          end_time?: string | null
          id?: string
          recipient_id: string
          start_time?: string
          status: string
        }
        Update: {
          call_type?: string
          caller_id?: string
          created_at?: string
          duration?: number | null
          end_time?: string | null
          id?: string
          recipient_id?: string
          start_time?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_caller_id_fkey"
            columns: ["caller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          thought_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          thought_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          thought_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_thought_id_fkey"
            columns: ["thought_id"]
            isOneToOne: false
            referencedRelation: "thoughts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      genres: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          thought_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          thought_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          thought_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_thought_id_fkey"
            columns: ["thought_id"]
            isOneToOne: false
            referencedRelation: "thoughts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          is_request: boolean | null
          receiver_id: string
          request_status: string | null
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          is_request?: boolean | null
          receiver_id: string
          request_status?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          is_request?: boolean | null
          receiver_id?: string
          request_status?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          related_thought_id: string | null
          related_user_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          related_thought_id?: string | null
          related_user_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          related_thought_id?: string | null
          related_user_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_thought_id_fkey"
            columns: ["related_thought_id"]
            isOneToOne: false
            referencedRelation: "thoughts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          college: string | null
          country: string | null
          created_at: string
          followers_count: number | null
          following_count: number | null
          full_name: string | null
          genres: string[] | null
          id: string
          is_admin: boolean | null
          is_profile_completed: boolean | null
          phone: string | null
          posts_count: number | null
          registration_number: string | null
          state: string | null
          updated_at: string
          username: string
          whatsapp_number: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          college?: string | null
          country?: string | null
          created_at?: string
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          genres?: string[] | null
          id: string
          is_admin?: boolean | null
          is_profile_completed?: boolean | null
          phone?: string | null
          posts_count?: number | null
          registration_number?: string | null
          state?: string | null
          updated_at?: string
          username: string
          whatsapp_number?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          college?: string | null
          country?: string | null
          created_at?: string
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          genres?: string[] | null
          id?: string
          is_admin?: boolean | null
          is_profile_completed?: boolean | null
          phone?: string | null
          posts_count?: number | null
          registration_number?: string | null
          state?: string | null
          updated_at?: string
          username?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      project_applications: {
        Row: {
          applicant_id: string
          created_at: string
          experience: string | null
          id: string
          message: string
          phone_number: string | null
          portfolio: string | null
          project_id: string
          status: string | null
          viewed_at: string | null
        }
        Insert: {
          applicant_id: string
          created_at?: string
          experience?: string | null
          id?: string
          message: string
          phone_number?: string | null
          portfolio?: string | null
          project_id: string
          status?: string | null
          viewed_at?: string | null
        }
        Update: {
          applicant_id?: string
          created_at?: string
          experience?: string | null
          id?: string
          message?: string
          phone_number?: string | null
          portfolio?: string | null
          project_id?: string
          status?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_applications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          allow_normal_apply: boolean | null
          allow_whatsapp_apply: boolean | null
          attachment_url: string | null
          author_id: string
          created_at: string
          deadline: string | null
          description: string
          id: string
          max_budget: number | null
          min_budget: number | null
          notifications_count: number | null
          required_skills: string[] | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          allow_normal_apply?: boolean | null
          allow_whatsapp_apply?: boolean | null
          attachment_url?: string | null
          author_id: string
          created_at?: string
          deadline?: string | null
          description: string
          id?: string
          max_budget?: number | null
          min_budget?: number | null
          notifications_count?: number | null
          required_skills?: string[] | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          allow_normal_apply?: boolean | null
          allow_whatsapp_apply?: boolean | null
          attachment_url?: string | null
          author_id?: string
          created_at?: string
          deadline?: string | null
          description?: string
          id?: string
          max_budget?: number | null
          min_budget?: number | null
          notifications_count?: number | null
          required_skills?: string[] | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          status: string | null
          thought_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          status?: string | null
          thought_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          status?: string | null
          thought_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_thought_id_fkey"
            columns: ["thought_id"]
            isOneToOne: false
            referencedRelation: "thoughts"
            referencedColumns: ["id"]
          },
        ]
      }
      thought_categories: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      thought_tags: {
        Row: {
          tag_id: string
          thought_id: string
        }
        Insert: {
          tag_id: string
          thought_id: string
        }
        Update: {
          tag_id?: string
          thought_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poem_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thought_tags_thought_id_fkey"
            columns: ["thought_id"]
            isOneToOne: false
            referencedRelation: "thoughts"
            referencedColumns: ["id"]
          },
        ]
      }
      thoughts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "poems_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thoughts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_genres: {
        Row: {
          genre_id: string
          user_id: string
        }
        Insert: {
          genre_id: string
          user_id: string
        }
        Update: {
          genre_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_genres_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "thought_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_genres_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_messages: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_old_messages: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_unconfirmed_users: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_suggested_users: {
        Args: { user_id: string }
        Returns: {
          id: string
          username: string
          full_name: string
          avatar_url: string
          created_at: string
          updated_at: string
          is_following: boolean
          followers_count: number
          following_count: number
          posts_count: number
        }[]
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
      has_user_applied: {
        Args: { project_id: string; user_id: string }
        Returns: boolean
      }
      is_blocked: {
        Args: { user_id: string; target_id: string }
        Returns: boolean
      }
      search_users: {
        Args: { search_query: string; current_user_id: string }
        Returns: {
          id: string
          username: string
          full_name: string
          avatar_url: string
          is_following: boolean
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
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
