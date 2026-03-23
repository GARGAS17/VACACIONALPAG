import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vpwhhwiowybztoxzyama.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwd2hod2lvd3lienRveHp5YW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNjE3OTIsImV4cCI6MjA4OTYzNzc5Mn0.SMJlSNNZOu3bU_Zg0BoPh6_KNqlaNaGXXxIe4AVV0xI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUpdate() {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      phone: '+573001234567',
      bio: 'Test update script'
    })
    .eq('id', '986acdd4-5748-4202-9bb0-c5be19eca6ea')
    .select();

  console.log('Update Data:', data);
  console.error('Update Error:', error);
}

testUpdate();
