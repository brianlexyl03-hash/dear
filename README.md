# LIVE MIND AI

Windows-first AI livestream presenter with a responsive web creator studio for Android, iOS and desktop browsers.

> Honest status: the current main branch is a working development foundation. GitHub Actions build and unit tests pass. It is not yet a production livestream platform: TikTok LIVE, platform publishing, production authentication, hosted deployment, and an unattended server-side avatar broadcaster have not been verified.

## Included

- React + TypeScript + Vite responsive creator studio
- Node.js + TypeScript + Express API
- Server-side Gemini and OpenAI provider adapters
- SQLite conversation history
- Optional Brave Search adapter (SEARCH_ENABLED=true)
- Browser speech synthesis for spoken AI replies
- Basic moderation and per-IP rate limiting
- Creator-uploaded character portraits (JPG/PNG/WebP) with local browser persistence
- Per-character name, personality, backstory and speaking-style profiles passed to the AI presenter
- Responsive character preview and platform connection-status dashboard (TikTok LIVE, Instagram Live, Twitch, YouTube Live and OBS/RTMP)
- Single-container Render/Deplexo deployment files and GitHub Actions CI

## Run locally (Windows PowerShell)

Requirements: Node.js 20+, npm, and (for AI replies) a Gemini or OpenAI API key.

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Web studio: http://localhost:5173  
API health: http://localhost:8787/health

Add credentials to .env. Never commit secrets. Build and test:

```powershell
npm run build
npm test
```

## Configuration

- GEMINI_API_KEY or OPENAI_API_KEY: server-side AI provider key.
- BRAVE_SEARCH_API_KEY plus SEARCH_ENABLED=true: optional current-information retrieval.
- DATABASE_PATH: SQLite file path.
- WEB_ORIGIN: allowed browser origin(s).

## Live/streaming safety

- AI responses are intended for spoken audio. There is no TikTok chat-send behavior.
- TikTok LIVE comments are not connected in this initial release. Unofficial connectors may break as TikTok changes its protocols; see docs/TIKTOK-COMPATIBILITY.md.
- Guest admission must remain a manual action by the human host.
- OBS setup notes are in docs/OBS.md; actual OBS audio/video capture still needs a real-machine test.
- The D-ID path is a browser-side photorealistic WebRTC presenter preview, not a general arbitrary-image-to-3D reconstruction. An unattended cloud broadcaster still needs a server-side avatar stream and media bridge.

## Deployment

The repository now deploys as one service. `Dockerfile` builds the React app and API, then the API serves the Vite output from the same origin. This avoids a phone browser depending on a localhost API. `render.yaml` is ready for Render, and `deplexo.yaml` is ready for Deplexo's Dockerfile runtime.

Set the AI provider credentials in the host environment, configure `/data` as persistent storage if the host supports it, and verify `/health` before opening the studio. The health response intentionally reports `serverSideAvatarBroadcast: false` until the provider stream and RTMP bridge are implemented.

See [the real-time avatar research and implementation boundary](docs/REALTIME-AVATAR-RESEARCH.md) before selecting a provider.

### Free tier reality

The free route can host the controller and phone UI, or run a short open-source GPU demo. It cannot guarantee an always-on, smooth, photorealistic 3D avatar broadcast: free Render services sleep and have small CPU limits, while LivePortrait and MuseTalk's real-time claims depend on NVIDIA GPUs. No provider billing, platform restriction, or cloud compute limit is bypassed by this project.

## Security work required before public production

Add owner authentication/authorization, secure session management, CSRF protections where cookie auth is used, request timeouts, robust moderation, provider spend limits, database backups/retention, consent UX for guest transcription/recording, and production observability. Keep all provider credentials server-side.
