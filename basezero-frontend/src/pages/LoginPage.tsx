import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, loginEmpleado } from '../api';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [tipoLogin, setTipoLogin] = useState<'usuario' | 'empleado'>('usuario');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let rawData;

      if (tipoLogin === 'empleado') {
        // 🔹 LOGIN EMPLEADO
        rawData = (await loginEmpleado(dni, password)).data;
      } else {
        // 🔹 LOGIN ADMIN / GESTOR
        rawData = (await login(username, password)).data;
      }

      const token = rawData?.token;

      if (!token) {
        setError('Error: El servidor no devolvió token');
        return;
      }

      // Guardar token
      localStorage.setItem('token', token);

      // Guardar usuario
      setAuth(token, {
        id: rawData.empleadoId || rawData.id || 0,
        email: rawData.email || rawData.dni || username,
        rol: rawData.rol,
        nombre: rawData.nombre,
        iniciales: rawData.iniciales || (rawData.nombre || username).slice(0, 2).toUpperCase(),
      });

      // Redirección por rol
      if (rawData.rol === 'EMPLEADO') {
        navigate('/tareas');
      } else {
        navigate('/');
      }

    } catch (err: any) {
      const status = err?.response?.status;

      if (status === 403) {
        setError('Empleado inactivo');
      } else if (status === 401) {
        setError('Credenciales incorrectas');
      } else {
        setError('Error de conexión con el servidor');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D1B2A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Montserrat', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 1.5rem' }}>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff' }}>
            BASE<span style={{ color: '#00B4D8' }}>ZERO</span>
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,.04)',
          border: '1px solid rgba(0,180,216,.15)',
          borderRadius: 16,
          padding: '2rem',
        }}>

          <h2 style={{ color: '#fff' }}>Iniciar sesión</h2>

          {/* SELECTOR */}
          <div style={{ display: 'flex', gap: '.5rem', margin: '1rem 0' }}>
            <button
              type="button"
              onClick={() => setTipoLogin('usuario')}
              style={{
                flex: 1,
                padding: '.5rem',
                background: tipoLogin === 'usuario' ? '#00B4D8' : '#222',
                color: '#fff',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              ADMIN
            </button>

            <button
              type="button"
              onClick={() => setTipoLogin('empleado')}
              style={{
                flex: 1,
                padding: '.5rem',
                background: tipoLogin === 'empleado' ? '#00B4D8' : '#222',
                color: '#fff',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              EMPLEADO
            </button>
          </div>

          <form onSubmit={handleSubmit}>

            <input
              type="text"
              value={tipoLogin === 'empleado' ? dni : username}
              onChange={e => tipoLogin === 'empleado' ? setDni(e.target.value) : setUsername(e.target.value)}
              placeholder={tipoLogin === 'empleado' ? 'DNI' : 'Email'}
              required
              style={{ width: '100%', marginBottom: '1rem', padding: '.7rem' }}
            />

            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
              style={{ width: '100%', marginBottom: '1rem', padding: '.7rem' }}
            />

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '.7rem',
                background: '#00B4D8',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {loading ? 'Cargando...' : 'Entrar'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '.65rem', color: 'rgba(255,255,255,.3)' }}>
              ¿No tienes cuenta?{' '}
              <span onClick={() => navigate('/registro')} style={{ color: '#00B4D8', cursor: 'pointer', fontWeight: 700 }}>
                Crear empresa
              </span>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}