import { useEffect, useState } from 'react';
import { getUsuarios, createUsuario, deleteUsuario } from '../api';
import type { Usuario } from '../types';

const ROLES = ['ADMINISTRADOR', 'GESTOR', 'OPERARIO'];
const EMPTY = { email: '', password: '', nombre: '', apellidos: '', iniciales: '', rol: 'OPERARIO', activo: true };

const ROL_COLORS: Record<string, { bg: string; color: string }> = {
  ADMINISTRADOR: { bg: '#EDE9FE', color: '#5B21B6' },
  GESTOR:        { bg: '#DBEAFE', color: '#1D4ED8' },
  OPERARIO:      { bg: '#D1FAE5', color: '#065F46' },
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => getUsuarios().then(r => setUsuarios(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.email || !form.password || !form.nombre) {
      showToast('Email, contraseña y nombre son obligatorios', 'err');
      return;
    }
    setSaving(true);
    try {
      await createUsuario(form);
      showToast('Usuario creado');
      setModal(false);
      load();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al crear el usuario';
      showToast(msg, 'err');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Desactivar este usuario?')) return;
    try { await deleteUsuario(id); showToast('Usuario desactivado'); load(); }
    catch { showToast('Error al desactivar', 'err'); }
  };

  const inputStyle = {
    width: '100%', padding: '.55rem .8rem', border: '1px solid #E2E8F0',
    borderRadius: 7, fontSize: '.76rem', color: '#2D3748',
    fontFamily: "'Montserrat', sans-serif", outline: 'none', background: '#fff',
  };

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          background: toast.type === 'ok' ? '#D1FAE5' : '#FEE2E2',
          border: `1px solid ${toast.type === 'ok' ? 'rgba(16,185,129,.3)' : 'rgba(239,68,68,.3)'}`,
          color: toast.type === 'ok' ? '#065F46' : '#991B1B',
          padding: '.7rem 1.2rem', borderRadius: 10, fontSize: '.75rem', fontWeight: 700,
          fontFamily: "'Montserrat', sans-serif",
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '.8rem' }}>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 900, color: '#1A202C', fontFamily: "'Montserrat', sans-serif" }}>Usuarios</h1>
          <p style={{ fontSize: '.68rem', color: '#718096', marginTop: '.2rem', fontFamily: "'Montserrat', sans-serif" }}>{usuarios.length} usuarios registrados</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY); setModal(true); }}
          style={{ padding: '.48rem .95rem', borderRadius: 7, border: 'none', background: '#00B4D8', cursor: 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#0D1B2A', fontFamily: "'Montserrat', sans-serif" }}
        >
          ＋ Nuevo usuario
        </button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.75rem', fontFamily: "'Montserrat', sans-serif" }}>
          <thead>
            <tr style={{ background: '#0D1B2A' }}>
              {['Iniciales', 'Nombre', 'Email', 'Rol', 'Estado', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '.6rem 1rem', textAlign: 'left', color: '#fff', fontWeight: 700, fontSize: '.62rem', letterSpacing: '.06em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#A0AEC0' }}>Cargando...</td></tr>
            ) : usuarios.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #F7FAFC' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8FAFC'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
              >
                <td style={{ padding: '.65rem 1rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0090B0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', fontWeight: 900, color: '#fff' }}>
                    {u.iniciales}
                  </div>
                </td>
                <td style={{ padding: '.65rem 1rem', fontWeight: 700, color: '#1A202C' }}>{u.nombre} {u.apellidos}</td>
                <td style={{ padding: '.65rem 1rem', color: '#718096', fontFamily: 'monospace', fontSize: '.7rem' }}>{u.email}</td>
                <td style={{ padding: '.65rem 1rem' }}>
                  <span style={{
                    padding: '.18rem .55rem', borderRadius: 20, fontSize: '.6rem', fontWeight: 700,
                    background: ROL_COLORS[u.rol]?.bg ?? '#F1F5F9',
                    color: ROL_COLORS[u.rol]?.color ?? '#64748B',
                  }}>
                    {u.rol}
                  </span>
                </td>
                <td style={{ padding: '.65rem 1rem' }}>
                  <span style={{ padding: '.18rem .55rem', borderRadius: 20, fontSize: '.6rem', fontWeight: 700, background: u.activo ? '#D1FAE5' : '#F1F5F9', color: u.activo ? '#065F46' : '#94A3B8' }}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={{ padding: '.65rem 1rem' }}>
                  <button
                    onClick={() => handleDelete(u.id)}
                    style={{ padding: '.3rem .6rem', borderRadius: 6, border: '1px solid rgba(239,68,68,.2)', background: '#FEE2E2', cursor: 'pointer', fontSize: '.65rem', fontWeight: 700, color: '#991B1B', fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Desactivar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 500, fontFamily: "'Montserrat', sans-serif" }}>
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '.85rem', color: '#1A202C' }}>Nuevo usuario</span>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#718096' }}>✕</button>
            </div>
            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                { key: 'email',     label: 'Email *',       type: 'email',    full: true },
                { key: 'password',  label: 'Contraseña *',  type: 'password', full: false },
                { key: 'nombre',    label: 'Nombre *',      type: 'text',     full: false },
                { key: 'apellidos', label: 'Apellidos',     type: 'text',     full: false },
                { key: 'iniciales', label: 'Iniciales',     type: 'text',     full: false },
              ].map(({ key, label, type, full }) => (
                <div key={key} style={{ gridColumn: full ? '1 / -1' : 'auto' }}>
                  <label style={{ display: 'block', fontSize: '.62rem', fontWeight: 700, color: '#718096', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</label>
                  <input
                    type={type}
                    value={form[key] || ''}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#00B4D8'}
                    onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                  />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: '.62rem', fontWeight: 700, color: '#718096', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Rol</label>
                <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })} style={inputStyle}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '.6rem' }}>
              <button onClick={() => setModal(false)} style={{ padding: '.48rem .95rem', borderRadius: 7, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#2D3748', fontFamily: "'Montserrat', sans-serif" }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '.48rem .95rem', borderRadius: 7, border: 'none', background: '#00B4D8', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#0D1B2A', fontFamily: "'Montserrat', sans-serif" }}>
                {saving ? 'Guardando...' : 'Crear usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
