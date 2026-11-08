#!/bin/bash
# Crea el contenedor de Oracle Database Free para usar el proyecto en otro computador.
# Uso: ./crear_contenedor.sh [nombre_contenedor]     (puerto: PUERTO=1522 ./crear_contenedor.sh)
# Los datos quedan en un volumen de Docker, así que no se pierden con "docker rm".
set -euo pipefail
C="${1:-oracle}"
PUERTO="${PUERTO:-1521}"

if docker container inspect "$C" >/dev/null 2>&1; then
  echo "El contenedor '$C' ya existe. Si no tiene este proyecto, sigue con ./instalar.sh $C"
  exit 0
fi

echo "Descargando la imagen de Oracle (unos 3 GB, solo la primera vez)..."
docker pull gvenzl/oracle-free:latest

# Sin contraseña de SYSTEM fija: los scripts entran como SYSDBA desde dentro del contenedor.
docker run -d --name "$C" \
  -p "$PUERTO:1521" \
  -e ORACLE_RANDOM_PASSWORD=yes \
  -v "${C}-datos:/opt/oracle/oradata" \
  gvenzl/oracle-free:latest >/dev/null

echo "Iniciando Oracle por primera vez (puede tardar varios minutos)..."
until docker exec "$C" healthcheck.sh >/dev/null 2>&1; do sleep 5; done
echo "Listo. Ahora ejecuta: ./instalar.sh $C"
