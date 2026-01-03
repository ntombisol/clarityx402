export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      endpoints: {
        Row: {
          id: string;
          resource_url: string;
          bazaar_data: Json;
          description: string | null;
          price_micro_usdc: number | null;
          network: string | null;
          pay_to_address: string | null;
          category: string | null;
          tags: string[] | null;
          normalized_price: Json | null;
          uptime_24h: number | null;
          uptime_7d: number | null;
          uptime_30d: number | null;
          avg_latency_ms: number | null;
          p95_latency_ms: number | null;
          error_rate: number | null;
          last_seen_at: string | null;
          last_error_at: string | null;
          consecutive_failures: number;
          first_indexed_at: string;
          updated_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          resource_url: string;
          bazaar_data: Json;
          description?: string | null;
          price_micro_usdc?: number | null;
          network?: string | null;
          pay_to_address?: string | null;
          category?: string | null;
          tags?: string[] | null;
          normalized_price?: Json | null;
          uptime_24h?: number | null;
          uptime_7d?: number | null;
          uptime_30d?: number | null;
          avg_latency_ms?: number | null;
          p95_latency_ms?: number | null;
          error_rate?: number | null;
          last_seen_at?: string | null;
          last_error_at?: string | null;
          consecutive_failures?: number;
          first_indexed_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          resource_url?: string;
          bazaar_data?: Json;
          description?: string | null;
          price_micro_usdc?: number | null;
          network?: string | null;
          pay_to_address?: string | null;
          category?: string | null;
          tags?: string[] | null;
          normalized_price?: Json | null;
          uptime_24h?: number | null;
          uptime_7d?: number | null;
          uptime_30d?: number | null;
          avg_latency_ms?: number | null;
          p95_latency_ms?: number | null;
          error_rate?: number | null;
          last_seen_at?: string | null;
          last_error_at?: string | null;
          consecutive_failures?: number;
          first_indexed_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
      };
      pings: {
        Row: {
          id: string;
          endpoint_id: string;
          pinged_at: string;
          success: boolean;
          status_code: number | null;
          latency_ms: number | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          endpoint_id: string;
          pinged_at?: string;
          success: boolean;
          status_code?: number | null;
          latency_ms?: number | null;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          endpoint_id?: string;
          pinged_at?: string;
          success?: boolean;
          status_code?: number | null;
          latency_ms?: number | null;
          error_message?: string | null;
          created_at?: string;
        };
      };
      price_history: {
        Row: {
          id: string;
          endpoint_id: string;
          recorded_at: string;
          price_micro_usdc: number;
        };
        Insert: {
          id?: string;
          endpoint_id: string;
          recorded_at: string;
          price_micro_usdc: number;
        };
        Update: {
          id?: string;
          endpoint_id?: string;
          recorded_at?: string;
          price_micro_usdc?: number;
        };
      };
      categories: {
        Row: {
          slug: string;
          name: string;
          description: string | null;
          icon: string | null;
          endpoint_count: number;
        };
        Insert: {
          slug: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          endpoint_count?: number;
        };
        Update: {
          slug?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          endpoint_count?: number;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};

// Helper types for easier usage
export type Endpoint = Database["public"]["Tables"]["endpoints"]["Row"];
export type EndpointInsert = Database["public"]["Tables"]["endpoints"]["Insert"];
export type EndpointUpdate = Database["public"]["Tables"]["endpoints"]["Update"];

export type Ping = Database["public"]["Tables"]["pings"]["Row"];
export type PingInsert = Database["public"]["Tables"]["pings"]["Insert"];

export type PriceHistory = Database["public"]["Tables"]["price_history"]["Row"];
export type PriceHistoryInsert = Database["public"]["Tables"]["price_history"]["Insert"];

export type Category = Database["public"]["Tables"]["categories"]["Row"];

// Normalized price structure
export type NormalizedPrice = {
  unit: string; // e.g., "per_1k_tokens", "per_request", "per_image"
  value: number;
};
