import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './features/auth/pages/Auth';
import Catalog from './features/catalog/pages/Catalog';
import { ProtectedRoute, AdminRoute } from './shared/components/ProtectedRoute';
import { AdminLayout } from './shared/layouts/AdminLayout';
import { AdminDashboard } from './features/admin/pages/AdminDashboard';
import { AdminCourses } from './features/admin/pages/AdminCourses';
import { AdminProfessors } from './features/admin/pages/AdminProfessors';
import { AdminEnrollments } from './features/enrollments/pages/AdminEnrollments';
import { useAuthStore } from './features/auth/store/useAuthStore';
import { ToastContainer } from './shared/components/ToastContainer';
import WafGate from './shared/components/WafGate';
import Blocked from './shared/pages/Blocked';
import './App.css';

export default function App() {
  const { initialize, loading, user, profile } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
     return <div className="loading-overlay"><div className="spinner"></div></div>;
  }

  // Eliminado interceptor de roles por solicitud. Condicional de renderizado estándar.

  return (
    <BrowserRouter>
      <WafGate>
        <ToastContainer />
        <Routes>
          <Route path="/bloqueado" element={<Blocked />} />
          <Route path="/auth" element={<Auth />} />
        
        {/* Rutas para todos los usuarios autenticados (Estudiantes y Admins) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={profile?.role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard/inicio" replace />} />
          <Route path="/dashboard/*" element={<Catalog />} />
        </Route>
        
        {/* Rutas exclusivas para admin */}
        <Route path="/admin" element={<AdminRoute />}>
           <Route element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="professors" element={<AdminProfessors />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="enrollments" element={<AdminEnrollments />} />
           </Route>
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </WafGate>
    </BrowserRouter>
  );
}
