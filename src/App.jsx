import { useEffect, useState } from 'react';
import { supabase } from './api/supabase';
import { Toaster, toast } from 'sonner';

function App() {
  const [user, setUser] = useState(null);
  const [rol, setRol] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [entrando, setEntrando] = useState(false);
  const [authCargando, setAuthCargando] = useState(true);

  // --- ESTADOS DOCENTE ---
  const [diaSeleccionado, setDiaSeleccionado] = useState('Lunes');
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFin, setHoraFin] = useState('10:00');
  const [disponibilidadDocente, setDisponibilidadDocente] = useState([]);

  // --- ESTADOS ALUMNO / CONFIGURACIÓN ---
  const [modalidad, setModalidad] = useState(null);
  const [pasoConfigurado, setPasoConfigurado] = useState(false);
  const [diaPref, setDiaPref] = useState("Lunes");
  const [horaPref, setHoraPref] = useState("08:00");
  const [cursos, setCursos] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [horariosSugeridos, setHorariosSugeridos] = useState([]);
  const [matricula, setMatricula] = useState([]);

  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const opcionesHoras = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"];

  // 1. Verificar sesión inicial y cambios de estado
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        cargarDatos(session.user);
      }
      setAuthCargando(false);
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        cargarDatos(session.user);
      } else {
        setUser(null);
        setRol(null);
        setDisponibilidadDocente([]);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const cargarDatos = async (usuario) => {
    try {
      const { data: perfil } = await supabase.from('perfiles').select('rol').eq('email', usuario.email).single();
      const miRol = perfil?.rol || 'docente';
      setRol(miRol);

      if (miRol === 'docente') {
        const { data: horarios } = await supabase
          .from('disponibilidad_docente')
          .select('id, dia_semana, bloque_inicio, bloque_fin') 
          .eq('docente_id', usuario.id);
        if (horarios) setDisponibilidadDocente(horarios);
      } else {
        // Si es alumno, cargamos los cursos disponibles
        const { data: listaCursos } = await supabase.from('cursos').select('*');
        setCursos(listaCursos || []);
      }
    } catch (e) { console.error("Error al cargar datos"); }
  };

  // --- FUNCIONES DOCENTE ---
  const agregarHorario = async () => {
    if (horaInicio >= horaFin) return toast.error("La hora de fin debe ser mayor a la de inicio");
    try {
      const { data, error } = await supabase.from('disponibilidad_docente').insert([
        { docente_id: user.id, dia_semana: diaSeleccionado, bloque_inicio: horaInicio, bloque_fin: horaFin }
      ]).select();
      if (error) throw error;
      setDisponibilidadDocente(prev => [...prev, data[0]]);
      toast.success("Horario añadido");
    } catch (e) { toast.error(`Error: ${e.message}`); }
  };

  const eliminarHorario = async (id) => {
    const { error } = await supabase.from('disponibilidad_docente').delete().eq('id', id);
    if (!error) {
      setDisponibilidadDocente(prev => prev.filter(h => h.id !== id));
      toast.info("Horario eliminado");
    }
  };

  // --- FUNCIONES ALUMNO ---
  const inscribirCurso = (horario) => {
    const yaInscrito = matricula.find(m => m.curso_id === horario.curso_id);
    if (yaInscrito) return toast.error("Ya estás inscrito en esta asignatura");
    const nuevaInscripcion = { ...horario, nombreCurso: cursoSeleccionado.nombre };
    setMatricula([...matricula, nuevaInscripcion]);
    toast.success(`Inscrito en ${cursoSeleccionado.nombre}`);
  };

  const eliminarInscripcion = (cursoId) => {
    setMatricula(matricula.filter(m => m.curso_id !== cursoId));
    toast.info("Asignatura eliminada");
  };

  if (authCargando) return <div className="h-screen flex items-center justify-center font-black uppercase">Cargando...</div>;

  if (!user) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Toaster richColors />
      <div className="bg-zinc-900 border-2 border-blue-600 p-8 w-full max-w-sm text-white text-mono">
        <h2 className="text-xl font-black mb-6 uppercase text-center italic border-b border-zinc-800 pb-2">Acceso Sistema</h2>
        <form onSubmit={async (e) => {
          e.preventDefault();
          setEntrando(true);
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) { toast.error(error.message); setEntrando(false); }
        }} className="space-y-4">
          <input type="email" placeholder="Email" className="w-full bg-black border border-zinc-800 p-3 text-blue-400 outline-none" onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" className="w-full bg-black border border-zinc-800 p-3 text-blue-400 outline-none" onChange={e => setPassword(e.target.value)} required />
          <button className="w-full bg-blue-600 p-4 font-black uppercase">{entrando ? 'Entrando...' : 'Entrar'}</button>
        </form>
      </div>
    </div>
  );

  // --- VISTA DOCENTE ---
  if (rol === 'docente') {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 font-mono text-xs">
        <Toaster richColors position="bottom-right" />
        <div className="max-w-4xl mx-auto">
          <header className="mb-6 border-b border-zinc-800 pb-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black italic text-blue-500 uppercase">PANEL DOCENTE</h1>
              <p className="text-[10px] text-zinc-500">{user.email}</p>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="bg-red-600 px-4 py-1 font-black uppercase rounded">Salir</button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-zinc-900/50 p-4 border border-zinc-800 rounded mb-8">
            <select value={diaSeleccionado} onChange={e => setDiaSeleccionado(e.target.value)} className="bg-black border border-zinc-700 p-2 outline-none">
              {dias.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={horaInicio} onChange={e => setHoraInicio(e.target.value)} className="bg-black border border-zinc-700 p-2 outline-none">
              {opcionesHoras.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <select value={horaFin} onChange={e => setHoraFin(e.target.value)} className="bg-black border border-zinc-700 p-2 outline-none">
              {opcionesHoras.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <button onClick={agregarHorario} className="bg-blue-600 font-black uppercase hover:bg-blue-500 h-[34px]">Añadir Rango</button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 shadow-2xl">
            <h2 className="text-xs font-black uppercase mb-4 italic text-blue-500 border-b border-zinc-800 pb-2">Tu Disponibilidad:</h2>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase">
                  <th className="py-2 px-4">Día</th>
                  <th className="py-2 px-4">Inicio</th>
                  <th className="py-2 px-4">Fin</th>
                  <th className="py-2 px-4 text-center">Eliminar</th>
                </tr>
              </thead>
              <tbody>
                {disponibilidadDocente.map(item => (
                  <tr key={item.id} className="border-b border-zinc-800">
                    <td className="py-3 px-4 font-bold text-blue-400">{item.dia_semana}</td>
                    <td className="py-3 px-4">{item.bloque_inicio}</td>
                    <td className="py-3 px-4">{item.bloque_fin}</td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => eliminarHorario(item.id)} className="text-red-500 font-black hover:scale-125 transition-transform">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA ALUMNO ---
  return (
    <div className="min-h-screen bg-slate-100 p-8 border-[12px] border-black font-mono">
      <Toaster richColors position="top-center" />
      <div className="max-w-6xl mx-auto text-xs">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-black uppercase">Panel Alumno</h1>
          <button onClick={() => supabase.auth.signOut()} className="bg-black text-white px-4 py-1 font-black uppercase">Cerrar Sesión</button>
        </div>

        {!pasoConfigurado ? (
          <div className="bg-white border-8 border-black p-8 max-w-md mx-auto">
            <p className="font-black uppercase mb-4 italic">Configura tu horario preferido:</p>
            <div className="space-y-4">
              <select className="w-full border-4 border-black p-3 font-black uppercase" value={diaPref} onChange={e => setDiaPref(e.target.value)}>
                {dias.map(d => <option key={d}>{d}</option>)}
              </select>
              <input type="time" className="w-full border-4 border-black p-3 font-black" value={horaPref} onChange={e => setHoraPref(e.target.value)} />
              <button onClick={() => setPasoConfigurado(true)} className="w-full bg-black text-white p-4 font-black uppercase hover:bg-blue-600 transition-all">Activar Algoritmo</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-4 bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_black]">
              <h3 className="font-black border-b-4 border-black mb-6 uppercase">Asignaturas</h3>
              <div className="space-y-3">
                {cursos.map(c => (
                  <button key={c.id} onClick={() => setCursoSeleccionado(c)} className={`w-full text-left p-4 border-4 font-black uppercase shadow-[4px_4px_0px_0px_black] ${cursoSeleccionado?.id === c.id ? 'bg-black text-white' : 'bg-white'}`}>
                    {c.nombre}
                  </button>
                ))}
              </div>
              <button onClick={() => setPasoConfigurado(false)} className="mt-8 text-xs underline font-black">← Volver a configurar</button>
            </div>

            <div className="col-span-8 space-y-8">
              <div className="bg-blue-700 border-4 border-black p-8 shadow-[12px_12px_0px_0px_black] text-white">
                <h2 className="text-xl font-black uppercase italic mb-6">Matching: {diaPref} {horaPref}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {horariosSugeridos.length > 0 ? horariosSugeridos.map(h => (
                    <div key={h.id} className="bg-white text-black border-4 border-black p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)]">
                      <p className="font-black text-lg uppercase italic">{h.docente_nombre}</p>
                      <button onClick={() => inscribirCurso(h)} className="w-full mt-3 bg-yellow-400 font-black py-2 border-2 border-black uppercase text-xs">Inscribirse</button>
                    </div>
                  )) : <p className="opacity-60 italic">Selecciona una asignatura para buscar docentes...</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;