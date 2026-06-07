# Custom Engine — Minimal Rendering Kernel (Step 1)

A from-scratch WebGL2 + TypeScript rendering kernel. This step renders a single
GGX-lit, slowly spinning triangle to validate the architecture end to end:
render loop, scene graph, geometry (VBO/VAO), shader/material, perspective camera.

## Requirements
- Node.js 18+ (dev tooling only; the engine itself ships zero runtime deps)
- A WebGL2-capable browser (iOS Safari 15+, Android Chrome, desktop Chrome/Edge)

## Setup
    npm install
    npm run dev

Vite prints a `Network:` URL (e.g. `http://192.168.1.50:5173/`). Open that URL on
the phone. The phone must be on the same network as this server.

Find this machine's LAN IP if needed:
    hostname -I

## Expected result
A near-black screen with a warm-orange triangle that slowly rotates about a tilted
axis; a soft specular highlight sweeps across it as it turns. Edges are anti-aliased.

## Troubleshooting
- Blank screen with red text: the on-screen overlay prints the exact WebGL/GLSL
  error. Send that text back.
- Can't reach the URL from the phone: open port 5173 in the firewall
  (`sudo ufw allow 5173` if `ufw` is active) and confirm both devices share the LAN.

## Scripts
- `npm run dev` — dev server with HMR, bound to the LAN
- `npm run build` — type-check (tsc) + production bundle
- `npm run preview` — serve the production build over the LAN
