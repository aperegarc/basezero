import { useEffect, useState } from 'react';
import { getCobros, createCobro, deleteCobro, getVentas } from '../api';
import type { Cobro, Venta } from '../types';

const METODOS = ['TRANSFERENCIA', 'EFECTIVO', 'TARJETA', 'CHEQUE'];
type CobTab = 'pendientes' | 'vencidos' | 'cobrados' | 'remesas';

const inp = {
  width: '100%', padding: '.55rem .8rem', border: '1px solid #E2E8F0',
  borderRadius: 7, fontSize: '.76rem', color: '#2D3748',
  fontFamily: "'Montserrat', sans-serif", outline: 'none', background: '#fff',
} as const;

const FL = ({ children }: { children: React.ReactNode }) => (
  <label style={{ display: 'block', fontSize: '.6rem', fontWeight: 700, color: '#718096', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: "'Montserrat', sans-serif" }}>
    {children}
  </label>
);

export default function CobrosPage() {
  const [cobros, setCobros] = useState<Cobro[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<CobTab>('pendientes');
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [form, setForm] = useState({
    cantidad: 0,
    fecha: new Date().toISOString().slice(0, 10),
    metodoPago: 'TRANSFERENCIA',
    ventaId: 0,
  });

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () =>
    Promise.all([getCobros(), getVentas()])
      .then(([c, v]) => {
        const ventasArr: Venta[] = v.data.map((venta: any) => {
          const calcTotal = (venta.lineas || []).reduce(
            (s: number, l: any) => s + (Number(l.total) || 0), 0
          );
          return { ...venta, total: venta.total || calcTotal };
        });
        setCobros(c.data);
        setVentas(ventasArr);
      })
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const fmt = (n: number) =>
    (n || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ── Stats helpers ──────────────────────────────────────────────
  const today = new Date();
  const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const ventasPendientes = ventas.filter(v => v.estado === 'PENDIENTE');
  const ventasVencidas = ventas.filter(v => {
    if (v.estado !== 'PENDIENTE') return false;
    if (!v.vencimiento) return false;
    return new Date(v.vencimiento) < today;
  });

  const totalPendiente = ventasPendientes.reduce((s, v) => s + (v.total || 0), 0);
  const totalVencido = ventasVencidas.reduce((s, v) => s + (v.total || 0), 0);
  const cobradoMes = cobros
    .filter(c => (c.fecha as string)?.startsWith(thisMonth))
    .reduce((s, c) => s + Number(c.cantidad), 0);

  // ── Helper: nombre de venta ────────────────────────────────────
  const ventaLabel = (c: Cobro) => {
    const codigo = (c as any).ventaCodigo;
    const cliente = (c as any).clienteNombre;
    if (codigo && cliente) return `${codigo} · ${cliente}`;
    if (codigo) return codigo;
    const v = ventas.find(v => v.id === c.ventaId);
    if (v) return `${v.codigo} · ${v.clienteNombre || ''}`;
    return `Venta #${c.ventaId}`;
  };

  // ── Tabs content ───────────────────────────────────────────────
  const cobradosPorVenta = (ventaId: number) =>
    cobros.filter(c => c.ventaId === ventaId).reduce((s, c) => s + Number(c.cantidad), 0);

  const pendingRows = ventasPendientes.filter(v => !ventasVencidas.find(vv => vv.id === v.id));
  const vencidosRows = ventasVencidas;
  const cobradosRows = cobros;

  // ── Save ───────────────────────────────────────────────────────
  const openNew = () => {
    setForm({
      cantidad: 0,
      fecha: new Date().toISOString().slice(0, 10),
      metodoPago: 'TRANSFERENCIA',
      ventaId: ventasPendientes[0]?.id || 0,
    });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.ventaId) { showToast('Selecciona una factura', 'err'); return; }
    if (!form.cantidad || form.cantidad <= 0) { showToast('Introduce un importe válido', 'err'); return; }
    const venta = ventas.find(v => v.id === form.ventaId);
    const cobrado = cobradosPorVenta(form.ventaId);
    const maximo = (venta?.total || 0) - cobrado;
    if (form.cantidad > maximo) {
      showToast(`El máximo a cobrar es ${fmt(maximo)} €`, 'err');
      return;
    }
    setSaving(true);
    try {
      await createCobro(form);
      showToast('Cobro registrado');
      setModal(false);
      load();
    } catch { showToast('Error al registrar el cobro', 'err'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este cobro?')) return;
    try { await deleteCobro(id); showToast('Cobro eliminado'); load(); }
    catch { showToast('Error al eliminar', 'err'); }
  };

  // ── Stat card ──────────────────────────────────────────────────
  const Stat = ({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) => (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: '1rem 1.2rem', borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: '.58rem', fontWeight: 800, color: '#718096', textTransform: 'uppercase', letterSpacing: '.14em', marginBottom: '.3rem', fontFamily: "'Montserrat', sans-serif" }}>{label}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1A202C', fontFamily: "'Montserrat', sans-serif" }}>{value}</div>
      <div style={{ fontSize: '.62rem', color: '#718096', marginTop: '.2rem', fontFamily: "'Montserrat', sans-serif" }}>{sub}</div>
    </div>
  );

  const tabStyle = (t: CobTab) => ({
    padding: '.55rem 1.1rem', fontSize: '.7rem', fontWeight: 700, cursor: 'pointer',
    border: 'none', background: 'none', fontFamily: "'Montserrat', sans-serif",
    borderBottom: `2px solid ${tab === t ? '#00B4D8' : 'transparent'}`,
    color: tab === t ? '#0090B0' : '#718096', marginBottom: -1,
    transition: 'all .15s',
  } as const);

  const thStyle = { padding: '.55rem 1rem', textAlign: 'left' as const, color: '#fff', fontWeight: 700, fontSize: '.6rem', letterSpacing: '.1em', textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const };
  const tdStyle = { padding: '.6rem 1rem', fontSize: '.75rem', fontFamily: "'Montserrat', sans-serif" };

  const BadgeEstado = ({ estado }: { estado: string }) => {
    const map: Record<string, [string, string]> = {
      PENDIENTE: ['#FEF3C7', '#92400E'],
      COBRADO:   ['#D1FAE5', '#065F46'],
      ANULADA:   ['#FEE2E2', '#991B1B'],
    };
    const [bg, color] = map[estado] || ['#F1F5F9', '#475569'];
    return (
      <span style={{ padding: '.18rem .55rem', borderRadius: 20, fontSize: '.6rem', fontWeight: 800, background: bg, color, letterSpacing: '.04em', textTransform: 'uppercase' }}>
        {estado}
      </span>
    );
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999, background: toast.type === 'ok' ? '#D1FAE5' : '#FEE2E2', border: `1px solid ${toast.type === 'ok' ? 'rgba(16,185,129,.3)' : 'rgba(239,68,68,.3)'}`, color: toast.type === 'ok' ? '#065F46' : '#991B1B', padding: '.7rem 1.2rem', borderRadius: 10, fontSize: '.75rem', fontWeight: 700, fontFamily: "'Montserrat', sans-serif" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '.8rem' }}>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 900, color: '#1A202C', fontFamily: "'Montserrat', sans-serif" }}>Cobros</h1>
          <p style={{ fontSize: '.68rem', color: '#718096', marginTop: '.2rem', fontFamily: "'Montserrat', sans-serif" }}>Gestión de cobros y seguimiento de facturas</p>
        </div>
        <button onClick={openNew} style={{ padding: '.48rem .95rem', borderRadius: 7, border: 'none', background: '#00B4D8', cursor: 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#0D1B2A', fontFamily: "'Montserrat', sans-serif" }}>
          ＋ Registrar cobro
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.4rem' }}>
        <Stat label="Total pendiente" value={`${fmt(totalPendiente)} €`} sub={`${ventasPendientes.length} facturas`} color="#F59E0B" />
        <Stat label="Vencido sin cobrar" value={`${fmt(totalVencido)} €`} sub={`${ventasVencidas.length} vencidas`} color="#EF4444" />
        <Stat label="Cobrado este mes" value={`${fmt(cobradoMes)} €`} sub="Ingresos confirmados" color="#10B981" />
      </div>

      {/* Tabs + content */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', padding: '0 1rem' }}>
          {(['pendientes', 'vencidos', 'cobrados', 'remesas'] as CobTab[]).map(t => (
            <button key={t} style={tabStyle(t)} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === 'vencidos' && ventasVencidas.length > 0 && (
                <span style={{ marginLeft: '.35rem', background: '#EF4444', color: '#fff', borderRadius: 20, padding: '.1rem .4rem', fontSize: '.55rem', fontWeight: 900 }}>
                  {ventasVencidas.length}
                </span>
              )}
              {t === 'pendientes' && pendingRows.length > 0 && (
                <span style={{ marginLeft: '.35rem', background: '#F59E0B', color: '#fff', borderRadius: 20, padding: '.1rem .4rem', fontSize: '.55rem', fontWeight: 900 }}>
                  {pendingRows.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ overflowX: 'auto' }}>
          {/* PENDIENTES */}
          {tab === 'pendientes' && (
            loading ? <div style={{ padding: '2rem', textAlign: 'center', color: '#A0AEC0', fontFamily: "'Montserrat', sans-serif", fontSize: '.78rem' }}>Cargando...</div>
            : pendingRows.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#A0AEC0', fontFamily: "'Montserrat', sans-serif" }}>
                <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>✅</div>
                <div style={{ fontWeight: 700, fontSize: '.85rem' }}>Sin facturas pendientes</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.75rem', fontFamily: "'Montserrat', sans-serif" }}>
                <thead>
                  <tr style={{ background: '#0D1B2A' }}>
                    {['Nº Factura', 'Cliente', 'Total', 'Vencimiento', 'Cobrado', 'Pendiente', 'Acción'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingRows.map(v => {
                    const cobrado = cobradosPorVenta(v.id);
                    const pendiente = (v.total || 0) - cobrado;
                    return (
                      <tr key={v.id} style={{ borderBottom: '1px solid #F7FAFC' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8FAFC'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                        <td style={{ ...tdStyle, fontWeight: 700, color: '#1A202C', fontFamily: 'monospace' }}>{v.codigo}</td>
                        <td style={tdStyle}>{v.clienteNombre || '—'}</td>
                        <td style={{ ...tdStyle, fontWeight: 700 }}>{fmt(v.total || 0)} €</td>
                        <td style={{ ...tdStyle, color: '#718096' }}>{v.vencimiento || '—'}</td>
                        <td style={{ ...tdStyle, color: '#10B981', fontWeight: 700 }}>{fmt(cobrado)} €</td>
                        <td style={{ ...tdStyle, color: pendiente > 0 ? '#F59E0B' : '#10B981', fontWeight: 700 }}>{fmt(pendiente)} €</td>
                        <td style={tdStyle}>
                          {pendiente > 0 && (
                            <button onClick={() => { setForm(f => ({ ...f, ventaId: v.id, cantidad: pendiente })); setModal(true); }}
                              style={{ padding: '.28rem .65rem', borderRadius: 6, border: 'none', background: '#00B4D8', cursor: 'pointer', fontSize: '.65rem', fontWeight: 700, color: '#0D1B2A', fontFamily: "'Montserrat', sans-serif" }}>
                              Cobrar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          )}

          {/* VENCIDOS */}
          {tab === 'vencidos' && (
            <>
              {vencidosRows.length > 0 && (
                <div style={{ margin: '1rem', padding: '.75rem 1rem', background: '#FEF3C7', border: '1px solid rgba(245,158,11,.3)', borderRadius: 8, fontSize: '.73rem', color: '#92400E', fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}>
                  ⚠️ Estas facturas han superado su fecha de vencimiento. Contacta al cliente para gestionar el cobro.
                </div>
              )}
              {vencidosRows.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#A0AEC0', fontFamily: "'Montserrat', sans-serif" }}>
                  <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>✅</div>
                  <div style={{ fontWeight: 700, fontSize: '.85rem' }}>Sin facturas vencidas</div>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.75rem', fontFamily: "'Montserrat', sans-serif" }}>
                  <thead>
                    <tr style={{ background: '#0D1B2A' }}>
                      {['Nº Factura', 'Cliente', 'Total', 'Venció el', 'Días vencida', 'Pendiente', 'Acción'].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vencidosRows.map(v => {
                      const dias = v.vencimiento
                        ? Math.floor((today.getTime() - new Date(v.vencimiento).getTime()) / 86400000)
                        : 0;
                      const cobrado = cobradosPorVenta(v.id);
                      const pendiente = (v.total || 0) - cobrado;
                      return (
                        <tr key={v.id} style={{ borderBottom: '1px solid #FEE2E2', background: '#FFFBFB' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FEF2F2'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#FFFBFB'}>
                          <td style={{ ...tdStyle, fontWeight: 700, color: '#1A202C', fontFamily: 'monospace' }}>{v.codigo}</td>
                          <td style={tdStyle}>{v.clienteNombre || '—'}</td>
                          <td style={{ ...tdStyle, fontWeight: 700 }}>{fmt(v.total || 0)} €</td>
                          <td style={{ ...tdStyle, color: '#EF4444', fontWeight: 700 }}>{v.vencimiento || '—'}</td>
                          <td style={tdStyle}>
                            <span style={{ padding: '.18rem .55rem', borderRadius: 20, fontSize: '.6rem', fontWeight: 800, background: '#FEE2E2', color: '#991B1B' }}>
                              {dias}d
                            </span>
                          </td>
                          <td style={{ ...tdStyle, color: '#EF4444', fontWeight: 700 }}>{fmt(pendiente)} €</td>
                          <td style={tdStyle}>
                            <button onClick={() => { setForm(f => ({ ...f, ventaId: v.id, cantidad: pendiente })); setModal(true); }}
                              style={{ padding: '.28rem .65rem', borderRadius: 6, border: 'none', background: '#EF4444', cursor: 'pointer', fontSize: '.65rem', fontWeight: 700, color: '#fff', fontFamily: "'Montserrat', sans-serif" }}>
                              Cobrar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </>
          )}

          {/* COBRADOS */}
          {tab === 'cobrados' && (
            cobradosRows.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#A0AEC0', fontFamily: "'Montserrat', sans-serif" }}>
                <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>💰</div>
                <div style={{ fontWeight: 700, fontSize: '.85rem' }}>Sin cobros registrados todavía</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.75rem', fontFamily: "'Montserrat', sans-serif" }}>
                <thead>
                  <tr style={{ background: '#0D1B2A' }}>
                    {['Factura', 'Cliente', 'Importe cobrado', 'Fecha cobro', 'Método', 'Acciones'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cobradosRows.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #F7FAFC' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8FAFC'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#1A202C', fontFamily: 'monospace' }}>
                        {(c as any).ventaCodigo || `#${c.ventaId}`}
                      </td>
                      <td style={tdStyle}>{(c as any).clienteNombre || '—'}</td>
                      <td style={{ ...tdStyle, fontWeight: 900, color: '#10B981', fontSize: '.82rem' }}>{fmt(Number(c.cantidad))} €</td>
                      <td style={{ ...tdStyle, color: '#718096' }}>{c.fecha as string}</td>
                      <td style={tdStyle}>
                        <span style={{ padding: '.18rem .55rem', borderRadius: 20, fontSize: '.6rem', fontWeight: 700, background: '#DBEAFE', color: '#1D4ED8' }}>{c.metodoPago}</span>
                      </td>
                      <td style={tdStyle}>
                        <button onClick={() => handleDelete(c.id)} style={{ padding: '.28rem .6rem', borderRadius: 6, border: '1px solid rgba(239,68,68,.2)', background: '#FEE2E2', cursor: 'pointer', fontSize: '.65rem', fontWeight: 700, color: '#991B1B', fontFamily: "'Montserrat', sans-serif" }}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {/* REMESAS */}
          {tab === 'remesas' && (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#A0AEC0', fontFamily: "'Montserrat', sans-serif" }}>
              <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>🏦</div>
              <div style={{ fontWeight: 700, fontSize: '.85rem', marginBottom: '.4rem' }}>Remesas bancarias</div>
              <div style={{ fontSize: '.72rem' }}>Módulo disponible próximamente</div>
            </div>
          )}
        </div>
      </div>

      {/* Modal registrar cobro */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 500, fontFamily: "'Montserrat', sans-serif" }}>
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '.88rem', color: '#1A202C' }}>Registrar cobro</span>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#718096' }}>✕</button>
            </div>
            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Selector de factura */}
              <div style={{ gridColumn: '1 / -1' }}>
                <FL>Factura *</FL>
                <select value={form.ventaId} onChange={e => setForm({ ...form, ventaId: +e.target.value })} style={inp}>
                  <option value={0}>— Seleccionar factura —</option>
                  {ventasPendientes.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.codigo} — {v.clienteNombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Info de la factura seleccionada */}
              {form.ventaId > 0 && (() => {
                const venta = ventas.find(v => v.id === form.ventaId);
                const cobrado = cobradosPorVenta(form.ventaId);
                const maximo = (venta?.total || 0) - cobrado;
                return (
                  <div style={{ gridColumn: '1 / -1', background: '#F0F9FF', border: '1px solid rgba(59,130,246,.2)', borderRadius: 8, padding: '.85rem', fontSize: '.72rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.8rem' }}>
                      <div>
                        <div style={{ color: '#718096', fontSize: '.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.25rem' }}>Total factura</div>
                        <div style={{ color: '#1D4ED8', fontWeight: 900, fontSize: '.9rem' }}>{fmt(venta?.total || 0)} €</div>
                      </div>
                      <div>
                        <div style={{ color: '#718096', fontSize: '.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.25rem' }}>Ya cobrado</div>
                        <div style={{ color: '#10B981', fontWeight: 900, fontSize: '.9rem' }}>{fmt(cobrado)} €</div>
                      </div>
                      <div>
                        <div style={{ color: '#718096', fontSize: '.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.25rem' }}>Pendiente</div>
                        <div style={{ color: maximo > 0 ? '#F59E0B' : '#EF4444', fontWeight: 900, fontSize: '.9rem' }}>{fmt(maximo)} €</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div>
                <FL>Importe *</FL>
                <input type="number" step="0.01" value={form.cantidad || ''} onChange={e => setForm({ ...form, cantidad: +e.target.value })} style={inp}
                  onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
              <div>
                <FL>Fecha cobro</FL>
                <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} style={inp}
                  onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <FL>Método de pago</FL>
                <select value={form.metodoPago} onChange={e => setForm({ ...form, metodoPago: e.target.value })} style={inp}>
                  {METODOS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '.6rem' }}>
              <button onClick={() => setModal(false)} style={{ padding: '.48rem .95rem', borderRadius: 7, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#2D3748', fontFamily: "'Montserrat', sans-serif" }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '.48rem .95rem', borderRadius: 7, border: 'none', background: '#10B981', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#fff', fontFamily: "'Montserrat', sans-serif", opacity: saving ? .7 : 1 }}>
                {saving ? 'Guardando...' : '💾 Registrar cobro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
