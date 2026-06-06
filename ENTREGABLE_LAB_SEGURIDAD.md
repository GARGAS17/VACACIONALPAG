# Entregable: Laboratorio de Seguridad en Bases de Datos (RLS)

## Proyecto: Vacacional Pack

Este documento adapta las instrucciones del "Laboratorio de Seguridad" al esquema y arquitectura de datos reales del proyecto **Vacacional Pack**.

---

### 1. Script de Configuración (Aplicado)
A diferencia de crear una tabla genérica `inscripciones_vacacionales`, en nuestro proyecto la seguridad (RLS) se aplica sobre nuestra tabla principal de operaciones: `enrollments`. A continuación, se muestra el script SQL que demuestra cómo se configuró en nuestro ambiente (extraído del esquema del proyecto):

```sql
-- Fase 1: Creación del Escenario de Datos (Tabla Enrollments)
CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL CHECK (user_id IS NOT NULL),
  course_id uuid NOT NULL,
  payment_status public.payment_status_type NOT NULL DEFAULT 'pending'::public.payment_status_type,
  paid_amount numeric DEFAULT NULL::numeric,
  enrolled_at timestamp with time zone NOT NULL DEFAULT now(),
  -- [Resto de las columnas omitidas por brevedad]
  CONSTRAINT enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Fase 2: Activación del "Firewall" de Datos
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Fase 3: Definición de Políticas de Privacidad
-- Política: Solo el estudiante dueño de la inscripción puede acceder a sus propios registros
CREATE POLICY "enrollments_own" 
ON public.enrollments 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Política adicional: Los administradores pueden ver todos los registros
CREATE POLICY "enrollments_admin" 
ON public.enrollments 
FOR ALL 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());
```

---

### 2. Prueba de Aislamiento
Para demostrar el aislamiento, se ha proporcionado un script interactivo en el proyecto (`demostracion_rls.js`) que simula a dos estudiantes accediendo a la misma base de datos. 

**¿Qué pasa a nivel de código?**
Cuando la aplicación llama a `supabase.from('enrollments').select('*')` en `src/services/enrollments.service.ts`, **NO** estamos enviando ningún filtro `WHERE user_id = ...` desde el frontend. Sin embargo, el motor de PostgreSQL intercepta automáticamente la petición HTTP, extrae el token (JWT) mediante `auth.uid()`, y filtra silenciosamente la tabla gracias a la política `enrollments_own`.

> **Para tu documento final (Word):** 
> 1. Inicia sesión en la UI del Vacacional Pack con una cuenta (Estudiante A). Ve a su sección "Mis Cursos" y toma una **Captura de Pantalla 1**.
> 2. Cierra sesión, entra con el Estudiante B. Ve a "Mis Cursos" y nota que no puede ver los pagos ni cursos del A. Toma una **Captura de Pantalla 2**.
> 3. Pega esas dos capturas debajo de este título.

---

### 3. Análisis de Hallazgos
La implementación de Row Level Security (RLS) en **Vacacional Pack** no solo sirve para filtrar visualmente los datos, sino que previene intrínsecamente la vulnerabilidad **BOLA (Broken Object Level Authorization)**, también conocida como IDOR (Insecure Direct Object Reference).

**¿Cómo RLS previene el ataque BOLA/IDOR?**
En un ataque BOLA clásico, un usuario malintencionado que tenga conocimientos técnicos básicos podría interceptar la petición de red (ej. una llamada a la API que consulta la inscripción `/api/enrollments?id=12345`) y manipular el ID para consultar la inscripción de otro estudiante (ej. cambiar a `id=12346`). Si la seguridad dependiera del cliente o de un endpoint frágil, el atacante lograría ver el estado de pago, tarjeta y las notas de su compañero.

Gracias a **PostgreSQL RLS**, la seguridad está acorazada en el propio motor de la base de datos. Incluso si el atacante logra inyectar lógicamente otra ID para leer el registro `12346`, la base de datos evalúa estíctamente la regla `USING (auth.uid() = user_id)`. Como el Token JWT de sesión del atacante (su `uid`) no coincidirá con el `user_id` dueño del registro `12346`, la base de datos simplemente denegará el acceso y retornará una respuesta vacía o error de permisos. 

Este enfoque descentraliza el control de acceso de la capa de aplicación hacia la capa de datos, convirtiendo la base de datos en un componente *Zero Trust* donde nadie, excepto el dueño explícito, tiene lectura garantizada.
