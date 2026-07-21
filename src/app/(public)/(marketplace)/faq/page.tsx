import React from "react";
import type { Metadata } from "next";
import { HelpCircle, HeartPulse, User, Store, ShieldCheck } from "lucide-react";
import { AccordionItem } from "../accordion-item";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | NextDoorClinic",
  description:
    "Find answers to commonly asked questions about booking appointments, community pharmacy services, clinical compliance, and practice management SaaS tools.",
};

export default function FaqPage() {
  const patientFaqs = [
    {
      question: "How do I book a private clinical consultation?",
      answer:
        "Select your desired clinical service (e.g. travel vaccinations, microsuction ear wax removal) on our marketplace, enter your location, choose a verified provider, pick an available time slot, and submit the patient details form. You will receive an instant booking confirmation email.",
    },
    {
      question: "Do I need a GP referral to use NextDoorClinic?",
      answer:
        "No. All appointments booked through NextDoorClinic are direct-access. You do not need a GP referral to consult with GPhC independent prescribing pharmacists or private clinical practitioners.",
    },
    {
      question: "Can I cancel or reschedule my appointment?",
      answer:
        "Yes. You can manage your appointment directly through the secure booking confirmation link sent to your email. Cancellations and reschedules are permitted up to 24 hours prior to your scheduled clinical slot.",
    },
    {
      question: "How and when do I pay for my treatment?",
      answer:
        "Payment is completed directly at your selected local pharmacy or clinical premises at the time of your consultation. NextDoorClinic does not charge booking fees or process patient medical payments online.",
    },
  ];

  const providerFaqs = [
    {
      question: "How does my pharmacy list services on NextDoorClinic?",
      answer:
        "Click 'List your clinic' or visit our provider onboarding page. Once you supply your GPhC register information, location premises details, and select the services you offer, our operations desk will review and approve your account within 48 hours.",
    },
    {
      question: "What practice management tools are included in the SaaS?",
      answer:
        "Our B2B software includes a dynamic calendar manager, digital clinician rostering, automated SMS/email booking notifications, GPhC compliance auditing tools, service pricing customizers, and patient check-in dashboard flows.",
    },
    {
      question: "Is there a contract or onboarding fee?",
      answer:
        "No. NextDoorClinic operates on a transparent pay-per-lead booking fee or monthly SaaS plan with no long-term contract lock-ins. You can customize your plan or deactivate services at any time.",
    },
  ];

  const complianceFaqs = [
    {
      question: "Are the pharmacies and clinics registered?",
      answer:
        "Yes. Every provider listed on NextDoorClinic holds active registration with the General Pharmaceutical Council (GPhC) or the Care Quality Commission (CQC) in England, ensuring professional clinical standards.",
    },
    {
      question: "Is my medical data shared with third parties?",
      answer:
        "Absolutely not. Your personal information and consultation details are encrypted securely under UK GDPR and are shared exclusively with your selected clinical provider to facilitate your safe treatment pathway.",
    },
  ];

  return (
    <div className="relative flex-1 overflow-hidden bg-brand-bg px-6 py-16 sm:py-24 lg:px-8">
      {/* Decorative Radial Background Gradients */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,var(--ring)/0.08,transparent_55%),radial-gradient(ellipse_at_bottom_left,var(--accent)/0.05,transparent_50%)]" />

      <div className="mx-auto max-w-4xl space-y-12 sm:space-y-16">
        {/* Header Section */}
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center space-x-2 rounded-full bg-brand-teal/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-brand-teal">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Faqs & Help</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-navy dark:text-white sm:text-5xl">
            Frequently Asked <span className="text-brand-teal">Questions</span>
          </h1>
          <p className="text-brand-muted mx-auto max-w-2xl text-base leading-relaxed sm:text-lg">
            Have questions about clinical booking, credentials, or provider dashboard operations?
            Find direct answers below.
          </p>
        </div>

        {/* Categories of FAQs */}
        <div className="space-y-10 sm:space-y-12">
          {/* Category 1: Patients */}
          <div className="shadow-premium space-y-6 rounded-2xl border border-border/80 bg-white p-6 dark:bg-zinc-950 sm:p-8">
            <h2 className="flex items-center gap-2 border-b border-border/60 pb-3 text-xl font-bold tracking-tight text-brand-navy dark:text-white">
              <User className="h-5 w-5 text-brand-teal" />
              Patient Booking & Appointments
            </h2>
            <div className="divide-y divide-border/60">
              {patientFaqs.map((faq, index) => (
                <AccordionItem key={index} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>

          {/* Category 2: Clinics */}
          <div className="shadow-premium space-y-6 rounded-2xl border border-border/80 bg-white p-6 dark:bg-zinc-950 sm:p-8">
            <h2 className="flex items-center gap-2 border-b border-border/60 pb-3 text-xl font-bold tracking-tight text-brand-navy dark:text-white">
              <Store className="h-5 w-5 text-brand-teal" />
              For Pharmacy & Clinic Partners
            </h2>
            <div className="divide-y divide-border/60">
              {providerFaqs.map((faq, index) => (
                <AccordionItem key={index} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>

          {/* Category 3: Compliance & Privacy */}
          <div className="shadow-premium space-y-6 rounded-2xl border border-border/80 bg-white p-6 dark:bg-zinc-950 sm:p-8">
            <h2 className="flex items-center gap-2 border-b border-border/60 pb-3 text-xl font-bold tracking-tight text-brand-navy dark:text-white">
              <ShieldCheck className="h-5 w-5 text-brand-teal" />
              Compliance, Safeguarding & Security
            </h2>
            <div className="divide-y divide-border/60">
              {complianceFaqs.map((faq, index) => (
                <AccordionItem key={index} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
