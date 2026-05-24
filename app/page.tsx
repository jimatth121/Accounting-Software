import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

const features = [
  {
    icon: "↗",
    title: "Real-time dashboards",
    description: "See revenue, expenses, profit, and outstanding balances at a glance — with charts that update instantly.",
    accent: "from-brand-500 to-fuchsia-500"
  },
  {
    icon: "✦",
    title: "AI finance assistant",
    description: "Ask plain-language questions about your books. Get answers from real records — not made up.",
    accent: "from-cyan-500 to-brand-500"
  },
  {
    icon: "▤",
    title: "Invoices in seconds",
    description: "Create, send, and reconcile invoices fast. Tax, discounts, and recurring billing all built in.",
    accent: "from-amber-500 to-rose-500"
  },
  {
    icon: "▣",
    title: "Inventory tracking",
    description: "Manage stock, set reorder levels, and get notified when products run low.",
    accent: "from-emerald-500 to-cyan-500"
  },
  {
    icon: "▽",
    title: "Smart expense capture",
    description: "Upload a receipt and let AI extract the data. Categorize and approve in one click.",
    accent: "from-rose-500 to-fuchsia-500"
  },
  {
    icon: "◍",
    title: "Beautiful reports",
    description: "Profit & loss, customer balances, chart of accounts — all visualized, exportable, and ready to share.",
    accent: "from-violet-500 to-brand-500"
  }
];

const stats = [
  { value: "98%", label: "Time saved on bookkeeping" },
  { value: "10k+", label: "Active small businesses" },
  { value: "4.9", label: "Average rating" },
  { value: "24/7", label: "AI assistant available" }
];

const testimonials = [
  {
    quote: "SmartBooks cut my month-end close from 3 days to 3 hours. The AI assistant is uncanny.",
    name: "Adaeze Okafor",
    role: "Founder, Apex Studio"
  },
  {
    quote: "Finally an accounting app that doesn't feel like 2010. The dashboard alone is worth the price.",
    name: "Tunde Bakare",
    role: "CFO, Lagoon Logistics"
  },
  {
    quote: "We onboarded the whole finance team in an afternoon. The pre-loaded demo data made training trivial.",
    name: "Priya Sharma",
    role: "Head of Ops, Greenfield Agritech"
  }
];

const pricing = [
  {
    name: "Starter",
    price: "₦0",
    period: "/ forever",
    description: "Perfect to try SmartBooks AI",
    features: ["Up to 5 invoices/mo", "Unlimited customers", "Basic dashboard", "Email support"],
    cta: "Get started",
    highlight: false
  },
  {
    name: "Growth",
    price: "₦15,000",
    period: "/ month",
    description: "For growing businesses",
    features: ["Unlimited invoices", "AI assistant", "Inventory & payments", "Custom reports", "Priority support"],
    cta: "Start free trial",
    highlight: true
  },
  {
    name: "Scale",
    price: "Custom",
    period: "",
    description: "For larger teams",
    features: ["Everything in Growth", "Multi-user roles", "Audit logs", "API access", "Dedicated CSM"],
    cta: "Contact sales",
    highlight: false
  }
];

export default async function LandingPage() {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);

  return (
    <main className="relative overflow-hidden bg-slate-950 text-white">
      {/* Decorative gradients */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[800px]">
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute right-0 top-40 h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/25 blur-3xl" />
        <div className="absolute left-1/2 top-96 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      {/* Nav */}
      <header className="relative z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-sm font-extrabold text-white shadow-lg shadow-fuchsia-500/40">
              SB
            </div>
            <span className="text-base font-bold tracking-tight">SmartBooks AI</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <a href="#testimonials" className="hover:text-white">Customers</a>
          </nav>

          <div className="flex items-center gap-2">
            {isSignedIn ? (
              <Link
                href="/dashboard"
                className="rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 hover:-translate-y-0.5 transition"
              >
                Go to dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-slate-200 hover:text-white sm:inline-flex"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-500/40"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-12 lg:px-10 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-cyan-300 backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
              Now with AI-powered insights
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Accounting that
              <br />
              <span className="bg-gradient-to-r from-cyan-300 via-brand-400 to-fuchsia-400 bg-clip-text text-transparent">
                actually feels modern.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
              Track invoices, expenses, payments, and inventory in one beautiful workspace. With AI that answers
              questions about your finances — and pre-loaded demo data so you can explore in 30 seconds.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-brand-500/40 transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-brand-500/50"
              >
                Start free trial →
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-6 text-sm text-slate-400">
              <div className="flex -space-x-2">
                {["from-rose-500 to-amber-500", "from-cyan-500 to-brand-500", "from-emerald-500 to-cyan-500", "from-fuchsia-500 to-brand-500"].map((g, i) => (
                  <div key={i} className={`h-8 w-8 rounded-full border-2 border-slate-950 bg-gradient-to-br ${g}`} />
                ))}
              </div>
              <p>
                <strong className="text-white">10,000+</strong> small businesses trust SmartBooks
              </p>
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-brand-500/30 via-fuchsia-500/30 to-cyan-500/30 blur-2xl" />
            <div className="relative rounded-3xl border border-white/10 bg-white/5 p-3 shadow-2xl backdrop-blur-xl">
              <div className="overflow-hidden rounded-2xl bg-slate-950/80">
                {/* Mock dashboard header */}
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-xs text-slate-400">smartbooks.ai/dashboard</span>
                  <div />
                </div>
                {/* Mock content */}
                <div className="p-5">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Revenue", value: "₦2.4M", trend: "+12%", color: "from-brand-500/20 to-brand-500/5", text: "text-brand-300" },
                      { label: "Expenses", value: "₦890k", trend: "+3%", color: "from-rose-500/20 to-rose-500/5", text: "text-rose-300" },
                      { label: "Profit", value: "₦1.5M", trend: "+18%", color: "from-emerald-500/20 to-emerald-500/5", text: "text-emerald-300" }
                    ].map((m) => (
                      <div key={m.label} className={`rounded-xl border border-white/10 bg-gradient-to-br ${m.color} p-3`}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{m.label}</p>
                        <p className="mt-1 text-lg font-bold">{m.value}</p>
                        <p className={`text-[10px] font-semibold ${m.text}`}>{m.trend}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-300">Revenue overview</p>
                      <span className="text-[10px] text-slate-500">Last 6 months</span>
                    </div>
                    <div className="flex items-end gap-1.5">
                      {[40, 55, 35, 70, 50, 85, 65, 90, 75, 100, 85, 95].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t bg-gradient-to-t from-brand-500 to-fuchsia-400"
                          style={{ height: `${h * 0.8}px` }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Outstanding</p>
                      <p className="mt-1 text-base font-bold">₦435k</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-amber-400 to-rose-400" />
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-brand-500/10 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">✦ AI Insight</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-300">Your top expense category is up 23% this month — consider reviewing.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-slate-950/80 p-8 text-center backdrop-blur">
              <p className="bg-gradient-to-r from-cyan-300 to-fuchsia-300 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-24 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">Features</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Everything you need.
            <br />
            <span className="bg-gradient-to-r from-cyan-300 to-fuchsia-300 bg-clip-text text-transparent">Nothing you don&apos;t.</span>
          </h2>
          <p className="mt-4 text-base text-slate-300">
            A finance OS built for small businesses. Powerful where it matters, simple everywhere else.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/10"
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.accent} text-xl font-bold shadow-lg`}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold tracking-tight">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative z-10 mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">Loved by founders</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Built for small businesses.
            <br />
            <span className="bg-gradient-to-r from-cyan-300 to-fuchsia-300 bg-clip-text text-transparent">Trusted by 10,000+ of them.</span>
          </h2>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-6 backdrop-blur"
            >
              <div className="flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              <blockquote className="flex-1 text-sm leading-relaxed text-slate-200">&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption className="flex items-center gap-3 border-t border-white/10 pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-sm font-bold">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 mx-auto max-w-7xl px-6 py-24 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">Pricing</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Simple, transparent pricing.
          </h2>
          <p className="mt-4 text-base text-slate-300">Start free. Upgrade when you grow. Cancel anytime.</p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {pricing.map((plan) => (
            <div
              key={plan.name}
              className={`relative overflow-hidden rounded-3xl border p-7 backdrop-blur ${
                plan.highlight
                  ? "border-brand-400/50 bg-gradient-to-br from-brand-500/20 to-fuchsia-500/10 shadow-xl shadow-brand-500/20"
                  : "border-white/10 bg-white/5"
              }`}
            >
              {plan.highlight ? (
                <span className="absolute -top-3 left-7 rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-950">
                  Most popular
                </span>
              ) : null}
              <h3 className="text-lg font-bold tracking-tight">{plan.name}</h3>
              <p className="mt-1 text-sm text-slate-400">{plan.description}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                <span className="text-sm text-slate-400">{plan.period}</span>
              </div>
              <ul className="mt-6 grid gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 text-[9px] font-bold text-slate-900">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className={`mt-7 block w-full rounded-xl px-5 py-3 text-center text-sm font-semibold transition ${
                  plan.highlight
                    ? "bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30 hover:-translate-y-0.5"
                    : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 lg:px-10">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-500 to-fuchsia-500 p-10 text-center shadow-2xl shadow-brand-500/30 sm:p-16">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/15 blur-2xl" />
            <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-2xl" />
          </div>
          <div className="relative">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Ready to ditch the spreadsheet?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-white/90">
              Get a fully-loaded workspace in 30 seconds. No credit card required.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/sign-up"
                className="rounded-xl bg-white px-7 py-3 text-sm font-semibold text-brand-700 shadow-xl hover:-translate-y-0.5 transition"
              >
                Start free trial →
              </Link>
              <Link
                href="/sign-in"
                className="rounded-xl border border-white/30 bg-white/10 px-7 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
              >
                I have an account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-xs font-extrabold">
              SB
            </div>
            <span className="text-sm font-semibold">SmartBooks AI</span>
          </div>
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} SmartBooks AI · Built with ◇ in Lagos</p>
        </div>
      </footer>
    </main>
  );
}
