# 🛠️ Arquitectura del Backend (Back-End)

El backend de este proyecto está construido sobre **Supabase**, una plataforma *Backend-as-a-Service (BaaS)* que corre sobre una base de datos **PostgreSQL** empresarial. En lugar de un servidor monolítico tradicional (como Node.js/Express), se utiliza un enfoque de **Arquitectura Serverless y Reactiva**.

---

## 🗺️ Visión General de la Arquitectura

La arquitectura se divide en **4 pilares fundamentales** integrados de extremo a extremo:

1.  **Motor Relacional (Base de Datos)**: PostgreSQL para almacenamiento íntegro.
2.  **Seguridad de Acceso (Auth + RLS)**: Control de accesos a nivel de fila (*Row Level Security*).
3.  **Lógica del Servidor (Edge Functions)**: Microservicios para flujos críticos y pasarelas.
4.  **Capa de Autenticación**: Gestión de sesiones en tiempo real sincronizadas con el Front-End.

---

## 🗄️ 1. Motor de Base de Datos (PostgreSQL)

El sistema opera con tablas estrictamente relacionadas mediante Claves Foráneas (*Foreign Keys*) para garantizar que ningún dato quede huérfano.

### 📊 Entidades y Tablas Principales

| Tabla | Función Principal | Relaciones Clave |
| :--- | :--- | :--- |
| **`profiles`** | Guarda metadata extendida de los usuarios (Estudiante/Admin). | Vinculado a `auth.users` (id). |
| **`courses`** | Contiene el catálogo de cursos, precios, cupos y horarios. | Relación 1:1 con `professors` y `categories`. |
| **`enrollments`** | Historial de matrículas de alumnos y estado de pago (`pending`, `paid`). | Vincula `profiles` (estudiante) con `courses`. |
| **`payments`** | Auditoría financiera de transacciones (Stripe / Manuales). | Apunta a una matrícula (`enrollments`). |
| **`professors`** | Portafolio de docentes asignados a cursos. | Consumido por la tabla `courses`. |

> 💡 **Integridad de Datos**: Se implementaron constraints redundantes. Ej: `capacity > 0` y `price >= 0` para evitar errores matemáticos o inyecciones de precios negativos.

---

## 🛡️ 2. Seguridad y Control de Accesos (RLS)

A diferencia de Express.js donde creas Middlewares, Supabase delega la seguridad a **Directivas de PostgreSQL (RLS)**.

*   **¿Cómo funciona?**: Cada tabla tiene políticas de acceso basadas en el Rol (`student`, `admin`).
*   **Políticas de ejemplo**:
    *   **`courses`**: Un alumno solo puede `SELECT` si el curso está publicado. Un Administrador puede `INSERT/WRITE`.
    *   **`enrollments`**: Un alumno solo puede leer sus propias matrículas (`user_id = auth.uid()`). No puede leer las de otros.

### 🔄 Triggers (Disparadores Automáticos)
Para automatizar procesos sin código JS, el backend usa **Funciones PL/pgSQL**:
*   **`handle_new_user`**: Al registrarte por primera vez en la app, Supabase Auth dispara un trigger que clona tu ID y Email y los inserta en la tabla `public.profiles` con el rol `student` autoritariamente.

---

## ⚡ 3. Lógica Serverless (Edge Functions)

Cuando el sistema necesita interactuar con librerías privadas de backend (como **Stripe**) o procesar transacciones críticas de negocio, utiliza **Edge Functions** (basadas en Deno/Typescript).

### 🚀 Microservicios Disponibles

1.  **`/functions/enroll`** 📋:
    *   **Misión**: Orquestar la inscripción segura a un curso.
    *   **Lógica**: Valida que el curso tenga **Cupos disponibles** antes de descontar e insertar en `enrollments`. Si el curso cuesta `$0`, lo aprueba automáticamente en la misma función.
2.  **`/functions/stripe-webhook`** 💳:
    *   **Misión**: Escuchar a Stripe de forma asíncrona.
    *   **Lógica**: Cuando un estudiante paga con tarjeta de crédito en la pasarela externa, Stripe avisa a esta función. El backend valida la firma de seguridad del webhook y actualiza el campo `payment_status` de `pending` a `paid` en la base de datos de forma autónoma.
3.  **`/functions/manage-billing`** ⚙️:
    *   **Misión**: Redirigir al panel de facturación interactivo para que los alumnos descarguen recibos o cancelen subscripciones vinculadas.

---

## 🤝 4. ¿Cómo habla el Front-End con el Backend?

El Front-End React (Vite) no ejecuta SQL. Se comunica de dos formas:

1.  **SDK de Supabase (`src/api/supabase.js`)**:
    *   Consume la API REST automática que genera Postgres.
    *   `supabase.from('courses').select('*')` se autoprotege por las reglas RLS antes de devolver la data.
2.  **Zustand Auth Store (`src/store/useAuthStore.js`)**:
    *   Escucha el evento `onAuthStateChange` de Supabase.
    *   Cuando el usuario inicia sesión, este Store mapea la metadata de `profiles` para saber si debe cargar vistas de Administrador o Alumno de forma reactiva en el dispositivo.

---

## 🔧 Checklist de Mantenimiento

*   **Edge Functions**: Para desplegarlas o actualizarlas, usa Supabase CLI: `supabase functions deploy [nombre]`.
*   **Gestión de Secretos**: Los tokens de Stripe secretos no se guardan en el Front. Se inyectan en Supabase con `supabase secrets set STRIPE_SECRET_KEY=xxx`.
