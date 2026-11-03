# No-card GPU options

## Decision

Lightning AI is the most plausible no-card prototype host for an open-source GPU worker. Its official pricing describes free credits and a free account tier, but the free tier is quota-based and not a guaranteed 24/7 broadcast machine. A worker may need to restart or stop when credits or session limits are exhausted.

## Rejected for this use

- **Google Colab:** free GPUs are available, but Google's policy prohibits file/media serving, remote-control web services, deepfakes, and techniques used to bypass its restrictions. It is not an appropriate host for a live avatar broadcaster.
- **Kaggle notebooks:** Kaggle provides free Tesla P100 time, but interactive sessions have idle limits and notebooks are not an always-on production service. It is suitable for testing model compatibility, not phone-off streaming.
- **Hugging Face ZeroGPU:** free personal accounts can host ZeroGPU Spaces only after eligibility requirements, and the official quota for a free account is five minutes per day. ZeroGPU is request-oriented Gradio infrastructure, not a continuous RTMP worker.
- **Render free:** useful for the controller, but it sleeps after 15 minutes without inbound traffic and has no persistent disk. It is not suitable for GPU inference or an always-on broadcaster.

## Best free prototype architecture

1. Keep the React/API controller on Render or Deplexo.
2. Run an experimental open-source worker on a free Lightning GPU session.
3. Start with MuseTalk for audio-driven lip-sync or LivePortrait for portrait motion. Both are research/open-source projects whose real-time claims depend on NVIDIA hardware.
4. Treat the worker as a temporary demo endpoint. It must report its GPU, model readiness, session expiry, and queue status to the controller.
5. Do not expose a platform stream key to the worker until a private test confirms that the model can maintain real-time output.

This path can produce a free test, but it cannot guarantee a phone-off 24/7 show. The user must have permission to use each face/image and must follow the model and platform terms.

## Official sources

- Lightning pricing: https://lightning.ai/pricing
- Lightning billing: https://lightning.ai/docs/platform/overview/faq/billing
- LivePortrait: https://github.com/KlingAIResearch/LivePortrait
- MuseTalk: https://github.com/TMElyralab/MuseTalk
- Google Colab FAQ: https://research.google.com/colaboratory/faq.html
- Kaggle GPU usage: https://www.kaggle.com/docs/efficient-gpu-usage
- Hugging Face ZeroGPU: https://huggingface.co/docs/hub/en/spaces-zerogpu
- Render free limits: https://render.com/docs/free
