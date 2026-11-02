# TikTok LIVE connector compatibility

TikTok's public developer APIs are not assumed to provide a general-purpose LIVE comment feed. Third-party packages such as tiktok-live-connector are unofficial and may break when TikTok changes its web protocols. This repository intentionally does not connect to TikTok yet.

Before enabling any unofficial adapter, pin and review the exact package version, check account eligibility and TikTok terms, and test a real LIVE session. Record received event IDs (redacted), reconnect behavior, and errors. Confirm the implementation has no outgoing chat-send path. Never store cookies or session tokens in source control or logs.

AI answers are intended for spoken audio only; no text replies should be posted to TikTok chat. Guest admission remains a manual host action.