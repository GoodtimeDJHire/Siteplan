import type { Context, Config } from "@netlify/functions";
import { createHmac, timingSafeEqual } from "node:crypto";

const SUPABASE_URL = "https://qkvkemcqfnbmaktbxddg.supabase.co";
const SUPABASE_KEY = "sb_publishable_tiPl-Y7wvfrpB7RzNzOBVA_CMIGBTwA";

function verifySvix(payload: string, id: string, timestamp: string, signature: string, secret: string) {
  const rawSecret = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const key = Buffer.from(rawSecret, "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${payload}`).digest("base64");
  const candidates = signature.split(" ").map(x => x.trim()).filter(Boolean).map(x => x.includes(",") ? x.split(",").slice(1).join(",") : x);
  return candidates.some(candidate => {
    try {
      const a = Buffer.from(candidate);
      const b = Buffer.from(expected);
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });
}

function statusFromType(type: string) {
  const map: Record<string, string> = {
    "email.sent": "sent",
    "email.delivered": "delivered",
    "email.delivery_delayed": "delivery_delayed",
    "email.bounced": "bounced",
    "email.failed": "failed",
    "email.suppressed": "suppressed",
    "email.complained": "complained"
  };
  return map[type] || "";
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const secret = Netlify.env.get("RESEND_WEBHOOK_SECRET");
  if (!secret) return new Response("Webhook not configured", { status: 503 });

  const payload = await req.text();
  const svixId = req.headers.get("svix-id") || "";
  const svixTimestamp = req.headers.get("svix-timestamp") || "";
  const svixSignature = req.headers.get("svix-signature") || "";
  if (!svixId || !svixTimestamp || !svixSignature || !verifySvix(payload, svixId, svixTimestamp, svixSignature, secret)) {
    return new Response("Invalid signature", { status: 400 });
  }

  let event: any;
  try { event = JSON.parse(payload); } catch { return new Response("Invalid JSON", { status: 400 }); }

  const status = statusFromType(String(event?.type || ""));
  const emailId = String(event?.data?.email_id || "").trim();
  if (!status || !emailId) return Response.json({ ok: true, ignored: true });

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/record_tender_email_event`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      p_resend_email_id: emailId,
      p_status: status,
      p_message_id: event?.data?.message_id || null,
      p_event: event
    })
  });
  if (!response.ok) {
    console.error("Delivery event database update failed", response.status, await response.text());
    return new Response("Database update failed", { status: 500 });
  }

  return Response.json({ ok: true });
};

export const config: Config = {
  path: "/api/resend-webhook"
};
