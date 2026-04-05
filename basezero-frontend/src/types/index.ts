export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  apellidos: string;
  iniciales: string;
  rol: 'ADMINISTRADOR' | 'GESTOR' | 'OPERARIO' | 'EMPLEADO';
  activo: boolean;
}

export interface Cliente {
  id: number;
  nombre: string;
  cifNif: string;
  tipo: string;
  personaContacto: string;
  cargo: string;
  telefono: string;
  email: string;
  direccion: string;
}

export interface LineaVenta {
  id?: number;
  producto: string;
  nombre: string;
  descripcion: string;
  unidades: number;
  precio: number;
  descuento: number;
  iva: number;
  total: number;
}

export interface Venta {
  id: number;
  codigo: string;
  fecha: string;
  vencimiento: string;
  estado: 'PENDIENTE' | 'COBRADO' | 'ANULADA';
  metodoPago: string;
  direccionFiscal: string;
  clienteId: number;
  clienteNombre?: string;
  contratoId?: number;
  lineas: LineaVenta[];
  total?: number;
}

export interface Cobro {
  id: number;
  cantidad: number;
  fecha: string;
  metodoPago: string;
  ventaId: number;
  ventaCodigo?: string;
  // Metadata: solo visible para ADMINISTRADOR y GESTOR
  usuarioId?: number;
  usuarioNombre?: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  rol: string;
  nombre: string;
  iniciales: string;
}

export interface Empleado {
  id: number;
  nombre: string;
  telefono?: string;
  email?: string;
  activo: boolean;
}

export interface Turno {
  id: number;
  fecha: string;
  empleadoId: number;
  nombreEmpleado: string;
}

export interface Empresa {
  nombre: string;
  cif: string;
  direccion: string;
  telefono: string;
  email: string;
  web: string;
}
