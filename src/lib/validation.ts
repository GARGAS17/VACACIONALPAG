import { z } from 'zod';

// ==========================================
// ESQUEMAS PARA PROFILES
// ==========================================

export const profileSchema = z.object({
  full_name: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre es muy largo'),
  phone: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, 'Número de teléfono inválido')
    .nullable()
    .optional(),
  avatar_url: z
    .string()
    .url('La URL de avatar no es válida')
    .nullable()
    .optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;

// ==========================================
// ESQUEMAS PARA COURSES
// ==========================================

export const courseSchema = z.object({
  title: z
    .string()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(120, 'El título es muy largo'),
  description: z
    .string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .nullable()
    .optional(),
  price: z
    .number()
    .min(0, 'El precio no puede ser negativo'),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  capacity: z
    .number()
    .int()
    .min(1, 'La capacidad debe ser al menos 1 persona'),
  status: z.enum(['draft', 'published', 'closed']),
  image_url: z
    .string()
    .url('URL de imagen no válida')
    .nullable()
    .optional(),
  instructor: z
    .string()
    .max(100)
    .nullable()
    .optional(),
}).refine(data => new Date(data.start_date) <= new Date(data.end_date), {
  message: "La fecha de inicio debe ser anterior o igual a la de fin",
  path: ["start_date"]
});

export type CourseInput = z.infer<typeof courseSchema>;

// ==========================================
// ESQUEMAS PARA ENROLLMENTS
// ==========================================

export const enrollmentSchema = z.object({
  course_id: z.string().uuid('El ID de curso debe ser un UUID válido'),
  status: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
  total_paid: z.number().min(0, 'El pago no puede ser negativo').optional(),
  payment_type: z.string().nullable().optional(),
});

export type EnrollmentInput = z.infer<typeof enrollmentSchema>;
