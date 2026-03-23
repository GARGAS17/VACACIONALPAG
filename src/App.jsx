import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Catalog from './pages/Catalog';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminCourses } from './pages/admin/AdminCourses';
import { AdminProfessors } from './pages/admin/AdminProfessors';
import { AdminEnrollments } from './pages/admin/AdminEnrollments';
import { useAuthStore } from './store/useAuthStore';
import { ToastContainer } from './components/ToastContainer';
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
      <ToastContainer />
      <Routes>
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
    </BrowserRouter>
  );
}
