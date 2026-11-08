# Interfaz web: Gestión Universitaria

Next.js 16 (App Router) + shadcn/ui + Tailwind CSS 4, conectada a Oracle con `oracledb` en modo thin,
así que no hace falta instalar Oracle Client.

La forma normal de encenderla es `../iniciar.sh`. Ver el [README del proyecto](../README.md).

## Comandos

| Comando | Para qué |
|---|---|
| `npm run build` | Compila la versión de producción (solo después de cambiar código) |
| `npm start` | Sirve la versión compilada en http://localhost:3000 |
| `npm run dev` | Modo desarrollo: recarga al guardar cambios |
| `npm run typecheck` | Revisa los tipos de TypeScript |
| `npm run lint` | Revisa el estilo del código |
| `npm test` | 65 pruebas contra la base real (con la app encendida) |

Otra base u otro puerto: `DB_CONNECT=localhost:1521/FREEPDB1 PORT=3100 npm start`.

## Estructura

| Carpeta | Contenido |
|---|---|
| `app/login` | Pantalla de inicio de sesión |
| `app/(panel)` | Pantallas: inicio, datos, reportes, sql, usuarios, almacenamiento, auditoría |
| `app/api` | API: cada ruta corre con el usuario Oracle de quien inició sesión |
| `lib/servidor` | Conexión a Oracle, sesiones, traducción de errores y lista blanca de tablas |
| `components` | Panel, diálogos, tablas y componentes de shadcn/ui (`components/ui`) |
| `test` | Prueba de extremo a extremo de la API |

## Seguridad

- Cada persona inicia sesión con su usuario real de Oracle. El servidor guarda en memoria un pool ya
  autenticado, no la contraseña.
- La cookie de sesión es `HttpOnly` y `SameSite=Strict`. Las peticiones que modifican datos se rechazan
  si vienen de otro origen.
- Las tablas, columnas y criterios de orden pasan por una lista blanca; los valores siempre van como
  variables enlazadas (*binds*).
- La interfaz solo oculta lo que el rol no puede hacer. Quien lo impide de verdad es Oracle.
- Las sesiones viven en la memoria del servidor: si reinicias la app, todos vuelven a iniciar sesión.
