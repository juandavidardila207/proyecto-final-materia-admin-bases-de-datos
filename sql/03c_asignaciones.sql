-- =========================================================
-- ASIGNACIONES: qué materias dicta cada profesor (ampliación del modelo)
-- Antes se deducía de las matrículas. Ahora se elige explícitamente y una llave
-- foránea compuesta impide matricular con un profesor que no dicta esa materia.
-- Al borrar una materia o un profesor sin matrículas, sus asignaciones se borran solas (ON DELETE CASCADE).
-- Se carga con las parejas profesor-materia que ya existían en las matrículas.
-- Sirve tanto para una instalación nueva como para una base ya instalada.
-- =========================================================

CREATE TABLE ASIGNACIONES (
    id_curso    NUMBER NOT NULL,
    id_profesor NUMBER NOT NULL,
    CONSTRAINT pk_asignaciones PRIMARY KEY (id_curso, id_profesor) USING INDEX TABLESPACE TS_UNIV_INDICES,
    CONSTRAINT fk_asig_curso FOREIGN KEY (id_curso) REFERENCES CURSOS(id_curso) ON DELETE CASCADE,
    CONSTRAINT fk_asig_profesor FOREIGN KEY (id_profesor) REFERENCES PROFESORES(id_profesor) ON DELETE CASCADE
);

INSERT INTO ASIGNACIONES (id_curso, id_profesor)
SELECT DISTINCT id_curso, id_profesor FROM MATRICULAS;

ALTER TABLE MATRICULAS ADD CONSTRAINT fk_mat_asignacion
    FOREIGN KEY (id_curso, id_profesor) REFERENCES ASIGNACIONES (id_curso, id_profesor);

ALTER TABLE ASIGNACIONES ENABLE ROW MOVEMENT;

COMMIT;
