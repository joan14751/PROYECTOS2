<<<<<<< HEAD
import { useEffect, useState } from 'react';
import { supabase } from './api/supabase';
import { Toaster, toast } from 'sonner';

function App() {
  // --- ESTADOS DE AUTENTICACIÓN Y ROLES ---
  const [user, setUser] = useState(null);
  const [rol, setRol] = useState(null);
  const [authCargando, setAuthCargando] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- CONFIGURACIÓN DE HORARIOS ---
  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const opcionesHoras = [
    "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", 
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
  ];

  // --- ESTADOS DOCENTE ---
  const [disponibilidadDocente, setDisponibilidadDocente] = useState([]);

  // --- ESTADOS ALUMNO (RANGO HORARIO) ---
  const [modalidad, setModalidad] = useState(null);
  const [pasoConfigurado, setPasoConfigurado] = useState(false);
  const [diaPref, setDiaPref] = useState("Lunes");
  const [horaDesde, setHoraDesde] = useState("08:00"); 
  const [horaHasta, setHoraHasta] = useState("12:00"); 
  const [cursos, setCursos] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);

  // 1. Manejo de Sesión y Persistencia de Rol
  useEffect(() => {
    const inicializar = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        const { data: p } = await supabase.from('perfiles').select('rol').eq('id', session.user.id).single();
        setRol(p?.rol || 'alumno');
      }
      setAuthCargando(false);
    };
    inicializar();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null);
      if (session) {
        const { data: p } = await supabase.from('perfiles').select('rol').eq('id', session.user.id).single();
        setRol(p?.rol || 'alumno');
      } else {
        // Limpieza total al salir
        setRol(null);
        setPasoConfigurado(false);
        setModalidad(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // 2. Acciones de Sesión
  const manejarLogin = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return toast.error("Credenciales incorrectas");
    toast.success("Bienvenido al sistema");
  };

  const manejarCerrarSesion = async () => {
    await supabase.auth.signOut();
    toast.info("Sesión cerrada");
  };

  // 3. Lógica Alumno: Validación de Rango
  const activarAlgoritmo = () => {
    const indexDesde = opcionesHoras.indexOf(horaDesde);
    const indexHasta = opcionesHoras.indexOf(horaHasta);

    if (indexDesde >= indexHasta) {
      return toast.error("La hora 'Hasta' debe ser mayor a la de 'Desde'");
    }
    if (!modalidad) return toast.error("Selecciona una modalidad");

    setPasoConfigurado(true);
    toast.success(`Buscando disponibilidad para el ${diaPref}`);
  };

  // 4. Lógica Docente: Marcar Disponibilidad
  const toggleDisponibilidad = (dia, hora) => {
    const clave = `${dia}-${hora}`;
    setDisponibilidadDocente(prev => 
      prev.includes(clave) ? prev.filter(i => i !== clave) : [...prev, clave]
    );
  };

  if (authCargando) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white font-black">SINCRONIZANDO...</div>;

  // --- VISTA: LOGIN ---
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
        <Toaster richColors />
        <div className="bg-zinc-900 border-2 border-blue-500 p-8 w-full max-w-md shadow-2xl">
          <h2 className="text-2xl font-black mb-6 text-center uppercase italic border-b border-blue-500 pb-2">Identificación</h2>
          <form onSubmit={manejarLogin} className="space-y-4">
            <input type="email" placeholder="Correo Institucional" className="w-full bg-black border border-zinc-700 p-3 text-blue-400 font-mono" onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Contraseña" className="w-full bg-black border border-zinc-700 p-3 text-blue-400 font-mono" onChange={e => setPassword(e.target.value)} required />
            <button className="w-full bg-blue-600 p-4 font-black uppercase hover:bg-blue-500 transition-all shadow-[0_4px_0_rgb(29,78,216)]">Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  // --- VISTA: PANEL DOCENTE (TABLA DE DISPONIBILIDAD) ---
  if (rol === 'docente') {
    return (
      <div className="min-h-screen bg-[#020617] text-cyan-400 p-8 font-mono">
        <Toaster richColors />
        <header className="max-w-6xl mx-auto flex justify-between items-center mb-10 border-b-2 border-cyan-900 pb-6">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-widest italic text-blue-500">Panel Docente</h1>
            <p className="text-xs mt-1 text-slate-400">Sesión: {user.email}</p>
          </div>
          <button onClick={manejarCerrarSesion} className="bg-red-600 text-white px-6 py-2 font-black uppercase border-2 border-white hover:bg-black transition-all">Salir</button>
        </header>

        <div className="max-w-6xl mx-auto overflow-hidden border-2 border-cyan-900 rounded-lg bg-slate-900/50">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-cyan-950/50">
                <th className="p-4 border border-cyan-900 text-xs text-cyan-500 uppercase italic font-black">Hora</th>
                {dias.map(d => <th key={d} className="p-4 border border-cyan-900 text-sm font-black text-white uppercase">{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {opcionesHoras.map(h => (
                <tr key={h} className="hover:bg-cyan-500/5">
                  <td className="p-4 border border-cyan-900 font-bold text-cyan-300">{h}</td>
                  {dias.map(d => {
                    const estaActivo = disponibilidadDocente.includes(`${d}-${h}`);
                    return (
                      <td key={d} onClick={() => toggleDisponibilidad(d, h)}
                        className={`p-2 border border-cyan-900 cursor-pointer transition-all ${estaActivo ? 'bg-cyan-600 shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]' : 'hover:bg-slate-800'}`}>
                        <div className="h-10 flex items-center justify-center text-[10px] font-black text-black italic">{estaActivo ? 'DISPONIBLE' : ''}</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- VISTA: PANEL ALUMNO (RANGO HORARIO) ---
  if (!pasoConfigurado) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
        <Toaster richColors position="top-center" />
        <h2 className="text-3xl font-black mb-4 uppercase italic">Panel de Control</h2>
        <p className="text-slate-400 mb-2 italic">Sesión activa: {user.email}</p>
        <button onClick={manejarCerrarSesion} className="bg-red-600 px-4 py-1 font-black text-[10px] mb-8 rounded border border-white">SALIR</button>

        <div className="bg-zinc-800 p-8 border-4 border-black shadow-2xl w-full max-w-lg">
          <div className="mb-8 text-left">
            <p className="font-bold uppercase text-xs text-blue-400 mb-4 tracking-widest italic">1. Elige Modalidad:</p>
            <div className="flex gap-2">
              {['presencial', 'distancia'].map(m => (
                <button key={m} onClick={() => setModalidad(m)} 
                  className={`flex-1 p-3 border-2 font-black uppercase transition-all ${modalidad === m ? 'bg-white text-black border-white shadow-none translate-y-1' : 'border-zinc-600 text-zinc-500 hover:border-zinc-400 shadow-[0_4px_0_rgb(0,0,0)]'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8 text-left">
            <p className="font-bold uppercase text-xs text-blue-400 mb-4 tracking-widest italic">2. Rango Disponible ({diaPref}):</p>
            <div className="grid grid-cols-1 gap-4">
              <select value={diaPref} onChange={e => setDiaPref(e.target.value)} className="w-full bg-zinc-900 border-2 border-zinc-700 p-3 font-bold text-white outline-none">
                {dias.map(d => <option key={d}>{d}</option>)}
              </select>

              <div className="flex items-center gap-4 bg-zinc-900 p-4 border-2 border-zinc-700">
                <div className="flex-1">
                  <label className="text-[9px] block mb-1 text-zinc-500 uppercase font-black italic">Desde</label>
                  <select value={horaDesde} onChange={e => setHoraDesde(e.target.value)} className="w-full bg-transparent font-black text-xl outline-none text-white">
                    {opcionesHoras.map(h => <option key={h} className="bg-zinc-800">{h}</option>)}
                  </select>
                </div>
                <div className="text-blue-500 font-black text-xl">→</div>
                <div className="flex-1">
                  <label className="text-[9px] block mb-1 text-zinc-500 uppercase font-black italic">Hasta</label>
                  <select value={horaHasta} onChange={e => setHoraHasta(e.target.value)} className="w-full bg-transparent font-black text-xl outline-none text-white">
                    {opcionesHoras.map(h => <option key={h} className="bg-zinc-800">{h}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button onClick={activarAlgoritmo} className="w-full bg-blue-600 p-5 font-black uppercase text-xl shadow-[0_5px_0_rgb(29,78,216)] active:translate-y-1 active:shadow-none transition-all">
            Activar Algoritmo
          </button>
        </div>
      </div>
    );
  }

  // --- VISTA ALUMNO: RESULTADOS ---
  return (
    <div className="min-h-screen bg-white p-8 border-[10px] border-black">
      <div className="flex justify-between items-center mb-10 border-b-4 border-black pb-4">
        <h2 className="text-3xl font-black uppercase italic italic">Resultados Matching</h2>
        <button onClick={() => setPasoConfigurado(false)} className="bg-black text-white px-4 py-2 font-black uppercase text-xs">Volver al Panel</button>
      </div>
      
      <div className="bg-blue-50 p-6 border-4 border-black inline-block mb-8 shadow-[8px_8px_0_black]">
        <p className="font-black uppercase text-xs text-blue-900">Tus Preferencias:</p>
        <p className="text-blue-700 font-black text-xl">{diaPref} | {horaDesde} a {horaHasta}</p>
        <p className="text-black font-bold uppercase text-[10px] mt-1 border-t border-black/10 pt-1">Modalidad: {modalidad}</p>
      </div>
      
      <div className="mt-10 border-t-2 border-dashed border-slate-300 pt-10">
        <p className="italic text-slate-400 uppercase font-black text-sm tracking-widest animate-pulse">Buscando docentes compatibles en la base de datos...</p>
      </div>
    </div>
  );
}

export default App;
=======
export const Calendar = ({ horario }) => {
  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  // Asegúrate de que estas horas coincidan exactamente con lo que escribiste en la base de datos
  const horas = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];

  return (
    <div className="overflow-x-auto mt-6">
      <table className="w-full border-collapse border border-gray-300 shadow-lg">
        <thead>
          <tr className="bg-indigo-600 text-white">
            <th className="border p-3">Hora</th>
            {dias.map(d => <th key={d} className="border p-3">{d}</th>)}
          </tr>
        </thead>
        <tbody>
          {horas.map(hora => (
            <tr key={hora} className="hover:bg-gray-50">
              <td className="border p-3 font-bold text-gray-600 bg-gray-100 text-center">
                {hora}
              </td>
              {[1, 2, 3, 4, 5, 6].map(diaNum => {
                
                // AQUÍ ES DONDE SE HIZO EL CAMBIO:
                // Antes decía c.dia === diaNum && c.inicio === hora
                const cursoEnBloque = horario.find(c => 
                  Number(c.dia_semana) === diaNum && c.bloque_inicio === hora
                );

                return (
                  <td key={diaNum} className="border p-2 h-20 min-w-[140px] relative">
                    {cursoEnBloque && (
                      <div className="absolute inset-1 bg-indigo-500 text-white text-[10px] p-2 rounded shadow-md flex flex-col justify-center border-l-4 border-yellow-400">
                        <span className="font-bold uppercase mb-1 leading-tight">
                          {cursoEnBloque.nombre}
                        </span>
                        <span className="opacity-90 italic">
                          {cursoEnBloque.aula || 'Sin aula'}
                        </span>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
>>>>>>> fdf2506528b4ec0f6bbd7f17c425cda0d83eb13b
