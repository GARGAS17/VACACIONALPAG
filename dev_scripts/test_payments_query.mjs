import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vpwhhwiowybztoxzyama.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwd2hod2lvd3lienRveHp5YW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNjE3OTIsImV4cCI6MjA4OTYzNzc5Mn0.SMJlSNNZOu3bU_Zg0BoPh6_KNqlaNaGXXxIe4AVV0xI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQuery() {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      id,
      amount,
      status,
      created_at,
      last_4_digits,
      enrollments (
        id,
        courses (
          title
        )
      )
    `)
    .limit(1);

  console.log('Query Data:', JSON.stringify(data, null, 2));
  console.error('Query Error:', error);
}

testQuery();
