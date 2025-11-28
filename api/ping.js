export const config = { runtime: "edge" };

export default async function handler() {
  return new Response(JSON.stringify({ ok: true, route: "/api/ping", now: new Date().toISOString() }), {
    headers: { "content-type": "application/json" },
  });
}
