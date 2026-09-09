export default async () => {
  const key = process.env.GOOGLE_MAPS_API_KEY || '';
  if (!key) {
    return new Response(JSON.stringify({ error: 'Google Maps configuration missing' }), {
      status: 503,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
    });
  }
  return new Response(JSON.stringify({ key }), {
    status: 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store, max-age=0' }
  });
};

export const config = { path: '/.netlify/functions/maps-config' };
