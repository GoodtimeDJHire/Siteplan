import type { Context, Config } from "@netlify/functions";

const SUPABASE_URL = "https://qkvkemcqfnbmaktbxddg.supabase.co";
const SUPABASE_KEY = "sb_publishable_tiPl-Y7wvfrpB7RzNzOBVA_CMIGBTwA";

function clean(v: unknown, max = 500) {
  return String(v ?? "").trim().slice(0, max);
}
function escapeHtml(v: unknown) {
  return String(v ?? "").replace(/[&<>"']/g, (m) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m] || m));
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const body = await req.json().catch(() => ({}));
    const token = clean(body.token, 80);
    if (!/^[0-9a-f-]{36}$/i.test(token)) return Response.json({ error: "Invalid tender token." }, { status: 400 });

    const targetResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_tender_notification_target`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ p_token: token })
    });
    const targetData = await targetResponse.json().catch(() => ([]));
    if (!targetResponse.ok) return Response.json({ error: "Tender notification lookup is not configured." }, { status: 503 });
    const target = Array.isArray(targetData) ? targetData[0] : targetData;
    if (!target?.organizer_email) return Response.json({ error: "No organiser email is configured for this tender." }, { status: 404 });

    const apiKey = Netlify.env.get("RESEND_API_KEY");
    if (!apiKey) return Response.json({ error: "Quote email notifications are not configured." }, { status: 503 });

    const company = clean(body.company, 160) || "A supplier";
    const contact = clean(body.contact, 160);
    const supplierEmail = clean(body.email, 254);
    const net = Number(body.net) || 0;
    const gst = Number(body.gst) || 0;
    const total = Number(body.total) || 0;
    const inclusions = clean(body.inclusions, 1200);
    const notes = clean(body.notes, 1200);
    const requestedAttachmentUrl = clean(body.attachmentUrl, 2200);
    const attachmentName = clean(body.attachmentName, 240);
    const signedPrefix = `${SUPABASE_URL}/storage/v1/object/sign/tender-files/`;
    const attachmentUrl = requestedAttachmentUrl.startsWith(signedPrefix) ? requestedAttachmentUrl : "";
    const attachmentText = attachmentUrl ? `\n\nAttachment: ${attachmentName || "Supplier quote"}\n${attachmentUrl}\nThis secure link expires after 7 days.` : "";
    const money = (n: number) => new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD" }).format(n);
    const dashboard = new URL(req.url).origin;
    const subject = `New quote: ${target.tender_title || "SitePlan tender"} — ${company}`;
    const text = `A new supplier quote has been submitted in SitePlan.\n\nTender: ${target.tender_title || "Tender"}\nEvent: ${target.event_name || "Event"}\nSupplier: ${company}\nContact: ${contact || "Not supplied"}\nEmail: ${supplierEmail || "Not supplied"}\nNet: ${money(net)}\nGST: ${money(gst)}\nTotal: ${money(total)}\n\nIncludes: ${inclusions || "Not supplied"}\nNotes: ${notes || "Not supplied"}${attachmentText}\n\nOpen SitePlan to review the quote:\n${dashboard}`;

    const send = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "SitePlan <tenders@goodtimedjhire.co.nz>",
        to: [target.organizer_email],
        subject,
        text,
        html: `<!doctype html><html><body style="margin:0;background:#f3f5f1;font-family:Arial,Helvetica,sans-serif;color:#151719"><table width="100%"><tr><td style="padding:24px"><table width="100%" style="max-width:620px;margin:auto;background:#fff;border:1px solid #dfe3dc;border-radius:14px"><tr><td style="padding:28px"><div style="font-size:12px;font-weight:700;letter-spacing:.08em;color:#6c746a">SITEPLAN · NEW QUOTE</div><h1 style="font-size:24px;margin:10px 0 8px">${escapeHtml(clean(target.tender_title, 180))}</h1><p style="color:#4e5850;margin:0 0 20px">${escapeHtml(clean(target.event_name, 180))}</p><p><strong>${escapeHtml(company)}</strong>${contact ? ` · ${escapeHtml(contact)}` : ""}<br>${escapeHtml(supplierEmail)}</p><table width="100%" style="margin:18px 0"><tr><td style="padding:7px 0;color:#6c746a">Net</td><td style="text-align:right;font-weight:700">${money(net)}</td></tr><tr><td style="padding:7px 0;color:#6c746a">GST</td><td style="text-align:right;font-weight:700">${money(gst)}</td></tr><tr><td style="padding:9px 0;color:#151719;font-weight:700;border-top:1px solid #e5e7e3">Total</td><td style="text-align:right;font-size:20px;font-weight:800;border-top:1px solid #e5e7e3">${money(total)}</td></tr></table><p><strong>Includes:</strong> ${escapeHtml(inclusions || "Not supplied")}</p><p><strong>Notes:</strong> ${escapeHtml(notes || "Not supplied")}</p>${attachmentUrl ? `<p style="margin-top:24px"><a href="${escapeHtml(attachmentUrl)}" style="display:inline-block;background:#151719;color:#fff;text-decoration:none;padding:13px 18px;border-radius:10px;font-weight:700">Open ${escapeHtml(attachmentName || "quote attachment")}</a></p><p style="font-size:12px;color:#6c746a">Secure attachment link · expires after 7 days</p>` : ""}<p style="margin-top:24px"><a href="${dashboard}" style="display:inline-block;background:#a8ff35;color:#0b0d10;text-decoration:none;padding:13px 18px;border-radius:10px;font-weight:700">Review quote in SitePlan</a></p></td></tr></table></td></tr></table></body></html>`
      })
    });
    const data = await send.json().catch(() => ({}));
    if (!send.ok) return Response.json({ error: data?.message || "Quote notification email failed." }, { status: 502 });
    return Response.json({ ok: true });
  } catch (error: any) {
    console.error("notify-quote", error);
    return Response.json({ error: error?.message || "Quote notification failed." }, { status: 500 });
  }
};

export const config: Config = { path: "/api/notify-quote" };
