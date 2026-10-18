# Riiddev Agent HQ

A cozy Sims-inspired 3D command center for AI agents, built with React, Vite, Three.js and GSAP.

## Current milestone: visual HQ preview

- Interactive procedural 3D office with studio, lounge, game room and pantry views.
- Tiny agent characters with status orbs and click-to-select behavior in the 3D scene.
- Agent roster, selected-agent details, example task pipeline and activity stream.
- Day/night mode, responsive layout and reduced-motion support.
- A connection-planning modal for a future local agent bridge.

**Important:** this milestone uses clearly labelled sample data. No AI agent is connected, no actual tasks are executed and the activity stream is not live yet. The "Connect agent" modal explains the intended next step; its button only copies the integration plan.

## Roadmap

1. **Visual preview** — current milestone.
2. **Local read-only bridge** — run a small Node.js service on the same computer to read agent status, task metadata and recent events from a chosen runtime.
3. **First adapter** — choose OpenCode or OpenClaw and map its real data into the HQ schema.
4. **Safe actions** — after read-only status is stable, add explicit user-approved actions with clear confirmation and logs.

Keep agent credentials and private runtime data on the local machine. Do not put API keys in browser source. A future bridge should bind to localhost by default, validate requests, and expose only the minimal normalized fields needed by the UI.

## Requirements

- Node.js 20 or newer
- npm
- A modern browser with WebGL

## Run locally

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually http://localhost:5173).

## Production build

```bash
npm run build
npm run preview
```

Vite outputs the production frontend into `dist/`. For Vercel, use build command `npm run build` and output directory `dist`.

## 3D controls

- Drag to orbit.
- Scroll to zoom.
- Right-drag to pan.
- Use room buttons to focus the camera.
- Click a character to select that agent in the dashboard.
- Switch between daytime and nighttime with the sun/moon button.
