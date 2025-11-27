import { useCallback, useEffect, useRef, useState } from "react";

export function useSpeech(options?: { lang?: string; ttsVoice?: string }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState({
    stt: false,
    tts: false,
  });
  const recognitionRef = useRef<any>(null);
  const [voices, setVoices] = useState<any[]>([]);

  // Init support flags
  useEffect(() => {
    const stt = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
    const tts = typeof window !== "undefined" && "speechSynthesis" in window;
    setSupported({ stt, tts });
    if (tts) {
      const onVoices = () => setVoices(window.speechSynthesis.getVoices());
      window.speechSynthesis.onvoiceschanged = onVoices;
      onVoices();
    }
  }, []);

  const startListening = useCallback(
    (onText: (txt: string, isFinal: boolean) => void) => {
      if (!supported.stt || listening) return;
      // @ts-ignore vendor prefixed
      const SpeechRec: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRec) return;
      const rec: any = new SpeechRec();
      rec.lang = options?.lang || "en-US";
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (evt: any) => {
        const res = evt.results[evt.results.length - 1];
        const transcript = res[0]?.transcript ?? "";
        onText(transcript, res.isFinal);
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
      recognitionRef.current = rec;
      setListening(true);
      rec.start();
    },
    [supported.stt, listening, options?.lang]
  );

  const stopListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {}
    }
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!supported.tts || !text) return;
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = options?.lang || "en-US";
      if (options?.ttsVoice) {
        const pick = voices.find((v) => v.name === options.ttsVoice);
        if (pick) utter.voice = pick;
      }
      window.speechSynthesis.speak(utter);
    },
    [supported.tts, options?.lang, options?.ttsVoice, voices]
  );

  return {
    listening,
    supported,
    voices,
    startListening,
    stopListening,
    speak,
  };
}

