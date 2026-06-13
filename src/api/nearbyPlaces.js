// ─────────────────────────────────────────────────────────────
// ProRated — Nearby Places Service
// Finds job-site-relevant suppliers and restaurants near
// any searched address using Google Places API.
// Cost: ~$0.017 per nearby search (very cheap)
// ─────────────────────────────────────────────────────────────

// Places API routed through Vercel proxy to avoid CORS and keep key server-side
const PROXY_BASE = "/api/places";

// ── Trade-specific supplier search terms ─────────────────────
const TRADE_SUPPLIERS = {
  roofing:     ["roofing supply", "ABC supply", "GAF roofing", "roofing materials"],
  electrical:  ["electrical supply", "electrician supply", "wire supply"],
  plumbing:    ["plumbing supply", "Ferguson plumbing", "plumbing wholesale"],
  hvac:        ["HVAC supply", "heating cooling supply", "refrigeration supply"],
  painting:    ["paint store", "Sherwin Williams", "Benjamin Moore"],
  general:     ["building supply", "lumber yard", "84 Lumber"],
  landscaping: ["nursery", "landscaping supply", "mulch stone"],
  concrete:    ["concrete supply", "ready mix", "masonry supply"],
};

// ── Session cache — address → results ────────────────────────
const nearbyCache = new Map();

// ── Geocode an address to lat/lng ─────────────────────────────
const geocodeAddress = async (address) => {
  const cacheKey = `geo:${address}`;
  if (nearbyCache.has(cacheKey)) return nearbyCache.get(cacheKey);

  try {
    const res = await fetch(
      `${PROXY_BASE}?endpoint=geocode&address=${encodeURIComponent(address)}`
    );
    const data = await res.json();
    if (data.results?.[0]?.geometry?.location) {
      const loc = data.results[0].geometry.location;
      nearbyCache.set(cacheKey, loc);
      return loc;
    }
  } catch {}
  return null;
};

// ── Search nearby places ──────────────────────────────────────
const searchNearby = async (lat, lng, keyword, radius = 16093) => {
  try {
    const url = `${PROXY_BASE}?endpoint=nearby&location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(keyword)}`;
    const res  = await fetch(url);
    const data = await res.json();
    return (data.results || []).slice(0, 3).map(p => ({
      name:    p.name,
      address: p.vicinity,
      placeId: p.place_id,
      rating:  p.rating,
      open:    p.opening_hours?.open_now,
      lat:     p.geometry?.location?.lat,
      lng:     p.geometry?.location?.lng,
    }));
  } catch { return []; }
};

// ── Calculate distance in miles ───────────────────────────────
const distanceMiles = (lat1, lng1, lat2, lng2) => {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

// ── Main function: get all nearby places for an address ───────
export const getNearbyPlaces = async (address, trade = "general") => {
  const cacheKey = `nearby:${address}:${trade}`;
  if (nearbyCache.has(cacheKey)) return nearbyCache.get(cacheKey);

  // Geocode the address
  const loc = await geocodeAddress(address);
  if (!loc) return { suppliers: [], restaurants: [] };

  const { lat, lng } = loc;

  // Run supplier + restaurant searches in parallel
  const tradeKeywords = TRADE_SUPPLIERS[trade] || TRADE_SUPPLIERS.general;

  const [
    tradeResults,
    homDepotResults,
    lowesResults,
    restaurantResults,
  ] = await Promise.all([
    searchNearby(lat, lng, tradeKeywords[0], 16093),
    searchNearby(lat, lng, "Home Depot", 16093),
    searchNearby(lat, lng, "Lowe's", 16093),
    searchNearby(lat, lng, "restaurant breakfast lunch", 16093),
  ]);

  // Build suppliers list — trade-specific first, then big boxes
  const allSuppliers = [];

  // Trade-specific results
  tradeResults.forEach(p => {
    if (p.lat && p.lng) {
      allSuppliers.push({
        ...p,
        type:     "trade",
        icon:     "🏗️",
        distance: distanceMiles(lat, lng, p.lat, p.lng),
        featured: false,
      });
    }
  });

  // Home Depot
  homDepotResults.slice(0, 1).forEach(p => {
    if (p.lat && p.lng) {
      allSuppliers.push({
        ...p,
        type:     "bigbox",
        icon:     "🟠",
        distance: distanceMiles(lat, lng, p.lat, p.lng),
        featured: false,
      });
    }
  });

  // Lowe's
  lowesResults.slice(0, 1).forEach(p => {
    if (p.lat && p.lng) {
      allSuppliers.push({
        ...p,
        type:     "bigbox",
        icon:     "🔵",
        distance: distanceMiles(lat, lng, p.lat, p.lng),
        featured: false,
      });
    }
  });

  // Deduplicate and sort by distance
  const seenNames = new Set();
  const suppliers = allSuppliers
    .filter(p => {
      const key = p.name.toLowerCase().slice(0, 15);
      if (seenNames.has(key)) return false;
      seenNames.add(key);
      return true;
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5);

  // Restaurants — sort by distance
  const restaurants = restaurantResults
    .filter(p => p.lat && p.lng)
    .map(p => ({
      ...p,
      icon:     "🍽️",
      distance: distanceMiles(lat, lng, p.lat, p.lng),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 4);

  const result = { suppliers, restaurants, lat, lng };
  nearbyCache.set(cacheKey, result);
  return result;
};

// ── Build Google Maps directions URL ─────────────────────────
export const getMapsUrl = (name, address) =>
  `https://www.google.com/maps/search/${encodeURIComponent(name + " " + address)}`;
