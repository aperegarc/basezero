import { useState } from 'react';
import { useEmpresaStore } from '../store/empresaStore';

export default function ConfigPage() {
  const { config, setConfig } = useEmpresaStore();
  const [form, setForm] = useState({ ...config });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setConfig(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inputStyle = {
    width: '100%', padding: '.6rem .9rem',
    border: '1px solid #E2E8F0', borderRadius: 8,
    fontSize: '.78rem', color: '#2D3748',
    fontFamily: "'Montserrat', sans-serif", outline: 'none',
    transition: 'border-color .2s',
  };

  const fields = [
    { key: 'nombre', label: 'Nombre de empresa / Razón social *', full: true },
    { key: 'cif', label: 'CIF / NIF *' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'email', label: 'Email' },
    { key: 'web', label: 'Sitio web' },
    { key: 'direccion', label: 'Dirección completa', full: true },
  ];

  return (
    <div style={{ maxWidth: 680 }}>
      {saved && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          background: '#D1FAE5', border: '1px solid rgba(16,185,129,.3)',
          color: '#065F46', padding: '.7rem 1.2rem', borderRadius: 10,
          fontSize: '.75rem', fontWeight: 700, fontFamily: "'Montserrat', sans-serif",
        }}>
          Configuración guardada
        </div>
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1rem', fontWeight: 900, color: '#1A202C', fontFamily: "'Montserrat', sans-serif" }}>
          Configuración de empresa
        </h1>
        <p style={{ fontSize: '.68rem', color: '#718096', marginTop: '.2rem', fontFamily: "'Montserrat', sans-serif" }}>
          Estos datos aparecerán en las facturas, presupuestos y albaranes generados
        </p>
      </div>

      {/* Preview */}
      <div style={{
        background: '#0D1B2A', borderRadius: 12, padding: '1.2rem 1.5rem',
        marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff', letterSpacing: '-.04em' }}>
            BASE<span style={{ color: '#00B4D8' }}>ZERO</span>
          </div>
          <div style={{ fontSize: '.65rem', color: '#00B4D8', marginTop: '.2rem', fontWeight: 700 }}>
            {form.nombre}
          </div>
          <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.45)', marginTop: '.2rem' }}>
            {form.direccion}
          </div>
          <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.45)' }}>
            {form.telefono} · {form.email}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '.55rem', color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
            Vista previa cabecera
          </div>
          <div style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.5)', marginTop: '.3rem' }}>
            CIF: {form.cif}
          </div>
        </div>
      </div>

      {/* Form */}
      <div style={{
        background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12,
        padding: '1.5rem',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {fields.map(({ key, label, full }) => (
            <div key={key} style={{ gridColumn: full ? '1 / -1' : 'auto' }}>
              <label style={{
                display: 'block', fontSize: '.62rem', fontWeight: 700,
                color: '#718096', marginBottom: '.35rem',
                textTransform: 'uppercase', letterSpacing: '.06em',
                fontFamily: "'Montserrat', sans-serif",
              }}>
                {label}
              </label>
              <input
                value={(form as any)[key] || ''}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#00B4D8'}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
              />
            </div>
          ))}
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSave}
            style={{
              padding: '.55rem 1.4rem', borderRadius: 8, border: 'none',
              background: '#00B4D8', color: '#0D1B2A',
              fontSize: '.76rem', fontWeight: 800, cursor: 'pointer',
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            Guardar configuración
          </button>
        </div>
      </div>
    </div>
  );
}