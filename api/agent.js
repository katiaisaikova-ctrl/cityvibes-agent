// Cityvibes Mock Agent — без ключей Ticketmaster
// Возвращает пример событий для теста приложения

export const config = { runtime: "edge" };

export default async function handler() {
  const events = [
    {
      id: "demo_1",
      title: "Basel Street Food Festival",
      start: "2025-11-15T16:00:00Z",
      end: "2025-11-15T22:00:00Z",
      priceRange: { min: 0, max: 0, currency: "CHF" },
      genres: ["food", "festival"],
      venue: {
        name: "Münsterplatz",
        lat: 47.5565,
        lng: 7.589,
        address: "Münsterplatz, Basel"
      },
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
      venue: {
        name: "Atlantis Basel",
        lat: 47.557,
        lng: 7.588,
        address: "Klosterberg 13, Basel"
      },
      coverUrl: "https://www.basel.com/sites/default/files/styles/header_16_9/public/2021-05/Atlantis_Basel.jpg",
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
      venue: {
        name: "Kunstmuseum Basel",
        lat: 47.5546,
        lng: 7.593,
        address: "St. Alban-Graben 16, Basel"
      },
      coverUrl: "https://upload.wikimedia.org/wikipedia/commons/3/3a/Kunstmuseum_Basel.jpg",
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
      venue: {
        name: "Impact Hub Basel",
        lat: 47.5495,
        lng: 7.5895,
        address: "Dreispitz, Basel"
      },
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
      venue: {
        name: "Barfüsserplatz",
        lat: 47.5553,
        lng: 7.5882,
        address: "Barfüsserplatz, Basel"
      },
      coverUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Basel_Weihnachtsmarkt.jpg",
      url: "https://www.basel.com/en/christmas",
      source: "mock"
    }
  ];

  return new Response(JSON.stringify({ events, meta: { count: events.length } }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}
