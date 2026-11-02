# LIVE MIND AI product roadmap

_Last updated: 2026-11-03_

## Roadmap position

LIVE MIND AI is currently a working development foundation: a responsive React/Vite creator studio, a Node/TypeScript API, server-side Gemini/OpenAI adapters, SQLite conversation history, basic moderation and per-IP rate limiting, browser speech synthesis, and locally persisted character portraits and persona fields. The studio can preview a character and spoken response. It does **not** yet start a production broadcast, ingest a verified platform event feed, run a rigged avatar, or provide production authentication.

The platform cards in the UI are planning/status indicators, not evidence that a channel is connected. No integration should be marked complete until it has been authorized with the intended account and exercised in a real test session.

## Capability roadmap

### Foundation and creator workflow — current / next

- **Available now:** responsive creator studio; character name, personality, backstory and speaking-style controls; JPG/PNG/WebP portrait upload with browser persistence; Gemini/OpenAI server adapters; SQLite conversation history; browser speech preview; basic moderation and rate limiting; platform-status UI; OBS setup notes.
- **Still required before production:** owner authentication and authorization; secure sessions; CSRF protection if cookie authentication is used; request timeouts; stronger moderation and abuse handling; provider spend limits; backups/retention; consent UX for transcription/recording; observability; hosted smoke tests; and a persistent production database or managed Postgres for multi-instance use.
- **Voice:** the current speech output is the browser's installed speech-synthesis voice. A studio-grade neural TTS provider, voice selection policy, latency handling, pronunciation controls and phoneme/timestamp output are future work. The optional ElevenLabs variables in `.env.example` are placeholders, not proof of an implemented adapter.

### Real-time avatar and face effects

The uploaded portrait is a visual asset, not a live avatar. A production real-time avatar/face-effects path still needs:

1. A rights-cleared avatar asset or a consented likeness model, with a documented identity and usage scope.
2. A runtime renderer (for example, a 2D puppet, 3D rig, or approved real-time face-effects SDK) that can render reliably in the browser/OBS capture path.
3. Facial tracking or a deterministic animation driver, including head pose, eye/blink controls, expressions and blendshape mapping. A still image cannot provide these by itself.
4. Audio-driven lip sync based on phonemes or visemes, synchronized with the selected TTS output; ideally with buffering, clock correction and graceful fallback when inference or audio is delayed.
5. Body, hand and gesture animation if the show requires more than a talking head, plus scene/layout controls for vertical and horizontal output.
6. Performance and device testing on the Windows-first target, mobile browsers where supported, and the actual OBS Browser Source. GPU/resource limits, camera permissions, privacy boundaries and fallback states must be defined.
7. Safety controls: a human preview/publish gate, visible synthetic-media disclosure where appropriate, moderation before speech/render, emergency stop, and logs that do not retain unnecessary face, voice or guest data.

A practical sequence is: prove a static composed scene in OBS; add browser-safe audio and a simple animated/2D rig; add provider-backed TTS with timestamps; then evaluate a licensed 3D or face-effects runtime. Do not describe any of these as implemented until a real-machine test passes.

### Twitch: OAuth and EventSub path

Twitch is the clearest first-party integration candidate, but it is not implemented in this repository. The planned path is:

1. Register a Twitch developer application and configure exact redirect URIs. Keep the client secret server-side.
2. Send the channel owner through Twitch OAuth authorization using only the scopes needed for the selected features. Store access and refresh tokens encrypted at rest, with expiry, revocation and disconnect handling.
3. Use the Twitch Helix API for channel/user data and chat or channel operations that the approved scopes support. Do not assume that OAuth alone grants every event or moderation capability.
4. Subscribe to the relevant EventSub topics only after authorization. EventSub may use the supported webhook or WebSocket transport; implement signature verification, challenge handling (webhook), reconnect/keepalive handling (WebSocket), deduplication, retries and subscription cleanup.
5. Record the channel/user identity and subscription state, expose a clear disconnect/revoke action, and test with a real Twitch account in a private or controlled stream. Keep AI output as spoken audio unless an explicitly reviewed, consented chat-send feature is later added.

The first useful milestone is read-only, human-moderated event ingestion (for example, chat/follow/subscription events where authorized), not autonomous posting or moderation. Twitch scopes, EventSub topics, rate limits and product requirements must be checked against the current Twitch documentation when implementation begins.

### TikTok: official API limitations and compatibility boundary

The repository intentionally does not connect to TikTok LIVE. Do not represent an unofficial connector as an official integration. The public TikTok developer surface is not assumed here to provide a general-purpose LIVE comment/event feed for this product; availability depends on the specific approved product, account eligibility and permissions. Unofficial packages that observe web protocols can break when TikTok changes those protocols and can create terms, account-security and privacy risk.

If TikTok is pursued, first verify the current official product documentation, the account's LIVE eligibility, the app's approved scopes/use case and whether the required event data is actually available. Prefer an approved official path. If a temporary unofficial adapter is evaluated, pin and review its exact version, obtain legal/terms approval, isolate it, never store cookies/session tokens in source control or logs, test a real LIVE session, redact event IDs in diagnostics, measure reconnect/error behavior, and keep an explicit kill switch. No outgoing TikTok chat-send path should be added by assumption; current AI replies are for spoken audio only, and guest admission remains a manual host action.

### Instagram / Meta eligibility

Instagram Live integration is also not implemented. Any Meta path must begin with the current Meta/Instagram API documentation and app review requirements rather than a UI badge. Eligibility and available permissions depend on the API product, account type and region. In particular, plan around professional Instagram accounts and the required Meta app configuration; do not promise support for personal accounts or every Live event without confirming the exact endpoint and permission set.

The implementation path should be: create/configure a Meta app; establish the correct Instagram professional-account relationship and redirect URI; request only the required permissions; complete App Review and any business verification; implement OAuth token exchange and secure token storage; then add only the approved data/event operations. Confirm the exact support for Live comments, audience events and publishing before designing the event model. Test with an eligible, consenting account and document what is unavailable. Meta can change eligibility, permissions and review requirements, so this item remains conditional until verified against live official documentation.

### OBS / RTMP role

OBS is the local production and transport layer, not a platform API connector. The intended flow is:

`LIVE MIND AI web studio -> OBS Browser Source (composed video/audio) -> OBS scene and encoder -> platform-specific RTMP/stream destination`

The current repository contains setup notes only. A real OBS test still needs to verify Browser Source rendering, audio capture and monitoring, echo/feedback prevention, scene sizing (including the documented 1080x1920 vertical canvas), encoder performance, reconnect behavior and a private test broadcast. Platform stream keys and RTMP URLs are destination credentials; they must not be exposed in client bundles, logs or committed files. OBS does not solve OAuth, EventSub, TikTok/Meta eligibility, chat ingestion, guest consent or avatar animation.

## Likeness, voice and guest consent requirements

Before using a real person's face, voice, name, recordings or likeness, obtain explicit, informed, affirmative permission from that person. The consent record should identify the person, the asset/data, the permitted product and channels, whether the use is synthetic or transformed, duration/territory, monetization and sublicensing, retention/deletion terms, revocation process, and any right to review or approve publication. Consent must not be inferred from an uploaded image, a social-media post, a guest appearance, or a platform login.

Disclose to viewers when the presenter, voice or face is synthetic or materially transformed, and do not imply that a person said or did something they did not approve. Keep a separate consent flow for guests and audience members whose audio, video, chat, transcription or likeness may be captured. Make admission manual, provide a clear stop/removal path, minimize collection, restrict access, encrypt sensitive data, define retention/deletion, and avoid training or reusing likeness data outside the granted scope. Obtain releases and any needed guardian/authority approval for minors; do not process a minor's likeness by default. Add a takedown/incident process and legal review for jurisdiction-specific publicity, privacy, biometric-data, copyright and platform rules.

## Secrets and configuration

### Existing configuration

These variables are present in `.env.example` today:

- `PORT`, `NODE_ENV`, `WEB_ORIGIN`, `DATABASE_PATH`
- `GEMINI_API_KEY`, `GEMINI_MODEL`
- `OPENAI_API_KEY`, `OPENAI_MODEL`
- `BRAVE_SEARCH_API_KEY`, `SEARCH_ENABLED`
- `TIKTOK_LIVE_ENABLED`, `TIKTOK_USERNAME`, `TIKTOK_CONNECTOR_MODE`
- `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`

The TikTok and ElevenLabs entries are configuration placeholders; they do not establish a working integration. Provider keys stay server-side. Never commit `.env`, tokens, cookies, stream keys or logs containing secrets.

### Future integration configuration (proposed names)

Names below are a planning contract, not current implementation. Final names should be chosen when the corresponding feature is built:

- **Twitch:** `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, `TWITCH_REDIRECT_URI`, an encrypted token/session store, and EventSub transport settings such as `TWITCH_EVENTSUB_CALLBACK_URL` plus a verification secret or signing configuration. OAuth access/refresh tokens must be per connected creator, encrypted and revocable; do not use one global token.
- **Meta/Instagram:** `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`, approved permission configuration, and an encrypted per-account token store. Add webhook verification/signing configuration only if the approved product requires webhooks.
- **Avatar/face runtime:** the selected provider's server-side API key or license configuration, model/rig identifier, asset storage settings and consent-record references. Do not put a private SDK key or an unlicensed asset in the browser bundle.
- **TTS:** provider API key, voice/model identifier, region/endpoint and timeout/cache settings. Cache only where the consent and retention policy permits.
- **OBS/RTMP:** stream destination URL and stream key should be supplied through the private OBS/platform workflow or a protected server-side secret store. They are not ordinary frontend environment variables and must never be rendered into the web client.
- **Operations:** production `WEB_ORIGIN`, database URL/path, session encryption key, cookie/security settings, rate-limit store, log redaction and error-monitoring credentials, plus backup/retention settings.

## Release gates

A roadmap item is complete only when the implementation exists, secrets are handled safely, permissions/terms are reviewed, automated checks pass, and a documented real-world test has passed. Until then, keep the UI state as `Not connected`, `Setup required`, or equivalent. The current branch should continue to describe itself as a development foundation rather than a production livestream platform.
