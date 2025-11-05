// Cityvibes Agent (Edge). Тянет события из Ticketmaster для указанного окна времени.
// Разворачивается на Vercel. Требует ENV: TM_KEY (Ticketmaster Discovery API key).

export const config = { runtime: "edge" };

type EventItem = {
  id: string;
  title: string;
  start: string | null;
  end: string | null;
  priceRange?: { min?: number; max?: number; currency?: string };
  genres: string[];
  venue: { name?: string; lat?: number | null; lng?: number | null; address?: string | null };
  coverUrl?: string | null;
  url?: string | null;
  source: "ticketmaster";
};

function isoOrNull(v: any) { try { return v ? new Date(v).toISOString() : null; } catch { return null; } }
function toNum(v: any) { const n = Number(v); return Number.isFinite(n) ? n : null; }
function norm(s?: string | null) { return (s || "").trim(); }

async function fetchJSON(u: string) {
  const r = await fetch(u, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`Upstream ${r.status}`);
  return r.json();
}

export default async function handler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const radiusKm = Number(url.searchParams.get("radiusKm") || 10);

    if (!from || !to) {
      return new Response(JSON.stringify({ error: "Missing from/to (UTC ISO)" }), {
        status: 400, headers: { "content-type": "application/json" }
      });
    }

    const TM_KEY = process.env.TM_KEY;
    if (!TM_KEY) {
      return new Response(JSON.stringify({ error: "TM_KEY is not configured" }), {
        status: 500, headers: { "content-type": "application/json" }
      });
    }

    // Basel геохеш (точная область поиска в TM):
    const geoPoint = "u0qj2j6";

    const tm = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
    tm.searchParams.set("apikey", TM_KEY);
    tm.searchParams.set("geoPoint", geoPoint);
    tm.searchParams.set("radius", String(radiusKm));
    tm.searchParams.set("unit", "km");
    tm.searchParams.set("size", "50");
    tm.searchParams.set("countryCode", "CH");
    tm.searchParams.set("startDateTime", from);
    tm.searchParams.set("endDateTime", to);

    const data = await fetchJSON(tm.toString());
    const raw: any[] = data?._embedded?.events ?? [];

    const events: EventItem[] = raw.map((e: any) => {
      const v = e?._embedded?.venues?.[0] ?? {};
      const pr = Array.isArray(e?.priceRanges) ? e.priceRanges[0] : undefined;
      const genres = (e?.classifications ?? [])
        .map((c: any) => (c?.genre?.name || c?.segment?.name || "").toLowerCase())
        .filter(Boolean);

      return {
        id: `tm_${e?.id ?? ""}`,
        title: norm(e?.name),
        start: isoOrNull(e?.dates?.start?.dateTime),
        end: isoOrNull(e?.dates?.end?.dateTime),
        priceRange: pr ? { min: pr.min, max: pr.max, currency: pr.currency } : undefined,
        genres,
        venue: {
          name: norm(v?.name),
          lat: toNum(v?.location?.latitude),
          lng: toNum(v?.location?.longitude),
          address: v?.address?.line1 || null
        },
        coverUrl: e?.images?.[0]?.url || null,
        url: e?.url || null,
        source: "ticketmaster"
      };
    }).sort((a, b) => (a.start || "") > (b.start || "") ? 1 : -1);

    return new Response(JSON.stringify({ events, meta: { count: events.length } }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "public, max-age=120"
      }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: "Agent error", details: String(e?.message || e) }), {
      status: 500, headers: { "content-type": "application/json" }
    });
  }
}
