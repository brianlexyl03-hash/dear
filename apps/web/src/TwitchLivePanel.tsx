import { useEffect, useRef, useState } from "react";

type Props = {
  api: string;
  provider: string;
  mode: string;
  character: { name: string; personality: string; backstory: string; speakingStyle: string };
  language: string;
  accent: string;
  voice: boolean;
};

type LiveLine = { id: string; user: string; text: string; reply?: string };

export default function TwitchLivePanel({ api, provider, mode, character, language, accent, voice }: Props) {
  const [channel, setChannel] = useState("");
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lines, setLines] = useState<LiveLine[]>([]);
  const [notice, setNotice] = useState("Connect to a public Twitch chat to let your AI co-host hear the conversation.");
  const socket = useRef<WebSocket | null>(null);
  const queue = useRef<string[]>([]);
  const working = useRef(false);
  const active = useRef(false);

  function speak(text: string) {
    if (!voice || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = accent || language;
    window.speechSynthesis.speak(utterance);
  }

  async function answer(user: string, message: string) {
    try {
      const response = await fetch(api + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "twitch-live-" + channel.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 60),
          message: user + " says in the live chat: " + message + ". Respond as a live co-host. Address the viewer naturally when useful. Keep it concise for spoken delivery.",
          provider,
          mode,
          persona: {
            name: character.name,
            personality: character.personality,
            backstory: character.backstory,
            speakingStyle: character.speakingStyle + " Speak in " + language + " with a natural " + accent + " voice."
          }
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AI response failed");
      const reply = String(data.reply || "").trim();
      setLines(previous => [...previous, { id: crypto.randomUUID(), user, text: message, reply }].slice(-12));
      if (reply) speak(reply);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not answer the live chat");
    }
  }

  async function drain() {
    if (working.current || !active.current) return;
    working.current = true;
    setBusy(true);
    try {
      while (queue.current.length && active.current) {
        const item = queue.current.shift()!;
        const split = item.indexOf(":");
        await answer(item.slice(0, split), item.slice(split + 1));
      }
    } finally {
      working.current = false;
      setBusy(false);
    }
  }

  function disconnect() {
    active.current = false;
    queue.current = [];
    socket.current?.close();
    socket.current = null;
    setConnected(false);
    setNotice("Disconnected from Twitch chat.");
  }

  function connect() {
    const name = channel.trim().replace(/^@/, "").replace(/^#/, "").toLowerCase();
    if (!/^[a-z0-9_]{1,25}$/.test(name)) {
      setNotice("Enter a valid Twitch channel name.");
      return;
    }
    disconnect();
    setChannel(name);
    setLines([]);
    setNotice("Connecting to public Twitch chat…");
    const ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
    socket.current = ws;
    active.current = true;
    ws.onopen = () => {
      ws.send("CAP REQ :twitch.tv/tags twitch.tv/commands");
      ws.send("PASS SCHMOOPIIE");
      ws.send("NICK justinfan" + Math.floor(10000 + Math.random() * 89999));
      ws.send("JOIN #" + name);
    };
    ws.onmessage = event => {
      const raw = String(event.data);
      if (raw.startsWith("PING")) {
        ws.send("PONG :tmi.twitch.tv");
        return;
      }
      if (raw.includes(" 366 ")) {
        setConnected(true);
        setNotice("Connected to #" + name + ". Listening to public chat; AI replies are spoken locally, not posted to chat.");
        return;
      }
      const match = raw.match(/:([^! ]+)!.* PRIVMSG #[^ ]+ :(.*)$/);
      if (!match || !active.current) return;
      const user = match[1];
      const message = match[2].trim();
      if (!message || message.startsWith("!")) return;
      queue.current.push(user + ":" + message.slice(0, 500));
      void drain();
    };
    ws.onerror = () => setNotice("Twitch connection failed. Check the channel name or whether this network permits WebSockets.");
    ws.onclose = () => {
      if (socket.current === ws) {
        socket.current = null;
        setConnected(false);
        if (active.current) setNotice("Twitch connection closed. Reconnect to resume listening.");
        active.current = false;
      }
    };
  }

  useEffect(() => () => {
    active.current = false;
    socket.current?.close();
  }, []);

  return <section className="panel">
    <h3>● TWITCH LIVE CO-HOST</h3>
    <p>Listen to a public Twitch channel and let your character react out loud in real time.</p>
    <label>TWITCH CHANNEL</label>
    <input className="field" value={channel} onChange={event => setChannel(event.target.value)} placeholder="channelname" disabled={connected} />
    <div className="modes">
      <button className="go" onClick={connect} disabled={connected || busy}>Connect live chat</button>
      <button className="toggle" onClick={disconnect} disabled={!connected && !socket.current}>Disconnect</button>
    </div>
    <p>{notice}</p>
    {busy && <small>VYRO is responding to the live conversation…</small>}
    <div className="messages">
      {lines.slice(-6).map(line => <div className="msg" key={line.id}>
        <b>{line.user}</b><p>{line.text}</p>
        {line.reply && <><b>{character.name}</b><p>{line.reply}</p></>}
      </div>)}
    </div>
    <small>Read-only chat connection. AI voice is played on this creator device. No messages are sent to Twitch chat. Keep the live stream audible and moderate viewers yourself.</small>
  </section>;
}
