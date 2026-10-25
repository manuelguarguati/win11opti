# Security Policy / Política de seguridad

## English
**Reporting.** Please report vulnerabilities privately through GitHub → *Security → Report a vulnerability*. Do not open public issues for them. Expect a first answer within 7 days.

**Design.**
- The engine executes only `registry`, `service`, `process` and `power` actions from `catalog/tweaks.json`. Registry paths are limited to `HKCU:` and `HKLM:`; names are validated by regex. No `Invoke-Expression`, no downloads.
- The UI never builds shell commands from free text. IDs and game names are validated in the main process before reaching PowerShell.
- The installer is **per-machine** (Program Files) so the elevated engine lives in an admin-protected folder. Do not move it to a user-writable folder.
- State is stored in `%ProgramData%\Win11Opti` (ACL: only Administrators/SYSTEM can write).
- Network: only the optional update check to GitHub Releases. No telemetry.

**Limits.** This is alpha software that changes Windows settings. Nobody can guarantee zero risk. Test on a spare machine, keep backups, and read each warning.

## Español
**Reportes.** Reporta vulnerabilidades en privado: GitHub → *Security → Report a vulnerability*. No abras issues públicos. Respuesta inicial en menos de 7 días.

**Diseño.**
- El motor solo ejecuta acciones `registry`, `service`, `process` y `power` del catálogo. Las rutas de registro se limitan a `HKCU:` y `HKLM:`; los nombres se validan con regex. Sin `Invoke-Expression`, sin descargas.
- La interfaz nunca arma comandos con texto libre. IDs y nombres de juegos se validan en el proceso principal antes de llegar a PowerShell.
- El instalador es **por máquina** (Program Files) para que el motor con privilegios viva en una carpeta protegida. No lo muevas a una carpeta editable por usuarios.
- El estado se guarda en `%ProgramData%\Win11Opti` (solo Administradores/SYSTEM pueden escribir).
- Red: solo la búsqueda opcional de actualizaciones en GitHub Releases. Sin telemetría.

**Límites.** Es software alpha que cambia ajustes de Windows. Nadie puede garantizar riesgo cero. Prueba en un equipo de respaldo, haz copias y lee cada advertencia.
