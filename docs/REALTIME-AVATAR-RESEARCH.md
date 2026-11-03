# Real-time avatar architecture

## Verified findings

The current studio uses the official D-ID Agents SDK. D-ID documents this SDK as a front-end integration for WebRTC avatar sessions, and its quickstart describes custom avatars, personality instructions, and real-time conversations. That makes it suitable for a phone browser preview, but not by itself for a phone-independent broadcaster.

D-ID also documents an Agents Streams API. The server-side worker would need to create an agent stream, complete the WebRTC SDP/ICE exchange, receive the media, and then forward the audio/video to a live-platform ingest endpoint. The SDK does not automatically turn a browser WebRTC session into an RTMP broadcast.

HeyGen LiveAvatar supports real-time conversational avatars in FULL mode, where the provider manages speech recognition, language model, text-to-speech, turn-taking, memory, and context, or LITE mode, where the application supplies the agent. Tavus CVI pairs a PAL (behavior and knowledge) with a photorealistic Face and a real-time conversation. Both are credible hosted alternatives, but neither is a free, arbitrary-image-to-3D-avatar engine.

Twitch accepts a broadcaster's encoded video through RTMP and authenticates the broadcast with an ingest URL and stream key. YouTube's Live Streaming API manages broadcasts and streams, while an encoder sends the actual media to the configured ingest endpoint. This means a cloud broadcaster can run without a phone or laptop once the worker has a valid encoder path and platform credentials.

## What is implemented in this repository

- A responsive creator studio for Android, iOS, and desktop browsers.
- Multiple local character profiles, each with its own portrait, persona, and D-ID Agent ID.
- Browser-side D-ID WebRTC preview with explicit status and disconnect cleanup.
- Same-origin production serving so the phone UI can be deployed as one service.
- A production Dockerfile and Render/Deplexo configuration.
- A health endpoint that explicitly reports `serverSideAvatarBroadcast: false` until that worker is implemented.

## What is not falsely marked complete

This repository does not claim that a still image has become a true 3D human. A single arbitrary image cannot reliably provide a complete 3D body rig, natural full-body movement, identity-preserving hands, and production-quality lip sync without a reconstruction/animation pipeline or a hosted avatar provider. The current D-ID path is a photorealistic streamed presenter, not a general-purpose 3D character generator.

The phone-off requirement needs a separate persistent worker. That worker must own the avatar session, maintain the provider connection, render or receive the media, and publish through RTMP or a supported platform API. Render or Deplexo can host the controller and a Node worker, but the final reliability depends on the selected provider's server-side stream API, CPU/memory/bandwidth limits, and the provider/platform credentials.

## Recommended production path

Use a hosted live-avatar provider for the visual stream, keep the application LLM/personality and moderation in the server, and add an explicit broadcaster adapter for Twitch first. The phone calls the cloud control API; it never holds the only avatar session and never receives or stores platform stream keys. Add YouTube next through its official Live Streaming API. Add TikTok or Instagram only through approved account capabilities, because their LIVE access and developer permissions are more restrictive.

The next server-side milestone is therefore concrete: implement one provider adapter against Agents Streams or LiveAvatar, add a media bridge to the chosen RTMP ingest, persist worker state under `/data`, add automatic reconnect and a kill switch, and test privately before enabling public broadcast.

## No-credit option

There is no reliable way to bypass a provider's billing or a cloud host's compute limits. The legal no-credit prototype is to keep this Node controller on a free web host and run an open-source model such as LivePortrait or MuseTalk on a temporary GPU environment. LivePortrait's official instructions require CUDA/PyTorch setup and say macOS inference can be many times slower than an RTX 4090. MuseTalk reports 30+ FPS on a Tesla V100, which is GPU performance, not a free CPU-container guarantee.

Free Render services spin down after 15 minutes without inbound traffic, lose local files on restarts, and have fractional CPU and limited memory. Free Hugging Face CPU Spaces can sleep, while GPU hardware is billed by the minute except for limited grants. Those constraints make the free route suitable for a demo or short test, not a guaranteed phone-off 24/7 broadcast. The code therefore keeps paid provider credentials optional and does not pretend that a free CPU service can provide smooth photorealistic 3D animation.

## Sources

- D-ID Agents SDK: https://docs.d-id.com/reference/agents-sdk-overview
- D-ID Quickstart: https://docs.d-id.com/docs/quickstart
- D-ID Agents Streams mapping: https://docs.d-id.com/reference/talks-streams-overview
- HeyGen LiveAvatar: https://developers.heygen.com/live-avatar
- Tavus API overview: https://docs.tavus.io/api-reference/overview
- Twitch video broadcast: https://dev.twitch.tv/docs/video-broadcast/
- YouTube Live API: https://developers.google.com/youtube/v3/live/getting-started
