import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Home, BookOpen, User, CreditCard, GraduationCap, Settings, 
  HelpCircle, LogOut, Search, Sun, Sunset, Moon, Users, 
  Calendar, Clock, CheckCircle2, ChevronRight, X
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../services/useNotificationStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { PaymentFactory, PaymentRequest } from '../services/paymentAdapter';
import { NotificationFactory } from '../services/notificationBridge';
import { UIFactoryProvider } from '../layouts/uiFactory';
import { CourseQueryBuilder } from '../services/courseQueryBuilder';

import ProfileView from '../components/dashboard/ProfileView';
import PaymentsView from '../components/dashboard/PaymentsView';
import MyCoursesView from '../components/dashboard/MyCoursesView';
import SettingsView from '../components/dashboard/SettingsView';
import HelpView from '../components/dashboard/HelpView';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function Catalog() {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [filter, setFilter] = useState('Todos');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const currentTab = location.pathname.split('/').pop() || 'inicio';
  const [paymentMethod, setPaymentMethod] = useState('stripe');

  const { signOut, profile, user } = useAuthStore();
  const navigate = useNavigate();
  const hasShownWelcome = useRef(false);

  // === 🚀 USO DE TANSTACK QUERY (Filtrado y Carga) ===
  const { data: courses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('courses').select('*, categories(name), professors(name)');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: paidCourseIds = [] } = useQuery({
    queryKey: ['paidCourseIds', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', user.id)
        .in('payment_status', ['paid', 'completed']);
      
      if (error) throw error;
      return data?.map(e => e.course_id) || [];
    },
    enabled: !!user?.id
  });

  useEffect(() => {
    if (!hasShownWelcome.current) {
      // 🌉 PATRÓN BRIDGE: Petición UI "Standard" usando "Toast"
      const welcomeNotif = NotificationFactory.create('standard', 'toast');
      welcomeNotif.notify('¡Bienvenido de nuevo al Aula Virtual!', 'success');
      hasShownWelcome.current = true;
    }
  }, []);

  // === 🔌 PATRÓN FACTORY + ADAPTER (Pagos) ===
  const handleEnroll = async (courseId) => {
    setEnrolling(true);
    try {
      const request = new PaymentRequest(courseId, user?.id, paymentMethod);
      const adapter = PaymentFactory.createAdapter(paymentMethod);
      const result = await adapter.procesar(request);

      if (result.status === 'REDIRECT' && result.redirectUrl?.startsWith('http')) {
        // 🌉 PATRÓN BRIDGE: Mensajes de hardware o redirección externa marcada como "System"
        const sysNotif = NotificationFactory.create('system', 'toast');
        sysNotif.notify(result.message, 'info');
        window.location.assign(result.redirectUrl);
      } else if (result.redirectUrl) {
        // 🌉 PATRÓN BRIDGE: Exito estándar
        const stdNotif = NotificationFactory.create('standard', 'toast');
        stdNotif.notify(result.message, 'success');
        navigate(result.redirectUrl);
      } else {
        // 🌉 PATRÓN BRIDGE: Error crítico marcado como "Urgent"
        const urgentNotif = NotificationFactory.create('urgent', 'toast');
        urgentNotif.notify(result.message, 'error');
      }
    } catch (error) {
      const errorNotif = NotificationFactory.create('urgent', 'toast');
      errorNotif.notify("Error al iniciar inscripción: " + error.message, 'error');
    } finally {
      setEnrolling(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    sessionStorage.clear(); // Limpia role_selected y role_mode de un golpe
    addToast({ type: 'info', message: 'Sesión cerrada correctamente' });
    navigate('/auth');
  };

  // === 🛠️ USO DEL PATRÓN BUILDER (Constructor de Consultas) ===
  const filteredCourses = new CourseQueryBuilder(courses)
    .excludePaid(paidCourseIds)
    .withSearch(searchQuery)
    .withSchedule(filter)
    .onlyAvailable(onlyAvailable)
    .build();

  const Sidebar = () => {
    const factory = UIFactoryProvider.getFactory('student', profile);
    const navItems = factory.getSidebarItems();

    return (
      <div className="navigation">
        <ul>
          {navItems.map((item) => {
            const Icon = item.icon;
            const linkName = item.to.split('/').pop();
            const isActive = currentTab === linkName;

            return (
              <li 
                key={item.to} 
                className={isActive ? 'active' : ''} 
                onClick={() => navigate(item.to)}
              >
                <a href="#">
                  <span className="icon"><Icon size={24} /></span>
                  <span className="title">{item.label}</span>
                </a>
              </li>
            );
          })}
          
          <li style={{ marginTop: 'auto', marginBottom: '20px' }}>
            <button onClick={handleSignOut}>
              <span className="icon"><LogOut size={24} /></span>
              <span className="title font-bold">Cerrar Sesión</span>
            </button>
          </li>
        </ul>
      </div>
    );
  };

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content" style={{ padding: 0 }}>
        {currentTab === 'perfil' && <ProfileView />}
        {currentTab === 'pagos' && <PaymentsView />}
        {currentTab === 'mis_cursos' && <MyCoursesView onExplore={() => setCurrentTab('cursos')} />}
        {currentTab === 'ajustes' && <SettingsView />}
        {currentTab === 'ayuda' && <HelpView />}

        {(currentTab === 'inicio' || currentTab === 'cursos') && (
          <div className="p-6">
            <div className="header-area">
              <div className="header-title">
                <h1>Catálogo de Cursos</h1>
                <p>Elige tu curso, inscríbete y empieza tu vacación productiva</p>
              </div>
            </div>

        <div className="filters-bar">
          <div className="search-container">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Buscar curso o instructor..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-pills">
            <button className={`filter-pill ${filter === 'Todos' ? 'active' : ''}`} onClick={() => setFilter('Todos')}>Todos</button>
            <button className={`filter-pill ${filter === 'Mañana' ? 'active' : ''}`} onClick={() => setFilter('Mañana')}><Sun size={14}/> Mañana</button>
            <button className={`filter-pill ${filter === 'Tarde' ? 'active' : ''}`} onClick={() => setFilter('Tarde')}><Sunset size={14}/> Tarde</button>
            <button className={`filter-pill ${filter === 'Noche' ? 'active' : ''}`} onClick={() => setFilter('Noche')}><Moon size={14}/> Noche</button>
            <div style={{ width: '1px', height: '24px', backgroundColor: '#e2e8f0', margin: '0 8px' }}></div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#64748b', cursor: 'pointer' }}>
              <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} />
              Solo con cupos
            </label>
          </div>
        </div>

        {loadingCourses ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="course-grid">
            {filteredCourses.map(course => {
              const available = course.capacity - course.enrolled_count;
              const badgeClass = available === 0 ? 'danger' : (available > 5 ? 'success' : 'warning');
              const professorName = course.professors?.name || 'Instructor Gral';
              const initial = professorName.charAt(0).toUpperCase();

              return (
                <div key={course.id} className="course-card" onClick={() => setSelectedCourse(course)}>
                  <div className={`badge ${badgeClass}`}>
                    {available === 0 ? 'Lleno' : `${available} cupos`}
                  </div>
                  <h3 className="course-title">{course.title}</h3>
                  <div className="instructor-info">
                    <div className="instructor-avatar">{initial}</div>
                    <span className="instructor-name">{professorName}</span>
                  </div>
                  <p className="course-description">{course.description || "Un curso increíble para mejorar tus habilidades este verano."}</p>
                  <div className="course-details-list">
                    <div className="detail-item"><Calendar size={14} /> {course.days_of_week || "Lunes a Viernes"}</div>
                    <div className="detail-item"><Clock size={14} /> {course.start_time?.slice(0,5)} - {course.end_time?.slice(0,5)}</div>
                    <div className="detail-item"><Users size={14} /> {course.enrolled_count}/{course.capacity} inscritos</div>
                  </div>
                  <div className="course-footer">
                    <div className="course-price">$ US$ {course.price}</div>
                    <span className="btn-details">
                      Ver detalle <ChevronRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginTop: '-2px' }}/>
                    </span>
                  </div>
                </div>
              );
            })}
            {filteredCourses.length === 0 && <p style={{ color: '#64748b', gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>No hay cursos que coincidan con los filtros.</p>}
          </div>
        )}
        </div>
        )}
      </main>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div className="modal-overlay" onClick={(e) => { if(e.target.className === 'modal-overlay') setSelectedCourse(null) }}>
          <div className="modal-content">
            <button className="modal-close" onClick={() => setSelectedCourse(null)}><X size={18} /></button>
            <div className="modal-body">
              <h2 className="modal-title">{selectedCourse.title}</h2>
              <div className="badge success" style={{ marginBottom: 0 }}>✓ {selectedCourse.capacity - selectedCourse.enrolled_count} cupos disponibles</div>
              <p className="modal-description">{selectedCourse.description || "Profundiza en tus conocimientos con este curso intensivo."}</p>
              <div className="modal-info-box">
                <div className="course-details-list" style={{ marginBottom: '16px' }}>
                  <div className="detail-item"><Clock size={16} /> {selectedCourse.days_of_week || "Lunes a Viernes"} | {selectedCourse.start_time?.slice(0,5)} - {selectedCourse.end_time?.slice(0,5)}</div>
                  <div className="detail-item"><Calendar size={16} /> Duración total del periodo vacacional</div>
                  <div className="detail-item"><Users size={16} /> {selectedCourse.enrolled_count} inscritos de {selectedCourse.capacity} cupos totales</div>
                </div>
                <div className="course-price" style={{ fontSize: '1.25rem' }}>$ US$ {selectedCourse.price}</div>
              </div>
              <div className="mb-4">
                <p className="text-slate-700 font-bold mb-2 text-xs">Selecciona método de pago:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setPaymentMethod('stripe')} 
                    className={`p-3 rounded-xl border text-center text-xs font-bold cursor-pointer transition-colors ${paymentMethod === 'stripe' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700' : 'border-slate-100 bg-white hover:bg-slate-50'}`}
                  >
                    Tarjeta (Stripe)
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('manual')} 
                    className={`p-3 rounded-xl border text-center text-xs font-bold cursor-pointer transition-colors ${paymentMethod === 'manual' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700' : 'border-slate-100 bg-white hover:bg-slate-50'}`}
                  >
                    Transferencia / Efectivo
                  </button>
                </div>
              </div>

              <button 
                className="btn-primary" 
                onClick={() => handleEnroll(selectedCourse.id)}
                disabled={enrolling || selectedCourse.capacity - selectedCourse.enrolled_count <= 0}
                style={{ opacity: (enrolling || selectedCourse.capacity - selectedCourse.enrolled_count <= 0) ? 0.6 : 1 }}
              >
                {enrolling ? 'Procesando...' : 'Inscribirse →'}
              </button>
            </div>
            <div className="instructor-overlay-card">
              <div className="avatar-large">{(selectedCourse.professors?.name || 'I').charAt(0).toUpperCase()}</div>
              <div className="role">INSTRUCTOR</div>
              <div className="name">{selectedCourse.professors?.name || 'Instructor Gral'}</div>
              <div className="bio">Profesional experto con años de experiencia impartiendo la materia.</div>
            </div>
          </div>
        </div>
      )}

      {enrolling && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <h3 style={{ color: '#0f172a' }}>Redirigiendo a Pago Seguro...</h3>
          <p style={{ color: '#64748b', marginTop: '8px' }}>Preparando sesión con Stripe</p>
        </div>
      )}
    </div>
  );
}
