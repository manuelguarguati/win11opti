<div align="center">

# Win11Opti

**Optimize Windows 11 on demand. Transparent, reversible, with a timer.**

[Español](README.es.md) · English

![License](https://img.shields.io/badge/license-MIT-blue) ![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-0078d4) ![Status](https://img.shields.io/badge/status-alpha-orange)

</div>

## Why another optimizer?

Most "optimizers" apply a one-way pile of tweaks and hope for the best. Win11Opti is built around three rules:

1. **Everything is reversible.** Before changing anything, the engine records the previous value. *Restore* puts your PC back exactly as it was.
2. **Everything is visible.** Every tweak is a readable entry in [`catalog/tweaks.json`](catalog/tweaks.json). No hidden scripts, no arbitrary commands: the engine can only run four action types (registry, service, process, power plan).
3. **You decide.** Pick tweaks one by one or use a profile. Anything that is not *Safe* shows a warning you must accept.

## Features

- **Timed modes**: "Gamer for 5 hours". A scheduled task restores everything on its own, even if you close the app or reboot.
- **Auto mode** *(experimental)*: add `game.exe`; tweaks apply while it runs and are undone when you close it.
- **Profiles**: Gamer, Video / Creator, Study / Focus, Privacy.
- **Risk levels**: 🟢 Safe · 🟡 Moderate · 🔴 Advanced (creates a restore point first).
- **Bilingual UI**: English and Español, switch any time.
- **Auto-update** through GitHub Releases (can be turned off).

## Install

1. Go to [**Releases**](https://github.com/manuelguarguati/win11opti/releases) and download `Win11Opti-Setup-x.y.z.exe`.
2. Run it. Windows SmartScreen may warn about an unknown publisher because the build is not code-signed yet: *More info → Run anyway*. You can verify the build was produced by this repo's [GitHub Actions workflow](.github/workflows/release.yml).
3. Open Win11Opti, choose a profile or tweaks, pick a duration and press **Apply**.

## Run from source

```bash
git clone https://github.com/manuelguarguati/win11opti.git
cd win11opti
npm install
npm start        # needs Windows for the engine
npm test         # validates the catalog and translations
npm run dist     # builds the installer into dist/
```

## Privacy and safety

- **No telemetry, no accounts, no analytics.**
- The only network request is the update check against GitHub Releases. Turn it off in the footer.
- Electron runs with `contextIsolation`, `sandbox`, a strict Content-Security-Policy and no remote content.
- Administrator rights are requested only when applying or restoring, via a normal Windows UAC prompt.

No software can honestly promise "100% safe". We reduce risk with a whitelist engine, backups, tests and open code. Read [SECURITY.md](SECURITY.md), and create a restore point before trying advanced tweaks.

## Project layout

```
catalog/tweaks.json   every tweak, in EN + ES (data, not code)
engine/engine.ps1     applies / reverts whitelisted actions
engine/watcher.ps1    auto mode (game detector)
src/main              Electron main process (validated IPC, elevation)
src/renderer          UI (EN/ES)
tests/                catalog + translation checks
docs/                 architecture and how to add a tweak
```

## Contributing

New tweaks are just JSON. See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/ADDING-TWEAKS.md](docs/ADDING-TWEAKS.md). Ideas, translations and bug reports are all welcome.

## License

[MIT](LICENSE) © Manuel Guarguati
