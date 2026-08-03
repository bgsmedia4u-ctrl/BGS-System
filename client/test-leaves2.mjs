import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://obgbupvjvvtucjkjopxf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZ2J1cHZqdnZ0dWNqa2pvcHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMTU0NjcsImV4cCI6MjA5ODg5MTQ2N30.Q3I9erUPdrHEUQ3vj9I21fuZiwoHO0qsN85yvm5KZcY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const teacherId = '00000000-0000-0000-0000-000000000000';
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("ERROR from profiles:", error);
  } else {
    console.log("SUCCESS profiles, rows:", data.length);
  }
}

test();
