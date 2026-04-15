import { useState } from 'react';
import { useEmpresaStore } from '../store/empresaStore';

const MF = "'Montserrat', sans-serif";

const inp = {
  width: '100%', padding: '.55rem .8rem', border: '1px solid #E2E8F0',
  borderRadius: 7, fontSize: '.76rem', color: '#2D3748',
  fontFamily: MF, outline: 'none', background: '#fff', boxSizing: 'border-box' as const,
};

const FL = ({ children }: { children: React.ReactNode }) => (
  <label style={{ display: 'block', fontSize: '.6rem', fontWeight: 700, color: '#718096', marginBottom: '.3rem', textTransform: 'uppercase' as const, letterSpacing: '.06em', fontFamily: MF }}>
    {children}
  </label>
);

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, marginBottom: '1.2rem', overflow: 'hidden' }}>
    <div style={{ padding: '.75rem 1.2rem', borderBottom: '1px solid #F1F5F9', background: '#FAFBFC' }}>
      <span style={{ fontSize: '.78rem', fontWeight: 800, color: '#1A202C', fontFamily: MF }}>{title}</span>
    </div>
    <div style={{ padding: '1.2rem' }}>{children}</div>
  </div>
);

const FocusInput = ({ value, onChange, type = 'text', placeholder = '' }: {
  value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string;
}) => (
  <input
    type={type} value={value} placeholder={placeholder}
    onChange={e => onChange(e.target.value)}
    style={inp}
    onFocus={e => e.target.style.borderColor = '#00B4D8'}
    onBlur={e => e.target.style.borderColor = '#E2E8F0'}
  />
);

export default function ConfigPage() {
  const { config, setConfig } = useEmpresaStore();
  const [form, setForm] = useState({ ...config });
  const [saved, setSaved] = useState(false);

  const set = (key: string, val: string | number) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = () => {
    setConfig(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      {/* Toast */}
      {saved && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999, background: '#D1FAE5', border: '1px solid rgba(16,185,129,.3)', color: '#065F46', padding: '.7rem 1.2rem', borderRadius: 10, fontSize: '.75rem', fontWeight: 700, fontFamily: MF }}>
          ✅ Configuración guardada
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.4rem' }}>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 900, color: '#1A202C', fontFamily: MF }}>Configuración</h1>
          <p style={{ fontSize: '.68rem', color: '#718096', marginTop: '.2rem', fontFamily: MF }}>Empresa, numeración y textos predeterminados</p>
        </div>
        <button onClick={handleSave} style={{ padding: '.5rem 1.3rem', borderRadius: 8, border: 'none', background: '#00B4D8', color: '#0D1B2A', fontSize: '.75rem', fontWeight: 800, cursor: 'pointer', fontFamily: MF }}>
          💾 Guardar cambios
        </button>
      </div>

      {/* Vista previa cabecera */}
      <div style={{ background: '#0D1B2A', borderRadius: 12, padding: '1.2rem 1.5rem', marginBottom: '1.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', letterSpacing: '-.03em', fontFamily: MF }}>
            BASE<span style={{ color: '#00B4D8' }}>ZERO</span>
          </div>
          <div style={{ fontSize: '.67rem', color: '#00B4D8', marginTop: '.15rem', fontWeight: 700, fontFamily: MF }}>{form.nombre}</div>
          <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.45)', marginTop: '.15rem', fontFamily: MF }}>{form.direccion}</div>
          <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.4)', fontFamily: MF }}>{form.telefono}{form.email ? ` · ${form.email}` : ''}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '.55rem', color: 'rgba(255,255,255,.25)', textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: MF }}>Vista previa</div>
          <div style={{ fontSize: '.63rem', color: 'rgba(255,255,255,.45)', marginTop: '.3rem', fontFamily: MF }}>CIF: {form.cif || '—'}</div>
          {form.iban && <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.35)', fontFamily: MF }}>{form.iban}</div>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>

        {/* ── DATOS EMPRESA ── */}
        <Card title="Datos de la empresa">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.85rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <FL>Nombre empresa / Razón social *</FL>
              <FocusInput value={form.nombre} onChange={v => set('nombre', v)} />
            </div>
            <div>
              <FL>CIF / NIF *</FL>
              <FocusInput value={form.cif} onChange={v => set('cif', v)} placeholder="B12345678" />
            </div>
            <div>
              <FL>Teléfono</FL>
              <FocusInput value={form.telefono} onChange={v => set('telefono', v)} placeholder="+34 6XX XXX XXX" />
            </div>
            <div>
              <FL>Email</FL>
              <FocusInput value={form.email} onChange={v => set('email', v)} type="email" placeholder="info@empresa.com" />
            </div>
            <div>
              <FL>Web</FL>
              <FocusInput value={form.web} onChange={v => set('web', v)} placeholder="www.empresa.com" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <FL>Dirección fiscal completa</FL>
              <FocusInput value={form.direccion} onChange={v => set('direccion', v)} placeholder="Calle, nº, CP, Ciudad, Provincia" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <FL>IBAN (para domiciliaciones)</FL>
              <FocusInput value={form.iban} onChange={v => set('iban', v)} placeholder="ES00 0000 0000 0000 0000 0000" />
            </div>
          </div>
        </Card>

        {/* ── NUMERACIÓN ── */}
        <Card title="Numeración de documentos">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.85rem' }}>
            <div>
              <FL>Prefijo facturas</FL>
              <FocusInput value={form.prefijoFactura} onChange={v => set('prefijoFactura', v)} placeholder="F" />
            </div>
            <div>
              <FL>Siguiente nº factura</FL>
              <FocusInput value={form.siguienteFactura} onChange={v => set('siguienteFactura', Number(v))} type="number" />
            </div>
            <div>
              <FL>Prefijo presupuestos</FL>
              <FocusInput value={form.prefijoPresupuesto} onChange={v => set('prefijoPresupuesto', v)} placeholder="P" />
            </div>
            <div>
              <FL>Siguiente nº presupuesto</FL>
              <FocusInput value={form.siguientePresupuesto} onChange={v => set('siguientePresupuesto', Number(v))} type="number" />
            </div>
            <div>
              <FL>Prefijo albaranes</FL>
              <FocusInput value={form.prefijoAlbaran} onChange={v => set('prefijoAlbaran', v)} placeholder="A" />
            </div>
            <div>
              <FL>Siguiente nº albarán</FL>
              <FocusInput value={form.siguienteAlbaran} onChange={v => set('siguienteAlbaran', Number(v))} type="number" />
            </div>

            <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #F1F5F9', paddingTop: '.85rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.85rem' }}>
              <div>
                <FL>IVA por defecto (%)</FL>
                <FocusInput value={form.ivaPorDefecto} onChange={v => set('ivaPorDefecto', Number(v))} type="number" />
              </div>
              <div>
                <FL>Vencimiento facturas (días)</FL>
                <FocusInput value={form.diasVencimiento} onChange={v => set('diasVencimiento', Number(v))} type="number" />
              </div>
            </div>

            {/* Preview de código */}
            <div style={{ gridColumn: '1 / -1', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '.75rem', fontSize: '.7rem', fontFamily: MF }}>
              <div style={{ fontSize: '.58rem', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.4rem' }}>Próximos códigos</div>
              <div style={{ display: 'flex', gap: '1.2rem' }}>
                <span style={{ color: '#1A202C', fontWeight: 700, fontFamily: 'monospace' }}>
                  {form.prefijoFactura}{String(form.siguienteFactura).padStart(4, '0')}
                </span>
                <span style={{ color: '#7C3AED', fontWeight: 700, fontFamily: 'monospace' }}>
                  {form.prefijoPresupuesto}{String(form.siguientePresupuesto).padStart(4, '0')}
                </span>
                <span style={{ color: '#0369A1', fontWeight: 700, fontFamily: 'monospace' }}>
                  {form.prefijoAlbaran}{String(form.siguienteAlbaran).padStart(4, '0')}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* ── TEXTOS ── */}
        <div style={{ gridColumn: '1 / -1' }}>
          <Card title="Textos predeterminados en documentos">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <FL>Pie de factura / presupuesto</FL>
                <textarea
                  value={form.pieFactura}
                  onChange={e => set('pieFactura', e.target.value)}
                  rows={3}
                  style={{ ...inp, resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = '#00B4D8'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                  placeholder="Gracias por confiar en nosotros…"
                />
              </div>
              <div>
                <FL>Condiciones de pago</FL>
                <textarea
                  value={form.condicionesPago}
                  onChange={e => set('condicionesPago', e.target.value)}
                  rows={3}
                  style={{ ...inp, resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = '#00B4D8'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                  placeholder="Pago a 30 días mediante transferencia bancaria…"
                />
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}