import { useEffect, useState } from 'react';
import { getTurnos, getTurnosByEmpleado, createTurno, updateTurno, deleteTurno, getEmpleados, aplicarPlantillaTurnos, copiarSemanaTurnos } from '../api';
import type { DiaSemana } from '../api';
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

const DIAS_SEMANA: { key: DiaSemana; label: string; corto: string }[] = [
  { key: 'MONDAY',    label: 'Lunes',     corto: 'L' },
  { key: 'TUESDAY',   label: 'Martes',    corto: 'M' },
  { key: 'WEDNESDAY', label: 'Miércoles', corto: 'X' },
  { key: 'THURSDAY',  label: 'Jueves',    corto: 'J' },
  { key: 'FRIDAY',    label: 'Viernes',   corto: 'V' },
  { key: 'SATURDAY',  label: 'Sábado',    corto: 'S' },
  { key: 'SUNDAY',    label: 'Domingo',   corto: 'D' },
];

type HorarioPorDia = Record<DiaSemana, { activo: boolean; entrada: string; salida: string }>;

const HORARIO_DEFAULT: HorarioPorDia = {
  MONDAY:    { activo: true,  entrada: '09:00', salida: '17:00' },
  TUESDAY:   { activo: true,  entrada: '09:00', salida: '17:00' },
  WEDNESDAY: { activo: true,  entrada: '09:00', salida: '17:00' },
  THURSDAY:  { activo: true,  entrada: '09:00', salida: '17:00' },
  FRIDAY:    { activo: true,  entrada: '09:00', salida: '17:00' },
  SATURDAY:  { activo: false, entrada: '09:00', salida: '14:00' },
  SUNDAY:    { activo: false, entrada: '09:00', salida: '14:00' },
};

const PLANT_EMPTY = {
  empleadoIds: [] as number[],
  fechaInicio: new Date().toISOString().slice(0, 10),
  fechaFin: new Date(Date.now() + 27 * 86400000).toISOString().slice(0, 10),
  horarios: { ...HORARIO_DEFAULT } as HorarioPorDia,
  notas: '',
  evitarDuplicados: true,
  sobrescribir: false,
};

function lunesDe(fecha: string): string {
  const d = new Date(fecha + 'T00:00:00');
  const dia = d.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

const COPY_EMPTY = {
  empleadoIds: [] as number[],
  semanaOrigen: lunesDe(new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)),
  semanaDestino: lunesDe(new Date().toISOString().slice(0, 10)),
  repetirSemanas: 1,
  evitarDuplicados: true,
};

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
  const [plantModal, setPlantModal] = useState(false);
  const [copyModal, setCopyModal] = useState(false);
  const [plantForm, setPlantForm] = useState(PLANT_EMPTY);
  const [copyForm, setCopyForm] = useState(COPY_EMPTY);
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

  // --------- Plantilla semanal ---------
  const togglePlantEmpleado = (id: number) => {
    setPlantForm(p => ({
      ...p,
      empleadoIds: p.empleadoIds.includes(id)
        ? p.empleadoIds.filter(e => e !== id)
        : [...p.empleadoIds, id]
    }));
  };

  const setHorarioDia = (dia: DiaSemana, cambios: Partial<{ activo: boolean; entrada: string; salida: string }>) => {
    setPlantForm(p => ({ ...p, horarios: { ...p.horarios, [dia]: { ...p.horarios[dia], ...cambios } } }));
  };

  const aplicarPresetHorario = (preset: 'lv9-17' | 'ls-mananas' | 'ls-tardes' | 'limpiar') => {
    const base: HorarioPorDia = {
      MONDAY:    { activo: false, entrada: '09:00', salida: '17:00' },
      TUESDAY:   { activo: false, entrada: '09:00', salida: '17:00' },
      WEDNESDAY: { activo: false, entrada: '09:00', salida: '17:00' },
      THURSDAY:  { activo: false, entrada: '09:00', salida: '17:00' },
      FRIDAY:    { activo: false, entrada: '09:00', salida: '17:00' },
      SATURDAY:  { activo: false, entrada: '09:00', salida: '14:00' },
      SUNDAY:    { activo: false, entrada: '09:00', salida: '14:00' },
    };
    if (preset === 'lv9-17') {
      (['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY'] as DiaSemana[]).forEach(d => base[d] = { activo: true, entrada: '09:00', salida: '17:00' });
    } else if (preset === 'ls-mananas') {
      (['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'] as DiaSemana[]).forEach(d => base[d] = { activo: true, entrada: '08:00', salida: '14:00' });
    } else if (preset === 'ls-tardes') {
      (['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'] as DiaSemana[]).forEach(d => base[d] = { activo: true, entrada: '15:00', salida: '21:00' });
    }
    setPlantForm(p => ({ ...p, horarios: base }));
  };

  const totalTurnosPlant = (() => {
    if (!plantForm.fechaInicio || !plantForm.fechaFin || plantForm.empleadoIds.length === 0) return 0;
    const inicio = new Date(plantForm.fechaInicio + 'T00:00:00');
    const fin = new Date(plantForm.fechaFin + 'T00:00:00');
    if (fin < inicio) return 0;
    const diasMap: Record<number, DiaSemana> = { 0: 'SUNDAY', 1: 'MONDAY', 2: 'TUESDAY', 3: 'WEDNESDAY', 4: 'THURSDAY', 5: 'FRIDAY', 6: 'SATURDAY' };
    let dias = 0;
    for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
      if (plantForm.horarios[diasMap[d.getDay()]].activo) dias++;
    }
    return dias * plantForm.empleadoIds.length;
  })();

  const handleAplicarPlantilla = async () => {
    if (plantForm.empleadoIds.length === 0) { showToast('Selecciona al menos un empleado', 'err'); return; }
    const horarios = (Object.keys(plantForm.horarios) as DiaSemana[])
      .filter(d => plantForm.horarios[d].activo)
      .map(d => ({ diaSemana: d, horaEntrada: plantForm.horarios[d].entrada, horaSalida: plantForm.horarios[d].salida }));
    if (horarios.length === 0) { showToast('Activa al menos un día de la semana', 'err'); return; }
    if (new Date(plantForm.fechaFin) < new Date(plantForm.fechaInicio)) { showToast('La fecha fin no puede ser anterior a la inicio', 'err'); return; }
    if (plantForm.sobrescribir && !confirm(`¿Borrar todos los turnos del rango para ${plantForm.empleadoIds.length} empleado(s) y reemplazarlos?`)) return;

    setSaving(true);
    try {
      const res = await aplicarPlantillaTurnos({
        empleadoIds: plantForm.empleadoIds,
        fechaInicio: plantForm.fechaInicio,
        fechaFin: plantForm.fechaFin,
        horarios,
        notas: plantForm.notas,
        evitarDuplicados: plantForm.evitarDuplicados,
        sobrescribir: plantForm.sobrescribir,
      });
      const { totalCreados, totalOmitidos, totalFallidos } = res.data;
      const partes = [`${totalCreados} creados`];
      if (totalOmitidos) partes.push(`${totalOmitidos} omitidos`);
      if (totalFallidos) partes.push(`${totalFallidos} con error`);
      showToast(partes.join(' · '), totalFallidos ? 'err' : 'ok');
      setPlantModal(false);
      await load();
    } catch { showToast('Error al aplicar plantilla', 'err'); }
    finally { setSaving(false); }
  };

  // --------- Copiar semana ---------
  const toggleCopyEmpleado = (id: number) => {
    setCopyForm(p => ({
      ...p,
      empleadoIds: p.empleadoIds.includes(id)
        ? p.empleadoIds.filter(e => e !== id)
        : [...p.empleadoIds, id]
    }));
  };

  const handleCopiarSemana = async () => {
    if (copyForm.empleadoIds.length === 0) { showToast('Selecciona al menos un empleado', 'err'); return; }
    if (copyForm.repetirSemanas < 1) { showToast('Repetir semanas debe ser al menos 1', 'err'); return; }
    setSaving(true);
    try {
      const res = await copiarSemanaTurnos(copyForm);
      const { totalCreados, totalOmitidos } = res.data;
      const partes = [`${totalCreados} creados`];
      if (totalOmitidos) partes.push(`${totalOmitidos} omitidos`);
      showToast(partes.join(' · ') + (totalCreados === 0 ? ' (la semana origen no tiene turnos)' : ''));
      setCopyModal(false);
      await load();
    } catch { showToast('Error al copiar semana', 'err'); }
    finally { setSaving(false); }
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
            <>
              <button onClick={() => { setCopyForm({ ...COPY_EMPTY }); setCopyModal(true); }} style={{ padding: '.48rem .95rem', borderRadius: 7, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#2D3748' }}>📑 Copiar semana</button>
              <button onClick={() => { setPlantForm({ ...PLANT_EMPTY, horarios: { ...HORARIO_DEFAULT } }); setPlantModal(true); }} style={{ padding: '.48rem .95rem', borderRadius: 7, border: '1px solid #00B4D8', background: '#fff', cursor: 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#0090B0' }}>📋 Plantilla semanal</button>
              <button onClick={openNew} style={{ padding: '.48rem .95rem', borderRadius: 7, border: 'none', background: '#00B4D8', cursor: 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#0D1B2A' }}>＋ Añadir turno</button>
            </>
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

      {/* Modal plantilla semanal */}
      {plantModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 720, maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 800, fontSize: '.85rem', color: '#1A202C' }}>Plantilla semanal de turnos</span>
                <div style={{ fontSize: '.65rem', color: '#718096', marginTop: '.2rem' }}>Genera turnos para varios empleados durante un rango de fechas</div>
              </div>
              <button onClick={() => setPlantModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#718096' }}>✕</button>
            </div>
            <div style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>

              {/* Empleados */}
              <div>
                <label style={labelStyle}>Empleados * <span style={{ color: '#A0AEC0', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>({plantForm.empleadoIds.length} seleccionados)</span></label>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '.5rem', maxHeight: 130, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '.3rem' }}>
                  {empleados.filter(e => e.activo).length === 0 && (
                    <div style={{ padding: '.5rem', fontSize: '.7rem', color: '#A0AEC0' }}>No hay empleados activos</div>
                  )}
                  {empleados.filter(e => e.activo).map(e => (
                    <label key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.3rem .5rem', borderRadius: 6, background: plantForm.empleadoIds.includes(e.id) ? 'rgba(0,180,216,.08)' : 'transparent', cursor: 'pointer', fontSize: '.72rem', color: '#2D3748' }}>
                      <input type="checkbox" checked={plantForm.empleadoIds.includes(e.id)} onChange={() => togglePlantEmpleado(e.id)} style={{ accentColor: '#00B4D8' }} />
                      {e.nombre}
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '.4rem', marginTop: '.4rem' }}>
                  <button onClick={() => setPlantForm(p => ({ ...p, empleadoIds: empleados.filter(e => e.activo).map(e => e.id) }))} style={{ padding: '.25rem .55rem', fontSize: '.62rem', fontWeight: 700, color: '#0090B0', background: 'rgba(0,180,216,.08)', border: 'none', borderRadius: 5, cursor: 'pointer' }}>Todos</button>
                  <button onClick={() => setPlantForm(p => ({ ...p, empleadoIds: [] }))} style={{ padding: '.25rem .55rem', fontSize: '.62rem', fontWeight: 700, color: '#718096', background: '#F1F5F9', border: 'none', borderRadius: 5, cursor: 'pointer' }}>Ninguno</button>
                </div>
              </div>

              {/* Rango */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
                <div>
                  <label style={labelStyle}>Fecha inicio *</label>
                  <input type="date" value={plantForm.fechaInicio} onChange={e => setPlantForm({ ...plantForm, fechaInicio: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Fecha fin *</label>
                  <input type="date" value={plantForm.fechaFin} onChange={e => setPlantForm({ ...plantForm, fechaFin: e.target.value })} style={inputStyle} />
                </div>
              </div>

              {/* Presets */}
              <div>
                <label style={labelStyle}>Presets de horario</label>
                <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                  <button onClick={() => aplicarPresetHorario('lv9-17')} style={{ padding: '.3rem .65rem', fontSize: '.65rem', fontWeight: 700, color: '#0090B0', background: 'rgba(0,180,216,.08)', border: 'none', borderRadius: 6, cursor: 'pointer' }}>L-V · 9-17h</button>
                  <button onClick={() => aplicarPresetHorario('ls-mananas')} style={{ padding: '.3rem .65rem', fontSize: '.65rem', fontWeight: 700, color: '#0090B0', background: 'rgba(0,180,216,.08)', border: 'none', borderRadius: 6, cursor: 'pointer' }}>L-S · Mañanas (8-14h)</button>
                  <button onClick={() => aplicarPresetHorario('ls-tardes')} style={{ padding: '.3rem .65rem', fontSize: '.65rem', fontWeight: 700, color: '#0090B0', background: 'rgba(0,180,216,.08)', border: 'none', borderRadius: 6, cursor: 'pointer' }}>L-S · Tardes (15-21h)</button>
                  <button onClick={() => aplicarPresetHorario('limpiar')} style={{ padding: '.3rem .65rem', fontSize: '.65rem', fontWeight: 700, color: '#718096', background: '#F1F5F9', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Limpiar</button>
                </div>
              </div>

              {/* Horarios por día */}
              <div>
                <label style={labelStyle}>Horarios por día</label>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                  {DIAS_SEMANA.map((d, idx) => {
                    const h = plantForm.horarios[d.key];
                    return (
                      <div key={d.key} style={{ display: 'grid', gridTemplateColumns: 'auto 110px 1fr 1fr', gap: '.6rem', alignItems: 'center', padding: '.5rem .8rem', background: idx % 2 ? '#F8FAFC' : '#fff', borderBottom: idx < DIAS_SEMANA.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                        <input type="checkbox" checked={h.activo} onChange={e => setHorarioDia(d.key, { activo: e.target.checked })} style={{ accentColor: '#00B4D8' }} />
                        <span style={{ fontSize: '.73rem', fontWeight: 700, color: h.activo ? '#1A202C' : '#A0AEC0' }}>{d.label}</span>
                        <input type="time" value={h.entrada} disabled={!h.activo} onChange={e => setHorarioDia(d.key, { entrada: e.target.value })} style={{ ...inputStyle, padding: '.35rem .6rem', opacity: h.activo ? 1 : .5 }} />
                        <input type="time" value={h.salida} disabled={!h.activo} onChange={e => setHorarioDia(d.key, { salida: e.target.value })} style={{ ...inputStyle, padding: '.35rem .6rem', opacity: h.activo ? 1 : .5 }} />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Notas</label>
                <input value={plantForm.notas} onChange={e => setPlantForm({ ...plantForm, notas: e.target.value })} style={inputStyle} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.72rem', color: '#2D3748', cursor: 'pointer' }}>
                  <input type="checkbox" checked={plantForm.evitarDuplicados} disabled={plantForm.sobrescribir} onChange={e => setPlantForm({ ...plantForm, evitarDuplicados: e.target.checked })} style={{ accentColor: '#00B4D8' }} />
                  Omitir duplicados (no crear si ya existe turno para ese empleado y fecha)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.72rem', color: '#991B1B', cursor: 'pointer' }}>
                  <input type="checkbox" checked={plantForm.sobrescribir} onChange={e => setPlantForm({ ...plantForm, sobrescribir: e.target.checked })} style={{ accentColor: '#EF4444' }} />
                  Sobrescribir (BORRA los turnos existentes del rango antes de crear los nuevos)
                </label>
              </div>

              <div style={{ background: 'rgba(0,180,216,.06)', border: '1px solid rgba(0,180,216,.2)', borderRadius: 8, padding: '.7rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '.72rem', color: '#0090B0', fontWeight: 600 }}>Turnos que se generarán</span>
                <span style={{ fontSize: '1rem', fontWeight: 900, color: '#0D1B2A' }}>{totalTurnosPlant}</span>
              </div>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '.6rem' }}>
              <button onClick={() => setPlantModal(false)} style={{ padding: '.48rem .95rem', borderRadius: 7, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#2D3748' }}>Cancelar</button>
              <button onClick={handleAplicarPlantilla} disabled={saving || totalTurnosPlant === 0} style={{ padding: '.48rem .95rem', borderRadius: 7, border: 'none', background: '#00B4D8', cursor: (saving || totalTurnosPlant === 0) ? 'not-allowed' : 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#0D1B2A', opacity: (saving || totalTurnosPlant === 0) ? .5 : 1 }}>
                {saving ? 'Generando...' : `Generar ${totalTurnosPlant} turnos`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal copiar semana */}
      {copyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 800, fontSize: '.85rem', color: '#1A202C' }}>Copiar semana de turnos</span>
                <div style={{ fontSize: '.65rem', color: '#718096', marginTop: '.2rem' }}>Replica los turnos de una semana en una o varias siguientes</div>
              </div>
              <button onClick={() => setCopyModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#718096' }}>✕</button>
            </div>
            <div style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>

              <div>
                <label style={labelStyle}>Empleados * <span style={{ color: '#A0AEC0', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>({copyForm.empleadoIds.length} seleccionados)</span></label>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '.5rem', maxHeight: 130, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '.3rem' }}>
                  {empleados.filter(e => e.activo).map(e => (
                    <label key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.3rem .5rem', borderRadius: 6, background: copyForm.empleadoIds.includes(e.id) ? 'rgba(0,180,216,.08)' : 'transparent', cursor: 'pointer', fontSize: '.72rem', color: '#2D3748' }}>
                      <input type="checkbox" checked={copyForm.empleadoIds.includes(e.id)} onChange={() => toggleCopyEmpleado(e.id)} style={{ accentColor: '#00B4D8' }} />
                      {e.nombre}
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '.4rem', marginTop: '.4rem' }}>
                  <button onClick={() => setCopyForm(p => ({ ...p, empleadoIds: empleados.filter(e => e.activo).map(e => e.id) }))} style={{ padding: '.25rem .55rem', fontSize: '.62rem', fontWeight: 700, color: '#0090B0', background: 'rgba(0,180,216,.08)', border: 'none', borderRadius: 5, cursor: 'pointer' }}>Todos</button>
                  <button onClick={() => setCopyForm(p => ({ ...p, empleadoIds: [] }))} style={{ padding: '.25rem .55rem', fontSize: '.62rem', fontWeight: 700, color: '#718096', background: '#F1F5F9', border: 'none', borderRadius: 5, cursor: 'pointer' }}>Ninguno</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
                <div>
                  <label style={labelStyle}>Semana origen</label>
                  <input type="date" value={copyForm.semanaOrigen} onChange={e => setCopyForm({ ...copyForm, semanaOrigen: e.target.value })} style={inputStyle} />
                  <div style={{ fontSize: '.6rem', color: '#A0AEC0', marginTop: '.2rem' }}>Lunes detectado: {lunesDe(copyForm.semanaOrigen)}</div>
                </div>
                <div>
                  <label style={labelStyle}>Semana destino</label>
                  <input type="date" value={copyForm.semanaDestino} onChange={e => setCopyForm({ ...copyForm, semanaDestino: e.target.value })} style={inputStyle} />
                  <div style={{ fontSize: '.6rem', color: '#A0AEC0', marginTop: '.2rem' }}>Lunes detectado: {lunesDe(copyForm.semanaDestino)}</div>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Repetir cuántas semanas</label>
                <input type="number" min={1} max={52} value={copyForm.repetirSemanas} onChange={e => setCopyForm({ ...copyForm, repetirSemanas: Math.max(1, +e.target.value || 1) })} style={inputStyle} />
                <div style={{ fontSize: '.62rem', color: '#718096', marginTop: '.3rem' }}>1 = solo la semana destino · N = se replica N semanas consecutivas</div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.72rem', color: '#2D3748', cursor: 'pointer' }}>
                <input type="checkbox" checked={copyForm.evitarDuplicados} onChange={e => setCopyForm({ ...copyForm, evitarDuplicados: e.target.checked })} style={{ accentColor: '#00B4D8' }} />
                Omitir duplicados (no copiar si ya existe turno para ese empleado y fecha)
              </label>

            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '.6rem' }}>
              <button onClick={() => setCopyModal(false)} style={{ padding: '.48rem .95rem', borderRadius: 7, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#2D3748' }}>Cancelar</button>
              <button onClick={handleCopiarSemana} disabled={saving || copyForm.empleadoIds.length === 0} style={{ padding: '.48rem .95rem', borderRadius: 7, border: 'none', background: '#00B4D8', cursor: (saving || copyForm.empleadoIds.length === 0) ? 'not-allowed' : 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#0D1B2A', opacity: (saving || copyForm.empleadoIds.length === 0) ? .5 : 1 }}>
                {saving ? 'Copiando...' : 'Copiar semana'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}