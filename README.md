# Agentic Chat (Local Models)

Real-time chat with voice that integrates with local AI runtimes: Ollama and LM Studio. Includes a rich settings panel and optional local tools for file access and shell commands (opt-in, local-only).

## Features

- Real-time streaming chat UI
- Voice input (STT) and voice output (TTS) using browser Web Speech APIs
- Providers:
  - Ollama (`/api/chat`)
  - LM Studio (OpenAI-compatible `/v1/chat/completions`)
- Rich settings: model, temperature, top_p, system prompt, token limits
- Optional local tools (disabled by default): read files/list directories, run shell commands within a whitelisted directory
- Runs fully offline when used locally with Ollama/LM Studio
- Vercel-ready frontend (remote deployment disables local tools automatically)

## Quickstart (Local, Offline)

1) Install and run a local model provider:
- Ollama: `https://ollama.ai` (ensure the service is listening on `http://localhost:11434`)
- LM Studio: `https://lmstudio.ai` (enable local server; default `http://localhost:1234`)

2) Install and run the app:
```bash
npm install
npm run dev
# open http://localhost:3000
```

3) Open Settings (left sidebar) and configure:
- Provider: Ollama or LM Studio
- Base URL: e.g. `http://localhost:11434` (Ollama) or `http://localhost:1234` (LM Studio)
- Model: e.g. `llama3.1` for Ollama, or your LM Studio model id
- Optional: enable Voice STT/TTS
- Optional local tools (local-only): toggle and set `Allowed Root Directory`

Notes:
- Voice features depend on your browser. Chrome-based browsers generally support STT/TTS offline with system voices.
- Local tools are blocked when deployed on Vercel.

## Project Scripts

- `npm run dev` – Start dev server
- `npm run build` – Production build
- `npm start` – Start production server

## Deployment (Vercel)

Build locally first:
```bash
npm install
npm run build
```

Deploy:
```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-4bf6c79a
```

After a few seconds, verify:
```bash
curl https://agentic-4bf6c79a.vercel.app
```

Important:
- When running on Vercel, your local Ollama/LM Studio instance is not reachable by Vercel. For remote use, you would need a reachable gateway URL. For offline/local-first usage, run this app locally.
- Local tools (file/shell) are disabled on Vercel automatically.

## Security

- Local tools are explicit opt-in, and restricted to a user-selected `Allowed Root Directory`.
- Shell tool is dangerous; keep it disabled unless absolutely necessary.
- Never expose a locally-running shell or file tool to the public internet.

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Zod

## License

MIT