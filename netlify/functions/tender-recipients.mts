import type { Context, Config } from "@netlify/functions";

const SUPABASE_URL = "https://qkvkemcqfnbmaktbxddg.supabase.co";
const SUPABASE_KEY = "sb_publishable_tiPl-Y7wvfrpB7RzNzOBVA_CMIGBTwA";

async function supabaseGet(path: string, jwt: string) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${jwt}`, Accept: "application/json" }
  });
  if (!response.ok) throw new Error(`Database request failed (${response.status})`);
  return response.json();
}

function subjectMatches(subject: string, title: string) {
  const s = String(subject || "").trim();
  const t = String(title || "").trim();
  if (!s || !t) return false;
  return s === `Tender invitation: ${t}` || s.endsWith(` – ${t}`) || s.endsWith(` - ${t}`);
}

function newestPerEmail(rows: any[]) {
  const map = new Map<string, any>();
  for (const row of rows || []) {
    const key = String(row.recipient_email || "").trim().toLowerCase();
    if (!key) continue;
    const old = map.get(key);
    const a = Date.parse(row.updated_at || row.sent_at || "") || 0;
    const b = Date.parse(old?.updated_at || old?.sent_at || "") || 0;
    if (!old || a >= b) map.set(key, row);
  }
  return [...map.values()];
}

async function enrichExactStatuses(rows: any[], apiKey: string) {
  return Promise.all((rows || []).map(async row => {
    if (!row.resend_email_id) return row;
    try {
      const r = await fetch(`https://api.resend.com/emails/${encodeURIComponent(row.resend_email_id)}`, {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" }
      });
      if (!r.ok) return row;
      const e: any = await r.json();
      return {
        ...row,
        status: e.last_event || e.status || row.status || "sent",
        updated_at: e.updated_at || e.created_at || row.updated_at || row.sent_at,
        source: "database+resend"
      };
    } catch {
      return row;
    }
  }));
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "GET") return new Response("Method not allowed", { status: 405 });
  try {
    const auth = req.headers.get("authorization") || "";
    const jwt = auth.replace(/^Bearer\s+/i, "").trim();
    if (!jwt) return Response.json({ error: "Sign in to view sent suppliers." }, { status: 401 });
    const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${jwt}` } });
    if (!userResponse.ok) return Response.json({ error: "Your SitePlan session has expired." }, { status: 401 });

    const url = new URL(req.url);
    const tenderId = String(url.searchParams.get("tenderId") || "").trim();
    if (!tenderId) return Response.json({ error: "Tender ID is required." }, { status: 400 });
    const tenderRows = await supabaseGet(`tenders?id=eq.${encodeURIComponent(tenderId)}&select=id,title`, jwt);
    const tender = tenderRows?.[0];
    if (!tender) return Response.json({ error: "Tender not found or you do not have access." }, { status: 404 });

    const apiKey = Netlify.env.get("RESEND_API_KEY");

    // Primary source: SitePlan's own durable send records. These are written at send time
    // and survive browser changes, subject changes and Resend history pagination.
    let tracked: any[] = [];
    try {
      tracked = await supabaseGet(`tender_email_deliveries?tender_id=eq.${encodeURIComponent(tenderId)}&select=*&order=sent_at.desc`, jwt);
    } catch (e) {
      console.warn("Could not read tender delivery table", e);
    }

    if (tracked?.length) {
      let rows = newestPerEmail(tracked.map((r: any) => ({ ...r, source: "database" })));
      if (apiKey) rows = newestPerEmail(await enrichExactStatuses(rows, apiKey));
      return Response.json({ ok: true, recipients: rows, source: "database" });
    }

    // Legacy fallback for tenders sent before durable tracking existed.
    if (!apiKey) return Response.json({ ok: true, recipients: [], source: "database" });
    const found: any[] = [];
    let after = "";
    for (let page = 0; page < 8; page++) {
      const endpoint = `https://api.resend.com/emails?limit=100${after ? `&after=${encodeURIComponent(after)}` : ""}`;
      const resend = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" } });
      const payload = await resend.json().catch(() => ({}));
      if (!resend.ok) return Response.json({ error: payload?.message || "Could not load email history." }, { status: 502 });
      const emails = Array.isArray(payload?.data) ? payload.data : [];
      found.push(...emails.filter((e: any) => subjectMatches(String(e.subject || ""), String(tender.title || ""))));
      if (!payload?.has_more || !emails.length) break;
      after = String(emails[emails.length - 1]?.id || "");
      if (!after) break;
    }

    const rows = newestPerEmail(found.flatMap((e: any) => {
      const tos = Array.isArray(e.to) ? e.to : (e.to ? [e.to] : []);
      return tos.map((email: string) => ({
        company_name: "Supplier",
        recipient_email: email,
        status: e.last_event || e.status || "sent",
        sent_at: e.created_at || null,
        updated_at: e.updated_at || e.created_at || null,
        resend_email_id: e.id || null,
        source: "resend-legacy"
      }));
    }));
    return Response.json({ ok: true, recipients: rows, source: "resend-legacy" });
  } catch (error: any) {
    console.error("tender-recipients", error);
    return Response.json({ error: error?.message || "Could not load sent suppliers." }, { status: 500 });
  }
};

export const config: Config = { path: "/api/tender-recipients" };
