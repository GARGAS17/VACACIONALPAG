import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vpwhhwiowybztoxzyama.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwd2hod2lvd3lienRveHp5YW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNjE3OTIsImV4cCI6MjA4OTYzNzc5Mn0.SMJlSNNZOu3bU_Zg0BoPh6_KNqlaNaGXXxIe4AVV0xI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPayments() {
  const { data, error } = await supabase
    .from('payments')
    .select('stripe_customer_id, user_id, amount')
    .limit(5);

  console.log('Payments Rows:', JSON.stringify(data, null, 2));
  console.error('Query Error:', error);
}

checkPayments();
