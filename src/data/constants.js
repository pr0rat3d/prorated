// ─────────────────────────────────────────────────────────────
// ProRated — Configurable Plan Limits
// Change these values here to update across the entire app
// ─────────────────────────────────────────────────────────────
export const FREE_MONTHLY_LOOKUPS = 10;   // ← free tier monthly limit
export const PENDING_MONTHLY_LOOKUPS = 3;    // ← limit during verification period

// ── Company pricing tiers ─────────────────────────────────────
export const COMPANY_TIERS = {
  bronze:   { name: "Bronze",   price: 9.99,  seatLimit: 5,   icon: "🥉" },
  silver:   { name: "Silver",   price: 19.99, seatLimit: 15,  icon: "🥈" },
  gold:     { name: "Gold",     price: 29.99, seatLimit: 39,  icon: "🥇" },
  platinum: { name: "Platinum", price: null,  seatLimit: 999, icon: "💎", contact: true },
};

export const PROMO_CODES = {
  PRORATED2026: { days: 60, label: "2 months free applied!" },
};

// Anniversary reward threshold (reviews per 52 weeks)
export const ANNIVERSARY_REVIEW_THRESHOLD = 156; // 3/week × 52 weeks
export const PRO_MONTHLY_PRICE    = 19.99; // ← Bronze monthly price
export const PRO_PRICE_DISPLAY    = "$19.99"; // ← display string

// Helper — builds the plan label string used throughout the app
export const FREE_PLAN_LABEL = `Free · ${FREE_MONTHLY_LOOKUPS} lookups/month`;
// Annual billing removed — monthly only

export const APP_NAME   = "ProRated";
export const APP_DOMAIN = "prorated.io";
export const TAGLINE    = "Built by Pros, Built for Pros";

export const BRAND = {
  blue:    "#2563EB",
  blueLt:  "#3B82F6",
  green:   "#16A34A",
  greenLt: "#22C55E",
  dark:    "#0F172A",
  offwhite:"#F8FAFC",
  gray:    "#64748B",
  border:  "#E2E8F0",
};

export const TRADES = [
  // Tier 1 — State license required
  { id: "general",      label: "General Contractor", icon: "🏗️" },
  { id: "electrical",   label: "Electrical",          icon: "⚡" },
  { id: "plumbing",     label: "Plumbing",             icon: "🔧" },
  { id: "hvac",         label: "HVAC",                 icon: "❄️" },
  { id: "roofing",      label: "Roofing",              icon: "🏠" },
  // Tier 2 — Business license required
  { id: "painting",     label: "Painting",             icon: "🎨" },
  { id: "flooring",     label: "Flooring",             icon: "🟫" },
  { id: "pest_control", label: "Pest Control",         icon: "🐛" },
  { id: "landscaping",  label: "Landscaping",          icon: "🌿" },
  { id: "concrete",     label: "Concrete / Masonry",   icon: "🧱" },
  // Tier 2 — additional trades
  { id: "windows",      label: "Windows & Doors",        icon: "🪟" },
  { id: "foundation",   label: "Foundation",              icon: "🏚️" },
  { id: "siding",       label: "Siding & Exterior",       icon: "🏘️" },
  { id: "insulation",   label: "Insulation",                icon: "🧤" },
  { id: "garage_door",  label: "Garage Door Services",       icon: "🚪" },
  { id: "fencing",      label: "Fencing",                      icon: "🪧" },
  { id: "pool_service",  label: "Pool Service",                  icon: "🏊" },
];

export const RATING_CATEGORIES = [
  { id: "access",        label: "Access & Parking",       desc: "Driveway, staging area, truck clearance" },
  { id: "payment",       label: "Payment Reliability",    desc: "Paid on time, no disputes" },
  { id: "timeline",      label: "Timeline Respect",       desc: "Start dates honored, decisions made promptly" },
  { id: "communication", label: "Customer Communication", desc: "Responsive, clear, respectful interaction" },
  { id: "obstacles",     label: "Job Site Obstacles",     desc: "Pets, HOA, hazards, unexpected conditions" },
];

export const ISSUE_TAGS = [
  // ── Positive ──────────────────────────────────────────────
  { id: "pays_well",        label: "Pays on time",              severity: "good", desc: "Homeowner paid promptly with no disputes or delays." },
  { id: "easy_access",      label: "Easy access",               severity: "good", desc: "Driveway, staging area, and site entry were easy to work with." },
  { id: "great_owner",      label: "Great homeowner",           severity: "good", desc: "Homeowner was respectful, reasonable, and easy to work with overall." },
  { id: "friendly",         label: "Friendly",                  severity: "good", desc: "Homeowner had a positive, welcoming attitude toward the crew throughout the job." },
  { id: "understanding",    label: "Understanding",             severity: "good", desc: "Homeowner was flexible and reasonable when unexpected issues or changes came up." },
  { id: "no_hover",         label: "Didn't Hover",              severity: "good", desc: "Homeowner gave the crew space to work without micromanaging or interfering." },
  { id: "clear_scope",      label: "Scope was clear",           severity: "good", desc: "Project expectations were well-defined and didn't change during the job." },
  { id: "clear_expects",    label: "Clear Expectations",        severity: "good", desc: "Homeowner communicated exactly what they wanted upfront with no ambiguity." },
  { id: "great_comms",      label: "Great communication",       severity: "good", desc: "Homeowner was responsive and communicated clearly throughout the job." },
  { id: "reasonable_time",  label: "Reasonable Timeline",       severity: "good", desc: "Homeowner set a realistic schedule and didn't pressure the crew to rush." },
  { id: "pets_secured",     label: "Pets Secured",              severity: "good", desc: "Pets were properly contained and not a hazard or distraction during the job." },
  // ── Heads Up ──────────────────────────────────────────────
  { id: "steep_driveway",   label: "Steep driveway",            severity: "warn", desc: "Driveway grade may affect truck access, staging, or equipment delivery." },
  { id: "no_parking",       label: "No parking",                severity: "warn", desc: "Limited or no street/driveway parking for crew vehicles or trailers." },
  { id: "tight_access",     label: "Tight access",              severity: "warn", desc: "Narrow gates, fencing, or clearance issues that affect equipment or material delivery." },
  { id: "old_systems",      label: "Old wiring/plumbing",       severity: "warn", desc: "Existing systems are outdated and may require additional work or code upgrades." },
  { id: "hoa",              label: "HOA restrictions",          severity: "warn", desc: "HOA rules may affect work hours, materials, staging, or require written approval before starting." },
  // ── Concerns ──────────────────────────────────────────────
  { id: "inflexible",       label: "Inflexible Customer",       severity: "bad",  desc: "Homeowner refused reasonable adjustments even when circumstances required them." },
  { id: "rude_hostile",     label: "Rude / Hostile",            severity: "bad",  desc: "Homeowner displayed rude, hostile, or aggressive behavior toward the crew." },
  { id: "unreasonable",     label: "Unreasonable Demands",      severity: "bad",  desc: "Homeowner made demands outside the agreed scope or beyond what was reasonable." },
  { id: "unclear_scope",    label: "Unclear Scope / Changing",  severity: "bad",  desc: "Project scope was vague or kept changing throughout the job, making it hard to complete cleanly." },
  { id: "rushed_timeline",  label: "Rushed / Unrealistic Timeline", severity: "bad", desc: "Homeowner pushed for an unrealistic schedule that created pressure or quality risk." },
  { id: "aggressive_dog",   label: "Aggressive dog",            severity: "bad",  desc: "Dog on property was aggressive or unsecured — confirm pets are controlled before crew arrives." },
  { id: "pets_loose",       label: "Pets Loose / Aggressive",   severity: "bad",  desc: "Pets were unsecured or aggressive — a distraction or safety concern for the crew on site." },
  { id: "scope_creep",      label: "Scope creep",               severity: "bad",  desc: "Homeowner added work or changed project requirements after the job started." },
  { id: "slow_payment",     label: "Slow payment",              severity: "bad",  desc: "Payment was significantly delayed or required repeated follow-up after job completion." },
  { id: "micromanager",     label: "Micromanager",              severity: "bad",  desc: "Homeowner hovered over crew, interfered with work, or second-guessed decisions on site." },
  { id: "unsafe",           label: "Unsafe conditions",         severity: "bad",  desc: "Site had hazardous conditions — structural, chemical, electrical, or other safety concerns." },
  { id: "poor_comms",       label: "Poor communication",        severity: "bad",  desc: "Homeowner was unresponsive, unclear, or difficult to reach for decisions during the job." },
  { id: "delayed_start",    label: "Delayed start date",        severity: "bad",  desc: "Homeowner pushed back the agreed start date with little or no notice, wasting crew time." },
  { id: "site_hazards",     label: "Site hazards",              severity: "bad",  desc: "Unexpected on-site hazards such as debris, unstable ground, or access blockages." },
];

export const DEMO_ADDRESSES = [
  "412 Meadowbrook Dr, Vestavia Hills AL",
  "89 Birchwood Ln, Hoover AL",
  "1207 Ridgecrest Rd, Birmingham AL",
  "2445 Regent Lane, Hoover AL",
];

export const DASH_REVIEWS = [
  { id: "dr1", address: "412 Meadowbrook Dr, Vestavia Hills, AL", date: "2024-02-15", overall: 3, trade: "roofing", helpfulCount: 7,  tags: ["steep_driveway", "scope_creep", "pays_well"] },
  { id: "dr2", address: "89 Birchwood Ln, Hoover, AL",            date: "2024-03-10", overall: 5, trade: "roofing", helpfulCount: 19, tags: ["easy_access", "pays_well", "great_comms"] },
  { id: "dr3", address: "3401 Oak Hill Dr, Mountain Brook, AL",    date: "2024-04-22", overall: 4, trade: "roofing", helpfulCount: 11, tags: ["pays_well", "hoa"] },
];

export const AVATAR_PAL = [
  ["#DBEAFE","#1E40AF"],["#D1FAE5","#065F46"],["#FEF3C7","#92400E"],
  ["#FCE7F3","#9D174D"],["#EDE9FE","#5B21B6"],["#FFEDD5","#9A3412"],
];

// ─────────────────────────────────────────────────────────────
// PRE-LOADED DEMO DATA — instant results for the 3 demo addresses
// ─────────────────────────────────────────────────────────────
export const DEMO_DATA = {
  "412 Meadowbrook Dr, Vestavia Hills AL": {
    street: "412 Meadowbrook Dr",
    city: "Vestavia Hills",
    state: "AL",
    zip: "35226",
    overallScore: 3.1,
    reviewCount: 11,
    ratings: {
      access: 2.2,
      payment: 4.3,
      timeline: 2.8,
      communication: 3.1,
      obstacles: 2.4,
    },
    tags: ["steep_driveway", "scope_creep", "pays_well", "aggressive_dog", "hoa"],
    reviews: [
      {
        id: "r1",
        contractorName: "Mike R.",
        contractorInitials: "MR",
        trade: "roofing",
        date: "2024-11-12",
        overallScore: 2,
        tags: ["steep_driveway", "scope_creep"],
        text: "Driveway is extremely steep — had to hand-carry every bundle up from the street. Homeowner also added a full back porch re-roof mid-job without wanting to adjust the contract price. Took three conversations to get paid the correct amount.",
        helpfulCount: 14,
      },
      {
        id: "r2",
        contractorName: "Sarah K.",
        contractorInitials: "SK",
        trade: "painting",
        date: "2024-09-05",
        overallScore: 4,
        tags: ["pays_well", "hoa"],
        text: "Homeowner was pleasant and paid same day. HOA had strict rules about paint colors and required written approval before we could start — budget extra time for that process. Overall a good job site once the paperwork cleared.",
        helpfulCount: 9,
      },
      {
        id: "r3",
        contractorName: "Dave T.",
        contractorInitials: "DT",
        trade: "plumbing",
        date: "2024-07-22",
        overallScore: 3,
        tags: ["steep_driveway", "old_systems"],
        text: "Older home with original cast iron drains — plan for surprises behind the walls. Parking is a real issue; the steep driveway means you can't stage a truck there safely. Street parking only and it fills up fast in this neighborhood.",
        helpfulCount: 7,
      },
      {
        id: "r4",
        contractorName: "James L.",
        contractorInitials: "JL",
        trade: "electrical",
        date: "2025-01-08",
        overallScore: 3,
        tags: ["old_systems", "scope_creep", "pays_well"],
        text: "Knob and tube wiring throughout most of the house — definitely not what was described when I quoted it. Homeowner was understanding and we renegotiated the price fairly. They paid promptly once we agreed on the new scope.",
        helpfulCount: 11,
      },
    ],
  },

  "89 Birchwood Ln, Hoover AL": {
    street: "89 Birchwood Ln",
    city: "Hoover",
    state: "AL",
    zip: "35244",
    overallScore: 4.6,
    reviewCount: 6,
    ratings: {
      access: 4.8,
      payment: 4.9,
      timeline: 4.5,
      communication: 4.7,
      obstacles: 4.2,
    },
    tags: ["easy_access", "pays_well", "great_comms", "great_owner"],
    reviews: [
      {
        id: "r1",
        contractorName: "Chris M.",
        contractorInitials: "CM",
        trade: "roofing",
        date: "2025-02-14",
        overallScore: 5,
        tags: ["easy_access", "pays_well", "great_owner"],
        text: "Best job site I've worked all year. Wide flat driveway, easy staging, homeowner left cold water in the garage for the crew. Paid in full same day the job was done — no invoice chasing whatsoever. Would take this job again in a heartbeat.",
        helpfulCount: 19,
      },
      {
        id: "r2",
        contractorName: "Angela P.",
        contractorInitials: "AP",
        trade: "hvac",
        date: "2024-12-03",
        overallScore: 5,
        tags: ["great_comms", "easy_access", "pays_well"],
        text: "Homeowner was incredibly communicative — responded to every text within minutes and had the attic access cleared and ready when we arrived. Equipment staging was effortless. Check was waiting on the counter when we finished. Rare find.",
        helpfulCount: 16,
      },
      {
        id: "r3",
        contractorName: "Tony B.",
        contractorInitials: "TB",
        trade: "painting",
        date: "2024-10-19",
        overallScore: 4,
        tags: ["great_comms", "easy_access"],
        text: "Really smooth job from start to finish. Homeowner had already moved furniture away from the walls and covered their floors before we arrived — that kind of preparation makes a huge difference. Minor touch-up request was totally reasonable.",
        helpfulCount: 8,
      },
    ],
  },

  "2445 Regent Lane, Hoover AL": {
    street: "2445 Regent Lane",
    city: "Hoover",
    state: "AL",
    zip: "35226",
    overallScore: 4.8,
    reviewCount: 9,
    ratings: {
      access: 4.9,
      payment: 5.0,
      timeline: 4.7,
      communication: 4.9,
      obstacles: 4.6,
    },
    tags: ["easy_access", "pays_well", "great_comms", "great_owner", "clear_scope"],
    reviews: [
      {
        id: "r1",
        contractorName: "Mike R.",
        contractorInitials: "MR",
        trade: "roofing",
        date: "2025-03-10",
        overallScore: 5,
        tags: ["easy_access", "pays_well", "great_owner"],
        text: "One of the cleanest job sites I have worked in 15 years of roofing. Wide driveway, plenty of staging room, and the homeowner had everything cleared before we pulled up. Paid in full the same afternoon we finished. This is the gold standard.",
        helpfulCount: 21,
      },
      {
        id: "r2",
        contractorName: "Dana H.",
        contractorInitials: "DH",
        trade: "hvac",
        date: "2025-01-18",
        overallScore: 5,
        tags: ["great_comms", "pays_well", "clear_scope"],
        text: "Scope was crystal clear from the first call — no surprises, no add-ons, no games. Homeowner was reachable every time I needed a decision and made them fast. Check was ready at job completion. Wish every customer was this organized.",
        helpfulCount: 17,
      },
      {
        id: "r3",
        contractorName: "Carlos V.",
        contractorInitials: "CV",
        trade: "painting",
        date: "2024-12-05",
        overallScore: 5,
        tags: ["easy_access", "great_comms", "great_owner"],
        text: "Homeowner had furniture moved and colors pre-approved before we arrived. Never had a single interruption or change request mid-job. Tipped the crew at the end — that does not happen often. Highly recommend this address.",
        helpfulCount: 14,
      },
      {
        id: "r4",
        contractorName: "Steve B.",
        contractorInitials: "SB",
        trade: "electrical",
        date: "2025-02-22",
        overallScore: 5,
        tags: ["pays_well", "great_comms", "clear_scope"],
        text: "Panel upgrade went perfectly. Homeowner had the permit paperwork started before I even arrived which saved us a full day. Very communicative throughout and paid immediately on inspection sign-off. Easy return customer.",
        helpfulCount: 11,
      },
    ],
  },

  "1207 Ridgecrest Rd, Birmingham AL": {
    street: "1207 Ridgecrest Rd",
    city: "Birmingham",
    state: "AL",
    zip: "35213",
    overallScore: 2.4,
    reviewCount: 8,
    ratings: {
      access: 1.8,
      payment: 2.1,
      timeline: 2.6,
      communication: 1.9,
      obstacles: 3.2,
    },
    tags: ["slow_payment", "poor_comms", "no_parking", "micromanager", "site_hazards"],
    reviews: [
      {
        id: "r1",
        contractorName: "Ray G.",
        contractorInitials: "RG",
        trade: "general",
        date: "2025-01-15",
        overallScore: 1,
        tags: ["slow_payment", "poor_comms", "micromanager"],
        text: "Waited 47 days for final payment after repeated calls and texts — had to threaten a lien before money moved. Homeowner hovered constantly and questioned every decision on site. Would not return for any price. Proceed with extreme caution.",
        helpfulCount: 22,
      },
      {
        id: "r2",
        contractorName: "Marcus W.",
        contractorInitials: "MW",
        trade: "roofing",
        date: "2024-08-30",
        overallScore: 2,
        tags: ["no_parking", "site_hazards", "slow_payment"],
        text: "No place to park within two blocks — narrow residential street with no shoulder. Discovered rotted decking once we tore off shingles, which was expected, but homeowner disputed the change order for three weeks. There's also an unmarked well cover in the backyard that's a serious hazard.",
        helpfulCount: 18,
      },
      {
        id: "r3",
        contractorName: "Lisa F.",
        contractorInitials: "LF",
        trade: "plumbing",
        date: "2024-11-22",
        overallScore: 3,
        tags: ["poor_comms", "slow_payment"],
        text: "Communication was frustrating — homeowner took 2-3 days to respond to any question and wasn't available when decisions needed to be made. Job ended up stretching an extra week because of this. Payment came eventually but required multiple follow-ups.",
        helpfulCount: 13,
      },
      {
        id: "r4",
        contractorName: "Kevin S.",
        contractorInitials: "KS",
        trade: "electrical",
        date: "2025-03-01",
        overallScore: 3,
        tags: ["micromanager", "no_parking"],
        text: "Homeowner was on site the entire time watching every move and asking questions constantly. Not hostile, just exhausting. Parking situation is genuinely terrible — I ended up parking at a church two streets over both days. Pay was on time though.",
        helpfulCount: 10,
      },
    ],
  },
};

export const WORK_CATEGORIES = [
  {
    id: "roofing",
    label: "Roofing",
    icon: "🏠",
    items: [
      { id: "roof_full",    label: "Full roof replacement" },
      { id: "roof_repair",  label: "Roof repair" },
      { id: "roof_gutter",  label: "Gutter install / repair" },
      { id: "roof_skylight",label: "Skylight install" },
      { id: "roof_inspect", label: "Roof inspection" },
      { id: "roof_storm",   label: "Storm damage repair" },
      { id: "roof_flat",    label: "Flat roof" },
      { id: "roof_metal",   label: "Metal roof" },
      { id: "roof_shingle", label: "Shingle repair" },
      { id: "roof_soffit",  label: "Soffit & fascia repair" },
    ]
  },
  {
    id: "painting",
    label: "Painting",
    icon: "🎨",
    items: [
      { id: "paint_int_full", label: "Full interior paint" },
      { id: "paint_ext",      label: "Full exterior paint" },
      { id: "paint_accent",   label: "Accent walls" },
      { id: "paint_cabinet",  label: "Cabinet painting" },
      { id: "paint_deck",     label: "Deck / fence stain" },
      { id: "paint_pressure", label: "Pressure wash + paint" },
      { id: "paint_trim",     label: "Trim / baseboard" },
      { id: "paint_ceiling",  label: "Ceiling paint" },
      { id: "paint_epoxy",    label: "Garage floor epoxy" },
      { id: "paint_touch",    label: "Touch up work" },
    ]
  },
  {
    id: "plumbing",
    label: "Plumbing",
    icon: "🔧",
    items: [
      { id: "plumb_repipe",   label: "Full re-pipe" },
      { id: "plumb_heater",   label: "Water heater replacement" },
      { id: "plumb_drain",    label: "Drain cleaning" },
      { id: "plumb_leak",     label: "Leak repair" },
      { id: "plumb_bath",     label: "Bathroom plumbing" },
      { id: "plumb_kitchen",  label: "Kitchen plumbing" },
      { id: "plumb_sewer",    label: "Sewer line" },
      { id: "plumb_water",    label: "Water line" },
      { id: "plumb_fixture",  label: "Fixture install" },
      { id: "plumb_repair",   label: "Emergency repair" },
    ]
  },
  {
    id: "hvac",
    label: "HVAC",
    icon: "❄️",
    items: [
      { id: "hvac_full",     label: "Full system replacement" },
      { id: "hvac_ac",       label: "AC install" },
      { id: "hvac_furnace",  label: "Furnace install" },
      { id: "hvac_duct",     label: "Duct work" },
      { id: "hvac_mini",     label: "Mini split install" },
      { id: "hvac_repair",   label: "AC repair" },
      { id: "hvac_frepair",  label: "Furnace repair" },
      { id: "hvac_thermo",   label: "Thermostat install" },
      { id: "hvac_air",      label: "Air quality system" },
      { id: "hvac_maint",    label: "Seasonal maintenance" },
    ]
  },
  {
    id: "electrical",
    label: "Electrical",
    icon: "⚡",
    items: [
      { id: "elec_panel",   label: "Panel upgrade" },
      { id: "elec_rewire",  label: "Full rewire" },
      { id: "elec_new",     label: "New construction wiring" },
      { id: "elec_outlet",  label: "Outlet / switch install" },
      { id: "elec_light",   label: "Lighting installation" },
      { id: "elec_gen",     label: "Generator install" },
      { id: "elec_ev",      label: "EV charger install" },
      { id: "elec_fan",     label: "Ceiling fan install" },
      { id: "elec_smoke",   label: "Smoke detector install" },
      { id: "elec_repair",  label: "Repair / troubleshoot" },
    ]
  },
  {
    id: "water_damage",
    label: "Water Damage",
    icon: "💧",
    items: [
      { id: "water_remed",  label: "Remediation" },
      { id: "water_restore",label: "Restoration" },
      { id: "water_mold",   label: "Mold treatment" },
    ]
  },
  {
    id: "flooring",
    label: "Flooring",
    icon: "🟫",
    items: [
      { id: "floor_hard",    label: "Hardwood install" },
      { id: "floor_refinish",label: "Hardwood refinish" },
      { id: "floor_lvp",     label: "LVP install" },
      { id: "floor_tile",    label: "Tile install" },
      { id: "floor_carpet",  label: "Carpet install" },
      { id: "floor_remove",  label: "Carpet removal" },
      { id: "floor_sub",     label: "Subfloor repair" },
      { id: "floor_stair",   label: "Stair treads" },
      { id: "floor_grout",   label: "Grout repair" },
      { id: "floor_level",   label: "Floor leveling" },
    ]
  },
  {
    id: "windows",
    label: "Windows & Doors",
    icon: "🪟",
    items: [
      { id: "win_replace",    label: "Full window replacement" },
      { id: "win_single",     label: "Single window replace" },
      { id: "win_door",       label: "Door replacement" },
      { id: "win_entry",      label: "Entry door install" },
      { id: "win_patio",      label: "Patio / sliding door" },
      { id: "win_storm",      label: "Storm window install" },
      { id: "win_egress",     label: "Egress window" },
      { id: "win_seal",       label: "Seal / weatherstrip" },
      { id: "win_glass",      label: "Glass replacement" },
      { id: "win_screen",     label: "Screen repair / replace" },
    ]
  },
  {
    id: "foundation",
    label: "Foundation",
    icon: "🏚️",
    items: [
      { id: "found_crack",    label: "Crack repair" },
      { id: "found_waterproof",label: "Waterproofing" },
      { id: "found_pier",     label: "Pier / beam repair" },
      { id: "found_crawl",    label: "Crawl space encapsulation" },
      { id: "found_drain",    label: "Interior drainage system" },
      { id: "found_wall",     label: "Wall stabilization" },
      { id: "found_sump",     label: "Sump pump install" },
      { id: "found_level",    label: "House leveling" },
      { id: "found_pour",     label: "New foundation pour" },
      { id: "found_inspect",  label: "Foundation inspection" },
    ]
  },
  {
    id: "siding",
    label: "Siding & Exterior",
    icon: "🏘️",
    items: [
      { id: "sid_full",       label: "Full siding replacement" },
      { id: "sid_repair",     label: "Siding repair / patch" },
      { id: "sid_vinyl",      label: "Vinyl siding install" },
      { id: "sid_hardie",     label: "Hardie board install" },
      { id: "sid_wood",       label: "Wood siding install" },
      { id: "sid_soffit",     label: "Soffit & fascia" },
      { id: "sid_trim",       label: "Exterior trim" },
      { id: "sid_wrap",       label: "House wrap / moisture barrier" },
      { id: "sid_paint",      label: "Exterior repaint" },
      { id: "sid_storm",      label: "Storm damage repair" },
    ]
  },
  {
    id: "insulation",
    label: "Insulation",
    icon: "🧤",
    items: [
      { id: "ins_attic",      label: "Attic insulation" },
      { id: "ins_wall",       label: "Wall insulation" },
      { id: "ins_crawl",      label: "Crawl space insulation" },
      { id: "ins_spray",      label: "Spray foam" },
      { id: "ins_blown",      label: "Blown-in insulation" },
      { id: "ins_batt",       label: "Batt / roll insulation" },
      { id: "ins_rigid",      label: "Rigid board insulation" },
      { id: "ins_remove",     label: "Old insulation removal" },
      { id: "ins_vapor",      label: "Vapor barrier" },
      { id: "ins_audit",      label: "Energy audit / inspection" },
    ]
  },
  {
    id: "pest_control",
    label: "Pest Control",
    icon: "🐛",
    items: [
      { id: "pest_general",  label: "General pest treatment" },
      { id: "pest_termite",  label: "Termite treatment" },
      { id: "pest_inspect",  label: "Termite inspection" },
      { id: "pest_rodent",   label: "Rodent control" },
      { id: "pest_bed",      label: "Bed bug treatment" },
      { id: "pest_mosquito", label: "Mosquito treatment" },
      { id: "pest_wildlife", label: "Wildlife removal" },
      { id: "pest_crawl",    label: "Crawl space treatment" },
      { id: "pest_pretreат", label: "Pre-treatment (new construction)" },
      { id: "pest_monthly",  label: "Monthly service" },
    ]
  },
  {
    id: "landscaping",
    label: "Landscaping",
    icon: "🌿",
    items: [
      { id: "land_design",   label: "Full yard design" },
      { id: "land_sod",      label: "Sod install" },
      { id: "land_irrig",    label: "Irrigation system" },
      { id: "land_tree_rm",  label: "Tree removal" },
      { id: "land_tree_tr",  label: "Tree trimming" },
      { id: "land_mulch",    label: "Mulch / bed work" },
      { id: "land_wall",     label: "Retaining wall" },
      { id: "land_drain",    label: "Drainage solution" },
      { id: "land_clean",    label: "Seasonal cleanup" },
      { id: "land_maint",    label: "Lawn maintenance" },
    ]
  },
  {
    id: "concrete",
    label: "Concrete / Masonry",
    icon: "🧱",
    items: [
      { id: "conc_drive",    label: "Driveway pour" },
      { id: "conc_walk",     label: "Sidewalk pour" },
      { id: "conc_patio",    label: "Patio slab" },
      { id: "conc_found",    label: "Foundation repair" },
      { id: "conc_block",    label: "Block wall" },
      { id: "conc_brick",    label: "Brick work" },
      { id: "conc_chimney",  label: "Chimney repair" },
      { id: "conc_repair",   label: "Concrete repair" },
      { id: "conc_stamp",    label: "Stamped concrete" },
      { id: "conc_retain",   label: "Retaining wall" },
    ]
  },
  {
    id: "garage_door",
    label: "Garage Door Services",
    icon: "🚪",
    items: [
      { id: "gd_replace",    label: "Full door replacement" },
      { id: "gd_install",    label: "New door install" },
      { id: "gd_opener",     label: "Opener install / replacement" },
      { id: "gd_spring",     label: "Spring replacement" },
      { id: "gd_cable",      label: "Cable repair" },
      { id: "gd_panel",      label: "Panel repair / replacement" },
      { id: "gd_track",      label: "Track repair / alignment" },
      { id: "gd_sensor",     label: "Safety sensor install" },
      { id: "gd_smart",      label: "Smart / WiFi opener" },
      { id: "gd_service",    label: "General service / tune-up" },
    ]
  },
  {
    id: "pool_service",
    label: "Pool Service",
    icon: "🏊",
    items: [
      { id: "pool_install",    label: "New pool installation" },
      { id: "pool_repair",     label: "Pool repair" },
      { id: "pool_resurfacing",label: "Resurfacing / replastering" },
      { id: "pool_equipment",  label: "Equipment service" },
      { id: "pool_cleaning",   label: "Cleaning / maintenance" },
      { id: "pool_opening",    label: "Seasonal opening" },
      { id: "pool_closing",    label: "Seasonal closing" },
      { id: "pool_leak",       label: "Leak detection / repair" },
    ]
  },
  {
    id: "fencing",
    label: "Fencing",
    icon: "🪧",
    items: [
      { id: "fence_new",     label: "New fence installation" },
      { id: "fence_repair",  label: "Fence repair" },
      { id: "fence_remove",  label: "Fence removal" },
      { id: "fence_gate",    label: "Gate addition / repair" },
    ]
  },
  {
    id: "general",
    label: "General Contracting",
    icon: "🏗️",
    items: [
      { id: "gen_new",       label: "New construction" },
      { id: "gen_reno",      label: "Full home renovation" },
      { id: "gen_addition",  label: "Room addition" },
      { id: "gen_kitchen",   label: "Kitchen remodel" },
      { id: "gen_bath",      label: "Bathroom remodel" },
      { id: "gen_basement",  label: "Basement finish" },
      { id: "gen_garage",    label: "Garage conversion" },
      { id: "gen_deck",      label: "Deck / patio build" },
      { id: "gen_fence",     label: "Fence installation" },
      { id: "gen_foundation",label: "Foundation work" },
    ]
  },
];

// ── Trade licensing requirements ─────────────────────────────
// Defines verification tier for each trade
export const TRADE_LICENSE_REQUIREMENTS = {
  // Tier 1 — State license required and verifiable
  electrical:   { tier: 1, required: true,  label: "State Electrical License #",  hint: "Verified with AL Electrical Contractors Board",    example: "E-12345"      },
  plumbing:     { tier: 1, required: true,  label: "State Plumbing License #",     hint: "Verified with AL Plumbers & Gas Fitters Board",    example: "PG-12345"     },
  hvac:         { tier: 1, required: true,  label: "State HVAC License #",         hint: "Verified with AL HVAC Board",                      example: "H-12345"      },
  general:      { tier: 1, required: true,  label: "AL Contractor License #",      hint: "Verified with AL Contractors Licensing Board",     example: "1234567"      },
  concrete:     { tier: 1, required: true,  label: "AL Contractor License #",      hint: "Verified with AL Contractors Licensing Board",     example: "1234567"      },

  // Roofing — falls under GC license in Alabama
  roofing:      { tier: 1, required: true,  label: "AL Contractor License #",        hint: "Roofing falls under AL GC licensing requirements",  example: "1234567"   },

  // Tier 2 — Business license required
  painting:     { tier: 2, required: true,  label: "Business License #",             hint: "Enter your city or county business license number",  example: "BL-12345"  },
  flooring:     { tier: 2, required: true,  label: "Business License #",             hint: "Enter your city or county business license number",  example: "BL-12345"  },
  pest_control: { tier: 2, required: true,  label: "Business License #",             hint: "Enter your city or county business license number",  example: "BL-12345"  },
  landscaping:  { tier: 2, required: true,  label: "Business License #",             hint: "Enter your city or county business license number",  example: "BL-12345"  },
  windows:      { tier: 2, required: true,  label: "Business License #",             hint: "Enter your city or county business license number",  example: "BL-12345"  },
  foundation:   { tier: 1, required: true,  label: "AL Contractor License #",        hint: "Foundation work requires an AL GC or Structural license", example: "1234567" },
  siding:       { tier: 2, required: true,  label: "Business License #",             hint: "Enter your city or county business license number",  example: "BL-12345"  },
  insulation:   { tier: 2, required: true,  label: "Business License #",             hint: "Enter your city or county business license number",  example: "BL-12345"  },
  garage_door:  { tier: 2, required: true,  label: "Business License #",             hint: "Enter your city or county business license number",  example: "BL-12345"  },
  fencing:      { tier: 2, required: true,  label: "Business License #",             hint: "Enter your city or county business license number",  example: "BL-12345"  },
  pool_service:  { tier: 2, required: true,  label: "Business License #",             hint: "Enter your city or county business license number",  example: "BL-12345"  },
};

// Helper — get requirement for a trade
export const getLicenseRequirement = (tradeId) => {
  return TRADE_LICENSE_REQUIREMENTS[tradeId] || 
    { tier: 2, required: false, label: "Business License # (optional)", hint: "Enter your business license if you have one", example: "BL-12345" };
};

// Tier 1 trades — state license required
export const TIER_1_TRADES = Object.entries(TRADE_LICENSE_REQUIREMENTS)
  .filter(([, v]) => v.tier === 1)
  .map(([k]) => k);

// Tier 2 trades — business license required
export const TIER_2_TRADES = Object.entries(TRADE_LICENSE_REQUIREMENTS)
  .filter(([, v]) => v.tier === 2)
  .map(([k]) => k);

// ── Trust Score Calculation ───────────────────────────────────
export const TRUST_TIERS = [
  { min: 90, max: 100, label: "Verified Pro",  badge: "🛡️", color: "#7C3AED" },
  { min: 75, max: 89,  label: "Elite",          badge: "🟡", color: "#D97706" },
  { min: 50, max: 74,  label: "Trusted",        badge: "🟢", color: "#16A34A" },
  { min: 25, max: 49,  label: "Established",    badge: "🔵", color: "#2563EB" },
  { min: 0,  max: 24,  label: "New Member",     badge: "⚪", color: "#64748B" },
];

export const calculateTrustScore = ({ reviewCount = 0, helpfulVotes = 0, accountAgeDays = 0, licenseVerified = false, reviewsWithDetail = 0, reportedCount = 0 }) => {
  let pts = 0;
  pts += Math.min(reviewCount * 10, 400);
  pts += Math.min(helpfulVotes * 5, 200);
  pts += Math.min(Math.floor(accountAgeDays / 30) * 2, 100);
  pts += licenseVerified ? 50 : 0;
  pts += Math.min(reviewsWithDetail * 3, 150);
  pts += reportedCount === 0 && reviewCount > 0 ? 100 : 0;
  pts -= reportedCount * 50;
  const score = Math.max(0, Math.min(100, Math.round(pts / 10)));
  const tier = TRUST_TIERS.find(t => score >= t.min && score <= t.max) || TRUST_TIERS[4];
  return { score, ...tier };
};

export const getTrustTier = (score) => {
  return TRUST_TIERS.find(t => score >= t.min && score <= t.max) || TRUST_TIERS[4];
};

export const VERIFIED_PRO_MIN_SCORE = 75;
