import { create } from 'zustand';

interface AuthUser {
  id: number;
  email: string;
  nombre: string;
  iniciales: string;
  rol: 'ADMINISTRADOR' | 'GESTOR' | 'OPERARIO' | 'EMPLEADO';
}

interface AuthStore {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
  isAdmin: () => boolean;
  puedeVerMetadata: () => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  token: localStorage.getItem('token'),
  user: (() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  })(),
  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },
  isAdmin: () => get().user?.rol === 'ADMINISTRADOR',
  puedeVerMetadata: () => {
    const rol = get().user?.rol;
    return rol === 'ADMINISTRADOR' || rol === 'GESTOR';
  },
}));
