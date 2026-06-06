🚀 GUÍA PASO A PASO: INSTALACIÓN Y CONFIGURACIÓN COMPLETA
═══════════════════════════════════════════════════════════════════════════════

⏱️  TIEMPO TOTAL ESTIMADO: 45-60 minutos

═══════════════════════════════════════════════════════════════════════════════
PARTE 1: PREPARATIVOS (5 minutos)
═══════════════════════════════════════════════════════════════════════════════

1.1 REQUISITOS PREVIOS
   □ Node.js 18+ instalado → npm --version
   □ Git instalado
   □ Cuenta GitHub (para repositorio)
   □ Cuenta email válida

   Verificar:
   ```bash
   node --version    # v18.0.0 o superior
   npm --version     # 9.0.0 o superior
   git --version     # 2.0.0 o superior
   ```

1.2 CLONAR Y CONFIGURAR PROYECTO LOCAL
   ```bash
   # Si es un proyecto nuevo
   cd c:\Users\SANTA\Desktop
   npx create-vite@latest mi-universidad -- --template react-ts
   cd mi-universidad
   
   # O si ya existe (tu caso)
   cd mi-universidad
   
   # Instalar dependencias
   npm install
   ```

1.3 INSTALAR PAQUETES FALTANTES
   ```bash
   # Las dependencias ya están listas en package.json:
   # @tanstack/react-query, lucide-react, zustand, zod, etc.
   
   # Verificar que tengas todos:
   npm list | grep -E "supabase|react-query|zustand"
   ```

═══════════════════════════════════════════════════════════════════════════════
PARTE 2: CONFIGURAR SUPABASE (20 minutos)
═══════════════════════════════════════════════════════════════════════════════

2.1 CREAR PROYECTO SUPABASE
   Pasos:
   1. Ve a https://supabase.com/dashboard
   2. Sign Up (usa tu email personal)
   3. Completa verificación de email
   4. Click "New Project"
   
   Formulario:
   ┌─────────────────────────────────────┐
   │ Project Name: mi-universidad        │
   │ Database Password: [Generar fuerte] │ ← Copia a Bitwarden/KeePass
   │ Region: [Tu región + cercana]       │    (ej: us-east-1, eu-west-1)
   │ Click "Create new project"          │
   └─────────────────────────────────────┘
   
   ⏳ Espera 2-3 minutos para que se cree...

2.2 OBTENER CREDENCIALES API
   1. Dashboard → Settings (sidebar izquierdo, abajo)
   2. Pestaña: API
   3. Copia AMBAS:
      - Project URL: https://xxxxxxx.supabase.co
      - Anon public key: eyJhbGc...
   
   4. Crea archivo: c:\Users\SANTA\Desktop\mi-universidad\.env.local
   
   Contenido:
   ```
   VITE_SUPABASE_URL=https://xxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   VITE_STRIPE_PUBLIC_KEY=pk_test_123...  # Luego
   ```

2.3 EJECUTAR SCHEMA SQL
   1. En Supabase Dashboard → SQL Editor (sidebar)
   2. Click "New Query" (botón azul arriba a la derecha)
   
   3. COPIA TODO el contenido de: supabase/schema_v2_OPTIMIZADO.sql
      (Este archivo ya está en tu proyecto)
   
   4. PEGA en el editor de SQL
   
   5. Click "Run" (botón negro con play)
   
   ✓ Deberías ver "Execution completed" (ignore warnings sobre EXISTS)
   
   ⏱️  Toma 10-15 segundos

2.4 VERIFICAR TABLAS CREADAS
   1. Sidebar → SQL Editor → "New Query"
   
   2. Ejecuta:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```
   
   3. Deberías ver:
      ✓ audit_logs
      ✓ categories
      ✓ courses
      ✓ enrollments
      ✓ payments
      ✓ professors
      ✓ profiles
      ✓ reviews

2.5 HABILITAR ROW LEVEL SECURITY (RLS)
   1. Sidebar → SQL Editor → "New Query"
   
   2. Copia y ejecuta:
   ```sql
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
   ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
   ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
   ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
   ALTER TABLE professors ENABLE ROW LEVEL SECURITY;
   ```
   
   ✓ Execution completed

2.6 CREAR USUARIO DE PRUEBA
   1. Sidebar → Authentication → Users
   2. Click "Add user"
   
   Formulario:
   ┌─────────────────────────┐
   │ Email: test@example.com │
   │ Password: Test@12345    │
   │ [Create user]           │
   └─────────────────────────┘
   
   ✓ Deberías ver el usuario creado
   ✓ Su profile se creó automáticamente (trigger)

═══════════════════════════════════════════════════════════════════════════════
PARTE 3: CONFIGURAR STRIPE (10 minutos)
═══════════════════════════════════════════════════════════════════════════════

3.1 CREAR CUENTA STRIPE
   1. Ve a https://dashboard.stripe.com/register
   2. Sign Up con tu email
   3. Completa verificación
   4. Selecciona: "I'm a student" → Next
   5. Completa formulario personal

3.2 OBTENER KEYS
   1. Dashboard → Settings → API Keys
   
   2. Copia AMBAS (están en "Test mode"):
      - Publishable Key (pk_test_...)
      - Secret Key (sk_test_...)
   
   3. Actualiza .env.local:
   ```
   VITE_STRIPE_PUBLIC_KEY=pk_test_123...
   ```
   
   4. GUARDA el Secret Key (sk_test_...) para paso 4.1

3.3 CONFIGURAR WEBHOOK (temporalmente deshabilitado)
   📌 NOTA: Por ahora saltamos esto.
   Lo configuraremos en la parte 5 cuando Edge Functions esté lista.

═══════════════════════════════════════════════════════════════════════════════
PARTE 4: ACTUALIZAR CÓDIGO FRONTEND (10 minutos)
═══════════════════════════════════════════════════════════════════════════════

4.1 ARCHIVOS YA CREADOS
   Los siguientes archivos ya fueron generados para ti:
   ✓ supabase/schema_v2_OPTIMIZADO.sql
   ✓ src/lib/validation.ts (esquemas Zod)
   ✓ src/services/enrollments.service.ts
   ✓ src/services/useNotificationStore.ts
   ✓ ARQUITECTURA_COMPLETA.md / PATRONES.md
   ✓ Setup e integraciones reactivas

4.2 INSTALAR DEPENDENCIAS PENDIENTES
   ```bash
   npm install
   npm run dev
   ```
   Abre http://localhost:5173 en navegador.
   ✓ Debería cargar sin errores. Conservando la sesión del usuario.

═══════════════════════════════════════════════════════════════════════════════
PARTE 5: CREAR EDGE FUNCTIONS (15 minutos)
═══════════════════════════════════════════════════════════════════════════════

5.1 INSTALAR SUPABASE CLI
   ```bash
      
      Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

      # Añadir el "bucket" (repositorio) de Supabase
      scoop bucket add supabase https://github.com/supabase/scoop-bucket.git

      # Instalar la herramienta
      scoop install supabase

      # Asegúrate de reemplazar ESTE_ID con el que copiaste del dashboard
      supabase link --project-ref vpwhhwiowybztoxzyama
         # Se abrirá navegador → Autoriza
   ```

5.2 CREAR FUNCTION: ENROLL
   ```bash
      # Función para procesar la inscripción
      supabase functions new enroll

      # Función para recibir avisos de Stripe (Webhooks)
      supabase functions new stripe-webhook
   ```
   
   Edita: supabase/functions/enroll/index.ts
   
   Copia el código de: ARQUITECTURA_COMPLETA.md Sección 7.3
   (O usa el template que sale por defecto)

5.3 CREAR FUNCTION: WEBHOOK STRIPE
   ```bash
   supabase functions new webhooks/stripe --typescript
   ```
   
   Edita: supabase/functions/webhooks/stripe/index.ts
   
   Copia el código de: ARQUITECTURA_COMPLETA.md Sección 8.2

5.4 DEPLOY FUNCTIONS
   ```bash
   # Primero, añade secrets
      # 1. Configurar la Llave Secreta
      supabase secrets set STRIPE_SECRET_KEY=sk_test_51TDH2nC4CflHc9rqmj9TCQZXoojfoix5TWWNblX5C530YYO8ixuCklrr4l1Urq7f8vdlioNKxLasEUgE6H9RGKoW00Tmwd7kdD

      # 2. Configurar el Secreto de Firma del Webhook
      supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_gLX0dcoDD6X2Wgp75GSvavbTT0B8kp7X

      # 3. Configurar la URL del Frontend
      supabase secrets set FRONTEND_URL=http://localhost:5173
   
   # Verifica que se añadieron
   supabase secrets list
   
   # Deploy
   supabase functions deploy enroll
   supabase functions deploy webhooks/stripe
   
   # Verifica
   supabase functions list
   ```

═══════════════════════════════════════════════════════════════════════════════
PARTE 6: PROBAR LA APLICACIÓN (10 minutos)
═══════════════════════════════════════════════════════════════════════════════

6.1 INICIAR SERVIDOR LOCAL
   ```bash
   npm run dev
   ```
   
   Abre: http://localhost:5173

6.2 PRUEBA EN NAVEGADOR
   1. Abre DevTools (F12)
   2. Console tab
   3. Ejecuta:
   ```javascript
   import { supabase } from './src/api/supabase.ts'
   const { data } = await supabase.from('courses').select('*')
   console.log(data)
   ```
   
   ✓ Debería mostrar array vacío [] o un curso si existe

6.3 PRUEBA DE INSCRIPCIÓN (SIMULADA)
   1. En la app, intenta ir a /courses
   2. Deberías ver el catálogo vacío (sin datos de prueba aún)
   3. Haz click en un curso (si existe)
   4. Debería abrir modal de detalles

6.4 INSERTAR DATOS DE PRUEBA
   En Supabase Dashboard → SQL Editor:
   ```sql
   -- Categoría
   INSERT INTO categories (name, icon) VALUES 
   ('Programación', 'Code');
   
   -- Profesor
   INSERT INTO professors (name, email) VALUES 
   ('Juan García', 'juan@example.com');
   
   -- Curso
   INSERT INTO courses (
     title, category_id, professor_id, price, capacity,
     start_date, end_date, start_time, end_time,
     days_of_week, schedule, status, is_published
   ) VALUES (
     'Python Avanzado',
     (SELECT id FROM categories WHERE name='Programación'),
     (SELECT id FROM professors WHERE name='Juan García'),
     150, 20,
     '2026-06-01', '2026-07-01',
     '10:00:00', '12:00:00',
     'Mon,Tue,Wed', 'Lunes a Viernes',
     'published', true
   );
   ```
   
   ✓ Ejecúta y verifica que se creó

6.5 PROBAR FLUJO DE INSCRIPCIÓN (CON MOCK)
   En casa, la sucripción llama a una Edge Function que:
   1. Valida usuario
   2. Valida cupos
   3. Crea Payment record
   4. Redirige a Stripe
   
   Para ahora, podemos simular hasta crear el payment.

═══════════════════════════════════════════════════════════════════════════════
PARTE 7: CONFIGURACIÓN EN PRODUCCIÓN (FUTURO)
═══════════════════════════════════════════════════════════════════════════════

7.1 DEPLOY FRONTEND (Vercel)
   ```bash
   # Conectar repo GitHub
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/mi-universidad.git
   git push -u origin main
   
   # En Vercel Dashboard:
   # Import project from GitHub
   # Selecciona repo
   # Environment variables:
   #   VITE_SUPABASE_URL=...
   #   VITE_SUPABASE_ANON_KEY=...
   #   VITE_STRIPE_PUBLIC_KEY=...
   ```

7.2 CONFIGURAR STRIPE WEBHOOK (PRODUCCIÓN)
   En Stripe Dashboard:
   1. Settings → Webhooks
   2. Add endpoint
   3. URL: https://yourapp.supabase.co/functions/v1/webhooks/stripe
   4. Events: payment_intent.succeeded, payment_intent.payment_failed
   5. Copia Signing secret → STRIPE_WEBHOOK_SECRET en Supabase

7.3 USAR STRIPE EN PRODUCCIÓN
   - Cambiar a Live mode en Stripe Dashboard
   - Obtener keys de producción (pk_live_..., sk_live_...)
   - Actualizar .env en Vercel
   - Re-deploy

═══════════════════════════════════════════════════════════════════════════════
PARTE 8: TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════════

PROBLEMA: "Missing Supabase env variables"
SOLUCIÓN:
├─ Verifica que .env.local tiene:
│  ├─ VITE_SUPABASE_URL (con https://)
│  └─ VITE_SUPABASE_ANON_KEY
├─ Reinicia npm run dev
└─ Limpia node_modules si persiste:
   rm -rf node_modules
   npm install

PROBLEMA: "Table does not exist"
SOLUCIÓN:
├─ Verifica que ejecutaste schema.sql
├─ Ve a Supabase → Table Editor
└─ Si faltan tablas, ejecuta schema nuevamente

PROBLEMA: "RLS policy denied"
SOLUCIÓN:
├─ Verifica que RLS está habilitado
├─ Comprueba que tienes usuario autenticado
└─ En tabla → RLS → verifica policies

PROBLEMA: Edge Function "not found" (403)
SOLUCIÓN:
├─ Verifica que deployó:
│  supabase functions list
├─ Redeploy si falta:
│  supabase functions deploy [nombre]
└─ Espera 30 segundos después de deploy

═══════════════════════════════════════════════════════════════════════════════
CHECKLIST FINAL
═══════════════════════════════════════════════════════════════════════════════

SUPABASE:
 ☑ Proyecto creado
 ☑ API keys en .env.local
 ☑ Schema SQL ejecutado
 ☑ Tablas visibles en Table Editor
 ☑ RLS habilitado en 7 tablas
 ☑ Usuario de prueba creado

STRIPE:
 ☑ Cuenta creada
 ☑ Keys (pk_test y sk_test) obtenidas
 ☑ VITE_STRIPE_PUBLIC_KEY en .env.local
 ☑ sk_test disponible para Edge Functions

CÓDIGO:
 ☑ npm install completado
 ☑ npm run dev funciona (localhost:5173)
 ☑ tipos.ts / interfaces actualizadas
 ☑ Cliente Supabase integrado
 ☑ TanStack Query implementado (Caché Centralizada)

ARQUITECTURA (PATRONES.md):
 ☑ Factory Method dispuesto en Pagos
 ☑ Abstract Factory dispuesto para Sidebar Roles
 ☑ Builder dispuesto para Filtros de Cursos
 ☑ Prototype dispuesto para Clonar Cursos

EDGE FUNCTIONS:
 ☑ Supabase CLI instalado
 ☑ enroll function creada y deployed
 ☑ webhooks/stripe creada y deployed
 ☑ Secrets configurados en Supabase

TESTING:
 ☑ Datos de prueba insertados
 ☑ Catálogo muestra cursos
 ☑ Modales de detalles/Inscripciones funcionales
 ☑ Consola sin errores (Stripe/Supabase)

═══════════════════════════════════════════════════════════════════════════════

¿ NECESITAS AYUDA?

1. Error en SQL → Copia el error y búscalo en ARQUITECTURA_COMPLETA.md
2. Código no compila → Verifica que instalaste todas las dependencias
3. Edge Function falla → Revisa supabase functions logs:
   supabase functions logs enroll
4. Stripe webhook → Testea con Stripe CLI:
   npm install -g @stripe/stripe-cli
   stripe listen --forward-to localhost:3000/webhooks

═══════════════════════════════════════════════════════════════════════════════
Documento compilado para: Versión de Producción
Última actualización: 2026-03-17
Archivos asociados: ARQUITECTURA_COMPLETA.md
═══════════════════════════════════════════════════════════════════════════════
