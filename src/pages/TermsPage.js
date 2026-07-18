import { BRAND } from "../components/UI";
import { useLang } from "../hooks/useLang";
import Logo from "../components/Logo";

const TERMS = {
  en: {
    title:   "Terms of Service",
    updated: "Last updated: July 2026",
    summary: "Plain English Summary",
    summaryItems: [
      "ProRated is for licensed trade professionals only — not homeowners or the general public",
      "Reviews must be honest and based on real job site experiences",
      "Don't post false, defamatory, or retaliatory reviews",
      "We can remove content that violates these terms",
      "You own your reviews — we just host them",
      "Think a review about your property is inaccurate? Email disputes@prorated.app — no account needed",
    ],
    sections: [
      { title: "1. Acceptance of Terms", body: "By creating an account or using ProRated (\"the Service\"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.\n\nThese terms apply to all users including contractors who submit reviews, contractors who search addresses, and any visitors to the platform." },
      { title: "2. Eligibility", body: "You must be:\n• At least 18 years of age\n• Hold a valid contractor's license in a US state\n• Provide accurate license information during registration\n\nProRated is not intended for homeowners or members of the general public." },
      { title: "3. Reviews Must Be Accurate and Submitted in Good Faith", body: "By submitting a review, you certify that it is:\n• Based on your actual, firsthand experience at the job site\n• Truthful and accurate to the best of your knowledge at the time of submission\n• Your own independent assessment — not written on behalf of another person, or influenced by payment, favor, or retaliation\n• Free of personally identifying homeowner information\n\nSubmitting a review is an attestation, not just a form field. False or bad-faith reviews violate these Terms and may result in content removal and account termination (see Section 5, Prohibited Uses)." },
      { title: "4. Reviews Must NOT", body: "• Contain false or defamatory statements\n• Be submitted in retaliation for a negative review\n• Include homeowner names, contact details, or addresses beyond the job site\n• Contain hate speech, threats, or discriminatory language" },
      { title: "5. Prohibited Uses", body: "• Using the platform to harass or intimidate homeowners or contractors\n• Attempting to manipulate ratings with false reviews\n• Scraping or redistributing ProRated data without written permission\n• Impersonating another contractor or creating fake accounts" },
      { title: "6. Subscriptions", body: "• Subscriptions purchased on the web are billed monthly through Stripe\n• Subscriptions purchased through the iOS app are billed monthly through Apple's App Store and are managed via your Apple ID (Settings → Subscriptions on your device) — refunds and cancellations for App Store purchases are handled by Apple, not ProRated directly\n• You may cancel at any time — cancellation takes effect at end of billing period\n• No refunds for partial periods\n• We reserve the right to change pricing with 30 days notice" },
      { title: "7. Disclaimer & Our Role as a Platform", body: "ProRated hosts reviews submitted by independent, verified contractors. We do not write, edit, verify, or endorse the content of any individual review — reviews reflect the opinions of the submitting contractor, not ProRated.\n\nAs a provider of an interactive computer service, ProRated is generally not the publisher or speaker of user-submitted content and is not liable for that content under Section 230 of the Communications Decency Act (47 U.S.C. § 230), to the fullest extent the law allows. This does not limit our own obligations under intellectual property or federal criminal law, or our commitment to reviewing good-faith disputes (see Section 8).\n\nUse your own judgment when relying on any review to make a bidding decision." },
      { title: "8. Reviewing and Disputing Content", body: "If you believe a review is inaccurate, unfair, or violates these Terms — including if you're a property owner who believes a review about your address is false or defamatory — contact us at disputes@prorated.app. Include the property address and the reason for your concern; you don't need an account, and you don't need to have seen the review itself, to file a dispute.\n\nWe aim to acknowledge disputes within 48 hours and reach a decision within 5 business days. This may include contacting the reviewing contractor for context, requesting supporting documentation, or removing content that violates Section 3 or Section 4 above.\n\nThis process exists alongside, not instead of, our DMCA policy (Section 11) for copyright-specific claims." },
      { title: "9. Our Data Promise",
        body: "ProRated commits to the following regarding your data:\n\n• Your personally identifiable information (PII) — including your name, email, license number, phone, and company — will never be sold, rented, or licensed to any third party\n• Aggregate, anonymized data that cannot identify any individual may be used, licensed, or sold for market research, industry reporting, and business partnerships\n• Our primary revenue comes from platform subscriptions\n• If we ever change our PII policy, we will provide 30 days advance written notice via email\n• Upon such notice, users may delete their account and all PII at no cost\n\nThis distinction between personal data and aggregate data is standard industry practice and is legally binding as part of these Terms." },
      { title: "10. Governing Law", body: "These Terms are governed by the laws of the State of Alabama." },
      { title: "11. Copyright / DMCA", body: "ProRated respects intellectual property rights and complies with the DMCA. To report copyright infringement, email dmca@prorated.app. Full policy at prorated.app/dmca." },
      { title: "12. Contact", body: "General: hello@prorated.app\nContent Disputes: disputes@prorated.app\nDMCA / Copyright: dmca@prorated.app" },
    ],
    contact: "Contact hello@prorated.app →",
  },
  es: {
    title:   "Términos de Servicio",
    updated: "Última actualización: julio 2026",
    summary: "Resumen en lenguaje claro",
    summaryItems: [
      "ProRated es solo para contratistas con licencia — no para propietarios ni el público general",
      "Las reseñas deben ser honestas y basadas en experiencias reales",
      "No publiques reseñas falsas, difamatorias o de represalia",
      "Podemos eliminar contenido que viole estos términos",
      "Tus reseñas son tuyas — nosotros solo las alojamos",
      "¿Crees que una reseña sobre tu propiedad es inexacta? Escribe a disputes@prorated.app — no necesitas una cuenta",
    ],
    sections: [
      { title: "1. Aceptación de los Términos", body: "Al crear una cuenta o usar ProRated (\"el Servicio\"), aceptas estar sujeto a estos Términos de Servicio. Si no estás de acuerdo, no uses el Servicio.\n\nEstos términos se aplican a todos los usuarios, incluidos contratistas que envían reseñas, contratistas que buscan direcciones y visitantes de la plataforma." },
      { title: "2. Elegibilidad", body: "Debes:\n• Tener al menos 18 años de edad\n• Tener una licencia de contratista válida en un estado de EE.UU.\n• Proporcionar información de licencia precisa durante el registro\n\nProRated no está destinado a propietarios de viviendas ni al público en general." },
      { title: "3. Las Reseñas Deben Ser Precisas y de Buena Fe", body: "Al enviar una reseña, certificas que es:\n• Basada en tu experiencia real y directa en el sitio de trabajo\n• Verídica y precisa según tu conocimiento al momento de enviarla\n• Tu evaluación independiente — no escrita en nombre de otra persona, ni influenciada por pago, favor o represalia\n• Libre de información de identificación personal del propietario\n\nEnviar una reseña es una certificación, no solo un campo de formulario. Las reseñas falsas o de mala fe violan estos Términos y pueden resultar en la eliminación del contenido y la terminación de la cuenta (ver Sección 5, Usos Prohibidos)." },
      { title: "4. Las Reseñas No Deben", body: "• Contener declaraciones falsas o difamatorias\n• Enviarse como represalia por una reseña negativa\n• Incluir nombres, datos de contacto o direcciones del propietario más allá del sitio\n• Contener discurso de odio, amenazas o lenguaje discriminatorio" },
      { title: "5. Usos Prohibidos", body: "• Usar la plataforma para acosar o intimidar a propietarios o contratistas\n• Intentar manipular calificaciones con reseñas falsas\n• Extraer o redistribuir datos de ProRated sin permiso escrito\n• Hacerse pasar por otro contratista o crear cuentas falsas" },
      { title: "6. Suscripciones", body: "• Las suscripciones compradas en la web se facturan mensualmente a través de Stripe\n• Las suscripciones compradas a través de la aplicación de iOS se facturan mensualmente a través de la App Store de Apple y se gestionan mediante tu Apple ID (Ajustes → Suscripciones en tu dispositivo) — los reembolsos y cancelaciones de compras en la App Store son gestionados por Apple, no directamente por ProRated\n• Puedes cancelar en cualquier momento — la cancelación surte efecto al final del período\n• Sin reembolsos por períodos parciales\n• Nos reservamos el derecho de cambiar precios con 30 días de aviso" },
      { title: "7. Descargo de Responsabilidad y Nuestro Rol como Plataforma", body: "ProRated aloja reseñas enviadas por contratistas independientes y verificados. No escribimos, editamos, verificamos ni respaldamos el contenido de ninguna reseña individual — las reseñas reflejan las opiniones del contratista que las envía, no de ProRated.\n\nComo proveedor de un servicio informático interactivo, ProRated generalmente no es el editor ni el emisor del contenido enviado por los usuarios y no es responsable de dicho contenido bajo la Sección 230 de la Ley de Decencia en las Comunicaciones (47 U.S.C. § 230), en la medida en que la ley lo permita. Esto no limita nuestras propias obligaciones bajo la ley de propiedad intelectual o el derecho penal federal, ni nuestro compromiso de revisar disputas de buena fe (ver Sección 8).\n\nUsa tu propio criterio al basarte en cualquier reseña para tomar una decisión de oferta." },
      { title: "8. Revisión y Disputa de Contenido", body: "Si crees que una reseña es inexacta, injusta o viola estos Términos — incluso si eres propietario de una vivienda y crees que una reseña sobre tu dirección es falsa o difamatoria — comunícate con nosotros a disputes@prorated.app. Incluye la dirección de la propiedad y el motivo de tu inquietud; no necesitas una cuenta, ni haber visto la reseña, para presentar una disputa.\n\nNuestro objetivo es confirmar la recepción de las disputas dentro de 48 horas y llegar a una decisión dentro de 5 días hábiles. Esto puede incluir contactar al contratista que hizo la reseña para obtener contexto, solicitar documentación de respaldo, o eliminar contenido que viole la Sección 3 o la Sección 4 anteriores.\n\nEste proceso existe junto con, no en lugar de, nuestra política DMCA (Sección 11) para reclamos específicos de derechos de autor." },
      { title: "9. Nuestro Compromiso con tus Datos",
        body: "ProRated se compromete con respecto a tus datos:\n\n• Tu información de identificación personal (PII) — nombre, correo, licencia, teléfono y empresa — nunca será vendida, alquilada ni licenciada a terceros\n• Los datos agregados y anonimizados que no pueden identificar a ningún individuo pueden usarse, licenciarse o venderse para investigación de mercado e informes de la industria\n• Nuestros ingresos principales provienen de suscripciones y publicidad de proveedores\n• Si cambiamos nuestra política de PII, notificaremos con 30 días de anticipación\n• Los usuarios podrán eliminar su cuenta y todos sus datos personales gratuitamente\n\nEsta distinción entre datos personales y datos agregados es una práctica estándar de la industria y es legalmente vinculante." },
      { title: "10. Ley Aplicable", body: "Estos Términos se rigen por las leyes del Estado de Alabama." },
      { title: "11. Derechos de Autor / DMCA", body: "ProRated respeta los derechos de propiedad intelectual y cumple con la Ley de Derechos de Autor del Milenio Digital (DMCA). Si crees que el contenido de nuestra plataforma infringe tus derechos de autor, envía un aviso a dmca@prorated.app. Para más detalles, visita prorated.app/dmca." },
      { title: "12. Contacto", body: "General: hello@prorated.app\nDisputas de Contenido: disputes@prorated.app\nDMCA / Derechos de Autor: dmca@prorated.app" },
    ],
    contact: "Contactar hello@prorated.app →",
  },
};

export default function TermsPage({ go, goBack }) {
  const { lang } = useLang();
  const T = TERMS[lang] || TERMS.en;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: BRAND.dark, padding: "1.5rem", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <Logo size={48} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#F8FAFC", marginBottom: 6 }}>{T.title}</h1>
        <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>{T.updated}</p>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
        <button onClick={() => goBack ? goBack() : go("home")}
          style={{ background: "none", border: "none", color: BRAND.blue, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginBottom: "1.5rem", padding: 0 }}>
          ← Back
        </button>

        {/* Summary */}
        <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 14, padding: "1.25rem 1.5rem", marginBottom: "2rem" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#1E40AF", marginBottom: 10 }}>{T.summary}</div>
          {T.summaryItems.map(item => (
            <div key={item} style={{ fontSize: 13, color: "#1E40AF", marginBottom: 6 }}>✓ {item}</div>
          ))}
        </div>

        {/* Sections */}
        {T.sections.map(({ title, body }) => (
          <div key={title} style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: BRAND.dark, marginBottom: "0.75rem", paddingBottom: "0.5rem", borderBottom: `2px solid ${BRAND.border}` }}>
              {title}
            </h2>
            {body.split('\n').map((line, i) => (
              <p key={i} style={{ fontSize: 13, color: "#334155", lineHeight: 1.8, marginBottom: line ? "0.5rem" : 0 }}>
                {line}
              </p>
            ))}
          </div>
        ))}

        <a href="mailto:hello@prorated.app"
          style={{ display: "inline-block", background: BRAND.blue, color: "#fff", textDecoration: "none", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700 }}>
          {T.contact}
        </a>
      </div>
    </div>
  );
}
