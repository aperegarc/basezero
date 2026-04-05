import { useEffect, useState } from 'react';
import { getClientes, createCliente, updateCliente, deleteCliente } from '../api';
import type { Cliente } from '../types';

const EMPTY: Partial<Cliente> = { nombre: '', cifNif: '', tipo: 'RESTAURANTE', personaContacto: '', cargo: '', telefono: '', email: '', direccion: '' };
const TIPOS = ['HOTEL', 'RESTAURANTE', 'OFICINA', 'PARTICULAR', 'NAUTICA'];

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Partial<Cliente>>(EMPTY);
  const [editing, setEditing] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => getClientes().then(r => setClientes(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setEditing(null); setModal(true); };
  const openEdit = (c: Cliente) => { setForm(c); setEditing(c.id); setModal(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) { await updateCliente(editing, form); showToast('Cliente actualizado'); }
      else { await createCliente(form); showToast('Cliente creado'); }
      setModal(false);
      load();
    } catch { showToast('Error al guardar', 'err'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este cliente?')) return;
    try { await deleteCliente(id); showToast('Cliente eliminado'); load(); }
    catch { showToast('Error al eliminar', 'err'); }
  };

  const filtered = clientes.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.cifNif.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          background: toast.type === 'ok' ? '#D1FAE5' : '#FEE2E2',
          border: `1px solid ${toast.type === 'ok' ? 'rgba(16,185,129,.3)' : 'rgba(239,68,68,.3)'}`,
          color: toast.type === 'ok' ? '#065F46' : '#991B1B',
          padding: '.7rem 1.2rem', borderRadius: 10, fontSize: '.75rem', fontWeight: 700,
          fontFamily: "'Montserrat', sans-serif", boxShadow: '0 4px 20px rgba(0,0,0,.1)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '.8rem' }}>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 900, color: '#1A202C', fontFamily: "'Montserrat', sans-serif" }}>Clientes</h1>
          <p style={{ fontSize: '.68rem', color: '#718096', marginTop: '.2rem', fontFamily: "'Montserrat', sans-serif" }}>{clientes.length} clientes registrados</p>
        </div>
        <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '.4rem .8rem' }}>
            <span style={{ fontSize: '.8rem', color: '#A0AEC0' }}></span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              style={{ border: 'none', background: 'none', fontSize: '.76rem', color: '#2D3748', outline: 'none', width: 160, fontFamily: "'Montserrat', sans-serif" }}
            />
          </div>
          <button onClick={openNew} style={{
            display: 'inline-flex', alignItems: 'center', gap: '.38rem',
            padding: '.48rem .95rem', borderRadius: 7, fontSize: '.73rem', fontWeight: 700,
            cursor: 'pointer', border: 'none', background: '#00B4D8', color: '#0D1B2A',
            fontFamily: "'Montserrat', sans-serif",
          }}>
            ＋ Nuevo cliente
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.75rem', fontFamily: "'Montserrat', sans-serif" }}>
            <thead>
              <tr style={{ background: '#0D1B2A' }}>
                {['Nombre', 'CIF/NIF', 'Tipo', 'Contacto', 'Teléfono', 'Email', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '.6rem 1rem', textAlign: 'left', color: '#fff', fontWeight: 700, fontSize: '.62rem', letterSpacing: '.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#A0AEC0' }}>Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#A0AEC0' }}>No hay clientes{search ? ' con ese filtro' : ''}</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #F7FAFC', cursor: 'default' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8FAFC'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                >
                  <td style={{ padding: '.65rem 1rem', fontWeight: 700, color: '#1A202C' }}>{c.nombre}</td>
                  <td style={{ padding: '.65rem 1rem', color: '#718096', fontFamily: 'monospace' }}>{c.cifNif}</td>
                  <td style={{ padding: '.65rem 1rem' }}>
                    <span style={{ padding: '.18rem .55rem', borderRadius: 20, fontSize: '.6rem', fontWeight: 700, background: '#DBEAFE', color: '#1D4ED8' }}>{c.tipo}</span>
                  </td>
                  <td style={{ padding: '.65rem 1rem', color: '#2D3748' }}>{c.personaContacto}</td>
                  <td style={{ padding: '.65rem 1rem', color: '#718096' }}>{c.telefono}</td>
                  <td style={{ padding: '.65rem 1rem', color: '#718096' }}>{c.email}</td>
                  <td style={{ padding: '.65rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '.3rem' }}>
                      <button onClick={() => openEdit(c)} style={{ padding: '.3rem .6rem', borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: '.65rem', fontWeight: 700, color: '#2D3748', fontFamily: "'Montserrat', sans-serif" }}>Editar</button>
                      <button onClick={() => handleDelete(c.id)} style={{ padding: '.3rem .6rem', borderRadius: 6, border: '1px solid rgba(239,68,68,.2)', background: '#FEE2E2', cursor: 'pointer', fontSize: '.65rem', fontWeight: 700, color: '#991B1B', fontFamily: "'Montserrat', sans-serif" }}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', fontFamily: "'Montserrat', sans-serif" }}>
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '.85rem', color: '#1A202C' }}>{editing ? 'Editar cliente' : 'Nuevo cliente'}</span>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#718096' }}>X</button>
            </div>
            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                { key: 'nombre', label: 'Nombre *', full: true },
                { key: 'cifNif', label: 'CIF / NIF *' },
                { key: 'personaContacto', label: 'Persona de contacto' },
                { key: 'cargo', label: 'Cargo' },
                { key: 'telefono', label: 'Teléfono' },
                { key: 'email', label: 'Email' },
                { key: 'direccion', label: 'Dirección', full: true },
              ].map(({ key, label, full }) => (
                <div key={key} style={{ gridColumn: full ? '1 / -1' : 'auto' }}>
                  <label style={{ display: 'block', fontSize: '.62rem', fontWeight: 700, color: '#718096', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</label>
                  <input
                    value={(form as any)[key] || ''}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    style={{ width: '100%', padding: '.55rem .8rem', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: '.76rem', color: '#2D3748', fontFamily: "'Montserrat', sans-serif", outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = '#00B4D8'}
                    onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                  />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: '.62rem', fontWeight: 700, color: '#718096', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Tipo</label>
                <select
                  value={form.tipo || 'RESTAURANTE'}
                  onChange={e => setForm({ ...form, tipo: e.target.value })}
                  style={{ width: '100%', padding: '.55rem .8rem', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: '.76rem', color: '#2D3748', fontFamily: "'Montserrat', sans-serif", outline: 'none', background: '#fff' }}
                >
                  {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '.6rem' }}>
              <button onClick={() => setModal(false)} style={{ padding: '.48rem .95rem', borderRadius: 7, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#2D3748', fontFamily: "'Montserrat', sans-serif" }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '.48rem .95rem', borderRadius: 7, border: 'none', background: '#00B4D8', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#0D1B2A', fontFamily: "'Montserrat', sans-serif" }}>
                {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
