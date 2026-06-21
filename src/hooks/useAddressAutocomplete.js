import { GOOGLE_MAPS_KEY } from "../config.js";
import { useState, useEffect, useRef, useCallback } from "react";

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

export default function useAddressAutocomplete(inputRef) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [apiReady, setApiReady]       = useState(false);
  const serviceRef                    = useRef(null);
  const sessionTokenRef               = useRef(null);

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

  // Fetch suggestions for a query
  const fetchSuggestions = useCallback((query) => {
    if (!apiReady || !serviceRef.current || !query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);

    // Legacy AutocompleteService
    serviceRef.current.getPlacePredictions(
      {
        input:             query,
        sessionToken:      sessionTokenRef.current,
        componentRestrictions: { country: "us" },
        types:             ["address"], // Street addresses only
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
