'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  LiveKitRoom, RoomAudioRenderer, ControlBar,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';

const ROOM_NAME = 'consult-1';

type CallState = 'idle' | 'connecting' | 'in-call';

export default function Home() {
  const [state, setState] = useState<CallState>('idle');
  const [token, setToken] = useState<string>();
  const [error, setError] = useState<string>('');

  const start = async () => {
    try {
      setError('');
      setState('connecting');
      const id = 'web-' + Math.random().toString(36).slice(2);
      const res = await fetch(`/api/token?room=${ROOM_NAME}&identity=${id}`);
      const data = await res.json();
      setToken(data.token);
      setState('in-call');
    } catch (e:any) {
      setError(e?.message || String(e));
      setState('idle');
    }
  };

  if (state !== 'in-call') {
    return (
      <div style={{minHeight:'100vh',display:'grid',placeItems:'center',fontFamily:'ui-sans-serif'}}>
        <div style={{textAlign:'center',maxWidth:520}}>
          <div style={{fontSize:18,opacity:.7,marginBottom:8}}>Chat live with your voice AI agent</div>
          <button onClick={start}
            style={{background:'#0d5bff',color:'#fff',border:'none',borderRadius:999,
                    padding:'14px 26px',fontWeight:600,letterSpacing:1}}>
            START CALL
          </button>
          {state==='connecting' && <div style={{marginTop:12,opacity:.7}}>Connecting…</div>}
          {error && <div style={{marginTop:12,color:'#c00'}}>{error}</div>}
          <div style={{marginTop:18,fontSize:12,opacity:.6}}>Built with LiveKit Agents</div>
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
      style={{ height: '100vh', background:'#0b0b0b', color:'#fff' }}
    >
      <Layout />
      <RoomAudioRenderer />
      <ControlBar controls={{ screenShare: true, camera: false }} />
    </LiveKitRoom>
  );
}

/** ---------- Right panel: “Agent Configuration + Transcript” ---------- **/
import { useRoomContext, useTracks, useDataChannel } from '@livekit/components-react';

function Layout() {
  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:16,height:'100%'}}>
      <WavePanel />
      <RightPanel />
    </div>
  );
}

function WavePanel() {
  // simple placeholder “wave” – you can replace with a canvas waveform later
  return (
    <div style={{display:'grid',placeItems:'center',borderRadius:16,background:'#111',margin:12}}>
      <div style={{width:140,height:60,display:'flex',gap:8}}>
        {Array.from({length:5}).map((_,i)=>(
          <div key={i} style={{
            width:18,borderRadius:9,background:'#fff',opacity:.9,
            animation:`pulse ${0.9 + i*0.08}s infinite ease-in-out`,
          }}/>
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
  const room = useRoomContext();
  const config = useMemo(() => ({
    VAD: 'SILERO',
    STT: 'GROQ (Whisper-large-v3-turbo or Deepgram)',
    LLM: 'GROQ ' + (process.env.NEXT_PUBLIC_MODEL ?? 'llama3-70b-8192'),
    TTS: 'ElevenLabs / OpenAI Realtime / LiveKit TTS',
    TURN_DETECTION: 'TRUE',
    NOISE_CANCELLATION: 'TRUE',
  }), []);

  const [transcript, setTranscript] = useState<string[]>([]);
  // Listen for incoming data messages for demo transcript (your agent can send JSON on data channel)
  useDataChannel({
    onData: ({ payload }) => {
      try {
        const text = new TextDecoder().decode(payload);
        setTranscript(prev => [...prev, text].slice(-100));
      } catch {}
    }
  });

  return (
    <div style={{padding:'16px 16px 0',borderLeft:'1px solid #222',background:'#0c0c0c'}}>
      <h3 style={{margin:'8px 0 12px 0'}}>AGENT CONFIGURATION</h3>
      <dl style={{fontSize:13,opacity:.9,display:'grid',gridTemplateColumns:'120px 1fr',rowGap:8}}>
        {Object.entries(config).map(([k,v])=>(
          <><dt style={{opacity:.6}}>{k}</dt><dd>{String(v)}</dd></>
        ))}
      </dl>
      <h3 style={{margin:'18px 0 12px 0'}}>TRANSCRIPTION</h3>
      <div style={{height:'60vh',overflow:'auto',background:'#0f0f0f',borderRadius:8,padding:12,fontFamily:'ui-monospace',fontSize:12}}>
        {transcript.length===0 ? <div style={{opacity:.6}}>Speak to begin…</div> :
          transcript.map((t,i)=>(<div key={i} style={{whiteSpace:'pre-wrap',marginBottom:8}}>{t}</div>))}
      </div>
    </div>
  );
}
