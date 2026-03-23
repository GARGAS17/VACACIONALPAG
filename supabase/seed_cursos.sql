-- ==========================================
-- SCRIPT DE MOCK DATA (4 Cursos de Prueba)
-- ==========================================
-- IMPORTANTE: Ejecutar en el SQL Editor de Supabase
-- ==========================================

-- 1. Insertar Categorías (Cursos dependen de Categorías)
INSERT INTO public.categories (id, name, description, icon, color) VALUES
('c1000000-0000-0000-0000-000000000001', 'Programación', 'Cursos de desarrollo de software', 'Monitor', '#3b82f6'),
('c2000000-0000-0000-0000-000000000002', 'Diseño', 'Cursos de diseño gráfico y UI/UX', 'PenTool', '#ec4899')
ON CONFLICT (name) DO NOTHING;

-- 2. Insertar Profesores (Cursos dependen de Profesores)
INSERT INTO public.professors (id, name, email, bio, hourly_rate) VALUES
('d1000000-0000-0000-0000-000000000001', 'Ada Lovelace', 'ada@valledelsoftware.com', 'Pionera experta en algoritmos e IA', 40.00),
('d2000000-0000-0000-0000-000000000002', 'Don Norman', 'norman@uxdesign.com', 'Gurú de la usabilidad y diseño centrado en el usuario', 50.00)
ON CONFLICT (email) DO NOTHING;

-- 3. Insertar 4 Cursos Iniciales
INSERT INTO public.courses (
    id, title, description, category_id, professor_id, price, capacity, start_date, end_date, start_time, end_time, days_of_week, schedule, status, is_published, difficulty_level, thumbnail_url
) VALUES
(
    '00000000-0000-0000-0000-100000000001', 
    'React & Supabase Fullstack', 
    'Aprende a construir aplicaciones escalables conectando React con una base de datos en tiempo real.', 
    'c1000000-0000-0000-0000-000000000001', 
    'd1000000-0000-0000-0000-000000000001', 
    49.99, 
    20, 
    '2026-06-01', 
    '2026-07-01', 
    '18:00:00', 
    '20:00:00', 
    'Lunes, Miércoles', 
    '18:00 - 20:00', 
    'published', 
    true, 
    'Intermediate', 
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=600&auto=format&fit=crop'
),
(
    '00000000-0000-0000-0000-100000000002', 
    'Principios de UI/UX', 
    'Domina la interfaz y experiencia de usuario (UX) para productos digitales de alto impacto.', 
    'c2000000-0000-0000-0000-000000000002', 
    'd2000000-0000-0000-0000-000000000002', 
    29.99, 
    30, 
    '2026-06-15', 
    '2026-07-15', 
    '10:00:00', 
    '12:00:00', 
    'Martes, Jueves', 
    '10:00 - 12:00', 
    'published', 
    true, 
    'Beginner', 
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=600&auto=format&fit=crop'
),
(
    '00000000-0000-0000-0000-100000000003', 
    'Node.js Avanzado (Backend)', 
    'Crea arquitecturas robustas, seguras y escalables implementando pasarelas de pago y docker.', 
    'c1000000-0000-0000-0000-000000000001', 
    'd1000000-0000-0000-0000-000000000001', 
    89.00, 
    15, 
    '2026-07-01', 
    '2026-08-15', 
    '19:00:00', 
    '21:00:00', 
    'Sábado, Domingo', 
    '19:00 - 21:00', 
    'published', 
    true, 
    'Advanced', 
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop'
),
(
    '00000000-0000-0000-0000-100000000004', 
    'Figma Masterclass', 
    'Aprende a maquetar aplicaciones desde un wireframe crudo hasta un prototipo interactivo de alta fidelidad.', 
    'c2000000-0000-0000-0000-000000000002', 
    'd2000000-0000-0000-0000-000000000002', 
    14.99, 
    50, 
    '2026-05-10', 
    '2026-06-10', 
    '16:00:00', 
    '18:00:00', 
    'Viernes', 
    '16:00 - 18:00', 
    'published', 
    true, 
    'Beginner', 
    'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=600&auto=format&fit=crop'
)
ON CONFLICT (id) DO NOTHING;
