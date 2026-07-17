/**
 * Hand-maintained mirror of supabase/migrations.
 *
 * Once your Supabase project exists you can replace this file wholesale with:
 *   npx supabase gen types typescript --project-id <id> > types/database.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/**
 * Every table needs a `Relationships` key and the schema needs Views/Functions/
 * Enums/CompositeTypes, even when empty. supabase-js resolves query result
 * types structurally against this shape; if a key is missing the lookup fails
 * and every `data` silently becomes `never` rather than erroring at the query.
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
        };
        Update: {
          email?: string;
          full_name?: string | null;
        };
        Relationships: [];
      };
      restaurants: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          description: string | null;
          address: string | null;
          phone: string | null;
          currency: string;
          is_published: boolean;
          theme: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          slug: string;
          description?: string | null;
          address?: string | null;
          phone?: string | null;
          currency?: string;
          is_published?: boolean;
          theme?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          address?: string | null;
          phone?: string | null;
          currency?: string;
          is_published?: boolean;
          theme?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          restaurant_id: string;
          name: string;
          description: string | null;
          position: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          name: string;
          description?: string | null;
          position?: number;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          position?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          restaurant_id: string;
          category_id: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          is_available: boolean;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          /**
           * Omit it. The products_sync_restaurant BEFORE INSERT trigger derives
           * this from category_id, and a BEFORE trigger runs ahead of the NOT
           * NULL check. Any value sent here is overwritten.
           */
          restaurant_id?: string;
          category_id: string;
          name: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          is_available?: boolean;
          position?: number;
        };
        Update: {
          category_id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          is_available?: boolean;
          position?: number;
        };
        Relationships: [];
      };
      qr_codes: {
        Row: {
          id: string;
          restaurant_id: string;
          label: string;
          target_url: string;
          scan_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          label?: string;
          target_url: string;
        };
        Update: {
          label?: string;
          target_url?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      is_restaurant_owner: { Args: { p_restaurant_id: string }; Returns: boolean };
      is_restaurant_published: { Args: { p_restaurant_id: string }; Returns: boolean };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Restaurant = Database["public"]["Tables"]["restaurants"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type QrCode = Database["public"]["Tables"]["qr_codes"]["Row"];

/** A category with its products attached — the shape the public menu renders. */
export type CategoryWithProducts = Category & { products: Product[] };

/** Everything the public menu page needs, in one payload. */
export type PublicMenu = Restaurant & { categories: CategoryWithProducts[] };
