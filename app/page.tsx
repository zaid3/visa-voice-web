'use client';
import { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  useConnectionState,
  useRoomContext,
  VideoConference,
} from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import '@livekit/components-styles';

function Status() {
  const cs = useConnectionState();
  const room = useRoomContext();
  return (
    <div style={{position:'absolute',top:12,left:12,background:'#111',color:'#fff',padding:'8px 12px',borderRadius:8}}>
      <div>Room: <b>{room.name ?? 'consult-1'}</b></div>
      <div>Connection: <b>{ConnectionState[cs]}</b></div>
      <div>Tip: unmute mic to talk to the agent</div>
    </div>
  );
}

export default function Home() {
  const [token, setToken] = useState<string>();
  const room = 'consult-1';

  useEffect(() => {
    const id = 'web-' + Math.random().toString(36).slice(2);
    fetch(`/api/token?room=${room}&identity=${id}`)
      .then(r => r.json())
      .then(d => setToken(d.token))
      .catch(console.error);
  }, []);

  if (!token) return <div style={{padding:20,color:'#fff',background:'#000',height:'100vh'}}>Connecting…</div>;

  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      connect
      audio
      video={false}
      data-lk-theme="default"
      style={{ height: '100vh', background:'#000' }}
    >
      <Status />
      {/* shows remote tiles if any, plus a mute/unmute/mic publish button in ControlBar */}
      <VideoConference />
      <RoomAudioRenderer />
      <ControlBar />
    </LiveKitRoom>
  );
}
