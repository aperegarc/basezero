import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/layout/Layout';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ClientesPage = lazy(() => import('./pages/ClientesPage'));
const VentasPage = lazy(() => import('./pages/VentasPage'));
const CobrosPage = lazy(() => import('./pages/CobrosPage'));
const UsuariosPage = lazy(() => import('./pages/UsuariosPage'));
const ConfigPage = lazy(() => import('./pages/ConfigPage'));
const ContratosPage = lazy(() => import('./pages/ContratosPage'));
const EmpleadosPage = lazy(() => import('./pages/EmpleadosPage'));
const TareasPage = lazy(() => import('./pages/TareasPage'));
const TurnosPage = lazy(() => import('./pages/TurnosPage'));
const RegistroPage = lazy(() => import('./pages/RegistroPage'));

function PageFallback() {
  return (
    <div style={{
      minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Montserrat', sans-serif", fontSize: '.85rem', color: '#718096',
    }}>
      Cargando…
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function RoleRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user } = useAuthStore();
  return user && allowedRoles.includes(user.rol) ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<RoleRoute allowedRoles={['ADMINISTRADOR']}><DashboardPage /></RoleRoute>} />
            <Route path="clientes" element={<RoleRoute allowedRoles={['ADMINISTRADOR']}><ClientesPage /></RoleRoute>} />
            <Route path="ventas" element={<RoleRoute allowedRoles={['ADMINISTRADOR']}><VentasPage /></RoleRoute>} />
            <Route path="cobros" element={<RoleRoute allowedRoles={['ADMINISTRADOR']}><CobrosPage /></RoleRoute>} />
            <Route path="contratos" element={<RoleRoute allowedRoles={['ADMINISTRADOR']}><ContratosPage /></RoleRoute>} />
            <Route path="empleados" element={<RoleRoute allowedRoles={['ADMINISTRADOR']}><EmpleadosPage /></RoleRoute>} />
            <Route path="tareas" element={<RoleRoute allowedRoles={['ADMINISTRADOR', 'EMPLEADO']}><TareasPage /></RoleRoute>} />
            <Route path="turnos" element={<RoleRoute allowedRoles={['ADMINISTRADOR', 'EMPLEADO']}><TurnosPage /></RoleRoute>} />
            <Route path="usuarios" element={<RoleRoute allowedRoles={['ADMINISTRADOR']}><UsuariosPage /></RoleRoute>} />
            <Route path="config" element={<RoleRoute allowedRoles={['ADMINISTRADOR']}><ConfigPage /></RoleRoute>} />
          </Route>
          <Route path="/registro" element={<RegistroPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
