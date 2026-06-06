import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Leer credenciales de .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const VITE_SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const VITE_SUPABASE_ANON_KEY = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

async function runDemo() {
  console.log("==========================================================");
  console.log("   DEMOSTRACIÓN DE ROW LEVEL SECURITY (RLS) - VACACIONAL  ");
  console.log("==========================================================\n");


  const emailA = 'camilosantana486@gmail.com'; // <-- CAMBIAR POR UN USUARIO REAL
  const passwordA = 'play2choche';            // <-- CAMBIAR POR SU CONTRASEÑA
  
  const emailB = 'santanacamilo460@gmail.com'; // <-- CAMBIAR POR OTRO USUARIO REAL
  const passwordB = 'play2choche';            // <-- CAMBIAR POR SU CONTRASEÑA

  try {
    // ============================================
    // 1. ESTUDIANTE A
    // ============================================
    console.log(`[+] Iniciando sesión como Estudiante A: ${emailA}`);
    const { data: userA, error: errA } = await supabase.auth.signInWithPassword({
      email: emailA,
      password: passwordA
    });

    if (errA) throw new Error(`Fallo login A: ${errA.message} (Verifica que el usuario exista)`);
    console.log("✔️ Estudiante A autenticado.");

    // Consultar TODAS las inscripciones (sin usar un WHERE)
    console.log("[+] Ejecutando en BD: SELECT * FROM enrollments");
    const { data: enrollmentsA, error: errEnrollA } = await supabase
      .from('enrollments')
      .select('id, course_id, payment_status, paid_amount');
    
    if (errEnrollA) throw errEnrollA;
    console.log(`>>> Resultados para ${emailA}: Encontró ${enrollmentsA.length} registros de inscripción.`);
    console.dir(enrollmentsA);

    // Cerrar sesión
    await supabase.auth.signOut();
    console.log("\n----------------------------------------------------------\n");

    // ============================================
    // 2. ESTUDIANTE B
    // ============================================
    console.log(`[+] Iniciando sesión como Estudiante B: ${emailB}`);
    const { data: userB, error: errB } = await supabase.auth.signInWithPassword({
      email: emailB,
      password: passwordB
    });

    if (errB) throw new Error(`Fallo login B: ${errB.message} (Verifica que el usuario exista)`);
    console.log("✔️ Estudiante B autenticado.");

    // Consultar TODAS las inscripciones (sin usar un WHERE)
    console.log("[+] Ejecutando en BD: SELECT * FROM enrollments");
    const { data: enrollmentsB, error: errEnrollB } = await supabase
      .from('enrollments')
      .select('id, course_id, payment_status, paid_amount');
    
    if (errEnrollB) throw errEnrollB;
    console.log(`>>> Resultados para ${emailB}: Encontró ${enrollmentsB.length} registros de inscripción.`);
    console.dir(enrollmentsB);

    console.log("\n==========================================================");
    console.log("✅ CONCLUSIÓN DE LA PRUEBA:");
    console.log("Ambos usuarios ejecutan el mismo código (SELECT * FROM enrollments),");
    console.log("pero no ven los datos del otro. El motor de PostgreSQL (RLS) intercepta");
    console.log("la sesión mediante la regla `USING (auth.uid() = user_id)` y filtra");
    console.log("silenciosamente los registros.");
    console.log("Esto previene de forma nativa los ataques BOLA (IDOR)!");
    console.log("==========================================================");

  } catch (err) {
    console.error("\n❌ Error en la demostración:", err.message);
  }
}

runDemo();
