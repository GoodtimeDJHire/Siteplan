import type { Context, Config } from "@netlify/functions";

const SUPABASE_URL = "https://qkvkemcqfnbmaktbxddg.supabase.co";
const SUPABASE_KEY = "sb_publishable_tiPl-Y7wvfrpB7RzNzOBVA_CMIGBTwA";

const clean = (v: unknown) => String(v ?? "").replace(/[<>]/g, "").trim();
const esc = (v: unknown) => clean(v).replace(/&/g,"&amp;").replace(/\"/g,"&quot;").replace(/'/g,"&#39;");

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!jwt) return Response.json({ error: "Sign in before emailing suppliers." }, { status: 401 });

    const ur = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${jwt}` }
    });
    if (!ur.ok) return Response.json({ error: "Your SitePlan session has expired. Please sign in again." }, { status: 401 });
    const user = await ur.json();

    const body: any = await req.json().catch(() => ({}));
    const recipients = Array.isArray(body.recipients) ? body.recipients : [];
    if (!recipients.length) return Response.json({ error: "Select at least one approved supplier." }, { status: 400 });
    if (recipients.length > 100) return Response.json({ error: "You can email up to 100 suppliers at once." }, { status: 400 });

    const eventName = clean(body.eventName || "Event");
    const eventDate = clean(body.eventDate || "");
    const location = clean(body.location || "");
    const subject = clean(body.subject || `${eventName} – final event brief`);
    const message = clean(body.message || "Please find the final event brief below. Please reply to confirm you have received this and let us know if anything has changed.");

    const apiKey = Netlify.env.get("RESEND_API_KEY");
    if (!apiKey) return Response.json({ error: "Supplier email sending is not configured." }, { status: 503 });

    const organiserName = clean(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Event organiser");
    const valid = recipients
      .map((r: any) => ({
        email: clean(r.email).toLowerCase(),
        company: clean(r.company || "Supplier"),
        contact: clean(r.contact || ""),
        service: clean(r.service || r.tenderTitle || ""),
        planLink: clean(r.planLink || "")
      }))
      .filter((r: any) => /^\S+@\S+\.\S+$/.test(r.email));

    if (!valid.length) return Response.json({ error: "None of the selected suppliers have a valid email address." }, { status: 400 });

    const emails = valid.map((r: any) => {
      const greeting = r.contact ? `Hi ${r.contact},` : "Hi,";
      const details = [eventDate ? `Date: ${eventDate}` : "", location ? `Location: ${location}` : "", r.service ? `Your service: ${r.service}` : ""].filter(Boolean);
      const planText = r.planLink ? `\n\nEvent site plan / tender reference:\n${r.planLink}` : "";
      const text = `${greeting}\n\n${message}\n\n${eventName}${details.length ? `\n${details.join("\n")}` : ""}${planText}\n\nPlease reply directly to this email if you have any questions or changes.\n\nRegards,\n${organiserName}\nSent via SitePlan`;
      const planHtml = r.planLink ? `<br><br><a href="${esc(r.planLink)}" style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:#1769aa;text-decoration:underline">View event site plan / tender reference</a>` : "";
      const detailsHtml = details.length ? `<br><br>${details.map((x: string) => esc(x)).join("<br>")}` : "";
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="X-UA-Compatible" content="IE=edge"></head><body style="margin:0;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#202124"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#ffffff" style="background-color:#ffffff;padding-top:24px;padding-right:16px;padding-bottom:24px;padding-left:16px"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin-left:auto;margin-right:auto"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:#202124">${esc(greeting)}<br><br>${esc(message).replace(/\n/g,"<br>")}<br><br><strong style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:#202124">${esc(eventName)}</strong>${detailsHtml}${planHtml}<br><br>Please reply directly to this email if you have any questions or changes.<br><br>Regards,<br>${esc(organiserName)}<br><span style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#6b7280">Sent via SitePlan</span></td></tr></table></td></tr></table></body></html>`;
      return {
        from: "SitePlan <tenders@goodtimedjhire.co.nz>",
        to: [r.email],
        subject,
        text,
        html,
        tags: [{ name: "siteplan_event_brief", value: "approved_supplier" }],
        ...(user.email ? { reply_to: [user.email] } : {})
      };
    });

    const sr = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(emails)
    });
    const sd = await sr.json().catch(() => ({}));
    if (!sr.ok) return Response.json({ error: sd?.message || "Event brief emails could not be sent." }, { status: 502 });

    return Response.json({ ok: true, sent: valid.length, recipients: valid.map((r: any) => r.email) });
  } catch (error: any) {
    console.error("send-event-brief", error);
    return Response.json({ error: error?.message || "Event brief emails could not be sent." }, { status: 500 });
  }
};

export const config: Config = { path: "/api/send-event-brief" };
