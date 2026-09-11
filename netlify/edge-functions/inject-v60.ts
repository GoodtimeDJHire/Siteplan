import type { Context, Config } from "@netlify/edge-functions";

export default async (_request: Request, context: Context) => {
  const response = await context.next();
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;

  const html = await response.text();
  const scripts = `${html.includes('src="/v60.js"') ? '' : '<script src="/v60.js"></script>'}${html.includes('src="/v61.js"') ? '' : '<script src="/v61.js"></script>'}${html.includes('src="/v62.js"') ? '' : '<script src="/v62.js"></script>'}${html.includes('/v63.js') ? '' : '<script src="/v63.js?v=20260909-1319"></script>'}${html.includes('/v64.js') ? '' : '<script src="/v64.js?v=20260909-suppliers"></script>'}${html.includes('/v65.js') ? '' : '<script src="/v65.js?v=20260909-1555"></script>'}${html.includes('/v66.js') ? '' : '<script src="/v66.js?v=20260909-1657"></script>'}${html.includes('/v67.js') ? '' : '<script src="/v67.js?v=20260909-1714"></script>'}${html.includes('/v73.js') ? '' : '<script src="/v73.js?v=20260911-cloud2"></script>'}${html.includes('/v74.js') ? '' : '<script src="/v74.js?v=20260910-mobile-supplier-map1"></script>'}${html.includes('/v75.js') ? '' : '<script src="/v75.js?v=20260910-import3"></script>'}${html.includes('/v76.js') ? '' : '<script src="/v76.js?v=20260910-manualquote1"></script>'}${html.includes('/v77.js') ? '' : '<script src="/v77.js?v=20260910-delivery2"></script>'}${html.includes('/v78.js') ? '' : '<script src="/v78.js?v=20260911-tendercontext2"></script>'}${html.includes('/v79.js') ? '' : '<script src="/v79.js?v=20260911-rc1"></script>'}${html.includes('/v80.js') ? '' : '<script src="/v80.js?v=20260911-engagement1"></script>'}${html.includes('/v81.js') ? '' : '<script src="/v81.js?v=20260911-textlabels3"></script>'}${html.includes('/v82.js') ? '' : '<script src="/v82.js?v=20260911-approvedbrief1"></script>'}${html.includes('/v83.js') ? '' : '<script src="/v83.js?v=20260911-suppliersave4"></script>'}${html.includes('/v84.js') ? '' : '<script src="/v84.js?v=20260911-tenderheader2"></script>'}${html.includes('/v85.js') ? '' : '<script src="/v85.js?v=20260911-tenderstable2"></script>'}${html.includes('/v86.js') ? '' : '<script src="/v86.js?v=20260911-publicmap1"></script>'}${html.includes('/v87.js') ? '' : '<script src="/v87.js?v=20260911-populatedmail2"></script>'}`;
  if (!scripts) return new Response(html, { status: response.status, headers: response.headers });
  const enhanced = html.replace("</body>", scripts + "</body>");
  return new Response(enhanced, { status: response.status, headers: response.headers });
};

export const config: Config = {
  path: "/*",
  excludedPath: ["/v60.js", "/v61.js", "/v62.js", "/v63.js", "/v64.js", "/v65.js", "/v66.js", "/v67.js", "/v73.js", "/v74.js", "/v75.js", "/v76.js", "/v77.js", "/v78.js", "/v79.js", "/v80.js", "/v81.js", "/v82.js", "/v83.js", "/v84.js", "/v85.js", "/v86.js", "/v87.js", "/api/*"]
};
