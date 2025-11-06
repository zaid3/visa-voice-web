import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const room = searchParams.get("room") || "consult";
  const identity = searchParams.get("identity") || `u-${Math.random().toString(36).slice(2)}`;
  const at = new AccessToken(process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!, { identity, ttl: "10m" });
  at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true });
  return NextResponse.json({ token: await at.toJwt() });
}
