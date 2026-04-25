const toNum = (timeStr) => parseInt(timeStr.replace(':', ''));

export const checkCollision = (newCourse, currentSchedule) => {
  return currentSchedule.some(course => 
    course.dia_semana === newCourse.dia_semana && 
    (
      (toNum(newCourse.bloque_inicio) >= toNum(course.bloque_inicio) && toNum(newCourse.bloque_inicio) < toNum(course.bloque_fin)) ||
      (toNum(newCourse.bloque_fin) > toNum(course.bloque_inicio) && toNum(newCourse.bloque_fin) <= toNum(course.bloque_fin))
    )
  );
};