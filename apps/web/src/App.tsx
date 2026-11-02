import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Camera,
  Heart,
  Image as ImageIcon,
  Link2,
  Globe,
  Mic,
  Monitor,
  Radio,
  Send,
  Settings,
  Shield,
  Upload,
  Users,
  Volume2,
  Zap,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8787";

type Msg = { id: string; name: string; text: string; host?: boolean };
type Character = {
  name: string;
  personality: string;
  backstory: string;
  speakingStyle: string;
  image: string;
};
type AvatarState = "idle" | "talking" | "dance";
type CameraState = "off" | "starting" | "ready" | "denied" | "unavailable";

const accentChoices: Record<string, { label: string; code: string }[]> = {
  en: [
    { label: "United States", code: "en-US" },
    { label: "United Kingdom", code: "en-GB" },
    { label: "Australia", code: "en-AU" },
    { label: "Kenya", code: "en-KE" },
    { label: "India", code: "en-IN" },
  ],
  sw: [{ label: "Kenya", code: "sw-KE" }, { label: "Tanzania", code: "sw-TZ" }],
  es: [{ label: "Spain", code: "es-ES" }, { label: "Mexico", code: "es-MX" }],
  fr: [{ label: "France", code: "fr-FR" }, { label: "Canada", code: "fr-CA" }],
  pt: [{ label: "Brazil", code: "pt-BR" }, { label: "Portugal", code: "pt-PT" }],
  de: [{ label: "Germany", code: "de-DE" }, { label: "Austria", code: "de-AT" }],
  ar: [{ label: "Modern Standard / Gulf", code: "ar-SA" }, { label: "Egypt", code: "ar-EG" }],
  hi: [{ label: "India", code: "hi-IN" }],
  ja: [{ label: "Japan", code: "ja-JP" }],
};

const languageNames: Record<string, string> = {
  en: "English",
  sw: "Kiswahili",
  es: "Spanish",
  fr: "French",
  pt: "Portuguese",
  de: "German",
  ar: "Arabic",
  hi: "Hindi",
  ja: "Japanese",
};

const starter: Character = {
  name: "VYRO",
  personality:
    "Confident, charismatic, playful, warm, quick-witted and curious. Has bold opinions but respects people.",
  backstory:
    "An original virtual show personality built to entertain, discuss ideas and connect with audiences.",
  speakingStyle: "Energetic, conversational, expressive and natural",
  image: "",
};

const platforms = [
  { name: "TikTok LIVE", detail: "Live comments, likes and gifts", status: "Requires developer app and LIVE access" },
  { name: "Instagram Live", detail: "Live comments and audience events", status: "Requires eligible Meta app and permissions" },
  { name: "Twitch", detail: "Chat, follows, subscriptions and cheers", status: "Requires Twitch OAuth and EventSub" },
  { name: "YouTube Live", detail: "Live chat, Super Chats and memberships", status: "Requires Google OAuth and YouTube API" },
];

const simulatedEvents = [
  { id: "event-1", label: "Audience joined", detail: "Maya · simulated" },
  { id: "event-2", label: "Question queued", detail: "What are we building today? · simulated" },
  { id: "event-3", label: "Reaction received", detail: "💜 from Alex · simulated" },
];

export default function App() {
  const [provider, setProvider] = useState("gemini");
  const [mode, setMode] = useState("Funny host");
  const [voice, setVoice] = useState(true);
  const [language, setLanguage] = useState("en");
  const [accent, setAccent] = useState("en-US");
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState("Hey! I'm VYRO. Upload a character portrait, shape my personality, and let's build a show.");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Checking API…");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [liveMode, setLiveMode] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraState, setCameraState] = useState<CameraState>("off");
  const [avatarState, setAvatarState] = useState<AvatarState>("idle");
  const [character, setCharacter] = useState<Character>(() => {
    try {
      return { ...starter, ...JSON.parse(localStorage.getItem("live-mind-character") || "{}") };
    } catch {
      return starter;
    }
  });
  const [tab, setTab] = useState("Character");
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const danceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if ("speechSynthesis" in window) {
      const load = () => setAvailableVoices(speechSynthesis.getVoices());
      load();
      speechSynthesis.addEventListener("voiceschanged", load);
      return () => speechSynthesis.removeEventListener("voiceschanged", load);
    }
  }, []);

  useEffect(() => {
    fetch(API + "/health")
      .then((r) => r.json())
      .then(() => setStatus("API connected"))
      .catch(() => setStatus("API offline · start the server"));
  }, []);

  useEffect(() => {
    if (!cameraEnabled) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraState("off");
      return;
    }

    let cancelled = false;
    setCameraState("starting");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState("unavailable");
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => undefined);
        }
        setCameraState("ready");
      })
      .catch((error: DOMException) => {
        if (!cancelled) setCameraState(error.name === "NotAllowedError" ? "denied" : "unavailable");
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [cameraEnabled]);

  useEffect(() => {
    return () => {
      if (danceTimerRef.current) window.clearTimeout(danceTimerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function change(patch: Partial<Character>) {
    setCharacter((current) => {
      const next = { ...current, ...patch };
      try {
        localStorage.setItem("live-mind-character", JSON.stringify(next));
      } catch {
        setStatus("Image too large for browser storage; choose a smaller image");
      }
      return next;
    });
  }

  function upload(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus("Choose an image file");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setStatus("Choose an image under 3 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => change({ image: String(reader.result || "") });
    reader.readAsDataURL(file);
  }

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    if (danceTimerRef.current) window.clearTimeout(danceTimerRef.current);
    setAvatarState("talking");
    danceTimerRef.current = window.setTimeout(() => setAvatarState("dance"), 1400);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = accent;
    const exact = availableVoices.find((v) => v.lang.toLowerCase() === accent.toLowerCase());
    const sameLanguage = availableVoices.find((v) => v.lang.toLowerCase().startsWith(language + "-") || v.lang.toLowerCase() === language);
    utterance.voice = exact || sameLanguage || null;
    utterance.onend = () => {
      if (danceTimerRef.current) window.clearTimeout(danceTimerRef.current);
      setAvatarState("idle");
    };
    utterance.onerror = () => {
      if (danceTimerRef.current) window.clearTimeout(danceTimerRef.current);
      setAvatarState("idle");
    };
    speechSynthesis.speak(utterance);
  }

  async function ask() {
    if (!question.trim() || busy) return;
    const q = question.trim();
    setQuestion("");
    setMessages((current) => [...current, { id: crypto.randomUUID(), name: "Creator", text: q }]);
    setBusy(true);
    try {
      const response = await fetch(API + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "creator-demo",
          message: q,
          provider,
          mode,
          persona: {
            name: character.name,
            personality: character.personality,
            backstory: character.backstory,
            speakingStyle: character.speakingStyle + " Speak naturally in " + (languageNames[language] || "English") + ". Keep the selected language consistent unless asked to translate.",
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error || "Request failed");
      setReply(data.reply);
      setMessages((current) => [...current, { id: crypto.randomUUID(), name: character.name, text: data.reply, host: true }]);
      if (voice) speak(data.reply);
    } catch (error) {
      setReply(error instanceof Error ? error.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  const cameraMessage = {
    off: "Camera preview is off",
    starting: "Requesting camera permission…",
    ready: "Camera preview ready",
    denied: "Camera permission was denied",
    unavailable: "Camera is unavailable in this browser",
  }[cameraState];

  return (
    <main className="app">
      <header>
        <div className="logo" aria-hidden="true">✦</div>
        <div><b>VYRO <span>STUDIO</span></b><small>CREATE · PERSONALISE · GO LIVE</small></div>
        <label className="status" aria-live="polite">{status}</label>
        <Settings aria-label="Studio settings" />
      </header>
      <div className="layout">
        <section className="stage" style={character.image ? { backgroundImage: "linear-gradient(0deg,#08091bdc,transparent 50%),url(" + character.image + ")", backgroundSize: "cover", backgroundPosition: "center" } : {}} aria-label="Character preview stage">
          <div className="neon n1" /><div className="neon n2" />
          <div className="top"><b>{character.name || "Your character"} <i aria-label="Preview status">●</i></b><span>CHARACTER PREVIEW</span></div>
          <div className={`avatar-presence avatar-${avatarState}`} aria-label={`Avatar animation: ${avatarState}`}>
            <div className="avatar-orb">{character.name?.slice(0, 1) || "V"}</div><span>{avatarState.toUpperCase()}</span>
          </div>
          {!character.image && <div className="empty-avatar"><ImageIcon size={64} aria-hidden="true" /><p>Upload a character portrait</p></div>}
          <div className="caption" aria-live="polite">{reply}</div>
          <div className="bottom"><span className={liveMode ? "live-badge" : "preview-badge"}>{liveMode ? "● LIVE SCENE" : "● PREVIEW ONLY"}</span><span>✦ {mode}</span></div>
          <div className="hearts" aria-hidden="true"><Heart /><br />💜<br />♥</div>
          {cameraEnabled && <div className="camera-pip"><video ref={videoRef} muted playsInline aria-label="Camera picture-in-picture preview" /><span>{cameraState === "ready" ? "CAMERA PREVIEW" : cameraMessage}</span></div>}
        </section>
        <aside>
          <section className="panel mode-panel">
            <div className="live-switch-row"><div><b>SCENE MODE</b><small>{liveMode ? "LIVE SCENE · publishing is not enabled" : "PREVIEW ONLY · nothing is published"}</small></div><button className={`switch ${liveMode ? "on" : ""}`} onClick={() => setLiveMode((value) => !value)} aria-pressed={liveMode} aria-label={`Switch to ${liveMode ? "preview only" : "live scene"}`}>{liveMode ? "LIVE" : "PREVIEW"}</button></div>
            <button className="camera-button" onClick={() => setCameraEnabled((value) => !value)} aria-pressed={cameraEnabled}><Camera size={16} /> {cameraEnabled ? "Turn camera preview off" : "Enable camera preview"}</button>
            <small className="camera-note">{cameraMessage}. This local picture-in-picture preview does not publish video or perform face swap.</small>
          </section>
          <section className="panel">
            <div className="tabs" role="tablist" aria-label="Studio sections">{["Character", "Platforms", "Studio"].map((item) => <button role="tab" aria-selected={tab === item} className={tab === item ? "selected" : ""} onClick={() => setTab(item)} key={item}>{item}</button>)}</div>
            {tab === "Character" && <><h3><ImageIcon /> YOUR CHARACTER</h3><div className="upload-card"><div className="avatar-thumb">{character.image ? <img src={character.image} alt="Uploaded character portrait" /> : <Upload aria-hidden="true" />}</div><div><b>Change character image</b><p>Upload JPG, PNG or WebP · max 3 MB</p><button className="go" onClick={() => fileRef.current?.click()}><Upload size={15} /> Upload image</button><input ref={fileRef} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => upload(event.target.files?.[0])} /></div></div><label htmlFor="character-name">CHARACTER NAME</label><input id="character-name" className="field" value={character.name} maxLength={40} onChange={(event) => change({ name: event.target.value })} /><label htmlFor="personality">PERSONALITY & TRAITS</label><textarea id="personality" className="field" rows={3} value={character.personality} onChange={(event) => change({ personality: event.target.value })} /><label htmlFor="backstory">BACKSTORY</label><textarea id="backstory" className="field" rows={2} value={character.backstory} onChange={(event) => change({ backstory: event.target.value })} /><label htmlFor="speaking-style">VOICE / SPEAKING STYLE</label><input id="speaking-style" className="field" value={character.speakingStyle} onChange={(event) => change({ speakingStyle: event.target.value })} /><button className="toggle" onClick={() => { change(starter); setReply("Character reset to VYRO."); }}>Reset character</button></>}
            {tab === "Platforms" && <><h3><Link2 /> CONNECT YOUR CHANNELS</h3><p>These connectors are not active until each platform authorises this app. No fake connected badges.</p>{platforms.map((platform) => <div className="platform" key={platform.name}><div><b>{platform.name}</b><p>{platform.detail}</p><small>{platform.status}</small></div><span className="pending">Not connected</span></div>)}<div className="platform"><div><b>OBS / RTMP</b><p>Send the composed scene to a supported destination through OBS.</p><small>OBS setup and stream keys required</small></div><span className="pending">Setup required</span></div></>}
            {tab === "Studio" && <><h3><Activity /> CREATOR CONTROL</h3><label>SHOW MODE</label><div className="modes">{["Podcast", "Funny host", "Debate", "Co-host"].map((item) => <button key={item} className={mode === item ? "selected" : ""} onClick={() => setMode(item)}>{item}</button>)}</div><label>LANGUAGE MODEL</label><select aria-label="Language model" value={provider} onChange={(event) => setProvider(event.target.value)}><option value="gemini">Gemini</option><option value="openai">OpenAI</option></select><label><Globe /> SPOKEN LANGUAGE</label><select aria-label="Spoken language" value={language} onChange={(event) => { const next = event.target.value; setLanguage(next); setAccent((accentChoices[next] || [])[0]?.code || next); }}><option value="en">English</option><option value="sw">Kiswahili</option><option value="es">Spanish</option><option value="fr">French</option><option value="pt">Portuguese</option><option value="de">German</option><option value="ar">Arabic</option><option value="hi">Hindi</option><option value="ja">Japanese</option></select><label>ACCENT / REGION</label><select aria-label="Accent or region" value={accent} onChange={(event) => setAccent(event.target.value)}>{(accentChoices[language] || []).map((choice) => <option value={choice.code} key={choice.code}>{choice.label}</option>)}</select><label>AVAILABLE NATURAL VOICES</label><select aria-label="Available natural voices" value={availableVoices.find((item) => item.lang.toLowerCase() === accent.toLowerCase())?.name || ""} onChange={(event) => { const selected = availableVoices.find((item) => item.name === event.target.value); if (selected) { setAccent(selected.lang); setLanguage(selected.lang.split("-")[0]); } }}><option value="">Automatic best match ({availableVoices.filter((item) => item.lang.toLowerCase().startsWith(language)).length} available)</option>{availableVoices.filter((item) => item.lang.toLowerCase().startsWith(language)).map((item) => <option value={item.name} key={item.name}>{item.name} · {item.lang}</option>)}</select><button className="toggle" onClick={() => setVoice(!voice)}><Volume2 /> Spoken voice preview <b>{voice ? "ON" : "OFF"}</b></button><button className="go" onClick={() => speak(reply)}><Volume2 /> Hear voice sample</button><button className="go" onClick={() => setReply("Preview ready. This does not start a real broadcast.")}><Radio /> Preview session</button><p className="voice-note">Voice quality and accent availability depend on the voices installed on this device/browser. For studio-grade neural voices, connect a dedicated voice provider.</p><p><Shield /> Human-controlled moderation and guest admission. Platform publishing is not enabled yet.</p></>}
          </section>
          <section className="panel queue-panel"><h3><Users /> AUDIENCE / EVENT QUEUE</h3><span className="simulated-label">SIMULATED SAMPLE EVENTS · NOT CONNECTED</span>{simulatedEvents.map((event) => <div className="queue-item" key={event.id}><b>{event.label}</b><small>{event.detail}</small></div>)}<p className="queue-note">Real audience events require an authorised platform connection.</p></section>
          <section className="panel chat"><h3><Users /> CHARACTER CHAT</h3><div className="messages">{messages.slice(-6).map((message) => <div className="msg" key={message.id}><b>{message.name}{message.host ? " · HOST" : ""}</b><p>{message.text}</p></div>)}</div><div className="input"><input aria-label={`Message ${character.name || "your character"}`} value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => event.key === "Enter" && ask()} placeholder={`Talk to ${character.name || "your character"}…`} /><button aria-label="Send message" disabled={busy} onClick={ask}><Send /></button></div><small>Spoken preview only · not posted to channel chat</small></section>
          <section className="panel"><h3><Zap /> LIVE PRODUCTION</h3><p><Monitor /> OBS scene output · configuration required</p><p><Mic /> Voice output · browser speech for preview</p><p><Shield /> Platform permissions and event feeds require authorisation</p></section>
        </aside>
      </div>
      <footer>VYRO STUDIO · DEVELOPMENT BUILD <span>Mobile-friendly creator workspace · API {status}</span></footer>
    </main>
  );
}
