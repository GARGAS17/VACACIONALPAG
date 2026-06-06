<div align="center">
  <h1>🎓 VacacionalPag</h1>
  <p><strong>Plataforma integral para la gestión y matrícula de cursos vacacionales universitarios.</strong></p>

  [![React](https://img.shields.io/badge/React-19-blue.svg?style=flat&logo=react)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-5-646CFF.svg?style=flat&logo=vite)](https://vitejs.dev/)
  [![Supabase](https://img.shields.io/badge/Supabase-DB-3ECF8E.svg?style=flat&logo=supabase)](https://supabase.com/)
  [![Clean Architecture](https://img.shields.io/badge/Architecture-Clean%20%26%20Feature--Driven-orange.svg)]()
</div>

---

## 📖 Descripción General

**VacacionalPag** es una plataforma web moderna diseñada para automatizar y escalar el proceso de inscripciones a cursos de temporada. Mediante un sistema modular basado en roles, permite a los estudiantes inscribirse y realizar pagos, mientras que otorga a los administradores herramientas potentes para la creación rápida de cursos y gestión de matrículas.

El proyecto destaca por su riguroso diseño arquitectónico (Clean Architecture) y la implementación de un Firewall de Aplicaciones Web (WAF) a nivel de Edge Functions para garantizar la máxima seguridad en transacciones.

---

## 🚀 Tecnologías Core

- **Frontend**: React 19 + Vite + React Router v7
- **Estilizado**: Tailwind CSS (complementado con Vanilla CSS para micro-animaciones premium)
- **Backend as a Service (BaaS)**: Supabase (PostgreSQL, Edge Functions, Auth, Row Level Security)
- **Estado Global y Caché**: Zustand & TanStack Query v5 (React Query)
- **Seguridad Edge**: Deno (Supabase Edge Functions)
- **Pasarelas**: Stripe

---

## 🏛️ Arquitectura del Sistema

El sistema implementa una **Arquitectura Limpia (Feature-Driven)** que asegura la escalabilidad del código base y la estricta separación de responsabilidades:

- **Dominio y Casos de Uso:** Agrupados por contexto de negocio, independientes de la UI.
- **Patrones de Diseño Formales (`PATRONES.md`):**
  - **Factory Method**: Procesamiento dinámico de pasarelas de pago (Stripe vs Manual).
  - **Abstract Factory**: Renderización dinámica de interfaces de navegación basadas en roles.
  - **Builder**: Construcción fluida de consultas complejas para el catálogo de cursos.
  - **Composite**: Gestión jerárquica de categorías.
  - **Flyweight**: Optimización de carga en memoria de entidades.
  - **Facade & Bridge**: Abstracción de servicios complejos (Matrículas y Reportes).

### 🛡️ Seguridad Avanzada (WAF-Guard)
El proyecto incluye un firewall (`waf-guard`) desplegado en la red Edge de Supabase que protege activamente la API contra ataques de Inyección SQL (SQLi). Posee capacidad analítica para bloquear automáticamente IPs maliciosas y aislar la aplicación web de amenazas de red.

---

## 📂 Estructura del Proyecto

El código fuente (Frontend) está estrictamente dividido en dominios de negocio:

```text
src/
├── infrastructure/     # Conexiones externas (Cliente Supabase, etc.)
├── features/           # Módulos de negocio (El núcleo de la App)
│   ├── admin/          # Paneles y gestión para personal administrativo
│   ├── auth/           # Autenticación, control de sesión y WAF Gate
│   ├── billing/        # Procesamiento de pagos, adaptadores y factorías
│   ├── catalog/        # Visualización de cursos, Queries y Decoradores
│   └── enrollments/    # Lógica transaccional y vistas de matrículas
├── shared/             # UI Genérica, Layouts y Servicios transversales
└── App.jsx             # Orquestador Principal
```

---

## 🛠️ Guía de Inicio Rápido

Para instrucciones detalladas sobre cómo recrear la base de datos y configurar el backend, consulta el archivo **[`SETUP_PASO_A_PASO.md`](./SETUP_PASO_A_PASO.md)**.

### Preparación del entorno de desarrollo:
1. **Instalar dependencias:**
   ```bash
   pnpm install
   ```
2. **Configurar Variables de Entorno:**
   Crea un archivo `.env.local` en la raíz del proyecto.
   ```env
   VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhb...
   VITE_STRIPE_PUBLIC_KEY=pk_test_...
   ```
3. **Ejecutar el servidor local:**
   ```bash
   pnpm dev
   ```

---

## 📚 Documentación Adjunta

- 📄 [`SETUP_PASO_A_PASO.md`](./SETUP_PASO_A_PASO.md): Guía de configuración completa de DB, Edge Functions y Supabase CLI.
- 📄 [`PATRONES.md`](./PATRONES.md): Documentación técnica y diagramas sobre los patrones de diseño GoF implementados.
- 📄 [`ARQUITECTURA_COMPLETA.md`](./ARQUITECTURA_COMPLETA.md): Documento extenso sobre topología y diagramas UML.

---
<div align="center">
  <p>Construido con ❤️ para la eficiencia académica y la excelencia del software.</p>
</div>
