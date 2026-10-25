# Contributing / Contribuir

## English
1. Fork, create a branch, make your change.
2. `npm install && npm run check && npm test` must pass.
3. New tweak? Add it to `catalog/tweaks.json` (see [docs/ADDING-TWEAKS.md](docs/ADDING-TWEAKS.md)). It needs English **and** Spanish text, and a `warning` if its risk is not `safe`.
4. Test on a real Windows 11 and confirm **Restore** returns every value.
5. Open a Pull Request using the template. Small PRs get reviewed faster.

New engine action types are security-sensitive: open an issue first.

## Español
1. Haz fork, crea una rama y tu cambio.
2. `npm install && npm run check && npm test` deben pasar.
3. ¿Ajuste nuevo? Agrégalo a `catalog/tweaks.json` (ver [docs/ADDING-TWEAKS.md](docs/ADDING-TWEAKS.md)). Necesita texto en inglés **y** español, y un `warning` si el riesgo no es `safe`.
4. Pruébalo en un Windows 11 real y confirma que **Restaurar** devuelve cada valor.
5. Abre un Pull Request con la plantilla. Los PR pequeños se revisan más rápido.

Los tipos de acción nuevos del motor son sensibles para la seguridad: abre primero un issue.
