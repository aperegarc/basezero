import { useEffect, useState } from 'react';
import { getClientes, getVentas, getCobros, getContratos } from '../api';
import { useNavigate } from 'react-router-dom';

interface StatCard {
  label: string;
  value: string | number;
  sub: string;
  color: string;
  icon: string;
}

function Stat({ label, value, sub, color, icon }: StatCard) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '1.2rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '12px 12px 0 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '.6rem', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '.4rem', fontFamily: "'Montserrat', sans-serif" }}>{label}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1A202C', lineHeight: 1, fontFamily: "'Montserrat', sans-serif" }}>{value}</div>
          <div style={{ fontSize: '.63rem', color: '#718096', marginTop: '.3rem', fontFamily: "'Montserrat', sans-serif" }}>{sub}</div>
        </div>
        <div style={{ fontSize: '1.5rem', opacity: .5 }}>{icon}</div>
      </div>
    </div>
  );
}

function BarChart({ data, color = '#00B4D8' }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80, padding: '0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{
            width: '100%', borderRadius: '3px 3px 0 0',
            background: i === data.length - 1 ? color : `${color}55`,
            height: `${Math.max((d.value / max) * 70, 2)}px`,
            minHeight: 2,
          }} />
          <div style={{ fontSize: '.5rem', color: '#A0AEC0', fontFamily: "'Montserrat', sans-serif", whiteSpace: 'nowrap' }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ cobrado, total }: { cobrado: number; total: number }) {
  const pct = total > 0 ? cobrado / total : 0;
  const r = 30, cx = 40, cy = 40;
  const circumference = 2 * Math.PI * r;
  const dash = pct * circumference;
  return (
    <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#FEF3C7" strokeWidth="10" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#10B981" strokeWidth="10"
        strokeDasharray={`${dash} ${circumference - dash}`} strokeLinecap="round" />
    </svg>
  );
}

export default function DashboardPage() {
  const [ventas, setVentas] = useState<any[]>([]);
  const [cobros, setCobros] = useState<any[]>([]);
  const [contratos, setContratos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getClientes(), getVentas(), getCobros(), getContratos()])
      .then(([_c, v, co, ct]) => {
        setVentas(v.data);
        setCobros(co.data);
        setContratos(ct.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => (n || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const totalFacturado = ventas.reduce((s: number, v: any) => s + (Number(v.total) || 0), 0);
  const totalCobrado = cobros.reduce((s: number, c: any) => s + (Number(c.cantidad) || 0), 0);
  const ventasPendientes = ventas.filter((v: any) => v.estado === 'PENDIENTE');
  const totalPendiente = ventasPendientes.reduce((s: number, v: any) => s + (Number(v.total) || 0), 0);
  const contratosActivos = contratos.filter((c: any) => c.activo);
  const contratosPendientes = contratos.filter((c: any) => c.pendienteGeneracion && c.activo);
  const mrr = contratosActivos.reduce((s: number, c: any) => s + (Number(c.totalConIva) || 0), 0);
  const hoy = new Date().toISOString().slice(0, 10);
  const ventasVencidas = ventasPendientes.filter((v: any) => v.vencimiento && v.vencimiento < hoy);

  const buildMonthData = (items: any[], campo: string) => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString('es-ES', { month: 'short' });
      const value = items
        .filter((x: any) => x[campo] && String(x[campo]).startsWith(key))
        .reduce((s: number, x: any) => s + (Number(x.total || x.cantidad) || 0), 0);
      return { label, value };
    });
  };

  const mesesFacturacion = buildMonthData(ventas, 'fecha');
  const mesesCobros = buildMonthData(cobros, 'fecha');

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#A0AEC0', fontSize: '.8rem', fontFamily: "'Montserrat', sans-serif" }}>
      Cargando dashboard...
    </div>
  );

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif" }}>

      {/* Alerts */}
      {(ventasVencidas.length > 0 || contratosPendientes.length > 0) && (
        <div style={{ marginBottom: '1.2rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          {ventasVencidas.length > 0 && (
            <div onClick={() => navigate('/ventas')} style={{ background: '#FEE2E2', border: '1px solid rgba(239,68,68,.25)', borderRadius: 10, padding: '.7rem 1rem', display: 'flex', alignItems: 'center', gap: '.6rem', cursor: 'pointer' }}>
              <span></span>
              <div>
                <div style={{ fontSize: '.73rem', fontWeight: 800, color: '#991B1B' }}>{ventasVencidas.length} {ventasVencidas.length === 1 ? 'factura vencida' : 'facturas vencidas'} sin cobrar</div>
                <div style={{ fontSize: '.62rem', color: '#B91C1C', marginTop: '.1rem' }}>Total: {fmt(ventasVencidas.reduce((s: number, v: any) => s + Number(v.total || 0), 0))} € · Haz clic para ver</div>
              </div>
            </div>
          )}
          {contratosPendientes.length > 0 && (
            <div onClick={() => navigate('/contratos')} style={{ background: '#FEF3C7', border: '1px solid rgba(245,158,11,.25)', borderRadius: 10, padding: '.7rem 1rem', display: 'flex', alignItems: 'center', gap: '.6rem', cursor: 'pointer' }}>
              <span></span>
              <div>
                <div style={{ fontSize: '.73rem', fontWeight: 800, color: '#92400E' }}>{contratosPendientes.length} {contratosPendientes.length === 1 ? 'contrato pendiente' : 'contratos pendientes'} de generar</div>
                <div style={{ fontSize: '.62rem', color: '#B45309', marginTop: '.1rem' }}>Se generarán automáticamente · Haz clic para gestionar</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.2rem' }}>
        <Stat label="Total facturado" value={`${fmt(totalFacturado)} €`} sub={`${ventas.length} facturas`} color="#00B4D8" icon="" />
        <Stat label="Total cobrado" value={`${fmt(totalCobrado)} €`} sub={`${cobros.length} cobros`} color="#10B981" icon="" />
        <Stat label="Pendiente de cobro" value={`${fmt(totalPendiente)} €`} sub={`${ventasPendientes.length} facturas`} color={totalPendiente > 0 ? '#F59E0B' : '#10B981'} icon="" />
        <Stat label="MRR recurrente" value={`${fmt(mrr)} €`} sub={`${contratosActivos.length} contratos activos`} color="#8B5CF6" icon="" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 280px', gap: '1rem', marginBottom: '1.2rem' }}>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '.9rem 1.2rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '.78rem', fontWeight: 800, color: '#1A202C' }}>Facturación mensual</span>
            <span style={{ fontSize: '.65rem', color: '#A0AEC0' }}>últimos 6 meses</span>
          </div>
          <div style={{ padding: '1rem 1.2rem .5rem' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1A202C', marginBottom: '.1rem' }}>{fmt(mesesFacturacion[5]?.value || 0)} €</div>
            <div style={{ fontSize: '.62rem', color: '#718096', marginBottom: '.8rem' }}>este mes</div>
            <BarChart data={mesesFacturacion} color="#00B4D8" />
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '.9rem 1.2rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '.78rem', fontWeight: 800, color: '#1A202C' }}>Cobros recibidos</span>
            <span style={{ fontSize: '.65rem', color: '#A0AEC0' }}>últimos 6 meses</span>
          </div>
          <div style={{ padding: '1rem 1.2rem .5rem' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1A202C', marginBottom: '.1rem' }}>{fmt(mesesCobros[5]?.value || 0)} €</div>
            <div style={{ fontSize: '.62rem', color: '#718096', marginBottom: '.8rem' }}>este mes</div>
            <BarChart data={mesesCobros} color="#10B981" />
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '.9rem 1.2rem', borderBottom: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '.78rem', fontWeight: 800, color: '#1A202C' }}>Ratio de cobro</span>
          </div>
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.5rem' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DonutChart cobrado={totalCobrado} total={totalFacturado} />
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <div style={{ fontSize: '.8rem', fontWeight: 900, color: '#1A202C', transform: 'rotate(90deg)' }}>
                  {totalFacturado > 0 ? Math.round((totalCobrado / totalFacturado) * 100) : 0}%
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '.62rem', fontWeight: 700 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                <span style={{ color: '#065F46' }}>Cobrado</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FEF3C7', border: '1px solid #F59E0B' }} />
                <span style={{ color: '#92400E' }}>Pendiente</span>
              </div>
            </div>
            <div style={{ fontSize: '.63rem', color: '#718096', textAlign: 'center', lineHeight: 1.5 }}>
              <strong style={{ color: '#10B981' }}>{fmt(totalCobrado)} €</strong> cobrado<br />
              <strong style={{ color: '#F59E0B' }}>{fmt(totalPendiente)} €</strong> pendiente
            </div>
          </div>
        </div>
      </div>

      {/* Bottom tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Facturas pendientes */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '.9rem 1.2rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '.78rem', fontWeight: 800, color: '#1A202C' }}>Facturas pendientes</span>
            <button onClick={() => navigate('/ventas')} style={{ fontSize: '.62rem', color: '#00B4D8', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}>Ver todas →</button>
          </div>
          {ventasPendientes.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#A0AEC0', fontSize: '.75rem' }}>No hay facturas pendientes</div>
          ) : ventasPendientes.slice(0, 6).map((v: any) => {
            const vencida = v.vencimiento && v.vencimiento < hoy;
            return (
              <div key={v.id} style={{ padding: '.65rem 1.2rem', borderBottom: '1px solid #F7FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: vencida ? '#FFF5F5' : '#fff' }}>
                <div>
                  <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#1A202C', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                    {vencida && <span style={{ fontSize: '.55rem' }}></span>}
                    {v.codigo}
                    {v.contratoId && <span style={{ fontSize: '.52rem', background: '#EDE9FE', color: '#5B21B6', padding: '.1rem .3rem', borderRadius: 8, fontWeight: 700 }}>Contrato</span>}
                  </div>
                  <div style={{ fontSize: '.6rem', color: '#718096', marginTop: '.1rem' }}>{v.clienteNombre || '—'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '.76rem', fontWeight: 900, color: vencida ? '#EF4444' : '#1A202C' }}>{fmt(v.total || 0)} €</div>
                  <div style={{ fontSize: '.57rem', color: vencida ? '#EF4444' : '#A0AEC0', marginTop: '.1rem' }}>{vencida ? 'Vencida' : `Vence: ${v.vencimiento || '—'}`}</div>
                </div>
              </div>
            );
          })}
          {ventasPendientes.length > 6 && (
            <div style={{ padding: '.5rem 1.2rem', fontSize: '.63rem', color: '#A0AEC0', textAlign: 'center' }}>+{ventasPendientes.length - 6} más</div>
          )}
        </div>

        {/* Contratos activos */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '.9rem 1.2rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '.78rem', fontWeight: 800, color: '#1A202C' }}>Contratos recurrentes</span>
            <button onClick={() => navigate('/contratos')} style={{ fontSize: '.62rem', color: '#00B4D8', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}>Ver todos →</button>
          </div>
          {contratosActivos.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#A0AEC0', fontSize: '.75rem' }}>No hay contratos activos</div>
          ) : contratosActivos.slice(0, 6).map((c: any) => (
            <div key={c.id} style={{ padding: '.65rem 1.2rem', borderBottom: '1px solid #F7FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: c.pendienteGeneracion ? '#FFFBEB' : '#fff' }}>
              <div>
                <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#1A202C', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                  {c.pendienteGeneracion && <span style={{ fontSize: '.55rem' }}></span>}
                  {c.nombre}
                </div>
                <div style={{ fontSize: '.6rem', color: '#718096', marginTop: '.1rem' }}>{c.clienteNombre}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '.76rem', fontWeight: 900, color: '#8B5CF6' }}>{fmt(c.totalConIva || 0)} €</div>
                <div style={{ fontSize: '.57rem', color: '#A0AEC0', marginTop: '.1rem' }}>día {c.diaGeneracion} · /mes</div>
              </div>
            </div>
          ))}
          {contratosActivos.length > 6 && (
            <div style={{ padding: '.5rem 1.2rem', fontSize: '.63rem', color: '#A0AEC0', textAlign: 'center' }}>+{contratosActivos.length - 6} más</div>
          )}
        </div>
      </div>
    </div>
  );
}