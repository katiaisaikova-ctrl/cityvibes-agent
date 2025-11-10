// Cityvibes Agent (Edge JS): live Ticketmaster (если есть TM_KEY) + mock fallback

export const config = { runtime: "edge" };

function isoOrNull(v) { try { return v ? new Date(v).toISOString() : null; } catch { return null; } }
function toNum(v) { const n = Number(v); return Number.isFinite(n) ? n : null; }
function norm(s) { return (s || "").trim(); }

const MOCK_EVENTS = [
  {
    id: "demo_1",
    title: "Basel Street Food Festival",
    start: "2025-11-15T16:00:00Z",
    end: "2025-11-15T22:00:00Z",
    priceRange: { min: 0, max: 0, currency: "CHF" },
    genres: ["food", "festival"],
    venue: { name: "Münsterplatz", lat: 47.5565, lng: 7.589, address: "Münsterplatz, Basel" },
    coverUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Basel_Muensterplatz.jpg",
    url: "https://www.basel.com/en/events",
    source: "mock"
  },
  {
    id: "demo_2",
    title: "Live Jazz Night @ Atlantis Basel",
    start: "2025-11-16T19:00:00Z",
    end: "2025-11-16T23:00:00Z",
    priceRange: { min: 25, max: 40, currency: "CHF" },
    genres: ["music", "jazz"],
    venue: { name: "Atlantis Basel", lat: 47.557, lng: 7.588, address: "Klosterberg 13, Basel" },
    coverUrl: "https://www.atlantis-basel.ch/fileadmin/_processed_/4/1/csm_Atlantis_2_0b9b1b1c2e.jpg",
    url: "https://www.atlantis-basel.ch/",
    source: "mock"
  },
  {
    id: "demo_3",
    title: "Basel Museum Night",
    start: "2025-11-20T18:00:00Z",
    end: "2025-11-21T02:00:00Z",
    priceRange: { min: 20, max: 30, currency: "CHF" },
    genres: ["art", "culture"],
    venue: { name: "Kunstmuseum Basel", lat: 47.5546, lng: 7.593, address: "St. Alban-Graben 16, Basel" },
    coverUrl: "https://kunstmuseumbasel.ch/sites/default/files/styles/1200x675/public/2019-09/km_0.jpg",
    url: "https://kunstmuseumbasel.ch/",
    source: "mock"
  },
  {
    id: "demo_4",
    title: "Tech Meetup Basel",
    start: "2025-11-18T17:30:00Z",
    end: "2025-11-18T21:00:00Z",
    priceRange: { min: 0, max: 0, currency: "CHF" },
    genres: ["technology", "networking"],
    venue: { name: "Impact Hub Basel", lat: 47.5495, lng: 7.5895, address: "Dreispitz, Basel" },
    coverUrl: "https://impacthubbasel.ch/wp-content/uploads/2020/06/ImpactHubBasel-Exterior.jpg",
    url: "https://impacthubbasel.ch/",
    source: "mock"
  },
  {
    id: "demo_5",
    title: "Basel Christmas Market",
    start: "2025-11-23T10:00:00Z",
    end: "2025-12-23T21:00:00Z",
    priceRange: { min: 0, max: 0, currency: "CHF" },
    genres: ["christmas", "market"],
    venue: { name: "Barfüsserplatz", lat: 47.5553, lng: 7.5882, address: "Barfüsserplatz, Basel" },
    coverUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Basel_Weihnachtsmarkt.jpg",
    url: "https://www.basel.com/en/christmas",
    source: "mock"
  }
];

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const radiusKm = Number(url.searchParams.get("radiusKm") || 10);
    const TM_KEY = process.env.TM_KEY;

    // Если ключа нет или не переданы from/to — сразу mock
    if (!TM_KEY || !from || !to) {
      return new Response(JSON.stringify({ events: MOCK_EVENTS, meta: { count: MOCK_EVENTS.length, source: "mock" } }), {
        status: 200, headers: { "content-type": "application/json" }
      });
    }

    // Иначе: Ticketmaster
    const geoPoint = "u0qj2j6"; // Basel geohash
    const tm = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
    tm.searchParams.set("apikey", TM_KEY);
    tm.searchParams.set("geoPoint", geoPoint);
    tm.searchParams.set("radius", String(radiusKm));
    tm.searchParams.set("unit", "km");
    tm.searchParams.set("size", "50");
    tm.searchParams.set("countryCode", "CH");
    tm.searchParams.set("startDateTime", from);
    tm.searchParams.set("endDateTime", to);

    const r = await fetch(tm.toString(), { headers: { Accept: "application/json" } });
    if (!r.ok) {
      // мягкий откат на mock
      return new Response(JSON.stringify({ events: MOCK_EVENTS, meta: { count: MOCK_EVENTS.length, source: "mock" } }), {
        status: 200, headers: { "content-type": "application/json" }
      });
    }

    const data = await r.json();
    const raw = (data?._embedded?.events) || [];

    const events = raw.map((e) => {
      const v = (e?._embedded?.venues?.[0]) || {};
      const pr = Array.isArray(e?.priceRanges) ? e.priceRanges[0] : undefined;
      const genres = (e?.classifications || [])
        .map((c) => (c?.genre?.name || c?.segment?.name || "").toLowerCase())
        .filter(Boolean);

      return {
        id: `tm_${e?.id || ""}`,
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
        coverUrl: (e?.images?.[0]?.url) || null,
        url: e?.url || null,
        source: "ticketmaster"
      };
    }).sort((a, b) => (a.start || "") > (b.start || "") ? 1 : -1);

    const payload = events.length ? { events, meta: { count: events.length, source: "ticketmaster" } }
                                  : { events: MOCK_EVENTS, meta: { count: MOCK_EVENTS.length, source: "mock" } };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/json", "cache-control": "public, max-age=120" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ events: MOCK_EVENTS, meta: { count: MOCK_EVENTS.length, source: "mock" }, error: "Agent error" }), {
      status: 200, headers: { "content-type": "application/json" }
    });
  }
}
