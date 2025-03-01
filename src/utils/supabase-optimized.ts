
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// Define valid table names explicitly to ensure type safety
type TableName = "bookmarks" | "thoughts" | "profiles" | "comments" | "follows" | 
  "genres" | "likes" | "messages" | "notifications" | "project_applications" | 
  "projects" | "tags" | "thought_categories" | "thought_tags" | "user_genres";

/**
 * Creates a function that optimistically updates a resource in the local cache
 * while making the server request in the background.
 * 
 * @param tableName - The name of the Supabase table
 * @returns A function that can be used to optimistically update a resource
 */
export const createOptimizedMutation = <T extends Record<string, any>>(tableName: TableName) => {
  return async (data: T, key: string): Promise<{ success: boolean, error: any }> => {
    try {
      // Perform the actual update on the server
      const { error } = await supabase
        .from(tableName as any)
        .insert(data as any);

      if (error) {
        throw error;
      }

      return { success: true, error: null };
    } catch (error) {
      console.error(`Error inserting into ${String(tableName)}:`, error);
      return { success: false, error };
    }
  };
};

/**
 * Creates a set of optimized query functions for a specific resource
 * 
 * @param tableName - The name of the Supabase table
 * @returns A function that can be used to fetch a resource
 */
export const createOptimizedQuery = <T extends Record<string, any>>(tableName: TableName) => {
  return {
    async getById(id: string): Promise<T | null> {
      try {
        const { data, error } = await supabase
          .from(tableName as any)
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        return data as any;
      } catch (error) {
        console.error(`Error fetching ${String(tableName)} by ID:`, error);
        return null;
      }
    },

    async getAll(): Promise<T[]> {
      try {
        const { data, error } = await supabase
          .from(tableName as any)
          .select('*');

        if (error) {
          throw error;
        }

        return (data || []) as any;
      } catch (error) {
        console.error(`Error fetching all ${String(tableName)}:`, error);
        return [];
      }
    },

    async getByField(field: keyof T, value: any): Promise<T | null> {
      try {
        const { data, error } = await supabase
          .from(tableName as any)
          .select('*')
          .eq(String(field), value)
          .single();

        if (error) {
          throw error;
        }

        return data as any;
      } catch (error) {
        console.error(`Error fetching ${String(tableName)} by field:`, error);
        return null;
      }
    },

    async getByFields(fields: Partial<T>): Promise<T | null> {
      try {
        let query = supabase
          .from(tableName as any)
          .select('*');

        // Apply each field as a filter
        for (const [field, value] of Object.entries(fields)) {
          query = query.eq(field, value);
        }

        const { data, error } = await query.single();

        if (error) {
          throw error;
        }

        return data as any;
      } catch (error) {
        console.error(`Error fetching ${String(tableName)} by fields:`, error);
        return null;
      }
    }
  };
};
