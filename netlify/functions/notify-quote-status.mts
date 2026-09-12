import type { Context, Config } from "@netlify/functions";

const SUPABASE_URL = "https://qkvkemcqfnbmaktbxddg.supabase.co";
const SUPABASE_KEY = "sb_publishable_tiPl-Y7wvfrpB7RzNzOBVA_CMIGBTwA";
const allowed = new Set(["awarded", "shortlisted", "declined"]);
const clean = (v: unknown, max = 500) => String(v ?? "").trim().slice(0, max);
const escapeHtml = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (m) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m] || m));

async function timedFetch(url: string, init: RequestInit = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...init, signal: controller.signal }); }
  finally { clearTimeout(timer); }
}

async function dbGet(path: string, jwt: string) {
  const response = await timedFetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${jwt}`, Accept: "application/json" } });
  if (!response.ok) throw new Error(`Database lookup failed (${response.status})`);
  return response.json();
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  try {
    const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!jwt) return Response.json({ error: "Sign in before notifying a supplier." }, { status: 401 });
    const userResponse = await timedFetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${jwt}` } });
    if (!userResponse.ok) return Response.json({ error: "Your SitePlan session has expired. Please sign in again." }, { status: 401 });
    const user = await userResponse.json();

    const body = await req.json().catch(() => ({}));
    const tenderId = clean(body.tenderId, 80), quoteId = clean(body.quoteId, 80), status = clean(body.status, 20).toLowerCase();
    if (!/^[0-9a-f-]{36}$/i.test(tenderId) || !/^[0-9a-f-]{36}$/i.test(quoteId) || !allowed.has(status)) return Response.json({ error: "Invalid quote notification request." }, { status: 400 });

    const submissions = await dbGet(`tender_submissions?id=eq.${encodeURIComponent(quoteId)}&tender_id=eq.${encodeURIComponent(tenderId)}&select=id,company_name,contact_name,email,status`, jwt);
    const quote = submissions?.[0];
    if (!quote) return Response.json({ error: "Quote not found or you do not have access." }, { status: 404 });
    if (String(quote.status) !== status) return Response.json({ error: "The quote status has not finished updating yet." }, { status: 409 });
    if (!quote.email) return Response.json({ error: "This supplier has no email address." }, { status: 400 });

    const tenders = await dbGet(`tenders?id=eq.${encodeURIComponent(tenderId)}&select=id,title,event_id`, jwt);
    const tender = tenders?.[0];
    if (!tender) return Response.json({ error: "Tender not found or you do not have access." }, { status: 404 });
    let eventName = "Event";
    if (tender.event_id) { const events = await dbGet(`events?id=eq.${encodeURIComponent(tender.event_id)}&select=name`, jwt); eventName = clean(events?.[0]?.name, 180) || eventName; }

    const wording: Record<string, { label: string; heading: string; message: string; color: string }> = {
      awarded: { label: "QUOTE ACCEPTED", heading: "Your quote has been accepted", message: "The event organiser has accepted your quote. They will contact you with the next steps and final arrangements.", color: "#78b82a" },
      shortlisted: { label: "QUOTE SHORTLISTED", heading: "Your quote has been shortlisted", message: "The event organiser has shortlisted your quote and may contact you for further information before making a final decision.", color: "#477fb8" },
      declined: { label: "QUOTE UPDATE", heading: "Your quote was not selected", message: "Thank you for taking the time to submit a quote. The event organiser has decided not to proceed with your quote for this tender.", color: "#b84a58" }
    };
    const copy = wording[status];
    const apiKey = Netlify.env.get("RESEND_API_KEY");
    if (!apiKey) return Response.json({ error: "Supplier status emails are not configured." }, { status: 503 });
    const supplierName = clean(quote.contact_name, 160) || clean(quote.company_name, 160) || "Supplier";
    const subject = `${copy.heading}: ${clean(tender.title, 180)}`;
    const text = `Hi ${supplierName},\n\n${copy.message}\n\nTender: ${clean(tender.title, 180)}\nEvent: ${eventName}\n\nRegards,\nSitePlan`;
    const send = await timedFetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "SitePlan <tenders@goodtimedjhire.co.nz>",
        to: [quote.email],
        subject,
        text,
        html: `<!doctype html><html><body style="margin:0;background:#f3f5f1;font-family:Arial,Helvetica,sans-serif;color:#151719"><table width="100%"><tr><td style="padding:24px"><table width="100%" style="max-width:620px;margin:auto;background:#fff;border:1px solid #dfe3dc;border-radius:14px"><tr><td style="padding:28px"><div style="font-size:12px;font-weight:700;letter-spacing:.08em;color:${copy.color}">SITEPLAN · ${copy.label}</div><h1 style="font-size:24px;margin:10px 0 16px">${escapeHtml(copy.heading)}</h1><p>Hi ${escapeHtml(supplierName)},</p><p style="line-height:1.6">${escapeHtml(copy.message)}</p><table width="100%" style="margin:22px 0;background:#f6f7f4;border-radius:10px"><tr><td style="padding:14px"><strong>${escapeHtml(clean(tender.title, 180))}</strong><br><span style="color:#687168">${escapeHtml(eventName)}</span></td></tr></table><p>Regards,<br>SitePlan</p></td></tr></table></td></tr></table></body></html>`,
        ...(user.email ? { reply_to: [user.email] } : {})
      })
    }, 20000);
    const result = await send.json().catch(() => ({}));
    if (!send.ok) return Response.json({ error: result?.message || "Supplier status email failed." }, { status: 502 });
    return Response.json({ ok: true, emailId: result?.id || null });
  } catch (error: any) {
    console.error("notify-quote-status", error);
    return Response.json({ error: error?.message || "Supplier status email failed." }, { status: 500 });
  }
};

export const config: Config = { path: "/api/notify-quote-status" };
