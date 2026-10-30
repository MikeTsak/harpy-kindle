<div align="center">

# Erebus: Harpy Node

**An e-ink Court terminal for the Harpy at Athens Through Time live events.**

A black-and-white, touch-friendly dashboard built to run on a Kindle's experimental browser, so the Harpy can track boons, status and gossip in character, at the table.

[![React](https://img.shields.io/badge/React-19-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev)
[![Legacy builds](https://img.shields.io/badge/output-ES5_%2B_polyfills-555555?style=flat-square)](https://github.com/vitejs/vite/tree/main/packages/plugin-legacy)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?style=flat-square&logo=leaflet&logoColor=white)](https://leafletjs.com)

</div>

---

## Features

- **SchreckNet boot sequence.** A terminal-style login, tuned for a 7-inch e-ink screen.
- **Boon registry.** Record new boons and update existing ones against the live Court ledger.
- **Status and reputation directory.** The Camarilla roster with titles. Characters holding a Harpy title can change a Kindred's standing.
- **Territory directory.** Domain claims as an interactive map or a list.
- **Elysium comms log.** Read and post Court news.
- **Private ledger.** A scratchpad for secrets, kept only on the device (`localStorage`).

## Built for e-ink

- A clean white theme with no colour cues: emphasis comes from weight and borders, never red.
- Large touch targets and few redraws, for slow e-ink refresh rates.
- `@vitejs/plugin-legacy` ships an ES5 bundle with polyfills, so the app still runs on old WebKit browsers.
- Terser minifies to ES5, and all vendor code goes into one cached chunk.
- It installs as a home-screen web app.

## Quick start

**Requirements:** Node.js 20+, and the [API](https://github.com/MikeTsak/vtm-platform-back) running.

```bash
npm install
npm run dev
```

Point the app at an API with `VITE_API_URL` (including `/api`) in `.env` for development or `.env.production` for builds. Sign in with a portal account. Writes are authorised by the API, so Court actions need the right role or title.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Legacy-compatible production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Oxlint |
| `npm run deploy` | Build, then upload over FTPS |
| `npm run deploy:nobuild` | Upload the existing `dist/` |
| `npm run deploy:dry` | Show what would change without uploading |
| `npm run deploy:force` | Build and re-upload every file |
| `npm run deploy:rollback` | Restore the previous entry point on the server |

The first time you deploy, copy `deploy.config.example.json` to `deploy.config.json` (gitignored) and fill in the credentials.

## Project structure

```text
src/
  features/auth/   Login and the SchreckNet boot animation
  pages/           Dashboard, Boons, Reputation, Domains, ElysiumFeed, Secrets
  data/            Domains.json, the Athens division map
  api.js           axios client
  AuthContext.jsx  session state
  index.css        e-ink theme
```

## The Erebus ecosystem

| Repository | Role |
| --- | --- |
| [back](https://github.com/MikeTsak/vtm-platform-back) | API, realtime, jobs, Discord bot |
| [front](https://github.com/MikeTsak/vtm-platform-front) | Player and Storyteller portal at [portal.attlarp.gr](https://portal.attlarp.gr) |
| [wiki-vtm](https://github.com/MikeTsak/wiki-vtm) | Erebus Wiki at [wiki.attlarp.gr](https://wiki.attlarp.gr) |
| [attlarp.gr](https://github.com/MikeTsak/attlarp.gr) | Public chronicle website |
| [erebus-mobile](https://github.com/MikeTsak/erebus-mobile) | Expo mobile app for SchreckNet and Surface Web |
| **harpy-kindle** (this repo) | E-ink Harpy terminal |
| [vampire-treasure-hunt](https://github.com/MikeTsak/vampire-treasure-hunt) | Hunt Tracker for location-based challenges |
| [badge-for-larp](https://github.com/MikeTsak/badge-for-larp) | Printable character badge generator |

## License

This repository does not include a license file.

*Vampire: The Masquerade* is a trademark of Paradox Interactive AB. This is an unofficial fan project for the Athens Through Time chronicle.
