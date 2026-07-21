import Link from "next/link";
import { RegisterWizard } from "../../(auth)/register/register-wizard";
import {
  ShieldCheck,
  HelpCircle,
  CheckSquare,
  FileText,
  ArrowLeft,
  Lock,
  BadgeHelp,
} from "lucide-react";

export default function RegisterClinicPage() {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-slate-50/50 font-sans dark:bg-zinc-950">
      {/* Top minimal header */}
      <header className="sticky top-0 z-50 select-none border-b border-slate-200/60 bg-white/90 backdrop-blur-md dark:border-zinc-900 dark:bg-zinc-950/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-brand-teal"
            >
              <ArrowLeft className="size-3.5" />
              <span>Sign In</span>
            </Link>
            <span className="text-slate-200 dark:text-zinc-800">|</span>
            <div className="flex items-center space-x-2">
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <path
                  d="M8 12 L20 24 L32 12"
                  stroke="#0F172A"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  transform="translate(0,2)"
                ></path>
                <path
                  d="M8 28 L20 16 L32 28"
                  stroke="#10B981"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  transform="translate(0,-2)"
                ></path>
              </svg>
              <span className="text-sm font-extrabold tracking-tight text-slate-800 dark:text-white">
                Nextdoor<span className="text-brand-teal">Clinic</span>
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 rounded-lg border border-slate-200/60 bg-slate-50 px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-900">
            <ShieldCheck className="h-4 w-4 shrink-0 text-brand-teal" />
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-600 dark:text-zinc-400">
              Clinic Registration Portal
            </span>
          </div>
        </div>
      </header>

      {/* Main content grid */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-12 sm:px-8">
        <div className="grid items-start gap-12 lg:grid-cols-[1.5fr_1fr]">
          {/* LEFT: THE REGISTRATION WIZARD (Wrapped in a premium card) */}
          <div className="space-y-6">
            <div className="dark:border-zinc-850 shadow-premium rounded-none border border-slate-200/80 bg-white p-6 dark:bg-zinc-900 sm:p-8">
              <div className="mb-6 select-none space-y-2 border-b border-slate-100 pb-6 dark:border-zinc-900">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  Register Practice Workspace
                </h1>
                <p className="text-slate-450 dark:text-zinc-450 text-xs font-medium leading-relaxed">
                  Complete the onboarding wizard to establish your clinic directory branch, opening
                  hours, and subscription billing.
                </p>
              </div>

              <RegisterWizard />
            </div>
          </div>

          {/* RIGHT: HELPER CONTENT SIDEBAR (Corporate style) */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:pl-4">
            {/* Compliance Banner */}
            <div className="shadow-premium space-y-4 rounded-none border border-slate-800/80 bg-gradient-to-br from-slate-900 to-slate-950 p-6 text-white">
              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/15">
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                    UK Compliance Assured
                  </h4>
                  <span className="text-[9px] font-bold text-slate-400">
                    NHS Information Governance Standard
                  </span>
                </div>
              </div>
              <p className="text-slate-350 text-xs font-medium leading-relaxed">
                NextdoorClinic is designed in partnership with certified healthcare prescribers. All
                listings conform to General Pharmaceutical Council (GPhC) standards and Care Quality
                Commission (CQC) scope guidelines.
              </p>
            </div>

            {/* Onboarding checklist */}
            <div className="dark:border-zinc-850 shadow-premium space-y-4 rounded-none border border-slate-200/80 bg-white p-6 dark:bg-zinc-900">
              <h3 className="flex select-none items-center gap-2 border-b border-slate-50 pb-3 text-[11px] font-black uppercase tracking-widest text-slate-900 dark:border-zinc-900 dark:text-white">
                <CheckSquare className="size-4.5 text-brand-teal" />
                Onboarding Requirements
              </h3>
              <div className="space-y-4">
                {[
                  {
                    title: "Registered GPhC Reference",
                    desc: "Your regulatory reference ID is used to synchronize verified pharmacy database mappings.",
                  },
                  {
                    title: "Verification Certificates",
                    desc: "A scanned registration document or utility certificate must be supplied to approve listings.",
                  },
                  {
                    title: "Payment Method Check",
                    desc: "A valid card must be authorized to initiate your practice subscription plan.",
                  },
                  {
                    title: "Audit Log Verification",
                    desc: "Every registration request creates a permanent log entry for platform compliance checks.",
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-slate-200/60 bg-slate-50 text-[10px] font-black text-slate-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                      {idx + 1}
                    </span>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold leading-tight text-slate-800 dark:text-zinc-200">
                        {item.title}
                      </h4>
                      <p className="text-slate-450 dark:text-zinc-450 text-[10.5px] font-normal leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQs */}
            <div className="dark:border-zinc-850 shadow-premium space-y-4 rounded-none border border-slate-200/80 bg-white p-6 dark:bg-zinc-900">
              <h3 className="flex select-none items-center gap-2 border-b border-slate-50 pb-3 text-[11px] font-black uppercase tracking-widest text-slate-900 dark:border-zinc-900 dark:text-white">
                <HelpCircle className="size-4.5 text-brand-teal" />
                Onboarding FAQ
              </h3>
              <div className="space-y-4">
                {[
                  {
                    q: "How long does verification take?",
                    a: "Registrations are reviewed by our operations desk within 24 working hours under regulatory clinical protocols.",
                  },
                  {
                    q: "Can I manage services later?",
                    a: "Yes. You can activate services, alter opening hour slots, update staff rosters, and set prices from your dashboard.",
                  },
                ].map((faq, idx) => (
                  <div key={idx} className="space-y-1">
                    <h4 className="text-xs font-bold leading-tight text-slate-800 dark:text-zinc-200">
                      {faq.q}
                    </h4>
                    <p className="text-slate-450 dark:text-zinc-450 text-[10.5px] font-normal leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Global minimal footer */}
      <footer className="select-none border-t border-slate-200/60 bg-white py-6 text-center dark:border-zinc-900 dark:bg-zinc-950">
        <p className="dark:text-zinc-650 text-[9px] font-black uppercase tracking-widest text-slate-400">
          © {new Date().getFullYear()} NextDoorClinic Marketplace. All Rights Reserved. NHS verified
          partner.
        </p>
      </footer>
    </div>
  );
}
