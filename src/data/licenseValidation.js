// ─────────────────────────────────────────────────────────────
// ProRated — License Number Validation
// Catches obvious fakes without blocking legitimate licenses
// ─────────────────────────────────────────────────────────────

// Known fake/test inputs to reject immediately
const OBVIOUS_FAKES = [
  "test", "none", "na", "n/a", "null", "undefined", "123", "1234",
  "00000000", "11111111", "22222222", "33333333", "44444444",
  "55555555", "66666666", "77777777", "88888888", "99999999",
  "abcdefgh", "aaaaaaaa", "license", "licensenum", "12345678",
  "123456789", "000000", "111111", "999999", "abc123",
];

// State-specific formats for our beta states
// pattern: regex, example, hint text
const STATE_FORMATS = {
  AL: {
    // ACLB (GC, roofing, specialty): 5–8 digit numbers
    // Electrical Board: E-XXXXX | Plumbing Board: PG-XXXXX | HVAC: H-XXXXX
    // General prefix pattern: 1–4 letters + optional dash + 3–8 digits
    pattern:  /^\d{5,10}$|^[A-Z]{1,4}[-\s]?\d{3,8}$|^[A-Z]{1,4}[-][A-Z]{1,4}[-]?\d{3,8}$/i,
    hint: "ACLB licenses are 5–8 digits. Electrical, plumbing, and HVAC licenses may have a letter prefix (e.g. E-12345).",
    examples: ["32085", "1234567", "E-12345", "PG-12345"],
  },
  FL: {
    // Florida DBPR: 2–4 letter prefix + 6–9 digits (CBC, CGC, CCC, CMC, EC, etc.)
    pattern:  /^[A-Z]{2,4}\d{5,9}$/i,
    hint: "",
    examples: ["CBC123456", "CGC1326092", "EC13005866"],
  },
  GA: {
    // Georgia: 2–6 letter prefix + 5–9 digits
    pattern:  /^[A-Z]{2,6}\d{5,9}$/i,
    hint: "",
    examples: ["GCCO123456", "EN123456"],
  },
  TN: {
    // Tennessee contractor licenses: 7–9 digits
    pattern:  /^\d{6,9}$/,
    hint:     "Tennessee licenses are typically 6–9 digits",
    examples: ["1234567", "12345678"],
  },
  TX: {
    // Texas: 3–8 letter prefix + 4–9 digits
    pattern:  /^[A-Z]{2,8}\d{4,9}$/i,
    hint: "",
    examples: ["TACLB012345", "TECL12345"],
  },
  CA: {
    // California CSLB: 6–7 digits, or optional letter prefix + 6–7 digits
    pattern:  /^\d{6,7}$|^[A-Z]\d{5,7}$/i,
    hint: "",
    examples: ["1012345", "B1234567"],
  },
  NC: {
    // North Carolina: 4–8 digits
    pattern:  /^\d{4,8}$/,
    hint:     "North Carolina licenses are 4–8 digits",
    examples: ["12345", "12345678"],
  },
  SC: {
    // South Carolina: digits or 1–4 letter prefix + digits
    pattern:  /^\d{4,8}$|^[A-Z]{1,4}\d{4,8}$/i,
    hint:     "South Carolina licenses are digits or a letter prefix + digits",
    examples: ["12345", "RBC12345"],
  },
  MS: {
    // Mississippi: 4–8 digits
    pattern:  /^\d{4,8}$/,
    hint:     "Mississippi licenses are 4–8 digits",
    examples: ["12345", "12345678"],
  },
};

// ── Main validation function ──────────────────────────────────
export const validateLicense = (license, state) => {
  const clean = (license || "").trim();

  // Must have something
  if (!clean) {
    return { valid: false, error: "License number is required" };
  }

  // Minimum length
  if (clean.length < 4) {
    return { valid: false, error: "License number must be at least 4 characters" };
  }

  // Maximum length
  if (clean.length > 25) {
    return { valid: false, error: "License number seems too long — please double check" };
  }

  // Must contain at least one digit
  if (!/\d/.test(clean)) {
    return { valid: false, error: "License numbers always contain at least one digit" };
  }

  // Must contain at least one letter or digit (not just special chars)
  if (!/[a-zA-Z0-9]/.test(clean)) {
    return { valid: false, error: "Please enter a valid license number" };
  }

  // Check against known fakes
  const lower = clean.toLowerCase().replace(/[-\s]/g, "");
  if (OBVIOUS_FAKES.includes(lower)) {
    return { valid: false, error: "Please enter your actual contractor license number" };
  }

  // All same character (e.g. "11111111" or "aaaaaaaa")
  const stripped = clean.replace(/[-\s]/g, "");
  if (stripped.length > 3 && new Set(stripped.toLowerCase()).size === 1) {
    return { valid: false, error: "Please enter your actual contractor license number" };
  }

  // Sequential numbers (12345678)
  const digitsOnly = clean.replace(/\D/g, "");
  if (digitsOnly.length >= 6) {
    let sequential = true;
    for (let i = 1; i < digitsOnly.length; i++) {
      if (parseInt(digitsOnly[i]) !== parseInt(digitsOnly[i-1]) + 1) {
        sequential = false; break;
      }
    }
    if (sequential) return { valid: false, error: "Please enter your actual contractor license number" };
  }

  // State-specific check — warn but don't hard block (in case our pattern is wrong)
  const stateFormat = STATE_FORMATS[state?.toUpperCase()];
  if (stateFormat && !stateFormat.pattern.test(clean.replace(/\s/g, ""))) {
    return {
      valid:   false,
      error:   `This license number format doesn't match standard ${state} license formats. Please double-check your license number.`,
      warning: true, // warning = soft block, user can override
      hint:    stateFormat.hint,
      examples: stateFormat.examples,
    };
  }

  return { valid: true };
};

// ── Business license validation (Tier 2 trades) ──────────────
// Business licenses are city/county issued — formats vary widely.
// We validate loosely: must be alphanumeric, >= 4 chars, not an obvious fake.
const BIZ_FAKES = [
  "test","none","na","n/a","null","123","1234","12345","abcde",
  "business","license","bl","mybusiness","company","000000","111111",
];
export const validateBusinessLicense = (license) => {
  const clean = (license || "").trim();
  if (!clean) return { valid: false, error: "Business license number is required" };
  if (clean.length < 4) return { valid: false, error: "Must be at least 4 characters" };
  if (!/[a-zA-Z0-9]/.test(clean)) return { valid: false, error: "Please enter a valid license number" };
  if (!/\d/.test(clean)) return { valid: false, error: "Business license numbers contain at least one digit" };
  const lower = clean.toLowerCase().replace(/[-\s]/g, "");
  if (BIZ_FAKES.includes(lower)) return { valid: false, error: "Please enter your actual business license number" };
  // All same character
  if (lower.length > 3 && new Set(lower).size === 1)
    return { valid: false, error: "Please enter your actual business license number" };
  return { valid: true };
};

// ── Get placeholder text for a state ─────────────────────────
export const getLicensePlaceholder = (state) => {
  const fmt = STATE_FORMATS[state?.toUpperCase()];
  if (fmt?.examples?.[0]) return `e.g. ${fmt.examples[0]}`;
  return "e.g. AL-C-12345";
};

// ── Get supported states list ─────────────────────────────────
export const SUPPORTED_STATES = Object.keys(STATE_FORMATS);
