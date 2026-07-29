import { GOOGLE_MAPS_KEY } from "../config.js";
import { useState, useEffect, useRef, useCallback } from "react";
import { Geolocation } from "@capacitor/geolocation";

// ─────────────────────────────────────────────────────────────
// ProRated — Google Places Autocomplete Hook
// Replace GOOGLE_MAPS_API_KEY with your actual key
// ─────────────────────────────────────────────────────────────
export const GOOGLE_MAPS_API_KEY = GOOGLE_MAPS_KEY || import.meta.env.VITE_GOOGLE_MAPS_KEY || "";

// Load the Google Maps script once globally
let scriptLoaded  = false;
let scriptLoading = false;
const callbacks   = [];

const loadGoogleMaps = () => new Promise((resolve, reject) => {
  if (scriptLoaded && window.google?.maps?.places) { resolve(); return; }
  callbacks.push({ resolve, reject });
  if (scriptLoading) return;
  scriptLoading = true;

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
  script.async = true;
  script.defer = true;
  script.onload = () => {
    scriptLoaded = true;
    scriptLoading = false;
    callbacks.forEach(cb => cb.resolve());
    callbacks.length = 0;
  };
  script.onerror = (err) => {
    scriptLoading = false;
    callbacks.forEach(cb => cb.reject(err));
    callbacks.length = 0;
  };
  document.head.appendChild(script);
});

// ── Main hook ─────────────────────────────────────────────────
// ── Recent address helpers ────────────────────────────────────
const RECENT_KEY = "prorated_recent_addresses";
const MAX_RECENT = 5;

export const getRecentAddresses = () => {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); }
  catch { return []; }
};

export const saveRecentAddress = (address) => {
  try {
    const recent = getRecentAddresses().filter(a => a !== address);
    recent.unshift(address);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch {}
};

// locationBias: only pass true for a search field where "near me" is
// actually the likely intent (e.g. ReviewPage's job-site address field —
// someone reviewing a job is probably standing at or near it right now).
// Never enable it on general research/browsing search (HomePage) — biasing
// results toward the user's current position there would work against
// someone researching a property they aren't physically at.
export default function useAddressAutocomplete(inputRef, { locationBias = false } = {}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [apiReady, setApiReady]       = useState(false);
  const serviceRef                    = useRef(null);
  const sessionTokenRef               = useRef(null);
  const biasLocationRef               = useRef(null);

  // Load Google Maps on mount
  useEffect(() => {
    if (GOOGLE_MAPS_API_KEY === "YOUR_GOOGLE_MAPS_API_KEY") {
      setError("no-key");
      return;
    }
    loadGoogleMaps()
      .then(() => {
        serviceRef.current      = new window.google.maps.places.AutocompleteService();
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
        setApiReady(true);
      })
      .catch(() => setError("load-failed"));
  }, []);

  // Best-effort location bias — never blocks or errors the search UI.
  // enableHighAccuracy is deliberately off: this only needs a general area to
  // bias toward, not a precise GPS fix, and coarse/network location returns
  // much faster (and doesn't force an Android ACCESS_FINE_LOCATION prompt
  // when the user has only granted approximate location).
  useEffect(() => {
    if (!locationBias) return;
    let cancelled = false;
    (async () => {
      try {
        // getCurrentPosition() alone doesn't reliably trigger the OS
        // permission prompt on a fresh install on every platform/plugin
        // version — check first and explicitly request if undetermined,
        // so the prompt actually fires instead of silently failing.
        const status = await Geolocation.checkPermissions();
        if (status.location === "denied") return; // user said no — nothing to do but skip the bias
        if (status.location !== "granted") {
          const requested = await Geolocation.requestPermissions();
          if (requested.location !== "granted") return;
        }
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 6000 });
        if (!cancelled) biasLocationRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch {} // denied, timed out, or unavailable — search still works unbiased
    })();
    return () => { cancelled = true; };
  }, [locationBias]);

  // Fetch suggestions for a query
  const fetchSuggestions = useCallback((query) => {
    if (!apiReady || !serviceRef.current || !query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);

    // location + radius on the legacy AutocompleteService is a soft bias, not
    // a hard restriction (unlike locationRestriction on the newer Places API)
    // — a real match further away still surfaces, it just doesn't get
    // artificially outranked by a closer, less-relevant one.
    const bias = biasLocationRef.current;
    const biasParams = bias
      ? { location: new window.google.maps.LatLng(bias.lat, bias.lng), radius: 80000 } // ~50mi
      : {};

    // Legacy AutocompleteService
    serviceRef.current.getPlacePredictions(
      {
        input:             query,
        sessionToken:      sessionTokenRef.current,
        componentRestrictions: { country: "us" },
        types:             ["address"], // Street addresses only
        ...biasParams,
      },
      (predictions, status) => {
        setLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions.map(p => ({
            placeId:     p.place_id,
            description: p.description,
            mainText:    p.structured_formatting.main_text,
            secondaryText: p.structured_formatting.secondary_text,
          })));
        } else {
          setSuggestions([]);
        }
      }
    );
  }, [apiReady]);

  // Clear suggestions and reset session token after selection
  const selectSuggestion = useCallback((suggestion) => {
    saveRecentAddress(suggestion.description || suggestion.structured_formatting?.main_text || "");
    setSuggestions([]);
    // Reset session token for next search (Billing best practice)
    if (window.google?.maps?.places) {
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
    }
    return suggestion.description;
  }, []);

  const clearSuggestions = useCallback(() => setSuggestions([]), []);

  return {
    suggestions,
    loading,
    error,
    apiReady,
    fetchSuggestions,
    selectSuggestion,
    clearSuggestions,
  };
}
