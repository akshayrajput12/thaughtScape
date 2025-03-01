
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Cache the Supabase client instance to avoid multiple instances
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

// Create a singleton Supabase client
export function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const SUPABASE_URL = "https://oxnbnaznhubhqfjyllms.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94bmJuYXpuaHViaHFmanlsbG1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2MzM3NDMsImV4cCI6MjA1MTIwOTc0M30.BxJB2-7bMCHZhgby4HudUTnTrvRwjECWFixDPjnmGwg";

  // Configure with reasonable defaults for optimized performance
  supabaseInstance = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    global: {
      headers: {
        'x-application-name': 'thoughtscape',
      },
    },
  });

  return supabaseInstance;
}

// Define a type safe table name
export type TableName = keyof Database['public']['Tables'];

// Helper for creating optimized query builders with proper typing
export function createOptimizedQuery<T extends Record<string, any>>(tableName: TableName) {
  const client = getSupabaseClient();
  
  return {
    getById: async (id: string) => {
      const { data, error } = await client
        .from(tableName)
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      // Break the recursive type reference by using explicit unknown casting
      return data as unknown as T;
    },
    
    getByUserId: async (userId: string) => {
      const { data, error } = await client
        .from(tableName)
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      // Break the recursive type reference by using explicit unknown casting
      return data as unknown as T[];
    },
    
    create: async (record: Partial<T>) => {
      // Using explicit casting to avoid TypeScript errors with any intermediary
      const { data, error } = await client
        .from(tableName)
        .insert(record as any)
        .select()
        .single();
      
      if (error) throw error;
      // Break the recursive type reference by using explicit unknown casting
      return data as unknown as T;
    },
    
    update: async (id: string, updates: Partial<T>) => {
      // Using explicit casting to avoid TypeScript errors with any intermediary
      const { data, error } = await client
        .from(tableName)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      // Break the recursive type reference by using explicit unknown casting
      return data as unknown as T;
    },
    
    delete: async (id: string) => {
      const { error } = await client
        .from(tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    },
    
    subscribeToChanges: (callback: (payload: any) => void) => {
      return client
        .channel(`${tableName}-changes`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: tableName },
          callback
        )
        .subscribe();
    }
  };
}
