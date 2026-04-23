-- ==========================================
-- SCHEMA SQL - ESTRUCTURA COMPLETA COMPROBADA (V3)
-- Diseñado para inicializarse desde cero ('start from scratch')
-- ==========================================

-- 0. PURGA TOTAL (TEARDOWN)
-- Esto eliminará las tablas actuales para evitar conflictos y empezar 100% fresco.
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.enrollments CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.professors CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.course_status_type CASCADE;
DROP TYPE IF EXISTS public.payment_status_type CASCADE;

DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.handle_enrollment_change() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 1. EXTENSIONES Y ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('admin', 'student');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.course_status_type AS ENUM ('draft', 'published', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_status_type AS ENUM ('pending', 'paid', 'completed', 'failed', 'cancelled', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. TABLAS PRINCIPALES (Con IF NOT EXISTS para poder re-ejecutar sin problemas)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  table_name text NOT NULL,
  operation character varying NOT NULL,
  record_id uuid NOT NULL,
  old_values jsonb,
  new_values jsonb,
  change_reason text,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  parent_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  name text NOT NULL UNIQUE,
  description text DEFAULT ''::text,
  icon text DEFAULT 'BookOpen'::text,
  color character varying DEFAULT '#3b82f6'::character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.professors (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text DEFAULT ''::text,
  bio text DEFAULT ''::text,
  photo_url text,
  specialization text DEFAULT ''::text,
  hourly_rate numeric DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT professors_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.courses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text DEFAULT ''::text,
  category_id uuid NOT NULL,
  professor_id uuid NOT NULL,
  price numeric NOT NULL DEFAULT 0 CHECK (price >= 0::numeric),
  capacity integer NOT NULL DEFAULT 20 CHECK (capacity > 0),
  enrolled_count integer NOT NULL DEFAULT 0 CHECK (enrolled_count >= 0),
  start_date date NOT NULL,
  end_date date NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  days_of_week character varying NOT NULL,
  schedule character varying NOT NULL DEFAULT ''::character varying,
  timezone character varying DEFAULT 'UTC'::character varying,
  location character varying DEFAULT 'Online'::character varying,
  room_number character varying DEFAULT NULL::character varying,
  status public.course_status_type NOT NULL DEFAULT 'draft'::public.course_status_type,
  is_published boolean NOT NULL DEFAULT false,
  is_deleted boolean NOT NULL DEFAULT false,
  thumbnail_url text,
  difficulty_level character varying DEFAULT 'Beginner'::character varying,
  max_students_per_session integer,
  requirements text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  published_at timestamp with time zone,
  CONSTRAINT courses_pkey PRIMARY KEY (id),
  CONSTRAINT courses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT courses_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES public.professors(id)
);

CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL CHECK (user_id IS NOT NULL),
  course_id uuid NOT NULL,
  payment_status public.payment_status_type NOT NULL DEFAULT 'pending'::public.payment_status_type,
  payment_id character varying DEFAULT NULL::character varying,
  paid_amount numeric DEFAULT NULL::numeric,
  completion_status character varying DEFAULT 'not_started'::character varying,
  certificate_url text,
  final_grade integer CHECK (final_grade IS NULL OR (final_grade >= 0 AND final_grade <= 100)),
  enrolled_at timestamp with time zone NOT NULL DEFAULT now(),
  payment_at timestamp with time zone,
  completed_at timestamp with time zone,
  CONSTRAINT enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  enrollment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  stripe_payment_id character varying NOT NULL UNIQUE,
  stripe_customer_id character varying NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  currency character varying DEFAULT 'USD'::character varying,
  status public.payment_status_type NOT NULL DEFAULT 'pending'::public.payment_status_type,
  payment_method character varying DEFAULT NULL::character varying,
  last_4_digits character varying(4) DEFAULT NULL::character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  failed_reason text,
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id),
  CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL DEFAULT ''::text,
  phone text DEFAULT ''::text,
  country text DEFAULT ''::text,
  city text DEFAULT ''::text,
  role public.user_role NOT NULL DEFAULT 'student'::public.user_role,
  is_active boolean NOT NULL DEFAULT true,
  is_deleted boolean NOT NULL DEFAULT false,
  avatar_url text,
  bio text,
  preferred_language character varying DEFAULT 'es'::character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_login_at timestamp with time zone,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  course_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ==========================================
-- FUNCIONES HELPER E IDEMPOTENCIA (RLS)
-- ==========================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Habilitar RLS robusto sin duplicaciones
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- DECLARACIÓN DE POLÍTICAS (PRE-BORRADO)
-- ==========================================

-- PROFILES
DROP POLICY IF EXISTS "profiles_own" ON public.profiles;
CREATE POLICY "profiles_own" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_admin" ON public.profiles;
CREATE POLICY "profiles_admin" ON public.profiles FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- CATEGORIES y PROFESSORS (Públicas para lectura)
DROP POLICY IF EXISTS "categories_public" ON public.categories;
CREATE POLICY "categories_public" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "professors_public" ON public.professors;
CREATE POLICY "professors_public" ON public.professors FOR SELECT USING (true);

DROP POLICY IF EXISTS "categories_admin" ON public.categories;
CREATE POLICY "categories_admin" ON public.categories FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "professors_admin" ON public.professors;
CREATE POLICY "professors_admin" ON public.professors FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- COURSES
DROP POLICY IF EXISTS "courses_public_read" ON public.courses;
CREATE POLICY "courses_public_read" ON public.courses FOR SELECT USING (status = 'published' OR is_published = true);

DROP POLICY IF EXISTS "courses_admin_all" ON public.courses;
CREATE POLICY "courses_admin_all" ON public.courses FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ENROLLMENTS
DROP POLICY IF EXISTS "enrollments_own" ON public.enrollments;
CREATE POLICY "enrollments_own" ON public.enrollments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "enrollments_admin" ON public.enrollments;
CREATE POLICY "enrollments_admin" ON public.enrollments FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- PAYMENTS
DROP POLICY IF EXISTS "payments_own_read" ON public.payments;
CREATE POLICY "payments_own_read" ON public.payments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "payments_admin_all" ON public.payments;
CREATE POLICY "payments_admin_all" ON public.payments FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- REVIEWS
DROP POLICY IF EXISTS "reviews_public" ON public.reviews;
CREATE POLICY "reviews_public" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "reviews_own" ON public.reviews;
CREATE POLICY "reviews_own" ON public.reviews FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ==========================================
-- TRIGGERS Y FUNCIONES DE AUTOMATIZACIÓN
-- ==========================================

-- A. Sincronizar enrolled_count al crear/cancelar inscripciones
CREATE OR REPLACE FUNCTION public.handle_enrollment_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Verificar si hay cupos
        IF (SELECT enrolled_count FROM public.courses WHERE id = NEW.course_id) >= (SELECT capacity FROM public.courses WHERE id = NEW.course_id) THEN
            RAISE EXCEPTION 'No hay cupos disponibles para este curso';
        END IF;

        UPDATE public.courses SET enrolled_count = enrolled_count + 1 WHERE id = NEW.course_id;
        
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.payment_status != 'cancelled' AND NEW.payment_status = 'cancelled') THEN
            UPDATE public.courses SET enrolled_count = enrolled_count - 1 WHERE id = NEW.course_id;
        ELSIF (OLD.payment_status = 'cancelled' AND (NEW.payment_status = 'completed' OR NEW.payment_status = 'pending')) THEN
            IF (SELECT enrolled_count FROM public.courses WHERE id = NEW.course_id) >= (SELECT capacity FROM public.courses WHERE id = NEW.course_id) THEN
                RAISE EXCEPTION 'No hay cupos disponibles para reactivar la inscripción';
            END IF;
            UPDATE public.courses SET enrolled_count = enrolled_count + 1 WHERE id = NEW.course_id;
        END IF;

    ELSIF (TG_OP = 'DELETE') THEN
        IF (OLD.payment_status != 'cancelled') THEN
            UPDATE public.courses SET enrolled_count = enrolled_count - 1 WHERE id = OLD.course_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger asegurando que no se duplique
DROP TRIGGER IF EXISTS on_enrollment_change ON public.enrollments;
CREATE TRIGGER on_enrollment_change
    AFTER INSERT OR UPDATE OR DELETE ON public.enrollments
    FOR EACH ROW EXECUTE FUNCTION public.handle_enrollment_change();


-- B. Crear perfil automáticamente al registrar usuario en Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id, 
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
        'student'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar si ya existe el trigger para evitar errores
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

-- ==========================================
-- STORAGE - BUCKETS & POLICIES
-- ==========================================

-- Crear bucket 'avatars' si no existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir leer (select) a todos
DROP POLICY IF EXISTS "Ver avatares públicos" ON storage.objects;
CREATE POLICY "Ver avatares públicos" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Política para permitir subir (insert) a usuarios autenticados o todos
DROP POLICY IF EXISTS "Subir avatares" ON storage.objects;
CREATE POLICY "Subir avatares" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars');
