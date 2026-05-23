'use client';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set. ' +
      'Copy .env.example to .env.local and fill in values from your Supabase project.',
  );
}

export const supabase = createClient(url, anon, {
  realtime: { params: { eventsPerSecond: 10 } },
});
