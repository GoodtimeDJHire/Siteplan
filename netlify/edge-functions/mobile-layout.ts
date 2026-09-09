import type { Context, Config } from "@netlify/edge-functions";

export default async (_request: Request, context: Context) => {
  const response = await context.next();
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;
  const html = await response.text();
  const scripts = `${html.includes('/v68.js') ? '' : '<script src="/v68.js?v=20260909-mobile-stable"></script>'}${html.includes('/v71.js') ? '' : '<script src="/v71.js?v=20260909-mobile-nav1"></script>'}${html.includes('/v72.js') ? '' : '<script src="/v72.js?v=20260909-mobile-header1"></script>'}`;
  if (!scripts) return new Response(html, { status: response.status, headers: response.headers });
  const enhanced = html.replace("</body>", scripts + "</body>");
  return new Response(enhanced, { status: response.status, headers: response.headers });
};

export const config: Config = {
  path: "/*",
  excludedPath: ["/v68.js", "/v69.js", "/v70.js", "/v71.js", "/v72.js", "/api/*", "/.netlify/functions/*"]
};
