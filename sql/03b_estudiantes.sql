-- =========================================================
-- ESTUDIANTES (agregado al modelo del taller)
-- El esquema original solo guardaba el código del estudiante en MATRICULAS.
-- Esta tabla le da nombre, programa y correo, y una llave foránea
-- impide matricular a alguien que no esté registrado.
-- Los 60 estudiantes son los códigos que ya usaban las matrículas; los nombres son datos de prueba.
-- =========================================================

CREATE TABLE ESTUDIANTES (
    id_estudiante NUMBER PRIMARY KEY,
    nombre VARCHAR2(100) NOT NULL,
    programa VARCHAR2(100),
    correo VARCHAR2(120) NOT NULL,
    CONSTRAINT uq_est_correo UNIQUE (correo),
    CONSTRAINT ck_est_correo CHECK (REGEXP_LIKE(correo, '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'))
);

INSERT INTO ESTUDIANTES VALUES (201, 'Santiago Gómez Hernández', 'Ingeniería de Sistemas', 'santiago.gomez201@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (202, 'Daniela Moreno Quintero', 'Medicina', 'daniela.moreno202@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (203, 'Emiliano Quintero Castro', 'Derecho', 'emiliano.quintero203@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (204, 'Camila Martínez Arango', 'Psicología', 'camila.martinez204@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (205, 'Simón Muñoz Ortiz', 'Economía', 'simon.munoz205@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (206, 'Isabella Ospina Gómez', 'Arquitectura', 'isabella.ospina206@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (207, 'Tomás Ramírez Suárez', 'Ingeniería de Sistemas', 'tomas.ramirez207@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (208, 'Sara Suárez García', 'Medicina', 'sara.suarez208@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (209, 'Julián Cortés Patiño', 'Derecho', 'julian.cortes209@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (210, 'Mariana Castro Vargas', 'Psicología', 'mariana.castro210@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (211, 'Alejandro Cárdenas Ospina', 'Economía', 'alejandro.cardenas211@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (212, 'Paula Rodríguez Jiménez', 'Arquitectura', 'paula.rodriguez212@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (213, 'Esteban Jiménez Bermúdez', 'Ingeniería de Sistemas', 'esteban.jimenez213@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (214, 'Valentina Salazar Romero', 'Medicina', 'valentina.salazar214@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (215, 'Nicolás García Martínez', 'Derecho', 'nicolas.garcia215@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (216, 'Juliana Álvarez Cárdenas', 'Psicología', 'juliana.alvarez216@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (217, 'Felipe Arango Torres', 'Economía', 'felipe.arango217@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (218, 'Antonia Torres Restrepo', 'Arquitectura', 'antonia.torres218@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (219, 'Samuel Mejía Moreno', 'Ingeniería de Sistemas', 'samuel.mejia219@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (220, 'Laura Bermúdez Cortés', 'Medicina', 'laura.bermudez220@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (221, 'Andrés Rojas Álvarez', 'Derecho', 'andres.rojas221@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (222, 'Natalia Patiño López', 'Psicología', 'natalia.patino222@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (223, 'Mateo López Ríos', 'Economía', 'mateo.lopez223@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (224, 'Gabriela Ortiz Ramírez', 'Arquitectura', 'gabriela.ortiz224@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (225, 'Martín Restrepo Salazar', 'Ingeniería de Sistemas', 'martin.restrepo225@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (226, 'Catalina Hernández Rojas', 'Medicina', 'catalina.hernandez226@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (227, 'Sebastián Romero Zapata', 'Derecho', 'sebastian.romero227@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (228, 'Sofía Zapata Muñoz', 'Psicología', 'sofia.zapata228@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (229, 'David Vargas Rodríguez', 'Economía', 'david.vargas229@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (230, 'Manuela Ríos Mejía', 'Arquitectura', 'manuela.rios230@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (231, 'Mariana Ortiz Restrepo', 'Ingeniería de Sistemas', 'mariana.ortiz231@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (232, 'Alejandro Restrepo Moreno', 'Medicina', 'alejandro.restrepo232@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (233, 'Paula Hernández Cortés', 'Derecho', 'paula.hernandez233@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (234, 'Esteban Romero Álvarez', 'Psicología', 'esteban.romero234@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (235, 'Valentina Zapata López', 'Economía', 'valentina.zapata235@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (236, 'Nicolás Vargas Ríos', 'Arquitectura', 'nicolas.vargas236@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (237, 'Juliana Ríos Ramírez', 'Ingeniería de Sistemas', 'juliana.rios237@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (238, 'Felipe Gómez Salazar', 'Medicina', 'felipe.gomez238@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (239, 'Antonia Moreno Rojas', 'Derecho', 'antonia.moreno239@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (240, 'Samuel Quintero Zapata', 'Psicología', 'samuel.quintero240@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (241, 'Laura Martínez Muñoz', 'Economía', 'laura.martinez241@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (242, 'Andrés Muñoz Rodríguez', 'Arquitectura', 'andres.munoz242@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (243, 'Natalia Ospina Mejía', 'Ingeniería de Sistemas', 'natalia.ospina243@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (244, 'Mateo Ramírez Hernández', 'Medicina', 'mateo.ramirez244@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (245, 'Gabriela Suárez Quintero', 'Derecho', 'gabriela.suarez245@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (246, 'Martín Cortés Castro', 'Psicología', 'martin.cortes246@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (247, 'Catalina Castro Arango', 'Economía', 'catalina.castro247@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (248, 'Sebastián Cárdenas Ortiz', 'Arquitectura', 'sebastian.cardenas248@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (249, 'Sofía Rodríguez Gómez', 'Ingeniería de Sistemas', 'sofia.rodriguez249@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (250, 'David Jiménez Suárez', 'Medicina', 'david.jimenez250@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (251, 'Manuela Salazar García', 'Derecho', 'manuela.salazar251@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (252, 'Santiago García Patiño', 'Psicología', 'santiago.garcia252@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (253, 'Daniela Álvarez Vargas', 'Economía', 'daniela.alvarez253@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (254, 'Emiliano Arango Ospina', 'Arquitectura', 'emiliano.arango254@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (255, 'Camila Torres Jiménez', 'Ingeniería de Sistemas', 'camila.torres255@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (256, 'Simón Mejía Bermúdez', 'Medicina', 'simon.mejia256@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (257, 'Isabella Bermúdez Romero', 'Derecho', 'isabella.bermudez257@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (258, 'Tomás Rojas Martínez', 'Psicología', 'tomas.rojas258@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (259, 'Sara Patiño Cárdenas', 'Economía', 'sara.patino259@universidad.edu.co');
INSERT INTO ESTUDIANTES VALUES (260, 'Julián López Torres', 'Arquitectura', 'julian.lopez260@universidad.edu.co');

ALTER TABLE MATRICULAS ADD CONSTRAINT fk_mat_estudiante
    FOREIGN KEY (id_estudiante) REFERENCES ESTUDIANTES(id_estudiante);

COMMIT;
