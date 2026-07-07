import { BRAND } from "../components/UI";
import { useLang } from "../hooks/useLang";
import Logo from "../components/Logo";

const PRIVACY = {
  en: {
    title:   "Privacy Policy",
    updated: "Last updated: May 2026",
    promise: "Our Core Promise",
    promiseBody: "We will NEVER sell, share, rent, or distribute your personal information, contractor data, or license numbers to any third party — advertisers, data brokers, or anyone else.",
    sections: [
      { title: "1. Who We Are", body: "ProRated is a contractor-to-contractor job site rating platform. We help licensed trade professionals share verified intelligence about residential job sites before they bid.\n\nQuestions? Email hello@prorated.app" },
      { title: "2. Information We Collect", body: "When you create an account: name, email, contractor license number (verification only), trade type and state.\n\nWhen you use the app: addresses you search, reviews you submit, addresses you save, push notification preferences.\n\nWe do NOT collect your precise GPS location." },
      { title: "3. How We Use Your Information", body: "Only to:\n• Verify your contractor license\n• Display your reviews to other verified trade professionals\n• Send push notifications (if opted in)\n• Improve the platform\n• Respond to support requests\n• Process Pro subscription payments via Stripe" },
      { title: "4. What We Will Never Do", body: "❌ Sell, rent, or license your personal identifiable data to any third party\n❌ Share your contractor license number publicly or with homeowners\n❌ Use your review history for targeted advertising\n❌ Share your email, name, or contact info with third parties for marketing\n❌ Store your payment card details (Stripe handles all payments securely)\n\nOur revenue comes from platform subscriptions — never from selling individual user data.\n\nIf we ever change this policy, we will provide 30 days advance written notice to all registered users via email before any change takes effect." },
      { title: "8. How We May Use Aggregate Data", body: "ProRated may produce and share anonymized, aggregate market reports derived from platform activity. For example: regional trends in contractor job site ratings, or summary statistics about work types performed in a given area.\n\nAggregate reports contain NO personally identifiable information — no names, emails, license numbers, or individual contractor data. This type of market intelligence reporting does not constitute selling user data and is a standard industry practice." },
      { title: "9. Your License Number", body: "Stored encrypted in our database. Used only to verify you are a licensed trade professional. Never displayed publicly or shared with homeowners. Accessible only to ProRated admin for verification purposes." },
      { title: "10. Your Rights", body: "You have the right to access, correct, delete, and export your data.\n\nTo exercise any of these rights, email hello@prorated.app" },
      { title: "11. Contact", body: "📧 hello@prorated.app\n🛡️ ProRated · Hoover, Alabama, USA" },
    ],
    contact: "Contact hello@prorated.app →",
  },
  es: {
    title:   "Política de Privacidad",
    updated: "Última actualización: mayo 2026",
    promise: "Nuestra Promesa Principal",
    promiseBody: "NUNCA venderemos, compartiremos, alquilaremos ni distribuiremos tu información personal, datos de contratista o números de licencia a ningún tercero — anunciantes, corredores de datos ni nadie más.",
    sections: [
      { title: "1. Quiénes Somos", body: "ProRated es una plataforma de calificación de sitios de trabajo de contratista a contratista. Ayudamos a los contratistas con licencia a compartir información verificada sobre sitios de trabajo residenciales antes de hacer ofertas.\n\n¿Preguntas? Escríbenos a hello@prorated.app" },
      { title: "2. Información que Recopilamos", body: "Al crear una cuenta: nombre, correo electrónico, número de licencia de contratista (solo verificación), tipo de oficio y estado.\n\nAl usar la app: direcciones que buscas, reseñas que envías, direcciones guardadas, preferencias de notificaciones.\n\nNO recopilamos tu ubicación GPS precisa." },
      { title: "3. Cómo Usamos tu Información", body: "Solo para:\n• Verificar tu licencia de contratista\n• Mostrar tus reseñas a otros contratistas verificados\n• Enviar notificaciones push (si optaste por recibirlas)\n• Mejorar la plataforma\n• Responder solicitudes de soporte\n• Procesar pagos de suscripción Pro a través de Stripe" },
      { title: "4. Lo que Nunca Haremos", body: "❌ Vender, alquilar o licenciar tus datos personales identificables a terceros\n❌ Compartir tu número de licencia públicamente o con propietarios\n❌ Usar tu historial de reseñas para publicidad dirigida\n❌ Compartir tu correo, nombre o datos de contacto con terceros\n❌ Almacenar los detalles de tu tarjeta de pago (Stripe maneja todo)\n\nNuestros ingresos provienen de suscripciones de contratistas, suscripciones de agentes inmobiliarios y publicidad de proveedores — nunca de la venta de datos individuales.\n\nSi cambiamos esta política, notificaremos a todos los usuarios registrados con 30 días de anticipación por correo electrónico." },
      { title: "8. Uso de Datos Agregados", body: "ProRated puede producir y compartir informes de mercado anónimos y agregados derivados de la actividad de la plataforma. Por ejemplo: tendencias regionales en calificaciones de sitios de trabajo, o estadísticas sobre tipos de trabajo realizados en un área.\n\nLos informes agregados NO contienen información de identificación personal — sin nombres, correos, números de licencia ni datos individuales. Este tipo de inteligencia de mercado no constituye venta de datos de usuarios." },
      { title: "9. Tu Número de Licencia", body: "Almacenado encriptado en nuestra base de datos. Usado solo para verificar que eres un contratista con licencia. Nunca se muestra públicamente ni se comparte con propietarios. Solo accesible para el administrador de ProRated para verificación." },
      { title: "10. Tus Derechos", body: "Tienes derecho a acceder, corregir, eliminar y exportar tus datos.\n\nPara ejercer cualquiera de estos derechos, escribe a hello@prorated.app" },
      { title: "11. Contacto", body: "📧 hello@prorated.app\n🛡️ ProRated · Hoover, Alabama, EE.UU." },
    ],
    contact: "Contactar hello@prorated.app →",
  },
};

export default function PrivacyPage({ go, goBack }) {
  const { lang } = useLang();
  const P = PRIVACY[lang] || PRIVACY.en;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: BRAND.dark, padding: "1.5rem", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <Logo size={48} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#F8FAFC", marginBottom: 6 }}>{P.title}</h1>
        <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>{P.updated}</p>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
        <button onClick={() => goBack ? goBack() : go("home")}
          style={{ background: "none", border: "none", color: BRAND.blue, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginBottom: "1.5rem", padding: 0 }}>
          ← Back
        </button>

        {/* Core Promise */}
        <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 14, padding: "1.25rem 1.5rem", marginBottom: "2rem", display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>🔒</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#166534", marginBottom: 6 }}>{P.promise}</div>
            <div style={{ fontSize: 13, color: "#166534", lineHeight: 1.7 }}>{P.promiseBody}</div>
          </div>
        </div>

        {/* Sections */}
        {P.sections.map(({ title, body }) => (
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
          {P.contact}
        </a>
      </div>
    </div>
  );
}
