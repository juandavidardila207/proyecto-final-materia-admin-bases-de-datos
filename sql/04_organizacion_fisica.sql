-- =========================================================
-- Mueve los índices de PK al tablespace de índices, crea índices para las
-- llaves foráneas (Oracle no los crea solo) y habilita FLASHBACK TABLE.
-- =========================================================
BEGIN
  FOR i IN (SELECT index_name FROM dba_indexes WHERE owner = 'UNIVERSIDAD') LOOP
    EXECUTE IMMEDIATE 'ALTER INDEX UNIVERSIDAD."' || i.index_name || '" REBUILD TABLESPACE TS_UNIV_INDICES';
  END LOOP;
END;
/
-- (id_curso, id_profesor) cubre FK_MAT_CURSO y la llave compuesta FK_MAT_ASIGNACION
CREATE INDEX UNIVERSIDAD.IDX_MAT_CURSO_PROFESOR ON UNIVERSIDAD.MATRICULAS (id_curso, id_profesor) TABLESPACE TS_UNIV_INDICES;
CREATE INDEX UNIVERSIDAD.IDX_ASIG_PROFESOR ON UNIVERSIDAD.ASIGNACIONES (id_profesor) TABLESPACE TS_UNIV_INDICES;
CREATE INDEX UNIVERSIDAD.IDX_MAT_PROFESOR   ON UNIVERSIDAD.MATRICULAS (id_profesor)   TABLESPACE TS_UNIV_INDICES;
-- Un estudiante no puede tener la misma materia dos veces en el mismo semestre.
-- Su índice empieza por id_estudiante, así que también sirve para buscar las matrículas de un estudiante.
ALTER TABLE UNIVERSIDAD.MATRICULAS ADD CONSTRAINT UQ_MAT_EST_CURSO_SEM
  UNIQUE (id_estudiante, id_curso, semestre) USING INDEX TABLESPACE TS_UNIV_INDICES;

ALTER TABLE UNIVERSIDAD.PROFESORES ENABLE ROW MOVEMENT;
ALTER TABLE UNIVERSIDAD.CURSOS     ENABLE ROW MOVEMENT;
ALTER TABLE UNIVERSIDAD.MATRICULAS ENABLE ROW MOVEMENT;
ALTER TABLE UNIVERSIDAD.ESTUDIANTES ENABLE ROW MOVEMENT;

BEGIN
  DBMS_STATS.GATHER_SCHEMA_STATS('UNIVERSIDAD');
END;
/
