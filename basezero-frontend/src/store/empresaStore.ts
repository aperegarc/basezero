import { create } from 'zustand';

export interface EmpresaConfig {
  nombre: string;
  cif: string;
  direccion: string;
  telefono: string;
  email: string;
  web: string;
}

const DEFAULT: EmpresaConfig = {
  nombre: 'Mi Empresa S.L.',
  cif: 'B00000000',
  direccion: 'Calle Mayor 1, 26001 Logroño, La Rioja',
  telefono: '941 000 000',
  email: 'info@miempresa.com',
  web: 'www.miempresa.com',
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