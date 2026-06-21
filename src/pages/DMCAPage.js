import { BRAND } from "../components/UI";
import Logo from "../components/Logo";

// ── DMCAPage ──────────────────────────────────────────────────
// ProRated DMCA / Copyright Policy
// Route: prorated.app/dmca
// ─────────────────────────────────────────────────────────────

export default function DMCAPage({ go, goBack }) {
  const Section = ({ title, children }) => (
    <div style={{ marginBottom: "2rem" }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: BRAND.dark, marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${BRAND.border}` }}>
        {title}
      </h2>
      {children}
    </div>
  );

  const P = ({ children }) => (
    <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.8, margin: "0 0 12px" }}>{children}</p>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans', sans-serif", paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ background: "#0F172A", padding: "1.5rem 1.25rem", textAlign: "center" }}>
        <button onClick={() => goBack ? goBack() : go("home")}
          style={{ background: "none", border: "none", color: "#94A3B8", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "block", margin: "0 auto 12px" }}>
          ← Back
        </button>
        <Logo size={44} dark={false} />
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F8FAFC", margin: "12px 0 4px" }}>DMCA / Copyright Policy</h1>
        <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>Effective date: June 17, 2026</p>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "2rem 1.25rem" }}>

        <Section title="Overview">
          <P>
            ProRated ("Company," "we," "us," or "our") respects the intellectual property rights of others
            and expects users of our platform to do the same. In accordance with the Digital Millennium
            Copyright Act of 1998 ("DMCA"), 17 U.S.C. § 512, we will respond promptly to claims of
            copyright infringement committed using our platform.
          </P>
          <P>
            ProRated is a user-generated content platform. Registered contractors submit reviews and
            ratings of residential job sites. We do not independently verify or endorse the content of
            user submissions and are not liable for user-generated content under DMCA Safe Harbor
            provisions, provided we comply with the requirements of 17 U.S.C. § 512.
          </P>
        </Section>

        <Section title="Designated Copyright Agent">
          <P>
            We have registered a Designated Copyright Agent with the U.S. Copyright Office as required
            by 17 U.S.C. § 512(c)(2). To submit a DMCA notice or counter-notice, contact our
            Designated Agent at:
          </P>
          <div style={{ background: "#fff", border: `1.5px solid ${BRAND.border}`, borderRadius: 12, padding: "1.25rem 1.5rem", marginBottom: 16 }}>
            <div style={{ fontSize: 13, lineHeight: 1.9, color: BRAND.dark }}>
              <div><strong>ProRated — Designated Copyright Agent</strong></div>
              <div>Attn: DMCA Notice</div>
              <div>Email: <a href="mailto:dmca@prorated.app" style={{ color: BRAND.blue }}>dmca@prorated.app</a></div>
              <div>Mailing: hello@prorated.app</div>
            </div>
          </div>
          <P>
            We strongly recommend submitting notices by email for faster processing. Notices sent by
            mail may take significantly longer to process.
          </P>
        </Section>

        <Section title="Filing a DMCA Takedown Notice">
          <P>
            If you believe that content on ProRated infringes your copyright, you may submit a written
            takedown notice to our Designated Agent. To be valid under the DMCA, your notice must
            include all of the following:
          </P>
          <div style={{ background: "#F8FAFC", border: `1px solid ${BRAND.border}`, borderRadius: 10, padding: "1rem 1.25rem", marginBottom: 16 }}>
            {[
              "A physical or electronic signature of the copyright owner or a person authorized to act on their behalf.",
              "Identification of the copyrighted work claimed to have been infringed, or if multiple works are covered by a single notification, a representative list of such works.",
              "Identification of the material that is claimed to be infringing and information reasonably sufficient to permit us to locate the material (e.g., a specific URL or description of where the content appears on prorated.app).",
              "Your contact information including your name, address, telephone number, and email address.",
              "A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.",
              "A statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the copyright owner.",
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, fontSize: 13, color: "#475569", lineHeight: 1.7 }}>
                <span style={{ flexShrink: 0, fontWeight: 700, color: BRAND.blue }}>{i + 1}.</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <P>
            Notices that do not comply with these requirements may not be processed. Please note that
            under 17 U.S.C. § 512(f), any person who knowingly materially misrepresents that material
            is infringing may be subject to liability.
          </P>
        </Section>

        <Section title="Counter-Notice Procedure">
          <P>
            If you believe that content you posted was removed by mistake or misidentification, you may
            submit a counter-notice to our Designated Agent. A valid counter-notice must include:
          </P>
          <div style={{ background: "#F8FAFC", border: `1px solid ${BRAND.border}`, borderRadius: 10, padding: "1rem 1.25rem", marginBottom: 16 }}>
            {[
              "Your physical or electronic signature.",
              "Identification of the material that has been removed or to which access has been disabled, and the location at which the material appeared before it was removed or disabled.",
              "A statement under penalty of perjury that you have a good faith belief that the material was removed or disabled as a result of mistake or misidentification.",
              "Your name, address, and telephone number, and a statement that you consent to the jurisdiction of the Federal District Court for the judicial district in which your address is located (or Jefferson County, Alabama if your address is outside the United States), and that you will accept service of process from the person who provided the original notification.",
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, fontSize: 13, color: "#475569", lineHeight: 1.7 }}>
                <span style={{ flexShrink: 0, fontWeight: 700, color: BRAND.blue }}>{i + 1}.</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <P>
            Upon receipt of a valid counter-notice, we will provide a copy to the original complainant
            and inform them that we will restore the removed content within 10–14 business days unless
            the complainant files a court action seeking to restrain you from engaging in the infringing
            activity.
          </P>
        </Section>

        <Section title="Repeat Infringer Policy">
          <P>
            In accordance with the DMCA and other applicable laws, ProRated has adopted a policy of
            terminating, in appropriate circumstances, the accounts of users who are deemed to be repeat
            infringers. ProRated may also, at its sole discretion, limit access to the platform or
            terminate accounts of any users who infringe the intellectual property rights of others,
            whether or not there is any repeat infringement.
          </P>
        </Section>

        <Section title="User-Generated Content">
          <P>
            ProRated's platform allows licensed trade professionals to submit reviews, ratings, and
            text-based descriptions of residential job sites based on their direct professional
            experience. Users retain ownership of their original content but grant ProRated a license
            to display and use that content on the platform as described in our Terms of Service.
          </P>
          <P>
            Users are solely responsible for ensuring that content they submit does not infringe the
            copyrights, trademarks, or other intellectual property rights of third parties. Content
            that consists solely of factual professional observations (e.g., "the driveway was steep"
            or "payment was delayed 45 days") is generally not subject to copyright protection, as
            facts are not copyrightable.
          </P>
        </Section>

        <Section title="Contact">
          <P>
            For all DMCA-related inquiries, please contact us at{" "}
            <a href="mailto:dmca@prorated.app" style={{ color: BRAND.blue, textDecoration: "none", fontWeight: 600 }}>
              dmca@prorated.app
            </a>
            . For general support inquiries, visit{" "}
            <button onClick={() => go("support")}
              style={{ background: "none", border: "none", color: BRAND.blue, cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "'DM Sans', sans-serif", padding: 0 }}>
              prorated.app/support
            </button>
            .
          </P>
          <P>
            This policy was last updated on June 17, 2026. ProRated reserves the right to modify
            this policy at any time. Changes will be effective upon posting to prorated.app/dmca.
          </P>
        </Section>

      </div>
    </div>
  );
}
