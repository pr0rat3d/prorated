import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";
import { useState, useEffect } from "react";
import { BRAND } from "./UI";
import { useAuth } from "../hooks/useAuth";
import { useLang } from "../hooks/useLang";
import { t } from "../i18n/translations";

// Fetch nearby places via Vercel proxy



async function fetchFeaturedSuppliers(state = "AL") {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/featured_suppliers?active=eq.true&states=cs.{"${state}"}&select=*`,
      { headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

async function fetchNearby(address, trade, radiusMiles) {
  const radiusMeters = Math.round(radiusMiles * 1609.34);

  // Step 1: Geocode address
  const geoRes = await fetch(`/api/places?endpoint=geocode&address=${encodeURIComponent(address)}`);
  const geoData = await geoRes.json();
  const loc = geoData.results?.[0]?.geometry?.location;
  if (!loc) return { suppliers: [], restaurants: [], lat: null, lng: null };

  const { lat, lng } = loc;

  const TRADE_KEYWORDS = {
    roofing:     "roofing supply",
    electrical:  "electrical supply",
    plumbing:    "plumbing supply",
    hvac:        "HVAC supply",
    painting:    "paint store",
    general:     "building supply",
    landscaping: "landscaping supply",
    concrete:    "concrete supply",
  };
  const tradeKeyword = TRADE_KEYWORDS[trade] || "building supply";

  // Step 2: Search in parallel
  const search = (keyword) =>
    fetch(`/api/places?endpoint=nearby&location=${lat},${lng}&radius=${radiusMeters}&keyword=${encodeURIComponent(keyword)}`)
      .then(r => r.json())
      .then(d => (d.results || []).slice(0, 4))
      .catch(() => []);

  const [tradeResults, homeDepot, lowes, restaurants] = await Promise.all([
    search(tradeKeyword),
    search("Home Depot"),
    search("Lowe's"),
    search("restaurant breakfast lunch"),
  ]);

  const distMiles = (lat1, lng1, lat2, lng2) => {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const toPlace = (p, icon) => ({
    name:     p.name,
    address:  p.vicinity,
    placeId:  p.place_id,
    rating:   p.rating,
    open:     p.opening_hours?.open_now,
    distance: p.geometry?.location ? distMiles(lat, lng, p.geometry.location.lat, p.geometry.location.lng) : null,
    icon,
  });

  // Build suppliers — trade-specific first, then big box
  const seen = new Set();
  const suppliers = [
    ...tradeResults.map(p => toPlace(p, "🏗️")),
    ...homeDepot.slice(0, 1).map(p => toPlace(p, "🟠")),
    ...lowes.slice(0, 1).map(p => toPlace(p, "🔵")),
  ].filter(p => {
    const key = p.name.toLowerCase().slice(0, 12);
    if (seen.has(key)) return false;
    seen.add(key); return true;
  }).sort((a, b) => (a.distance || 99) - (b.distance || 99)).slice(0, 6);

  const food = restaurants
    .map(p => toPlace(p, "🍽️"))
    .sort((a, b) => (a.distance || 99) - (b.distance || 99))
    .sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10);

  // Fetch featured suppliers
  const featured = await fetchFeaturedSuppliers("AL");

  return { suppliers, restaurants: food, lat, lng, featured };
}

const FREE_SUPPLIER_LIMIT   = 3;
const FREE_RESTAURANT_LIMIT = 2;
const RADIUS_OPTIONS = [
  { label: "3 miles",  value: 3  },
  { label: "5 miles",  value: 5  },
  { label: "10 miles", value: 10 },
];

function PlaceRow({ place, isLocked }) {
  if (isLocked) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${BRAND.border}`, filter: "blur(4px)", userSelect: "none", pointerEvents: "none" }}>
        <span style={{ fontSize: 18 }}>📍</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: BRAND.dark }}>████████████</div>
          <div style={{ fontSize: 11, color: BRAND.gray }}>███ · 0.0 mi</div>
        </div>
      </div>
    );
  }

  return (
    <a href={`https://www.google.com/maps/search/${encodeURIComponent(place.name + " " + place.address)}`}
      target="_blank" rel="noopener noreferrer"
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${BRAND.border}`, textDecoration: "none" }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>{place.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {place.name}
          </span>
          {place.open === true && (
            <span style={{ background: "#DCFCE7", color: "#166534", fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 8, flexShrink: 0 }}>OPEN</span>
          )}
          {place.open === false && (
            <span style={{ background: "#FEE2E2", color: "#991B1B", fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 8, flexShrink: 0 }}>CLOSED</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: BRAND.gray, marginTop: 1 }}>
          {place.distance ? `${place.distance.toFixed(1)} mi away` : place.address}
          {place.rating ? ` · ⭐ ${place.rating}` : ""}
        </div>
      </div>
      <span style={{ fontSize: 12, color: BRAND.gray, flexShrink: 0 }}>→</span>
    </a>
  );
}

export default function NearbyPlaces({ address, trade, go }) {
  const { user, isLoggedIn } = useAuth();
  const { lang }    = useLang();
  const [expanded, setExpanded]   = useState(false);
  const [tab, setTab]             = useState("suppliers");
  const [radius, setRadius]       = useState(10);
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(false);

  const isPro = user?.plan === "pro";

  // Reload when radius changes while expanded
  useEffect(() => {
    if (!expanded || !address) return;
    setData(null);
    setError(false);
    setLoading(true);
    fetchNearby(address, trade || "general", radius)
      .then(result => { setData(result); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [expanded, address, trade, radius]);

  if (!isLoggedIn) return null;

  return (
    <div style={{ borderTop: `1px solid ${BRAND.border}`, marginTop: 4 }}>
      {/* Toggle header */}
      <button onClick={() => setExpanded(e => !e)}
        style={{ width: "100%", background: "none", border: "none", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>📍</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark }}>Local Points of Interest</span>
          <span style={{ fontSize: 11, background: "#F1F5F9", color: BRAND.gray, padding: "2px 7px", borderRadius: 10, fontWeight: 600 }}>
            Supplies & Food
          </span>
        </div>
        <span style={{ fontSize: 12, color: BRAND.gray }}>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div style={{ padding: "0 16px 16px" }}>

          {/* Tabs + radius toggle on same row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 4, background: "#F1F5F9", borderRadius: 10, padding: 3, flex: 1 }}>
              {[
                { id: "suppliers",   label: "suppliers" },
                { id: "restaurants", label: "restaurants" },
              ].map(tabItem => (
                <button key={tabItem.id} onClick={() => setTab(tabItem.id)}
                  style={{ flex: 1, padding: "7px 10px", borderRadius: 8, border: "none", background: tab === tabItem.id ? "#fff" : "transparent", color: tab === tabItem.id ? BRAND.dark : BRAND.gray, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: tab === tabItem.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
                  {tabItem.id === "suppliers" ? t(lang, "nearby.supplies") : t(lang, "nearby.food")}
                </button>
              ))}
            </div>

            {/* Radius dropdown */}
            <select value={radius} onChange={e => setRadius(Number(e.target.value))}
              style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 12, fontWeight: 600, color: BRAND.dark, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>
              {RADIUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", color: BRAND.gray, fontSize: 13 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${BRAND.border}`, borderTop: `2px solid ${BRAND.blue}`, animation: "spin 0.7s linear infinite" }} />
              Finding nearby {tab === "suppliers" ? "suppliers" : "food spots"} within {radius} miles...
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div style={{ fontSize: 13, color: BRAND.gray, padding: "12px 0" }}>
              Couldn't load nearby places. Check your connection and try again.
            </div>
          )}

          {/* Results */}
          {!loading && !error && data && (
            <>
              {tab === "suppliers" && (
                <div>
                  {/* Featured suppliers */}
                  {data.featured && data.featured.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      {data.featured.map(sup => (
                        <a key={sup.id}
                          href={sup.website || `https://www.google.com/maps/search/${encodeURIComponent(sup.name + " " + (sup.address || ""))}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "linear-gradient(135deg, #FEF9C3, #FEF3C7)", border: "1.5px solid #FDE047", borderRadius: 12, textDecoration: "none", marginBottom: 8 }}>
                          <span style={{ fontSize: 22, flexShrink: 0 }}>⭐</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 13, fontWeight: 800, color: "#854D0E" }}>{sup.name}</span>
                              <span style={{ background: "#F59E0B", color: "#fff", fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 6 }}>FEATURED</span>
                            </div>
                            {sup.description && <div style={{ fontSize: 11, color: "#92400E", marginTop: 2 }}>{sup.description}</div>}
                            {sup.phone && <div style={{ fontSize: 11, color: "#92400E" }}>📞 {sup.phone}</div>}
                          </div>
                          <span style={{ fontSize: 12, color: "#92400E" }}>→</span>
                        </a>
                      ))}
                    </div>
                  )}

                  {data.suppliers.length === 0
                    ? <div style={{ fontSize: 13, color: BRAND.gray, padding: "12px 0" }}>No suppliers found within {radius} miles.</div>
                    : <>
                        <div style={{ fontSize: 11, color: BRAND.gray, marginBottom: 8, fontWeight: 600 }}>
                          Suppliers within {radius} miles of this job site
                        </div>
                        {data.suppliers.map((place, i) => (
                          <PlaceRow key={place.placeId || i} place={place} isLocked={!isPro && i >= FREE_SUPPLIER_LIMIT} />
                        ))}
                      </>
                  }
                </div>
              )}

              {tab === "restaurants" && (
                <div>
                  {data.restaurants.length === 0
                    ? <div style={{ fontSize: 13, color: BRAND.gray, padding: "12px 0" }}>No food spots found within {radius} miles.</div>
                    : <>
                        <div style={{ fontSize: 11, color: BRAND.gray, marginBottom: 8, fontWeight: 600 }}>
                          Breakfast & lunch spots within {radius} miles
                        </div>
                        {data.restaurants.map((place, i) => (
                          <PlaceRow key={place.placeId || i} place={place} isLocked={!isPro && i >= FREE_RESTAURANT_LIMIT} />
                        ))}
                      </>
                  }
                </div>
              )}

              {/* Pro upsell */}
              {!isPro && (
                (tab === "suppliers"   && data.suppliers.length   > FREE_SUPPLIER_LIMIT) ||
                (tab === "restaurants" && data.restaurants.length > FREE_RESTAURANT_LIMIT)
              ) && (
                <div style={{ background: "linear-gradient(135deg, #0F172A, #1E3A5F)", borderRadius: 12, padding: "12px 14px", marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#F8FAFC", marginBottom: 2 }}>🔓 See all {tab === "suppliers" ? "suppliers" : "food spots"}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>Upgrade — first 6 months free</div>
                  </div>
                  <button onClick={() => go("pricing")}
                    style={{ background: BRAND.blue, color: "#fff", border: "none", padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>
                    Upgrade →
                  </button>
                </div>
              )}

              {/* Google attribution */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <img src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3.png"
                  alt="Powered by Google" style={{ height: 14, opacity: 0.6 }} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
