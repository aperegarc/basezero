import { useEffect, useState } from 'react';
import { getContratos, createContrato, updateContrato, deleteContrato, generarVentaContrato, getClientes } from '../api';
import type { Cliente } from '../types';

const METODOS = ['TRANSFERENCIA', 'EFECTIVO', 'TARJETA', 'CHEQUE'];

interface Contrato {
  id: number;
  clienteId: number;
  clienteNombre: string;
  nombre: string;
  descripcion?: string;
  importe: number;
  iva: number;
  totalConIva: number;
  metodoPago: string;
  diaGeneracion: number;
  activo: boolean;
  ultimaGeneracion?: string;
  pendienteGeneracion: boolean;
}

const EMPTY = {
  clienteId: 0, nombre: '', descripcion: '', importe: 0,
  iva: 21, metodoPago: 'TRANSFERENCIA', diaGeneracion: 1, activo: true,
};

export default function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' | 'warn' } | null>(null);

  const showToast = (msg: string, type: 'ok' | 'err' | 'warn' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    const [c, cl] = await Promise.all([getContratos(), getClientes()]);
    setContratos(c.data);
    setClientes(cl.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const fmt = (n: number) => (n || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const openNew = () => {
    setForm({ ...EMPTY, clienteId: clientes[0]?.id || 0 });
    setEditing(null);
    setModal(true);
  };

  const openEdit = (c: Contrato) => {
    setForm({
      clienteId: c.clienteId, nombre: c.nombre, descripcion: c.descripcion || '',
      importe: c.importe, iva: c.iva, metodoPago: c.metodoPago,
      diaGeneracion: c.diaGeneracion, activo: c.activo,
    });
    setEditing(c.id);
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.clienteId) { showToast('Selecciona un cliente', 'err'); return; }
    if (!form.nombre) { showToast('Introduce un nombre', 'err'); return; }
    if (!form.importe || form.importe <= 0) { showToast('El importe debe ser mayor que 0', 'err'); return; }
    if (!form.diaGeneracion || form.diaGeneracion < 1 || form.diaGeneracion > 28) {
      showToast('El día de generación debe estar entre 1 y 28', 'err'); return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateContrato(editing, form);
        showToast('Contrato actualizado');
      } else {
        await createContrato(form);
        showToast('Contrato creado');
      }
      setModal(false);
      await load();
    } catch { showToast('Error al guardar', 'err'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este contrato recurrente?')) return;
    try { await deleteContrato(id); showToast('Contrato eliminado'); await load(); }
    catch { showToast('Error al eliminar', 'err'); }
  };

  const handleGenerar = async (id: number, nombre: string) => {
    if (!confirm(`¿Generar venta para "${nombre}"?`)) return;
    try {
      const res = await generarVentaContrato(id);
      showToast(`Venta ${res.data.codigo} generada correctamente`, 'ok');
      await load();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Error al generar la venta', 'err');
    }
  };

  const pendientes = contratos.filter(c => c.pendienteGeneracion && c.activo).length;
  const totalMensual = contratos.filter(c => c.activo).reduce((s, c) => s + Number(c.totalConIva), 0);

  const filtered = contratos.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.clienteNombre.toLowerCase().includes(search.toLowerCase())
  );

  const inputStyle = {
    width: '100%', padding: '.55rem .8rem', border: '1px solid #E2E8F0',
    borderRadius: 7, fontSize: '.76rem', color: '#2D3748',
    fontFamily: "'Montserrat', sans-serif", outline: 'none', background: '#fff',
  };

  const toastColors = {
    ok: { bg: '#D1FAE5', border: 'rgba(16,185,129,.3)', color: '#065F46' },
    err: { bg: '#FEE2E2', border: 'rgba(239,68,68,.3)', color: '#991B1B' },
    warn: { bg: '#FEF3C7', border: 'rgba(245,158,11,.3)', color: '#92400E' },
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          background: toastColors[toast.type].bg,
          border: `1px solid ${toastColors[toast.type].border}`,
          color: toastColors[toast.type].color,
          padding: '.7rem 1.2rem', borderRadius: 10,
          fontSize: '.75rem', fontWeight: 700,
          fontFamily: "'Montserrat', sans-serif",
          boxShadow: '0 4px 20px rgba(0,0,0,.1)',
          maxWidth: 360,
        }}>
          {toast.msg}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.2rem' }}>
        {[
          { label: 'Contratos activos', value: contratos.filter(c => c.activo).length, color: '#00B4D8', icon: '' },
          { label: 'Facturación mensual', value: `${fmt(totalMensual)} €`, color: '#10B981', icon: '' },
          { label: 'Pendientes de generar', value: pendientes, color: pendientes > 0 ? '#F59E0B' : '#10B981', icon: '' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '1rem 1.2rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.color, borderRadius: '12px 12px 0 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '.6rem', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '.3rem', fontFamily: "'Montserrat', sans-serif" }}>{s.label}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1A202C', fontFamily: "'Montserrat', sans-serif" }}>{s.value}</div>
              </div>
              <span style={{ fontSize: '1.3rem', opacity: .6 }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '.8rem' }}>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 900, color: '#1A202C', fontFamily: "'Montserrat', sans-serif" }}>Contratos recurrentes</h1>
          <p style={{ fontSize: '.68rem', color: '#718096', marginTop: '.2rem', fontFamily: "'Montserrat', sans-serif" }}>
            Ventas que se generan automáticamente cada mes
          </p>
        </div>
        <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '.4rem .8rem' }}>
            <span style={{ fontSize: '.8rem', color: '#A0AEC0' }}></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar contrato..."
              style={{ border: 'none', background: 'none', fontSize: '.76rem', color: '#2D3748', outline: 'none', width: 160, fontFamily: "'Montserrat', sans-serif" }} />
          </div>
          <button onClick={openNew} style={{ padding: '.48rem .95rem', borderRadius: 7, border: 'none', background: '#00B4D8', cursor: 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#0D1B2A', fontFamily: "'Montserrat', sans-serif" }}>
            ＋ Nuevo contrato
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.75rem', fontFamily: "'Montserrat', sans-serif" }}>
            <thead>
              <tr style={{ background: '#0D1B2A' }}>
                {['Cliente', 'Contrato', 'Importe', 'IVA', 'Total/mes', 'Día gen.', 'Últ. gen.', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '.6rem 1rem', textAlign: 'left', color: '#fff', fontWeight: 700, fontSize: '.62rem', letterSpacing: '.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: '#A0AEC0' }}>Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: '#A0AEC0' }}>No hay contratos{search ? ' con ese filtro' : ''}</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #F7FAFC' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8FAFC'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                >
                  <td style={{ padding: '.65rem 1rem', color: '#2D3748', fontWeight: 600 }}>{c.clienteNombre}</td>
                  <td style={{ padding: '.65rem 1rem' }}>
                    <div style={{ fontWeight: 700, color: '#1A202C' }}>{c.nombre}</div>
                    {c.descripcion && <div style={{ fontSize: '.6rem', color: '#A0AEC0', marginTop: '.15rem' }}>{c.descripcion}</div>}
                  </td>
                  <td style={{ padding: '.65rem 1rem', color: '#718096' }}>{fmt(c.importe)} €</td>
                  <td style={{ padding: '.65rem 1rem', color: '#718096' }}>{c.iva}%</td>
                  <td style={{ padding: '.65rem 1rem', fontWeight: 700, color: '#1A202C' }}>{fmt(c.totalConIva)} €</td>
                  <td style={{ padding: '.65rem 1rem', textAlign: 'center' }}>
                    <span style={{ padding: '.2rem .6rem', borderRadius: 20, fontSize: '.65rem', fontWeight: 700, background: '#DBEAFE', color: '#1D4ED8' }}>día {c.diaGeneracion}</span>
                  </td>
                  <td style={{ padding: '.65rem 1rem', color: '#718096', fontSize: '.7rem' }}>{c.ultimaGeneracion || '—'}</td>
                  <td style={{ padding: '.65rem 1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.2rem' }}>
                      <span style={{ padding: '.18rem .55rem', borderRadius: 20, fontSize: '.6rem', fontWeight: 700, background: c.activo ? '#D1FAE5' : '#F1F5F9', color: c.activo ? '#065F46' : '#94A3B8', whiteSpace: 'nowrap' }}>
                        {c.activo ? 'Activo' : 'Inactivo'}
                      </span>
                      {c.pendienteGeneracion && c.activo && (
                        <span style={{ padding: '.18rem .55rem', borderRadius: 20, fontSize: '.6rem', fontWeight: 700, background: '#FEF3C7', color: '#92400E', whiteSpace: 'nowrap' }}>
                          Pendiente
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '.65rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
                      {c.pendienteGeneracion && c.activo && (
                        <button onClick={() => handleGenerar(c.id, c.nombre)}
                          style={{ padding: '.3rem .6rem', borderRadius: 6, border: '1px solid rgba(16,185,129,.25)', background: '#D1FAE5', cursor: 'pointer', fontSize: '.6rem', fontWeight: 700, color: '#065F46', fontFamily: "'Montserrat', sans-serif", whiteSpace: 'nowrap' }}>
                          ⚡ Generar
                        </button>
                      )}
                      <button onClick={() => openEdit(c)}
                        style={{ padding: '.3rem .6rem', borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: '.6rem', fontWeight: 700, color: '#2D3748', fontFamily: "'Montserrat', sans-serif" }}>
                        Editar
                      </button>
                      <button onClick={() => handleDelete(c.id)}
                        style={{ padding: '.3rem .6rem', borderRadius: 6, border: '1px solid rgba(239,68,68,.2)', background: '#FEE2E2', cursor: 'pointer', fontSize: '.6rem', fontWeight: 700, color: '#991B1B', fontFamily: "'Montserrat', sans-serif" }}>
                        Eliminar
                      </button>
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
              <span style={{ fontWeight: 800, fontSize: '.85rem', color: '#1A202C' }}>
                {editing ? 'Editar contrato' : 'Nuevo contrato recurrente'}
              </span>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#718096' }}>✕</button>
            </div>

            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Cliente */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '.62rem', fontWeight: 700, color: '#718096', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Cliente *</label>
                <select value={form.clienteId} onChange={e => setForm({ ...form, clienteId: +e.target.value })} style={inputStyle}>
                  <option value={0}>— Seleccionar cliente —</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>

              {/* Nombre */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '.62rem', fontWeight: 700, color: '#718096', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Nombre del servicio *</label>
                <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Mantenimiento mensual" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>

              {/* Descripcion */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '.62rem', fontWeight: 700, color: '#718096', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Descripción</label>
                <input value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>

              {/* Importe */}
              <div>
                <label style={{ display: 'block', fontSize: '.62rem', fontWeight: 700, color: '#718096', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Importe base (€) *</label>
                <input type="number" step="0.01" value={form.importe || ''} onChange={e => setForm({ ...form, importe: +e.target.value })} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>

              {/* IVA */}
              <div>
                <label style={{ display: 'block', fontSize: '.62rem', fontWeight: 700, color: '#718096', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>IVA (%)</label>
                <input type="number" value={form.iva || 21} onChange={e => setForm({ ...form, iva: +e.target.value })} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>

              {/* Preview total */}
              {form.importe > 0 && (
                <div style={{ gridColumn: '1 / -1', background: 'rgba(0,180,216,.06)', border: '1px solid rgba(0,180,216,.2)', borderRadius: 8, padding: '.7rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '.72rem', color: '#0090B0', fontWeight: 600 }}>Total mensual con IVA</span>
                  <span style={{ fontSize: '1rem', fontWeight: 900, color: '#0D1B2A' }}>
                    {fmt(form.importe * (1 + (form.iva || 0) / 100))} €
                  </span>
                </div>
              )}

              {/* Método pago */}
              <div>
                <label style={{ display: 'block', fontSize: '.62rem', fontWeight: 700, color: '#718096', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Método de pago</label>
                <select value={form.metodoPago} onChange={e => setForm({ ...form, metodoPago: e.target.value })} style={inputStyle}>
                  {METODOS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* Día generación */}
              <div>
                <label style={{ display: 'block', fontSize: '.62rem', fontWeight: 700, color: '#718096', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Día de generación (1-28) *</label>
                <input type="number" min={1} max={28} value={form.diaGeneracion || 1} onChange={e => setForm({ ...form, diaGeneracion: +e.target.value })} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                <div style={{ fontSize: '.6rem', color: '#A0AEC0', marginTop: '.25rem' }}>La venta se marcará como pendiente a partir de este día cada mes</div>
              </div>

              {/* Activo */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <input type="checkbox" id="activo" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })}
                  style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#00B4D8' }} />
                <label htmlFor="activo" style={{ fontSize: '.76rem', fontWeight: 600, color: '#2D3748', cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}>
                  Contrato activo
                </label>
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '.6rem' }}>
              <button onClick={() => setModal(false)} style={{ padding: '.48rem .95rem', borderRadius: 7, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#2D3748', fontFamily: "'Montserrat', sans-serif" }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '.48rem .95rem', borderRadius: 7, border: 'none', background: '#00B4D8', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#0D1B2A', fontFamily: "'Montserrat', sans-serif", opacity: saving ? .7 : 1 }}>
                {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear contrato'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}