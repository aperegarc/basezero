import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const NAV = [
  { section: 'PRINCIPAL' },
  { path: '/', icon: '', label: 'Dashboard' },
  { section: 'GESTIÓN' },
  { path: '/clientes', icon: '', label: 'Clientes' },
  { path: '/ventas', icon: '', label: 'Ventas' },
  { path: '/cobros', icon: '', label: 'Cobros' },
  { path: '/contratos', icon: '', label: 'Contratos' },
  { section: 'EQUIPO' },
  { path: '/empleados', icon: '', label: 'Empleados' },
  { path: '/tareas', icon: '', label: 'Tareas' },
  { path: '/turnos', icon: '', label: 'Turnos' },
  { section: 'ADMINISTRACIÓN' },
  { path: '/usuarios', icon: '', label: 'Usuarios' },
  { path: '/config', icon: '', label: 'Mi empresa' },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNav = NAV.filter(item => {
    if ('section' in item) return true;
    if (user?.rol === 'EMPLEADO') {
      return item.path === '/tareas' || item.path === '/turnos';
    }
    return true;
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const pageTitles: Record<string, string> = {
    '/': 'Dashboard',
    '/clientes': 'Clientes',
    '/ventas': 'Ventas',
    '/cobros': 'Cobros',
    '/contratos': 'Contratos recurrentes',
    '/empleados': 'Empleados',
    '/tareas': 'Tareas',
    '/turnos': 'Turnos',
    '/usuarios': 'Usuarios',
    '/config': 'Mi empresa',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Montserrat', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Sidebar overlay mobile */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 199 }} />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 240, background: '#0D1B2A', position: 'fixed', top: 0, left: 0, bottom: 0,
        zIndex: 200, display: 'flex', flexDirection: 'column', overflowY: 'auto',
        transform: sidebarOpen ? 'translateX(0)' : undefined,
      }}>
        {/* Logo */}
        <div style={{ padding: '1.5rem 1.5rem 1.2rem', borderBottom: '1px solid rgba(0,180,216,.12)' }}>
          <div style={{ fontSize: '1.15rem', fontWeight: 900, letterSpacing: '-.04em', color: '#fff' }}>
            BASE<span style={{ color: '#00B4D8' }}>ZERO</span>
          </div>
          <div style={{ fontSize: '.5rem', fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(0,180,216,.35)', marginTop: '.2rem' }}>
            SYSTEM
          </div>
        </div>

        {/* User */}
        <div style={{ padding: '.9rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', gap: '.65rem' }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', background: '#0090B0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '.68rem', fontWeight: 900, color: '#fff', flexShrink: 0,
          }}>
            {user?.iniciales || 'AD'}
          </div>
          <div>
            <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{user?.nombre || 'Admin'}</div>
            <div style={{ fontSize: '.58rem', color: '#A0AEC0' }}>{user?.rol || 'ADMINISTRADOR'}</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '.5rem 0' }}>
          {filteredNav.map((item, i) => {
            if ('section' in item) {
              return (
                <div key={i} style={{ padding: '.8rem .7rem .35rem', fontSize: '.5rem', fontWeight: 800, letterSpacing: '.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,.22)' }}>
                  {item.section}
                </div>
              );
            }
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path!); setSidebarOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '.6rem',
                  padding: '.6rem .8rem', margin: '.12rem .45rem',
                  borderRadius: 7, cursor: 'pointer', border: 'none',
                  background: active ? 'rgba(0,180,216,.11)' : 'none',
                  borderColor: active ? 'rgba(0,180,216,.18)' : 'transparent',
                  borderWidth: 1, borderStyle: 'solid',
                  width: 'calc(100% - .9rem)', textAlign: 'left',
                  fontFamily: "'Montserrat', sans-serif",
                  transition: 'all .18s',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.06)'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'none'; }}
              >
                <span style={{ fontSize: '.85rem', width: 20, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontSize: '.71rem', fontWeight: 700, color: active ? '#00B4D8' : 'rgba(255,255,255,.55)', transition: 'color .18s' }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '.9rem 1.5rem', borderTop: '1px solid rgba(255,255,255,.05)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '.5rem', background: 'rgba(239,68,68,.08)',
              border: '1px solid rgba(239,68,68,.15)', borderRadius: 7,
              color: '#FCA5A5', fontSize: '.65rem', fontWeight: 700,
              cursor: 'pointer', fontFamily: "'Montserrat', sans-serif",
              transition: 'all .18s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,.18)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,.08)'; }}
          >
            Cerrar sesión
          </button>
          <div style={{ fontSize: '.5rem', color: 'rgba(255,255,255,.15)', textAlign: 'center', marginTop: '.7rem', letterSpacing: '.08em' }}>
            BASEZERO © 2026
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <header style={{
          background: '#fff', borderBottom: '1px solid #E2E8F0',
          padding: '.9rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem',
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '.95rem', fontWeight: 900, color: '#1A202C' }}>
              {pageTitles[location.pathname] || 'BASEZERO'}
            </span>
          </div>
          <div style={{ fontSize: '.65rem', color: '#A0AEC0', fontWeight: 600 }}>
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </header>

        {/* Content */}
        <main style={{ padding: '1.5rem 2rem', flex: 1, background: '#F8FAFC' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}