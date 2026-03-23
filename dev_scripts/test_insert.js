const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vpwhhwiowybztoxzyama.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwd2hod2lvd3lienRveHp5YW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNjE3OTIsImV4cCI6MjA4OTYzNzc5Mn0.SMJlSNNZOu3bU_Zg0BoPh6_KNqlaNaGXXxIe4AVV0xI'
);

async function test() {
  const { data, error } = await supabase.from('enrollments').insert({
    user_id: '00000000-0000-0000-0000-000000000000',
    course_id: '00000000-0000-0000-0000-000000000000',
    status: 'confirmed',
    total_paid: 150
  });
  console.log('Enrollments insert test:', error ? error.message : 'Success');

  const { data: pData, error: pError } = await supabase.from('payments').insert({
    user_id: '00000000-0000-0000-0000-000000000000',
    course_id: '00000000-0000-0000-0000-000000000000',
    stripe_id: 'test',
    amount: 150,
    status: 'completed'
  });
  console.log('Payments insert test:', pError ? pError.message : 'Success');
}

test();
