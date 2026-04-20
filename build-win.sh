#!/bin/bash

# Script para construir el instalador de Windows (.exe) desde Linux usando Docker
# Proporcionado por Antigravity (Google Deepmind)

echo "🚀 Iniciando proceso de construcción para Windows..."

# Verificar si Docker está instalado
if ! [ -x "$(command -v docker)" ]; then
  echo '❌ Error: Docker no está instalado. Por favor instala Docker para usar este script.' >&2
  exit 1
fi

# El comando de Docker descarga la imagen especializada de electron-builder con Wine
# y ejecuta la construcción de producción.
docker run --rm \
  -v "${PWD}":/project \
  -v ~/.cache/electron:/root/.cache/electron \
  -v ~/.cache/electron-builder:/root/.cache/electron-builder \
  electronuserland/builder:wine \
  /bin/bash -c "npm install && npm run build:prod && npm run build:win"

if [ $? -eq 0 ]; then
  echo "✅ ¡Construcción exitosa! Busca el archivo .exe en la carpeta dist_electron/"
else
  echo "❌ La construcción falló. Revisa los mensajes de error arriba."
fi
