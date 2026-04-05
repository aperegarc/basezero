import { useEffect, useState } from 'react';
import api, { getTareas, getTareasByEmpleado, createTarea, deleteTarea, revisarTarea, getEmpleados, getClientes, updateTarea } from '../api';
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

const EMPTY = { empleadoId: 0, clienteId: 0, zona: '', fecha: new Date().toISOString().slice(0, 10), notas: '' };

export default function TareasPage() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [detalleModal, setDetalleModal] = useState<Tarea | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [comentarioGestor, setComentarioGestor] = useState('');
  const [comentarioEmpleado, setComentarioEmpleado] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
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

  const handleUpdateEmpleado = async () => {
    if (!detalleModal) return;
    setSaving(true);
    try {
      const data: any = {};
      if (comentarioEmpleado) data.comentarioEmpleado = comentarioEmpleado;
      if (videoFile) {
        const formData = new FormData();
        formData.append('video', videoFile);
        await api.post(`/tareas/${detalleModal.id}/upload-video`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        data.videoUrl = `uploads/videos/${videoFile.name}`;
      }
      if (Object.keys(data).length > 0) {
        await updateTarea(detalleModal.id, data);
        showToast('Tarea actualizada');
        setDetalleModal(null);
        setComentarioEmpleado('');
        setVideoFile(null);
        await load();
      }
    } catch (err) {
      showToast('Error al actualizar', 'err');
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
            <button onClick={() => { setForm({ ...EMPTY, empleadoId: empleados[0]?.id || 0, clienteId: clientes[0]?.id || 0 }); setModal(true); }} style={{ padding: '.48rem .95rem', borderRadius: 7, border: 'none', background: '#00B4D8', cursor: 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#0D1B2A' }}>
              ＋ Asignar tarea
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.75rem' }}>
            <thead>
              <tr style={{ background: '#0D1B2A' }}>
                {['Empleado', 'Cliente', 'Zona / Servicio', 'Fecha', 'Estado', 'Vídeo', 'Acciones'].map(h => (
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
                      {t.videoUrl ? (
                        <span style={{ padding: '.18rem .5rem', borderRadius: 20, fontSize: '.6rem', fontWeight: 700, background: '#D1FAE5', color: '#065F46' }}>🎥 Sí</span>
                      ) : (
                        <span style={{ padding: '.18rem .5rem', borderRadius: 20, fontSize: '.6rem', fontWeight: 700, background: '#F1F5F9', color: '#94A3B8' }}>Sin vídeo</span>
                      )}
                    </td>
                    <td style={{ padding: '.65rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '.3rem' }}>
                        <button onClick={() => { setDetalleModal(t); setComentarioGestor(''); setComentarioEmpleado(''); setVideoFile(null); }}
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

              {/* Vídeo */}
              {detalleModal.videoUrl ? (
                <div style={{ marginBottom: '1.2rem' }}>
                  <div style={{ fontSize: '.7rem', fontWeight: 700, color: '#1A202C', marginBottom: '.5rem' }}>🎥 Vídeo del empleado</div>
                  <video controls style={{ width: '100%', borderRadius: 8, maxHeight: 280, background: '#000' }}>
                    <source src={`http://localhost:8080/${detalleModal.videoUrl}`} />
                    Tu navegador no soporta vídeo.
                  </video>
                  {detalleModal.comentarioEmpleado && (
                    <div style={{ background: '#EDE9FE', borderRadius: 8, padding: '.6rem .8rem', marginTop: '.6rem' }}>
                      <div style={{ fontSize: '.62rem', fontWeight: 700, color: '#5B21B6', marginBottom: '.2rem' }}>COMENTARIO DEL EMPLEADO</div>
                      <div style={{ fontSize: '.75rem', color: '#4C1D95' }}>{detalleModal.comentarioEmpleado}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ background: '#F8FAFC', border: '1px dashed #E2E8F0', borderRadius: 8, padding: '1.2rem', textAlign: 'center', marginBottom: '1.2rem', color: '#A0AEC0', fontSize: '.73rem' }}>
                  El empleado aún no ha subido el vídeo
                </div>
              )}

              {/* Actualizar tarea (solo empleados con tarea pendiente) */}
              {user?.rol === 'EMPLEADO' && detalleModal.empleadoId === user.id && detalleModal.estado === 'PENDIENTE' && (
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: '1rem' }}>
                  <div style={{ fontSize: '.72rem', fontWeight: 800, color: '#1A202C', marginBottom: '.7rem' }}>Completar tarea</div>
                  <div style={{ marginBottom: '.8rem' }}>
                    <label style={{ display: 'block', fontSize: '.62rem', fontWeight: 700, color: '#718096', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Comentario (opcional)</label>
                    <textarea value={comentarioEmpleado} onChange={e => setComentarioEmpleado(e.target.value)} rows={2} placeholder="Escribe un comentario sobre la tarea..."
                      style={{ width: '100%', padding: '.55rem .8rem', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: '.76rem', color: '#2D3748', fontFamily: "'Montserrat', sans-serif", outline: 'none', resize: 'vertical' }}
                      onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                  </div>
                  <div style={{ marginBottom: '.8rem' }}>
                    <label style={{ display: 'block', fontSize: '.62rem', fontWeight: 700, color: '#718096', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Subir vídeo (opcional)</label>
                    <input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] || null)} style={{ width: '100%', padding: '.55rem .8rem', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: '.76rem', color: '#2D3748', outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                  </div>
                  <button onClick={handleUpdateEmpleado} disabled={saving} style={{ width: '100%', padding: '.55rem', borderRadius: 8, border: 'none', background: '#00B4D8', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '.75rem', fontWeight: 700, color: '#0D1B2A', opacity: saving ? .7 : 1 }}>
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

