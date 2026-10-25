<div align="center">

# Win11Opti

**Optimiza Windows 11 cuando quieras. Transparente, reversible y con temporizador.**

Español · [English](README.md)

[![Descargar](https://img.shields.io/github/v/release/manuelguarguati/win11opti?label=Descargar%20Instalador&logo=windows&color=success)](https://github.com/manuelguarguati/win11opti/releases/latest)
![Licencia](https://img.shields.io/badge/licencia-MIT-blue) ![Plataforma](https://img.shields.io/badge/plataforma-Windows%2010%2F11-0078d4) ![Estado](https://img.shields.io/badge/estado-alpha-orange)

[⬇️ **Descargar última versión (Instalador para Windows)**](https://github.com/manuelguarguati/win11opti/releases/latest)

</div>

## ¿Por qué otro optimizador?

La mayoría aplica un montón de cambios sin vuelta atrás. Win11Opti sigue tres reglas:

1. **Todo es reversible.** Antes de cambiar algo, el motor guarda el valor anterior. *Restaurar* deja tu PC exactamente como estaba.
2. **Todo es visible.** Cada ajuste es una entrada legible en [`catalog/tweaks.json`](catalog/tweaks.json). Sin scripts ocultos ni comandos arbitrarios: el motor solo ejecuta cuatro tipos de acción (registro, servicio, proceso, plan de energía).
3. **Tú decides.** Elige ajustes uno por uno o usa un perfil. Todo lo que no sea *Seguro* muestra una advertencia que debes aceptar.

## Características

- **Modos con temporizador**: "Gamer por 5 horas". Una tarea programada restaura todo sola, aunque cierres la app o reinicies.
- **Desinstalador de Bloatware**: Detecta y desinstala limpiamente apps basura y patrocinadas de Windows 11 (Clipchamp, Cortana, Noticias, Clima, TikTok, etc.) con selección recomendada en 1 clic.
- **Control de IA y Copilot**: Desactiva Windows Copilot, capturas de pantalla de Recall, Click-to-Do y la barra lateral de IA de Edge.
- **Interfaz y Explorador**: Menú contextual clásico de Windows 10, mostrar extensiones de archivo, abrir Explorador en 'Este equipo', ocultar iconos de Vista de tareas y Chat, y activar 'Finalizar tarea' en la barra.
- **Herramientas del Sistema**: Creación de Punto de Restauración en 1 clic, reinicio instantáneo del Explorador de Windows y visor de registros en vivo.
- **Modo automático** *(experimental)*: agrega `juego.exe`; los ajustes se aplican mientras corre y se deshacen al cerrarlo.
- **Perfiles**: Gamer, Video / Creador, Estudio / Concentración, Privacidad Máxima, Limpio y Optimizado.
- **Niveles de riesgo**: 🟢 Seguro · 🟡 Moderado · 🔴 Avanzado (crea un punto de restauración antes).
- **Interfaz interactiva**: Búsqueda en vivo, filtrado por categorías, switches animados modernos, pestañas y soporte bilingüe (Español / English).
- **Actualización automática** con GitHub Releases (se puede desactivar).

## Instalación

1. Ve a [**Releases**](https://github.com/manuelguarguati/win11opti/releases) y descarga `Win11Opti-Setup-x.y.z.exe`.
2. Ejecútalo. SmartScreen puede avisar de "editor desconocido" porque aún no está firmado: *Más información → Ejecutar de todas formas*. Puedes comprobar que el instalador lo generó el [workflow de GitHub Actions](.github/workflows/release.yml) de este repo.
3. Abre Win11Opti, elige un perfil o ajustes, escoge la duración y pulsa **Aplicar**.

## Ejecutar desde el código

```bash
git clone https://github.com/manuelguarguati/win11opti.git
cd win11opti
npm install
npm start        # el motor requiere Windows
npm test         # valida el catálogo y las traducciones
npm run dist     # genera el instalador en dist/
```

## Privacidad y seguridad

- **Sin telemetría, sin cuentas, sin analíticas.**
- La única conexión de red es la búsqueda de actualizaciones en GitHub Releases. Se apaga en el pie de la app.
- Electron corre con `contextIsolation`, `sandbox`, una política CSP estricta y sin contenido remoto.
- Los permisos de administrador se piden solo al aplicar o restaurar, con el aviso normal de Windows (UAC).

Ningún software puede prometer honestamente "100% seguro". Reducimos el riesgo con un motor de lista blanca, copias del estado anterior, pruebas y código abierto. Lee [SECURITY.md](SECURITY.md) y crea un punto de restauración antes de usar ajustes avanzados.

## Estructura

```
catalog/tweaks.json   todos los ajustes, en EN + ES (datos, no código)
engine/engine.ps1     aplica / revierte acciones de lista blanca
engine/watcher.ps1    modo automático (detector de juegos)
src/main              proceso principal de Electron (IPC validado, elevación)
src/renderer          interfaz (EN/ES)
tests/                validación de catálogo y traducciones
docs/                 arquitectura y cómo agregar un ajuste
```

## Contribuir

Un ajuste nuevo es solo JSON. Mira [CONTRIBUTING.md](CONTRIBUTING.md) y [docs/ADDING-TWEAKS.md](docs/ADDING-TWEAKS.md). Ideas, traducciones y reportes de errores son bienvenidos.

## Licencia

[MIT](LICENSE) © Manuel Guarguati
