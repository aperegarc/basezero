import { useEffect, useState } from 'react';
import {
  getTareas,
  getTareasByEmpleado,
  createTarea,
  deleteTarea,
  revisarTarea,
  getEmpleados,
  getClientes,
  programarTareas,
  completarTareaSinAdjunto,
  subirVideoTarea,
  subirFotoTarea,
} from '../api';
import type { DiaSemana, TipoAdjuntoTarea } from '../api';
import { useAuthStore } from '../store/authStore';

interface Tarea {
  id: number;
  empleadoId: number;
  empleadoNombre: string;
  clienteId: number;
  clienteNombre: string;
  zona: string;
  fecha: string;
  estado: 'PENDIENTE' | 'COMPLETADA' | 'APROBADA' | 'RECHAZADA';
  tipoAdjunto?: TipoAdjuntoTarea;
  videoUrl?: string;
  comentarioEmpleado?: string;
  comentarioGestor?: string;
  fechaCompletada?: string;
  notas?: string;
}

const estadoBadge = (estado: string) => ({
  PENDIENTE: { bg: '#FEF3C7', color: '#92400E', label: 'Pendiente' },
  COMPLETADA: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Completada' },
  APROBADA: { bg: '#D1FAE5', color: '#065F46', label: 'Aprobada' },
  RECHAZADA: { bg: '#FEE2E2', color: '#991B1B', label: 'Rechazada' },
}[estado] || { bg: '#F1F5F9', color: '#475569', label: estado });

const EMPTY = {
  empleadoId: 0,
  clienteId: 0,
  zona: '',
  fecha: new Date().toISOString().slice(0, 10),
  notas: '',
  tipoAdjunto: 'VIDEO' as TipoAdjuntoTarea,
};

const DIAS_SEMANA: { key: DiaSemana; label: string; corto: string }[] = [
  { key: 'MONDAY',    label: 'Lunes',     corto: 'L' },
  { key: 'TUESDAY',   label: 'Martes',    corto: 'M' },
  { key: 'WEDNESDAY', label: 'Miércoles', corto: 'X' },
  { key: 'THURSDAY',  label: 'Jueves',    corto: 'J' },
  { key: 'FRIDAY',    label: 'Viernes',   corto: 'V' },
  { key: 'SATURDAY',  label: 'Sábado',    corto: 'S' },
  { key: 'SUNDAY',    label: 'Domingo',   corto: 'D' },
];

const PROG_EMPTY = {
  empleadoIds: [] as number[],
  clienteId: 0,
  zona: '',
  fechaInicio: new Date().toISOString().slice(0, 10),
  fechaFin: new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10),
  diasSemana: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as DiaSemana[],
  notas: '',
  evitarDuplicados: true,
  tipoAdjunto: 'VIDEO' as TipoAdjuntoTarea,
};

const ADJUNTO_LABEL: Record<TipoAdjuntoTarea, string> = {
  NINGUNO: 'Sin archivo',
  FOTO: 'Foto',
  VIDEO: 'Vídeo',
};

const mediaSrc = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const viteApi = import.meta.env.VITE_API_URL as string | undefined;
  if (viteApi?.startsWith('http')) {
    const origin = viteApi.replace(/\/api\/?$/, '');
    return `${origin.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  }
  return `http://localhost:8080/${path.replace(/^\//, '')}`;
};

export default function TareasPage() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [progModal, setProgModal] = useState(false);
  const [progForm, setProgForm] = useState(PROG_EMPTY);
  const [detalleModal, setDetalleModal] = useState<Tarea | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [comentarioGestor, setComentarioGestor] = useState('');
  const [comentarioEmpleado, setComentarioEmpleado] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const { user } = useAuthStore();

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = async () => {
    try {
      console.log('User:', user);
      if (user?.rol === 'EMPLEADO' && user?.id) {
        const t = await getTareasByEmpleado(user.id);
        setTareas(t.data);
        setEmpleados([]);
        setClientes([]);
      } else if (user?.rol !== 'EMPLEADO') {
        const [t, e, c] = await Promise.all([
          getTareas(),
          getEmpleados(),
          getClientes()
        ]);
        setTareas(t.data);
        setEmpleados(e.data);
        setClientes(c.data);
      }
    } catch (err) {
      showToast('Error al cargar datos', 'err');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.empleadoId || !form.clienteId || !form.zona) { showToast('Completa todos los campos obligatorios', 'err'); return; }
    setSaving(true);
    try { await createTarea(form); showToast('Tarea asignada'); setModal(false); await load(); }
    catch { showToast('Error al crear la tarea', 'err'); }
    finally { setSaving(false); }
  };

  const handleProgramar = async () => {
    if (progForm.empleadoIds.length === 0) { showToast('Selecciona al menos un empleado', 'err'); return; }
    if (!progForm.clienteId) { showToast('Selecciona un cliente', 'err'); return; }
    if (!progForm.zona.trim()) { showToast('Indica la zona o servicio', 'err'); return; }
    if (progForm.diasSemana.length === 0) { showToast('Selecciona al menos un día de la semana', 'err'); return; }
    if (new Date(progForm.fechaFin) < new Date(progForm.fechaInicio)) { showToast('La fecha fin no puede ser anterior a la inicio', 'err'); return; }
    setSaving(true);
    try {
      const res = await programarTareas(progForm);
      const { totalCreados, totalOmitidos, totalFallidos } = res.data;
      const partes = [`${totalCreados} creadas`];
      if (totalOmitidos) partes.push(`${totalOmitidos} omitidas (duplicadas)`);
      if (totalFallidos) partes.push(`${totalFallidos} con error`);
      showToast(partes.join(' · '), totalFallidos ? 'err' : 'ok');
      setProgModal(false);
      await load();
    } catch { showToast('Error al programar las tareas', 'err'); }
    finally { setSaving(false); }
  };

  const toggleEmpleadoProg = (id: number) => {
    setProgForm(p => ({
      ...p,
      empleadoIds: p.empleadoIds.includes(id)
        ? p.empleadoIds.filter(e => e !== id)
        : [...p.empleadoIds, id]
    }));
  };

  const toggleDiaProg = (dia: DiaSemana) => {
    setProgForm(p => ({
      ...p,
      diasSemana: p.diasSemana.includes(dia)
        ? p.diasSemana.filter(d => d !== dia)
        : [...p.diasSemana, dia]
    }));
  };

  const presetDias = (dias: DiaSemana[]) => setProgForm(p => ({ ...p, diasSemana: dias }));

  const totalTareasProg = (() => {
    if (!progForm.fechaInicio || !progForm.fechaFin || progForm.empleadoIds.length === 0 || progForm.diasSemana.length === 0) return 0;
    const inicio = new Date(progForm.fechaInicio + 'T00:00:00');
    const fin = new Date(progForm.fechaFin + 'T00:00:00');
    if (fin < inicio) return 0;
    const diasMap: Record<number, DiaSemana> = { 0: 'SUNDAY', 1: 'MONDAY', 2: 'TUESDAY', 3: 'WEDNESDAY', 4: 'THURSDAY', 5: 'FRIDAY', 6: 'SATURDAY' };
    let dias = 0;
    for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
      if (progForm.diasSemana.includes(diasMap[d.getDay()])) dias++;
    }
    return dias * progForm.empleadoIds.length;
  })();

  const handleRevisar = async (id: number, aprobada: boolean) => {
    try {
      await revisarTarea(id, aprobada, comentarioGestor);
      showToast(aprobada ? 'Tarea aprobada' : 'Tarea rechazada');
      setDetalleModal(null); setComentarioGestor(''); await load();
    } catch { showToast('Error al revisar', 'err'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    try { await deleteTarea(id); showToast('Tarea eliminada'); await load(); }
    catch { showToast('Error al eliminar', 'err'); }
  };

  const handleCompletarEmpleado = async () => {
    if (!detalleModal) return;
    const tipo: TipoAdjuntoTarea = detalleModal.tipoAdjunto ?? 'VIDEO';
    if (tipo === 'FOTO' || tipo === 'VIDEO') {
      if (!mediaFile) {
        showToast(tipo === 'FOTO' ? 'Selecciona una foto' : 'Selecciona un vídeo', 'err');
        return;
      }
    }
    setSaving(true);
    try {
      const com = comentarioEmpleado.trim() || undefined;
      if (tipo === 'NINGUNO') {
        await completarTareaSinAdjunto(detalleModal.id, com);
      } else if (tipo === 'FOTO') {
        await subirFotoTarea(detalleModal.id, mediaFile!, com);
      } else {
        await subirVideoTarea(detalleModal.id, mediaFile!, com);
      }
      showToast('Tarea completada');
      setDetalleModal(null);
      setComentarioEmpleado('');
      setMediaFile(null);
      await load();
    } catch {
      showToast('Error al completar la tarea', 'err');
    } finally {
      setSaving(false);
    }
  };

  const pendientesRevision = tareas.filter(t => t.estado === 'COMPLETADA').length;

  const filtered = tareas.filter(t => {
    const matchSearch = t.empleadoNombre.toLowerCase().includes(search.toLowerCase()) ||
      t.clienteNombre.toLowerCase().includes(search.toLowerCase()) ||
      t.zona.toLowerCase().includes(search.toLowerCase());
    const matchEstado = filtroEstado === 'TODOS' || t.estado === filtroEstado;
    return matchSearch && matchEstado;
  });

  const inputStyle = { width: '100%', padding: '.55rem .8rem', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: '.76rem', color: '#2D3748', fontFamily: "'Montserrat', sans-serif", outline: 'none', background: '#fff' };
  const labelStyle = { display: 'block' as const, fontSize: '.62rem', fontWeight: 700, color: '#718096', marginBottom: '.3rem', textTransform: 'uppercase' as const, letterSpacing: '.06em' };

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999, background: toast.type === 'ok' ? '#D1FAE5' : '#FEE2E2', border: `1px solid ${toast.type === 'ok' ? 'rgba(16,185,129,.3)' : 'rgba(239,68,68,.3)'}`, color: toast.type === 'ok' ? '#065F46' : '#991B1B', padding: '.7rem 1.2rem', borderRadius: 10, fontSize: '.75rem', fontWeight: 700 }}>
          {toast.msg}
        </div>
      )}

      {/* Alerta revisión pendiente */}
      {pendientesRevision > 0 && (
        <div style={{ background: '#DBEAFE', border: '1px solid rgba(59,130,246,.25)', borderRadius: 10, padding: '.7rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          <span></span>
          <span style={{ fontSize: '.73rem', fontWeight: 700, color: '#1D4ED8' }}>
            {pendientesRevision} {pendientesRevision === 1 ? 'tarea completada' : 'tareas completadas'} esperando tu revisión
          </span>
          <button onClick={() => setFiltroEstado('COMPLETADA')} style={{ marginLeft: 'auto', fontSize: '.65rem', fontWeight: 700, color: '#1D4ED8', background: 'none', border: '1px solid rgba(59,130,246,.3)', borderRadius: 6, padding: '.25rem .6rem', cursor: 'pointer' }}>
            Ver ahora →
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '.8rem', paddingBottom: '.4rem' }}>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 900, color: '#1A202C', marginBottom: '.2rem' }}>Tareas</h1>
          <p style={{ fontSize: '.68rem', color: '#718096', marginTop: 0 }}>{tareas.length} tareas registradas</p>
        </div>
        <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '.4rem .8rem' }}>
            <span style={{ color: '#A0AEC0' }}></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar tarea..." style={{ border: 'none', background: 'none', fontSize: '.76rem', color: '#2D3748', outline: 'none', width: 150 }} />
          </div>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={{ padding: '.42rem .8rem', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: '.73rem', color: '#2D3748', background: '#fff', cursor: 'pointer', outline: 'none' }}>
            <option value="TODOS">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="COMPLETADA">Completada</option>
            <option value="APROBADA">Aprobada</option>
            <option value="RECHAZADA">Rechazada</option>
          </select>
          {user?.rol !== 'EMPLEADO' && (
            <>
              <button onClick={() => { setProgForm({ ...PROG_EMPTY, clienteId: clientes[0]?.id || 0 }); setProgModal(true); }} style={{ padding: '.48rem .95rem', borderRadius: 7, border: '1px solid #00B4D8', background: '#fff', cursor: 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#0090B0' }}>
                📅 Programación
              </button>
              <button onClick={() => { setForm({ ...EMPTY, empleadoId: empleados[0]?.id || 0, clienteId: clientes[0]?.id || 0, tipoAdjunto: 'VIDEO' }); setModal(true); }} style={{ padding: '.48rem .95rem', borderRadius: 7, border: 'none', background: '#00B4D8', cursor: 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#0D1B2A' }}>
                ＋ Asignar tarea
              </button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.75rem' }}>
            <thead>
              <tr style={{ background: '#0D1B2A' }}>
                {['Empleado', 'Cliente', 'Zona / Servicio', 'Fecha', 'Estado', 'Evidencia', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '.6rem 1rem', textAlign: 'left', color: '#fff', fontWeight: 700, fontSize: '.62rem', letterSpacing: '.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#A0AEC0' }}>Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#A0AEC0' }}>No hay tareas{search ? ' con ese filtro' : ''}</td></tr>
              ) : filtered.map(t => {
                const badge = estadoBadge(t.estado);
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid #F7FAFC' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8FAFC'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                  >
                    <td style={{ padding: '.65rem 1rem', fontWeight: 600, color: '#1A202C' }}>{t.empleadoNombre}</td>
                    <td style={{ padding: '.65rem 1rem', color: '#2D3748' }}>{t.clienteNombre}</td>
                    <td style={{ padding: '.65rem 1rem', color: '#2D3748' }}>{t.zona}</td>
                    <td style={{ padding: '.65rem 1rem', color: '#718096' }}>{t.fecha}</td>
                    <td style={{ padding: '.65rem 1rem' }}>
                      <span style={{ padding: '.2rem .6rem', borderRadius: 20, fontSize: '.6rem', fontWeight: 700, background: badge.bg, color: badge.color }}>{badge.label}</span>
                    </td>
                    <td style={{ padding: '.65rem 1rem' }}>
                      <span style={{ padding: '.18rem .5rem', borderRadius: 20, fontSize: '.58rem', fontWeight: 700, background: '#E0F2FE', color: '#0369A1' }}>
                        {ADJUNTO_LABEL[t.tipoAdjunto ?? 'VIDEO']}
                      </span>
                      {t.videoUrl && (
                        <span style={{ marginLeft: '.35rem', padding: '.18rem .45rem', borderRadius: 20, fontSize: '.55rem', fontWeight: 700, background: '#D1FAE5', color: '#065F46' }}>✓</span>
                      )}
                    </td>
                    <td style={{ padding: '.65rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '.3rem' }}>
                        <button onClick={() => { setDetalleModal(t); setComentarioGestor(''); setComentarioEmpleado(''); setMediaFile(null); }}
                          style={{ padding: '.3rem .6rem', borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: '.6rem', fontWeight: 700, color: '#2D3748' }}>
                          👁️ Ver
                        </button>
                        {user?.rol !== 'EMPLEADO' && (
                          <button onClick={() => handleDelete(t.id)}
                            style={{ padding: '.3rem .6rem', borderRadius: 6, border: '1px solid rgba(239,68,68,.2)', background: '#FEE2E2', cursor: 'pointer', fontSize: '.6rem', fontWeight: 700, color: '#991B1B' }}>
                            
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal crear tarea */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 500 }}>
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '.85rem', color: '#1A202C' }}>Asignar tarea</span>
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
                <label style={labelStyle}>Cliente *</label>
                <select value={form.clienteId} onChange={e => setForm({ ...form, clienteId: +e.target.value })} style={inputStyle}>
                  <option value={0}>— Seleccionar —</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Zona / Descripción del servicio *</label>
                <input value={form.zona} onChange={e => setForm({ ...form, zona: e.target.value })} placeholder="Ej: Planta baja, cocina y baños" style={inputStyle} onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
              <div>
                <label style={labelStyle}>Fecha *</label>
                <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} style={inputStyle} onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
              <div>
                <label style={labelStyle}>Notas internas</label>
                <input value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} style={inputStyle} onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Qué debe adjuntar el empleado</label>
                <select
                  value={form.tipoAdjunto}
                  onChange={e => setForm({ ...form, tipoAdjunto: e.target.value as TipoAdjuntoTarea })}
                  style={inputStyle}
                >
                  <option value="VIDEO">Vídeo</option>
                  <option value="FOTO">Foto</option>
                  <option value="NINGUNO">Ninguno (solo completar)</option>
                </select>
              </div>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '.6rem' }}>
              <button onClick={() => setModal(false)} style={{ padding: '.48rem .95rem', borderRadius: 7, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#2D3748' }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '.48rem .95rem', borderRadius: 7, border: 'none', background: '#00B4D8', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#0D1B2A', opacity: saving ? .7 : 1 }}>
                {saving ? 'Guardando...' : 'Asignar tarea'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal programación masiva */}
      {progModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 800, fontSize: '.85rem', color: '#1A202C' }}>Programación masiva de tareas</span>
                <div style={{ fontSize: '.65rem', color: '#718096', marginTop: '.2rem' }}>Asigna la misma tarea a varios empleados en un rango de fechas</div>
              </div>
              <button onClick={() => setProgModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#718096' }}>✕</button>
            </div>
            <div style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>

              {/* Empleados */}
              <div>
                <label style={labelStyle}>Empleados * <span style={{ color: '#A0AEC0', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>({progForm.empleadoIds.length} seleccionados)</span></label>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '.5rem', maxHeight: 140, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '.3rem' }}>
                  {empleados.filter(e => e.activo).length === 0 && (
                    <div style={{ padding: '.5rem', fontSize: '.7rem', color: '#A0AEC0' }}>No hay empleados activos</div>
                  )}
                  {empleados.filter(e => e.activo).map(e => (
                    <label key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.3rem .5rem', borderRadius: 6, background: progForm.empleadoIds.includes(e.id) ? 'rgba(0,180,216,.08)' : 'transparent', cursor: 'pointer', fontSize: '.72rem', color: '#2D3748' }}>
                      <input type="checkbox" checked={progForm.empleadoIds.includes(e.id)} onChange={() => toggleEmpleadoProg(e.id)} style={{ accentColor: '#00B4D8' }} />
                      {e.nombre}
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '.4rem', marginTop: '.4rem' }}>
                  <button onClick={() => setProgForm(p => ({ ...p, empleadoIds: empleados.filter(e => e.activo).map(e => e.id) }))} style={{ padding: '.25rem .55rem', fontSize: '.62rem', fontWeight: 700, color: '#0090B0', background: 'rgba(0,180,216,.08)', border: 'none', borderRadius: 5, cursor: 'pointer' }}>Todos</button>
                  <button onClick={() => setProgForm(p => ({ ...p, empleadoIds: [] }))} style={{ padding: '.25rem .55rem', fontSize: '.62rem', fontWeight: 700, color: '#718096', background: '#F1F5F9', border: 'none', borderRadius: 5, cursor: 'pointer' }}>Ninguno</button>
                </div>
              </div>

              {/* Cliente y zona */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
                <div>
                  <label style={labelStyle}>Cliente *</label>
                  <select value={progForm.clienteId} onChange={e => setProgForm({ ...progForm, clienteId: +e.target.value })} style={inputStyle}>
                    <option value={0}>— Seleccionar —</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Zona / Servicio *</label>
                  <input value={progForm.zona} onChange={e => setProgForm({ ...progForm, zona: e.target.value })} placeholder="Ej: Limpieza zonas comunes" style={inputStyle} />
                </div>
              </div>

              {/* Rango fechas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
                <div>
                  <label style={labelStyle}>Fecha inicio *</label>
                  <input type="date" value={progForm.fechaInicio} onChange={e => setProgForm({ ...progForm, fechaInicio: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Fecha fin *</label>
                  <input type="date" value={progForm.fechaFin} onChange={e => setProgForm({ ...progForm, fechaFin: e.target.value })} style={inputStyle} />
                </div>
              </div>

              {/* Días semana */}
              <div>
                <label style={labelStyle}>Días de la semana *</label>
                <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
                  {DIAS_SEMANA.map(d => (
                    <button key={d.key} onClick={() => toggleDiaProg(d.key)} title={d.label} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid', borderColor: progForm.diasSemana.includes(d.key) ? '#00B4D8' : '#E2E8F0', background: progForm.diasSemana.includes(d.key) ? '#00B4D8' : '#fff', color: progForm.diasSemana.includes(d.key) ? '#0D1B2A' : '#718096', fontWeight: 800, fontSize: '.78rem', cursor: 'pointer' }}>{d.corto}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '.4rem', marginTop: '.5rem', flexWrap: 'wrap' }}>
                  <button onClick={() => presetDias(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'])} style={{ padding: '.25rem .55rem', fontSize: '.62rem', fontWeight: 700, color: '#0090B0', background: 'rgba(0,180,216,.08)', border: 'none', borderRadius: 5, cursor: 'pointer' }}>L-V</button>
                  <button onClick={() => presetDias(['SATURDAY', 'SUNDAY'])} style={{ padding: '.25rem .55rem', fontSize: '.62rem', fontWeight: 700, color: '#0090B0', background: 'rgba(0,180,216,.08)', border: 'none', borderRadius: 5, cursor: 'pointer' }}>Fin de semana</button>
                  <button onClick={() => presetDias(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'])} style={{ padding: '.25rem .55rem', fontSize: '.62rem', fontWeight: 700, color: '#0090B0', background: 'rgba(0,180,216,.08)', border: 'none', borderRadius: 5, cursor: 'pointer' }}>Todos</button>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Notas internas</label>
                <input value={progForm.notas} onChange={e => setProgForm({ ...progForm, notas: e.target.value })} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Qué debe adjuntar el empleado</label>
                <select
                  value={progForm.tipoAdjunto}
                  onChange={e => setProgForm({ ...progForm, tipoAdjunto: e.target.value as TipoAdjuntoTarea })}
                  style={inputStyle}
                >
                  <option value="VIDEO">Vídeo</option>
                  <option value="FOTO">Foto</option>
                  <option value="NINGUNO">Ninguno (solo completar)</option>
                </select>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.72rem', color: '#2D3748', cursor: 'pointer' }}>
                <input type="checkbox" checked={progForm.evitarDuplicados} onChange={e => setProgForm({ ...progForm, evitarDuplicados: e.target.checked })} style={{ accentColor: '#00B4D8' }} />
                Omitir duplicados (mismo empleado, cliente, zona y fecha)
              </label>

              {/* Resumen */}
              <div style={{ background: 'rgba(0,180,216,.06)', border: '1px solid rgba(0,180,216,.2)', borderRadius: 8, padding: '.7rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '.72rem', color: '#0090B0', fontWeight: 600 }}>Tareas que se generarán</span>
                <span style={{ fontSize: '1rem', fontWeight: 900, color: '#0D1B2A' }}>{totalTareasProg}</span>
              </div>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '.6rem' }}>
              <button onClick={() => setProgModal(false)} style={{ padding: '.48rem .95rem', borderRadius: 7, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#2D3748' }}>Cancelar</button>
              <button onClick={handleProgramar} disabled={saving || totalTareasProg === 0} style={{ padding: '.48rem .95rem', borderRadius: 7, border: 'none', background: '#00B4D8', cursor: (saving || totalTareasProg === 0) ? 'not-allowed' : 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#0D1B2A', opacity: (saving || totalTareasProg === 0) ? .5 : 1 }}>
                {saving ? 'Generando...' : `Generar ${totalTareasProg} tareas`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle / revisión */}
      {detalleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 800, fontSize: '.85rem', color: '#1A202C' }}>Detalle de tarea</span>
                <span style={{ marginLeft: '.6rem', padding: '.18rem .55rem', borderRadius: 20, fontSize: '.6rem', fontWeight: 700, background: estadoBadge(detalleModal.estado).bg, color: estadoBadge(detalleModal.estado).color }}>
                  {estadoBadge(detalleModal.estado).label}
                </span>
              </div>
              <button onClick={() => setDetalleModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#718096' }}>✕</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {/* Info básica */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem', marginBottom: '1.2rem' }}>
                {[
                  { label: 'Empleado', value: detalleModal.empleadoNombre },
                  { label: 'Cliente', value: detalleModal.clienteNombre },
                  { label: 'Zona / Servicio', value: detalleModal.zona },
                  { label: 'Fecha', value: detalleModal.fecha },
                  { label: 'Adjunto requerido', value: ADJUNTO_LABEL[detalleModal.tipoAdjunto ?? 'VIDEO'] },
                ].map(f => (
                  <div key={f.label} style={{ background: '#F8FAFC', borderRadius: 8, padding: '.6rem .8rem' }}>
                    <div style={{ fontSize: '.58rem', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.2rem' }}>{f.label}</div>
                    <div style={{ fontSize: '.78rem', fontWeight: 600, color: '#1A202C' }}>{f.value}</div>
                  </div>
                ))}
              </div>

              {detalleModal.notas && (
                <div style={{ background: '#FEF3C7', borderRadius: 8, padding: '.7rem .9rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '.62rem', fontWeight: 700, color: '#92400E', marginBottom: '.2rem' }}>NOTAS INTERNAS</div>
                  <div style={{ fontSize: '.75rem', color: '#78350F' }}>{detalleModal.notas}</div>
                </div>
              )}

              {/* Foto o vídeo subido */}
              {detalleModal.videoUrl ? (
                <div style={{ marginBottom: '1.2rem' }}>
                  <div style={{ fontSize: '.7rem', fontWeight: 700, color: '#1A202C', marginBottom: '.5rem' }}>
                    {(detalleModal.tipoAdjunto ?? 'VIDEO') === 'FOTO' ? '📷 Foto del empleado' : '🎥 Vídeo del empleado'}
                  </div>
                  {(detalleModal.tipoAdjunto ?? 'VIDEO') === 'FOTO' ? (
                    <img src={mediaSrc(detalleModal.videoUrl)} alt="Evidencia" style={{ width: '100%', borderRadius: 8, maxHeight: 320, objectFit: 'contain', background: '#0f172a' }} />
                  ) : (
                    <video controls style={{ width: '100%', borderRadius: 8, maxHeight: 280, background: '#000' }}>
                      <source src={mediaSrc(detalleModal.videoUrl)} />
                      Tu navegador no soporta vídeo.
                    </video>
                  )}
                  {detalleModal.comentarioEmpleado && (
                    <div style={{ background: '#EDE9FE', borderRadius: 8, padding: '.6rem .8rem', marginTop: '.6rem' }}>
                      <div style={{ fontSize: '.62rem', fontWeight: 700, color: '#5B21B6', marginBottom: '.2rem' }}>COMENTARIO DEL EMPLEADO</div>
                      <div style={{ fontSize: '.75rem', color: '#4C1D95' }}>{detalleModal.comentarioEmpleado}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ background: '#F8FAFC', border: '1px dashed #E2E8F0', borderRadius: 8, padding: '1.2rem', textAlign: 'center', marginBottom: '1.2rem', color: '#A0AEC0', fontSize: '.73rem' }}>
                  {(detalleModal.tipoAdjunto ?? 'VIDEO') === 'NINGUNO'
                    ? (detalleModal.estado === 'PENDIENTE' ? 'Sin archivo requerido: el empleado solo marca completada.' : 'Sin archivo adjunto.')
                    : 'El empleado aún no ha subido la evidencia'}
                </div>
              )}

              {/* Actualizar tarea (solo empleados con tarea pendiente) */}
              {user?.rol === 'EMPLEADO' && detalleModal.empleadoId === user.id && detalleModal.estado === 'PENDIENTE' && (
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: '1rem' }}>
                  <div style={{ fontSize: '.72rem', fontWeight: 800, color: '#1A202C', marginBottom: '.7rem' }}>Completar tarea</div>
                  <div style={{ fontSize: '.65rem', color: '#64748B', marginBottom: '.75rem' }}>
                    {((detalleModal.tipoAdjunto ?? 'VIDEO') === 'NINGUNO') && 'No hace falta subir archivo. Puedes añadir un comentario opcional.'}
                    {((detalleModal.tipoAdjunto ?? 'VIDEO') === 'FOTO') && 'Debes subir una foto como evidencia.'}
                    {((detalleModal.tipoAdjunto ?? 'VIDEO') === 'VIDEO') && 'Debes subir un vídeo como evidencia.'}
                  </div>
                  <div style={{ marginBottom: '.8rem' }}>
                    <label style={{ display: 'block', fontSize: '.62rem', fontWeight: 700, color: '#718096', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Comentario (opcional)</label>
                    <textarea value={comentarioEmpleado} onChange={e => setComentarioEmpleado(e.target.value)} rows={2} placeholder="Escribe un comentario sobre la tarea..."
                      style={{ width: '100%', padding: '.55rem .8rem', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: '.76rem', color: '#2D3748', fontFamily: "'Montserrat', sans-serif", outline: 'none', resize: 'vertical' }}
                      onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                  </div>
                  {((detalleModal.tipoAdjunto ?? 'VIDEO') === 'FOTO' || (detalleModal.tipoAdjunto ?? 'VIDEO') === 'VIDEO') && (
                    <div style={{ marginBottom: '.8rem' }}>
                      <label style={{ display: 'block', fontSize: '.62rem', fontWeight: 700, color: '#718096', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                        {(detalleModal.tipoAdjunto ?? 'VIDEO') === 'FOTO' ? 'Subir foto' : 'Subir vídeo'}
                      </label>
                      <input
                        type="file"
                        accept={(detalleModal.tipoAdjunto ?? 'VIDEO') === 'FOTO' ? 'image/*' : 'video/*'}
                        onChange={e => setMediaFile(e.target.files?.[0] || null)}
                        style={{ width: '100%', padding: '.55rem .8rem', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: '.76rem', color: '#2D3748', outline: 'none' }}
                        onFocus={e => e.target.style.borderColor = '#00B4D8'}
                        onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                      />
                    </div>
                  )}
                  <button onClick={handleCompletarEmpleado} disabled={saving} style={{ width: '100%', padding: '.55rem', borderRadius: 8, border: 'none', background: '#00B4D8', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '.75rem', fontWeight: 700, color: '#0D1B2A', opacity: saving ? .7 : 1 }}>
                    {saving ? 'Guardando...' : 'Completar tarea'}
                  </button>
                </div>
              )}

              {/* Revisión (solo si está COMPLETADA y no es empleado) */}
              {user?.rol !== 'EMPLEADO' && detalleModal.estado === 'COMPLETADA' && (
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: '1rem' }}>
                  <div style={{ fontSize: '.72rem', fontWeight: 800, color: '#1A202C', marginBottom: '.7rem' }}>Revisar tarea</div>
                  <div style={{ marginBottom: '.8rem' }}>
                    <label style={{ display: 'block', fontSize: '.62rem', fontWeight: 700, color: '#718096', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Comentario (opcional)</label>
                    <textarea value={comentarioGestor} onChange={e => setComentarioGestor(e.target.value)} rows={2} placeholder="Escribe un comentario para el empleado..."
                      style={{ width: '100%', padding: '.55rem .8rem', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: '.76rem', color: '#2D3748', fontFamily: "'Montserrat', sans-serif", outline: 'none', resize: 'vertical' }}
                      onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                  </div>
                  <div style={{ display: 'flex', gap: '.6rem' }}>
                    <button onClick={() => handleRevisar(detalleModal.id, true)} style={{ flex: 1, padding: '.55rem', borderRadius: 8, border: 'none', background: '#10B981', cursor: 'pointer', fontSize: '.75rem', fontWeight: 700, color: '#fff' }}>
                      Aprobar tarea
                    </button>
                    <button onClick={() => handleRevisar(detalleModal.id, false)} style={{ flex: 1, padding: '.55rem', borderRadius: 8, border: 'none', background: '#EF4444', cursor: 'pointer', fontSize: '.75rem', fontWeight: 700, color: '#fff' }}>
                      Rechazar tarea
                    </button>
                  </div>
                </div>
              )}

              {/* Comentario gestor si ya fue revisada */}
              {detalleModal.comentarioGestor && (
                <div style={{ background: detalleModal.estado === 'APROBADA' ? '#D1FAE5' : '#FEE2E2', borderRadius: 8, padding: '.7rem .9rem', marginTop: '1rem' }}>
                  <div style={{ fontSize: '.62rem', fontWeight: 700, color: detalleModal.estado === 'APROBADA' ? '#065F46' : '#991B1B', marginBottom: '.2rem' }}>COMENTARIO DEL GESTOR</div>
                  <div style={{ fontSize: '.75rem', color: detalleModal.estado === 'APROBADA' ? '#064E3B' : '#7F1D1D' }}>{detalleModal.comentarioGestor}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

