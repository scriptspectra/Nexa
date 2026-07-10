import { NextResponse } from "next/server";
import crypto from "crypto";

// Normally, we'd use the Convex HTTP actions (http.ts), but since Next.js is our front door
// we can handle it here and call Convex mutations if needed. 
// Or better yet, just forward the raw payload to Convex's HTTP router.
// Actually, if we use Next.js, we need to initialize a ConvexClient.
// For webhooks, Convex HTTP actions are usually much better since they have direct DB access.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // In a real app, verify_token should be checked against the DB or env vars
  const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || "zephyra_meta_token";

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      return new NextResponse(challenge, { status: 200 });
    } else {
      return new NextResponse(null, { status: 403 });
    }
  }
  return new NextResponse(null, { status: 400 });
}

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  // Forward to Convex HTTP endpoint for processing to keep backend logic in Convex
  // Convex HTTP endpoint will be /api/webhooks/meta
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return new NextResponse("Convex URL not configured", { status: 500 });
  }

  // Convert wss://... to https://...
  const httpUrl = convexUrl.replace("wss://", "https://").replace("ws://", "http://");

  const response = await fetch(`${httpUrl}/api/webhooks/meta`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(signature && { "x-hub-signature-256": signature }),
    },
    body: payload,
  });

  return new NextResponse(null, { status: response.status });
}
