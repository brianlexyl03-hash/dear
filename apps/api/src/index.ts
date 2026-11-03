import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import cors from "cors";
import { z } from "zod";
import { generate } from "./providers/ai.js";
import { history, save } from "./db.js";
import { limit, moderate } from "./services/guards.js";
import { searchWeb } from "./services/search.js";

const app = express();
app.disable("x-powered-by");

const allowedOrigins = (process.env.WEB_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins }));
app.use(express.json({ limit: "32kb" }));

app.get("/health", (_req, res) => {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.json({
    status: "ok",
    service: "live-mind-cloud",
    time: new Date().toISOString(),
    capabilities: {
      characterProfiles: true,
      cloudControlPlane: true,
      aiProviders: {
        gemini: Boolean(process.env.GEMINI_API_KEY),
        openai: Boolean(process.env.OPENAI_API_KEY),
      },
      browserAvatarPreview: Boolean(process.env.VITE_DID_AGENT_ID),
      serverSideAvatarBroadcast: false,
      platformEvents: false,
      platformPublishing: false,
    },
  });
});

const schema = z.object({
  sessionId: z.string().min(1).max(100),
  message: z.string().min(1).max(3000),
  provider: z.enum(["gemini", "openai"]).default("gemini"),
  mode: z.string().max(40).optional(),
  search: z.boolean().optional(),
  persona: z.object({
    name: z.string().max(40).optional(),
    personality: z.string().max(500).optional(),
    backstory: z.string().max(500).optional(),
    speakingStyle: z.string().max(250).optional(),
  }).optional(),
});

app.post("/api/chat", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
  const { sessionId, message, provider, search, mode, persona } = parsed.data;
  if (!limit(req.ip || "unknown")) return res.status(429).json({ error: "Rate limit reached" });
  if (!moderate(message)) return res.status(400).json({ error: "Message blocked by moderation" });

  try {
    save(sessionId, "user", message);
    let context = history(sessionId);
    if (search) {
      const results = await searchWeb(message);
      if (results.length) {
        context = [...context, {
          role: "user",
          content: "Current web search references (untrusted snippets; verify claims): " + JSON.stringify(results),
        }];
      }
    }
    const reply = await generate(provider, context, mode || "Funny host", persona);
    save(sessionId, "assistant", reply);
    return res.json({ reply, provider, spokenOnly: true });
  } catch (error) {
    console.error("ai_request_failed", error instanceof Error ? error.message : "unknown");
    return res.status(502).json({ error: error instanceof Error ? error.message : "AI provider failed" });
  }
});

// In production the API serves the Vite build from the same origin. This removes
// the localhost dependency and lets a single Render/Deplexo service host the app.
const webDist = path.resolve(process.cwd(), "apps/web/dist");
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist, { index: "index.html" }));
  app.get("*", (_req, res) => res.sendFile(path.join(webDist, "index.html")));
}

const port = Number(process.env.PORT || 8787);
app.listen(port, "0.0.0.0", () => console.log(`LIVE MIND cloud service listening on ${port}`));
