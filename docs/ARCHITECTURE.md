# Architecture / Arquitectura

```
Renderer (UI, sandboxed, no Node)
   │  contextBridge: init / apply / revert / autoSet / autoClear
Main (Electron)  ── validates ids, hours, game names ──┐
   │  Start-Process -Verb RunAs  (UAC)                  │
engine.ps1 (admin) ── reads catalog/tweaks.json ◄───────┘
   ├─ records "undo" per action → %ProgramData%\Win11Opti\state.json
   ├─ Scheduled task "Win11Opti-Revert" at the end time
   └─ SetAuto → task "Win11Opti-AutoWatcher" → watcher.ps1 (polls processes every 10 s)
```

**EN.** The catalog is data; the engine is the only code that touches Windows and it accepts four action types. Every action returns an undo record. `Revert` replays them in reverse order. The UI only reads `state.json` and `auto.json`; it cannot write them.

**ES.** El catálogo son datos; el motor es el único código que toca Windows y acepta cuatro tipos de acción. Cada acción devuelve un registro para deshacer. `Revert` los repite en orden inverso. La interfaz solo lee `state.json` y `auto.json`; no puede escribirlos.

## Roadmap
- Code-signed releases · app-specific rules (close Teams/Discord) · import/export of custom profiles · more languages (`src/renderer/strings.js`).
