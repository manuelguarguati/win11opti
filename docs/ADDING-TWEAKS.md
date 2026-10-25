# Adding a tweak / Agregar un ajuste

## English
Append an object to `tweaks` in `catalog/tweaks.json`:

```json
{
  "id": "no-example",
  "category": "privacy",
  "risk": "safe",
  "name": { "en": "Turn off example", "es": "Apagar ejemplo" },
  "description": { "en": "What it does.", "es": "Qué hace." },
  "warning": { "en": "Only if risk is not safe", "es": "Solo si el riesgo no es safe" },
  "actions": [
    { "type": "registry", "path": "HKCU:\\Software\\Example", "name": "Enabled", "value": 0, "kind": "DWord" }
  ]
}
```

Action types: `registry` (`path`, `name`, `value`, `kind` = `DWord`|`String`), `service` (`name`), `process` (`name`, without `.exe`), `power` (`plan: "high"`).
Categories: `performance`, `gaming`, `focus`, `privacy`. Risks: `safe`, `moderate`, `advanced`.
Run `npm test`: it checks fields, translations and warnings. Optionally add the id to a profile.

## Español
Agrega un objeto a `tweaks` en `catalog/tweaks.json` (ejemplo arriba). Tipos de acción: `registry`, `service`, `process`, `power`. Categorías: `performance`, `gaming`, `focus`, `privacy`. Riesgos: `safe`, `moderate`, `advanced`. Ejecuta `npm test`: valida campos, traducciones y advertencias. Opcionalmente agrega el id a un perfil.
