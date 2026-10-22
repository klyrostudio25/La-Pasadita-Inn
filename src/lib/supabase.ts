/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check localStorage for runtime user configuration (useful for testing before env restart)
const localUrl = typeof window !== 'undefined' ? localStorage.getItem('la_pasadita_supabase_url') : null;
const localAnonKey = typeof window !== 'undefined' ? localStorage.getItem('la_pasadita_supabase_anon_key') : null;

export const SUPABASE_URL = localUrl || envUrl || '';
export const SUPABASE_ANON_KEY = localAnonKey || envAnonKey || '';

export const isConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  SUPABASE_URL.startsWith('https://') &&
  !SUPABASE_URL.includes('your-project')
);

export let supabase: SupabaseClient | null = null;

if (isConfigured) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    supabase = null;
  }
}

export function saveRuntimeCredentials(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('la_pasadita_supabase_url', url.trim());
    localStorage.setItem('la_pasadita_supabase_anon_key', key.trim());
    window.location.reload();
  }
}

export function clearRuntimeCredentials() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('la_pasadita_supabase_url');
    localStorage.removeItem('la_pasadita_supabase_anon_key');
    window.location.reload();
  }
}

// Database Interfaces
export interface Category {
  id: string;
  name: string;
  display_order: number;
  created_at?: string;
}

export interface MenuItemRecord {
  id: string;
  category_id: string;
  name: string;
  spanish_name?: string | null;
  description: string;
  price: number;
  badge?: string | null;
  is_available: boolean;
  image_url: string;
  spice_level?: string | null;
  grandma_note?: string | null;
  created_at?: string;
  categories?: Category | null;
}

export interface OrderRecord {
  id: string;
  customer_name: string;
  customer_phone: string;
  order_type: string; // 'Takeout' | 'Dine-In Pickup' | 'Delivery'
  delivery_address?: string | null;
  delivery_fee?: number;
  total_amount: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  order_items?: OrderItemRecord[];
}

export interface ReservationRecord {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  special_requests?: string;
  status: 'confirmed' | 'cancelled';
  created_at: string;
}

export interface OrderItemRecord {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  selected_option?: string | null;
  created_at?: string;
}

export interface SiteSettingsRecord {
  id: string;
  primary_accent_color: string;
  dark_theme_background: string;
  hero_title: string;
  hero_subtext: string;
  announcement_banner_text: string;
  announcement_enabled: boolean;
  open_closed_status: 'auto' | 'open' | 'closed';
  custom_closed_message: string;
  estimated_pickup_minutes: string;
  delivery_fee: number;
  delivery_min_order: number;
  free_delivery_threshold: number;
  updated_at?: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettingsRecord = {
  id: 'default',
  primary_accent_color: '#DDA843',
  dark_theme_background: '#08080A',
  hero_title: 'LA PASADITA INN',
  hero_subtext: 'Denver Historic Triangular Landmark • Grandma-Led Authentic Mexican Cooking',
  announcement_banner_text: '🔥 Denver Historic Landmark · Scratch Grandma-Led Mexican Cooking · Walk-Ins & Phone Orders Welcome!',
  announcement_enabled: true,
  open_closed_status: 'auto',
  custom_closed_message: 'Closed for private family preparation · Opens at 11:00 AM',
  estimated_pickup_minutes: '15 – 20',
  delivery_fee: 3.99,
  delivery_min_order: 15.00,
  free_delivery_threshold: 45.00
};

