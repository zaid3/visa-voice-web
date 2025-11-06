'use client';
import { useEffect, useState } from 'react';
import {
  LiveKitRoom, RoomAudioRenderer, ControlBar, VideoConference,
} from '@livekit/components-react';
import '@livekit/components-styles';

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
      <VideoConference />
      <RoomAudioRenderer />
      <ControlBar />
    </LiveKitRoom>
  );
}
