import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vpwhhwiowybztoxzyama.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwd2hod2lvd3lienRveHp5YW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNjE3OTIsImV4cCI6MjA4OTYzNzc5Mn0.SMJlSNNZOu3bU_Zg0BoPh6_KNqlaNaGXXxIe4AVV0xI'
);

async function test() {
  const { error: e5 } = await supabase.from('payments').insert({
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    course_id: '123e4567-e89b-12d3-a456-426614174000',
    stripe_id: 'test',
    amount: 150,
    payment_status: 'paid'
  });
  console.log('payments with `payment_status` result:', e5?.message);

  const { error: e6 } = await supabase.from('payments').insert({
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    course_id: '123e4567-e89b-12d3-a456-426614174000',
    stripe_id: 'test',
    amount: 150,
    status: 'paid'
  });
  console.log('payments with `status` result:', e6?.message);
}

test();
