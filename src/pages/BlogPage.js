import { useState } from "react";
import { useLang } from "../hooks/useLang";
import { t } from "../i18n/translations";
import { BRAND } from "../components/UI";
import Logo from "../components/Logo";

const ARTICLES = [
  {
    slug:     "protect-from-slow-paying-homeowners",
    title:    "How to Protect Your Contracting Business From Slow-Paying Homeowners",
    desc:     "Payment delays are one of the leading causes of cash flow problems for small contractors. Here's how to spot the warning signs before you bid.",
    category: "Business",
    readTime: "5 min read",
    date:     "June 2026",
    keywords: ["slow paying homeowners", "contractor payment protection", "homeowner payment history"],
    content: `
Every contractor knows the feeling. You finish the job, send the invoice, and then wait. Phone calls go unreturned. Promises get made. Thirty, sixty, ninety days later you're still chasing money you already earned.

Payment delays aren't just frustrating — they're a genuine business risk. For small contractors running tight margins, one slow-paying homeowner can create a cash crunch that affects your entire operation.

**Why payment history matters before the bid**

By the time you've finished the job, it's too late. The leverage you had at the estimate stage — the ability to walk away — is gone. You've invested labor, materials, and time.

The smarter move is to know before you commit. A homeowner who paid three previous contractors within ten days is almost certainly going to pay you the same way. A homeowner who took sixty days with every contractor before you? That pattern rarely changes.

**The five warning signs of a slow-paying homeowner**

BULLETS:Vague or deflecting answers about payment terms at the estimate stage|Requesting work to begin before a contract is signed|Multiple different contractors on the same property in a short period|Excessive scope changes or additions before work even begins|Peer reports of payment delays at that specific address

**What to do when you see red flags**

If peer-sourced payment data on an address shows a pattern of delays, you have options. Require a larger upfront deposit. Build payment milestones into the contract tied to project phases. Decline the job and redirect your capacity to better opportunities.

The data doesn't make the decision for you. It gives you what you need to make the decision yourself.

**Building your own protection**

A written contract for every job, regardless of size. A clear payment schedule with specific dates, not vague terms like "upon completion." Lien rights preserved at the start of every project, which protects your ability to file a mechanics lien if payment is withheld.

And increasingly, access to platforms where licensed trade professionals share verified payment histories so everyone in the trade community can bid smarter. The goal isn't to avoid every difficult homeowner. It's to go in with your eyes open.
    `,
  },
  {
    slug:     "5-things-contractors-know-before-bidding",
    title:    "5 Things Every Contractor Should Know Before Bidding a Residential Job",
    desc:     "Most contractors show up to bid blind. Here are the five critical pieces of intel that separate confident bids from expensive surprises.",
    category: "Tips",
    readTime: "4 min read",
    date:     "June 2026",
    keywords: ["contractor bidding tips", "residential bid preparation", "know before you bid"],
    content: `
The bid is where the job is won or lost — not just on price, but on information. Contractors who consistently win profitable jobs aren't just pricing well. They're showing up with more context than their competition.

Here are the five things every contractor should know before submitting a residential bid.

**1. Payment history at that address**

This is the most important and least available piece of information in the industry. How a homeowner has paid previous contractors is the single strongest predictor of how they'll pay you. Peer-sourced payment data by address is becoming more available — and contractors who use it consistently report fewer disputes and faster payments.

**2. Site access and staging conditions**

Will your equipment fit in the driveway? Is there street parking for your crew? HOA restrictions on working hours or material storage? These questions seem minor until you show up with a boom lift and realize you can't get it to the backyard. Contractors who've worked the property before know things you don't.

**3. Work history on the property**

What trades have already been on this job? What systems have recently been replaced? If a homeowner is getting bids for a roof replacement and three roofers have already been there in the past year, that's worth knowing. Either the work keeps failing, or the homeowner is a chronic shopper who never commits.

**4. Ownership timeline**

Reviews and ratings are only as useful as they are current. A five-star payment rating from four years ago tells you about the previous owner, not the current one. Knowing when the property changed hands — and whether peer reports predate that change — is critical context.

**5. Communication and decision-making style**

Is this a homeowner who makes decisions quickly and stays out of the way? Or one who wants to be consulted on every detail and changes their mind constantly? Scope creep driven by an indecisive homeowner is one of the most reliable ways to turn a profitable job into a break-even. Peer experience at that address tells you which kind you're dealing with.

The common thread is verified peer intelligence. The trade community has always shared this information informally — at supply houses, on job sites, over the phone. The difference now is having it available before you drive out to the estimate.
    `,
  },
  {
    slug:     "scope-creep-how-to-protect-yourself",
    title:    "Scope Creep: How to Recognize It Before It Costs You",
    desc:     "Mid-job scope changes are one of the biggest hidden costs in residential contracting. Here's how to identify the patterns and protect your margin.",
    category: "Tips",
    readTime: "5 min read",
    date:     "June 2026",
    keywords: ["scope creep contractors", "mid job changes residential", "protect contractor margin"],
    content: `
You bid a kitchen remodel. Three weeks in, the homeowner wants to add the butler's pantry. Then the laundry room. Then new flooring in the hallway "since you're already here."

Sound familiar? Scope creep is one of the most consistent margin-killers in residential contracting — and it almost always starts before the first nail is driven.

**What scope creep actually costs**

The direct cost is obvious: more labor, more materials, more time. But the hidden costs are just as damaging. Scope additions push your schedule back, creating conflicts with other jobs. They create ambiguity about what's included and what isn't, setting up disputes at invoicing. And they gradually erode your relationship with a homeowner who may eventually feel the job is overpriced — even though they're the ones who expanded it.

**The patterns that predict it**

Scope creep rarely appears from nowhere. There are reliable patterns that show up before the job even starts:

BULLETS:The homeowner describes the project in vague terms that keep expanding during the walk-through|Multiple contractors have been on the property recently without completing the work|The homeowner asks for "while you're at it" additions during the estimate itself|They reference previous contractors who "didn't finish everything" or "left things undone"|A peer who worked the same address flagged scope change patterns in their notes

**How to protect yourself**

The contract is your first line of defense. A detailed written scope — specific materials, specific areas, specific exclusions — makes it harder to expand the project without a formal change order. Every addition, however small, should come with a signed change order and revised timeline before work proceeds.

Equally important is the conversation before the contract. Ask directly: "Is there anything else you've been thinking about while we're doing this work?" Better to surface the full wishlist up front than discover it in pieces over three weeks.

**Using peer data to set expectations**

If other trade professionals have flagged scope change patterns at an address, you can go into the job with that context. Your contract language can be tighter. Your change order process can be communicated more explicitly at the outset. You're not penalizing a homeowner for someone else's experience — you're applying professional practice that protects both of you.

The homeowners who expand scope constantly aren't usually doing it maliciously. They just don't have a mental model for how change orders work. Your job is to give them one before the work starts, not after.
    `,
  },
  {
    slug:     "job-site-obstacles-what-contractors-dont-talk-about",
    title:    "Job Site Obstacles: The Things Contractors Don't Talk About (But Should)",
    desc:     "Access problems, unexpected conditions, and on-site obstacles cost contractors thousands every year. Peer intel changes that.",
    category: "Education",
    readTime: "5 min read",
    date:     "June 2026",
    keywords: ["job site obstacles", "contractor site access", "unexpected conditions residential"],
    content: `
There's a category of job loss that doesn't show up in the invoice and doesn't get talked about in the field: the cost of showing up to a job that wasn't what you expected.

The driveway that floods when a truck parks in it. The backyard with no gate access that requires a full day of workarounds. The attic that's been partially modified by a previous DIY project and creates a code problem you didn't price. The basement that smells like a sump pump problem the homeowner never mentioned.

These aren't edge cases. They're common. And they're largely preventable with the right information before the estimate.

**The five most common site obstacles by trade**

BULLETS:Access and staging — driveways too narrow, no equipment clearance, HOA restrictions, parking limitations that add crew time|Existing conditions — prior work that doesn't meet current code, deferred maintenance that intersects with your scope, undisclosed damage|Utilities and systems — unexpected routing of electrical, plumbing, or HVAC that changes your approach mid-job|On-site interference — pets, children, home office workers, or homeowner presence that limits working hours or work areas|Environmental conditions — drainage issues, water intrusion, mold, or pest evidence that wasn't disclosed at estimate

**Why these don't get priced correctly**

Most of these obstacles aren't visible at the estimate. You're looking at the finished surfaces, not what's behind them. You're walking through a house with a homeowner who may not know their attic framing is non-standard, or who genuinely forgot the basement floods in heavy rain.

The result is that your contingency has to cover a wide range of unknowns — which either makes your bid uncompetitive or leaves you absorbing costs you didn't anticipate.

**What peer data changes**

When trade professionals who've worked an address leave notes about what they found — not just scores, but specific observations — the next professional who walks in has a materially different starting point. They know the driveway situation. They know the basement history. They know the attic was modified. That context changes what they look for on the walk-through and how they price the unknowns.

This is the kind of information that's always existed in the trade community. It just hasn't been organized in a way that makes it available before the bid — until now.
    `,
  },
  {
    slug:     "what-is-job-site-rating",
    title:    "What is a Job Site Rating — and Why Contractors Are Using Them",
    desc:     "Job site ratings are changing how trade professionals bid on residential work. Here's what they are, how they work, and why they matter.",
    category: "Education",
    readTime: "4 min read",
    date:     "June 2026",
    keywords: ["job site ratings", "contractor ratings homeowner", "residential job site review"],
    content: `
If you've used Yelp, you understand reviews. A restaurant gets rated on food, service, and atmosphere. The ratings accumulate over time into a reputation that helps future customers decide whether to walk in.

Job site ratings apply the same concept to residential construction — with one key difference. The person being rated isn't the contractor. It's the homeowner and the property.

**What a job site rating actually measures**

A job site rating captures the verified experience of licensed trade professionals who have worked at a specific residential address. It covers five dimensions:

BULLETS:Payment reliability — did the homeowner pay on time, in full, without dispute?|Site access — was the property accessible for equipment, materials, and crew staging?|Communication — was the homeowner responsive, clear, and reasonable to work with?|Timeline respect — did the homeowner make decisions promptly and honor agreed start dates?|Obstacles — were there unexpected conditions, scope changes, or access issues that affected the job?

Each dimension gets rated by trade professionals who have direct experience at that address. The ratings are aggregated, weighted toward more recent reviews, and surfaced to other trade professionals before they bid.

**Who leaves the ratings**

On peer platforms, only verified licensed trade professionals can submit ratings. License numbers are checked against state databases before accounts are approved. This keeps the data trustworthy — it's not homeowners rating themselves, and it's not competitors gaming the system. It's peer intelligence from the trade community.

**Why contractors are using them**

The reason is simple: information reduces risk. Every contractor who has shown up to a job with no context and gotten burned — by a slow-payer, by access problems, by a scope-creeping homeowner — understands what they would have given to know ahead of time.

Job site ratings don't make the decision for you. They give you what you need to make a better one.

**The network effect**

The more contractors use a rating platform, the more valuable it becomes. An address with ten verified reviews from electricians, plumbers, roofers, and painters tells a richer story than one with a single entry. Every contractor who leaves a rating after a job contributes to a shared intelligence layer that makes the whole community more effective.
    `,
  },
  {
    slug:     "homeowner-communication-the-hidden-factor",
    title:    "Homeowner Communication: The Hidden Factor in Every Residential Job",
    desc:     "Difficult communication patterns cost contractors time, margin, and sanity. Here's how to read the signs early — and what peer data tells you that an estimate walkthrough can't.",
    category: "Tips",
    readTime: "4 min read",
    date:     "June 2026",
    keywords: ["homeowner communication contractors", "difficult homeowners residential", "contractor client relationship"],
    content: `
You can price a job correctly, show up on time, and do excellent work — and still end up in a dispute because of how a homeowner communicates.

This is the variable that doesn't get enough attention in residential contracting. Payment terms get written into contracts. Scope gets defined. Access gets photographed. But communication style? You find that out on day one of the job, when it's too late to adjust your approach.

**What communication problems actually look like**

Poor homeowner communication isn't usually hostile — it's more often just misaligned. The homeowner who can't make a decision about the tile selection until you're two days into the installation. The one who emails at 11pm and expects a response before 7am. The one who has a different answer every time you ask about a detail that affects your work.

These patterns compound. A delayed decision on materials pushes your schedule. A last-minute change on day three creates a ripple through your whole week. And the homeowner who changes their mind repeatedly often can't understand why the bill came in higher than expected — because from their perspective, they were just being thorough.

**The signals at the estimate stage**

BULLETS:The homeowner can't describe what they want without changing the description mid-sentence|They reference multiple previous contractors without clear explanations of why the work wasn't completed|They ask for the estimate in writing but seem uncomfortable when you ask for decisions in writing too|They want work to start immediately but are vague on availability for decisions and access|Other contractors have flagged communication challenges at that specific address

**Why this matters for your business**

A job with a difficult communicator doesn't just cost you time on that project. It affects your capacity for other work, elevates your stress, and often ends with a review or reputation issue you didn't deserve. The contractor who came in after you doesn't know any of this — unless someone told them.

Peer platforms that capture communication scores by address create a layer of transparency that protects everyone. Not to penalize difficult homeowners, but to give the next professional an accurate starting point for how to structure the job and the relationship.

The contractors who manage these jobs well aren't just lucky. They went in knowing what to expect — and prepared accordingly.
    `,
  },
  {
    slug:     "vet-residential-job-site",
    title:    "How to Vet a Residential Job Site Before You Commit",
    desc:     "A practical checklist for trade professionals to evaluate any residential job site before submitting a bid — covering payment risk, access, and work history.",
    category: "Tips",
    readTime: "5 min read",
    date:     "June 2026",
    keywords: ["how to vet job site", "residential contractor checklist", "before you bid checklist contractor"],
    content: `
Most contractors have a gut feel for a job site from the moment they pull up. The condition of the property, how the homeowner greets you, whether the scope is clearly defined — experienced contractors read these signals instinctively.

But gut feel has limits. It can't tell you that the homeowner took sixty days to pay the last three contractors. It can't show you that the driveway floods when it rains. It can't surface the scope change pattern that turned what looked like a two-week job into a six-week grind.

Here's a systematic approach to vetting any residential job site before you commit.

**Before you leave the office**

Search the address. Platforms that aggregate verified trade professional ratings by property address are increasingly available. Check payment scores, access ratings, work history, and any ownership change flags. If the address has no data, that's neutral — but a pattern of low payment scores or access complaints is a signal worth taking seriously.

Check permit history if available in your county. Many municipalities publish permit records online. Multiple permits for the same type of work in a short period can indicate quality issues with previous contractors — or a homeowner who doesn't follow through.

Verify the ownership timeline. A quick search of the county tax assessor's records can reveal how recently the property changed hands. Reviews from three years ago on a property that sold six months ago may not reflect the current owner at all.

**At the estimate**

Observe the condition of previous work. If a homeowner is asking you to replace something recently installed, ask why. The answer tells you a lot about their expectations and their relationship with the previous contractor.

Ask directly about timeline and payment terms. A homeowner who has clear, confident answers is a different conversation than one who hedges on both.

Note the site conditions that will affect your work. Where will your crew park? Is the driveway accessible for your equipment? Are there constraints on working hours?

**Scoring what you find**

Not every red flag is a deal-breaker. The goal isn't to find perfect job sites — it's to go in with accurate expectations so you can price, schedule, and structure the contract accordingly.

A job with a moderate payment risk history and tight site access isn't necessarily one to decline. It's one where a larger deposit, a defined scope, and explicit contract language about payment milestones are non-negotiable.

The contractors who consistently run profitable businesses aren't the ones who avoid all risk. They're the ones who price it correctly.
    `,
  },
];


function ArticleCard({ article, onClick, lang }) {
  const catColors = {
    Business:  { bg: "#EFF6FF", color: "#1E40AF" },
    Tips:      { bg: "#F0FDF4", color: "#166534" },
    Education: { bg: "#FFFBEB", color: "#92400E" },
    Licensing: { bg: "#FAF5FF", color: "#6B21A8" },
  };
  const cat = catColors[article.category] || catColors.Tips;

  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff", border: `1px solid ${BRAND.border}`,
        borderRadius: 16, padding: "1.25rem",
        cursor: "pointer", transition: "all 0.15s",
      }}
      onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"; }}
      onMouseOut={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
        <span style={{ background: cat.bg, color: cat.color, fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {article.category}
        </span>
        <span style={{ fontSize: 11, color: BRAND.gray }}>{article.readTime}</span>
        <span style={{ fontSize: 11, color: BRAND.gray, marginLeft: "auto" }}>{article.date}</span>
      </div>
      <h2 style={{ fontSize: 15, fontWeight: 800, color: BRAND.dark, lineHeight: 1.35, margin: "0 0 8px" }}>
        {article.title}
      </h2>
      <p style={{ fontSize: 12, color: BRAND.gray, lineHeight: 1.65, margin: "0 0 12px" }}>
        {article.desc}
      </p>
      <div style={{ fontSize: 12, color: BRAND.blue, fontWeight: 600 }}>{t(lang,"blog.readMore") || "Read article →"}</div>
    </div>
  );
}

function ArticleView({ article, onBack, lang }) {
  const paragraphs = article.content.trim().split("\n\n").filter(Boolean);

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "1.5rem 1.25rem 5rem" }}>
      <button onClick={onBack}
        style={{ background: "none", border: "none", color: BRAND.blue, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", padding: "0 0 16px", display: "flex", alignItems: "center", gap: 4 }}>
        {t(lang,"blog.backBtn") || "← All Articles"}
      </button>

      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: BRAND.gray, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {article.category}
          </span>
          <span style={{ fontSize: 10, color: BRAND.gray }}>· {article.readTime} · {article.date}</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: BRAND.dark, lineHeight: 1.2, margin: "0 0 12px" }}>
          {article.title}
        </h1>
        <p style={{ fontSize: 15, color: BRAND.gray, lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>
          {article.desc}
        </p>
      </div>

      <div style={{ borderTop: `1px solid ${BRAND.border}`, paddingTop: "1.5rem" }}>
        {paragraphs.map((para, i) => {
          if (para.startsWith("**") && para.endsWith("**")) {
            return <h3 key={i} style={{ fontSize: 16, fontWeight: 800, color: BRAND.dark, margin: "1.5rem 0 0.5rem", lineHeight: 1.3 }}>{para.replace(/\*\*/g, "")}</h3>;
          }
          if (para.startsWith("*") && para.endsWith("*")) {
            return <p key={i} style={{ fontSize: 14, color: BRAND.dark, fontWeight: 700, margin: "0.75rem 0 0.25rem" }}>{para.replace(/\*/g, "")}</p>;
          }
          if (para.startsWith("BULLETS:")) {
            const items = para.replace("BULLETS:", "").split("|");
            return (
              <ul key={i} style={{ margin: "0.5rem 0 1.25rem", paddingLeft: "1.5rem", display: "flex", flexDirection: "column", gap: 8 }}>
                {items.map((item, j) => (
                  <li key={j} style={{ fontSize: 14, color: "#334155", lineHeight: 1.7 }}>{item.trim()}</li>
                ))}
              </ul>
            );
          }
          return <p key={i} style={{ fontSize: 14, color: "#334155", lineHeight: 1.8, margin: "0 0 1rem" }}>{para}</p>;
        })}
      </div>

      <div style={{ background: BRAND.dark, borderRadius: 16, padding: "1.25rem", textAlign: "center", marginTop: "2rem" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#F8FAFC", marginBottom: 6 }}>Ready to bid smarter?</div>
        <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 14 }}>Join verified trade professionals on ProRated — free to create an account.</div>
        <a href="https://prorated.app/signup" style={{ display: "inline-block", background: "#2563EB", color: "#fff", padding: "10px 24px", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
          Create Free Account →
        </a>
      </div>
    </div>
  );
}

export default function BlogPage({ go }) {
  const { lang } = useLang();
  const [activeArticle, setArticle] = useState(null);

  if (activeArticle) return <ArticleView article={activeArticle} onBack={() => setArticle(null)} lang={lang} />;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "1.5rem 1.25rem 5rem", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <Logo size={44} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: BRAND.dark, margin: "0 0 6px" }}>{t(lang,"blog.title") || "ProRated Blog"}</h1>
        <p style={{ fontSize: 14, color: BRAND.gray, margin: 0, lineHeight: 1.6 }}>{t(lang,"blog.subtitle") || "Practical Guides for Trade Professionals"}</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {ARTICLES.map(a => <ArticleCard key={a.slug} article={a} onClick={() => setArticle(a)} lang={lang} />)}
      </div>

      <div style={{ marginTop: "2rem", background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 16, padding: "1.25rem", textAlign: "center" }}>
        <div style={{ fontSize: 13, color: BRAND.gray, marginBottom: 10 }}>More articles coming soon. Have a topic you'd like us to cover?</div>
        <a href="mailto:hello@prorated.app?subject=Blog topic idea" style={{ color: BRAND.blue, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
          Send us a suggestion →
        </a>
      </div>
    </div>
  );
}
