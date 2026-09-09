import type { Context, Config } from "@netlify/functions";

const SUPABASE_URL = "https://qkvkemcqfnbmaktbxddg.supabase.co";
const SUPABASE_KEY = "sb_publishable_tiPl-Y7wvfrpB7RzNzOBVA_CMIGBTwA";

const aliases: Record<string, string[]> = {
  "Catering / Bar": ["Food Vendor", "Bars & Beverage"],
  "Generators": ["Power & Generators"],
  "Toilets": ["Toilets & Sanitation"],
  "Marquees": ["Marquees & Structures"],
  "Sound & Lighting": ["Production / AV"],
  "Staging": ["Production / AV"],
  "Custom": ["Other"]
};

const regionAliases: Record<string, string> = {
  "New Plymouth": "Taranaki",
  "Manawatu": "Manawatu-Whanganui",
  "Kapiti Coast": "Wellington",
  "Wairarapa": "Wellington"
};

function normalizeRegion(value: string | null | undefined) {
  const v = String(value || "");
  return regionAliases[v] || v;
}

function categoryMatches(supplier: any, tender: any) {
  const wanted = aliases[tender.category] || [tender.category];
  return (supplier.categories || []).some((c: string) => wanted.includes(c));
}

function regionMatches(supplier: any, tender: any) {
  const wanted = normalizeRegion(tender.region || "Wellington");
  const covered = (supplier.regions || []).map(normalizeRegion);
  return covered.includes("Nationwide") || covered.includes(wanted);
}

function score(supplier: any, tender: any) {
  let n = 0;
  if (categoryMatches(supplier, tender)) n += 60;
  if (regionMatches(supplier, tender)) n += 25;
  if (supplier.insurance === "Yes") n += 5;
  if (!Number(supplier.minimum) || !Number(tender.estimated_value) || Number(tender.estimated_value) >= Number(supplier.minimum)) n += 5;
  if (!Number(supplier.event_size) || !Number(tender.attendance) || Number(tender.attendance) <= Number(supplier.event_size)) n += 5;
  return n;
}

async function supabaseGet(path: string, jwt: string) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${jwt}`,
      Accept: "application/json"
    }
  });
  if (!response.ok) throw new Error(`Database request failed (${response.status})`);
  return response.json();
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const auth = req.headers.get("authorization") || "";
    const jwt = auth.replace(/^Bearer\s+/i, "").trim();
    if (!jwt) return Response.json({ error: "Sign in before sending a tender." }, { status: 401 });

    const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${jwt}` }
    });
    if (!userResponse.ok) return Response.json({ error: "Your SitePlan session has expired. Please sign in again." }, { status: 401 });
    const user = await userResponse.json();

    const body = await req.json().catch(() => ({}));
    const tenderId = String(body.tenderId || "").trim();
    const selectedSupplierIds = Array.isArray(body.supplierIds)
      ? body.supplierIds.map((id: any) => String(id || "").trim()).filter(Boolean)
      : [];
    if (!tenderId) return Response.json({ error: "Tender ID is required." }, { status: 400 });
    if (!selectedSupplierIds.length) return Response.json({ error: "Select at least one supplier to receive this tender." }, { status: 400 });

    const tenderRows = await supabaseGet(`tenders?id=eq.${encodeURIComponent(tenderId)}&select=*`, jwt);
    const tender = tenderRows?.[0];
    if (!tender) return Response.json({ error: "Tender not found or you do not have access." }, { status: 404 });
    if (!["published", "draft"].includes(String(tender.status || ""))) {
      return Response.json({ error: "Only draft or open tenders can be emailed." }, { status: 400 });
    }

    const suppliers = await supabaseGet("suppliers?select=*&active=eq.true", jwt);
    const matched = (suppliers || []).filter((s: any) => {
      if (!s.email || s.notifications === "off") return false;
      if (!categoryMatches(s, tender) || !regionMatches(s, tender)) return false;
      const match = score(s, tender);
      return s.notifications === "high" ? match >= 85 : match >= 60;
    });

    const selected = new Set(selectedSupplierIds);
    const recipients = matched.filter((s: any) => selected.has(String(s.id)));
    if (!recipients.length) return Response.json({ error: "None of the selected suppliers are eligible matching recipients with an email address." }, { status: 400 });

    let eventName = "your event";
    if (tender.event_id) {
      const events = await supabaseGet(`events?id=eq.${encodeURIComponent(tender.event_id)}&select=name`, jwt);
      if (events?.[0]?.name) eventName = events[0].name;
    }

    const apiKey = Netlify.env.get("RESEND_API_KEY");
    if (!apiKey) return Response.json({ error: "Tender email sending is not configured yet." }, { status: 503 });

    const origin = new URL(req.url).origin;
    const link = `${origin}/#tender=${encodeURIComponent(tender.public_token)}`;
    const due = tender.due_at ? new Date(tender.due_at).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric", timeZone: "Pacific/Auckland" }) : "Not specified";
    const subject = `Tender invitation: ${tender.title}`;
    const replyTo = user.email ? [user.email] : undefined;

    const emails = recipients.map((s: any) => {
      const greeting = s.contact_name ? `Hi ${s.contact_name},` : "Hi,";
      const text = `${greeting}\n\nYou're invited to submit a quote for ${tender.title} for ${eventName}.\n\nCategory: ${tender.category || "Supplier"}\nRegion: ${tender.region || "Not specified"}\nQuote due: ${due}\n\nView the tender and submit your private quote here:\n${link}\n\nReplies to this email go directly to the event organiser.\n\nThanks,\nSitePlan`;
      const html = `<!doctype html><html><body style="margin:0;background:#f3f5f1;font-family:Arial,Helvetica,sans-serif;color:#151719"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:24px"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #dfe3dc;border-radius:14px"><tr><td style="padding:28px"><div style="font-size:12px;font-weight:700;letter-spacing:.08em;color:#6c746a">SITEPLAN · PRIVATE TENDER</div><h1 style="font-size:26px;line-height:1.15;margin:10px 0 16px;color:#151719">${String(tender.title || "Tender").replace(/[<>&]/g, "")}</h1><p style="font-size:15px;line-height:1.6;color:#4e5850">${greeting}</p><p style="font-size:15px;line-height:1.6;color:#4e5850">You're invited to submit a quote for <strong>${String(eventName).replace(/[<>&]/g, "")}</strong>.</p><table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0"><tr><td style="padding:8px 0;font-size:14px;color:#6c746a">Category</td><td style="padding:8px 0;font-size:14px;color:#151719;text-align:right;font-weight:700">${String(tender.category || "Supplier").replace(/[<>&]/g, "")}</td></tr><tr><td style="padding:8px 0;font-size:14px;color:#6c746a">Region</td><td style="padding:8px 0;font-size:14px;color:#151719;text-align:right;font-weight:700">${String(tender.region || "Not specified").replace(/[<>&]/g, "")}</td></tr><tr><td style="padding:8px 0;font-size:14px;color:#6c746a">Quote due</td><td style="padding:8px 0;font-size:14px;color:#151719;text-align:right;font-weight:700">${due}</td></tr></table><table cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#a8ff35" style="background:#a8ff35;border-radius:10px"><a href="${link}" style="display:inline-block;padding:13px 18px;color:#0b0d10;text-decoration:none;font-size:14px;font-weight:700">View tender & submit quote</a></td></tr></table><p style="font-size:12px;line-height:1.5;color:#7b847c;margin-top:24px">Your quote is private and is only visible to the event organiser. Reply to this email to contact them directly.</p></td></tr></table></td></tr></table></body></html>`;
      return {
        from: "SitePlan <tenders@goodtimedjhire.co.nz>",
        to: [s.email],
        subject,
        text,
        html,
        ...(replyTo ? { reply_to: replyTo } : {})
      };
    });

    const sendResponse = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(emails)
    });
    const sendData = await sendResponse.json().catch(() => ({}));
    if (!sendResponse.ok) {
      console.error("Resend error", sendData);
      return Response.json({ error: sendData?.message || "Email delivery request failed." }, { status: 502 });
    }

    return Response.json({
      ok: true,
      sent: recipients.length,
      recipients: recipients.map((s: any) => ({ company: s.company_name, email: s.email }))
    });
  } catch (error: any) {
    console.error("send-tender", error);
    return Response.json({ error: error?.message || "Tender email could not be sent." }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/send-tender"
};
