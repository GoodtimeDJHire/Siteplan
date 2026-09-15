import type { Context, Config } from "@netlify/functions";

const SUPABASE_URL = "https://qkvkemcqfnbmaktbxddg.supabase.co";
const SUPABASE_KEY = "sb_publishable_tiPl-Y7wvfrpB7RzNzOBVA_CMIGBTwA";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function timedFetch(url: string, init: RequestInit = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...init, signal: controller.signal }); }
  catch (error: any) {
    if (error?.name === "AbortError") throw new Error("The database timed out. Please try again.");
    throw error;
  } finally { clearTimeout(timer); }
}

function headers(jwt: string, extra: Record<string, string> = {}) {
  return { apikey: SUPABASE_KEY, Authorization: `Bearer ${jwt}`, ...extra };
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  try {
    const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!jwt) return Response.json({ error: "Sign in before deleting a quote." }, { status: 401 });
    const userResponse = await timedFetch(`${SUPABASE_URL}/auth/v1/user`, { headers: headers(jwt) });
    if (!userResponse.ok) return Response.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const tenderId = String(body.tenderId || "").trim();
    const submissionId = String(body.submissionId || "").trim();
    if (!uuid.test(tenderId) || !uuid.test(submissionId)) return Response.json({ error: "Invalid quote deletion request." }, { status: 400 });

    const quoteResponse = await timedFetch(`${SUPABASE_URL}/rest/v1/tender_submissions?id=eq.${encodeURIComponent(submissionId)}&tender_id=eq.${encodeURIComponent(tenderId)}&select=id,status,company_name`, { headers: headers(jwt, { Accept: "application/json" }) });
    if (!quoteResponse.ok) throw new Error(`Quote lookup failed (${quoteResponse.status}).`);
    const quote = (await quoteResponse.json())?.[0];
    if (!quote) return Response.json({ error: "Quote not found or you do not have permission to delete it." }, { status: 404 });

    const filesResponse = await timedFetch(`${SUPABASE_URL}/rest/v1/tender_files?submission_id=eq.${encodeURIComponent(submissionId)}&select=storage_path`, { headers: headers(jwt, { Accept: "application/json" }) });
    if (!filesResponse.ok) throw new Error(`Quote file lookup failed (${filesResponse.status}).`);
    const files = await filesResponse.json();
    const paths = (files || []).map((file: any) => String(file.storage_path || "").trim()).filter(Boolean);
    if (paths.length) {
      const remove = await timedFetch(`${SUPABASE_URL}/storage/v1/object/tender-files`, { method: "DELETE", headers: headers(jwt, { "Content-Type": "application/json" }), body: JSON.stringify({ prefixes: paths }) });
      if (!remove.ok) throw new Error(`Quote file deletion failed (${remove.status}).`);
    }

    const deleteResponse = await timedFetch(`${SUPABASE_URL}/rest/v1/tender_submissions?id=eq.${encodeURIComponent(submissionId)}&tender_id=eq.${encodeURIComponent(tenderId)}`, { method: "DELETE", headers: headers(jwt, { Prefer: "return=representation" }) });
    if (!deleteResponse.ok) throw new Error(`Quote deletion failed (${deleteResponse.status}): ${await deleteResponse.text()}`);
    const deleted = await deleteResponse.json().catch(() => []);
    if (!deleted?.length) return Response.json({ error: "Quote was not deleted." }, { status: 409 });

    if (String(quote.status).toLowerCase() === "awarded") {
      const reset = await timedFetch(`${SUPABASE_URL}/rest/v1/tenders?id=eq.${encodeURIComponent(tenderId)}`, { method: "PATCH", headers: headers(jwt, { "Content-Type": "application/json", Prefer: "return=minimal" }), body: JSON.stringify({ status: "published" }) });
      if (!reset.ok) console.error("Deleted awarded quote but tender status reset failed", reset.status);
    }
    return Response.json({ ok: true, deletedQuote: quote.company_name || "Supplier quote", deletedFiles: paths.length });
  } catch (error: any) {
    console.error("delete-quote", error);
    return Response.json({ error: error?.message || "Quote could not be deleted." }, { status: 500 });
  }
};

export const config: Config = { path: "/api/delete-quote" };
