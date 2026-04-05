import { useEffect, useState } from 'react';
import { getClientes, getVentas, getCobros, getUsuarios, getAdminResumen } from '../api';
import type { Cliente, Venta, Cobro, Usuario } from '../types';

const fmt = (n: number) => (n || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const badge = (est: string) => ({
  COBRADO: { bg: '#D1FAE5', color: '#065F46' },
  PENDIENTE: { bg: '#FEF3C7', color: '#92400E' },
  ADMINISTRADOR: { bg: '#EDE9FE', color: '#5B21B6' },
  GESTOR: { bg: '#DBEAFE', color: '#1D4ED8' },
  OPERARIO: { bg: '#F1F5F9', color: '#475569' },
}[est] || { bg: '#F1F5F9', color: '#475569' });

type Tab = 'resumen' | 'clientes' | 'ventas' | 'cobros' | 'usuarios';

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('resumen');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [cobros, setCobros] = useState<Cobro[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([getClientes(), getVentas(), getCobros(), getUsuarios(), getAdminResumen()])
      .then(([c, v, co, u]) => {
        setClientes(c.data);
        setVentas(v.data);
        setCobros(co.data);
        setUsuarios(u.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const calcTotal = (v: Venta) => v.lineas?.reduce((s, l) => s + (l.total || 0), 0) || 0;
  const totalFacturado = ventas.reduce((s, v) => s + calcTotal(v), 0);
  const totalCobrado = cobros.reduce((s, c) => s + c.cantidad, 0);
  const totalPendiente = totalFacturado - totalCobrado;

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'resumen', label: 'Resumen', icon: '' },
    { key: 'clientes', label: 'Clientes', icon: '' },
    { key: 'ventas', label: 'Ventas', icon: '' },
    { key: 'cobros', label: 'Cobros', icon: '' },
    { key: 'usuarios', label: 'Usuarios', icon: '' },
  ];

  const th = { padding: '.55rem 1rem', textAlign: 'left' as const, color: '#fff', fontWeight: 700, fontSize: '.6rem', letterSpacing: '.06em', textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const };
  const td = { padding: '.6rem 1rem', fontSize: '.73rem', borderBottom: '1px solid #F7FAFC' };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#A0AEC0', fontFamily: "'Montserrat', sans-serif" }}>Cargando panel admin...</div>;

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: '1.7rem', paddingBottom: '.3rem' }}>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1A202C', marginBottom: '.3rem' }}>Panel de Administración</h1>
        <p style={{ fontSize: '.68rem', color: '#718096', marginTop: 0 }}>Vista completa del sistema — solo administradores</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); }}
            style={{
              padding: '.45rem .9rem', borderRadius: 8, cursor: 'pointer',
              fontSize: '.72rem', fontWeight: 700, fontFamily: "'Montserrat', sans-serif",
              background: tab === t.key ? '#0D1B2A' : '#fff',
              color: tab === t.key ? '#00B4D8' : '#718096',
              border: tab === t.key ? '1px solid rgba(0,180,216,.2)' : '1px solid #E2E8F0',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* RESUMEN */}
      {tab === 'resumen' && (
        <div>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Clientes', value: clientes.length, color: '#00B4D8', icon: '' },
              { label: 'Ventas totales', value: ventas.length, color: '#8B5CF6', icon: '' },
              { label: 'Ventas pendientes', value: ventas.filter(v => v.estado === 'PENDIENTE').length, color: '#F59E0B', icon: '' },
              { label: 'Ventas cobradas', value: ventas.filter(v => v.estado === 'COBRADO').length, color: '#10B981', icon: '' },
              { label: 'Usuarios', value: usuarios.length, color: '#EF4444', icon: '' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '1.1rem', borderTop: `3px solid ${s.color}` }}>
                <div style={{ fontSize: '1.4rem', marginBottom: '.4rem' }}>{s.icon}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1A202C' }}>{s.value}</div>
                <div style={{ fontSize: '.62rem', color: '#718096', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: '.2rem' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Financiero */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total facturado', value: `${fmt(totalFacturado)} €`, color: '#1A202C', bg: '#EBF8FF' },
              { label: 'Total cobrado', value: `${fmt(totalCobrado)} €`, color: '#065F46', bg: '#D1FAE5' },
              { label: 'Pendiente de cobro', value: `${fmt(totalPendiente)} €`, color: '#92400E', bg: '#FEF3C7' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '1.2rem' }}>
                <div style={{ fontSize: '.6rem', color: '#718096', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.4rem' }}>{s.label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Últimas ventas */}
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', marginBottom: '1rem' }}>
            <div style={{ padding: '.8rem 1.2rem', borderBottom: '1px solid #E2E8F0', fontWeight: 800, fontSize: '.78rem', color: '#1A202C' }}>
              📄 Últimas 5 ventas
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#0D1B2A' }}>
                {['Código', 'Cliente', 'Total', 'Estado', 'Fecha'].map(h => <th key={h} style={th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {ventas.slice(-5).reverse().map(v => (
                  <tr key={v.id}>
                    <td style={{ ...td, fontWeight: 700, color: '#1A202C' }}>{v.codigo}</td>
                    <td style={td}>{v.clienteNombre}</td>
                    <td style={{ ...td, fontWeight: 700 }}>{fmt(calcTotal(v))} €</td>
                    <td style={td}><span style={{ padding: '.18rem .55rem', borderRadius: 20, fontSize: '.6rem', fontWeight: 700, ...badge(v.estado) }}>{v.estado}</span></td>
                    <td style={{ ...td, color: '#718096' }}>{v.fecha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Últimos cobros */}
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '.8rem 1.2rem', borderBottom: '1px solid #E2E8F0', fontWeight: 800, fontSize: '.78rem', color: '#1A202C' }}>
              Últimos 5 cobros
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#0D1B2A' }}>
                {['#', 'Venta', 'Importe', 'Método', 'Fecha', 'Registrado por'].map(h => <th key={h} style={th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {cobros.slice(-5).reverse().map(c => {
                  const usuario = usuarios.find(u => u.id === c.usuarioId);
                  return (
                    <tr key={c.id}>
                      <td style={{ ...td, color: '#A0AEC0', fontFamily: 'monospace' }}>#{c.id}</td>
                      <td style={{ ...td, fontWeight: 700 }}>{c.ventaCodigo || `#${c.ventaId}`}</td>
                      <td style={{ ...td, fontWeight: 900, color: '#10B981' }}>{fmt(c.cantidad)} €</td>
                      <td style={td}>{c.metodoPago}</td>
                      <td style={{ ...td, color: '#718096' }}>{c.fecha}</td>
                      <td style={td}>{usuario ? `${usuario.nombre} (${usuario.rol})` : `Usuario #${c.usuarioId}`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CLIENTES */}
      {tab === 'clientes' && (
        <div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..."
            style={{ padding: '.45rem .9rem', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: '.75rem', marginBottom: '1rem', width: 250, fontFamily: "'Montserrat', sans-serif", outline: 'none' }} />
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#0D1B2A' }}>
                {['ID', 'Nombre', 'CIF/NIF', 'Tipo', 'Contacto', 'Cargo', 'Teléfono', 'Email', 'Dirección', 'Ventas', 'Facturado'].map(h => <th key={h} style={th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {clientes.filter(c => c.nombre.toLowerCase().includes(search.toLowerCase()) || c.cifNif?.toLowerCase().includes(search.toLowerCase())).map(c => {
                  const ventasCliente = ventas.filter(v => v.clienteId === c.id);
                  const facturado = ventasCliente.reduce((s, v) => s + calcTotal(v), 0);
                  return (
                    <tr key={c.id} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8FAFC'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                      <td style={{ ...td, color: '#A0AEC0', fontFamily: 'monospace' }}>#{c.id}</td>
                      <td style={{ ...td, fontWeight: 700, color: '#1A202C' }}>{c.nombre}</td>
                      <td style={{ ...td, fontFamily: 'monospace', color: '#718096' }}>{c.cifNif}</td>
                      <td style={td}><span style={{ padding: '.18rem .55rem', borderRadius: 20, fontSize: '.6rem', fontWeight: 700, background: '#DBEAFE', color: '#1D4ED8' }}>{c.tipo}</span></td>
                      <td style={td}>{c.personaContacto}</td>
                      <td style={{ ...td, color: '#718096' }}>{c.cargo}</td>
                      <td style={{ ...td, color: '#718096' }}>{c.telefono}</td>
                      <td style={{ ...td, color: '#718096' }}>{c.email}</td>
                      <td style={{ ...td, color: '#718096', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.direccion}</td>
                      <td style={{ ...td, textAlign: 'center' as const, fontWeight: 700 }}>{ventasCliente.length}</td>
                      <td style={{ ...td, fontWeight: 700, color: '#10B981' }}>{fmt(facturado)} €</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VENTAS */}
      {tab === 'ventas' && (
        <div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar venta..."
            style={{ padding: '.45rem .9rem', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: '.75rem', marginBottom: '1rem', width: 250, fontFamily: "'Montserrat', sans-serif", outline: 'none' }} />
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#0D1B2A' }}>
                {['ID', 'Código', 'Cliente', 'Fecha', 'Vencimiento', 'Método', 'Estado', 'Líneas', 'Total', 'Cobrado', 'Pendiente'].map(h => <th key={h} style={th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {ventas.filter(v => v.codigo?.toLowerCase().includes(search.toLowerCase()) || v.clienteNombre?.toLowerCase().includes(search.toLowerCase())).map(v => {
                  const total = calcTotal(v);
                  const cobrado = cobros.filter(c => c.ventaId === v.id).reduce((s, c) => s + c.cantidad, 0);
                  const pend = total - cobrado;
                  return (
                    <tr key={v.id} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8FAFC'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                      <td style={{ ...td, color: '#A0AEC0', fontFamily: 'monospace' }}>#{v.id}</td>
                      <td style={{ ...td, fontWeight: 700, color: '#1A202C' }}>{v.codigo}</td>
                      <td style={td}>{v.clienteNombre}</td>
                      <td style={{ ...td, color: '#718096' }}>{v.fecha}</td>
                      <td style={{ ...td, color: v.vencimiento < new Date().toISOString().slice(0,10) && v.estado === 'PENDIENTE' ? '#EF4444' : '#718096', fontWeight: v.vencimiento < new Date().toISOString().slice(0,10) && v.estado === 'PENDIENTE' ? 700 : 400 }}>{v.vencimiento || '—'}</td>
                      <td style={{ ...td, color: '#718096' }}>{v.metodoPago}</td>
                      <td style={td}><span style={{ padding: '.18rem .55rem', borderRadius: 20, fontSize: '.6rem', fontWeight: 700, ...badge(v.estado) }}>{v.estado}</span></td>
                      <td style={{ ...td, textAlign: 'center' as const }}>{v.lineas?.length || 0}</td>
                      <td style={{ ...td, fontWeight: 700 }}>{fmt(total)} €</td>
                      <td style={{ ...td, color: '#10B981', fontWeight: 700 }}>{fmt(cobrado)} €</td>
                      <td style={{ ...td, color: pend > 0 ? '#F59E0B' : '#10B981', fontWeight: 700 }}>{fmt(pend)} €</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COBROS */}
      {tab === 'cobros' && (
        <div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cobro..."
            style={{ padding: '.45rem .9rem', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: '.75rem', marginBottom: '1rem', width: 250, fontFamily: "'Montserrat', sans-serif", outline: 'none' }} />
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#0D1B2A' }}>
                {['ID', 'Venta', 'Cliente', 'Importe', 'Fecha', 'Método', 'Registrado por', 'Rol'].map(h => <th key={h} style={th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {cobros.filter(c => c.ventaCodigo?.toLowerCase().includes(search.toLowerCase()) || c.metodoPago?.toLowerCase().includes(search.toLowerCase())).map(c => {
                  const venta = ventas.find(v => v.id === c.ventaId);
                  const usuario = usuarios.find(u => u.id === c.usuarioId);
                  return (
                    <tr key={c.id} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8FAFC'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                      <td style={{ ...td, color: '#A0AEC0', fontFamily: 'monospace' }}>#{c.id}</td>
                      <td style={{ ...td, fontWeight: 700, color: '#1A202C' }}>{c.ventaCodigo || `#${c.ventaId}`}</td>
                      <td style={td}>{venta?.clienteNombre || '—'}</td>
                      <td style={{ ...td, fontWeight: 900, color: '#10B981' }}>{fmt(c.cantidad)} €</td>
                      <td style={{ ...td, color: '#718096' }}>{c.fecha}</td>
                      <td style={td}><span style={{ padding: '.18rem .55rem', borderRadius: 20, fontSize: '.6rem', fontWeight: 700, background: '#DBEAFE', color: '#1D4ED8' }}>{c.metodoPago}</span></td>
                      <td style={{ ...td, fontWeight: 700 }}>{usuario?.nombre || `#${c.usuarioId}`}</td>
                      <td style={td}>{usuario && <span style={{ padding: '.18rem .55rem', borderRadius: 20, fontSize: '.6rem', fontWeight: 700, ...badge(usuario.rol) }}>{usuario.rol}</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* USUARIOS */}
      {tab === 'usuarios' && (
        <div>
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#0D1B2A' }}>
                {['ID', 'Username', 'Nombre', 'Apellidos', 'Iniciales', 'Rol', 'Estado', 'Cobros registrados', 'Total cobrado'].map(h => <th key={h} style={th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {usuarios.map(u => {
                  const cobrosUsuario = cobros.filter(c => c.usuarioId === u.id);
                  const totalCobradoUsuario = cobrosUsuario.reduce((s, c) => s + c.cantidad, 0);
                  return (
                    <tr key={u.id} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8FAFC'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                      <td style={{ ...td, color: '#A0AEC0', fontFamily: 'monospace' }}>#{u.id}</td>
                      <td style={{ ...td, fontWeight: 700, color: '#1A202C' }}>{u.email}</td>
                      <td style={td}>{u.nombre}</td>
                      <td style={{ ...td, color: '#718096' }}>{u.apellidos}</td>
                      <td style={{ ...td, textAlign: 'center' as const }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#0090B0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', fontWeight: 900, color: '#fff' }}>{u.iniciales || u.nombre?.slice(0,2).toUpperCase()}</div>
                      </td>
                      <td style={td}><span style={{ padding: '.18rem .55rem', borderRadius: 20, fontSize: '.6rem', fontWeight: 700, ...badge(u.rol) }}>{u.rol}</span></td>
                      <td style={td}><span style={{ padding: '.18rem .55rem', borderRadius: 20, fontSize: '.6rem', fontWeight: 700, background: u.activo ? '#D1FAE5' : '#FEE2E2', color: u.activo ? '#065F46' : '#991B1B' }}>{u.activo ? 'Activo' : 'Inactivo'}</span></td>
                      <td style={{ ...td, textAlign: 'center' as const, fontWeight: 700 }}>{cobrosUsuario.length}</td>
                      <td style={{ ...td, fontWeight: 700, color: '#10B981' }}>{fmt(totalCobradoUsuario)} €</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}