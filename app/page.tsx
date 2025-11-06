'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  useDataChannel,
  useRoomContext,
} from '@livekit/components-react';
import '@livekit/components-styles';

const ROOM_NAME = 'consult-1';

type CallState = 'idle' | 'connecting' | 'in-call';
type Lang = 'en' | 'hi' | 'bn';

export default function Home() {
  const [state, setState] = useState<CallState>('idle');
  const [token, setToken] = useState<string>();
  const [error, setError] = useState<string>('');
  const [lang, setLang] = useState<Lang>('en'); // default English

  const start = async () => {
    try {
      setError('');
      setState('connecting');
      const id = `web-${Math.random().toString(36).slice(2)}`;
      const res = await fetch(`/api/token?room=${ROOM_NAME}&identity=${id}`);
      if (!res.ok) throw new Error(`Token HTTP ${res.status}`);
      const data = await res.json();
      if (!data?.token) throw new Error('No token returned');
      setToken(data.token);
      setState('in-call');
    } catch (e: any) {
      setError(e?.message || String(e));
      setState('idle');
    }
  };

  if (state !== 'in-call') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'ui-sans-serif' }}>
        <div style={{ textAlign: 'center', maxWidth: 600 }}>
          <div style={{ fontSize: 20, opacity: .85, marginBottom: 16 }}>
            {/* headline (custom text) */}
            Chat live with your AI Immigrantion Agent
          </div>

          {/* Language selector */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ marginRight: 8, opacity:.7 }}>Language:</label>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              style={{ padding: '8px 12px', borderRadius: 8 }}
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="bn">Bengali</option>
            </select>
          </div>

          <button
            onClick={start}
            style={{
              background: '#0d5bff', color: '#fff', border: 'none',
              borderRadius: 999, padding: '14px 26px', fontWeight: 600, letterSpacing: 1
            }}>
            START CALL
          </button>

          {state === 'connecting' && <div style={{ marginTop: 12, opacity: .7 }}>Connecting…</div>}
          {error && <div style={{ marginTop: 12, color: '#c00' }}>{error}</div>}

          <div style={{ marginTop: 18, fontSize: 12, opacity: .6 }}>
            Powered by VS-AI
          </div>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token!}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      connect
      audio
      video={false}
      data-lk-theme="default"
      style={{ height: '100vh', background: '#0b0b0b', color: '#fff' }}
    >
      {/* Send language to agent when connected / changed */}
      <LangSender lang={lang} />

      <Layout />
      <RoomAudioRenderer />
      <ControlBar controls={{ screenShare: true, camera: false }} />
    </LiveKitRoom>
  );
}

/* ------------------- Send selected language to agent ------------------- */

function LangSender({ lang }: { lang: 'en' | 'hi' | 'bn' }) {
  const room = useRoomContext();
  useEffect(() => {
    if (!room) return;
    // small delay to ensure data channel is ready
    const t = setTimeout(() => {
      try {
        room.localParticipant.publishData(
          new TextEncoder().encode(lang),
          { topic: 'lang' }
        );
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [room, lang]);
  return null;
}

/* ------------------- Layout + Panels ------------------- */

function Layout() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, height: '100%' }}>
      <WavePanel />
      <RightPanel />
    </div>
  );
}

function WavePanel() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', borderRadius: 16, background: '#111', margin: 12 }}>
      <div style={{ width: 140, height: 60, display: 'flex', gap: 8 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 18, borderRadius: 9, background: '#fff', opacity: .9,
              animation: `pulse ${0.9 + i * 0.08}s infinite ease-in-out`,
            }}
          />
        ))}
      </div>
      <style jsx global>{`
        @keyframes pulse {
          0%,100% { height:10px; opacity:.5 }
          50% { height:60px; opacity:1 }
        }
      `}</style>
    </div>
  );
}

function RightPanel() {
  const config = useMemo(() => ({
    DOMAIN: 'UK Immigration only',
    VAD: 'SILERO',
    STT: 'GROQ / Deepgram',
    LLM: 'GROQ ' + (process.env.NEXT_PUBLIC_MODEL ?? 'llama3-70b-8192'),
    TTS: 'ElevenLabs / OpenAI Realtime / LiveKit TTS',
    TURN_DETECTION: 'TRUE',
    NOISE_CANCELLATION: 'TRUE',
  }), []);

  const [transcript, setTranscript] = useState<string[]>([]);

  // Listen for transcript messages sent on the "transcript" topic
  useDataChannel('transcript', (msg) => {
    try {
      const text = new TextDecoder().decode(msg.payload);
      setTranscript((prev) => [...prev, text].slice(-100));
    } catch { /* no-op */ }
  });

  return (
    <div style={{ padding: '16px 16px 0', borderLeft: '1px solid #222', background: '#0c0c0c' }}>
      <h3 style={{ margin: '8px 0 12px 0' }}>AGENT CONFIGURATION</h3>
      <dl style={{ fontSize: 13, opacity: .9, display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 8 }}>
        {Object.entries(config).map(([k, v]) => (
          <div key={k} style={{ display: 'contents' }}>
            <dt style={{ opacity: .6 }}>{k}</dt><dd>{String(v)}</dd>
          </div>
        ))}
      </dl>

      <h3 style={{ margin: '18px 0 12px 0' }}>TRANSCRIPTION</h3>
      <div
        style={{
          height: '60vh', overflow: 'auto', background: '#0f0f0f',
          borderRadius: 8, padding: 12, fontFamily: 'ui-monospace', fontSize: 12
        }}
      >
        {transcript.length === 0
          ? <div style={{ opacity: .6 }}>Speak to begin…</div>
          : transcript.map((t, i) => (
            <div key={i} style={{ whiteSpace: 'pre-wrap', marginBottom: 8 }}>{t}</div>
          ))
        }
      </div>
    </div>
  );
}
