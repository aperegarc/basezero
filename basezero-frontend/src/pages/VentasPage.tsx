import { useEffect, useState } from 'react';
import { getVentas, createVenta, deleteVenta, getClientes } from '../api';
import type { Venta, Cliente, LineaVenta } from '../types';
import { generarPDF } from '../utils/pdfGenerator.ts';
import { useEmpresaStore } from '../store/empresaStore';

type Tab = 'FACTURA' | 'PRESUPUESTO' | 'ALBARAN';

const ESTADOS = ['PENDIENTE', 'COBRADO', 'ANULADA'];
const METODOS = ['TRANSFERENCIA', 'EFECTIVO', 'TARJETA', 'CHEQUE', 'DOMICILIACION'];

const BADGE: Record<string, { bg: string; color: string }> = {
  COBRADO:    { bg: '#D1FAE5', color: '#065F46' },
  PENDIENTE:  { bg: '#FEF3C7', color: '#92400E' },
  ANULADA:    { bg: '#FEE2E2', color: '#991B1B' },
};

const TAB_LABELS: Record<Tab, string> = {
  FACTURA:     'Facturas',
  PRESUPUESTO: 'Presupuestos',
  ALBARAN:     'Albaranes',
};

const emptyLinea = (): LineaVenta => ({
  producto: '', nombre: '', descripcion: '', unidades: 1,
  precio: 0, descuento: 0, iva: 21, total: 0,
});

const fmt = (n: number) =>
  (n || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ─── Preview HTML ─────────────────────────────────────────────── */
function buildPreviewHTML(
  empresa: { nombre: string; cif: string; direccion: string; telefono: string; email: string },
  form: {
    tipo: Tab; codigo: string; fecha: string; vencimiento: string; metodoPago: string;
    direccionFiscal: string; notas: string; lineas: LineaVenta[];
  },
  cliente: Cliente | undefined,
): string {
  const tipoLabel: Record<Tab, string> = {
    FACTURA: 'FACTURA', PRESUPUESTO: 'PRESUPUESTO', ALBARAN: 'ALBARÁN',
  };
  const subtotal = form.lineas.reduce((s, l) => {
    return s + l.unidades * l.precio * (1 - l.descuento / 100);
  }, 0);
  const totalIva = form.lineas.reduce((s, l) => {
    const base = l.unidades * l.precio * (1 - l.descuento / 100);
    return s + base * (l.iva / 100);
  }, 0);
  const total = subtotal + totalIva;

  const lineasHtml = form.lineas.map((l, i) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#F8FAFC'}">
      <td style="padding:.55rem .8rem;border-bottom:1px solid #E2E8F0">
        <div style="font-weight:700;font-size:.8rem;color:#1A202C">${l.nombre || l.producto || '—'}</div>
        ${l.descripcion ? `<div style="font-size:.7rem;color:#718096;margin-top:.15rem">${l.descripcion}</div>` : ''}
      </td>
      <td style="padding:.55rem .8rem;border-bottom:1px solid #E2E8F0;font-size:.78rem">${l.unidades}</td>
      <td style="padding:.55rem .8rem;border-bottom:1px solid #E2E8F0;font-size:.78rem">${fmt(l.precio)} €</td>
      <td style="padding:.55rem .8rem;border-bottom:1px solid #E2E8F0;font-size:.78rem">${l.descuento}%</td>
      <td style="padding:.55rem .8rem;border-bottom:1px solid #E2E8F0;font-size:.78rem">${l.iva}%</td>
      <td style="padding:.55rem .8rem;border-bottom:1px solid #E2E8F0;font-size:.78rem;font-weight:700;text-align:right;white-space:nowrap">${fmt(l.total)} €</td>
    </tr>`).join('');

  return `
    <div style="background:#fff;border-radius:12px;padding:2.5rem;max-width:780px;margin:0 auto;font-family:'Montserrat',sans-serif">
      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2rem;padding-bottom:1.4rem;border-bottom:2.5px solid #00B4D8">
        <div>
          <div style="font-size:1.45rem;font-weight:900;letter-spacing:-.04em;color:#0D1B2A">
            BASE<em style="color:#00B4D8;font-style:normal">ZERO</em>
          </div>
          <div style="font-size:.65rem;color:#718096;margin-top:.3rem;line-height:1.7">
            ${empresa.nombre}<br>${empresa.direccion}<br>
            ${empresa.telefono} · ${empresa.email}
            ${empresa.cif ? `<br>CIF: ${empresa.cif}` : ''}
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:1.25rem;font-weight:900;color:#0D1B2A;margin-bottom:.4rem">${tipoLabel[form.tipo]}</div>
          <div style="font-size:.8rem;color:#718096;line-height:1.85">
            <strong style="color:#1A202C">Nº ${form.codigo || '—'}</strong><br>
            Fecha: ${form.fecha || '—'}<br>
            ${form.vencimiento ? `Vencimiento: ${form.vencimiento}` : ''}
          </div>
        </div>
      </div>

      <!-- Cliente -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem">
        <div>
          <div style="font-size:.58rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#A0AEC0;margin-bottom:.28rem">Cliente</div>
          <div style="font-size:.85rem;font-weight:700;color:#1A202C">${cliente?.nombre || '—'}</div>
          ${cliente?.cifNif ? `<div style="font-size:.74rem;color:#718096">CIF/NIF: ${cliente.cifNif}</div>` : ''}
          <div style="font-size:.74rem;color:#718096;line-height:1.6">${form.direccionFiscal || cliente?.direccion || ''}</div>
        </div>
        <div>
          <div style="font-size:.58rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#A0AEC0;margin-bottom:.28rem">Pago</div>
          <div style="font-size:.8rem;color:#1A202C">${form.metodoPago}</div>
          ${form.vencimiento ? `<div style="font-size:.74rem;color:#718096">Vencimiento: ${form.vencimiento}</div>` : ''}
        </div>
      </div>

      <!-- Líneas -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:1.4rem;font-size:.76rem">
        <thead>
          <tr style="background:#0D1B2A">
            <th style="padding:.55rem .8rem;text-align:left;color:#fff;font-size:.58rem;letter-spacing:.14em;text-transform:uppercase;font-weight:700">Descripción</th>
            <th style="padding:.55rem .8rem;color:#fff;font-size:.58rem;letter-spacing:.14em;text-transform:uppercase;font-weight:700;text-align:center">Uds.</th>
            <th style="padding:.55rem .8rem;color:#fff;font-size:.58rem;letter-spacing:.14em;text-transform:uppercase;font-weight:700;text-align:right">Precio</th>
            <th style="padding:.55rem .8rem;color:#fff;font-size:.58rem;letter-spacing:.14em;text-transform:uppercase;font-weight:700;text-align:center">Dto.%</th>
            <th style="padding:.55rem .8rem;color:#fff;font-size:.58rem;letter-spacing:.14em;text-transform:uppercase;font-weight:700;text-align:center">IVA%</th>
            <th style="padding:.55rem .8rem;color:#fff;font-size:.58rem;letter-spacing:.14em;text-transform:uppercase;font-weight:700;text-align:right">Total</th>
          </tr>
        </thead>
        <tbody>${lineasHtml}</tbody>
      </table>

      <!-- Totales -->
      <div style="display:flex;justify-content:flex-end;margin-bottom:1.4rem">
        <div style="min-width:260px;font-size:.8rem">
          <div style="display:flex;justify-content:space-between;padding:.38rem .8rem;color:#718096">
            <span>Base imponible</span><span style="font-family:'Space Grotesk',monospace">${fmt(subtotal)} €</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:.38rem .8rem;color:#718096">
            <span>IVA</span><span style="font-family:'Space Grotesk',monospace">${fmt(totalIva)} €</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:.55rem .8rem;border-top:2px solid #E2E8F0;font-weight:900;font-size:.92rem;color:#0D1B2A;margin-top:.1rem">
            <span>TOTAL</span><span style="font-family:'Space Grotesk',monospace">${fmt(total)} €</span>
          </div>
        </div>
      </div>

      ${form.notas ? `
      <div style="font-size:.72rem;color:#718096;border-top:1px solid #E2E8F0;padding-top:.9rem;line-height:1.75">
        ${form.notas}
      </div>` : ''}
    </div>`;
}

/* ─── Component ────────────────────────────────────────────────── */
export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('FACTURA');
  const [modal, setModal] = useState(false);
  const [preview, setPreview] = useState(false);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterMes, setFilterMes] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const [form, setForm] = useState({
    tipo: 'FACTURA' as Tab,
    clienteId: 0,
    estado: 'PENDIENTE',
    fecha: new Date().toISOString().slice(0, 10),
    vencimiento: '',
    metodoPago: 'TRANSFERENCIA',
    direccionFiscal: '',
    codigo: '',
    notas: '',
    lineas: [emptyLinea()],
  });

  const { config: empresa } = useEmpresaStore();

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () =>
    Promise.all([getVentas(), getClientes()])
      .then(([v, c]) => {
        const fixed = v.data.map((venta: Venta) => {
          if ((!venta.total || venta.total === 0) && venta.lineas?.length) {
            const calc = venta.lineas.reduce((s, l) => s + (Number(l.total) || 0), 0);
            return { ...venta, total: calc };
          }
          return venta;
        });
        setVentas(fixed);
        setClientes(c.data);
      })
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const calcLinea = (l: LineaVenta) => {
    const base = l.unidades * l.precio * (1 - l.descuento / 100);
    return base * (1 + l.iva / 100);
  };

  const updateLinea = (i: number, field: keyof LineaVenta, val: string | number) => {
    const lineas = [...form.lineas];
    lineas[i] = { ...lineas[i], [field]: val };
    lineas[i].total = calcLinea(lineas[i]);
    setForm({ ...form, lineas });
  };

  const totalForm = form.lineas.reduce((s, l) => s + l.total, 0);
  const baseForm   = form.lineas.reduce((s, l) => s + l.unidades * l.precio * (1 - l.descuento / 100), 0);
  const ivaForm    = totalForm - baseForm;

  const openNew = (tipo: Tab = tab) => {
    const cli = clientes[0];
    setForm({
      tipo,
      clienteId: cli?.id || 0,
      estado: 'PENDIENTE',
      fecha: new Date().toISOString().slice(0, 10),
      vencimiento: '',
      metodoPago: 'TRANSFERENCIA',
      direccionFiscal: cli?.direccion || '',
      codigo: '',
      notas: '',
      lineas: [emptyLinea()],
    });
    setModal(true);
    setPreview(false);
  };

  const handleClienteChange = (id: number) => {
    const c = clientes.find(cl => cl.id === id);
    setForm(f => ({
      ...f, clienteId: id,
      direccionFiscal: c?.direccion || f.direccionFiscal,
    }));
  };

  const handleSave = async () => {
    if (!form.clienteId) { showToast('Selecciona un cliente', 'err'); return; }
    if (!form.codigo) { showToast('Introduce un código / número', 'err'); return; }
    setSaving(true);
    try {
      await createVenta({ ...form, total: totalForm });
      showToast(`${TAB_LABELS[form.tipo].slice(0, -1)} creada`);
      setModal(false);
      load();
    } catch { showToast('Error al guardar', 'err'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este documento?')) return;
    try { await deleteVenta(id); showToast('Eliminado'); load(); }
    catch { showToast('Error al eliminar', 'err'); }
  };

  const handlePDF = (v: Venta) => {
    const cliente = clientes.find(c => c.id === v.clienteId);
    generarPDF(empresa, {
      tipo: v.tipo as 'FACTURA' | 'PRESUPUESTO' | 'ALBARAN',
      numero: v.codigo,
      fecha: v.fecha,
      vencimiento: v.vencimiento,
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

  const tabVentas = ventas.filter(v => (v.tipo || 'FACTURA') === tab);

  const filtered = tabVentas.filter(v => {
    const q = search.toLowerCase();
    const matchQ = !q || v.codigo?.toLowerCase().includes(q) || v.clienteNombre?.toLowerCase().includes(q);
    const matchEst = !filterEstado || v.estado === filterEstado;
    const matchMes = !filterMes || v.fecha?.startsWith(filterMes);
    return matchQ && matchEst && matchMes;
  });

  const selectedCliente = clientes.find(c => c.id === form.clienteId);

  /* ─── styles ─── */
  const S = {
    input: {
      width: '100%', padding: '.58rem .8rem', border: '1px solid #E2E8F0',
      borderRadius: 8, fontSize: '.8rem', color: '#2D3748',
      fontFamily: "'Montserrat', sans-serif", outline: 'none', background: '#fff',
    } as React.CSSProperties,
    label: {
      display: 'block', fontSize: '.62rem', fontWeight: 700, color: '#718096',
      marginBottom: '.3rem', textTransform: 'uppercase' as const, letterSpacing: '.08em',
    },
    btnPrimary: {
      padding: '.48rem .95rem', borderRadius: 7, border: 'none', background: '#00B4D8',
      cursor: 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#0D1B2A',
      fontFamily: "'Montserrat', sans-serif",
    } as React.CSSProperties,
    btnGhost: {
      padding: '.48rem .95rem', borderRadius: 7, border: '1px solid #E2E8F0',
      background: '#F8FAFC', cursor: 'pointer', fontSize: '.73rem', fontWeight: 700,
      color: '#2D3748', fontFamily: "'Montserrat', sans-serif",
    } as React.CSSProperties,
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '1.4rem', right: '1.4rem', zIndex: 9999,
          background: toast.type === 'ok' ? '#D1FAE5' : '#FEE2E2',
          border: `1px solid ${toast.type === 'ok' ? 'rgba(16,185,129,.3)' : 'rgba(239,68,68,.3)'}`,
          color: toast.type === 'ok' ? '#065F46' : '#991B1B',
          padding: '.7rem 1.15rem', borderRadius: 10, fontSize: '.75rem', fontWeight: 700,
          fontFamily: "'Montserrat', sans-serif", boxShadow: '0 8px 28px rgba(0,0,0,.12)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '.8rem' }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1A202C', fontFamily: "'Montserrat', sans-serif", lineHeight: 1.1 }}>Ventas</h1>
          <p style={{ fontSize: '.76rem', color: '#718096', marginTop: '.2rem', fontFamily: "'Montserrat', sans-serif" }}>Presupuestos, albaranes y facturas</p>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => openNew('PRESUPUESTO')} style={S.btnGhost}>+ Presupuesto</button>
          <button onClick={() => openNew('ALBARAN')} style={S.btnGhost}>+ Albarán</button>
          <button onClick={() => openNew('FACTURA')} style={S.btnPrimary}>+ Factura</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: '1.2rem' }}>
        {(['FACTURA', 'PRESUPUESTO', 'ALBARAN'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '.6rem 1.2rem', fontSize: '.7rem', fontWeight: 700,
            letterSpacing: '.05em', cursor: 'pointer', background: 'none',
            border: 'none', borderBottom: `2px solid ${tab === t ? '#00B4D8' : 'transparent'}`,
            marginBottom: -1, color: tab === t ? '#0090B0' : '#718096',
            fontFamily: "'Montserrat', sans-serif", transition: 'all .18s',
          }}>
            {TAB_LABELS[t]}
            <span style={{
              marginLeft: '.4rem', background: tab === t ? '#00B4D8' : '#E2E8F0',
              color: tab === t ? '#0D1B2A' : '#718096',
              padding: '.1rem .38rem', borderRadius: 10, fontSize: '.55rem', fontWeight: 900,
            }}>
              {ventas.filter(v => (v.tipo || 'FACTURA') === t).length}
            </span>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 7, padding: '.4rem .8rem', flex: 1, minWidth: 200 }}>
          <span style={{ color: '#A0AEC0' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por número o cliente…"
            style={{ border: 'none', background: 'none', fontSize: '.73rem', color: '#2D3748', outline: 'none', width: '100%', fontFamily: "'Montserrat', sans-serif" }} />
        </div>
        <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)}
          style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 7, padding: '.42rem .8rem', fontSize: '.73rem', color: '#2D3748', fontFamily: "'Montserrat', sans-serif", outline: 'none' }}>
          <option value="">Todos los estados</option>
          {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="month" value={filterMes} onChange={e => setFilterMes(e.target.value)}
          style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 7, padding: '.42rem .8rem', fontSize: '.73rem', color: '#2D3748', fontFamily: "'Montserrat', sans-serif", outline: 'none' }} />
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.77rem', fontFamily: "'Montserrat', sans-serif" }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['Nº / Código', 'Fecha', 'Cliente', 'Concepto', 'Base', 'IVA', 'Total', 'Vencim.', 'Estado', ''].map((h, i) => (
                  <th key={i} style={{
                    padding: '.6rem 1rem', textAlign: 'left', fontSize: '.59rem', fontWeight: 800,
                    letterSpacing: '.14em', textTransform: 'uppercase', color: '#718096',
                    borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} style={{ padding: '3rem', textAlign: 'center', color: '#A0AEC0', fontSize: '.8rem' }}>Cargando…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} style={{ padding: '3.5rem', textAlign: 'center', color: '#A0AEC0' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '.6rem' }}>🧾</div>
                  <div style={{ fontSize: '.85rem', fontWeight: 700, color: '#718096' }}>No hay {TAB_LABELS[tab].toLowerCase()}</div>
                  <div style={{ fontSize: '.72rem', marginTop: '.3rem' }}>
                    {search || filterEstado || filterMes ? 'Prueba a cambiar los filtros' : `Crea tu primer${tab === 'FACTURA' ? 'a factura' : tab === 'PRESUPUESTO' ? ' presupuesto' : ' albarán'}`}
                  </div>
                </td></tr>
              ) : filtered.map(v => {
                const badge = BADGE[v.estado] || BADGE.PENDIENTE;
                const base = (v.lineas || []).reduce((s, l) => s + l.unidades * l.precio * (1 - l.descuento / 100), 0);
                const iva = (v.total || 0) - base;
                const vencida = v.vencimiento && v.vencimiento < new Date().toISOString().slice(0, 10) && v.estado === 'PENDIENTE';
                const concepto = (v.lineas?.[0]?.nombre || v.lineas?.[0]?.producto || '—') +
                  (v.lineas?.length > 1 ? ` +${v.lineas.length - 1}` : '');
                return (
                  <tr key={v.id}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8FAFC'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                    style={{ borderBottom: '1px solid #E2E8F0', transition: 'background .1s' }}>
                    <td style={{ padding: '.68rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                        <span style={{ fontWeight: 700, color: '#1A202C' }}>{v.codigo}</span>
                        {v.contratoId && (
                          <span style={{ padding: '.12rem .4rem', borderRadius: 20, fontSize: '.53rem', fontWeight: 700, background: '#EDE9FE', color: '#5B21B6' }}>
                            Recurrente
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '.68rem 1rem', color: '#718096' }}>{v.fecha}</td>
                    <td style={{ padding: '.68rem 1rem', fontWeight: 600, color: '#2D3748' }}>{v.clienteNombre || '—'}</td>
                    <td style={{ padding: '.68rem 1rem', color: '#718096', maxWidth: 200 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{concepto}</span>
                    </td>
                    <td style={{ padding: '.68rem 1rem', color: '#1A202C', fontFamily: "'Space Grotesk', sans-serif" }}>{fmt(base)} €</td>
                    <td style={{ padding: '.68rem 1rem', color: '#718096', fontFamily: "'Space Grotesk', sans-serif" }}>{fmt(iva)} €</td>
                    <td style={{ padding: '.68rem 1rem', fontWeight: 700, color: '#1A202C', fontFamily: "'Space Grotesk', sans-serif", whiteSpace: 'nowrap' }}>{fmt(v.total || 0)} €</td>
                    <td style={{ padding: '.68rem 1rem', color: vencida ? '#EF4444' : '#718096', fontWeight: vencida ? 700 : 400 }}>
                      {v.vencimiento || '—'}
                    </td>
                    <td style={{ padding: '.68rem 1rem' }}>
                      <span style={{ padding: '.18rem .55rem', borderRadius: 20, fontSize: '.6rem', fontWeight: 800, background: badge.bg, color: badge.color }}>
                        {v.estado}
                      </span>
                    </td>
                    <td style={{ padding: '.68rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '.3rem' }}>
                        <button onClick={() => handlePDF(v)}
                          title="Descargar PDF"
                          style={{ padding: '.3rem .6rem', borderRadius: 6, border: '1px solid rgba(0,180,216,.25)', background: 'rgba(0,180,216,.08)', cursor: 'pointer', fontSize: '.62rem', fontWeight: 700, color: '#0090B0', fontFamily: "'Montserrat', sans-serif" }}>
                          🖨 PDF
                        </button>
                        <button onClick={() => handleDelete(v.id)}
                          style={{ padding: '.3rem .55rem', borderRadius: 6, border: '1px solid rgba(239,68,68,.2)', background: '#FEE2E2', cursor: 'pointer', fontSize: '.62rem', fontWeight: 700, color: '#991B1B', fontFamily: "'Montserrat', sans-serif" }}>
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Creación ── */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.52)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflow: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 860, maxHeight: '92vh', display: 'flex', flexDirection: 'column', fontFamily: "'Montserrat', sans-serif", boxShadow: '0 24px 64px rgba(0,0,0,.18)' }}>
            {/* Modal header */}
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontWeight: 900, fontSize: '.92rem', color: '#1A202C' }}>
                  Nueva {form.tipo === 'FACTURA' ? 'Factura' : form.tipo === 'PRESUPUESTO' ? 'Presupuesto' : 'Albarán'}
                </span>
                {/* Tipo selector */}
                <div style={{ display: 'flex', gap: '.3rem' }}>
                  {(['FACTURA', 'PRESUPUESTO', 'ALBARAN'] as Tab[]).map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, tipo: t }))}
                      style={{
                        padding: '.22rem .6rem', borderRadius: 6, border: `1px solid ${form.tipo === t ? '#00B4D8' : '#E2E8F0'}`,
                        background: form.tipo === t ? 'rgba(0,180,216,.1)' : '#F8FAFC',
                        color: form.tipo === t ? '#0090B0' : '#718096',
                        fontSize: '.6rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif",
                      }}>
                      {TAB_LABELS[t].slice(0, -1)}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#718096', padding: '.25rem .4rem', borderRadius: 5 }}>✕</button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '1.4rem 1.5rem', overflowY: 'auto', flex: 1 }}>
              {/* Row 1: Cliente + Número + Fechas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem', marginBottom: '.8rem' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={S.label}>Cliente *</label>
                      <select value={form.clienteId} onChange={e => handleClienteChange(+e.target.value)}
                        style={{ ...S.input, background: '#fff' }}>
                        <option value={0}>— Selecciona —</option>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={S.label}>Número *</label>
                      <input value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                        placeholder="BZ-F-001" style={S.input} />
                    </div>
                    <div>
                      <label style={S.label}>Vencimiento</label>
                      <input type="date" value={form.vencimiento} onChange={e => setForm(f => ({ ...f, vencimiento: e.target.value }))} style={S.input} />
                    </div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
                    <div>
                      <label style={S.label}>Fecha</label>
                      <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} style={S.input} />
                    </div>
                    <div>
                      <label style={S.label}>Forma de pago</label>
                      <select value={form.metodoPago} onChange={e => setForm(f => ({ ...f, metodoPago: e.target.value }))}
                        style={{ ...S.input, background: '#fff' }}>
                        {METODOS.map(m => <option key={m}>{m}</option>)}
                      </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={S.label}>Dirección fiscal cliente</label>
                      <input value={form.direccionFiscal} onChange={e => setForm(f => ({ ...f, direccionFiscal: e.target.value }))}
                        placeholder="Autocompletado desde el cliente…" style={S.input} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Líneas */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.6rem' }}>
                <label style={{ ...S.label, margin: 0 }}>Líneas del documento</label>
                <button onClick={() => setForm(f => ({ ...f, lineas: [...f.lineas, emptyLinea()] }))}
                  style={{ padding: '.28rem .65rem', borderRadius: 6, border: '1px solid rgba(0,180,216,.3)', background: 'rgba(0,180,216,.08)', cursor: 'pointer', fontSize: '.65rem', fontWeight: 700, color: '#0090B0', fontFamily: "'Montserrat', sans-serif" }}>
                  + Añadir línea
                </button>
              </div>
              <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden', marginBottom: '.9rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.72rem', fontFamily: "'Montserrat', sans-serif" }}>
                  <thead>
                    <tr style={{ background: '#0D1B2A' }}>
                      {['Descripción', 'Uds.', 'Precio', 'Dto.%', 'IVA%', 'Total', ''].map((h, i) => (
                        <th key={i} style={{ padding: '.48rem .7rem', textAlign: i === 5 ? 'right' : 'left', color: '#fff', fontSize: '.58rem', letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {form.lineas.map((l, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '.3rem .4rem' }}>
                          <input value={l.nombre} onChange={e => updateLinea(i, 'nombre', e.target.value)}
                            placeholder="Concepto o servicio"
                            style={{ width: '100%', padding: '.35rem .45rem', border: '1px solid #E2E8F0', borderRadius: 5, fontSize: '.73rem', fontFamily: "'Montserrat', sans-serif", outline: 'none' }} />
                        </td>
                        {(['unidades', 'precio', 'descuento', 'iva'] as (keyof LineaVenta)[]).map(f => (
                          <td key={f} style={{ padding: '.3rem .4rem' }}>
                            <input type="number" value={l[f] as number || 0} onChange={e => updateLinea(i, f, +e.target.value)}
                              style={{ width: 65, padding: '.35rem .45rem', border: '1px solid #E2E8F0', borderRadius: 5, fontSize: '.73rem', fontFamily: "'Montserrat', sans-serif", outline: 'none', textAlign: 'right' }} />
                          </td>
                        ))}
                        <td style={{ padding: '.3rem .6rem', fontWeight: 700, color: '#1A202C', textAlign: 'right', whiteSpace: 'nowrap', fontFamily: "'Space Grotesk', sans-serif" }}>
                          {fmt(l.total)} €
                        </td>
                        <td style={{ padding: '.3rem .4rem', textAlign: 'center' }}>
                          {form.lineas.length > 1 && (
                            <button onClick={() => setForm(f => ({ ...f, lineas: f.lineas.filter((_, j) => j !== i) }))}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A0AEC0', fontSize: '1rem', lineHeight: 1, padding: '.15rem', transition: 'color .18s' }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#EF4444'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#A0AEC0'}>
                              ✕
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totales */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '.9rem' }}>
                <div style={{ minWidth: 250, fontSize: '.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.3rem .8rem', color: '#718096' }}>
                    <span>Base imponible</span>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>{fmt(baseForm)} €</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.3rem .8rem', color: '#718096' }}>
                    <span>IVA</span>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>{fmt(ivaForm)} €</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.55rem .8rem', borderTop: '2px solid #E2E8F0', fontWeight: 900, fontSize: '.92rem', color: '#1A202C', marginTop: '.1rem' }}>
                    <span>TOTAL</span>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{fmt(totalForm)} €</span>
                  </div>
                </div>
              </div>

              {/* Notas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.9rem' }}>
                <div>
                  <label style={S.label}>Notas / condiciones de pago</label>
                  <textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                    rows={2} placeholder="Condiciones de pago, observaciones…"
                    style={{ ...S.input, resize: 'vertical' as const, minHeight: 60 }} />
                </div>
                <div>
                  <label style={S.label}>Estado</label>
                  <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
                    style={{ ...S.input, background: '#fff' }}>
                    {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ padding: '.9rem 1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '.6rem', flexShrink: 0 }}>
              <button onClick={() => setModal(false)} style={S.btnGhost}>Cancelar</button>
              <button onClick={() => setPreview(true)} style={{ ...S.btnGhost, color: '#0090B0', borderColor: 'rgba(0,180,216,.3)' }}>
                👁 Vista previa
              </button>
              <button onClick={handleSave} disabled={saving} style={{ ...S.btnPrimary, opacity: saving ? .7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Guardando…' : '💾 Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Vista Previa ── */}
      {preview && modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflow: 'auto' }}>
          <div style={{ background: '#F8FAFC', borderRadius: 16, width: '100%', maxWidth: 860, maxHeight: '92vh', display: 'flex', flexDirection: 'column', fontFamily: "'Montserrat', sans-serif", boxShadow: '0 24px 64px rgba(0,0,0,.22)' }}>
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: '16px 16px 0 0', flexShrink: 0 }}>
              <span style={{ fontWeight: 900, fontSize: '.9rem', color: '#1A202C' }}>Vista previa del documento</span>
              <button onClick={() => setPreview(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#718096' }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '1.5rem' }}
              dangerouslySetInnerHTML={{
                __html: buildPreviewHTML(empresa, { ...form }, selectedCliente),
              }} />
            <div style={{ padding: '.9rem 1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '.6rem', background: '#fff', borderRadius: '0 0 16px 16px', flexShrink: 0 }}>
              <button onClick={() => setPreview(false)} style={S.btnGhost}>← Volver a editar</button>
              <button onClick={() => {
                const tmp = document.createElement('div');
                tmp.innerHTML = buildPreviewHTML(empresa, { ...form }, selectedCliente);
                const w = window.open('', '_blank');
                if (w) {
                  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${form.codigo || 'Documento'}</title><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;900&family=Space+Grotesk:wght@400;700&display=swap" rel="stylesheet"><style>body{margin:0;padding:2rem;background:#F8FAFC;font-family:'Montserrat',sans-serif}@media print{body{background:#fff;padding:0}}</style></head><body>${buildPreviewHTML(empresa, { ...form }, selectedCliente)}</body></html>`);
                  w.document.close();
                  setTimeout(() => w.print(), 500);
                }
              }} style={S.btnPrimary}>
                🖨️ Imprimir / PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
