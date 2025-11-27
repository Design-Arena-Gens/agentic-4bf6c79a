"use client";
import Chat from "@/components/Chat";
import { SettingsPanel } from "@/components/Settings";
import { Settings } from "@/lib/schema";
import { useEffect, useState } from "react";

const DEFAULT: Settings = {
  provider: "ollama",
  baseUrl: "http://localhost:11434",
  model: "llama3.1",
  temperature: 0.7,
  top_p: 0.95,
  presence_penalty: 0,
  frequency_penalty: 0,
  max_tokens: 1024,
  system: "You are a helpful on-device AI assistant. Keep responses concise.",
  enableTTS: false,
  enableSTT: false,
  allowFileRead: false,
  allowShell: false,
  allowedRoot: ""
};

function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("chat:settings");
      if (raw) setSettings(JSON.parse(raw));
    } catch {}
  }, []);
  const update = (next: Settings) => {
    setSettings(next);
    try {
      localStorage.setItem("chat:settings", JSON.stringify(next));
    } catch {}
  };
  return [settings, update] as const;
}

export default function Page() {
  const [settings, setSettings] = useSettings();
  return (
    <>
      <Chat settings={settings} onSettings={setSettings} />
      <div style={{ position: "fixed", left: 16, top: 64, width: 320 }}>
        <SettingsPanel value={settings} onChange={setSettings} />
      </div>
    </>
  );
}

