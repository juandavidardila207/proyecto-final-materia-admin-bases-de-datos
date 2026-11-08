# Proyecto de Bases de Datos: registro académico de estudiantes, materias y matrículas

Basado en el taller del **Caso #4** (`sql/03_taller_freesql.sql`, sin cambios), ampliado con una tabla de
**estudiantes** (`sql/03b_estudiantes.sql`).
Oracle Database 26ai Free en Docker, administrado con SQL Developer, e interfaz web en
Next.js con shadcn/ui ([detalles de la web](web/README.md)).

**Para mostrar el código:** abre [`docs/codigo-del-proyecto.html`](docs/codigo-del-proyecto.html) en el navegador.
Tiene una guía del proyecto y todos los archivos, navegables y con buscador. Las contraseñas aparecen ocultas.

## Cómo acceder

### Lo que necesitas

- **Docker Desktop** abierto, con el contenedor `oracle`.
- **Node.js 20 o superior**. Compruébalo con `node -v`.
- Abrir una terminal en la carpeta `proyecto-bases`.

### Cada vez que vayas a usarlo

```bash
./iniciar.sh
```

El script enciende Oracle, espera a que esté listo y levanta la web. La primera vez también instala
dependencias y compila la app, lo que tarda alrededor de un minuto. Cuando veas
`Abre http://localhost:3000`, entra a <http://localhost:3000> en tu navegador.

Para apagar la web, presiona `Ctrl + C` en esa terminal. Oracle sigue encendido hasta que cierres
Docker Desktop o ejecutes `docker stop oracle`.

### Iniciar sesión

Se entra con usuarios **reales de Oracle**. Las contraseñas están en `sql/00_parametros.sql`, que se crea a partir de
[`sql/00_parametros.ejemplo.sql`](sql/00_parametros.ejemplo.sql) y no se sube al repositorio.

| Usuario | Rol | Ve en el menú |
|---|---|---|
| `U_CONSULTA` | Consulta | Registro y tablas en solo lectura, Reportes, Consola SQL |
| `U_OPERADOR` | Operador | Lo anterior, y además matricula, crea, edita y elimina |
| `U_AUDITOR` | Auditor | Registro y tablas en solo lectura, Reportes, Consola SQL y Auditoría |
| `U_ADMIN` | Administrador | Todo, incluidos Usuarios y Almacenamiento |

Tras 5 contraseñas erradas la cuenta se bloquea 1 hora. Un administrador puede desbloquearla en Usuarios.

### En SQL Developer

Crea una conexión nueva con:

- **Nombre:** `conn_universidad`
- **Usuario:** `UNIVERSIDAD`
- **Contraseña:** `pw_owner` en `sql/00_parametros.sql`
- **Nombre de host:** `localhost`
- **Puerto:** `1521`
- **Nombre del servicio:** `FREEPDB1`

También puedes entrar con cualquiera de los usuarios `U_*` para comprobar que Oracle les aplica los mismos permisos.

### En otro computador (primera vez)

Necesitas **Docker Desktop** y **Node.js 20 o superior**. En Windows, ejecuta los comandos dentro de
WSL (Ubuntu), porque los scripts son de bash. Descomprime el proyecto, abre una terminal en la carpeta
`proyecto-bases` y ejecuta en orden:

```bash
chmod +x *.sh backup/*.sh
```

```bash
cp sql/00_parametros.ejemplo.sql sql/00_parametros.sql
```

Abre `sql/00_parametros.sql` y cambia las contraseñas antes de instalar.

```bash
./crear_contenedor.sh
```

```bash
./instalar.sh
```

```bash
./iniciar.sh
```

- `crear_contenedor.sh` descarga Oracle (unos 3 GB) y lo inicia; la primera vez tarda varios minutos.
- `instalar.sh` crea tablespaces, usuarios, roles, auditoría y carga los datos del taller.
- `iniciar.sh` instala las dependencias de la web, la compila y la abre en <http://localhost:3000>.

Para usar los backups con RMAN, ejecuta además una sola vez:

```bash
backup/01_activar_archivelog.sh
```

Si ya tienes otro Oracle en el puerto 1521, usa otro puerto y avísale a la web:

```bash
PUERTO=1522 ./crear_contenedor.sh
```

```bash
DB_CONNECT=localhost:1522/FREEPDB1 ./iniciar.sh
```

### Si instalaste antes de que existieran las materias por profesor

```bash
./migrar_asignaciones.sh
```

Crea `ASIGNACIONES` con las parejas profesor-materia que ya tenían las matrículas. No borra datos.

### Si la base está vacía o quieres empezar de cero

`instalar.sh` falla si el proyecto ya está instalado. Para empezar de cero, cierra la web y ejecuta
antes `./desinstalar.sh`, que borra solo los objetos de este proyecto.

### Si algo falla

| Síntoma | Solución |
|---|---|
| `Cannot connect to the Docker daemon` | Abre Docker Desktop y espera a que diga *running* |
| La web dice «No hay conexión con la base de datos» | `docker start oracle` y espera un minuto |
| `address already in use` en el puerto 3000 | `PORT=3100 ./iniciar.sh` y abre <http://localhost:3100> |
| «Usuario o contraseña incorrectos» | Revisa `sql/00_parametros.sql`; los usuarios van en mayúsculas |
| «La cuenta está bloqueada» | Entra como `U_ADMIN` → Usuarios → menú ⋯ → Desbloquear |
| Te saca de la sesión | Pasaron 30 minutos sin uso o se reinició la web: vuelve a entrar |
| Cambiaste código de `web/` y no se ve | `cd web && npm run build`, luego `./iniciar.sh` |

## Qué pide el proyecto y dónde está

| Requisito | Dónde | Qué hay |
|---|---|---|
| Base del taller | `sql/03_taller_freesql.sql` | 3 tablas, 30 profesores, 40 cursos, 120 matrículas |
| Tabla de estudiantes | `sql/03b_estudiantes.sql` | 60 estudiantes (los códigos que ya usaban las matrículas; nombres de prueba) y llave foránea desde `MATRICULAS` |
| Materias por profesor | `sql/03c_asignaciones.sql` | Tabla `ASIGNACIONES`: qué materias dicta cada profesor. Solo se puede matricular con un profesor que dicte la materia |
| Gestión de almacenamiento | `sql/01_almacenamiento.sql`, `sql/04_organizacion_fisica.sql` | Tablespaces separados para datos, índices, auditoría y temporales; índices en las llaves foráneas |
| Usuarios | `sql/02_usuarios_roles.sql`, `sql/05_seguridad.sql` | Política de contraseñas, perfil, 4 roles y paquete `UNIV_SEC.PKG_USUARIOS` |
| Backup y recovery | `backup/` | RMAN (físico), Data Pump (lógico) y Flashback (error humano) |
| Auditoría | `sql/05_seguridad.sql`, `sql/06_auditoria.sql` | Bitácora con valores antes/después y auditoría unificada de Oracle |
| Formularios (menú «Registro») | `web/app/(panel)/matricular`, `estudiantes`, `materias`, `profesores` | Registrar estudiantes, materias y profesores, elegir qué materias dicta cada profesor y matricular varias materias a un estudiante; todo se guarda en Oracle al instante |
| Interfaz de consultas | `web/` | Next.js + shadcn/ui: login, tablas, reportes, consola SQL, usuarios, almacenamiento y auditoría, en modo claro y oscuro y adaptada a móvil |
| 4 consultas del taller | `sql/07_consultas.sql` | La pestaña Reportes lee este mismo archivo |

## Decisiones de diseño (para defender en la exposición)

- **Se entra con usuarios reales de Oracle.** La web no tiene permisos propios: cada persona se conecta
  con su cuenta, Oracle aplica los privilegios y la auditoría registra a la persona real.
- **El administrador no tiene `CREATE USER` ni `ALTER USER`.** Solo puede ejecutar un paquete que
  únicamente toca cuentas `U_*` y los 4 roles. Por eso no puede bloquear a `SYSTEM` ni entrar a `HR`.
- **`UNIV_SEC` no tiene contraseña** (`NO AUTHENTICATION`): nadie puede iniciar sesión con la cuenta dueña de la bitácora.
- **La bitácora no se puede editar ni borrar** con `UPDATE` o `DELETE`: un trigger lo impide.
- **Índices separados de los datos:** se pueden administrar y recuperar por aparte.
- **Matrícula única por semestre:** la restricción `UQ_MAT_EST_CURSO_SEM` impide que un estudiante tenga
  la misma materia dos veces en un semestre. Su índice reemplaza al índice simple sobre `id_estudiante`.
- **Tabla de estudiantes:** el esquema del cliente solo guardaba el código del estudiante. Se agregó
  `ESTUDIANTES` (nombre, programa y correo, con `UQ_EST_CORREO` y `CK_EST_CORREO`) y la llave foránea
  `FK_MAT_ESTUDIANTE`, así que no se puede matricular a alguien sin registrarlo antes. Las tres tablas
  del taller siguen igual.
- **Materias por profesor:** antes, quién dictaba qué se deducía de las matrículas. Ahora `ASIGNACIONES`
  lo define, y la llave compuesta `FK_MAT_ASIGNACION` (materia, profesor) impide matricular con un profesor
  que no dicta esa materia. Al borrar una materia o un profesor sin matrículas, sus asignaciones se borran
  en cascada.
- **Matrícula en una sola transacción:** si una de las materias falla, no se guarda ninguna.

## Backup y recuperación

Ejecutar desde la carpeta `backup/`:

| Script | Qué hace |
|---|---|
| `01_activar_archivelog.sh` | Crea la Fast Recovery Area y activa ARCHIVELOG. Reinicia la base. Solo se necesita una vez |
| `02_backup_rman.sh [--copiar]` | Backup físico completo. Con `--copiar`, además guarda ~1 GB en `backup/archivos/` |
| `03_export_datapump.sh` | Backup lógico del esquema; deja el `.dmp` en `backup/archivos/` |
| `04_import_datapump.sh <archivo.dmp>` | Restaura el esquema reemplazando las tablas (pide confirmación) |
| `demo_1_flashback.sh` | Borra matrículas y las recupera con `FLASHBACK TABLE` |
| `demo_2_perdida_datafile.sh` | Borra de verdad el datafile de datos y lo recupera con RMAN (pide confirmación) |

> **Importante:** el contenedor `oracle` no tiene volumen de Docker. `docker rm oracle` borraría la base
> **y** los backups RMAN, que están dentro del contenedor. `docker stop` y `docker restart` son seguros.
> Lo que queda en tu Mac es lo que está en `backup/archivos/`.

Dos hallazgos de las pruebas que vale la pena contar:

1. Con el datafile perdido, `SELECT COUNT(*)` **sigue funcionando**, porque Oracle lo responde con el índice,
   que está en otro tablespace. Por eso la demo usa `COUNT(semestre)`, que sí obliga a leer la tabla y da `ORA-00376`.
2. `impdp` con `TABLE_EXISTS_ACTION=REPLACE` recrea las tablas y deja la política de auditoría
   **activa pero vacía**. El script de import la vuelve a crear y comprueba que tenga sus 9 acciones.

## Guion sugerido para la demostración

1. **Reportes:** mostrar las 4 consultas con enunciado, SQL y resultado.
2. **Registro completo:** entrar como `U_OPERADOR`.
   - En **Estudiantes**, registrar un estudiante nuevo; en **Materias**, crear una materia; en **Profesores**, un profesor.
   - Asignar la materia nueva al profesor nuevo: desde **Profesores → Materias** o desde **Materias → Profesores**.
   - En la fila del estudiante nuevo, pulsar **Matricular**, agregarle la materia nueva con el profesor nuevo y otra más, y confirmar.
   - Abrir SQL Developer y consultar `ESTUDIANTES` y `MATRICULAS`: los cambios ya están en la base.
   - Intentar matricular de nuevo una que ya tiene: el formulario no la ofrece, y Oracle la rechazaría (`UQ_MAT_EST_CURSO_SEM`).
3. **Permisos:** entrar como `U_CONSULTA`. Los formularios aparecen en solo lectura, y en la Consola SQL `DELETE FROM matriculas` lo rechaza Oracle.
4. **Integridad:** como `U_OPERADOR`, en **Tablas**, crear un curso con 9 créditos (`ORA-02290`), eliminar la materia 101, que tiene matrículas (`ORA-02292`), y registrar un estudiante con un correo repetido (`UQ_EST_CORREO`).
5. **Auditoría:** entrar como `U_AUDITOR` y ver el estudiante y las matrículas del paso 2 con su usuario y sus valores antes y después.
6. **Usuarios:** entrar como `U_ADMIN`, crear un usuario, cambiarle el rol y bloquearlo; intentar entrar con él.
7. **Almacenamiento:** mostrar los tablespaces y dónde está cada tabla e índice.
8. **Recovery:** ejecutar `backup/demo_2_perdida_datafile.sh` en vivo.

## Pruebas

Con la interfaz encendida, desde `web/`:

```bash
npm test
```

Son 102 comprobaciones contra la base real: permisos por rol, restricciones, CRUD, asignación de materias, estudiantes, formulario de matrícula, usuarios y auditoría.
Deja los datos como estaban, pero sus cambios y accesos quedan en la bitácora y en la auditoría.
Para llegar a la exposición con la bitácora vacía, reinstala con `./desinstalar.sh` y `./instalar.sh`,
y luego haz un backup nuevo.

## Notas

- El taller pide "código del departamento", pero el esquema entregado solo tiene `departamento` como texto.
  La consulta 4 usa ese nombre: agregar un código implicaría cambiar la estructura que dio el cliente.
- Las contraseñas de `sql/00_parametros.ejemplo.sql` son solo un ejemplo: cámbialas en tu `00_parametros.sql`.
