# Manual de Instalación - FrontTRT

Este documento explica cómo ejecutar e instalar la aplicación tanto en sistemas **Linux** como en **Windows**.

---

## 🐧 Guía para Linux

En Linux, el formato principal generado es el **AppImage**. Este es un archivo "todo en uno" que no necesita instalación tradicional.

### 1. Ejecutar el AppImage
1. Navega a la carpeta `dist_electron/`.
2. Busca el archivo `FrontTRT-1.0.0.AppImage`.
3. Dale permisos de ejecución:
   - **Vía Interfaz**: Clic derecho > *Propiedades* > *Permisos* > Marcar *"Permitir ejecutar como un programa"*.
   - **Vía Terminal**:
     ```bash
     chmod +x dist_electron/FrontTRT-1.0.0.AppImage
     ```
4. Haz doble clic para abrir la aplicación.

### 2. Instalador .deb (Opcional)
Si prefieres una instalación tradicional que aparezca en tu menú de aplicaciones:
1. Instala la herramienta faltante: `sudo apt install binutils`.
2. Ejecuta `npm run build:installer`.
3. Busca el archivo `.deb` en `dist_electron/` y ábrelo con el instalador de software de tu sistema.

---

## 🪟 Guía para Windows

Ahora puedes generar el instalador de Windows (`.exe`) directamente desde Linux utilizando Docker.

### 1. Generar el Ejecutable (`.exe`) desde Linux
Hemos configurado un comando automatizado que utiliza Docker para compilar la versión de Windows:
1. Asegúrate de que **Docker** esté abierto y funcionando corregtamente.
2. Abre una terminal en la carpeta del proyecto.
3. Ejecuta el siguiente comando:
   ```bash
   npm run build:installer:win
   ```
   *(Nota: La primera vez descargará una imagen de Docker de ~1GB, por lo que tardará unos minutos).*
4. Al finalizar, aparecerá un archivo llamado `FrontTRT Setup 1.0.0.exe` dentro de la carpeta `dist_electron/`.

### 2. Generar desde Windows (Alternativa)
Si prefieres hacerlo en una computadora con Windows:
1. Copia la carpeta del proyecto a la PC.
2. Instala dependencias con `npm install`.
3. Ejecuta `npm run build:installer`.

### 3. Instalación en Windows
1. Haz doble clic en el archivo `FrontTRT Setup 1.0.0.exe`.
2. El instalador configurará automáticamente la aplicación y creará un acceso directo.

---

## 💡 Recomendaciones Generales
- **Actualizaciones**: Cada vez que hagas cambios en el código, debes volver a ejecutar `npm run build:installer` para generar una nueva versión.
- **Iconos**: Actualmente se usa el icono por defecto de Electron. Si deseas un icono personalizado, necesitaremos añadir un archivo `.png` (para Linux) y `.ico` (para Windows) en la carpeta `electron/assets/`.
