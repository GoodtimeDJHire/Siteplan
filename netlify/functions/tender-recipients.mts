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

export default async (req: Request, _context: Context) => {
  if (req.method !== "GET") return new Response("Method not allowed", { status: 405 });

  try {
    const auth = req.headers.get("authorization") || "";
    const jwt = auth.replace(/^Bearer\s+/i, "").trim();
    if (!jwt) return Response.json({ error: "Sign in to view sent suppliers." }, { status: 401 });

    const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${jwt}` }
    });
    if (!userResponse.ok) return Response.json({ error: "Your SitePlan session has expired." }, { status: 401 });

    const url = new URL(req.url);
    const tenderId = String(url.searchParams.get("tenderId") || "").trim();
    if (!tenderId) return Response.json({ error: "Tender ID is required." }, { status: 400 });

    const tenderRows = await supabaseGet(`tenders?id=eq.${encodeURIComponent(tenderId)}&select=id,title`, jwt);
    const tender = tenderRows?.[0];
    if (!tender) return Response.json({ error: "Tender not found or you do not have access." }, { status: 404 });

    const apiKey = Netlify.env.get("RESEND_API_KEY");
    if (!apiKey) return Response.json({ error: "Email history is not configured." }, { status: 503 });

    const resend = await fetch("https://api.resend.com/emails?limit=100", {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" }
    });
    const payload = await resend.json().catch(() => ({}));
    if (!resend.ok) return Response.json({ error: payload?.message || "Could not load email history." }, { status: 502 });

    const subject = `Tender invitation: ${tender.title}`;
    const emails = (Array.isArray(payload?.data) ? payload.data : []).filter((e: any) => String(e.subject || "") === subject);
    const rows = emails.flatMap((e: any) => {
      const tos = Array.isArray(e.to) ? e.to : (e.to ? [e.to] : []);
      return tos.map((email: string) => ({
        company_name: "Supplier",
        recipient_email: email,
        status: e.last_event || e.status || "sent",
        sent_at: e.created_at || null,
        updated_at: e.created_at || null,
        resend_email_id: e.id || null,
        source: "resend"
      }));
    });

    return Response.json({ ok: true, recipients: rows });
  } catch (error: any) {
    console.error("tender-recipients", error);
    return Response.json({ error: error?.message || "Could not load sent suppliers." }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/tender-recipients"
};
