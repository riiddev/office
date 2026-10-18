# Little Office — a tiny cozy 3D world

A small, playful, Sims-inspired 3D office built with React, Vite, Three.js and GSAP. This is a visual playground first: tiny characters wander around a miniature office, the lighting changes from day to night, and the camera can explore each cozy corner.

## What's in this starter

- Procedural low-poly office built from Three.js primitives — no paid 3D models or image assets required.
- Three-dimensional work desks, big windows, reading corner, lounge, arcade nook, pantry, bookcase and plants.
- Orbit, zoom, pan, reset-camera and room-focus controls.
- Day/night lighting toggle.
- Tiny characters with simple idle movement and wandering routes.
- Responsive React UI with resident list, room navigation, local clock and reduced-motion support.
- Separate UI, CSS, character data and scene modules.

The office residents are animated decoration only. This version is not connected to an AI model, does not persist user data and does not run tasks in the background.

## Requirements

- Node.js 20 or newer
- npm
- A modern browser with WebGL enabled

## Run locally

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually http://localhost:5173).

## Build for production

```bash
npm run build
npm run preview
```

The production files are output to `dist/`. This is a standard Vite frontend and can be deployed to Vercel with build command `npm run build` and output directory `dist`.

## Controls

- Drag the scene to orbit.
- Scroll to zoom.
- Right-click and drag to pan.
- Use the room buttons to focus the camera.
- Switch between day and night with the sun/moon button.
