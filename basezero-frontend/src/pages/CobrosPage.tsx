import { useEffect, useState } from 'react';
import { getCobros, createCobro, deleteCobro, getVentas } from '../api';
import type { Cobro, Venta } from '../types';
import { generarPDF } from '../utils/pdfGenerator';
import { useEmpresaStore } from '../store/empresaStore';

const METODOS = ['TRANSFERENCIA', 'EFECTIVO', 'TARJETA', 'CHEQUE'];

export default function CobrosPage() {
  const [cobros, setCobros] = useState<Cobro[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [form, setForm] = useState({ cantidad: 0, fecha: new Date().toISOString().slice(0, 10), metodoPago: 'TRANSFERENCIA', ventaId: 0 });

  const { config: empresa } = useEmpresaStore();

  const generarInforme = () => {
    generarPDF(empresa, {
      tipo: 'INFORME_COBROS',
      numero: new Date().toISOString().slice(0, 10),
      fecha: new Date().toLocaleDateString('es-ES'),
      cobros: cobros.map(c => ({
        id: c.id,
        fecha: c.fecha as string,
        cantidad: Number(c.cantidad),
        metodoPago: c.metodoPago,
        ventaCodigo: `Venta #${c.ventaId}`,
      })),
    });
  };

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = () => Promise.all([getCobros(), getVentas()])
    .then(([c, v]) => {
      const ventasCorregidas = v.data.map((venta: any) => {
        // Si el total es 0 pero tiene líneas, recalcular el total
        if ((venta.total === 0 || !venta.total) && venta.lineas && venta.lineas.length > 0) {
          const calcTotal = venta.lineas.reduce((sum: number, l: any) => sum + (Number(l.total) || 0), 0);
          return { ...venta, total: calcTotal };
        }
        return venta;
      });
      setCobros(c.data);
      setVentas(ventasCorregidas);
    })
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const fmt = (n: number) => (n || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const total = cobros.reduce((s, c) => s + c.cantidad, 0);

  const openNew = () => {
    setForm({ cantidad: 0, fecha: new Date().toISOString().slice(0, 10), metodoPago: 'TRANSFERENCIA', ventaId: ventas[0]?.id || 0 });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.ventaId) { showToast('Selecciona una venta', 'err'); return; }
    if (!form.cantidad || form.cantidad <= 0) { showToast('Introduce un importe válido', 'err'); return; }
    
    const venta = ventas.find(v => v.id === form.ventaId);
    const cobrosPrevios = cobros.filter(c => c.ventaId === form.ventaId).reduce((s, c) => s + c.cantidad, 0);
    const maximo = (venta?.total || 0) - cobrosPrevios;
    
    if (form.cantidad > maximo) { 
      showToast(`El importe máximo a cobrar es ${fmt(maximo)} €`, 'err'); 
      return; 
    }
    
    setSaving(true);
    try { await createCobro(form); showToast('Cobro registrado'); setModal(false); load(); }
    catch { showToast('Error al registrar el cobro', 'err'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este cobro?')) return;
    try { await deleteCobro(id); showToast('Cobro eliminado'); load(); }
    catch { showToast('Error al eliminar', 'err'); }
  };

  const filtered = cobros.filter(c =>
    c.ventaCodigo?.toLowerCase().includes(search.toLowerCase()) ||
    c.metodoPago?.toLowerCase().includes(search.toLowerCase())
  );

  const inputStyle = { width: '100%', padding: '.55rem .8rem', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: '.76rem', color: '#2D3748', fontFamily: "'Montserrat', sans-serif", outline: 'none', background: '#fff' };

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999, background: toast.type === 'ok' ? '#D1FAE5' : '#FEE2E2', border: `1px solid ${toast.type === 'ok' ? 'rgba(16,185,129,.3)' : 'rgba(239,68,68,.3)'}`, color: toast.type === 'ok' ? '#065F46' : '#991B1B', padding: '.7rem 1.2rem', borderRadius: 10, fontSize: '.75rem', fontWeight: 700, fontFamily: "'Montserrat', sans-serif" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '.8rem' }}>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 900, color: '#1A202C', fontFamily: "'Montserrat', sans-serif" }}>Cobros</h1>
          <p style={{ fontSize: '.68rem', color: '#718096', marginTop: '.2rem', fontFamily: "'Montserrat', sans-serif" }}>Total cobrado: <strong style={{ color: '#10B981' }}>{fmt(total)} €</strong></p>
        </div>
        <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '.4rem .8rem' }}>
            <span style={{ fontSize: '.8rem', color: '#A0AEC0' }}></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cobro..." style={{ border: 'none', background: 'none', fontSize: '.76rem', color: '#2D3748', outline: 'none', width: 150, fontFamily: "'Montserrat', sans-serif" }} />
          </div>
          <button onClick={generarInforme} style={{ padding: '.48rem .95rem', borderRadius: 7, border: '1px solid rgba(139,92,246,.25)', background: 'rgba(139,92,246,.08)', cursor: 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#6D28D9', fontFamily: "'Montserrat', sans-serif" }}>
            Informe PDF
          </button>
          <button onClick={openNew} style={{ padding: '.48rem .95rem', borderRadius: 7, border: 'none', background: '#00B4D8', cursor: 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#0D1B2A', fontFamily: "'Montserrat', sans-serif" }}>
            ＋ Registrar cobro
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.75rem', fontFamily: "'Montserrat', sans-serif" }}>
            <thead>
              <tr style={{ background: '#0D1B2A' }}>
                {['ID', 'Venta', 'Importe', 'Fecha', 'Método de pago', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '.6rem 1rem', textAlign: 'left', color: '#fff', fontWeight: 700, fontSize: '.62rem', letterSpacing: '.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#A0AEC0' }}>Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#A0AEC0' }}>No hay cobros registrados</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #F7FAFC' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8FAFC'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                >
                  <td style={{ padding: '.65rem 1rem', color: '#A0AEC0', fontFamily: 'monospace', fontSize: '.65rem' }}>#{c.id}</td>
                  <td style={{ padding: '.65rem 1rem', fontWeight: 700, color: '#1A202C' }}>{c.ventaCodigo || `Venta #${c.ventaId}`}</td>
                  <td style={{ padding: '.65rem 1rem', fontWeight: 900, color: '#10B981', fontSize: '.82rem' }}>{fmt(c.cantidad)} €</td>
                  <td style={{ padding: '.65rem 1rem', color: '#718096' }}>{c.fecha}</td>
                  <td style={{ padding: '.65rem 1rem' }}>
                    <span style={{ padding: '.18rem .55rem', borderRadius: 20, fontSize: '.6rem', fontWeight: 700, background: '#DBEAFE', color: '#1D4ED8' }}>{c.metodoPago}</span>
                  </td>
                  <td style={{ padding: '.65rem 1rem' }}>
                    <button onClick={() => handleDelete(c.id)} style={{ padding: '.3rem .6rem', borderRadius: 6, border: '1px solid rgba(239,68,68,.2)', background: '#FEE2E2', cursor: 'pointer', fontSize: '.65rem', fontWeight: 700, color: '#991B1B', fontFamily: "'Montserrat', sans-serif" }}>Eliminar</button>
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
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480, fontFamily: "'Montserrat', sans-serif" }}>
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '.85rem', color: '#1A202C' }}>Registrar cobro</span>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#718096' }}>X</button>
            </div>
            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '.62rem', fontWeight: 700, color: '#718096', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Venta *</label>
                <select value={form.ventaId} onChange={e => setForm({ ...form, ventaId: +e.target.value })} style={inputStyle}>
                  <option value={0}>— Seleccionar venta —</option>
                  {ventas.filter(v => v.estado === 'PENDIENTE').map(v => (
                    <option key={v.id} value={v.id}>{v.codigo} — {v.clienteNombre}</option>
                  ))}
                </select>
              </div>
              {form.ventaId > 0 && (() => {
                const venta = ventas.find(v => v.id === form.ventaId);
                const cobrosPrevios = cobros.filter(c => c.ventaId === form.ventaId).reduce((s, c) => s + c.cantidad, 0);
                const maximo = (venta?.total || 0) - cobrosPrevios;
                return (
                  <div style={{ gridColumn: '1 / -1', background: '#F0F9FF', border: '1px solid rgba(59,130,246,.2)', borderRadius: 8, padding: '.8rem', fontSize: '.7rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem', marginBottom: '.4rem' }}>
                      <div>
                        <div style={{ color: '#718096', fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.2rem' }}>Total factura</div>
                        <div style={{ color: '#1D4ED8', fontWeight: 900, fontSize: '.9rem' }}>{fmt(venta?.total || 0)} €</div>
                      </div>
                      <div>
                        <div style={{ color: '#718096', fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.2rem' }}>Ya cobrado</div>
                        <div style={{ color: '#10B981', fontWeight: 900, fontSize: '.9rem' }}>{fmt(cobrosPrevios)} €</div>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid rgba(59,130,246,.2)', paddingTop: '.6rem' }}>
                      <div style={{ color: '#718096', fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.3rem' }}>Máximo a cobrar</div>
                      <div style={{ color: maximo > 0 ? '#059669' : '#EF4444', fontWeight: 900, fontSize: '1.1rem' }}>
                        {fmt(maximo)} €
                      </div>
                      {maximo <= 0 && <div style={{ fontSize: '.65rem', color: '#EF4444', marginTop: '.2rem', fontWeight: 700 }}>Esta factura ya está completamente cobrada</div>}
                    </div>
                  </div>
                );
              })()}
              <div>
                <label style={{ display: 'block', fontSize: '.62rem', fontWeight: 700, color: '#718096', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Importe * {form.ventaId > 0 && <span style={{ fontSize: '.55rem', color: '#10B981', fontWeight: 600 }}>(máx: {fmt((() => {
                  const venta = ventas.find(v => v.id === form.ventaId);
                  const cobrosPrevios = cobros.filter(c => c.ventaId === form.ventaId).reduce((s, c) => s + c.cantidad, 0);
                  return (venta?.total || 0) - cobrosPrevios;
                })())} €)</span>}</label>
                <input type="number" step="0.01" value={form.cantidad || ''} onChange={e => setForm({ ...form, cantidad: +e.target.value })} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.62rem', fontWeight: 700, color: '#718096', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Fecha</label>
                <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '.62rem', fontWeight: 700, color: '#718096', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Método de pago</label>
                <select value={form.metodoPago} onChange={e => setForm({ ...form, metodoPago: e.target.value })} style={inputStyle}>
                  {METODOS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '.6rem' }}>
              <button onClick={() => setModal(false)} style={{ padding: '.48rem .95rem', borderRadius: 7, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#2D3748', fontFamily: "'Montserrat', sans-serif" }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '.48rem .95rem', borderRadius: 7, border: 'none', background: '#10B981', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#fff', fontFamily: "'Montserrat', sans-serif" }}>
                {saving ? 'Guardando...' : 'Registrar cobro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}