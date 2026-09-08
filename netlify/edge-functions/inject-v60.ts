export default async (_request: Request, context: any) => {
  const response = await context.next();
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;

  const html = await response.text();
  if (html.includes('src="/v60.js"')) {
    return new Response(html, { status: response.status, headers: response.headers });
  }

  const enhanced = html.replace("</body>", '<script src="/v60.js"></script></body>');
  return new Response(enhanced, { status: response.status, headers: response.headers });
};
