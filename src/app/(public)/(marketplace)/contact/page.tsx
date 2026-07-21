"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Clock, ShieldCheck, CheckCircle2, Loader2, Send } from "lucide-react";

export default function ContactPage() {
  const [department, setDepartment] = useState("patient");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    referenceCode: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate server action delay
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="w-full bg-white font-sans text-slate-900 antialiased dark:bg-zinc-950 dark:text-zinc-50">
      {/* 1. HERO SECTION (Editorial Large Typography) */}
      <section className="border-b border-slate-100 pb-16 pt-16 dark:border-zinc-800/80 sm:pb-20 sm:pt-24">
        <div className="mx-auto max-w-5xl space-y-6 px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#10B981]">
            <span className="h-2 w-2 rounded-full bg-[#10B981]" />
            <span>Support & Communications Desk</span>
          </div>

          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-[#0F172A] dark:text-white sm:text-6xl">
            How can we help you today?
          </h1>

          <p className="max-w-2xl text-lg font-normal leading-relaxed text-slate-600 dark:text-slate-300">
            Whether you are a patient needing assistance with an upcoming booking, or a registered
            pharmacy looking to join the NextDoorClinic network, our London team is here to support
            you.
          </p>
        </div>
      </section>

      {/* 2. MAIN CONTACT SECTION (Editorial Split Layout) */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Left Column (lg:col-span-5): Contact Channels & SLAs */}
            <div className="space-y-10 lg:col-span-5">
              <div className="space-y-4">
                <h2 className="text-2xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
                  Direct Support Channels
                </h2>
                <p className="text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400">
                  Our dedicated clinical support officers and partner operations teams respond
                  within guaranteed Service Level Agreements (SLAs).
                </p>
              </div>

              {/* Channel List */}
              <div className="space-y-6">
                {/* Channel 1 */}
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#0F172A] dark:bg-zinc-800 dark:text-white">
                    <Mail className="h-5 w-5 text-[#10B981]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Patient Enquiries
                    </p>
                    <p className="text-sm font-bold text-[#0F172A] dark:text-white">
                      support@nextdoorclinic.co.uk
                    </p>
                    <p className="text-xs font-medium text-slate-500">
                      SLA: Guaranteed response within 2 hours
                    </p>
                  </div>
                </div>

                {/* Channel 2 */}
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#0F172A] dark:bg-zinc-800 dark:text-white">
                    <Phone className="h-5 w-5 text-[#10B981]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Phone Line
                    </p>
                    <p className="text-sm font-bold text-[#0F172A] dark:text-white">
                      +44 (0)20 7437 1234
                    </p>
                    <p className="text-xs font-medium text-slate-500">
                      Mon &ndash; Fri: 8:00 AM &ndash; 6:30 PM GMT
                    </p>
                  </div>
                </div>

                {/* Channel 3 */}
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#0F172A] dark:bg-zinc-800 dark:text-white">
                    <MapPin className="h-5 w-5 text-[#10B981]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Headquarters
                    </p>
                    <p className="text-sm font-bold text-[#0F172A] dark:text-white">
                      NextDoorClinic Health Technologies Ltd
                    </p>
                    <p className="text-xs font-medium text-slate-500">
                      12 Wardour Street, Soho, London, W1D 1AN
                    </p>
                  </div>
                </div>

                {/* Channel 4 */}
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#0F172A] dark:bg-zinc-800 dark:text-white">
                    <ShieldCheck className="h-5 w-5 text-[#10B981]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Clinical Governance & Duty of Candour
                    </p>
                    <p className="text-sm font-bold text-[#0F172A] dark:text-white">
                      governance@nextdoorclinic.co.uk
                    </p>
                    <p className="text-xs font-medium text-slate-500">
                      Urgent clinical safety & safeguarding desk
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (lg:col-span-7): Interactive Form */}
            <div className="space-y-6 rounded-2xl border border-slate-200/80 bg-slate-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/60 sm:p-10 lg:col-span-7">
              {submitted ? (
                <div className="space-y-4 py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#10B981]/10 text-[#10B981]">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
                    Message Sent Successfully
                  </h3>
                  <p className="mx-auto max-w-md text-sm font-medium text-slate-600 dark:text-slate-300">
                    Thank you for reaching out. A copy of your inquiry has been logged, and our team
                    will get back to you shortly.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: "",
                        email: "",
                        phone: "",
                        referenceCode: "",
                        message: "",
                      });
                    }}
                    className="mt-4 rounded-xl bg-slate-800 px-6 py-2.5 text-xs font-bold text-white transition-all hover:bg-slate-900"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Department Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      I am contacting regarding *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDepartment("patient")}
                        className={`rounded-xl border px-4 py-3 text-left text-xs font-bold transition-all ${
                          department === "patient"
                            ? "border-[#0F172A] bg-[#0F172A] text-white"
                            : "border-slate-200 bg-white text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-300"
                        }`}
                      >
                        Patient Booking Help
                      </button>

                      <button
                        type="button"
                        onClick={() => setDepartment("partner")}
                        className={`rounded-xl border px-4 py-3 text-left text-xs font-bold transition-all ${
                          department === "partner"
                            ? "border-[#0F172A] bg-[#0F172A] text-white"
                            : "border-slate-200 bg-white text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-300"
                        }`}
                      >
                        Pharmacy Partnership
                      </button>

                      <button
                        type="button"
                        onClick={() => setDepartment("governance")}
                        className={`rounded-xl border px-4 py-3 text-left text-xs font-bold transition-all ${
                          department === "governance"
                            ? "border-[#0F172A] bg-[#0F172A] text-white"
                            : "border-slate-200 bg-white text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-300"
                        }`}
                      >
                        Clinical Governance
                      </button>

                      <button
                        type="button"
                        onClick={() => setDepartment("other")}
                        className={`rounded-xl border px-4 py-3 text-left text-xs font-bold transition-all ${
                          department === "other"
                            ? "border-[#0F172A] bg-[#0F172A] text-white"
                            : "border-slate-200 bg-white text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-300"
                        }`}
                      >
                        General Inquiry
                      </button>
                    </div>
                  </div>

                  {/* Name & Email */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Eleanor Vance"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold focus:border-[#10B981] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. eleanor@example.co.uk"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold focus:border-[#10B981] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                      />
                    </div>
                  </div>

                  {/* Phone & Reference Code */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Mobile Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g. 07700 900123"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold focus:border-[#10B981] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Booking Ref (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.referenceCode}
                        onChange={(e) =>
                          setFormData({ ...formData, referenceCode: e.target.value })
                        }
                        placeholder="e.g. NDC-A8B9C0"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold focus:border-[#10B981] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                      />
                    </div>
                  </div>

                  {/* Message textarea */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Your Message *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Please provide details about your inquiry..."
                      className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm font-semibold focus:border-[#10B981] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#10B981] text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-[#0e9f6e]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Sending Message...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Submit Message</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
