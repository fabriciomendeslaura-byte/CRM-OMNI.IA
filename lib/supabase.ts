import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mgxswptqfwyiebhsufwx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1neHN3cHRxZnd5aWViaHN1Znd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MjkyNTgsImV4cCI6MjA4MDMwNTI1OH0.Uror96ECDzZuyjErUjaRG2cw5NzO7wO8JF9Gcr_hia8';

export const supabase = createClient(supabaseUrl, supabaseKey);