// ─────────────────────────────────────────────────────────────
// ProRated — Trade-Specific Issue Tags
// Tags shown change based on the contractor's trade
// ─────────────────────────────────────────────────────────────

// Universal tags shown for ALL trades
export const UNIVERSAL_TAGS = [
  // ── Positive ──────────────────────────────────────────────
  { id: "pays_well",       label: "Pays on time",              severity: "good",  icon: "💵", desc: "Homeowner paid promptly with no disputes or delays." },
  { id: "great_owner",     label: "Great homeowner",           severity: "good",  icon: "⭐", desc: "Homeowner was respectful, reasonable, and easy to work with overall." },
  { id: "easy_access",     label: "Easy access",               severity: "good",  icon: "✅", desc: "Driveway, staging area, and site entry were easy to work with." },
  { id: "friendly",        label: "Friendly",                  severity: "good",  icon: "😊", desc: "Homeowner had a positive, welcoming attitude toward the crew throughout the job." },
  { id: "understanding",   label: "Understanding",             severity: "good",  icon: "🤝", desc: "Homeowner was flexible and reasonable when unexpected issues or changes came up." },
  { id: "no_hover",        label: "Didn't Hover",              severity: "good",  icon: "🙌", desc: "Homeowner gave the crew space to work without micromanaging or interfering." },
  { id: "clear_scope",     label: "Clear scope of work",       severity: "good",  icon: "📝", desc: "Project expectations were well-defined and didn't change during the job." },
  { id: "clear_expects",   label: "Clear Expectations",        severity: "good",  icon: "🎯", desc: "Homeowner communicated exactly what they wanted upfront with no ambiguity." },
  { id: "great_comms",     label: "Great communication",       severity: "good",  icon: "💬", desc: "Homeowner was responsive and communicated clearly throughout the job." },
  { id: "reasonable_time", label: "Reasonable Timeline",       severity: "good",  icon: "📅", desc: "Homeowner set a realistic schedule and didn't pressure the crew to rush." },
  { id: "pets_secured",    label: "Pets Secured",              severity: "good",  icon: "🐾", desc: "Pets were properly contained and not a hazard or distraction during the job." },
  // ── Heads Up ──────────────────────────────────────────────
  { id: "no_parking",      label: "No parking",                severity: "warn",  icon: "🚫", desc: "Limited or no street/driveway parking for crew vehicles or trailers." },
  { id: "hoa",             label: "HOA restrictions",          severity: "warn",  icon: "🏘️", desc: "HOA rules may affect work hours, materials, staging, or require written approval before starting." },
  { id: "micromanager",    label: "Micromanager",              severity: "warn",  icon: "👁️", desc: "Homeowner hovered over crew, interfered with work, or second-guessed decisions on site." },
  // ── Concerns ──────────────────────────────────────────────
  { id: "inflexible",      label: "Inflexible Customer",       severity: "bad",   icon: "🚧", desc: "Homeowner refused reasonable adjustments even when circumstances required them." },
  { id: "rude_hostile",    label: "Rude / Hostile",            severity: "bad",   icon: "😤", desc: "Homeowner displayed rude, hostile, or aggressive behavior toward the crew." },
  { id: "unreasonable",    label: "Unreasonable Demands",      severity: "bad",   icon: "🙅", desc: "Homeowner made demands outside the agreed scope or beyond what was reasonable." },
  { id: "unclear_scope",   label: "Unclear Scope / Changing",  severity: "bad",   icon: "🔄", desc: "Project scope was vague or kept changing throughout the job." },
  { id: "rushed_timeline", label: "Rushed / Unrealistic Timeline", severity: "bad", icon: "⏱️", desc: "Homeowner pushed for an unrealistic schedule that created pressure or quality risk." },
  { id: "scope_creep",     label: "Scope creep",               severity: "bad",   icon: "📋", desc: "Homeowner added work or changed project requirements after the job started." },
  { id: "slow_payment",    label: "Slow payment",              severity: "bad",   icon: "⏰", desc: "Payment was significantly delayed or required repeated follow-up after job completion." },
  { id: "poor_comms",      label: "Poor communication",        severity: "bad",   icon: "📵", desc: "Homeowner was unresponsive, unclear, or difficult to reach for decisions during the job." },
  { id: "delayed_start",   label: "Delayed start date",        severity: "bad",   icon: "📆", desc: "Homeowner pushed back the agreed start date with little or no notice, wasting crew time." },
  { id: "site_hazards",    label: "Site hazards",              severity: "bad",   icon: "⚠️", desc: "Unexpected on-site hazards such as debris, unstable ground, or access blockages." },
  { id: "aggressive_dog",  label: "Aggressive dog",            severity: "bad",   icon: "🐕", desc: "Dog on property was aggressive or unsecured — confirm pets are controlled before crew arrives." },
  { id: "pets_loose",      label: "Pets Loose",		       severity: "bad",   icon: "🐾", desc: "Pets were unsecured and an added distraction or safety concern for the crew on site." },
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
  fencing: [
    { id: "steep_terrain",   label: "Steep terrain",        severity: "warn",  icon: "⛰️", desc: "Uneven or sloped ground that complicates post setting or equipment access." },
    { id: "tight_property",  label: "Tight property line",  severity: "warn",  icon: "📏", desc: "Property lines close to neighboring structures — requires careful layout." },
    { id: "underground_haz", label: "Underground hazards",  severity: "warn",  icon: "⚠️", desc: "Possible underground utilities, roots, or debris affecting post installation." },
    { id: "permit_issues",   label: "Permit complications", severity: "warn",  icon: "📄", desc: "Permit required or HOA approval needed before fencing work can begin." },
    { id: "aggressive_dog",  label: "Aggressive dog",       severity: "alert", icon: "🐕", desc: "Dog on property was aggressive or unsecured." },
  ],
  pool_service: [
    { id: "pool_access",     label: "Difficult pool access", severity: "warn",  icon: "🚧", desc: "Gate or yard access is tight — may affect equipment delivery or hose reach." },
    { id: "hoa_pool",        label: "HOA restrictions",      severity: "warn",  icon: "🏘️", desc: "HOA rules may affect work hours, chemical storage, or equipment on site." },
    { id: "chemical_hazard", label: "Chemical storage issues", severity: "warn", icon: "⚗️", desc: "Existing chemical storage on site was improper or created a safety concern." },
    { id: "old_equipment",   label: "Outdated equipment",    severity: "warn",  icon: "🔧", desc: "Pump, filter, or heater is outdated — additional parts or labor may be needed." },
    { id: "pool_dispute",    label: "Disputed scope",        severity: "bad",   icon: "📋", desc: "Homeowner disputed agreed scope or added work after job started." },
    { id: "unsafe_pool",     label: "Unsafe conditions",     severity: "bad",   icon: "⚠️", desc: "Electrical, structural, or chemical hazard present on site." },
  ],
};

export const getTagsForTrade = (trade) => {
  const specific = TRADE_SPECIFIC[trade] || TRADE_SPECIFIC.general;
  // Universal tags first, trade-specific appended, deduplicated by id
  const seen = new Set();
  return [...UNIVERSAL_TAGS, ...specific].filter(t => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });
};

export default getTagsForTrade;
