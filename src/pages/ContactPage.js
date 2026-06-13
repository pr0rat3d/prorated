import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";
import { useState } from "react";
import { BRAND } from "../components/UI";
import Logo from "../components/Logo";
import { useLang } from "../hooks/useLang";
import { t } from "../i18n/translations";




export default function ContactPage({ go }) {
  const { lang }          = useLang();
  const [form, setForm]   = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent]   = useState(false);
  const [sending, setSending] = useState(false);

  const update  = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const canSend = form.name.trim() && form.email.trim() && form.message.trim();

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/beta_feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          category:   "contact",
          text:       `From: ${form.name} (${form.email})\nSubject: ${form.subject}\n\n${form.message}`,
          page:       "contact",
          user_email: form.email,
        }),
      });
      setSent(true);
    } catch {}
    setSending(false);
  };



  const FIELDS = [
    { key: "name",    labelKey: "contact.yourName",  placeholder: "John Smith",          type: "text"  },
    { key: "email",   labelKey: "contact.yourEmail", placeholder: "you@email.com",       type: "email" },
    { key: "subject", labelKey: "contact.subject",   placeholder: "What's this about?",  type: "text"  },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ background: BRAND.dark, padding: "1.5rem", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <Logo size={48} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#F8FAFC", marginBottom: 4 }}>
          {t(lang, "contact.title")}
        </h1>
        <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>
          {t(lang, "contact.subtitle")}
        </p>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>

        {sent ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🙏</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: BRAND.dark, marginBottom: 10 }}>
              {t(lang, "contact.sentTitle")}
            </h2>
            <p style={{ fontSize: 14, color: BRAND.gray, lineHeight: 1.65, marginBottom: 24 }}>
              {t(lang, "contact.sentBody")}
            </p>
            <button onClick={() => go("home")}
              style={{ background: BRAND.blue, color: "#fff", border: "none", padding: "12px 28px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              {t(lang, "contact.back")}
            </button>
          </div>
        ) : (
          <>
            {/* Contact form */}
            <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 16, padding: "1.5rem" }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: BRAND.dark, marginBottom: "1.25rem", marginTop: 0 }}>
                {t(lang, "contact.sendMessage")}
              </h3>

              {FIELDS.map(({ key, labelKey, placeholder, type }) => (
                <div key={key} style={{ marginBottom: "0.9rem" }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: BRAND.dark, display: "block", marginBottom: 5 }}>
                    {t(lang, labelKey)}
                  </label>
                  <input type={type} value={form[key]}
                    onChange={e => update(key, e.target.value)}
                    placeholder={placeholder}
                    style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${BRAND.border}`, borderRadius: 9, fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", color: BRAND.dark }} />
                </div>
              ))}

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: BRAND.dark, display: "block", marginBottom: 5 }}>
                  {t(lang, "contact.message")}
                </label>
                <textarea value={form.message} onChange={e => update("message", e.target.value)}
                  placeholder={t(lang, "contact.howHelp")}
                  rows={4}
                  style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${BRAND.border}`, borderRadius: 9, fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", color: BRAND.dark, resize: "vertical", lineHeight: 1.6 }} />
              </div>

              <button onClick={handleSend} disabled={!canSend || sending}
                style={{ width: "100%", background: canSend ? BRAND.blue : "#E2E8F0", color: canSend ? "#fff" : BRAND.gray, border: "none", padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: canSend ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif" }}>
                {sending ? t(lang, "contact.sending") : t(lang, "contact.send")}
              </button>
            </div>

            <p style={{ fontSize: 11, color: BRAND.gray, textAlign: "center", marginTop: "1rem", lineHeight: 1.6 }}>
              📍 ProRated · Hoover, Alabama · hello@prorated.app
            </p>
          </>
        )}
      </div>
    </div>
  );
}
