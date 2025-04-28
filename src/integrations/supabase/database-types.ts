export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      advertisements: {
        Row: {
          id: string
          title: string
          description: string
          images: string[]
          main_image_index: number
          link_url?: string
          created_at: string
          updated_at: string
          author_id: string
          is_active: boolean
          display_location: string[]
          category?: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          images?: string[]
          main_image_index?: number
          link_url?: string
          created_at?: string
          updated_at?: string
          author_id: string
          is_active?: boolean
          display_location?: string[]
          category?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          images?: string[]
          main_image_index?: number
          link_url?: string
          created_at?: string
          updated_at?: string
          author_id?: string
          is_active?: boolean
          display_location?: string[]
          category?: string
        }
        Relationships: [
          {
            foreignKeyName: "advertisements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      // Other tables would be defined here
    }
  }
}
