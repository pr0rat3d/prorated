import { useState, useRef, useEffect } from "react";
import { BRAND } from "./UI";
import useAddressAutocomplete, { getRecentAddresses, saveRecentAddress } from "../hooks/useAddressAutocomplete";

// ─────────────────────────────────────────────────────────────
// AddressInput — drop-in replacement for any address text field
// Props:
//   value        — current value
//   onChange     — called with new string value
//   onSelect     — called when a suggestion is confirmed
//   placeholder  — input placeholder text
//   style        — extra styles for the wrapper
//   inputStyle   — extra styles for the input element
//   autoFocus    — whether to focus on mount
// ─────────────────────────────────────────────────────────────
export default function AddressInput({
  value,
  onChange,
  onSelect,
  placeholder = "Enter any job site address...",
  style = {},
  inputStyle = {},
  autoFocus = false,
}) {
  const inputRef                                           = useRef(null);
  const dropdownRef                                        = useRef(null);
  const [focused, setFocused]                              = useState(false);
  const [activeIndex, setActiveIndex]                      = useState(-1);
  const { suggestions, loading, fetchSuggestions, selectSuggestion, clearSuggestions } =
    useAddressAutocomplete(inputRef);
  const [recentAddresses, setRecentAddresses] = useState(() => getRecentAddresses());
  const [showRecent, setShowRecent]           = useState(false);

  // Auto-focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [autoFocus]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          inputRef.current    && !inputRef.current.contains(e.target)) {
        clearSuggestions();
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [clearSuggestions]);

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);
    setActiveIndex(-1);
    fetchSuggestions(val);
  };

  const handleSelect = (suggestion) => {
    const address = selectSuggestion(suggestion);
    saveRecentAddress(address);
    setRecentAddresses(getRecentAddresses());
    onChange(address);
    onSelect?.(address);
    setActiveIndex(-1);
    setShowRecent(false);
    inputRef.current?.blur();
  };

  const handleRecentSelect = (address) => {
    onChange(address);
    onSelect?.(address);
    setShowRecent(false);
    inputRef.current?.blur();
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      clearSuggestions();
      setActiveIndex(-1);
    }
  };

  const showDropdown = focused && suggestions.length > 0;

  return (
    <div style={{ position: "relative", width: "100%", zIndex: 500, ...style }}>
      {/* Input */}
      <input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => { setFocused(true); if (!value) setShowRecent(true); }}
        onBlur={() => setTimeout(() => { setFocused(false); setShowRecent(false); }, 150)}
        placeholder={placeholder}
        autoComplete="off"
        style={{
          width: "100%",
          border: "none",
          outline: "none",
          fontSize: 14,
          color: BRAND.dark,
          background: "transparent",
          fontFamily: "'DM Sans', sans-serif",
          padding: "6px 4px",
          boxSizing: "border-box",
          ...inputStyle,
        }}
      />

      {/* Loading indicator */}
      {loading && (
        <div style={{
          position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
          width: 14, height: 14, borderRadius: "50%",
          border: `2px solid ${BRAND.border}`, borderTop: `2px solid ${BRAND.blue}`,
          animation: "spin 0.7s linear infinite",
        }} />
      )}

      {/* Recent addresses dropdown */}
      {showRecent && !value && recentAddresses.length > 0 && !showDropdown && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: -14, right: -14,
          background: "#fff", border: `2px solid ${BRAND.border}`, borderRadius: 12,
          boxShadow: "0 16px 48px rgba(0,0,0,0.2)", zIndex: 99999, overflow: "hidden",
        }}>
          <div style={{ padding: "6px 14px 2px", fontSize: 10, fontWeight: 700, color: BRAND.gray, textTransform: "uppercase", letterSpacing: "0.08em" }}>Recent searches</div>
          {recentAddresses.map((addr, i) => (
            <button key={i}
              onMouseDown={(e) => { e.preventDefault(); handleRecentSelect(addr); }}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "#fff", border: "none", borderTop: `1px solid ${BRAND.border}`, cursor: "pointer", textAlign: "left", fontFamily: "'DM Sans', sans-serif" }}
              onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>🕐</span>
              <span style={{ fontSize: 13, color: BRAND.dark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{addr}</span>
            </button>
          ))}
        </div>
      )}

      {/* Suggestions dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: -14, right: -14,
            background: "#FFFFFF",
            border: `2px solid ${BRAND.blue}`,
            borderRadius: 12,
            boxShadow: "0 16px 48px rgba(0,0,0,0.35)",
            zIndex: 99999,
            isolation: "isolate",
            overflow: "hidden",
            animation: "fadeUp 0.15s ease both",
          }}>

          {suggestions.map((s, i) => (
            <button
              key={s.placeId}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
              style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                width: "100%", padding: "10px 14px",
                background: i === activeIndex ? "#F1F5F9" : "#fff",
                border: "none",
                borderBottom: i < suggestions.length - 1 ? `1px solid ${BRAND.border}` : "none",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "'DM Sans', sans-serif",
                transition: "background 0.1s",
              }}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(-1)}
            >
              {/* Pin icon */}
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>📍</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: BRAND.dark,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {s.mainText}
                </div>
                <div style={{
                  fontSize: 11, color: BRAND.gray, marginTop: 1,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {s.secondaryText}
                </div>
              </div>
            </button>
          ))}

          {/* Google attribution (required by TOS) */}
          <div style={{
            padding: "6px 14px", background: "#F8FAFC",
            display: "flex", justifyContent: "flex-end", alignItems: "center",
          }}>
            <img
              src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3.png"
              alt="Powered by Google"
              style={{ height: 16, opacity: 0.7 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
