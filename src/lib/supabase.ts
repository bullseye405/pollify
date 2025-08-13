
/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Poll {
  id: string;
  question: string;
  allow_multiple: boolean;
  require_name_email: boolean;
  active: boolean;
  created_at: string;
}

export interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  created_at: string;
}

export interface Vote {
  id: string;
  poll_id: string;
  option_id: string;
  name?: string;
  email?: string;
  created_at: string;
}

export interface PollWithOptions extends Poll {
  pollify_poll_options: PollOption[];
}

export interface VoteData {
  poll_id: string;
  option_id: string;
  name?: string;
  email?: string;
}