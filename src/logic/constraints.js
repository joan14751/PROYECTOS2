export const validateConstraints = (nuevoCurso, horarioActual) => {
  // 1. Límite de créditos
  const totalCreditos = horarioActual.reduce((acc, c) => acc + (c.creditos || 0), 0);
  if (totalCreditos + nuevoCurso.creditos > 22) {
    return { valid: false, error: "Excede el límite de 22 créditos." };
  }

  // 2. Cruce de horarios (Usando los nombres de tu DB)
  const hayCruce = horarioActual.some(curso => 
    curso.dia_semana === nuevoCurso.dia_semana && 
    ((nuevoCurso.bloque_inicio >= curso.bloque_inicio && nuevoCurso.bloque_inicio < curso.bloque_fin) ||
     (nuevoCurso.bloque_fin > curso.bloque_inicio && nuevoCurso.bloque_fin <= curso.bloque_fin))
  );

  if (hayCruce) {
    return { valid: false, error: "Conflicto de horario con otro curso." };
  }

  return { valid: true };
};