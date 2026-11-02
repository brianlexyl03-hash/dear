# LIVE MIND AI

Windows-first AI livestream presenter with a responsive web creator studio for Android, iOS and desktop browsers.

> Honest status: the current main branch is a working development foundation. GitHub Actions build and unit tests pass. It is not yet a production livestream platform: TikTok LIVE, OBS capture, real guest audio, production authentication, hosted deployment and a full 3D avatar rig have not been verified.

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
- Render service blueprint and GitHub Actions CI

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
- The host reference image is a visual asset, not a rigged photorealistic 3D avatar. Facial blendshapes, phoneme lip sync, dance and gesture animation remain future work.

## Deployment

- Frontend: Vercel project live-mind-ai-web, root directory apps/web. Vercel team authorization is still required before deployment can be inspected/launched.
- API: render.yaml defines a Render web service. Connect the repository in Render and configure secrets before deploying. Add persistent storage or migrate SQLite to managed Postgres before production/multi-instance use.
- After API deployment, set Vercel VITE_API_URL to the deployed API origin and redeploy the frontend.

## Security work required before public production

Add owner authentication/authorization, secure session management, CSRF protections where cookie auth is used, request timeouts, robust moderation, provider spend limits, database backups/retention, consent UX for guest transcription/recording, and production observability. Keep all provider credentials server-side.
