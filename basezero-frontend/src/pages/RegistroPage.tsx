import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registroEmpresa } from '../api';
import { useEmpresaStore } from '../store/empresaStore';

export default function RegistroPage() {
  const navigate = useNavigate();
  const { setConfig } = useEmpresaStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    nombreEmpresa: '',
    emailEmpresa: '',
    nombreAdmin: '',
    emailAdmin: '',
    passwordAdmin: '',
    passwordConfirm: '',
  });

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleNext = () => {
    if (step === 1) {
      if (!form.nombreEmpresa || !form.emailEmpresa) { setError('Completa todos los campos'); return; }
      if (!/\S+@\S+\.\S+/.test(form.emailEmpresa)) { setError('Email de empresa no válido'); return; }
    }
    if (step === 2) {
      if (!form.nombreAdmin || !form.emailAdmin || !form.passwordAdmin) { setError('Completa todos los campos'); return; }
      if (!/\S+@\S+\.\S+/.test(form.emailAdmin)) { setError('Email de administrador no válido'); return; }
      if (form.passwordAdmin.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
      if (!/[A-Z]/.test(form.passwordAdmin)) { setError('La contraseña debe contener al menos una mayúscula'); return; }
      if (!/[0-9]/.test(form.passwordAdmin)) { setError('La contraseña debe contener al menos un número'); return; }
      if (form.passwordAdmin !== form.passwordConfirm) { setError('Las contraseñas no coinciden'); return; }
    }
    setError('');
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await registroEmpresa({
        nombreEmpresa: form.nombreEmpresa,
        emailEmpresa: form.emailEmpresa,
        nombreAdmin: form.nombreAdmin,
        emailAdmin: form.emailAdmin,
        passwordAdmin: form.passwordAdmin,
      });
      
      // Guardar datos de la empresa en el store
      setConfig({
        nombre: form.nombreEmpresa,
        email: form.emailEmpresa,
        cif: '',
        direccion: '',
        telefono: '',
        web: '',
      });
      
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al registrar la empresa');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '.7rem .9rem',
    background: 'rgba(255,255,255,.06)',
    border: '1px solid rgba(255,255,255,.1)',
    borderRadius: 8, color: '#fff', fontSize: '.78rem',
    fontFamily: "'Montserrat', sans-serif", outline: 'none',
  };
  const labelStyle = {
    display: 'block' as const, fontSize: '.62rem', fontWeight: 700,
    color: 'rgba(255,255,255,.45)', marginBottom: '.35rem',
    textTransform: 'uppercase' as const, letterSpacing: '.08em',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0D1B2A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Montserrat', sans-serif", padding: '1.5rem' }}>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Background grid */}
      <div style={{ position: 'fixed', inset: 0, opacity: .04, backgroundImage: 'linear-gradient(rgba(0,180,216,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(0,180,216,.6) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-.05em', color: '#fff' }}>
            BASE<span style={{ color: '#00B4D8' }}>ZERO</span>
          </div>
          <div style={{ fontSize: '.5rem', fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: 'rgba(0,180,216,.4)', marginTop: '.3rem' }}>
            SYSTEM · CREA TU EMPRESA
          </div>
        </div>

        {success ? (
          // ── Success ──
          <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(0,180,216,.15)', borderRadius: 16, padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', marginBottom: '.5rem' }}>¡Empresa creada!</div>
            <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.5)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Tu empresa <strong style={{ color: '#00B4D8' }}>{form.nombreEmpresa}</strong> ha sido registrada correctamente.<br />
              Ya puedes iniciar sesión con tu email de administrador.
            </div>
            <button onClick={() => navigate('/login')} style={{ padding: '.72rem 2rem', borderRadius: 8, border: 'none', background: '#00B4D8', color: '#0D1B2A', fontSize: '.78rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}>
              Ir al login →
            </button>
          </div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(0,180,216,.15)', borderRadius: 16, padding: '2rem', backdropFilter: 'blur(10px)' }}>

            {/* Progress steps */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.8rem' }}>
              {[1, 2, 3].map((s, i) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', flex: s < 3 ? 1 : 'none' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '.65rem', fontWeight: 800, flexShrink: 0,
                    background: step > s ? '#00B4D8' : step === s ? 'rgba(0,180,216,.2)' : 'rgba(255,255,255,.06)',
                    border: `2px solid ${step >= s ? '#00B4D8' : 'rgba(255,255,255,.1)'}`,
                    color: step > s ? '#0D1B2A' : step === s ? '#00B4D8' : 'rgba(255,255,255,.3)',
                  }}>
                    {step > s ? '✓' : s}
                  </div>
                  {s < 3 && <div style={{ flex: 1, height: 2, background: step > s ? '#00B4D8' : 'rgba(255,255,255,.08)', margin: '0 .5rem' }} />}
                </div>
              ))}
            </div>

            {/* Step labels */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.5rem', marginBottom: '1.5rem' }}>
              {['Tu empresa', 'Administrador', 'Confirmar'].map((label, i) => (
                <div key={label} style={{ textAlign: i === 0 ? 'left' : i === 2 ? 'right' : 'center', fontSize: '.58rem', fontWeight: 700, color: step === i + 1 ? '#00B4D8' : 'rgba(255,255,255,.25)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  {label}
                </div>
              ))}
            </div>

            {/* Step 1 — Empresa */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ fontSize: '.85rem', fontWeight: 800, color: '#fff', marginBottom: '.2rem' }}>Datos de tu empresa</div>
                <div>
                  <label style={labelStyle}>Nombre de la empresa *</label>
                  <input value={form.nombreEmpresa} onChange={e => update('nombreEmpresa', e.target.value)} placeholder="Ej: Limpiezas García S.L." style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'} />
                </div>
                <div>
                  <label style={labelStyle}>Email de la empresa *</label>
                  <input type="email" value={form.emailEmpresa} onChange={e => update('emailEmpresa', e.target.value)} placeholder="info@tuempresa.com" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'} />
                  <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.25)', marginTop: '.3rem' }}>Email de contacto de la empresa, no del administrador</div>
                </div>
              </div>
            )}

            {/* Step 2 — Admin */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ fontSize: '.85rem', fontWeight: 800, color: '#fff', marginBottom: '.2rem' }}>Cuenta de administrador</div>
                <div>
                  <label style={labelStyle}>Nombre completo *</label>
                  <input value={form.nombreAdmin} onChange={e => update('nombreAdmin', e.target.value)} placeholder="Tu nombre" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'} />
                </div>
                <div>
                  <label style={labelStyle}>Email de acceso *</label>
                  <input type="email" value={form.emailAdmin} onChange={e => update('emailAdmin', e.target.value)} placeholder="admin@tuempresa.com" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'} />
                  <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.25)', marginTop: '.3rem' }}>Usarás este email para iniciar sesión</div>
                </div>
                <div>
                  <label style={labelStyle}>Contraseña *</label>
                  <input type="password" value={form.passwordAdmin} onChange={e => update('passwordAdmin', e.target.value)} placeholder="Mínimo 6 caracteres" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'} />
                </div>
                <div>
                  <label style={labelStyle}>Confirmar contraseña *</label>
                  <input type="password" value={form.passwordConfirm} onChange={e => update('passwordConfirm', e.target.value)} placeholder="Repite la contraseña" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#00B4D8'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'} />
                </div>
              </div>
            )}

            {/* Step 3 — Confirm */}
            {step === 3 && (
              <div>
                <div style={{ fontSize: '.85rem', fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>Confirma los datos</div>
                {[
                  { label: 'Empresa', value: form.nombreEmpresa },
                  { label: 'Email empresa', value: form.emailEmpresa },
                  { label: 'Administrador', value: form.nombreAdmin },
                  { label: 'Email acceso', value: form.emailAdmin },
                ].map(f => (
                  <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '.55rem 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                    <span style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.4)', fontWeight: 600 }}>{f.label}</span>
                    <span style={{ fontSize: '.72rem', color: '#fff', fontWeight: 700 }}>{f.value}</span>
                  </div>
                ))}
                <div style={{ background: 'rgba(0,180,216,.06)', border: '1px solid rgba(0,180,216,.15)', borderRadius: 8, padding: '.7rem .9rem', marginTop: '1rem' }}>
                  <div style={{ fontSize: '.65rem', color: 'rgba(0,180,216,.8)', lineHeight: 1.5 }}>
                    Al registrarte aceptas que tus datos serán usados para gestionar tu cuenta en BASEZERO SYSTEM.
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 8, padding: '.6rem .9rem', marginTop: '1rem', fontSize: '.7rem', color: '#FCA5A5', fontWeight: 600 }}>
                ❌ {error}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '.6rem', marginTop: '1.5rem' }}>
              {step > 1 && (
                <button onClick={() => { setStep(s => s - 1); setError(''); }} style={{ flex: 1, padding: '.65rem', borderRadius: 8, border: '1px solid rgba(255,255,255,.1)', background: 'none', color: 'rgba(255,255,255,.6)', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}>
                  ← Atrás
                </button>
              )}
              {step < 3 ? (
                <button onClick={handleNext} style={{ flex: 2, padding: '.65rem', borderRadius: 8, border: 'none', background: '#00B4D8', color: '#0D1B2A', fontSize: '.75rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}>
                  Continuar →
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={loading} style={{ flex: 2, padding: '.65rem', borderRadius: 8, border: 'none', background: loading ? '#0090B0' : '#00B4D8', color: '#0D1B2A', fontSize: '.75rem', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Montserrat', sans-serif" }}>
                  {loading ? 'Creando empresa...' : '🚀 Crear empresa'}
                </button>
              )}
            </div>

            {/* Login link */}
            <div style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '.65rem', color: 'rgba(255,255,255,.25)' }}>
              ¿Ya tienes cuenta?{' '}
              <span onClick={() => navigate('/login')} style={{ color: '#00B4D8', cursor: 'pointer', fontWeight: 700 }}>Iniciar sesión</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}