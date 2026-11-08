-- Consultas obligatorias del taller. La interfaz web lee este mismo archivo:
-- cada bloque empieza con "-- @reporte <n> | <enunciado>".
ALTER SESSION SET CURRENT_SCHEMA = UNIVERSIDAD;

-- @reporte 1 | Listado de los profesores con las asignaturas asignadas
SELECT DISTINCT p.id_profesor, p.nombre AS profesor, c.id_curso, c.nombre AS asignatura
FROM PROFESORES p
JOIN MATRICULAS m ON m.id_profesor = p.id_profesor
JOIN CURSOS c ON c.id_curso = m.id_curso
ORDER BY p.nombre, c.nombre;

-- @reporte 2 | Nombre del curso con los créditos y la cantidad de estudiantes matriculados
SELECT c.nombre AS curso, c.creditos, COUNT(DISTINCT m.id_estudiante) AS estudiantes_matriculados
FROM CURSOS c
LEFT JOIN MATRICULAS m ON m.id_curso = c.id_curso
GROUP BY c.nombre, c.creditos
ORDER BY estudiantes_matriculados DESC, c.nombre;

-- @reporte 3 | Listado de asignaturas, con el profesor asignado y el código de los estudiantes que matricularon
SELECT c.nombre AS asignatura, p.nombre AS profesor, m.id_estudiante AS codigo_estudiante
FROM MATRICULAS m
JOIN CURSOS c ON c.id_curso = m.id_curso
JOIN PROFESORES p ON p.id_profesor = m.id_profesor
ORDER BY c.nombre, p.nombre, m.id_estudiante;

-- @reporte 4 | Departamento con los cursos que tiene asignados y el profesor que orienta cada curso
SELECT DISTINCT p.departamento, c.id_curso, c.nombre AS curso, p.nombre AS profesor
FROM PROFESORES p
JOIN MATRICULAS m ON m.id_profesor = p.id_profesor
JOIN CURSOS c ON c.id_curso = m.id_curso
ORDER BY p.departamento, c.nombre, p.nombre;
