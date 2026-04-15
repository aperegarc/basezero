import { create } from 'zustand';

export interface EmpresaConfig {
  // Datos empresa
  nombre: string;
  cif: string;
  direccion: string;
  telefono: string;
  email: string;
  web: string;
  iban: string;
  // Numeración de documentos
  prefijoFactura: string;
  siguienteFactura: number;
  prefijoPresupuesto: string;
  siguientePresupuesto: number;
  prefijoAlbaran: string;
  siguienteAlbaran: number;
  ivaPorDefecto: number;
  diasVencimiento: number;
  // Textos predeterminados
  pieFactura: string;
  condicionesPago: string;
}

const DEFAULT: EmpresaConfig = {
  nombre: 'Mi Empresa S.L.',
  cif: 'B00000000',
  direccion: 'Calle Mayor 1, 26001 Logroño, La Rioja',
  telefono: '941 000 000',
  email: 'info@miempresa.com',
  web: 'www.miempresa.com',
  iban: '',
  prefijoFactura: 'F',
  siguienteFactura: 1,
  prefijoPresupuesto: 'P',
  siguientePresupuesto: 1,
  prefijoAlbaran: 'A',
  siguienteAlbaran: 1,
  ivaPorDefecto: 21,
  diasVencimiento: 30,
  pieFactura: 'Gracias por confiar en nosotros.',
  condicionesPago: 'Pago a 30 días mediante transferencia bancaria.',
};

interface EmpresaStore {
  config: EmpresaConfig;
  setConfig: (config: EmpresaConfig) => void;
}

export const useEmpresaStore = create<EmpresaStore>((set) => ({
  config: (() => {
    try {
      const saved = localStorage.getItem('empresa_config');
      return saved ? { ...DEFAULT, ...JSON.parse(saved) } : DEFAULT;
    } catch { return DEFAULT; }
  })(),
  setConfig: (config) => {
    localStorage.setItem('empresa_config', JSON.stringify(config));
    set({ config });
  },
}));