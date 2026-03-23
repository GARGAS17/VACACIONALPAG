export interface Profile {
  id: string;
  full_name: string | null;
  phone?: string | null;
  role: 'admin' | 'user';
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  start_date: string; // ISO string o date
  end_date: string;   // ISO string o date
  capacity: number;
  available_seats: number;
  status: 'draft' | 'published' | 'closed';
  image_url: string | null;
  instructor: string | null;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  total_paid: number;
  payment_type: string | null;
  created_at: string;
  updated_at: string;
  
  // Relatos (Cargados opcionalmente via Supabase .select('*, course:courses(*)'))
  course?: Course;
  profile?: Profile;
}
