import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './client/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const teacherId = '00000000-0000-0000-0000-000000000000'; // dummy uuid
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .or(`teacher_id.eq.${teacherId},substitute_teacher_id.eq.${teacherId}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("ERROR from leave_requests:", error);
  } else {
    console.log("SUCCESS, data:", data);
  }
}

test();
