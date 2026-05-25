<div align="center">
  <img src="src-tauri/icons/icon.png" alt="Workshift - Desktop Shift Planner" width="200">
  <h1>Workshift: Desktop Shift Planner</h1>
</div>

<p align="center">
  <a href="https://buymeacoffee.com/saccofrancesco">
    <img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" />
  </a>
</p>

<h4 align="center">
A fast local desktop app to manage people, plan daily shifts, track monthly workload, and export polished Excel schedules.
</h4>

<p align="center">
  <img src="https://img.shields.io/github/contributors/saccofrancesco/workshift?style=for-the-badge" alt="Contributors">
  <img src="https://img.shields.io/github/forks/saccofrancesco/workshift?style=for-the-badge" alt="Forks">
  <img src="https://img.shields.io/github/stars/saccofrancesco/workshift?style=for-the-badge" alt="Stars">
  <img src="https://img.shields.io/github/v/release/saccofrancesco/workshift?style=for-the-badge" alt="Latest release">
</p>

<p align="center">
  <a href="#tldr">TL;DR</a> •
  <a href="#key-features">Key Features</a> •
  <a href="#download-installers">Download Installers</a> •
  <a href="#quickstart">Quickstart</a> •
  <a href="#credits--acknowledgements">Credits</a> •
  <a href="#license">License</a>
</p>

---

## TL;DR

Workshift is a cross-platform Tauri desktop app for shift planning.
You can manage employees, assign shifts in a monthly calendar, monitor monthly workload progress, and export everything to `.xlsx` in one click.

---

## Why Workshift

- Keep scheduling simple and local, without external SaaS complexity
- Get a clear visual calendar with per-day staffing indicators
- Prevent overlapping shifts for the same person
- Track monthly target vs assigned hours in real time
- Export a complete Excel workbook ready to share

---

## Key Features

- Employee management (add/edit/delete)
- Shift management with overlap validation
- Monthly calendar navigation with day-level detail
- Per-employee workload recap with progress bars
- Lunch-break-aware hour calculations
- One-click export to `.xlsx` with 3 sheets: `Shifts_Data`, `Monthly_View`, `Summary`
- Light and dark mode
- Cross-platform installers via GitHub Releases

---

## Download Installers

Latest release page (all assets):
- https://github.com/saccofrancesco/workshift/releases/latest

Direct downloads (dynamic, always point to the latest release):

| Platform | Architecture | Package | Direct download |
| --- | --- | --- | --- |
| Windows | x64 | `.exe` installer | [Download](https://github.com/saccofrancesco/workshift/releases/latest/download/workshift-windows-x64-setup.exe) |
| Windows | x64 | `.msi` installer | [Download](https://github.com/saccofrancesco/workshift/releases/latest/download/workshift-windows-x64.msi) |
| macOS | Apple Silicon | `.dmg` | [Download](https://github.com/saccofrancesco/workshift/releases/latest/download/workshift-macos-aarch64.dmg) |
| macOS | Intel | `.dmg` | [Download](https://github.com/saccofrancesco/workshift/releases/latest/download/workshift-macos-x64.dmg) |
| Linux | x64 | `.AppImage` | [Download](https://github.com/saccofrancesco/workshift/releases/latest/download/workshift-linux-x64.AppImage) |
| Linux | x64 | `.deb` | [Download](https://github.com/saccofrancesco/workshift/releases/latest/download/workshift-linux-x64.deb) |
| Linux | x64 | `.rpm` | [Download](https://github.com/saccofrancesco/workshift/releases/latest/download/workshift-linux-x64.rpm) |

Alternative portable macOS app archives:
- Apple Silicon: [workshift-macos-aarch64.app.tar.gz](https://github.com/saccofrancesco/workshift/releases/latest/download/workshift-macos-aarch64.app.tar.gz)
- Intel: [workshift-macos-x64.app.tar.gz](https://github.com/saccofrancesco/workshift/releases/latest/download/workshift-macos-x64.app.tar.gz)

---

## Quickstart

### Prerequisites

- [Node.js](https://nodejs.org/) `24.14.0` (see `.nvmrc`)
- [Rust stable](https://www.rust-lang.org/tools/install)
- Tauri system dependencies: https://v2.tauri.app/start/prerequisites/

### Run in development mode (desktop app)

```bash
git clone https://github.com/saccofrancesco/workshift.git
cd workshift
npm ci
npm run tauri dev
```

### Build production bundles locally

```bash
npm run tauri build
```

### Web-only local preview

```bash
npm run dev
```

---

## Credits & Acknowledgements

Workshift is built with:

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Tauri](https://tauri.app/)
- [shadcn/ui](https://ui.shadcn.com/)
- [XLSX](https://www.npmjs.com/package/xlsx)

---

## You Might Also Like

Other projects by the same author:

- [gitsloth](https://github.com/saccofrancesco/gitsloth): AI-powered Conventional Commit message generator written in Rust.
- [lock](https://github.com/saccofrancesco/lock): Local UI password manager with strong encryption.
- [crosswords](https://github.com/saccofrancesco/crosswords): Crossword solver powered by AI + web data.

---

## Notes

- Schedule data is currently session-based (in-memory).
- Use export to persist/share planning data as `.xlsx`.

---

## Emailware

Workshift is [emailware](https://en.wiktionary.org/wiki/emailware).
If you find it useful, I would like to hear from you:

- **[francescosacco.github@gmail.com](mailto:francescosacco.github@gmail.com)**

---

## Support

If this project helps you:

- Star the repository
- [Buy me a coffee](https://www.buymeacoffee.com/saccofrancesco)
- Share feedback by email

---

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

---

> GitHub [@saccofrancesco](https://github.com/saccofrancesco)
