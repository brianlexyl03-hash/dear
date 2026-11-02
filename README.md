# LIVE MIND AI

Windows-first AI livestream presenter with responsive web/PWA creator studio.

> Development status: initial repository bootstrap. This is not yet a production livestream product. TikTok LIVE is not connected or verified, and no deployment or live integration test is claimed.

## Goals
- Responsive Android, iOS and desktop creator experience
- Server-side Gemini and OpenAI adapters
- Persistent conversation context
- Configurable web search and spoken AI responses
- OBS browser-source workflow
- Manual guest admission and moderation controls
- Explicitly gated unofficial TikTok LIVE connector (no outgoing chat replies)

## Security
Keep all API keys in server-side environment variables. Never commit `.env`, provider keys, TikTok cookies, or guest recordings.

See `docs/STATUS.md` for implementation status and next steps.