import { useEffect, useState } from 'react';
import { getEmpleados, createEmpleado, updateEmpleado, deleteEmpleado } from '../api';

interface Empleado {
  id: number;
  nombre: string;
  dni: string;
  telefono?: string;
  salarioMensual?: number;
  activo: boolean;
  fechaAlta?: string;
  totalTareas: number;
  tareasCompletadas: number;
  tareasPendientes: number;
}

const EMPTY = { nombre: '', dni: '', password: '', telefono: '', salarioMensual: 0, activo: true, fechaAlta: new Date().toISOString().slice(0, 10) };

export default function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const load = async () => { const r = await getEmpleados(); setEmpleados(r.data); setLoading(false); };
  useEffect(() => { load(); }, []);

  const fmt = (n: number) => (n || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const openNew = () => { setForm(EMPTY); setEditing(null); setModal(true); };
  const openEdit = (e: Empleado) => {
    setForm({ nombre: e.nombre, dni: e.dni, password: '', telefono: e.telefono || '', salarioMensual: e.salarioMensual || 0, activo: e.activo, fechaAlta: e.fechaAlta || '' });
    setEditing(e.id); setModal(true);
  };

  const handleSave = async () => {
    if (!form.nombre || !form.dni) { showToast('Nombre y DNI son obligatorios', 'err'); return; }
    if (!editing && !form.password) { showToast('La contraseña es obligatoria', 'err'); return; }
    setSaving(true);
    try {
      if (editing) { await updateEmpleado(editing, form); showToast('Empleado actualizado'); }
      else { await createEmpleado(form); showToast('Empleado creado'); }
      setModal(false); await load();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Error al guardar', 'err');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este empleado?')) return;
    try { await deleteEmpleado(id); showToast('Empleado eliminado'); await load(); }
    catch { showToast('Error al eliminar', 'err'); }
  };

  const filtered = empleados.filter(e =>
    e.nombre.toLowerCase().includes(search.toLowerCase()) ||
    e.dni.toLowerCase().includes(search.toLowerCase())
  );

  const inputStyle = { width: '100%', padding: '.55rem .8rem', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: '.76rem', color: '#2D3748', fontFamily: "'Montserrat', sans-serif", outline: 'none', background: '#fff' };
  const labelStyle = { display: 'block' as const, fontSize: '.62rem', fontWeight: 700, color: '#718096', marginBottom: '.3rem', textTransform: 'uppercase' as const, letterSpacing: '.06em', fontFamily: "'Montserrat', sans-serif" };

  const totalSalarios = empleados.filter(e => e.activo).reduce((s, e) => s + (Number(e.salarioMensual) || 0), 0);

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
          { label: 'Empleados activos', value: empleados.filter(e => e.activo).length, color: '#00B4D8', icon: '' },
          { label: 'Coste mensual', value: `${fmt(totalSalarios)} €`, color: '#F59E0B', icon: '' },
          { label: 'Tareas pendientes', value: empleados.reduce((s, e) => s + e.tareasPendientes, 0), color: '#8B5CF6', icon: '' },
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '.8rem' }}>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 900, color: '#1A202C' }}>Empleados</h1>
          <p style={{ fontSize: '.68rem', color: '#718096', marginTop: '.2rem' }}>{empleados.length} empleados registrados</p>
        </div>
        <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '.4rem .8rem' }}>
            <span style={{ color: '#A0AEC0' }}></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar empleado..." style={{ border: 'none', background: 'none', fontSize: '.76rem', color: '#2D3748', outline: 'none', width: 160 }} />
          </div>
          <button onClick={openNew} style={{ padding: '.48rem .95rem', borderRadius: 7, border: 'none', background: '#00B4D8', cursor: 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#0D1B2A' }}>＋ Nuevo empleado</button>
        </div>
      </div>

      {/* Grid de empleados */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', padding: '2rem', textAlign: 'center', color: '#A0AEC0' }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ gridColumn: '1/-1', padding: '2rem', textAlign: 'center', color: '#A0AEC0' }}>No hay empleados{search ? ' con ese filtro' : ''}</div>
        ) : filtered.map(e => (
          <div key={e.id} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
            {/* Card header */}
            <div style={{ background: '#0D1B2A', padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', gap: '.8rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: e.activo ? '#00B4D8' : '#718096', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                {e.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '.82rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.nombre}</div>
                <div style={{ fontSize: '.62rem', color: '#A0AEC0', marginTop: '.1rem' }}>DNI: {e.dni}</div>
              </div>
              <span style={{ padding: '.18rem .5rem', borderRadius: 20, fontSize: '.58rem', fontWeight: 700, background: e.activo ? 'rgba(16,185,129,.2)' : 'rgba(255,255,255,.1)', color: e.activo ? '#6EE7B7' : '#A0AEC0' }}>
                {e.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            {/* Card body */}
            <div style={{ padding: '1rem 1.2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.5rem', marginBottom: '1rem' }}>
                {[
                  { label: 'Total', value: e.totalTareas, color: '#718096' },
                  { label: 'Hechas', value: e.tareasCompletadas, color: '#10B981' },
                  { label: 'Pend.', value: e.tareasPendientes, color: '#F59E0B' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', background: '#F8FAFC', borderRadius: 8, padding: '.5rem .3rem' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '.55rem', color: '#718096', fontWeight: 700 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '.68rem', color: '#718096', marginBottom: '.8rem' }}>
                {e.telefono && <div>📞 {e.telefono}</div>}
                {e.salarioMensual && <div style={{ marginTop: '.2rem' }}>{fmt(Number(e.salarioMensual))} €/mes</div>}
                {e.fechaAlta && <div style={{ marginTop: '.2rem' }}>📅 Alta: {e.fechaAlta}</div>}
              </div>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <button onClick={() => openEdit(e)} style={{ flex: 1, padding: '.38rem', borderRadius: 7, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: '.68rem', fontWeight: 700, color: '#2D3748' }}>Editar</button>
                <button onClick={() => handleDelete(e.id)} style={{ padding: '.38rem .7rem', borderRadius: 7, border: '1px solid rgba(239,68,68,.2)', background: '#FEE2E2', cursor: 'pointer', fontSize: '.68rem', fontWeight: 700, color: '#991B1B' }}></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '.85rem', color: '#1A202C' }}>{editing ? 'Editar empleado' : 'Nuevo empleado'}</span>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#718096' }}>✕</button>
            </div>
            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Nombre completo *</label>
                <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} style={inputStyle} onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
              <div>
                <label style={labelStyle}>DNI *</label>
                <input value={form.dni} onChange={e => setForm({ ...form, dni: e.target.value })} disabled={!!editing} style={{ ...inputStyle, opacity: editing ? .6 : 1 }} onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
              <div>
                <label style={labelStyle}>{editing ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={inputStyle} onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
              <div>
                <label style={labelStyle}>Teléfono</label>
                <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} style={inputStyle} onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
              <div>
                <label style={labelStyle}>Salario mensual (€)</label>
                <input type="number" step="0.01" value={form.salarioMensual || ''} onChange={e => setForm({ ...form, salarioMensual: +e.target.value })} style={inputStyle} onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
              <div>
                <label style={labelStyle}>Fecha de alta</label>
                <input type="date" value={form.fechaAlta || ''} onChange={e => setForm({ ...form, fechaAlta: e.target.value })} style={inputStyle} onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
              <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <input type="checkbox" id="activo_emp" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#00B4D8' }} />
                <label htmlFor="activo_emp" style={{ fontSize: '.76rem', fontWeight: 600, color: '#2D3748', cursor: 'pointer' }}>Empleado activo</label>
              </div>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '.6rem' }}>
              <button onClick={() => setModal(false)} style={{ padding: '.48rem .95rem', borderRadius: 7, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#2D3748' }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '.48rem .95rem', borderRadius: 7, border: 'none', background: '#00B4D8', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '.73rem', fontWeight: 700, color: '#0D1B2A', opacity: saving ? .7 : 1 }}>
                {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear empleado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}