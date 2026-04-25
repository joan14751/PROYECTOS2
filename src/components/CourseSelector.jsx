import { useState, useEffect } from 'react';
import { supabase } from '../api/supabase';
import { validateConstraints } from '../logic/constraints';

export const CourseSelector = ({ horarioElegido, setHorarioElegido }) => {
  const [cursosDisponibles, setCursosDisponibles] = useState([]);

  useEffect(() => {
    // Cargar cursos desde Supabase
    const fetchCursos = async () => {
      const { data } = await supabase.from('cursos').select('*');
      setCursosDisponibles(data);
    };
    fetchCursos();
  }, []);

  const agregarCurso = (curso) => {
    const validacion = validateConstraints(curso, horarioElegido);
    if (validacion.valid) {
      setHorarioElegido([...horarioElegido, curso]);
    } else {
      alert(validacion.error);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h2 className="text-xl font-bold">Cursos Disponibles</h2>
      {cursosDisponibles.map(c => (
        <button key={c.id} onClick={() => agregarCurso(c)} className="block m-2 p-2 bg-blue-500 text-white">
          {c.nombre} ({c.creditos} cr)
        </button>
      ))}
    </div>
  );
};