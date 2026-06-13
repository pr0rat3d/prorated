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
    pattern:  /^\d{6,8}$|^[A-Z]{1,4}[-]?\d{4,8}$/i,
    hint:     "Alabama licenses are typically 6-8 digits (e.g. 1234567) or letter prefix + digits (e.g. AL-C-12345)",
    examples: ["1234567", "AL-C-12345", "GC-12345"],
  },
  FL: {
    pattern:  /^[A-Z]{2,4}\d{6,8}$/i,
    hint:     "Florida licenses start with 2-4 letters followed by 6-8 digits (e.g. CBC123456)",
    examples: ["CBC123456", "EC13005866"],
  },
  GA: {
    pattern:  /^[A-Z]{2,5}\d{5,8}$/i,
    hint:     "Georgia licenses start with letters followed by digits (e.g. GCCO123456)",
    examples: ["GCCO123456", "EN123456"],
  },
  TN: {
    pattern:  /^\d{7,9}$/,
    hint:     "Tennessee licenses are 7-9 digits",
    examples: ["12345678"],
  },
  TX: {
    pattern:  /^[A-Z]{3,8}\d{4,8}$/i,
    hint:     "Texas licenses start with letters followed by digits (e.g. TACLB012345)",
    examples: ["TACLB012345", "TECL12345"],
  },
  CA: {
    pattern:  /^\d{7}$|^[A-Z]\d{6,7}$/i,
    hint:     "California licenses are 7 digits or a letter + 6-7 digits (e.g. 1012345)",
    examples: ["1012345", "B1234567"],
  },
  NC: {
    pattern:  /^\d{5,8}$/,
    hint:     "North Carolina licenses are 5-8 digits",
    examples: ["12345", "12345678"],
  },
  SC: {
    pattern:  /^\d{5,8}$|^[A-Z]{1,3}\d{5,8}$/i,
    hint:     "South Carolina licenses are digits or letter prefix + digits",
    examples: ["12345", "RBC12345"],
  },
  MS: {
    pattern:  /^\d{5,8}$/,
    hint:     "Mississippi licenses are 5-8 digits",
    examples: ["12345678"],
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
      error:   `This doesn't look like a valid ${state} license. ${stateFormat.hint}`,
      warning: true, // warning = soft block, user can override
      hint:    stateFormat.hint,
      examples: stateFormat.examples,
    };
  }

  return { valid: true };
};

// ── Business license validation (Tier 2 trades) ──────────────
export const validateBusinessLicense = (license) => {
  const clean = (license || "").trim();
  if (!clean) return { valid: false, error: "Business license number is required" };
  if (clean.length < 4) return { valid: false, error: "Must be at least 4 characters" };
  if (!/[a-zA-Z0-9]/.test(clean)) return { valid: false, error: "Please enter a valid license number" };
  const lower = clean.toLowerCase().replace(/[-\s]/g, "");
  if (["test","none","na","123","12345","abcde"].includes(lower))
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
