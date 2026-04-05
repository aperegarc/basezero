import { useEffect, useState } from 'react';
import { getVentas, createVenta, deleteVenta, getClientes } from '../api';
import type { Venta, Cliente, LineaVenta } from '../types';
import { generarPDF } from '../utils/pdfGenerator.ts';
import { useEmpresaStore } from '../store/empresaStore';

const ESTADOS = ['PENDIENTE', 'COBRADA', 'ANULADA'];
const METODOS = ['TRANSFERENCIA', 'EFECTIVO', 'TARJETA', 'CHEQUE'];

const estadoBadge = (estado: string) => ({
  COBRADA: { bg: '#D1FAE5', color: '#065F46' },
  ANULADA: { bg: '#FEE2E2', color: '#991B1B' },
  PENDIENTE: { bg: '#FEF3C7', color: '#92400E' },
}[estado] || { bg: '#F1F5F9', color: '#475569' });

const emptyLinea = (): LineaVenta => ({ producto: '', nombre: '', descripcion: '', unidades: 1, precio: 0, descuento: 0, iva: 21, total: 0 });

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const [form, setForm] = useState({
    clienteId: 0, estado: 'PENDIENTE', fecha: new Date().toISOString().slice(0, 10),
    vencimiento: '', metodoPago: 'TRANSFERENCIA', direccionFiscal: '', codigo: '',
    lineas: [emptyLinea()],
  });

  const { config: empresa } = useEmpresaStore();

  const generarFactura = (v: Venta) => {
    const cliente = clientes.find(c => c.id === v.clienteId);
    generarPDF(empresa, {
      tipo: 'FACTURA',
      numero: v.codigo,
      fecha: v.fecha as string,
      vencimiento: v.vencimiento as string,
      metodoPago: v.metodoPago,
      cliente: {
        nombre: cliente?.nombre || v.clienteNombre || '—',
        cifNif: cliente?.cifNif || '',
        direccion: cliente?.direccion || v.direccionFiscal || '',
        email: cliente?.email || '',
        telefono: cliente?.telefono || '',
      },
      lineas: (v.lineas || []).map(l => ({
        producto: l.producto || '',
        nombre: l.nombre || l.producto || '—',
        descripcion: l.descripcion || '',
        unidades: Number(l.unidades) || 1,
        precio: Number(l.precio) || 0,
        descuento: Number(l.descuento) || 0,
        iva: Number(l.iva) || 21,
        total: Number(l.total) || 0,
      })),
    });
  };

  const generarPresupuesto = (v: Venta) => {
    const cliente = clientes.find(c => c.id === v.clienteId);
    generarPDF(empresa, {
      tipo: 'PRESUPUESTO',
      numero: v.codigo,
      fecha: v.fecha as string,
      vencimiento: v.vencimiento as string,
      cliente: {
        nombre: cliente?.nombre || v.clienteNombre || '—',
        cifNif: cliente?.cifNif || '',
        direccion: cliente?.direccion || v.direccionFiscal || '',
        email: cliente?.email || '',
        telefono: cliente?.telefono || '',
      },
      lineas: (v.lineas || []).map(l => ({
        producto: l.producto || '',
        nombre: l.nombre || l.producto || '—',
        descripcion: l.descripcion || '',
        unidades: Number(l.unidades) || 1,
        precio: Number(l.precio) || 0,
        descuento: Number(l.descuento) || 0,
        iva: Number(l.iva) || 21,
        total: Number(l.total) || 0,
      })),
      notas: 'Presupuesto válido por 30 días.',
    });
  };

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => Promise.all([getVentas(), getClientes()])
    .then(([v, c]) => {
      const ventasCorregidas = v.data.map((venta: any) => {
        // Si el total es 0 pero tiene líneas, recalcular el total
        if ((venta.total === 0 || !venta.total) && venta.lineas && venta.lineas.length > 0) {
          const calcTotal = venta.lineas.reduce((sum: number, l: any) => sum + (Number(l.total) || 0), 0);
          return { ...venta, total: calcTotal };
        }
        return venta;
      });
      setVentas(ventasCorregidas);
      setClientes(c.data);
    })
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const fmt = (n: number) => (n || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const calcLinea = (l: LineaVenta) => {
    const base = l.unidades * l.precio * (1 - l.descuento / 100);
    return base * (1 + l.iva / 100);
  };

  const updateLinea = (i: number, field: keyof LineaVenta, val: any) => {
    const lineas = [...form.lineas];
    lineas[i] = { ...lineas[i], [field]: val };
    lineas[i].total = calcLinea(lineas[i]);
    setForm({ ...form, lineas });
  };

  const totalForm = form.lineas.reduce((s, l) => s + l.total, 0);

  const openNew = () => {
    setForm({ clienteId: clientes[0]?.id || 0, estado: 'PENDIENTE', fecha: new Date().toISOString().slice(0, 10), vencimiento: '', metodoPago: 'TRANSFERENCIA', direccionFiscal: '', codigo: '', lineas: [emptyLinea()] });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.clienteId) { showToast('Selecciona un cliente', 'err'); return; }
    if (!form.codigo) { showToast('Introduce un código', 'err'); return; }
    setSaving(true);
    try {
      await createVenta({ ...form, total: totalForm });
      showToast('Venta creada');
      setModal(false);
      load();
    } catch { showToast('Error al crear la venta', 'err'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta venta?')) return;
    try { await deleteVenta(id); showToast('Venta eliminada'); load(); }
    catch { showToast('Error al eliminar', 'err'); }
  };

  const filtered = ventas.filter(v =>
    v.codigo?.toLowerCase().includes(search.toLowerCase()) ||
    v.clienteNombre?.toLowerCase().includes(search.toLowerCase())
  );

  const inputStyle = { width: '100%', padding: '.5rem .7rem', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: '.74rem', color: '#2D3748', fontFamily: "'Montserrat', sans-serif", outline: 'none' };

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
          <h1 style={{ fontSize: '1rem', fontWeight: 900, color: '#1A202C', fontFamily: "'Montserrat', sans-serif" }}>Ventas</h1>
          <p style={{ fontSize: '.68rem', color: '#718096', marginTop: '.2rem', fontFamily: "'Montserrat', sans-serif" }}>{ventas.length} facturas registradas</p>
        </div>
        <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '.4rem .8rem' }}>
            <span style={{ fontSize: '.8rem', color: '#A0AEC0' }}></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar venta..." style={{ border: 'none', background: 'none', fontSize: '.76rem', color: '#2D3748', outline: 'none', width: 160, fontFamily: "'Montserrat', sans-serif" }} />
          </div>
          <button onClick={openNew} style={{ padding: '.48rem .95rem', borderRadius: 7, border: 'none', background: '#00B4D8', cursor: 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#0D1B2A', fontFamily: "'Montserrat', sans-serif" }}>
            ＋ Nueva venta
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.75rem', fontFamily: "'Montserrat', sans-serif" }}>
            <thead>
              <tr style={{ background: '#0D1B2A' }}>
                {['Código', 'Cliente', 'Fecha', 'Vencimiento', 'Método', 'Estado', 'Total', 'Acciones'].map((h, i) => (
                  <th key={h} style={{ padding: '.6rem 1rem', textAlign: i === 6 ? 'right' : 'left', color: '#fff', fontWeight: 700, fontSize: '.62rem', letterSpacing: '.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#A0AEC0' }}>Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#A0AEC0' }}>No hay ventas{search ? ' con ese filtro' : ''}</td></tr>
              ) : filtered.map(v => {
                const badge = estadoBadge(v.estado);
                return (
                  <tr key={v.id} style={{ borderBottom: '1px solid #F7FAFC' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8FAFC'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                  >
                    <td style={{ padding: '.65rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, color: '#1A202C' }}>{v.codigo}</span>
                        {v.contratoId && (
                          <span style={{
                            padding: '.15rem .45rem', borderRadius: 20,
                            fontSize: '.55rem', fontWeight: 700,
                            background: '#EDE9FE', color: '#5B21B6',
                            whiteSpace: 'nowrap',
                          }}>
                            Recurrente
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '.65rem 1rem', color: '#2D3748' }}>{v.clienteNombre || '—'}</td>
                    <td style={{ padding: '.65rem 1rem', color: '#718096' }}>{v.fecha}</td>
                    <td style={{ padding: '.65rem 1rem', color: v.vencimiento < new Date().toISOString().slice(0, 10) && v.estado === 'PENDIENTE' ? '#EF4444' : '#718096', fontWeight: v.vencimiento < new Date().toISOString().slice(0, 10) && v.estado === 'PENDIENTE' ? 700 : 400 }}>{v.vencimiento || '—'}</td>
                    <td style={{ padding: '.65rem 1rem', color: '#718096' }}>{v.metodoPago}</td>
                    <td style={{ padding: '.65rem 1rem' }}>
                      <span style={{ padding: '.2rem .6rem', borderRadius: 20, fontSize: '.6rem', fontWeight: 700, background: badge.bg, color: badge.color }}>{v.estado}</span>
                    </td>
                    <td style={{ padding: '.65rem 1rem', fontWeight: 700, color: '#1A202C', minWidth: '90px', textAlign: 'right' }}>{fmt(v.total || 0)} €</td>
                    <td style={{ padding: '.65rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
                        <button onClick={() => generarFactura(v)} style={{ padding: '.3rem .6rem', borderRadius: 6, border: '1px solid rgba(0,180,216,.25)', background: 'rgba(0,180,216,.08)', cursor: 'pointer', fontSize: '.6rem', fontWeight: 700, color: '#0090B0', fontFamily: "'Montserrat', sans-serif", whiteSpace: 'nowrap' }}> Factura</button>
                        <button onClick={() => generarPresupuesto(v)} style={{ padding: '.3rem .6rem', borderRadius: 6, border: '1px solid rgba(139,92,246,.25)', background: 'rgba(139,92,246,.08)', cursor: 'pointer', fontSize: '.6rem', fontWeight: 700, color: '#6D28D9', fontFamily: "'Montserrat', sans-serif", whiteSpace: 'nowrap' }}> Presup.</button>
                        <button onClick={() => handleDelete(v.id)} style={{ padding: '.3rem .6rem', borderRadius: 6, border: '1px solid rgba(239,68,68,.2)', background: '#FEE2E2', cursor: 'pointer', fontSize: '.6rem', fontWeight: 700, color: '#991B1B', fontFamily: "'Montserrat', sans-serif" }}> Eliminar </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 500, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '1.5rem 1rem', overflowY: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 720, fontFamily: "'Montserrat', sans-serif" }}>
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '.85rem', color: '#1A202C' }}>Nueva venta</span>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#718096' }}>✕</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {/* Basic fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '.62rem', fontWeight: 700, color: '#718096', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Cliente *</label>
                  <select value={form.clienteId} onChange={e => setForm({ ...form, clienteId: +e.target.value })} style={{ ...inputStyle, background: '#fff' }}>
                    <option value={0}>— Seleccionar cliente —</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                {[
                  { key: 'codigo', label: 'Código *' },
                  { key: 'fecha', label: 'Fecha', type: 'date' },
                  { key: 'vencimiento', label: 'Vencimiento', type: 'date' },
                  { key: 'direccionFiscal', label: 'Dirección fiscal' },
                ].map(({ key, label, type }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: '.62rem', fontWeight: 700, color: '#718096', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</label>
                    <input type={type || 'text'} value={(form as any)[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#00B4D8'}
                      onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: '.62rem', fontWeight: 700, color: '#718096', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Método de pago</label>
                  <select value={form.metodoPago} onChange={e => setForm({ ...form, metodoPago: e.target.value })} style={{ ...inputStyle, background: '#fff' }}>
                    {METODOS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '.62rem', fontWeight: 700, color: '#718096', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Estado</label>
                  <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} style={{ ...inputStyle, background: '#fff' }}>
                    {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Líneas */}
              <div style={{ marginBottom: '.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '.72rem', fontWeight: 800, color: '#1A202C' }}>Líneas de venta</span>
                <button onClick={() => setForm({ ...form, lineas: [...form.lineas, emptyLinea()] })}
                  style={{ padding: '.28rem .65rem', borderRadius: 6, border: '1px solid rgba(0,180,216,.3)', background: 'rgba(0,180,216,.08)', cursor: 'pointer', fontSize: '.65rem', fontWeight: 700, color: '#0090B0', fontFamily: "'Montserrat', sans-serif" }}>
                  ＋ Añadir línea
                </button>
              </div>
              <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden', marginBottom: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.7rem', fontFamily: "'Montserrat', sans-serif" }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC' }}>
                      {['Producto', 'Nombre', 'Uds', 'Precio', 'Dto%', 'IVA%', 'Total', ''].map(h => (
                        <th key={h} style={{ padding: '.45rem .6rem', textAlign: 'left', fontWeight: 700, fontSize: '.6rem', color: '#718096', textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {form.lineas.map((l, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                        {(['producto', 'nombre'] as (keyof LineaVenta)[]).map(f => (
                          <td key={f} style={{ padding: '.3rem .4rem' }}>
                            <input value={l[f] as string || ''} onChange={e => updateLinea(i, f, e.target.value)}
                              style={{ width: '100%', minWidth: 70, padding: '.3rem .5rem', border: '1px solid #E2E8F0', borderRadius: 5, fontSize: '.68rem', fontFamily: "'Montserrat', sans-serif", outline: 'none' }} />
                          </td>
                        ))}
                        {(['unidades', 'precio', 'descuento', 'iva'] as (keyof LineaVenta)[]).map(f => (
                          <td key={f} style={{ padding: '.3rem .4rem' }}>
                            <input type="number" value={l[f] as number || 0} onChange={e => updateLinea(i, f, +e.target.value)}
                              style={{ width: 60, padding: '.3rem .5rem', border: '1px solid #E2E8F0', borderRadius: 5, fontSize: '.68rem', fontFamily: "'Montserrat', sans-serif", outline: 'none' }} />
                          </td>
                        ))}
                        <td style={{ padding: '.3rem .6rem', fontWeight: 700, color: '#1A202C', whiteSpace: 'nowrap' }}>{(l.total || 0).toFixed(2)} €</td>
                        <td style={{ padding: '.3rem .4rem' }}>
                          {form.lineas.length > 1 && (
                            <button onClick={() => setForm({ ...form, lineas: form.lineas.filter((_, j) => j !== i) })}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '.8rem' }}>✕</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ textAlign: 'right', fontSize: '.8rem', fontWeight: 900, color: '#1A202C', padding: '.5rem 1rem' }}>
                TOTAL: {fmt(totalForm)} €
              </div>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '.6rem' }}>
              <button onClick={() => setModal(false)} style={{ padding: '.48rem .95rem', borderRadius: 7, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#2D3748', fontFamily: "'Montserrat', sans-serif" }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '.48rem .95rem', borderRadius: 7, border: 'none', background: '#00B4D8', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#0D1B2A', fontFamily: "'Montserrat', sans-serif" }}>
                {saving ? 'Guardando...' : 'Crear venta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}