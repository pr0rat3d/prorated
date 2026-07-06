import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../../config.js";
import { useState, useEffect } from "react";
import { BRAND } from "../../components/UI";
import Logo from "../../components/Logo";
import { dbGet, adminPost, adminPatch, adminDelete } from "../../api/db";

const STATE_LICENSE_URLS = {
  AL: "https://genlic.alabama.gov/contractor/public/index.cfm?action=search&licenseNumber={license}",
  FL: "https://www.myfloridalicense.com/LicenseDetail.asp?SID=&id={license}",
  GA: "https://verify.sos.ga.gov/verification/Search.aspx?facility={license}",
  TN: "https://verify.tn.gov/contractor?license={license}",
};
const getLicenseUrl = (state, license) => {
  const t = STATE_LICENSE_URLS[state?.toUpperCase()];
  return t && license ? t.replace("{license}", encodeURIComponent(license)) : null;
};

// All DB calls route through /api/db — no keys in frontend
const SUPA_URL = "https://wsdrbdojnzmtwndswpwr.supabase.co";
const sb = async (path) => {
  try {
    const token = sessionStorage.getItem("pr_admin_auth");
    const adminPass = token ? atob(token).split(":")[0] : null;
    // Try direct Supabase call with admin op header via /api/db
    const res = await fetch("/api/db", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(adminPass ? { "x-admin-op": adminPass } : {}),
      },
      body: JSON.stringify({ path, method: "GET" }),
    });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
    return [];
  } catch { return []; }
};
const patch = async (table, id, data) => adminPatch(`/${table}`, data, { id: `eq.${id}` });
const del   = async (table, id) => adminDelete(`/${table}`, { id: `eq.${id}` });

// ── Shared UI helpers ────────────────────────────────────────
const Badge = ({ children, color = "#EFF6FF", text = "#1E40AF" }) => (
  <span style={{ background: color, color: text, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8, whiteSpace: "nowrap" }}>
    {children}
  </span>
);

const Btn = ({ children, onClick, color = BRAND.blue, small }) => (
  <button onClick={onClick}
    style={{ background: color, color: "#fff", border: "none", padding: small ? "4px 10px" : "6px 14px", borderRadius: 8, fontSize: small ? 11 : 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>
    {children}
  </button>
);

const Row = ({ children, faded }) => (
  <div style={{ background: faded ? "#F8FAFC" : "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 12, padding: "0.9rem 1rem", marginBottom: "0.6rem", opacity: faded ? 0.6 : 1 }}>
    {children}
  </div>
);

const SectionHead = ({ title, count }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <h2 style={{ fontSize: 16, fontWeight: 800, color: BRAND.dark, margin: 0 }}>{title}</h2>
    {count !== undefined && <Badge color="#F1F5F9" text={BRAND.gray}>{count}</Badge>}
  </div>
);

const Empty = ({ msg = "Nothing here yet" }) => (
  <div style={{ textAlign: "center", padding: "3rem", color: BRAND.gray, fontSize: 13 }}>{msg}</div>
);

// ── User Row (contractors) ───────────────────────────────────
function UserRow({ user: u, onApprove, onReject, onCompleteDelete, onAdminDelete, onChangePlan, onResendWelcome, onSaveNotes, onForceRemoveCompany, onViewReviews, reviewCount = 0, companies = [] }) {
  const [expanded, setExpanded] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [notes, setNotes] = useState(u.admin_notes || "");
  const [notesSaved, setNotesSaved] = useState(false);
  const licUrl = getLicenseUrl(u.state, u.license_number);

  const statusColor = u.status === "approved" ? { bg: "#DCFCE7", text: "#166534" }
    : u.status === "rejected"  ? { bg: "#FEE2E2", text: "#991B1B" }
    : { bg: "#FEF9C3", text: "#854D0E" };

  return (
    <Row faded={u.deleted}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark }}>{u.name || "Unnamed"}</span>
            <Badge color={statusColor.bg} text={statusColor.text}>
              {u.status === "approved" ? "✓ Verified" : u.status === "rejected" ? "✗ Rejected" : "⏳ Pending"}
            </Badge>
            <Badge color="#F0F4FF" text="#3730A3">🔨 Trade Pro</Badge>
            {u.trade && <Badge color="#F8FAFC" text={BRAND.gray}>{u.trade}</Badge>}
            {u.deletion_requested && <Badge color="#FEE2E2" text="#991B1B">🗑️ Deletion Requested</Badge>}

            {u.plan === "bronze" && <Badge color="#FFFBEB" text="#B45309">🥉 Bronze</Badge>}
            {u.plan === "silver" && <Badge color="#F8FAFC" text="#475569">🥈 Silver</Badge>}
            {u.plan === "gold"     && <Badge color="#FFFBEB" text="#92400E">🥇 Gold</Badge>}
            {u.plan === "platinum" && <Badge color="#EFF6FF" text="#1E3A8A">💎 Platinum</Badge>}
            {u.pro_expires_at && new Date(u.pro_expires_at) > new Date() && <Badge color="#F0FDF4" text="#166534">⭐ Pro (legacy)</Badge>}
          </div>
          <div style={{ fontSize: 11, color: BRAND.gray, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span>📧 {u.email || "—"}</span>
            <span>📍 {u.state || "—"}</span>
            <span>📅 {u.created_at ? new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</span>

            {u.company_id && <span>🏗️ Company account</span>}
            {u.company_role === "owner" && <Badge color="#EFF6FF" text="#1E40AF">Owner</Badge>}
            {u.company_role === "member" && <Badge color="#F0FDF4" text="#166534">Team member</Badge>}
          </div>
          {expanded && (
            <div style={{ marginTop: 10, padding: "10px 12px", background: "#F8FAFC", borderRadius: 8, fontSize: 11, color: BRAND.gray, lineHeight: 1.8 }}>
              <div><strong>License #:</strong> {u.license_number || (u.company_role === "member" ? "No license (team member)" : "—")}
                {licUrl && u.license_number && <a href={licUrl} target="_blank" rel="noreferrer" style={{ marginLeft: 8, color: BRAND.blue }}>Verify ↗</a>}
              </div>
              <div><strong>Trade:</strong> {u.trade || "—"}</div>
              <div><strong>Phone:</strong> {u.phone || "—"}</div>
              <div><strong>Plan:</strong> {
                u.plan === "bronze" ? "🥉 Bronze" :
                u.plan === "silver" ? "🥈 Silver" :
                u.plan === "gold"   ? "🥇 Gold" :
                u.plan === "platinum" ? "💎 Platinum" :
                "Free"
              }</div>
              <div><strong>Account Type:</strong> {u.account_type === "company" ? "🏗️ Company" : "👤 Solo"}</div>
              {u.company_id && (
                <div><strong>Company:</strong> {companies.find(c => c.id === u.company_id)?.name || u.company_id.slice(0, 8)} · <strong>Role:</strong> {u.company_role || "member"}</div>
              )}
              <div><strong>Promo Code:</strong> {u.promo_code || "—"}</div>
              <div><strong>Trust Score:</strong> {u.trust_score ?? "—"}</div>
              <div><strong>User ID:</strong> <span style={{ fontFamily: "monospace" }}>{u.id}</span></div>
              <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600 }}>Change plan:</span>
                <select defaultValue={u.plan || "free"} onChange={e => onChangePlan && onChangePlan(u.id, e.target.value)}
                  style={{ fontSize: 11, padding: "3px 6px", borderRadius: 6, border: `1px solid ${BRAND.border}`, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>
                  <option value="free">Free</option>
                  <option value="bronze">🥉 Bronze</option>
                  <option value="silver">🥈 Silver</option>
                  <option value="gold">🥇 Gold</option>
                  <option value="platinum">💎 Platinum</option>
                </select>
                {u.status === "approved" && onResendWelcome && (
                  <button onClick={() => onResendWelcome(u.id)}
                    style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, border: `1px solid ${BRAND.border}`, background: "#F8FAFC", color: BRAND.dark, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    📧 Resend Welcome
                  </button>
                )}
                {onViewReviews && (
                  <button onClick={() => onViewReviews(u.id, u.name || u.email)}
                    style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, border: `1px solid ${BRAND.border}`, background: "#F8FAFC", color: BRAND.dark, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    ⭐ View Reviews ({reviewCount})
                  </button>
                )}
                {u.company_id && onForceRemoveCompany && (
                  <button onClick={() => onForceRemoveCompany(u.id, u.name || u.email)}
                    style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, border: "1px solid #FCA5A5", background: "#FEF2F2", color: "#DC2626", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    🏗️ Force-remove from company
                  </button>
                )}
              </div>
              {onSaveNotes && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Admin notes (internal only):</div>
                  <textarea value={notes} onChange={e => { setNotes(e.target.value); setNotesSaved(false); }}
                    placeholder="Internal notes about this trade pro..."
                    rows={2}
                    style={{ width: "100%", padding: "6px 8px", border: `1px solid ${BRAND.border}`, borderRadius: 6, fontSize: 11, fontFamily: "'DM Sans', sans-serif", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
                  <button onClick={() => { onSaveNotes(u.id, notes); setNotesSaved(true); }}
                    style={{ marginTop: 4, fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, border: "none", background: notesSaved ? "#DCFCE7" : BRAND.blue, color: notesSaved ? "#166534" : "#fff", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    {notesSaved ? "✓ Saved" : "Save note"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
          <Btn small color="#64748B" onClick={() => setExpanded(e => !e)}>{expanded ? "Less" : "Details"}</Btn>
          {(!u.status || u.status === "pending") && <>
            <Btn small color="#16A34A" onClick={() => onApprove(u.id)}>✓ Approve</Btn>
            <Btn small color="#DC2626" onClick={() => setRejecting(r => !r)}>✗ Reject</Btn>
          </>}
          {u.deletion_requested && <Btn small color="#7C3AED" onClick={() => onCompleteDelete(u.id)}>Complete Deletion</Btn>}
          {!u.deleted && <Btn small color="#DC2626" onClick={() => onAdminDelete(u.id, u.name)}>🗑️ Delete</Btn>}
        </div>
      </div>
      {rejecting && (
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
            placeholder="Rejection reason (optional)"
            style={{ flex: 1, padding: "7px 10px", border: `1px solid ${BRAND.border}`, borderRadius: 8, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
          <Btn small color="#DC2626" onClick={() => { onReject(u.id, rejectReason); setRejecting(false); }}>Confirm Reject</Btn>
        </div>
      )}
    </Row>
  );
}

// ── Realtor Row ──────────────────────────────────────────────
function RealtorRow({ realtor: r, onUpgrade, onDowngrade }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Row>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark }}>{r.name || r.email || "Unnamed Realtor"}</span>
            <Badge color="#FEF3C7" text="#92400E">🏡 Realtor</Badge>
            <Badge color={r.plan === "pro" ? "#F0FDF4" : "#F8FAFC"} text={r.plan === "pro" ? "#166534" : BRAND.gray}>
              {r.plan === "pro" ? "⭐ Pro" : "Free"}
            </Badge>
          </div>
          <div style={{ fontSize: 11, color: BRAND.gray, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span>📧 {r.email || "—"}</span>
            <span>🔍 {r.lookup_count ?? 0} lookups</span>
            <span>📅 {r.created_at ? new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</span>
          </div>
          {expanded && (
            <div style={{ marginTop: 10, padding: "10px 12px", background: "#F8FAFC", borderRadius: 8, fontSize: 11, color: BRAND.gray, lineHeight: 1.8 }}>
              <div><strong>User ID:</strong> <span style={{ fontFamily: "monospace" }}>{r.user_id || r.id}</span></div>
              <div><strong>Plan:</strong> {r.plan || "free"}</div>
              <div><strong>Lookups this month:</strong> {r.lookup_count ?? 0}</div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <Btn small color="#64748B" onClick={() => setExpanded(e => !e)}>{expanded ? "Less" : "Details"}</Btn>
          {r.plan !== "pro"
            ? <Btn small color="#16A34A" onClick={() => onUpgrade(r.id || r.user_id)}>↑ Upgrade Pro</Btn>
            : <Btn small color="#64748B" onClick={() => onDowngrade(r.id || r.user_id)}>↓ Downgrade</Btn>}
        </div>
      </div>
    </Row>
  );
}

// ── Review Row ───────────────────────────────────────────────
function ReviewRow({ review: r, onDelete, onToggleDisputed, editRequests = [], onResolveEditRequest }) {
  const [expanded, setExpanded] = useState(false);
  const score = r.overall_score;
  const scoreColor = score >= 4 ? "#166534" : score >= 3 ? "#854D0E" : "#991B1B";
  const myEditReqs = editRequests.filter(e => e.review_id === r.id);

  return (
    <Row faded={r.disputed}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark }}>{r.address || "Unknown address"}</span>
            <Badge color={score >= 4 ? "#DCFCE7" : score >= 3 ? "#FEF9C3" : "#FEE2E2"}
              text={scoreColor}>★ {score?.toFixed(1) || "—"}</Badge>
            {r.work_label && <Badge color="#F0F4FF" text="#3730A3">{r.work_label}</Badge>}
            {myEditReqs.length > 0 && <Badge color="#FEF3C7" text="#92400E">✏️ {myEditReqs.length} edit request{myEditReqs.length > 1 ? "s" : ""}</Badge>}
            {r.disputed && <Badge color="#FEE2E2" text="#991B1B">🚩 Disputed</Badge>}
          </div>
          <div style={{ fontSize: 11, color: BRAND.gray, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span>👤 {r.user_id?.slice(0, 8) || "Anonymous"}</span>
            <span>🔨 {r.trade || "—"}</span>
            <span>📅 {r.created_at ? new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</span>
          </div>
          {expanded && (
            <div style={{ marginTop: 10 }}>
              <div style={{ padding: "10px 12px", background: "#F8FAFC", borderRadius: 8, fontSize: 11, color: BRAND.gray, lineHeight: 1.8, marginBottom: 8 }}>
                <div><strong>Notes:</strong> {r.notes || "—"}</div>
                <div><strong>Payment:</strong> {r.payment_score}/5 · <strong>Access:</strong> {r.access_score}/5 · <strong>Communication:</strong> {r.communication_score}/5</div>
                <div><strong>Timeline:</strong> {r.timeline_score}/5 · <strong>Obstacles:</strong> {r.obstacles_score}/5</div>
                <div><strong>Review ID:</strong> <span style={{ fontFamily: "monospace" }}>{r.id}</span></div>
              </div>
              {myEditReqs.map(er => (
                <div key={er.id} style={{ background: er.resolved ? "#F0FDF4" : "#FFFBEB", border: `1px solid ${er.resolved ? "#86EFAC" : "#FCD34D"}`, borderRadius: 8, padding: "8px 12px", marginBottom: 6, fontSize: 11 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700, color: er.resolved ? "#166534" : "#92400E", marginBottom: 4 }}>
                        {er.resolved ? "✓ Resolved" : "✏️ Edit Request"} — {new Date(er.created_at).toLocaleDateString()}
                      </div>
                      <div style={{ color: BRAND.gray }}>{er.reason || "No reason provided"}</div>
                    </div>
                    {!er.resolved && onResolveEditRequest && (
                      <button onClick={() => onResolveEditRequest(er.id)}
                        style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, border: "1px solid #86EFAC", background: "#F0FDF4", color: "#166534", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0, marginLeft: 8 }}>
                        ✓ Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <Btn small color="#64748B" onClick={() => setExpanded(e => !e)}>{expanded ? "Less" : "Details"}</Btn>
          {onToggleDisputed && (
            <Btn small color={r.disputed ? "#64748B" : "#D97706"} onClick={() => onToggleDisputed(r.id, r.disputed)}>
              {r.disputed ? "Clear Dispute" : "🚩 Flag Disputed"}
            </Btn>
          )}
          <Btn small color="#DC2626" onClick={() => onDelete(r.id)}>Delete</Btn>
        </div>
      </div>
    </Row>
  );
}

// ── Supplier Tab ─────────────────────────────────────────────
function SupplierTab({ suppliers, setSuppliers, toggleActive, onDelete, flash }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [saving, setSaving]     = useState(false);
  const blank = { name: "", category: "", address: "", phone: "", website: "", description: "", states: "", radius_miles: "", tier: "free", monthly_fee: "", expires_at: "", active: true };
  const [form, setForm]         = useState(blank);
  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const openAdd = () => { setForm(blank); setEditId(null); setShowForm(true); };
  const openEdit = (s) => {
    setForm({ ...s, states: Array.isArray(s.states) ? s.states.join(", ") : (s.states || ""), expires_at: s.expires_at ? s.expires_at.slice(0, 10) : "" });
    setEditId(s.id); setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form, states: form.states ? form.states.split(",").map(s => s.trim()).filter(Boolean) : [], radius_miles: form.radius_miles ? Number(form.radius_miles) : null, monthly_fee: form.monthly_fee ? Number(form.monthly_fee) : null, expires_at: form.expires_at || null };
    if (editId) {
      await adminPatch("/featured_suppliers", payload, { id: `eq.${editId}` });
      setSuppliers(ss => ss.map(s => s.id === editId ? { ...s, ...payload } : s));
      flash(true, "Supplier updated");
    } else {
      const result = await adminPost("/featured_suppliers", payload);
      if (result?.id) setSuppliers(ss => [...ss, result]);
      flash(true, "Supplier added");
    }
    setSaving(false); setShowForm(false); setEditId(null);
  };

  const inp = { width: "100%", padding: "8px 10px", border: `1px solid ${BRAND.border}`, borderRadius: 8, fontSize: 12, fontFamily: "'DM Sans', sans-serif", marginBottom: 8, outline: "none", boxSizing: "border-box", background: "#F8FAFC", color: BRAND.dark };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <SectionHead title="Featured Suppliers" count={suppliers.length} />
        <button onClick={openAdd} style={{ background: BRAND.blue, color: "#fff", border: "none", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>+ Add Supplier</button>
      </div>
      <div style={{ fontSize: 12, color: BRAND.gray, marginBottom: "1rem" }}>
        These appear as "Local Points of Interest" to paid subscribers searching job sites.
      </div>

      {showForm && (
        <div style={{ background: "#fff", border: `1.5px solid ${BRAND.blue}`, borderRadius: 14, padding: "1.25rem", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 12 }}>{editId ? "Edit Supplier" : "New Supplier"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
            <div><label style={{ fontSize: 11, color: BRAND.gray, fontWeight: 600 }}>Business Name *</label><input style={inp} value={form.name} onChange={upd("name")} placeholder="Acme Supply Co." /></div>
            <div><label style={{ fontSize: 11, color: BRAND.gray, fontWeight: 600 }}>Category</label><input style={inp} value={form.category} onChange={upd("category")} placeholder="Lumber, Electrical, HVAC..." /></div>
            <div><label style={{ fontSize: 11, color: BRAND.gray, fontWeight: 600 }}>Address</label><input style={inp} value={form.address} onChange={upd("address")} placeholder="123 Main St, Birmingham AL" /></div>
            <div><label style={{ fontSize: 11, color: BRAND.gray, fontWeight: 600 }}>Phone</label><input style={inp} value={form.phone} onChange={upd("phone")} placeholder="(205) 555-0100" /></div>
            <div><label style={{ fontSize: 11, color: BRAND.gray, fontWeight: 600 }}>Website</label><input style={inp} value={form.website} onChange={upd("website")} placeholder="https://..." /></div>
            <div><label style={{ fontSize: 11, color: BRAND.gray, fontWeight: 600 }}>States (comma-separated)</label><input style={inp} value={form.states} onChange={upd("states")} placeholder="AL, TN, GA" /></div>
            <div><label style={{ fontSize: 11, color: BRAND.gray, fontWeight: 600 }}>Tier</label>
              <select style={{ ...inp, appearance: "none" }} value={form.tier} onChange={upd("tier")}>
                <option value="free">Free listing</option>
                <option value="sponsored">Sponsored</option>
                <option value="featured">Featured</option>
              </select>
            </div>
            <div><label style={{ fontSize: 11, color: BRAND.gray, fontWeight: 600 }}>Monthly Fee ($)</label><input style={inp} type="number" value={form.monthly_fee} onChange={upd("monthly_fee")} placeholder="0" /></div>
            <div><label style={{ fontSize: 11, color: BRAND.gray, fontWeight: 600 }}>Expires</label><input style={inp} type="date" value={form.expires_at} onChange={upd("expires_at")} /></div>
          </div>
          <div style={{ marginBottom: 12 }}><label style={{ fontSize: 11, color: BRAND.gray, fontWeight: 600 }}>Description</label><textarea style={{ ...inp, resize: "vertical", minHeight: 64 }} value={form.description} onChange={upd("description")} placeholder="Brief description shown to contractors" /></div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleSave} disabled={!form.name || saving} style={{ background: BRAND.blue, color: "#fff", border: "none", padding: "8px 18px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: form.name && !saving ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif" }}>
              {saving ? "Saving..." : editId ? "Save Changes" : "Add Supplier"}
            </button>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: `1px solid ${BRAND.border}`, padding: "8px 14px", borderRadius: 8, fontSize: 12, color: BRAND.gray, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
          </div>
        </div>
      )}

      {suppliers.length === 0 ? <Empty msg="No suppliers yet — add one above" /> : suppliers.map(s => {
        const expired = s.expires_at && new Date(s.expires_at) < new Date();
        return (
          <Row key={s.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark }}>{s.name}</span>
                  <button onClick={() => toggleActive(s.id, s.active)} style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, border: "none", background: s.active ? "#DCFCE7" : "#F1F5F9", color: s.active ? "#166534" : BRAND.gray, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    {s.active ? "● Active" : "○ Inactive"}
                  </button>
                  {s.category && <Badge color="#F0F4FF" text="#3730A3">{s.category}</Badge>}
                  {s.tier !== "free" && <Badge color="#FFFBEB" text="#B45309">{s.tier}</Badge>}
                  {expired && <Badge color="#FEE2E2" text="#991B1B">⚠️ Expired</Badge>}
                </div>
                <div style={{ fontSize: 11, color: BRAND.gray, display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {s.address && <span>📍 {s.address}</span>}
                  {s.phone && <span>📞 {s.phone}</span>}
                  {s.states?.length > 0 && <span>🗺️ {Array.isArray(s.states) ? s.states.join(", ") : s.states}</span>}
                  {s.monthly_fee > 0 && <span>💰 ${s.monthly_fee}/mo</span>}
                  {s.expires_at && <span style={{ color: expired ? "#DC2626" : BRAND.gray }}>📅 Expires {new Date(s.expires_at).toLocaleDateString()}</span>}
                </div>
                {s.description && <div style={{ fontSize: 11, color: BRAND.gray, marginTop: 4, fontStyle: "italic" }}>{s.description}</div>}
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => openEdit(s)} style={{ background: "#EFF6FF", border: `1px solid #BFDBFE`, color: BRAND.blue, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 7, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>✏️ Edit</button>
                <button onClick={() => onDelete(s.id, s.name)} style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#DC2626", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 7, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>🗑️</button>
              </div>
            </div>
          </Row>
        );
      })}
    </div>
  );
}

// ── Main AdminPage ───────────────────────────────────────────
export default function AdminPage({ go }) {
  const [tab, setTab]           = useState("overview");
  const [contractors, setContractors] = useState([]);
  const [realtors, setRealtors] = useState([]);
  const [reviews, setReviews]   = useState([]);
  const [editRequests, setEditRequests] = useState([]);
  const [subs, setSubs]         = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [reported, setReported] = useState([]);
  const [ndaSigs, setNdaSigs]   = useState([]);
  const [companies, setCompanies] = useState([]);
  const [companyMembers, setCompanyMembers] = useState([]);
  const [orphanedAuthUsers, setOrphanedAuthUsers] = useState([]);
  const [redemptions, setRedemptions]   = useState([]);
  const [suppliers, setSuppliers]       = useState([]);
  const [ownershipFlags, setOwnershipFlags] = useState([]);
  const [allInvites, setAllInvites]     = useState([]);
  const [featureFlags, setFeatureFlags] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [userFilter, setUserFilter] = useState("all");
  const [reviewFilter, setReviewFilter] = useState("all");
  const [reviewUserFilter, setReviewUserFilter] = useState(null); // { id, name } — set from a contractor row
  const [actionMsg, setActionMsg] = useState(null); // { ok, text }

  useEffect(() => { loadData(); }, []);

  const getAdminPass = () => {
    const token = sessionStorage.getItem("pr_admin_auth");
    return token ? atob(token).split(":")[0] : null;
  };

  const fetchAuthUsers = async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/list-auth-users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({ adminPass: getAdminPass() }),
      });
      if (!res.ok) return [];
      const { users } = await res.json();
      return users || [];
    } catch { return []; }
  };

  const loadData = async () => {
    setLoading(true);
    const safe = async (path) => { try { const r = await sb(path); return Array.isArray(r) ? r : []; } catch { return []; } };
    const [[co, re, rv, er, ss, fb, rp, nd, rl, cm, cmem, rd, sup, of_, inv, ff], authUsers] = await Promise.all([
      Promise.all([
        safe("/contractors?select=*&order=created_at.desc&limit=500"),
        safe("/realtor_subscriptions?select=*&order=created_at.desc&limit=200"),
        safe("/reviews?select=*&order=created_at.desc&limit=5000"),
        safe("/review_edit_requests?select=*&order=created_at.desc&limit=100"),
        safe("/push_subscriptions?select=*&order=created_at.desc&limit=200"),
        safe("/beta_feedback?select=*&order=created_at.desc&limit=200"),
        safe("/reported_reviews?select=*&order=reported_at.desc&limit=100"),
        safe("/nda_signatures?select=*&order=agreed_at.desc&limit=200"),
        safe("/realtor_lookups?select=*&order=created_at.desc&limit=200"),
        safe("/companies?select=*&order=created_at.desc&limit=200"),
        safe("/contractors?select=id,name,email,trade,company_id,company_role,plan,status,created_at&company_id=not.is.null&order=created_at.desc&limit=500"),
        safe("/points_redemptions?select=*&order=created_at.desc&limit=200"),
        safe("/featured_suppliers?select=*&order=name.asc"),
        safe("/ownership_flags?select=*&order=created_at.desc&limit=100"),
        safe("/invites?select=*&order=created_at.desc&limit=200"),
        safe("/feature_flags?select=*&order=name.asc"),
      ]),
      fetchAuthUsers(),
    ]);
    setContractors(co); setRealtors(re); setReviews(rv);
    setEditRequests(er); setSubs(ss); setFeedback(fb);
    setReported(rp); setNdaSigs(nd);
    setCompanies(cm); setCompanyMembers(cmem);
    setRedemptions(rd); setSuppliers(sup); setOwnershipFlags(of_); setAllInvites(inv);
    setFeatureFlags(ff);
    // Enrich realtor rows with lookup counts
    const lookupCounts = rl.reduce((acc, l) => { acc[l.user_id] = (acc[l.user_id] || 0) + 1; return acc; }, {});
    setRealtors(re.map(r => ({ ...r, lookup_count: lookupCounts[r.user_id] || 0 })));
    // Find auth users with no matching contractor or realtor row
    const contractorIds = new Set(co.map(c => c.id));
    const realtorIds    = new Set(re.map(r => r.user_id || r.id));
    setOrphanedAuthUsers(authUsers.filter(u => !contractorIds.has(u.id) && !realtorIds.has(u.id)));
    setLoading(false);
  };

  // ── Actions ────────────────────────────────────────────────
  const flash = (ok, text) => { setActionMsg({ ok, text }); setTimeout(() => setActionMsg(null), 4000); };

  const approveContractor = async (id) => {
    const result = await patch("contractors", id, { status: "approved" });
    const savedStatus = Array.isArray(result) ? result[0]?.status : null;
    if (savedStatus !== "approved") {
      flash(false, `Approval failed — DB returned status="${savedStatus ?? "empty"}". Check SUPABASE_SERVICE_KEY in Vercel env vars, or look for a trigger resetting status in Supabase Dashboard → Database → Triggers.`);
      return;
    }
    setContractors(cs => cs.map(c => c.id === id ? { ...c, status: "approved" } : c));
    flash(true, "Approved ✓ — confirmed in DB");
    fetch(`${SUPABASE_URL}/functions/v1/send-approval-email`, {
      method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ contractorId: id, status: "approved" }),
    }).then(r => { if (!r.ok) flash(false, "Approved but approval email failed — check Resend in Supabase logs"); }).catch(() => {});
  };

  const rejectContractor = async (id, reason) => {
    await patch("contractors", id, { status: "rejected", rejected_at: new Date().toISOString(), rejection_reason: reason || "Unable to verify license", reviewed_by: "admin" });
    setContractors(cs => cs.map(c => c.id === id ? { ...c, status: "rejected" } : c));
    fetch(`${SUPABASE_URL}/functions/v1/send-approval-email`, {
      method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ contractorId: id, status: "rejected", rejectionReason: reason }),
    }).then(r => { if (!r.ok) console.warn("[ProRated] Rejection email failed:", r.status); }).catch(() => {});
  };

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Permanently delete ${name || "this user"}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({ userId: id, adminPass: getAdminPass() }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        flash(false, `Delete failed: ${payload.error || res.status}`);
        return;
      }
      setContractors(cs => cs.filter(c => c.id !== id));
      flash(true, `${name || "User"} deleted — record anonymized and auth account removed.`);
    } catch (e) {
      flash(false, `Delete failed: ${e.message}`);
    }
  };

  const completeDelete = deleteUser; // alias

  const deleteOrphanedAuthUser = async (userId, email) => {
    if (!window.confirm(`Permanently delete auth account for ${email || userId}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({ userId, adminPass: getAdminPass() }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        flash(false, `Delete failed: ${error || res.status}`);
        return;
      }
      setOrphanedAuthUsers(prev => prev.filter(u => u.id !== userId));
      flash(true, `Deleted auth account for ${email || userId}`);
    } catch (e) {
      flash(false, "Failed to delete auth account — check edge function deployment");
    }
  };

  const deleteReview = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    await del("reviews", id);
    setReviews(rv => rv.filter(r => r.id !== id));
  };

  const upgradeRealtor = async (id) => {
    await adminPatch("/realtor_subscriptions", { plan: "pro" }, { id: `eq.${id}` });
    setRealtors(rs => rs.map(r => r.id === id ? { ...r, plan: "pro" } : r));
  };

  const downgradeRealtor = async (id) => {
    await adminPatch("/realtor_subscriptions", { plan: "free" }, { id: `eq.${id}` });
    setRealtors(rs => rs.map(r => r.id === id ? { ...r, plan: "free" } : r));
  };

  const resolveFeedback = async (id, current) => {
    await patch("beta_feedback", id, { resolved: !current });
    setFeedback(fb => fb.map(f => f.id === id ? { ...f, resolved: !current } : f));
  };

  const resolveReport = async (id, current) => {
    await patch("reported_reviews", id, { resolved: !current });
    setReported(rp => rp.map(r => r.id === id ? { ...r, resolved: !current } : r));
  };

  // G4 — Edit request resolve/deny
  const resolveEditRequest = async (id) => {
    await adminPatch("/review_edit_requests", { resolved: true }, { id: `eq.${id}` });
    setEditRequests(ers => ers.map(e => e.id === id ? { ...e, resolved: true } : e));
    flash(true, "Edit request marked resolved");
  };

  // G1 — Redemptions
  const approveRedemption = async (id) => {
    await adminPatch("/points_redemptions", { status: "approved" }, { id: `eq.${id}` });
    setRedemptions(rs => rs.map(r => r.id === id ? { ...r, status: "approved" } : r));
    flash(true, "Redemption approved");
  };
  const rejectRedemption = async (id) => {
    const reason = window.prompt("Reason for rejection (optional):");
    if (reason === null) return;
    await adminPatch("/points_redemptions", { status: "rejected", notes: reason || "Rejected by admin" }, { id: `eq.${id}` });
    setRedemptions(rs => rs.map(r => r.id === id ? { ...r, status: "rejected" } : r));
    flash(true, "Redemption rejected");
  };
  const fulfillRedemption = async (id) => {
    await adminPatch("/points_redemptions", { status: "fulfilled", resolved_at: new Date().toISOString() }, { id: `eq.${id}` });
    setRedemptions(rs => rs.map(r => r.id === id ? { ...r, status: "fulfilled" } : r));
    flash(true, "Marked as fulfilled ✓");
  };

  // G6 — Plan override + resend welcome
  const changePlan = async (id, plan) => {
    await adminPatch("/contractors", { plan }, { id: `eq.${id}` });
    setContractors(cs => cs.map(c => c.id === id ? { ...c, plan } : c));
    flash(true, `Plan updated to ${plan || "free"}`);
  };
  const resendWelcome = async (id) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-approval-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ contractorId: id, status: "approved" }),
    });
    flash(res.ok, res.ok ? "Welcome email resent ✓" : "Email failed — check Resend logs");
  };

  // G3 — Ownership flags
  const resolveOwnershipFlag = async (id) => {
    await adminPatch("/ownership_flags", { resolved: true }, { id: `eq.${id}` });
    setOwnershipFlags(fs => fs.map(f => f.id === id ? { ...f, resolved: true } : f));
  };
  const deleteOwnershipFlag = async (id) => {
    await adminDelete("/ownership_flags", { id: `eq.${id}` });
    setOwnershipFlags(fs => fs.filter(f => f.id !== id));
  };

  // G2 — Suppliers
  const toggleSupplierActive = async (id, current) => {
    await adminPatch("/featured_suppliers", { active: !current }, { id: `eq.${id}` });
    setSuppliers(ss => ss.map(s => s.id === id ? { ...s, active: !current } : s));
  };
  const deleteSupplier = async (id, name) => {
    if (!window.confirm(`Delete supplier "${name}"?`)) return;
    await adminDelete("/featured_suppliers", { id: `eq.${id}` });
    setSuppliers(ss => ss.filter(s => s.id !== id));
    flash(true, "Supplier deleted");
  };

  // ── Feature Flags ────────────────────────────────────────────
  const enableEarlyAccess = async (flag) => {
    if (!window.confirm(`Enable EARLY ACCESS for "${flag.name}" (Gold + Platinum only)?`)) return;
    const payload = { enabled: false, early_access_plans: ["gold", "platinum"] };
    await adminPatch("/feature_flags", payload, { id: `eq.${flag.id}` });
    setFeatureFlags(fs => fs.map(f => f.id === flag.id ? { ...f, ...payload } : f));
    flash(true, `${flag.name} — Early Access enabled for Gold & Platinum`);
  };
  const fullLaunchFlag = async (flag) => {
    if (!window.confirm(`FULL LAUNCH "${flag.name}" for ALL paid users? This cannot be undone from this button — you'd need to Disable to roll back.`)) return;
    const payload = { enabled: true, early_access_plans: null };
    await adminPatch("/feature_flags", payload, { id: `eq.${flag.id}` });
    setFeatureFlags(fs => fs.map(f => f.id === flag.id ? { ...f, ...payload } : f));
    flash(true, `${flag.name} — Full launch enabled for all paid users`);
  };
  const disableFlag = async (flag) => {
    if (!window.confirm(`Disable "${flag.name}" completely? No one will see this feature.`)) return;
    const payload = { enabled: false, early_access_plans: null };
    await adminPatch("/feature_flags", payload, { id: `eq.${flag.id}` });
    setFeatureFlags(fs => fs.map(f => f.id === flag.id ? { ...f, ...payload } : f));
    flash(true, `${flag.name} — Disabled`);
  };

  // ── Contractor admin notes / force-remove from company ───────
  const saveAdminNotes = async (id, notes) => {
    await adminPatch("/contractors", { admin_notes: notes }, { id: `eq.${id}` });
    setContractors(cs => cs.map(c => c.id === id ? { ...c, admin_notes: notes } : c));
    flash(true, "Admin note saved");
  };
  const forceRemoveFromCompany = async (id, name) => {
    if (!window.confirm(`Force-remove ${name || "this user"} from their company?`)) return;
    await adminPatch("/contractors", { company_id: null, company_role: null }, { id: `eq.${id}` });
    setContractors(cs => cs.map(c => c.id === id ? { ...c, company_id: null, company_role: null } : c));
    setCompanyMembers(prev => prev.filter(m => m.id !== id));
    flash(true, `${name || "User"} removed from company`);
  };

  // ── Reviews: dispute flag ─────────────────────────────────────
  const toggleDisputed = async (id, current) => {
    await adminPatch("/reviews", { disputed: !current }, { id: `eq.${id}` });
    setReviews(rv => rv.map(r => r.id === id ? { ...r, disputed: !current } : r));
  };

  // ── Derived counts ──────────────────────────────────────────
  const pendingContractors  = contractors.filter(c => !c.status || c.status === "pending");
  const deletionRequests    = contractors.filter(c => c.deletion_requested && !c.deleted);
  const openFeedback        = feedback.filter(f => !f.resolved);
  const openReports         = reported.filter(r => !r.resolved);
  const pendingEditRequests = editRequests.filter(e => !e.resolved);
  const proRealtors         = realtors.filter(r => r.plan === "pro");
  const bronzeContractors   = contractors.filter(c => c.plan === "bronze");
  const silverContractors   = contractors.filter(c => c.plan === "silver");
  const goldContractors     = contractors.filter(c => c.plan === "gold");
  const paidContractors     = contractors.filter(c => ["bronze","silver","gold"].includes(c.plan));
  const avgScore            = reviews.length ? (reviews.reduce((s, r) => s + (r.overall_score || 0), 0) / reviews.length).toFixed(1) : "—";

  // ── Bid Intelligence readiness metrics ────────────────────────
  const bidIntelFlag   = featureFlags.find(f => f.name === "bid_intelligence");
  const now             = Date.now();
  const oneWeekMs        = 7 * 24 * 60 * 60 * 1000;
  const oneMonthMs       = 30 * 24 * 60 * 60 * 1000;
  const newReviewsWeek  = reviews.filter(r => r.created_at && (now - new Date(r.created_at).getTime()) <= oneWeekMs).length;
  const newReviewsMonth = reviews.filter(r => r.created_at && (now - new Date(r.created_at).getTime()) <= oneMonthMs).length;
  const activeCompanies = companies.filter(c => c.status === "active" || !c.status).length;
  const addressCounts = reviews.reduce((acc, r) => { const key = r.address || "Unknown"; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
  const uniqueAddressCount = Object.keys(addressCounts).length;
  const avgReviewsPerAddress = uniqueAddressCount ? (reviews.length / uniqueAddressCount).toFixed(1) : "0";
  const topAddresses = Object.entries(addressCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // ── Filtered views ──────────────────────────────────────────
  const filteredContractors = userFilter === "all"        ? contractors.filter(c => !c.deleted)
    : userFilter === "pending"    ? pendingContractors
    : userFilter === "approved"   ? contractors.filter(c => c.status === "approved" && !c.deleted)
    : userFilter === "rejected"   ? contractors.filter(c => c.status === "rejected" && !c.deleted)
    : userFilter === "deletion"   ? deletionRequests
    : userFilter === "deleted"    ? contractors.filter(c => c.deleted)
    : userFilter === "bronze"     ? contractors.filter(c => c.plan === "bronze")
    : userFilter === "silver"     ? contractors.filter(c => c.plan === "silver")
    : userFilter === "gold"       ? contractors.filter(c => c.plan === "gold")
    : userFilter === "platinum"   ? contractors.filter(c => c.plan === "platinum")
    : userFilter === "no_license" ? contractors.filter(c => !c.license_number && !c.company_id && !c.deleted)
    : contractors.filter(c => !c.deleted);

  const filteredReviews = reviewFilter === "all"     ? reviews
    : reviewFilter === "edits" ? reviews.filter(r => editRequests.some(e => e.review_id === r.id))
    : reviewFilter === "low"   ? reviews.filter(r => r.overall_score < 3)
    : reviewFilter === "disputed" ? reviews.filter(r => r.disputed)
    : reviewFilter === "user" && reviewUserFilter ? reviews.filter(r => r.user_id === reviewUserFilter.id)
    : reviews;

  const pendingRedemptions  = redemptions.filter(r => r.status === "pending");
  const openOwnershipFlags  = ownershipFlags.filter(f => !f.resolved);

  const TABS = [
    { id: "overview",     label: "Overview",    icon: "📊" },
    { id: "contractors",  label: `Trade Pros${pendingContractors.length > 0 ? ` (${pendingContractors.length})` : ""}`, icon: "🔨" },
    { id: "companies",    label: `Companies (${companies.length})`, icon: "🏗️" },
    { id: "suppliers",    label: `🏪 Suppliers (${suppliers.length})`, icon: "🏪" },
    { id: "realtors",     label: `Realtors (${realtors.length})`, icon: "🏡" },
    { id: "reviews",      label: `Reviews${pendingEditRequests.length > 0 ? ` (${pendingEditRequests.length} edits)` : ""}`, icon: "⭐" },
    { id: "rewards",      label: `💰 Rewards${pendingRedemptions.length > 0 ? ` (${pendingRedemptions.length})` : ""}`, icon: "💰" },
    { id: "feedback",     label: `Feedback${openFeedback.length > 0 ? ` (${openFeedback.length})` : ""}`, icon: "💬" },
    { id: "reported",     label: `Reports${(openReports.length + openOwnershipFlags.length) > 0 ? ` (${openReports.length + openOwnershipFlags.length})` : ""}`, icon: "🚩" },
    { id: "nda",          label: `NDA (${ndaSigs.length})`, icon: "📄" },
    { id: "push",         label: `Push (${subs.length})`, icon: "🔔" },
    { id: "flags",        label: "🚩 Feature Flags", icon: "🚩" },
  ];

  const ProgressBar = ({ current, target, color }) => {
    const pct = Math.min(100, (current / target) * 100);
    return (
      <div>
        <div style={{ background: "#334155", borderRadius: 6, height: 10, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 6, transition: "width 0.3s" }} />
        </div>
        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>{current} / {target} reviews</div>
      </div>
    );
  };

  const statBox = (icon, val, label, color = BRAND.blue) => (
    <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 14, padding: "1rem", textAlign: "center", flex: "1 1 120px" }}>
      <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1 }}>{val}</div>
      <div style={{ fontSize: 11, color: BRAND.gray, marginTop: 4 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0F172A", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ background: "#1E293B", borderBottom: "1px solid #334155", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo size={32} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#F8FAFC" }}>ProRated Admin</div>
            <div style={{ fontSize: 10, color: "#64748B" }}>Internal Console</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={loadData} style={{ background: "#334155", color: "#94A3B8", border: "none", padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>↻ Refresh</button>
          <button onClick={() => { sessionStorage.removeItem("pr_admin_auth"); window.location.reload(); }}
            style={{ background: "transparent", color: "#64748B", border: "none", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Sign out</button>
        </div>
      </div>

      {/* Action feedback banner */}
      {actionMsg && (
        <div style={{ background: actionMsg.ok ? "#166534" : "#991B1B", color: "#fff", padding: "10px 20px", fontSize: 13, fontWeight: 600, textAlign: "center" }}>
          {actionMsg.text}
        </div>
      )}

      {/* Tabs */}
      <div style={{ background: "#1E293B", borderBottom: "1px solid #334155", padding: "0 16px", display: "flex", gap: 4, overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: "10px 14px", border: "none", borderBottom: `2px solid ${tab === t.id ? "#2563EB" : "transparent"}`, background: "transparent", color: tab === t.id ? "#F8FAFC" : "#64748B", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 5 }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "1.5rem 1.25rem 4rem" }}>

        {loading && (
          <div style={{ textAlign: "center", padding: "4rem", color: "#64748B" }}>
            <div style={{ width: 32, height: 32, border: "3px solid #334155", borderTop: "3px solid #2563EB", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />
            Loading data...
          </div>
        )}

        {/* ── OVERVIEW ── */}
        {!loading && tab === "overview" && (
          <div>
            <SectionHead title="Platform Overview" />

            {/* Bid Intelligence launch readiness — the only metrics that matter for the launch decision */}
            <div style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 16, padding: "1.25rem 1.5rem", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>🤖 Bid Intelligence Launch Readiness</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: "#F8FAFC", lineHeight: 1, marginBottom: 16 }}>{reviews.length} <span style={{ fontSize: 14, fontWeight: 600, color: "#94A3B8" }}>total reviews</span></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#FBBF24", marginBottom: 6 }}>⚡ Early Access Threshold</div>
                  <ProgressBar current={reviews.length} target={50} color="#F59E0B" />
                  <div style={{ fontSize: 10, color: "#64748B", marginTop: 4 }}>Flip early access when this hits 50</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#60A5FA", marginBottom: 6 }}>🚀 Full Launch Threshold</div>
                  <ProgressBar current={reviews.length} target={200} color="#2563EB" />
                  <div style={{ fontSize: 10, color: "#64748B", marginTop: 4 }}>Flip full launch when this hits 200</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", paddingTop: 12, borderTop: "1px solid #334155" }}>
                {[
                  ["New this week", newReviewsWeek],
                  ["New this month", newReviewsMonth],
                  ["Registered trade pros", contractors.length],
                  ["Pending approvals", pendingContractors.length],
                  ["Active companies", activeCompanies],
                  ["Avg reviews / address", avgReviewsPerAddress],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#F8FAFC" }}>{val}</div>
                    <div style={{ fontSize: 10, color: "#94A3B8" }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14 }}>
                <Btn small color="#F59E0B" onClick={() => setTab("flags")}>Manage in Feature Flags →</Btn>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: "1.5rem" }}>
              {statBox("🔨", contractors.length, "Trade Pros", BRAND.blue)}
              {statBox("✅", contractors.filter(c => c.status === "approved").length, "Verified", "#16A34A")}
              {statBox("⏳", pendingContractors.length, "Pending Review", "#D97706")}
              {statBox("💰", paidContractors.length, "Paid Accounts", "#7C3AED")}
              {statBox("🏡", realtors.length, "Realtors", "#EA580C")}
              {statBox("⭐", reviews.length, "Reviews", "#CA8A04")}
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: "1.5rem" }}>
              {statBox("🥉", bronzeContractors.length, "Bronze", "#B45309")}
              {statBox("🥈", silverContractors.length, "Silver", "#475569")}
              {statBox("🥇", goldContractors.length, "Gold", "#92400E")}
              {statBox("💎", contractors.filter(c => c.plan === "platinum").length, "Platinum", "#1E3A8A")}
              {statBox("🆓", contractors.filter(c => !c.plan || c.plan === "free").length, "Free Tier", BRAND.gray)}
              {statBox("🏗️", contractors.filter(c => c.company_id).length, "In Companies", "#2563EB")}
              {statBox("★", avgScore, "Avg Rating", "#16A34A")}
            </div>

            {/* Action items */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pendingContractors.length > 0 && (
                <div style={{ background: "#1E3A5F", border: "1px solid #2563EB", borderRadius: 12, padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#93C5FD" }}>⏳ {pendingContractors.length} trade pro{pendingContractors.length !== 1 ? "s" : ""} awaiting verification</div>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Review license numbers and approve or reject</div>
                  </div>
                  <Btn onClick={() => setTab("contractors")}>Review →</Btn>
                </div>
              )}
              {deletionRequests.length > 0 && (
                <div style={{ background: "#3B0764", border: "1px solid #7C3AED", borderRadius: 12, padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#C4B5FD" }}>🗑️ {deletionRequests.length} account deletion request{deletionRequests.length !== 1 ? "s" : ""}</div>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Complete PII removal and anonymize reviews</div>
                  </div>
                  <Btn onClick={() => setTab("contractors")}>Review →</Btn>
                </div>
              )}
              {openReports.length > 0 && (
                <div style={{ background: "#450A0A", border: "1px solid #DC2626", borderRadius: 12, padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#FCA5A5" }}>🚩 {openReports.length} open review report{openReports.length !== 1 ? "s" : ""}</div>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Homeowner disputes or flagged content</div>
                  </div>
                  <Btn color="#DC2626" onClick={() => setTab("reported")}>Review →</Btn>
                </div>
              )}
              {pendingEditRequests.length > 0 && (
                <div style={{ background: "#431407", border: "1px solid #EA580C", borderRadius: 12, padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#FED7AA" }}>✏️ {pendingEditRequests.length} review edit request{pendingEditRequests.length !== 1 ? "s" : ""}</div>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Trade pros requesting changes to their reviews</div>
                  </div>
                  <Btn color="#EA580C" onClick={() => { setTab("reviews"); setReviewFilter("edits"); }}>Review →</Btn>
                </div>
              )}
              {openFeedback.length > 0 && (
                <div style={{ background: "#1E3A5F", border: "1px solid #0EA5E9", borderRadius: 12, padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#7DD3FC" }}>💬 {openFeedback.length} unresolved feedback item{openFeedback.length !== 1 ? "s" : ""}</div>
                  </div>
                  <Btn color="#0EA5E9" onClick={() => setTab("feedback")}>Review →</Btn>
                </div>
              )}
              {pendingRedemptions.length > 0 && (
                <div style={{ background: "#431407", border: "1px solid #D97706", borderRadius: 12, padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#FED7AA" }}>💰 {pendingRedemptions.length} merch redemption{pendingRedemptions.length !== 1 ? "s" : ""} awaiting approval</div>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Contractors redeeming review points for merch credit</div>
                  </div>
                  <Btn color="#D97706" onClick={() => setTab("rewards")}>Review →</Btn>
                </div>
              )}
              {openOwnershipFlags.length > 0 && (
                <div style={{ background: "#1E3A5F", border: "1px solid #0EA5E9", borderRadius: 12, padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#7DD3FC" }}>🏠 {openOwnershipFlags.length} property ownership claim{openOwnershipFlags.length !== 1 ? "s" : ""} need review</div>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Homeowners claiming their address in the app</div>
                  </div>
                  <Btn color="#0EA5E9" onClick={() => setTab("reported")}>Review →</Btn>
                </div>
              )}
              {pendingContractors.length === 0 && deletionRequests.length === 0 && openReports.length === 0 && pendingEditRequests.length === 0 && openFeedback.length === 0 && pendingRedemptions.length === 0 && openOwnershipFlags.length === 0 && (
                <div style={{ textAlign: "center", padding: "2rem", color: "#64748B", fontSize: 13 }}>✅ All clear — no action items</div>
              )}
            </div>


          </div>
        )}

        {/* ── CONTRACTORS ── */}
        {!loading && tab === "contractors" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: 8 }}>
              <SectionHead title="Trade Pros" count={contractors.length} />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[["all","All"],["pending","⏳ Pending"],["approved","✓ Verified"],["rejected","✗ Rejected"],["deletion","🗑️ Deletion Req"],["deleted","🚫 Deleted"],["bronze","🥉 Bronze"],["silver","🥈 Silver"],["gold","🥇 Gold"],["platinum","💎 Platinum"],["no_license",`🪪 No License`],["orphaned",`🔍 Orphaned${orphanedAuthUsers.length > 0 ? ` (${orphanedAuthUsers.length})` : ""}`]].map(([val, label]) => (
                  <button key={val} onClick={() => setUserFilter(val)}
                    style={{ padding: "4px 10px", borderRadius: 8, border: `1px solid ${userFilter === val ? BRAND.blue : BRAND.border}`, background: userFilter === val ? BRAND.blue : "#fff", color: userFilter === val ? "#fff" : BRAND.gray, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {userFilter === "orphaned" ? (
              orphanedAuthUsers.length === 0
                ? <Empty msg="No orphaned auth users — all auth accounts have trade pro rows" />
                : orphanedAuthUsers.map(u => (
                    <Row key={u.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 4 }}>
                            {u.email || "Unknown email"}
                          </div>
                          <div style={{ fontSize: 11, color: BRAND.gray, display: "flex", gap: 12, flexWrap: "wrap" }}>
                            <span>🔑 Auth-only — no contractor row</span>
                            <span>📅 {u.created_at ? new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</span>
                            {u.last_sign_in_at && <span>🕐 Last sign-in: {new Date(u.last_sign_in_at).toLocaleDateString()}</span>}
                          </div>
                          <div style={{ fontSize: 10, color: BRAND.gray, marginTop: 3, fontFamily: "monospace" }}>{u.id}</div>
                        </div>
                        <Btn small color="#DC2626" onClick={() => deleteOrphanedAuthUser(u.id, u.email)}>🗑️ Delete Auth</Btn>
                      </div>
                    </Row>
                  ))
            ) : (
              filteredContractors.length === 0 ? <Empty msg="No contractors match this filter" /> :
                filteredContractors.map(c => (
                  <UserRow key={c.id} user={c} onApprove={approveContractor} onReject={rejectContractor} onCompleteDelete={completeDelete} onAdminDelete={deleteUser} onChangePlan={changePlan} onResendWelcome={resendWelcome}
                    onSaveNotes={saveAdminNotes} onForceRemoveCompany={forceRemoveFromCompany}
                    onViewReviews={(id, name) => { setReviewUserFilter({ id, name }); setReviewFilter("user"); setTab("reviews"); }}
                    reviewCount={reviews.filter(r => r.user_id === c.id).length}
                    companies={companies} />
                ))
            )}
          </div>
        )}

        {/* ── COMPANIES ── */}
        {!loading && tab === "companies" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <SectionHead title="Companies" count={companies.length} />
              <button onClick={async () => {
                if (!window.confirm("Delete all pending (unaccepted) invites?")) return;
                await adminDelete("/invites", { accepted_at: "is.null" });
                alert("Pending invites cleared.");
              }} style={{ fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 7, border: "1px solid #FCA5A5", background: "#FEF2F2", color: "#DC2626", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                🗑️ Clear pending invites
              </button>
            </div>
            {companies.length === 0 ? <Empty msg="No companies yet" /> : companies.map(company => {
              const members = companyMembers.filter(m => m.company_id === company.id);
              // If owner isn't in members list (company_id not set on their row), add them from contractors
              const ownerInMembers = members.some(m => m.company_role === "owner" || m.id === company.owner_id);
              const displayMembers = ownerInMembers ? members : [
                ...contractors.filter(c => c.id === company.owner_id).map(c => ({ ...c, company_role: "owner" })),
                ...members
              ];
              const owner = displayMembers.find(m => m.company_role === "owner");
              const tierIcon = { bronze: "🥉", silver: "🥈", gold: "🥇", platinum: "💎" }[company.plan] || "🏗️";
              const seatLimit = { bronze: 5, silver: 15, gold: 39 }[company.plan] || "∞";
              return (
                <div key={company.id} style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 14, padding: "16px 18px", marginBottom: 10 }}>
                  {/* Company header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: BRAND.dark }}>{company.name}</span>
                        <span style={{ background: "#EFF6FF", color: BRAND.blue, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                          {tierIcon} {company.plan?.toUpperCase() || "FREE"}
                        </span>
                        <span style={{ background: company.status === "active" ? "#DCFCE7" : "#FEF3C7", color: company.status === "active" ? "#166534" : "#92400E", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                          {company.status || "active"}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: BRAND.gray }}>
                        Owner: <strong>{owner?.name || owner?.email || "—"}</strong>
                        {owner?.email && ` · ${owner.email}`}
                      </div>
                      <div style={{ fontSize: 11, color: BRAND.gray, marginTop: 2 }}>
                        Created: {new Date(company.created_at).toLocaleDateString()}
                        {company.anniversary_date && ` · Anniversary: ${new Date(company.anniversary_date).toLocaleDateString()}`}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: BRAND.blue }}>{displayMembers.length}<span style={{ fontSize: 11, fontWeight: 400, color: BRAND.gray }}>/{seatLimit}</span></div>
                      <div style={{ fontSize: 10, color: BRAND.gray }}>seats used</div>
                    </div>
                  </div>

                  {/* Seat usage bar */}
                  <div style={{ background: BRAND.border, borderRadius: 4, height: 6, marginBottom: 12, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, (displayMembers.length / (typeof seatLimit === "number" ? seatLimit : members.length || 1)) * 100)}%`, height: "100%", background: members.length >= seatLimit ? "#DC2626" : BRAND.blue, borderRadius: 4, transition: "width 0.3s" }} />
                  </div>

                  {/* Team member list */}
                  {displayMembers.length > 0 ? (
                    <div style={{ display: "grid", gap: 6 }}>
                      {displayMembers.map(m => (
                        <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#F8FAFC", borderRadius: 8 }}>
                          <div style={{ width: 28, height: 28, background: m.company_role === "owner" ? BRAND.blue : "#94A3B8", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                            {(m.name || m.email || "?").charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.dark, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name || "—"}</div>
                            <div style={{ fontSize: 11, color: BRAND.gray, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.email}</div>
                          </div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: m.company_role === "owner" ? BRAND.blue : BRAND.gray, background: m.company_role === "owner" ? "#EFF6FF" : "#F1F5F9", padding: "2px 7px", borderRadius: 20 }}>
                              {m.company_role === "owner" ? "Owner" : "Member"}
                            </span>
                            <span style={{ fontSize: 10, color: BRAND.gray }}>{m.trade}</span>
                            <span style={{ fontSize: 10, color: m.status === "approved" ? "#16A34A" : "#D97706" }}>
                              {m.status === "approved" ? "✓" : "⏳"}
                            </span>
                            {m.company_role !== "owner" && (
                              <button onClick={async () => {
                                if (!window.confirm(`Remove ${m.name || m.email} from team?`)) return;
                                await adminPatch("/contractors", { company_id: null, company_role: null }, { id: `eq.${m.id}` });
                                setCompanyMembers(prev => prev.filter(x => x.id !== m.id));
                              }} style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#DC2626", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: BRAND.gray, textAlign: "center", padding: "8px 0" }}>No members yet</div>
                  )}

                  {/* Invites for this company */}
                  {(() => {
                    const compInvites = allInvites.filter(i => i.company_id === company.id);
                    if (!compInvites.length) return null;
                    return (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${BRAND.border}` }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.dark, marginBottom: 8 }}>Invites ({compInvites.length})</div>
                        {compInvites.map(inv => {
                          const accepted = !!inv.accepted_at;
                          const expired  = inv.expires_at && new Date(inv.expires_at) < new Date() && !accepted;
                          return (
                            <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: `1px solid ${BRAND.border}` }}>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: BRAND.dark }}>{inv.email}</div>
                                <div style={{ fontSize: 11, color: BRAND.gray }}>
                                  Sent {new Date(inv.created_at).toLocaleDateString()} ·
                                  {accepted ? <span style={{ color: "#166534" }}> ✓ Accepted</span>
                                    : expired ? <span style={{ color: "#DC2626" }}> ⏰ Expired</span>
                                    : <span style={{ color: "#D97706" }}> ⏳ Pending</span>}
                                </div>
                              </div>
                              {!accepted && (
                                <div style={{ display: "flex", gap: 5 }}>
                                  <button onClick={async () => {
                                    await fetch(`${SUPABASE_URL}/functions/v1/send-approval-email`, {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
                                      body: JSON.stringify({ type: "invite", inviteEmail: inv.email, companyName: company.name, invitedByName: "ProRated Admin", inviteLink: `https://prorated.app/invite/${inv.token}` }),
                                    });
                                    flash(true, `Invite resent to ${inv.email}`);
                                  }} style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, border: `1px solid ${BRAND.border}`, background: "#EFF6FF", color: BRAND.blue, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                                    📧 Resend
                                  </button>
                                  <button onClick={async () => {
                                    if (!window.confirm(`Revoke invite for ${inv.email}?`)) return;
                                    await adminDelete("/invites", { id: `eq.${inv.id}` });
                                    setAllInvites(prev => prev.filter(i => i.id !== inv.id));
                                    flash(true, `Invite revoked for ${inv.email}`);
                                  }} style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, border: "1px solid #FCA5A5", background: "#FEF2F2", color: "#DC2626", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                                    Revoke
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Stripe / billing info */}
                  {company.stripe_subscription_id && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${BRAND.border}`, fontSize: 11, color: BRAND.gray }}>
                      Stripe sub: <code style={{ fontSize: 10 }}>{company.stripe_subscription_id}</code>
                    </div>
                  )}

                  {/* Admin actions */}
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${BRAND.border}`, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <select
                      defaultValue={company.plan || "bronze"}
                      onChange={async (e) => {
                        const newPlan = e.target.value;
                        await adminPatch("/companies", { plan: newPlan }, { id: `eq.${company.id}` });
                        setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, plan: newPlan } : c));
                      }}
                      style={{ fontSize: 11, padding: "4px 8px", borderRadius: 7, border: `1px solid ${BRAND.border}`, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", background: "#F8FAFC" }}>
                      <option value="bronze">🥉 Bronze</option>
                      <option value="silver">🥈 Silver</option>
                      <option value="gold">🥇 Gold</option>
                      <option value="platinum">💎 Platinum</option>
                    </select>
                    <button onClick={async () => {
                      const newName = window.prompt("New company name:", company.name);
                      if (!newName?.trim()) return;
                      await adminPatch("/companies", { name: newName.trim() }, { id: `eq.${company.id}` });
                      setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, name: newName.trim() } : c));
                    }} style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 7, border: `1px solid ${BRAND.border}`, background: "#F8FAFC", color: BRAND.dark, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                      ✏️ Rename
                    </button>
                    <button onClick={async () => {
                      if (!window.confirm(`Delete company "${company.name}" and remove all members? Cannot be undone.`)) return;
                      // Remove all members if any exist
                      if (displayMembers.length > 0) {
                        await adminPatch("/contractors", { company_id: null, company_role: null }, { company_id: `eq.${company.id}` });
                      }
                      // Delete company
                      await adminDelete("/companies", { id: `eq.${company.id}` });
                      setCompanies(prev => prev.filter(c => c.id !== company.id));
                      setCompanyMembers(prev => prev.filter(m => m.company_id !== company.id));
                    }} style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 7, border: "1px solid #FCA5A5", background: "#FEF2F2", color: "#DC2626", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                      🗑️ Delete company
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── REALTORS ── */}
        {!loading && tab === "realtors" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: 8 }}>
              <SectionHead title="Realtors" count={realtors.length} />
              <div style={{ display: "flex", gap: 8, fontSize: 12, color: BRAND.gray }}>
                <span>Pro: <strong style={{ color: "#166534" }}>{proRealtors.length}</strong></span>
                <span>Free: <strong>{realtors.length - proRealtors.length}</strong></span>
              </div>
            </div>
            {realtors.length === 0 ? <Empty msg="No realtors yet — share prorated.app/realtor" /> :
              realtors.map(r => (
                <RealtorRow key={r.id} realtor={r} onUpgrade={upgradeRealtor} onDowngrade={downgradeRealtor} />
              ))
            }
          </div>
        )}

        {/* ── REVIEWS ── */}
        {!loading && tab === "reviews" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: 8 }}>
              <SectionHead title="Reviews" count={reviews.length} />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[["all","All"],["edits","✏️ Edit Requests"],["low","⚠️ Low Rated"],["disputed","🚩 Disputed"]].map(([val, label]) => (
                  <button key={val} onClick={() => { setReviewFilter(val); if (val !== "user") setReviewUserFilter(null); }}
                    style={{ padding: "4px 10px", borderRadius: 8, border: `1px solid ${reviewFilter === val ? BRAND.blue : BRAND.border}`, background: reviewFilter === val ? BRAND.blue : "#fff", color: reviewFilter === val ? "#fff" : BRAND.gray, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {reviewFilter === "user" && reviewUserFilter && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "8px 12px", marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: "#1E40AF", fontWeight: 600 }}>Showing reviews by {reviewUserFilter.name}</span>
                <button onClick={() => { setReviewFilter("all"); setReviewUserFilter(null); }}
                  style={{ background: "none", border: "none", color: "#1E40AF", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  Clear ×
                </button>
              </div>
            )}

            {topAddresses.length > 0 && (
              <div style={{ background: "#F8FAFC", border: `1px solid ${BRAND.border}`, borderRadius: 12, padding: "10px 14px", marginBottom: "1rem" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.dark, marginBottom: 6 }}>📍 Addresses with most reviews</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {topAddresses.map(([addr, count]) => (
                    <span key={addr} style={{ fontSize: 11, color: BRAND.gray, background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 8, padding: "3px 9px" }}>
                      {addr} <strong style={{ color: BRAND.dark }}>({count})</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {filteredReviews.length === 0 ? <Empty msg="No reviews match this filter" /> :
              filteredReviews.map(r => (
                <ReviewRow key={r.id} review={r} onDelete={deleteReview} onToggleDisputed={toggleDisputed} editRequests={editRequests} onResolveEditRequest={resolveEditRequest} />
              ))
            }
          </div>
        )}

        {/* ── FEEDBACK ── */}
        {!loading && tab === "feedback" && (
          <div>
            <SectionHead title="Beta Feedback" count={feedback.length} />
            {feedback.length === 0 ? <Empty msg="No feedback yet" /> :
              feedback.map(f => (
                <Row key={f.id} faded={f.resolved}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                        <Badge color={f.category === "bug" ? "#FEE2E2" : f.category === "praise" ? "#DCFCE7" : f.category === "suggestion" ? "#FEF9C3" : "#EFF6FF"}
                          text={f.category === "bug" ? "#991B1B" : f.category === "praise" ? "#166534" : f.category === "suggestion" ? "#854D0E" : "#1E40AF"}>
                          {f.category === "bug" ? "🐛 Bug" : f.category === "praise" ? "⭐ Praise" : f.category === "suggestion" ? "💡 Suggestion" : "🔍 Missing"}
                        </Badge>
                        <Badge color="#F8FAFC" text={BRAND.gray}>{f.page || "unknown page"}</Badge>
                        <span style={{ fontSize: 10, color: BRAND.gray }}>{new Date(f.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        {f.user_email && <span style={{ fontSize: 10, color: BRAND.gray }}>{f.user_email}</span>}
                      </div>
                      <div style={{ fontSize: 13, color: BRAND.dark, lineHeight: 1.6 }}>{f.text}</div>
                    </div>
                    <Btn small color={f.resolved ? "#64748B" : "#16A34A"} onClick={() => resolveFeedback(f.id, f.resolved)}>
                      {f.resolved ? "Reopen" : "✓ Done"}
                    </Btn>
                  </div>
                </Row>
              ))
            }
          </div>
        )}

        {/* ── REPORTED REVIEWS ── */}
        {!loading && tab === "reported" && (
          <div>
            <SectionHead title="Reported Reviews" count={reported.length} />
            <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "1.25rem", fontSize: 12, color: "#1E40AF", lineHeight: 1.7 }}>
              <strong>Homeowner Dispute Process:</strong> Homeowner emails hello@prorated.app with address + proof of ownership → find review below → delete if claim is valid → reply within 5 business days → mark resolved.
            </div>
            {reported.length === 0 ? <Empty msg="No reports — great sign!" /> :
              reported.map(r => (
                <Row key={r.id} faded={r.resolved}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 4 }}>{r.address || "Unknown address"}</div>
                      <div style={{ fontSize: 12, color: BRAND.gray, marginBottom: 4 }}>{r.reason || "No reason given"}</div>
                      <div style={{ fontSize: 11, color: BRAND.gray }}>
                        Review ID: <span style={{ fontFamily: "monospace" }}>{r.review_id?.slice(0, 8)}</span> · {r.reported_at ? new Date(r.reported_at).toLocaleDateString() : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <Btn small color="#DC2626" onClick={() => deleteReview(r.review_id)}>Delete Review</Btn>
                      <Btn small color={r.resolved ? "#64748B" : "#16A34A"} onClick={() => resolveReport(r.id, r.resolved)}>
                        {r.resolved ? "Reopen" : "✓ Resolved"}
                      </Btn>
                    </div>
                  </div>
                </Row>
              ))
            }

            {/* G3 — Ownership Flags */}
            {ownershipFlags.length > 0 && (
              <div style={{ marginTop: "1.5rem" }}>
                <SectionHead title="Property Ownership Claims" count={ownershipFlags.length} />
                <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: 12, color: "#92400E" }}>
                  Homeowners claiming their address. Verify proof of ownership before removing reviews at their request.
                </div>
                {ownershipFlags.map(f => (
                  <Row key={f.id} faded={f.resolved}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 4 }}>🏠 {f.address || "Unknown address"}</div>
                        {f.notes && <div style={{ fontSize: 12, color: BRAND.gray, marginBottom: 4 }}>{f.notes}</div>}
                        <div style={{ fontSize: 11, color: BRAND.gray }}>{f.created_at ? new Date(f.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        {!f.resolved && <Btn small color="#16A34A" onClick={() => resolveOwnershipFlag(f.id)}>✓ Resolved</Btn>}
                        <Btn small color="#DC2626" onClick={() => deleteOwnershipFlag(f.id)}>🗑️</Btn>
                      </div>
                    </div>
                  </Row>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── REWARDS ── */}
        {!loading && tab === "rewards" && (
          <div>
            <SectionHead title="Merch Redemptions" count={redemptions.length} />
            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: 12, color: "#92400E", lineHeight: 1.6 }}>
              Trade pros earn 1 point per review ($0.25/pt). At 40 pts they can redeem for $10 merch credit. Approve → coordinate merch → mark Fulfilled.
            </div>
            {redemptions.length === 0 ? <Empty msg="No redemptions yet" /> : redemptions.map(r => {
              const contractor = contractors.find(c => c.id === r.contractor_id);
              const statusBadge = r.status === "fulfilled" ? { bg: "#DCFCE7", text: "#166534", label: "✓ Fulfilled" }
                : r.status === "approved"  ? { bg: "#DBEAFE", text: "#1E40AF", label: "✓ Approved" }
                : r.status === "rejected"  ? { bg: "#FEE2E2", text: "#991B1B", label: "✗ Rejected" }
                : { bg: "#FEF9C3", text: "#854D0E", label: "⏳ Pending" };
              return (
                <Row key={r.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark }}>{contractor?.name || r.contractor_id?.slice(0, 8) || "Unknown"}</span>
                        <Badge color={statusBadge.bg} text={statusBadge.text}>{statusBadge.label}</Badge>
                      </div>
                      <div style={{ fontSize: 11, color: BRAND.gray, display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <span>📧 {contractor?.email || "—"}</span>
                        <span>💰 {r.points_requested || 0} pts → ${((r.points_requested || 0) * 0.25).toFixed(2)}</span>
                        <span>📅 {r.created_at ? new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</span>
                        {r.notes && <span>📝 {r.notes}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      {r.status === "pending"  && <Btn small color="#16A34A" onClick={() => approveRedemption(r.id)}>✓ Approve</Btn>}
                      {r.status === "pending"  && <Btn small color="#64748B" onClick={() => rejectRedemption(r.id)}>✗ Reject</Btn>}
                      {r.status === "approved" && <Btn small color="#7C3AED" onClick={() => fulfillRedemption(r.id)}>Mark Fulfilled</Btn>}
                    </div>
                  </div>
                </Row>
              );
            })}
          </div>
        )}

        {/* ── SUPPLIERS ── */}
        {!loading && tab === "suppliers" && (
          <SupplierTab
            suppliers={suppliers}
            setSuppliers={setSuppliers}
            toggleActive={toggleSupplierActive}
            onDelete={deleteSupplier}
            flash={flash}
          />
        )}

        {/* ── NDA ── */}
        {!loading && tab === "nda" && (
          <div>
            <SectionHead title="NDA Signatures" count={ndaSigs.length} />
            {ndaSigs.length === 0 ? <Empty msg="No NDA signatures yet" /> :
              ndaSigs.map(s => (
                <Row key={s.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: BRAND.dark }}>{s.user_email || s.user_id?.slice(0, 12) || "Unknown"}</div>
                      <div style={{ fontSize: 11, color: BRAND.gray }}>
                        Version {s.nda_version || "1.0"} · {s.agreed_at ? new Date(s.agreed_at).toLocaleString() : "—"}
                        {s.ip_address && ` · IP: ${s.ip_address}`}
                      </div>
                    </div>
                    <Badge color="#DCFCE7" text="#166534">✓ Signed</Badge>
                  </div>
                </Row>
              ))
            }
          </div>
        )}

        {/* ── PUSH ── */}
        {!loading && tab === "push" && (
          <div>
            <SectionHead title="Push Subscriptions" count={subs.length} />
            {subs.length === 0 ? <Empty msg="No push subscribers yet" /> :
              subs.map(s => (
                <Row key={s.id}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: BRAND.dark, marginBottom: 3, fontFamily: "monospace", wordBreak: "break-all" }}>
                    {s.endpoint?.slice(0, 70)}...
                  </div>
                  <div style={{ fontSize: 11, color: BRAND.gray }}>
                    User: {s.user_id ? s.user_id.slice(0, 8) + "..." : "Anonymous"} · {s.created_at ? new Date(s.created_at).toLocaleDateString() : ""}
                  </div>
                </Row>
              ))
            }
          </div>
        )}

        {/* ── FEATURE FLAGS ── */}
        {!loading && tab === "flags" && (
          <div>
            <SectionHead title="Feature Flags" count={featureFlags.length} />
            <div style={{ background: "#1E3A5F", border: "1px solid #2563EB", borderRadius: 12, padding: "0.75rem 1rem", margin: "1rem 0", fontSize: 12, color: "#93C5FD", lineHeight: 1.6 }}>
              This is how you control feature releases — no SQL needed ever. Every flag change requires a confirmation dialog.
            </div>
            {featureFlags.length === 0 ? <Empty msg="No feature flags yet" /> : featureFlags.map(flag => {
              const flagStatus = flag.enabled ? { bg: "#DCFCE7", text: "#166534", label: "✅ Full Launch" }
                : flag.early_access_plans?.length ? { bg: "#FFFBEB", text: "#92400E", label: "⚡ Early Access" }
                : { bg: "#F1F5F9", text: "#64748B", label: "⏸️ Disabled" };
              const isBidIntel = flag.name === "bid_intelligence";
              return (
                <div key={flag.id} style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 14, padding: "16px 18px", marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: BRAND.dark }}>{flag.name}</span>
                        <Badge color={flagStatus.bg} text={flagStatus.text}>{flagStatus.label}</Badge>
                      </div>
                      {flag.early_access_plans?.length > 0 && (
                        <div style={{ fontSize: 11, color: BRAND.gray }}>Early access plans: {flag.early_access_plans.join(", ")}</div>
                      )}
                      {flag.threshold_description && (
                        <div style={{ fontSize: 11, color: BRAND.gray, marginTop: 4, whiteSpace: "pre-line" }}>{flag.threshold_description}</div>
                      )}
                    </div>
                  </div>

                  {isBidIntel && (
                    <div style={{ background: "#F8FAFC", border: `1px solid ${BRAND.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#B45309", marginBottom: 4 }}>Early Access — Recommended at 50+ total reviews</div>
                          <div style={{ background: "#E2E8F0", borderRadius: 6, height: 8, overflow: "hidden" }}>
                            <div style={{ width: `${Math.min(100, (reviews.length / 50) * 100)}%`, height: "100%", background: "#F59E0B", borderRadius: 6 }} />
                          </div>
                          <div style={{ fontSize: 10, color: BRAND.gray, marginTop: 3 }}>Current: {reviews.length} / 50 reviews</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#1E40AF", marginBottom: 4 }}>Full Launch — Recommended at 200+ total reviews</div>
                          <div style={{ background: "#E2E8F0", borderRadius: 6, height: 8, overflow: "hidden" }}>
                            <div style={{ width: `${Math.min(100, (reviews.length / 200) * 100)}%`, height: "100%", background: "#2563EB", borderRadius: 6 }} />
                          </div>
                          <div style={{ fontSize: 10, color: BRAND.gray, marginTop: 3 }}>Current: {reviews.length} / 200 reviews</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Btn small color="#F59E0B" onClick={() => enableEarlyAccess(flag)}>⚡ Enable Early Access</Btn>
                    <Btn small color="#16A34A" onClick={() => fullLaunchFlag(flag)}>🚀 Full Launch</Btn>
                    <Btn small color="#64748B" onClick={() => disableFlag(flag)}>⏸️ Disable</Btn>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
