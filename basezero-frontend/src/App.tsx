import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientesPage from './pages/ClientesPage';
import VentasPage from './pages/VentasPage';
import CobrosPage from './pages/CobrosPage';
import UsuariosPage from './pages/UsuariosPage';
import ConfigPage from './pages/ConfigPage';
import ContratosPage from './pages/ContratosPage';
import EmpleadosPage from './pages/EmpleadosPage';
import TareasPage from './pages/TareasPage';
import TurnosPage from './pages/TurnosPage';
import RegistroPage from './pages/RegistroPage';

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
    </BrowserRouter>
  );
}