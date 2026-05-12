import axios from 'axios';
import { useAuthStore } from '../store/authStore';

let isRefreshing = false;
let failedQueue: any[] = [];

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});



api.interceptors.response.use(
  r => r,
  async err => {
    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const base = (api.defaults.baseURL || '/api').replace(/\/$/, '');
        const res = await axios.post(`${base}/auth/refresh`, {}, { withCredentials: true });

        const newToken = res.data.token;
        localStorage.setItem('token', newToken);
        useAuthStore.getState().setAuth(newToken, useAuthStore.getState().user!);

        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        processQueue(null, newToken);
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    if (err.response?.status === 403) {
      const reqUrl = String(originalRequest?.url || '');
      const isAuthLogin =
          reqUrl.includes('/auth/login') ||
          reqUrl.includes('/empleados/auth/login') ||
          reqUrl.includes('/empresas/registro');
      const onLoginPage = window.location.pathname.startsWith('/login');
      const onRegistroPage = window.location.pathname.startsWith('/registro');
      if (!isAuthLogin && !onLoginPage && !onRegistroPage) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(err);
  }
);

// Auth
export const login = (username: string, password: string) =>
  api.post('/auth/login', { username, password });

/** Revoca refresh token en servidor y borra cookie HttpOnly (credentials). */
export const logoutSession = () => api.post('/auth/logout');

export const registroEmpresa = (data: {
  nombreEmpresa: string;
  emailEmpresa: string;
  nombreAdmin: string;
  emailAdmin: string;
  passwordAdmin: string;
}) => api.post('/empresas/registro', data);

// Admin
export const getAdminResumen = () => api.get('/admin/resumen');

// Clientes
export const getClientes = () => api.get('/clientes');
export const createCliente = (data: any) => api.post('/clientes', data);
export const updateCliente = (id: number, data: any) => api.put(`/clientes/${id}`, data);
export const deleteCliente = (id: number) => api.delete(`/clientes/${id}`);

// Ventas
export const getVentas = () => api.get('/ventas');
export const getVentasByCliente = (clienteId: number) => api.get(`/ventas/cliente/${clienteId}`);
export const createVenta = (data: any) => api.post('/ventas', data);
export const updateVenta = (id: number, data: any) => api.put(`/ventas/${id}`, data);
export const deleteVenta = (id: number) => api.delete(`/ventas/${id}`);

// Cobros
export const getCobros = () => api.get('/cobros');
export const getCobrosByVenta = (ventaId: number) => api.get(`/cobros/venta/${ventaId}`);
export const createCobro = (data: any) => api.post('/cobros', data);
export const deleteCobro = (id: number) => api.delete(`/cobros/${id}`);

// Usuarios
export const getUsuarios = () => api.get('/usuarios');
export const createUsuario = (data: any) => api.post('/usuarios', data);
export const updateUsuario = (id: number, data: any) => api.put(`/usuarios/${id}`, data);
export const deleteUsuario = (id: number) => api.delete(`/usuarios/${id}`);

// Contratos
export const getContratos = () => api.get('/contratos');
export const createContrato = (data: any) => api.post('/contratos', data);
export const updateContrato = (id: number, data: any) => api.put(`/contratos/${id}`, data);
export const deleteContrato = (id: number) => api.delete(`/contratos/${id}`);
export const generarVentaContrato = (id: number) => api.post(`/contratos/${id}/generar`);

// Empleados
export const getEmpleados = () => api.get('/empleados');
export const createEmpleado = (data: any) => api.post('/empleados', data);
export const updateEmpleado = (id: number, data: any) => api.put(`/empleados/${id}`, data);
export const deleteEmpleado = (id: number) => api.delete(`/empleados/${id}`);
export const loginEmpleado = (dni: string, password: string) =>
  api.post('/empleados/auth/login', { dni, password });


// Tareas
export const getTareas = () => api.get('/tareas');
export const getTareasByEmpleado = (id: number) => api.get(`/tareas/empleado/${id}`);
export const getTareasPendientesRevision = () => api.get('/tareas/revision');
export const createTarea = (data: any) => api.post('/tareas', data);
export const createTareasBulk = (data: TareaBulkRequest) =>
  api.post<BulkResult<any>>('/tareas/bulk', data);
export const programarTareas = (data: TareaProgramacionRequest) =>
  api.post<BulkResult<any>>('/tareas/programar', data);
export const revisarTarea = (id: number, aprobada: boolean, comentario?: string) =>
  api.put(`/tareas/${id}/revisar?aprobada=${aprobada}${comentario ? `&comentario=${encodeURIComponent(comentario)}` : ''}`);
export const deleteTarea = (id: number) => api.delete(`/tareas/${id}`);

export type TipoAdjuntoTarea = 'NINGUNO' | 'FOTO' | 'VIDEO';

export const completarTareaSinAdjunto = (id: number, comentario?: string) =>
  api.post<TareaResponse>(`/tareas/${id}/completar`, undefined, {
    params: comentario ? { comentario } : {},
  });

export const subirVideoTarea = (id: number, file: File, comentario?: string) => {
  const fd = new FormData();
  fd.append('video', file);
  return api.post<TareaResponse>(`/tareas/${id}/video`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params: comentario ? { comentario } : {},
  });
};

export const subirFotoTarea = (id: number, file: File, comentario?: string) => {
  const fd = new FormData();
  fd.append('foto', file);
  return api.post<TareaResponse>(`/tareas/${id}/foto`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params: comentario ? { comentario } : {},
  });
};

/** Respuesta mínima de tarea (ampliar si hace falta) */
export interface TareaResponse {
  id: number;
  tipoAdjunto?: TipoAdjuntoTarea;
  videoUrl?: string;
  estado?: string;
}

// Turnos
export const getTurnos = () => api.get('/turnos');
export const getTurnosByEmpleado = (id: number) => api.get(`/turnos/empleado/${id}`);
export const createTurno = (data: any) => api.post('/turnos', data);
export const createTurnosBulk = (data: TurnoBulkRequest) =>
  api.post<BulkResult<any>>('/turnos/bulk', data);
export const aplicarPlantillaTurnos = (data: TurnoPlantillaRequest) =>
  api.post<BulkResult<any>>('/turnos/plantilla', data);
export const copiarSemanaTurnos = (data: TurnoCopiarSemanaRequest) =>
  api.post<BulkResult<any>>('/turnos/copiar-semana', data);
export const updateTurno = (id: number, data: any) => api.put(`/turnos/${id}`, data);
export const deleteTurno = (id: number) => api.delete(`/turnos/${id}`);

// ---------- Tipos para operaciones masivas ----------
export type DiaSemana =
  | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface BulkResult<T> {
  creados: T[];
  errores: { indice: number; identificador?: string; mensaje: string }[];
  totalCreados: number;
  totalFallidos: number;
  totalOmitidos: number;
}

export interface TareaBulkRequest {
  evitarDuplicados?: boolean;
  continuarSiHayErrores?: boolean;
  tareas: { empleadoId: number; clienteId: number; zona: string; fecha: string; notas?: string; tipoAdjunto?: TipoAdjuntoTarea }[];
}

export interface TareaProgramacionRequest {
  empleadoIds: number[];
  clienteId: number;
  zona: string;
  fechaInicio: string;
  fechaFin: string;
  diasSemana?: DiaSemana[];
  notas?: string;
  evitarDuplicados?: boolean;
  tipoAdjunto?: TipoAdjuntoTarea;
}

export interface TurnoBulkRequest {
  evitarDuplicados?: boolean;
  continuarSiHayErrores?: boolean;
  turnos: { empleadoId: number; fecha: string; horaEntrada: string; horaSalida: string; notas?: string }[];
}

export interface HorarioDia {
  diaSemana: DiaSemana;
  horaEntrada: string;
  horaSalida: string;
}

export interface TurnoPlantillaRequest {
  empleadoIds: number[];
  fechaInicio: string;
  fechaFin: string;
  horarios: HorarioDia[];
  notas?: string;
  evitarDuplicados?: boolean;
  sobrescribir?: boolean;
}

export interface TurnoCopiarSemanaRequest {
  empleadoIds: number[];
  semanaOrigen: string;
  semanaDestino: string;
  repetirSemanas?: number;
  evitarDuplicados?: boolean;
}

export default api;
