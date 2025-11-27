"use client";
import { useEffect, useMemo, useState } from "react";
import { Settings, SettingsSchema } from "@/lib/schema";

const DEFAULTS: Settings = {
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

export function SettingsPanel({
  value,
  onChange,
}: {
  value?: Settings;
  onChange: (next: Settings) => void;
}) {
  const [local, setLocal] = useState<Settings>(value ?? DEFAULTS);
  useEffect(() => {
    setLocal(value ?? DEFAULTS);
  }, [value]);

  const isVercel = useMemo(() => typeof window !== "undefined" && !!(window as any).__VERCEL, []);

  return (
    <div className="panel">
      <div className="panel-header">
        <div>Settings</div>
        <button className="btn success" onClick={() => onChange(SettingsSchema.parse(local))}>Save</button>
      </div>
      <div className="panel-content">
        <div className="settings-grid">
          <div className="field">
            <label>Provider</label>
            <select
              value={local.provider}
              onChange={(e) => setLocal({ ...local, provider: e.target.value as any })}
            >
              <option value="ollama">Ollama</option>
              <option value="lmstudio">LM Studio (OpenAI API)</option>
            </select>
          </div>
          <div className="field">
            <label>Base URL</label>
            <input
              placeholder="http://localhost:11434"
              value={local.baseUrl}
              onChange={(e) => setLocal({ ...local, baseUrl: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Model</label>
            <input
              placeholder="llama3.1"
              value={local.model}
              onChange={(e) => setLocal({ ...local, model: e.target.value })}
            />
          </div>
          <div className="inline">
            <div className="field" style={{ flex: 1 }}>
              <label>Temperature</label>
              <input
                type="number"
                step="0.1"
                min={0}
                max={2}
                value={local.temperature}
                onChange={(e) => setLocal({ ...local, temperature: Number(e.target.value) })}
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Top P</label>
              <input
                type="number"
                step="0.05"
                min={0}
                max={1}
                value={local.top_p}
                onChange={(e) => setLocal({ ...local, top_p: Number(e.target.value) })}
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Max Tokens</label>
              <input
                type="number"
                min={16}
                max={8192}
                value={local.max_tokens}
                onChange={(e) => setLocal({ ...local, max_tokens: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="field">
            <label>System Prompt</label>
            <textarea
              value={local.system}
              onChange={(e) => setLocal({ ...local, system: e.target.value })}
            />
          </div>
          <div className="inline">
            <label className="chip">
              <input
                type="checkbox"
                checked={local.enableSTT}
                onChange={(e) => setLocal({ ...local, enableSTT: e.target.checked })}
              />{" "}
              Voice Input (STT)
            </label>
            <label className="chip">
              <input
                type="checkbox"
                checked={local.enableTTS}
                onChange={(e) => setLocal({ ...local, enableTTS: e.target.checked })}
              />{" "}
              Voice Output (TTS)
            </label>
          </div>
          <div className="panel" style={{ borderStyle: "dashed" }}>
            <div className="panel-header">
              <div>Local Tools</div>
              {isVercel ? <span className="chip">Disabled on Vercel</span> : null}
            </div>
            <div className="panel-content">
              <div className="inline" style={{ marginBottom: 8 }}>
                <label className="chip">
                  <input
                    type="checkbox"
                    checked={local.allowFileRead}
                    onChange={(e) => setLocal({ ...local, allowFileRead: e.target.checked })}
                  />{" "}
                  Allow file read
                </label>
                <label className="chip">
                  <input
                    type="checkbox"
                    checked={local.allowShell}
                    onChange={(e) => setLocal({ ...local, allowShell: e.target.checked })}
                  />{" "}
                  Allow shell (dangerous)
                </label>
              </div>
              <div className="field">
                <label>Allowed Root Directory</label>
                <input
                  placeholder="/home/you/projects"
                  value={local.allowedRoot}
                  onChange={(e) => setLocal({ ...local, allowedRoot: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

