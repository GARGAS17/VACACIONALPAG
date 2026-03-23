# 🎓 Plataforma de Cursos Vacacionales (VacacionalPag)

Plataforma Web interactiva diseñada para la gestión y matrícula de cursos vacacionales. Cuenta con un sistema modular que separa las interfaces de alumnos y administradores haciendo uso de patrones de diseño avanzados, estados reactivos y persistencia en la nube.

---

## 🚀 Tecnologías Principales

*   **Frontend**: React 19 + Vite + React Router v7
*   **Diseño y Estilos**: Tailwind CSS (Vanilla CSS para micro-interacciones)
*   **Base de Datos y Auth**: [Supabase](https://supabase.com/) (PostgreSQL)
*   **Gestión de Caché**: [TanStack Query v5](https://tanstack.com/query) (React Query)
*   **Estados Globales**: [Zustand](https://zustand-demo.pmnd.rs/)
*   **Pagos**: Stripe + Sistemas Manuales (Transferencias)

---

## 🧠 Arquitectura y Patrones de Diseño (`PATRONES.md`)

El proyecto implementa una arquitectura escalable para facilitar el crecimiento de las operaciones:

*   **Factory Method (Pagos)**: Crea procesadores dinámicos para Stripe y Pagos Manuales independientes sin acoplar código.
*   **Abstract Factory (UI por Roles)**: Genera barras de navegación (Sidebar) dinámicas según si eres `Student` o `Admin`.
*   **Builder (Filtro de Cursos)**: Alimenta el buscador encadenando filtros lógicos (`.withSearch()`, `.withSchedule()`, `.build()`).
*   **Prototype (Dashboard)**: Clona cursos existentes con un clic para duplicar ofertas rápidamente.

---

## 📁 Estructura del Proyecto

```text
src/
├── api/             # Cliente de Supabase y Controladores
├── components/      # Componentes reutilizables (Toast, Dashboard Views)
├── layouts/         # uiFactory (Contenedores de vistas familias)
├── pages/           # Vistas (Catalog, Auth, Admin Panels)
├── services/        # QueryBuilders, PaymentFactory, Notifiers
├── store/           # Zustand Stores (Auth, Notificaciones)
└── App.jsx          # Enrutador y middleware de sesión
```

---

## 🛠️ Instalación y Encendido

1. **Clonar el repositorio** o situarse en la carpeta raíz.
2. **Instalar dependencias**:
   ```bash
   npm install
   ```
3. **Configurar Variables de Entorno**:
   Crea un archivo `.env.local` en la raíz añadiendo las URL de Supabase y Keys de Stripe:
   ```text
   VITE_SUPABASE_URL=tu_url_supabase
   VITE_SUPABASE_ANON_KEY=tu_clave_anon_supabase
   VITE_STRIPE_PUBLIC_KEY=tu_clave_publica_stripe
   ```
4. **Levantar Servidor Local**:
   ```bash
   npm run dev
   ```

---

## 🛡️ Credenciales de Administrador (Prueba)
*   **Email**: `santa@unicesar.edu.co`
*   **Password**: [Tu Contraseña actual de sesión]

*Para más detalles sobre cómo desmontar patrones o configurar pasarelas, lee `PATRONES.md`.*
