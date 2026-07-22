"use client";

import React, { useState } from "react";
import {
  Clock,
  Tag,
  ArrowRight,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  Info,
  ChevronRight,
  FileText,
  Building2,
  CalendarCheck,
  HelpCircle,
  Stethoscope,
  Check,
} from "lucide-react";
import Link from "next/link";
import { slugify } from "@/lib/slug";
import { BookingWizard } from "../../booking-wizard";

interface ServiceBookingViewProps {
  pharmacy: any;
  category: any;
  service: any;
  servicesList: any[];
  currentUser: any;
  pharmacySlug: string;
  categorySlug: string;
  serviceSlug: string;
}

export function ServiceBookingView({
  pharmacy,
  category,
  service,
  servicesList,
  currentUser,
  pharmacySlug,
  categorySlug,
  serviceSlug,
}: ServiceBookingViewProps) {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const brandColor = pharmacy.brandColor || "#000e35";
  const pharmacyName = pharmacy.displayName || pharmacy.name;

  // Custom Editorial Medical content templates
  const getClinicalSections = () => {
    if (categorySlug === "travel-health") {
      return {
        overview:
          "Our comprehensive travel clinical service provides essential immunizations, malaria prevention medications, and clinical safety guidance required for international travel. All consultations are performed by qualified independent pharmacist prescribers in accredited private consultation rooms.",
        whoFor:
          "Individuals traveling to tropical, developing, or high-risk geographic destinations globally for holidays, business trips, or visiting friends and family.",
        eligibility: [
          "Adults and children over 6 months of age (subject to specific vaccine licensing)",
          "Travelers requiring mandatory certificates (e.g. Yellow Fever ICVP)",
          "Corporate travelers requiring multi-country risk assessments",
        ],
        journey: [
          {
            title: "01. Travel Risk Assessment",
            desc: "Comprehensive evaluation of your destination itinerary, planned activities, medical history, and previous immunization record.",
          },
          {
            title: "02. Vaccination & Medication Supply",
            desc: "Administration of required travel vaccines (e.g., Yellow Fever, Hepatitis A/B, Typhoid, Rabies) and prescription of malaria prophylaxis.",
          },
          {
            title: "03. Official Certification & Advisory",
            desc: "Issuance of official international certificates of vaccination (ICVP) and personalized advice on food, water, and insect protection.",
          },
        ],
        prep: "Please bring your full travel itinerary, departure dates, list of destinations, and any past vaccination history records to your appointment.",
        aftercare:
          "Mild soreness, redness, or swelling at the injection site is normal and typically resolves within 24 to 48 hours. Drink plenty of water and rest.",
        faqs: [
          {
            q: "How far in advance of travel should I book?",
            a: "Ideally, schedule your consultation 4 to 6 weeks prior to departure, as some vaccine courses require multiple doses spaced over several weeks for full immunity.",
          },
          {
            q: "Do I receive official vaccination certificates?",
            a: "Yes. For mandatory vaccines such as Yellow Fever, our clinic issues official International Certificates of Vaccination or Prophylaxis (ICVP).",
          },
          {
            q: "Are consultations suitable for children?",
            a: "Yes. Our prescribers provide travel health consultations for family members of all ages, subject to vaccine licensing age thresholds.",
          },
        ],
      };
    } else if (categorySlug === "vaccinations") {
      return {
        overview:
          "Our clinical immunization service delivers rapid, safe, and professional vaccinations in private healthcare rooms. We offer seasonal vaccines, corporate health immunizations, and specialized preventative shots administered by certified healthcare professionals.",
        whoFor:
          "Individuals seeking seasonal influenza or COVID-19 boosters, workplace wellness programs, and routine health immunizations.",
        eligibility: [
          "Adults and eligible minors requiring routine or seasonal immunization",
          "Patients seeking private fast-track access without NHS GP delays",
          "Occupational health candidates requiring proof of immunity",
        ],
        journey: [
          {
            title: "01. Clinical Triage",
            desc: "Pre-vaccination safety checks, allergy screening, and review of recent health status.",
          },
          {
            title: "02. Safe Vaccine Administration",
            desc: "Precise administration using sterile clinical protocols and temperature-controlled vaccines.",
          },
          {
            title: "03. Observation & Post-Care",
            desc: "Short post-vaccination observation period to ensure patient safety and issue immunization records.",
          },
        ],
        prep: "Wear short sleeves or loose clothing that allows easy access to your upper arm. Ensure you are well hydrated and have eaten prior to your appointment.",
        aftercare:
          "Rest the arm. Use mild analgesics (such as paracetamol) if you experience temporary low-grade fever or mild muscle ache.",
        faqs: [
          {
            q: "Can I get vaccinated if I feel slightly unwell?",
            a: "If you have a high fever or severe acute illness, we recommend rescheduling your appointment until you have recovered.",
          },
          {
            q: "Will my GP be informed of my vaccination?",
            a: "With your consent, we can send a summary record directly to your NHS GP practice to keep your official medical records up to date.",
          },
        ],
      };
    } else {
      return {
        overview: `Our professional clinical consultation for ${service.name} provides expert medical evaluation, diagnostic assessments, and immediate treatment prescription pathways conducted by registered healthcare prescribers in confidential consultation rooms.`,
        whoFor: `Patients seeking expert medical advice, rapid diagnostics, and targeted treatment plans for ${service.name} without long appointment wait times.`,
        eligibility: [
          "Patients presenting with symptoms corresponding to clinical guidelines",
          "Adults and adolescents seeking direct-to-pharmacy care",
          "Patients requiring official medical summaries or prescription therapy",
        ],
        journey: [
          {
            title: "01. Confidential Assessment",
            desc: "Detailed review of symptoms, medical history, current medications, and vital sign checks.",
          },
          {
            title: "02. Clinical Diagnosis & Plan",
            desc: "Diagnostic evaluation according to established NHS and private clinical guidelines.",
          },
          {
            title: "03. Prescription & Treatment",
            desc: "Immediate dispensing of prescribed medication, treatment guidance, and follow-up recommendation.",
          },
        ],
        prep: "Please write down your current symptoms, their onset date, and bring a list of any regular medications or supplements you are taking.",
        aftercare:
          "Follow the prescribed dosing regimen precisely. Complete the full course of treatment even if symptoms improve early.",
        faqs: [
          {
            q: "Is a doctor referral required before booking?",
            a: "No referral is needed. You can book directly with our pharmacist prescribers.",
          },
          {
            q: "What happens if my condition requires specialist care?",
            a: "If our prescribers determine that your condition requires secondary or emergency medical care, we will provide an urgent referral letter to your NHS GP or hospital.",
          },
        ],
      };
    }
  };

  const clinicGuide = getClinicalSections();

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
      {/* 1. TOP BREADCRUMB & UTILITY STRIP */}
      <div className="border-b border-slate-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900 md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-zinc-400">
            <Link href="/" className="hover:text-slate-900 dark:hover:text-white">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <Link
              href={`/book/${pharmacySlug}`}
              className="hover:text-slate-900 dark:hover:text-white"
            >
              {pharmacyName}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-bold text-slate-900 dark:text-white">{service.name}</span>
          </nav>

          <div className="hidden items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 sm:flex">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>GPhC & NHS Accredited Premises</span>
          </div>
        </div>
      </div>

      {/* 2. HERO CLINICAL TITLE & BOOKING HEADER */}
      <div className="border-b border-slate-200 bg-white py-8 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            {/* Left Header Info */}
            <div className="space-y-4 lg:col-span-8">
              <div className="inline-flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                <Stethoscope className="h-3.5 w-3.5 text-slate-500" />
                <span>{category.name}</span>
              </div>

              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-4xl">
                {service.name}
              </h1>

              <p className="max-w-2xl text-xs font-medium leading-relaxed text-slate-600 dark:text-zinc-300 sm:text-sm">
                {service.description || clinicGuide.overview}
              </p>

              <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-600 dark:border-zinc-800 dark:text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>Duration: {service.duration} mins</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-slate-400" />
                  <span>Consultation Fee: £{Number(service.price).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <span>Private Consultation Room</span>
                </div>
              </div>
            </div>

            {/* Right Action Box */}
            <div className="lg:col-span-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 dark:border-zinc-800 dark:bg-zinc-800/50">
                <div className="flex items-baseline justify-between border-b border-slate-200 pb-3 dark:border-zinc-700">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Consultation Fee
                  </span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    £{Number(service.price).toFixed(2)}
                  </span>
                </div>
                <ul className="my-4 space-y-2 text-xs font-medium text-slate-600 dark:text-zinc-300">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Same-day appointment slots available</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Private, confidential clinical room</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Prescription dispensing on site</span>
                  </li>
                </ul>

                <button
                  type="button"
                  onClick={() => setShowBookingModal(true)}
                  className="shadow-xs flex w-full items-center justify-center gap-2 rounded bg-[#000e35] py-3 text-xs font-bold text-white transition-colors hover:bg-slate-800"
                >
                  <span>Book Appointment Now</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CONTENT-RICH CLINICAL DETAILS SECTION */}
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* MAIN CLINICAL CONTENT (8 Cols) */}
          <main className="space-y-8 lg:col-span-8">
            {/* Section 1: Clinical Overview & Suitability */}
            <section className="shadow-xs rounded-lg border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="border-b border-slate-200 pb-3 text-sm font-bold uppercase tracking-wider text-slate-900 dark:border-zinc-800 dark:text-white">
                01. Service Overview & Patient Suitability
              </h2>

              <p className="mt-4 text-xs leading-relaxed text-slate-700 dark:text-zinc-300 sm:text-sm">
                {clinicGuide.overview}
              </p>

              <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
                <h3 className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <Info className="h-4 w-4 text-slate-500" />
                  <span>Target Patient Criteria</span>
                </h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-zinc-300">
                  {clinicGuide.whoFor}
                </p>

                <div className="mt-3 space-y-1.5 border-t border-slate-200 pt-3 dark:border-zinc-700">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Patient Eligibility Criteria:
                  </span>
                  <ul className="space-y-1 text-xs text-slate-700 dark:text-zinc-300">
                    {clinicGuide.eligibility.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 2: Clinical Assessment Workflow */}
            <section className="shadow-xs rounded-lg border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="border-b border-slate-200 pb-3 text-sm font-bold uppercase tracking-wider text-slate-900 dark:border-zinc-800 dark:text-white">
                02. Clinical Assessment Workflow
              </h2>

              <p className="mt-4 text-xs text-slate-600 dark:text-zinc-300 sm:text-sm">
                Our consultations follow rigid clinical guidelines to ensure patient safety,
                accurate diagnosis, and compliant prescribing.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {clinicGuide.journey.map((step, idx) => (
                  <div
                    key={idx}
                    className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40"
                  >
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-600 dark:text-zinc-400">{step.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 3: Preparation & Aftercare */}
            <section className="shadow-xs rounded-lg border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="border-b border-slate-200 pb-3 text-sm font-bold uppercase tracking-wider text-slate-900 dark:border-zinc-800 dark:text-white">
                03. Preparation & Post-Appointment Care
              </h2>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Pre-Appointment Patient Checklist
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-zinc-300">
                    {clinicGuide.prep}
                  </p>
                  {service.prepNotes && (
                    <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                      Important Note: {service.prepNotes}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Aftercare & Recovery Guidance
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-zinc-300">
                    {clinicGuide.aftercare}
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4: Patient FAQs */}
            <section className="shadow-xs rounded-lg border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="border-b border-slate-200 pb-3 text-sm font-bold uppercase tracking-wider text-slate-900 dark:border-zinc-800 dark:text-white">
                04. Frequently Asked Questions
              </h2>

              <div className="mt-4 divide-y divide-slate-200 dark:divide-zinc-800">
                {clinicGuide.faqs.map((faq, idx) => (
                  <div key={idx} className="py-3">
                    <button
                      type="button"
                      onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                      className="flex w-full items-center justify-between text-left text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <span>{faq.q}</span>
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 transition-transform ${
                          activeFaq === idx ? "rotate-90 text-slate-900" : "text-slate-400"
                        }`}
                      />
                    </button>
                    {activeFaq === idx && (
                      <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400">{faq.a}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Section 5: Safety Disclaimer */}
            <section className="rounded-lg border border-slate-200 bg-slate-100 p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Medical Disclaimer & Emergency Protocol
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-400">
                    All clinical consultations are subject to practitioner evaluation. If our
                    prescribers evaluate that your condition requires emergency medical attention,
                    an immediate NHS GP or hospital referral will be provided. In case of emergency,
                    dial 999 immediately.
                  </p>
                </div>
              </div>
            </section>
          </main>

          {/* SIDEBAR CLINIC DETAILS (4 Cols) */}
          <aside className="space-y-6 lg:col-span-4">
            {/* Clinic Details Box */}
            <div className="shadow-xs rounded-lg border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="border-b border-slate-200 pb-3 text-xs font-bold uppercase tracking-wider text-slate-900 dark:border-zinc-800 dark:text-white">
                Clinic Location & Hours
              </h3>

              <div className="mt-4 space-y-3 text-xs text-slate-700 dark:text-zinc-300">
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="font-semibold">{pharmacy.address}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="font-semibold">{pharmacy.phone}</span>
                </div>
              </div>

              <div className="mt-4 border-t border-slate-200 pt-3 dark:border-zinc-800">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Regulatory Compliance
                </span>
                <span className="mt-1 inline-block rounded bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
                  CQC & GPhC Accredited Premises
                </span>
              </div>
            </div>

            {/* Other Services Box */}
            <div className="shadow-xs rounded-lg border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="border-b border-slate-200 pb-3 text-xs font-bold uppercase tracking-wider text-slate-900 dark:border-zinc-800 dark:text-white">
                Other Treatments at Clinic
              </h3>

              <div className="mt-3 divide-y divide-slate-200 dark:divide-zinc-800">
                {servicesList
                  .filter((s) => s.id !== service.id)
                  .slice(0, 4)
                  .map((s) => (
                    <Link
                      key={s.id}
                      href={`/book/${pharmacySlug}/${categorySlug}/${slugify(s.name)}`}
                      className="flex items-center justify-between py-2.5 text-xs transition-colors hover:text-blue-600"
                    >
                      <span className="truncate pr-2 font-semibold text-slate-800 dark:text-zinc-200">
                        {s.name}
                      </span>
                      <span className="shrink-0 font-bold text-slate-900 dark:text-white">
                        £{Number(s.price).toFixed(2)}
                      </span>
                    </Link>
                  ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* MODAL WIZARD */}
      {showBookingModal && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 overflow-y-auto bg-slate-900/70">
          <BookingWizard
            pharmacy={pharmacy}
            services={servicesList}
            currentUser={currentUser}
            initialServiceId={service.id}
            onClose={() => setShowBookingModal(false)}
          />
        </div>
      )}
    </div>
  );
}
