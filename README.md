# Riiddev Agent HQ

A cozy Sims-inspired 3D command center for AI-assisted work, built with React, Vite, Three.js and GSAP.

## Current milestone: cloud task dispatch foundation

- Interactive procedural 3D office with studio, lounge, game room and pantry views.
- Tiny illustrated crew and a sample task/activity feed (clearly labeled as demo data).
- Secure Vercel API endpoint that can create an issue in `riiddev/office` and trigger OpenCode through an issue comment.
- OpenCode runs in a GitHub Actions runner, not on your personal computer. Changes should be delivered as a pull request; the workflow does not merge automatically.

**Important:** the dashboard roster, sample task cards, and activity stream are still simulated. Cloud task submission becomes active only after the setup below is completed. No AI agent is connected by default.

## Enable cloud task execution

1. **Install the OpenCode GitHub App** on the `riiddev/office` repository: https://github.com/apps/opencode-agent
2. In `riiddev/office` → **Settings → Secrets and variables → Actions → New repository secret**, add `OPENAI_API_KEY`. The workflow currently uses `openai/gpt-6.1-sol`; API usage is billed separately from a ChatGPT subscription.
3. Create a **fine-grained GitHub personal access token** restricted to this repository, with **Issues: Read and write**. The token is used only by the Vercel endpoint to create task issues/comments; the OpenCode app handles the agent workflow.
4. In Vercel → `kantorriddev` → **Settings → Environment Variables**, add:
   - `GITHUB_ISSUES_TOKEN` = the fine-grained token from step 3.
   - `HQ_ACCESS_TOKEN` = a long random secret you choose. Use the exact same value when sending a task from the dashboard.
   Select **Production** (and Preview too, if you test preview deployments), save, then redeploy.
5. Open https://kantorriddev.vercel.app, click **Run cloud task**, enter the `HQ_ACCESS_TOKEN` value, and describe the task. The dashboard creates an issue and adds an `/opencode` comment. Review the task issue and pull request in GitHub.

**Security notes**
- Never put `GITHUB_ISSUES_TOKEN` or an LLM API key in frontend code, local storage, or task text.
- The task issue is created in the GitHub repository. Avoid submitting private information, passwords, customer data, or API keys.
- The endpoint is scoped to `riiddev/office`, limits task prompts to 3,000 characters, and checks `HQ_ACCESS_TOKEN`.
- Review generated code and CI results before merging any pull request.

## Requirements for local development

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


## 3D office reference

The low-poly cutaway office world in this project is adapted from [Ruang by yugienugraha](https://github.com/yugienugraha/ruang), used under its MIT License. See `LICENSE-RUANG.md`. The UI shell and protected GitHub task-dispatch flow remain specific to this project.
