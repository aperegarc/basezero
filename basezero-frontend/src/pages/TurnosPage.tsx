import { useEffect, useState } from 'react';
import { getTurnos, getTurnosByEmpleado, createTurno, updateTurno, deleteTurno, getEmpleados } from '../api';
import { useAuthStore } from '../store/authStore';

interface Turno {
  id: number;
  empleadoId: number;
  empleadoNombre: string;
  fecha: string;
  horaEntrada: string;
  horaSalida: string;
  notas?: string;
}

const EMPTY = { empleadoId: 0, fecha: new Date().toISOString().slice(0, 10), horaEntrada: '09:00', horaSalida: '17:00', notas: '' };

function calcHoras(entrada: string, salida: string): string {
  try {
    const [h1, m1] = entrada.split(':').map(Number);
    const [h2, m2] = salida.split(':').map(Number);
    const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (mins <= 0) return '—';
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  } catch { return '—'; }
}

export default function TurnosPage() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filtroEmpleado, setFiltroEmpleado] = useState('TODOS');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const { user } = useAuthStore();

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = async () => {
    try {
      if (user?.rol !== 'EMPLEADO') {
        const [t, e] = await Promise.all([getTurnos(), getEmpleados()]);
        setTurnos(t.data);
        setEmpleados(e.data);
      } else if (user?.id) {
        const t = await getTurnosByEmpleado(user.id);
        setTurnos(t.data);
        setEmpleados([]);
      }
    } catch (err) {
      showToast('Error al cargar datos', 'err');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ ...EMPTY, empleadoId: empleados[0]?.id || 0 }); setEditing(null); setModal(true); };
  const openEdit = (t: Turno) => {
    setForm({ empleadoId: t.empleadoId, fecha: t.fecha, horaEntrada: t.horaEntrada, horaSalida: t.horaSalida, notas: t.notas || '' });
    setEditing(t.id); setModal(true);
  };

  const handleSave = async () => {
    if (!form.empleadoId || !form.fecha) { showToast('Selecciona empleado y fecha', 'err'); return; }
    setSaving(true);
    try {
      if (editing) { await updateTurno(editing, form); showToast('Turno actualizado'); }
      else { await createTurno(form); showToast('Turno creado'); }
      setModal(false); await load();
    } catch { showToast('Error al guardar', 'err'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este turno?')) return;
    try { await deleteTurno(id); showToast('Turno eliminado'); await load(); }
    catch { showToast('Error al eliminar', 'err'); }
  };

  const filtered = turnos.filter(t => {
    const matchEmp = filtroEmpleado === 'TODOS' || String(t.empleadoId) === filtroEmpleado;
    const matchFecha = !filtroFecha || t.fecha === filtroFecha;
    return matchEmp && matchFecha;
  });

  // Agrupar por fecha
  const grouped = filtered.reduce((acc: Record<string, Turno[]>, t) => {
    if (!acc[t.fecha]) acc[t.fecha] = [];
    acc[t.fecha].push(t);
    return acc;
  }, {});
  const fechasOrdenadas = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const totalHorasMes = (() => {
    const mes = new Date().toISOString().slice(0, 7);
    return turnos.filter(t => t.fecha.startsWith(mes)).reduce((s, t) => {
      const [h1, m1] = t.horaEntrada.split(':').map(Number);
      const [h2, m2] = t.horaSalida.split(':').map(Number);
      return s + Math.max(0, (h2 * 60 + m2) - (h1 * 60 + m1));
    }, 0);
  })();

  const inputStyle = { width: '100%', padding: '.55rem .8rem', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: '.76rem', color: '#2D3748', fontFamily: "'Montserrat', sans-serif", outline: 'none', background: '#fff' };
  const labelStyle = { display: 'block' as const, fontSize: '.62rem', fontWeight: 700, color: '#718096', marginBottom: '.3rem', textTransform: 'uppercase' as const, letterSpacing: '.06em' };

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999, background: toast.type === 'ok' ? '#D1FAE5' : '#FEE2E2', border: `1px solid ${toast.type === 'ok' ? 'rgba(16,185,129,.3)' : 'rgba(239,68,68,.3)'}`, color: toast.type === 'ok' ? '#065F46' : '#991B1B', padding: '.7rem 1.2rem', borderRadius: 10, fontSize: '.75rem', fontWeight: 700 }}>
          {toast.msg}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.2rem' }}>
        {[
          { label: 'Turnos este mes', value: turnos.filter(t => t.fecha.startsWith(new Date().toISOString().slice(0, 7))).length, color: '#00B4D8', icon: '' },
          { label: 'Horas este mes', value: `${Math.floor(totalHorasMes / 60)}h ${totalHorasMes % 60}m`, color: '#10B981', icon: '' },
          { label: 'Empleados con turno hoy', value: turnos.filter(t => t.fecha === new Date().toISOString().slice(0, 10)).length, color: '#8B5CF6', icon: '' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '1rem 1.2rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.color, borderRadius: '12px 12px 0 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '.6rem', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '.3rem' }}>{s.label}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1A202C' }}>{s.value}</div>
              </div>
              <span style={{ fontSize: '1.3rem', opacity: .6 }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '.8rem', paddingBottom: '.4rem' }}>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 900, color: '#1A202C' }}>Turnos</h1>
          <p style={{ fontSize: '.68rem', color: '#718096', marginTop: '.2rem' }}>{turnos.length} turnos registrados</p>
        </div>
        <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={filtroEmpleado} onChange={e => setFiltroEmpleado(e.target.value)} style={{ padding: '.42rem .8rem', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: '.73rem', color: '#2D3748', background: '#fff', cursor: 'pointer', outline: 'none' }}>
            <option value="TODOS">Todos los empleados</option>
            {empleados.map(e => <option key={e.id} value={String(e.id)}>{e.nombre}</option>)}
          </select>
          <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} style={{ padding: '.42rem .8rem', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: '.73rem', color: '#2D3748', background: '#fff', outline: 'none', cursor: 'pointer' }} />
          {filtroFecha && <button onClick={() => setFiltroFecha('')} style={{ padding: '.42rem .6rem', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: '.7rem', color: '#718096' }}>✕ Limpiar</button>}
          {user?.rol !== 'EMPLEADO' && (
            <button onClick={openNew} style={{ padding: '.48rem .95rem', borderRadius: 7, border: 'none', background: '#00B4D8', cursor: 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#0D1B2A' }}>＋ Añadir turno</button>
          )}
        </div>
      </div>

      {/* Turnos agrupados por fecha */}
      {loading ? (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '2rem', textAlign: 'center', color: '#A0AEC0' }}>Cargando...</div>
      ) : fechasOrdenadas.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '2rem', textAlign: 'center', color: '#A0AEC0' }}>No hay turnos con el filtro seleccionado</div>
      ) : fechasOrdenadas.map(fecha => {
        const esHoy = fecha === new Date().toISOString().slice(0, 10);
        const fechaLabel = new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        return (
          <div key={fecha} style={{ marginBottom: '1rem', background: '#fff', border: `1px solid ${esHoy ? '#00B4D8' : '#E2E8F0'}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '.7rem 1.2rem', background: esHoy ? 'rgba(0,180,216,.06)' : '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              <span style={{ fontSize: '.78rem', fontWeight: 800, color: esHoy ? '#0090B0' : '#1A202C', textTransform: 'capitalize' }}>{fechaLabel}</span>
              {esHoy && <span style={{ padding: '.15rem .45rem', borderRadius: 20, fontSize: '.58rem', fontWeight: 700, background: '#00B4D8', color: '#fff' }}>HOY</span>}
              <span style={{ marginLeft: 'auto', fontSize: '.65rem', color: '#718096' }}>{grouped[fecha].length} {grouped[fecha].length === 1 ? 'turno' : 'turnos'}</span>
            </div>
            <div>
              {grouped[fecha].map(t => (
                <div key={t.id} style={{ padding: '.65rem 1.2rem', borderBottom: '1px solid #F7FAFC', display: 'flex', alignItems: 'center', gap: '1rem' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8FAFC'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                >
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0D1B2A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem', fontWeight: 900, color: '#00B4D8', flexShrink: 0 }}>
                    {t.empleadoNombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '.75rem', fontWeight: 700, color: '#1A202C' }}>{t.empleadoNombre}</div>
                    {t.notas && <div style={{ fontSize: '.62rem', color: '#A0AEC0', marginTop: '.1rem' }}>{t.notas}</div>}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#1A202C' }}>{t.horaEntrada} — {t.horaSalida}</div>
                    <div style={{ fontSize: '.6rem', color: '#10B981', fontWeight: 700 }}>{calcHoras(t.horaEntrada, t.horaSalida)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '.3rem' }}>
                    {user?.rol !== 'EMPLEADO' && (
                      <>
                        <button onClick={() => openEdit(t)} style={{ padding: '.3rem .5rem', borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: '.62rem', fontWeight: 700, color: '#2D3748' }}>Editar</button>
                        <button onClick={() => handleDelete(t.id)} style={{ padding: '.3rem .5rem', borderRadius: 6, border: '1px solid rgba(239,68,68,.2)', background: '#FEE2E2', cursor: 'pointer', fontSize: '.62rem', fontWeight: 700, color: '#991B1B' }}>Eliminar</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 460 }}>
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '.85rem', color: '#1A202C' }}>{editing ? 'Editar turno' : 'Añadir turno'}</span>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#718096' }}>✕</button>
            </div>
            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Empleado *</label>
                <select value={form.empleadoId} onChange={e => setForm({ ...form, empleadoId: +e.target.value })} style={inputStyle}>
                  <option value={0}>— Seleccionar —</option>
                  {empleados.filter(e => e.activo).map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Fecha *</label>
                <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} style={inputStyle} onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
              <div>
                <label style={labelStyle}>Hora entrada *</label>
                <input type="time" value={form.horaEntrada} onChange={e => setForm({ ...form, horaEntrada: e.target.value })} style={inputStyle} onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
              <div>
                <label style={labelStyle}>Hora salida *</label>
                <input type="time" value={form.horaSalida} onChange={e => setForm({ ...form, horaSalida: e.target.value })} style={inputStyle} onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
              {form.horaEntrada && form.horaSalida && (
                <div style={{ gridColumn: '1/-1', background: 'rgba(0,180,216,.06)', border: '1px solid rgba(0,180,216,.2)', borderRadius: 8, padding: '.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '.72rem', color: '#0090B0', fontWeight: 600 }}>Duración total</span>
                  <span style={{ fontSize: '1rem', fontWeight: 900, color: '#0D1B2A' }}>{calcHoras(form.horaEntrada, form.horaSalida)}</span>
                </div>
              )}
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Notas</label>
                <input value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} style={inputStyle} onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '.6rem' }}>
              <button onClick={() => setModal(false)} style={{ padding: '.48rem .95rem', borderRadius: 7, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#2D3748' }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '.48rem .95rem', borderRadius: 7, border: 'none', background: '#00B4D8', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#0D1B2A', opacity: saving ? .7 : 1 }}>
                {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear turno'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}