import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://ihhhjwtgfamjuczaqqwn.supabase.co";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloaGhqd3RnZmFtanVjemFxcXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5OTA2ODgsImV4cCI6MjA5NTU2NjY4OH0.PIKDUY--lWbhAPiVd7ltpJFG2d2O9bvVgSO-mJo15Xo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});
