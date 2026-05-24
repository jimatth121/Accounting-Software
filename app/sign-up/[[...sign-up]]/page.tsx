import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-fuchsia-500/30 blur-3xl" />
        <div className="absolute -right-32 bottom-20 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      <div className="relative z-10 grid min-h-screen lg:grid-cols-2">
        <div className="hidden flex-col justify-between p-10 lg:flex xl:p-14">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-base font-extrabold text-white shadow-xl shadow-fuchsia-500/40">
              SB
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300">SmartBooks AI</p>
              <h1 className="text-base font-bold tracking-tight">Accounting workspace</h1>
            </div>
          </Link>

          <div className="max-w-md">
            <span className="inline-block rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-cyan-300 backdrop-blur">
              ✦ Free 14-day trial
            </span>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight">
              Start your <span className="bg-gradient-to-r from-cyan-300 to-fuchsia-300 bg-clip-text text-transparent">finance OS</span> today
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              Sign up and we&apos;ll spin up a fully-loaded workspace — sample customers, invoices, expenses, the works. Just so you can play.
            </p>

            <div className="mt-8 grid gap-3">
              {[
                "Pre-loaded with realistic demo data so you can explore immediately",
                "Built-in AI assistant for natural-language finance questions",
                "Stunning dashboards with revenue, expense, and profit insights",
                "Inventory, payments, reports — everything in one workspace"
              ].map((item) => (
                <div key={item} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 text-[10px] font-bold text-slate-900">✓</span>
                  <span className="text-sm text-slate-200">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-500">© {new Date().getFullYear()} SmartBooks AI · All rights reserved</p>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-8 flex items-center gap-2 text-sm text-slate-400 hover:text-white lg:hidden">
              ← Back to home
            </Link>
            <SignUp
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl",
                  headerTitle: "text-white",
                  headerSubtitle: "text-slate-300",
                  socialButtonsBlockButton: "bg-white/10 border-white/20 text-white hover:bg-white/15",
                  socialButtonsBlockButtonText: "text-white font-medium",
                  dividerLine: "bg-white/20",
                  dividerText: "text-slate-400",
                  formFieldLabel: "text-slate-200",
                  formFieldInput: "bg-white/10 border-white/20 text-white placeholder:text-slate-500",
                  footerActionText: "text-slate-400",
                  footerActionLink: "text-cyan-300 hover:text-cyan-200",
                  formFieldHintText: "text-slate-400"
                }
              }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
