
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://lxpdgkybfpudkhyexuow.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4cGRna3liZnB1ZGtoeWV4dW93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMjIzNDUsImV4cCI6MjA2Mzg5ODM0NX0.J_BCXApBxuJ4KJm7_ApuV5bcxdPmUDJonR8zg9PlEj0";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
