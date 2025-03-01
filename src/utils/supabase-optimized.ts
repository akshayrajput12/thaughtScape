
import { supabase } from "@/integrations/supabase/client";

/**
 * Creates a function that optimistically updates a resource in the local cache
 * before sending the update to the server.
 * 
 * @param tableName - The name of the Supabase table
 * @returns A function that can be used to optimistically update a resource
 */
export const createOptimizedMutation = <T extends Record<string, any>>(tableName: string) => {
  return async (data: T, key: string): Promise<{ success: boolean, error: any }> => {
    try {
      // Perform the actual update on the server
      const { error } = await supabase
        .from(tableName)
        .insert(data);

      if (error) {
        throw error;
      }

      return { success: true, error: null };
    } catch (error) {
      console.error(`Error in optimized mutation for ${tableName}:`, error);
      return { success: false, error };
    }
  };
};

/**
 * Creates a function that fetches a resource from Supabase with optimistic cache updates
 * 
 * @param tableName - The name of the Supabase table
 * @returns A function that can be used to fetch a resource
 */
export const createOptimizedQuery = <T extends Record<string, any>>(tableName: string) => {
  return {
    async getById(id: string): Promise<T | null> {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        // Use type assertion to avoid deep instantiation errors
        return data as unknown as T;
      } catch (error) {
        console.error(`Error fetching ${tableName} by ID:`, error);
        return null;
      }
    },

    async getAll(): Promise<T[]> {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*');

        if (error) {
          throw error;
        }

        // Use type assertion to avoid deep instantiation errors
        return data as unknown as T[];
      } catch (error) {
        console.error(`Error fetching all ${tableName}:`, error);
        return [];
      }
    },

    async getByField(field: string, value: any): Promise<T | null> {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq(field, value)
          .single();

        if (error) {
          throw error;
        }

        // Use type assertion to avoid deep instantiation errors
        return data as unknown as T;
      } catch (error) {
        console.error(`Error fetching ${tableName} by field:`, error);
        return null;
      }
    },

    async getByFields(fields: Record<string, any>): Promise<T | null> {
      try {
        let query = supabase
          .from(tableName)
          .select('*');

        for (const [field, value] of Object.entries(fields)) {
          query = query.eq(field, value);
        }

        const { data, error } = await query.single();

        if (error) {
          throw error;
        }

        // Use type assertion to avoid deep instantiation errors
        return data as unknown as T;
      } catch (error) {
        console.error(`Error fetching ${tableName} by fields:`, error);
        return null;
      }
    },
  };
};
