// ─────────────────────────────────────────────────────────────
// ProRated — Trade-Specific Issue Tags
// Tags shown change based on the contractor's trade
// ─────────────────────────────────────────────────────────────

// Universal tags shown for ALL trades
export const UNIVERSAL_TAGS = [
  { id: "pays_well",     label: "Pays on time",       severity: "good",  icon: "💵" },
  { id: "slow_payment",  label: "Slow payment",        severity: "alert", icon: "⏰" },
  { id: "great_owner",   label: "Great homeowner",     severity: "good",  icon: "⭐" },
  { id: "micromanager",  label: "Micromanager",        severity: "warn",  icon: "👁️" },
  { id: "easy_access",   label: "Easy access",         severity: "good",  icon: "✅" },
  { id: "no_parking",    label: "No parking",          severity: "warn",  icon: "🚫" },
  { id: "scope_creep",   label: "Scope creep",         severity: "alert", icon: "📋" },
  { id: "clear_scope",   label: "Clear scope of work", severity: "good",  icon: "📝" },
  { id: "great_comms",   label: "Great communication", severity: "good",  icon: "💬" },
  { id: "poor_comms",    label: "Poor communication",  severity: "alert", icon: "📵" },
  { id: "hoa",           label: "HOA restrictions",    severity: "info",  icon: "🏘️" },
  { id: "site_hazards",  label: "Site hazards",        severity: "alert", icon: "⚠️" },
];

// Trade-specific tags added on top of universal ones
const TRADE_SPECIFIC = {
  roofing: [
    { id: "steep_roof",     label: "Steep pitch",          severity: "warn",  icon: "📐" },
    { id: "steep_driveway", label: "Steep driveway",        severity: "warn",  icon: "⛰️" },
    { id: "tight_access",   label: "Tight staging area",    severity: "warn",  icon: "📏" },
    { id: "old_decking",    label: "Rotted decking found",  severity: "alert", icon: "🪵" },
    { id: "multi_layer",    label: "Multiple shingle layers", severity: "info", icon: "🔢" },
    { id: "aggressive_dog", label: "Aggressive dog",        severity: "alert", icon: "🐕" },
  ],
  painting: [
    { id: "surface_issues", label: "Surface prep issues",   severity: "warn",  icon: "🖌️" },
    { id: "color_changes",  label: "Frequent color changes", severity: "warn", icon: "🎨" },
    { id: "steep_driveway", label: "Steep driveway",        severity: "warn",  icon: "⛰️" },
    { id: "hoa_colors",     label: "HOA color approval req", severity: "info", icon: "🏘️" },
    { id: "lead_paint",     label: "Lead paint present",    severity: "alert", icon: "☠️" },
  ],
  plumbing: [
    { id: "old_systems",    label: "Old/galvanized pipes",  severity: "alert", icon: "🔩" },
    { id: "crawl_space",    label: "Tight crawl space",     severity: "warn",  icon: "🕳️" },
    { id: "permit_issues",  label: "Permit complications",  severity: "warn",  icon: "📄" },
    { id: "slab_work",      label: "Under-slab work req",   severity: "warn",  icon: "🏗️" },
    { id: "septic",         label: "Septic system",         severity: "info",  icon: "💧" },
  ],
  electrical: [
    { id: "old_wiring",     label: "Knob & tube wiring",    severity: "alert", icon: "⚡" },
    { id: "panel_upgrade",  label: "Panel upgrade needed",  severity: "info",  icon: "🔌" },
    { id: "tight_access",   label: "Tight attic/crawl",     severity: "warn",  icon: "📏" },
    { id: "permit_issues",  label: "Permit complications",  severity: "warn",  icon: "📄" },
    { id: "aluminum_wiring", label: "Aluminum wiring",      severity: "alert", icon: "🚨" },
  ],
  hvac: [
    { id: "old_systems",    label: "Very old equipment",    severity: "alert", icon: "🔩" },
    { id: "tight_access",   label: "Tight access points",   severity: "warn",  icon: "📏" },
    { id: "asbestos",       label: "Asbestos insulation",   severity: "alert", icon: "☠️" },
    { id: "crawl_space",    label: "Crawl space ductwork",  severity: "warn",  icon: "🕳️" },
    { id: "permit_issues",  label: "Permit complications",  severity: "warn",  icon: "📄" },
  ],
  general: [
    { id: "steep_driveway", label: "Steep driveway",        severity: "warn",  icon: "⛰️" },
    { id: "tight_access",   label: "Tight access",          severity: "warn",  icon: "📏" },
    { id: "aggressive_dog", label: "Aggressive dog",        severity: "alert", icon: "🐕" },
    { id: "old_systems",    label: "Old materials/systems", severity: "info",  icon: "🔩" },
    { id: "permit_issues",  label: "Permit complications",  severity: "warn",  icon: "📄" },
  ],
  landscaping: [
    { id: "steep_terrain",  label: "Steep terrain",         severity: "warn",  icon: "⛰️" },
    { id: "irrigation",     label: "Irrigation system",     severity: "info",  icon: "💧" },
    { id: "tight_access",   label: "Gate/access issues",    severity: "warn",  icon: "🚪" },
    { id: "aggressive_dog", label: "Aggressive dog",        severity: "alert", icon: "🐕" },
    { id: "hoa_approval",   label: "HOA plant approval req", severity: "info", icon: "🌿" },
  ],
  concrete: [
    { id: "rebar_needed",   label: "Unexpected rebar",      severity: "warn",  icon: "🔧" },
    { id: "poor_base",      label: "Poor sub-base",         severity: "alert", icon: "🏗️" },
    { id: "steep_driveway", label: "Steep grade",           severity: "warn",  icon: "⛰️" },
    { id: "tight_access",   label: "Tight access for truck", severity: "warn", icon: "🚛" },
    { id: "permit_issues",  label: "Permit complications",  severity: "warn",  icon: "📄" },
  ],
};

export const getTagsForTrade = (trade) => {
  const specific = TRADE_SPECIFIC[trade] || TRADE_SPECIFIC.general;
  // Deduplicate by id
  const seen = new Set();
  return [...specific, ...UNIVERSAL_TAGS].filter(t => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });
};

export default getTagsForTrade;
