"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChatMessage, Settings } from "@/lib/schema";
import { useSpeech } from "@/hooks/useSpeech";
import clsx from "clsx";

type PartialSettings = Partial<Settings>;

function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue] as const;
}

export default function Chat({
  settings,
  onSettings,
}: {
  settings: Settings;
  onSettings: (s: Settings) => void;
}) {
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>("chat:messages", []);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [aborter, setAborter] = useState<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const { listening, supported, startListening, stopListening, speak } = useSpeech();
  const isVercel = useMemo(() => typeof window !== "undefined" && !!(window as any).__VERCEL, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streaming]);

  async function send() {
    if (!input.trim() || streaming) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const state = [...messages, userMsg];
    setMessages(state);
    setInput("");
    setStreaming(true);
    const controller = new AbortController();
    setAborter(controller);
    const resp = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: state, settings, stream: true }),
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });
    const reader = resp.body?.getReader();
    if (!reader) {
      setStreaming(false);
      return;
    }
    let assistant: ChatMessage = { role: "assistant", content: "" };
    setMessages((cur) => [...cur, assistant]);
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      assistant = { ...assistant, content: assistant.content + chunk };
      setMessages((cur) => {
        const copy = [...cur];
        copy[copy.length - 1] = assistant;
        return copy;
      });
    }
    setStreaming(false);
    if (settings.enableTTS) {
      speak(assistant.content);
    }
  }

  function abort() {
    aborter?.abort();
    setStreaming(false);
  }

  function clear() {
    setMessages([]);
    setInput("");
  }

  async function doReadFile(path: string) {
    if (!settings.allowFileRead) return "File reading disabled.";
    const resp = await fetch("/api/tools/file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filepath: path, allowedRoot: settings.allowedRoot }),
    });
    if (!resp.ok) {
      return `Error: ${resp.status}`;
    }
    const data = await resp.json();
    if (data.type === "file") return data.content.slice(0, 4000);
    if (data.type === "directory") {
      return data.entries.map((e: any) => `${e.type}\t${e.name}`).join("\n").slice(0, 4000);
    }
    return "Unknown response.";
  }

  async function doShell(cmd: string, cwd?: string) {
    if (!settings.allowShell) return "Shell disabled.";
    const resp = await fetch("/api/tools/shell", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cmd, cwd, allowedRoot: settings.allowedRoot }),
    });
    if (!resp.ok) {
      return `Error: ${resp.status}`;
    }
    const data = await resp.json();
    return (data.stdout || data.stderr || "").slice(0, 4000);
  }

  function handleVoice() {
    if (listening) {
      stopListening();
      return;
    }
    startListening((txt, isFinal) => {
      setInput((cur) => (isFinal ? (cur ? `${cur} ${txt}` : txt) : `${txt} ?`));
    });
  }

  return (
    <>
      <div className="topbar">
        <div className="logo">
          <div className="logo-badge">A</div>
          Agentic Chat
          <span className="chip">Local Models</span>
        </div>
        <div className="actions">
          <button className="btn ghost" onClick={clear}>New</button>
          <button className={clsx("btn", streaming ? "danger" : "primary")} onClick={streaming ? abort : send}>
            {streaming ? "Stop" : "Send"}
          </button>
        </div>
      </div>
      <div className="main">
        <div>
          <div className="panel">
            <div className="panel-header">
              <div>Presence</div>
              <div className="inline">
                {settings.enableSTT && supported.stt ? (
                  <button className={clsx("btn", listening ? "danger" : "primary")} onClick={handleVoice}>
                    {listening ? "Stop Listening" : "Start Listening"}
                  </button>
                ) : (
                  <span className="chip">Voice input off</span>
                )}
                {settings.enableTTS && supported.tts ? (
                  <span className="chip">TTS on</span>
                ) : (
                  <span className="chip">TTS off</span>
                )}
              </div>
            </div>
            <div className="panel-content">
              <div className="inline" style={{ flexWrap: "wrap", gap: 6 }}>
                <span className="chip">Provider: {settings.provider}</span>
                <span className="chip">Model: {settings.model}</span>
                <span className="chip">Temp: {settings.temperature}</span>
                <span className="chip">TopP: {settings.top_p}</span>
                {isVercel ? <span className="chip">Vercel</span> : <span className="chip">Local</span>}
              </div>
            </div>
          </div>
          <div style={{ height: 16 }} />
          <div className="panel">
            <div className="panel-header">
              <div>Assistant Tools</div>
            </div>
            <div className="panel-content">
              <div className="field">
                <label>Read File / List Dir</label>
                <ToolRunner
                  placeholder="/path/to/file-or-directory"
                  run={doReadFile}
                  disabled={!settings.allowFileRead}
                />
              </div>
              <div className="field">
                <label>Run Shell Command</label>
                <ToolRunner
                  placeholder="ls -la"
                  run={(c) => doShell(c)}
                  disabled={!settings.allowShell}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="panel chat">
          <div className="messages">
            {messages.map((m, i) => (
              <div key={i} className={clsx("bubble", m.role === "assistant" ? "assistant" : undefined)}>
                <div className="meta">{m.role}</div>
                <div className="content">{m.content}</div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="composer">
            <div className="input">
              <textarea
                placeholder="Say something..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    send();
                  }
                }}
              />
              <div className="input-tools">
                {settings.enableSTT && supported.stt ? (
                  <button className={clsx("btn", listening ? "danger" : "primary")} onClick={handleVoice}>
                    {listening ? "Stop" : "Speak"}
                  </button>
                ) : null}
                <button className="btn primary" onClick={send} disabled={streaming}>
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="footer">
        <div>Tip: Ctrl/Cmd + Enter to send. Configure in Settings.</div>
        <div>
          <a href="https://ollama.ai" target="_blank" rel="noreferrer">Ollama</a> ?{" "}
          <a href="https://lmstudio.ai" target="_blank" rel="noreferrer">LM Studio</a>
        </div>
      </div>
    </>
  );
}

function ToolRunner({
  placeholder,
  run,
  disabled,
}: {
  placeholder: string;
  run: (arg: string) => Promise<string>;
  disabled?: boolean;
}) {
  const [arg, setArg] = useState("");
  const [out, setOut] = useState("");
  return (
    <div>
      <div className="inline">
        <input
          placeholder={placeholder}
          value={arg}
          onChange={(e) => setArg(e.target.value)}
        />
        <button className="btn" onClick={async () => setOut(await run(arg))} disabled={disabled}>
          Run
        </button>
      </div>
      {out ? (
        <pre style={{ whiteSpace: "pre-wrap", marginTop: 8, fontSize: 12, color: "#b6c2d2" }}>
          {out}
        </pre>
      ) : null}
    </div>
  );
}

