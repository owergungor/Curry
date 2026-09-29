---
name: ui-e2e-testing
description: End-to-end browser subagent testing workflow for Svelte components.
---

# UI E2E Testing Workflow

1. Spin up the Vite preview or dev server: `npm run dev`
2. Launch browser subagent targeting `http://localhost:1420`
3. Verify:
   - Navigation between tabs (Notifications, Settings, Profiles, Glow)
   - Mark All as Read button action
   - Comet, Pulse, Sweep, Ambient, Ripple animation toggle
   - Dark, Light, and System appearance modes
