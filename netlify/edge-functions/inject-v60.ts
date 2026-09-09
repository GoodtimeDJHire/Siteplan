import type { Context, Config } from "@netlify/edge-functions";

export default async (_request: Request, context: Context) => {
  const response = await context.next();
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;

  const html = await response.text();
  const scripts = `${html.includes('src="/v60.js"') ? '' : '<script src="/v60.js"></script>'}${html.includes('src="/v61.js"') ? '' : '<script src="/v61.js"></script>'}${html.includes('src="/v62.js"') ? '' : '<script src="/v62.js"></script>'}${html.includes('src="/v63.js"') ? '' : '<script src="/v63.js"></script>'}`;
  if (!scripts) return new Response(html, { status: response.status, headers: response.headers });
  const enhanced = html.replace("</body>", scripts + "</body>");
  return new Response(enhanced, { status: response.status, headers: response.headers });
};

export const config: Config = {
  path: "/*",
  excludedPath: ["/v60.js", "/v61.js", "/v62.js", "/v63.js", "/api/*"]
};
