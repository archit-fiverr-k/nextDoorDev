"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building,
  MapPin,
  Clock,
  FileCheck2,
  CreditCard,
  Mail,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  FileText,
  AlertCircle,
  Eye,
  Lock,
  ChevronRight,
  ShieldCheck,
  Check,
  Phone,
  Calendar,
  Layers,
  Fingerprint,
  Key,
} from "lucide-react";
import { registerProviderAction } from "@/actions/register";
import { Button } from "@/components/ui/button";

export function RegisterWizard() {
  const router = useRouter();

  // Wizard Step State
  const [step, setStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email Verification OTP State
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [userOtp, setUserOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  // Document Upload State Simulation (Cloudflare R2 mock)
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
    type: string;
  } | null>(null);

  // Wizard Fields State
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    displayName: "",
    email: "",
    password: "",
    providerType: "independent",
    phone: "",
    address: "",
    documentType: "gphc",
    documentRef: "",
    subscriptionPlan: "MONTHLY", // default plan selection
    // Opening Hours Day mapping (0 Sunday to 6 Saturday)
    availability: [
      { dayOfWeek: 1, openTime: "09:00", closeTime: "18:00", isClosed: false },
      { dayOfWeek: 2, openTime: "09:00", closeTime: "18:00", isClosed: false },
      { dayOfWeek: 3, openTime: "09:00", closeTime: "18:00", isClosed: false },
      { dayOfWeek: 4, openTime: "09:00", closeTime: "18:00", isClosed: false },
      { dayOfWeek: 5, openTime: "09:00", closeTime: "18:00", isClosed: false },
      { dayOfWeek: 6, openTime: "09:00", closeTime: "13:00", isClosed: false },
      { dayOfWeek: 0, openTime: "09:00", closeTime: "18:00", isClosed: true }, // Sunday closed by default
    ],
  });

  // Mock Stripe Credit Card billing form state
  const [cardData, setCardData] = useState({
    number: "",
    expiry: "",
    cvc: "",
  });
  const [cardVerified, setCardVerified] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  // 1. AutoSave Logic: Restore from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ndc_register_draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({
          ...prev,
          ...parsed,
          password: "", // do not restore password for safety
        }));
      }
    } catch (e) {
      console.error("Failed to restore registration draft:", e);
    }

    // Generate random mock verification OTP code on load
    const code = `NDC-${Math.floor(1000 + Math.random() * 9000)}`;
    setGeneratedOtp(code);
  }, []);

  // 2. AutoSave Logic: Save on modifications
  const saveDraft = (updatedData: typeof formData) => {
    try {
      localStorage.setItem("ndc_register_draft", JSON.stringify(updatedData));
    } catch (e) {
      console.error("Failed to save registration draft:", e);
    }
  };

  const handleFieldChange = (field: keyof typeof formData, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    saveDraft(updated);
  };

  // Availability hour updates helper
  const handleAvailabilityChange = (index: number, key: string, value: any) => {
    const updatedAvail = [...formData.availability];
    updatedAvail[index] = { ...updatedAvail[index], [key]: value };
    const updated = { ...formData, availability: updatedAvail };
    setFormData(updated);
    saveDraft(updated);
  };

  // Mock Document upload simulation (representing CF R2 upload)
  const handleFileMockUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingFile(true);
      setTimeout(() => {
        setUploadingFile(false);
        setUploadedFile({
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          type: file.type || "application/pdf",
        });
      }, 1200);
    }
  };

  // Mock Stripe Checkout verification
  const handleVerifyMockPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardData.number && cardData.expiry && cardData.cvc) {
      setVerifyingPayment(true);
      setTimeout(() => {
        setVerifyingPayment(false);
        setCardVerified(true);
      }, 1500);
    }
  };

  // Email verification check
  const handleVerifyOtp = () => {
    if (userOtp.trim().toUpperCase() === generatedOtp) {
      setOtpVerified(true);
      setOtpError(false);
    } else {
      setOtpError(true);
    }
  };

  // Wizard Step Navigation Validation
  const handleNextStep = () => {
    setErrorMessage("");
    if (step === 1) {
      if (!formData.name || !formData.slug || !formData.email || !formData.password) {
        setErrorMessage("Please complete all business credentials to continue.");
        return;
      }
      if (formData.password.length < 6) {
        setErrorMessage("Password must be at least 6 characters long.");
        return;
      }
    }
    if (step === 2) {
      if (!formData.address || !formData.phone) {
        setErrorMessage("Please specify branch address and contact phone number.");
        return;
      }
    }
    if (step === 4) {
      if (!formData.documentRef || !uploadedFile) {
        setErrorMessage("Please upload your credentials document and supply the register number.");
        return;
      }
    }
    if (step === 5) {
      if (!cardVerified) {
        setErrorMessage("Please authorize your subscription billing check.");
        return;
      }
    }
    if (step === 6) {
      if (!otpVerified) {
        setErrorMessage("Please input and verify the OTP code sent to your email.");
        return;
      }
    }

    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setErrorMessage("");
    setStep(step - 1);
  };

  // Final submit handler triggers Server Action
  const handleSubmitRegistration = async () => {
    setIsSubmitting(true);
    setErrorMessage("");

    const result = await registerProviderAction({
      name: formData.name,
      slug: formData.slug,
      displayName: formData.displayName,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      address: formData.address,
      availability: formData.availability,
      documentName: uploadedFile?.name || "Mock_Upload.pdf",
      documentRef: formData.documentRef,
      subscriptionPlan: formData.subscriptionPlan,
    });

    setIsSubmitting(false);

    if (result.success) {
      localStorage.removeItem("ndc_register_draft");
      setStep(8); // success screen
    } else {
      setErrorMessage(result.error || "An error occurred during submission.");
    }
  };

  const daysLabelMap = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const stepsMeta = [
    { label: "Credentials", icon: Key },
    { label: "Location", icon: MapPin },
    { label: "Availability", icon: Clock },
    { label: "Accreditation", icon: ShieldCheck },
    { label: "Billing Plan", icon: CreditCard },
    { label: "Verification", icon: Fingerprint },
    { label: "Summary", icon: CheckCircle2 },
  ];

  return (
    <div className="w-full space-y-6 font-sans text-slate-800 dark:text-zinc-200">
      {/* 1. Stepper Node Progress Indicator (Desktop Stepper Layout) */}
      {step < 8 && (
        <div className="mb-4 hidden select-none grid-cols-7 gap-1 border-b border-slate-100 pb-5 dark:border-zinc-900 md:grid">
          {stepsMeta.map((s, idx) => {
            const num = idx + 1;
            const StepIcon = s.icon;
            const isCompleted = step > num;
            const isCurrent = step === num;
            return (
              <div
                key={num}
                className={`flex flex-col items-center space-y-1.5 text-center ${
                  isCurrent ? "opacity-100" : isCompleted ? "opacity-90" : "opacity-40"
                }`}
              >
                <div
                  className={`flex size-7 items-center justify-center rounded-xl border text-[10px] font-black transition-all ${
                    isCurrent
                      ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                      : isCompleted
                        ? "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-400"
                        : "border-slate-200 bg-slate-50 text-slate-400 dark:border-zinc-800 dark:bg-zinc-900"
                  }`}
                >
                  {isCompleted ? <Check className="size-3.5 stroke-[3]" /> : num}
                </div>
                <span
                  className={`block text-[9px] font-bold uppercase tracking-wider ${
                    isCurrent
                      ? "text-slate-900 dark:text-white"
                      : isCompleted
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-450"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Mobile Stepper Header */}
      {step < 8 && (
        <div className="mb-2 flex select-none items-center justify-between border-b border-slate-100 pb-4 text-xs dark:border-zinc-900 md:hidden">
          <div className="flex items-center space-x-2">
            <span className="rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-black text-white dark:bg-white dark:text-zinc-950">
              Step {step}
            </span>
            <span className="dark:text-zinc-250 text-[10px] font-extrabold uppercase tracking-widest text-slate-700">
              {stepsMeta[step - 1].label}
            </span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">Step {step} of 7</span>
        </div>
      )}

      {/* Main wizard wrapper */}
      <div className="min-h-[280px] space-y-6">
        {errorMessage && (
          <div className="flex items-start space-x-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 duration-200 animate-in fade-in">
            <AlertCircle className="h-4.5 w-4.5 mt-0.5 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Business Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Account Credentials
              </h4>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Set up your pharmacy workspace domain name, business credentials, and sign-in email.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-slate-450 dark:text-zinc-550 block text-[9px] font-black uppercase tracking-wider">
                  Registered Pharmacy Name *
                </label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-3.5 size-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3.5 text-xs font-semibold focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                    placeholder="e.g. Northside Wellness Pharmacy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-slate-450 dark:text-zinc-550 block text-[9px] font-black uppercase tracking-wider">
                    URL Booking Slug *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) =>
                        handleFieldChange(
                          "slug",
                          e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                        )
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 pl-3.5 pr-28 font-mono text-xs font-bold focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                      placeholder="northside-clinic"
                    />
                    <span className="absolute right-3.5 top-3.5 select-none text-[9px] font-black uppercase tracking-wider text-slate-400">
                      .nextdoorclinic
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-450 dark:text-zinc-550 block text-[9px] font-black uppercase tracking-wider">
                    Public Brand Display Name
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => handleFieldChange("displayName", e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-xs font-semibold focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                    placeholder="e.g. Northside Health"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-slate-450 dark:text-zinc-550 block text-[9px] font-black uppercase tracking-wider">
                    Account Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 size-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3.5 text-xs font-semibold focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                      placeholder="manager@northsidehealth.co.uk"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-450 dark:text-zinc-550 block text-[9px] font-black uppercase tracking-wider">
                    Account Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 size-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => handleFieldChange("password", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3.5 text-xs font-semibold focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Address & Contact */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Branch Location Details
              </h4>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Provide branch classification, direct contact details, and registered storefront
                address.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-slate-450 dark:text-zinc-550 block text-[9px] font-black uppercase tracking-wider">
                  Provider Classification Type
                </label>
                <select
                  value={formData.providerType}
                  onChange={(e) => handleFieldChange("providerType", e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-200"
                >
                  <option value="independent">Independent Community Pharmacy</option>
                  <option value="clinic">Clinical Health & Medical Center</option>
                  <option value="travel">Travel Consultation Clinic</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-450 dark:text-zinc-550 block text-[9px] font-black uppercase tracking-wider">
                  Main Branch Telephone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 size-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3.5 text-xs font-semibold focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                    placeholder="e.g. 020 7946 0958"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-450 dark:text-zinc-550 block text-[9px] font-black uppercase tracking-wider">
                  Branch Street Address & Postcode *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 size-4 text-slate-400" />
                  <textarea
                    required
                    value={formData.address}
                    onChange={(e) => handleFieldChange("address", e.target.value)}
                    className="h-24 w-full resize-none rounded-xl border border-slate-200 py-3 pl-10 pr-3.5 text-xs font-semibold focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                    placeholder="e.g. 14 High Street, Manchester, M1 1AD"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Opening Hours */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Active Operating Schedules
              </h4>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Define the weekly open and close roster timeline for patient slot scheduling.
              </p>
            </div>

            <div className="max-h-[300px] space-y-2.5 overflow-y-auto pr-1 pt-2">
              {formData.availability.map((day, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-slate-50/50 p-3.5 text-xs font-semibold dark:border-zinc-800 dark:bg-zinc-950/40"
                >
                  <div className="w-24">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {daysLabelMap[day.dayOfWeek]}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4">
                    {!day.isClosed ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={day.openTime}
                          onChange={(e) =>
                            handleAvailabilityChange(idx, "openTime", e.target.value)
                          }
                          className="h-8 w-16 rounded border border-slate-200 bg-white px-1 text-center font-mono text-[10px] font-bold text-slate-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                          placeholder="09:00"
                        />
                        <span className="text-slate-450">-</span>
                        <input
                          type="text"
                          value={day.closeTime}
                          onChange={(e) =>
                            handleAvailabilityChange(idx, "closeTime", e.target.value)
                          }
                          className="h-8 w-16 rounded border border-slate-200 bg-white px-1 text-center font-mono text-[10px] font-bold text-slate-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                          placeholder="18:00"
                        />
                      </div>
                    ) : (
                      <span className="dark:text-zinc-550 rounded-lg bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase text-slate-400 dark:bg-zinc-900">
                        Closed Day
                      </span>
                    )}

                    <label className="flex cursor-pointer select-none items-center space-x-1.5">
                      <input
                        type="checkbox"
                        checked={day.isClosed}
                        onChange={(e) =>
                          handleAvailabilityChange(idx, "isClosed", e.target.checked)
                        }
                        className="size-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-800"
                      />
                      <span className="text-slate-450 dark:text-zinc-450 text-[10px] font-bold uppercase">
                        Close
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Accreditations */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Credentials & Accreditations
              </h4>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Provide regulatory reference identifiers and upload certificates for operational
                clearance.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-slate-450 dark:text-zinc-550 block text-[9px] font-black uppercase tracking-wider">
                    License Registry Type
                  </label>
                  <select
                    value={formData.documentType}
                    onChange={(e) => handleFieldChange("documentType", e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-200"
                  >
                    <option value="gphc">GPhC Pharmacist Registration</option>
                    <option value="nhs">NHS Clinical Services Contract</option>
                    <option value="id">Superintendent Identification</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-450 dark:text-zinc-550 block text-[9px] font-black uppercase tracking-wider">
                    Registry Ref / License Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.documentRef}
                    onChange={(e) => handleFieldChange("documentRef", e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3.5 font-mono text-xs font-bold focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                    placeholder="e.g. GPhC-20948"
                  />
                </div>
              </div>

              {/* CF R2 File Upload mock */}
              <div className="select-none space-y-2">
                <label className="text-slate-450 dark:text-zinc-550 block text-[9px] font-black uppercase tracking-wider">
                  Upload Certification Certificate (PDF / Image) *
                </label>

                {uploadedFile ? (
                  <div className="border-emerald-250 flex items-center justify-between rounded-none border bg-emerald-50/20 p-4 text-xs duration-150 animate-in zoom-in-95">
                    <div className="flex min-w-0 items-center space-x-3">
                      <FileText className="h-7 w-7 shrink-0 text-emerald-600" />
                      <div className="min-w-0 leading-normal">
                        <p className="max-w-[200px] truncate font-bold text-slate-900 dark:text-white">
                          {uploadedFile.name}
                        </p>
                        <span className="block text-[10px] font-medium text-slate-400 dark:text-slate-500">
                          {uploadedFile.size} • R2 Verified Upload
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="dark:text-zinc-350 h-7 rounded-lg border border-slate-200 bg-white px-3.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      Delete
                    </button>
                  </div>
                ) : (
                  <div className="relative flex flex-col items-center justify-center rounded-none border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center transition-colors hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:bg-zinc-950/80">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileMockUpload}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      disabled={uploadingFile}
                    />
                    <UploadCloud className="mb-2 h-8 w-8 text-slate-400" />
                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                      {uploadingFile
                        ? "Uploading securely to R2 instance..."
                        : "Drag and drop certification file here"}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      PDF or image formats up to 10MB
                    </p>

                    {uploadingFile && (
                      <div className="relative mt-4 h-1 w-full max-w-[180px] overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800">
                        <div
                          className="h-full animate-pulse rounded-full bg-brand-teal"
                          style={{ width: "70%" }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Plans & Stripe Checkout */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Workspace Subscription & Billing
              </h4>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Configure your pricing plan tier. Stripe checkout billing requires active validation
                checks.
              </p>
            </div>

            {/* Plans */}
            <div className="grid select-none grid-cols-1 gap-4 pt-1 md:grid-cols-2">
              {[
                {
                  id: "MONTHLY",
                  title: "Monthly Plan",
                  price: "£99",
                  desc: "Full clinical workspace features billed month-to-month.",
                },
                {
                  id: "YEARLY",
                  title: "Annual Plan",
                  price: "£990",
                  desc: "Save 17%! Billed annually, equivalent to £82.50/month.",
                },
              ].map((p) => {
                const isActive = formData.subscriptionPlan === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleFieldChange("subscriptionPlan", p.id)}
                    className={`flex h-40 cursor-pointer flex-col justify-between rounded-none border p-4 shadow-sm transition-all ${
                      isActive
                        ? "border-brand-teal bg-brand-teal/[0.02] ring-2 ring-brand-teal/10"
                        : "hover:border-slate-350 dark:border-zinc-850 border-slate-200 bg-white dark:bg-zinc-950/40"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                        {p.title}
                      </span>
                      <h5 className="text-base font-black text-slate-900 dark:text-white">
                        {p.price}
                        <span className="text-[10px] font-medium text-slate-400">/mo</span>
                      </h5>
                      <p className="text-[10px] font-normal leading-relaxed text-slate-500 dark:text-slate-400">
                        {p.desc}
                      </p>
                    </div>
                    {isActive && (
                      <CheckCircle2 className="h-4.5 w-4.5 ml-auto shrink-0 text-brand-teal" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Stripe Mock Card Input */}
            <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-zinc-900">
              <span className="text-slate-450 dark:text-zinc-550 block text-[9px] font-black uppercase tracking-wider">
                Stripe Billing Checkout Validation *
              </span>

              {cardVerified ? (
                <div className="flex items-center rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-xs font-bold text-emerald-800 duration-200 animate-in fade-in dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-400">
                  <ShieldCheck className="h-4.5 w-4.5 mr-2 shrink-0 text-emerald-600" />
                  <span>Stripe card verification validated successfully.</span>
                </div>
              ) : (
                <form onSubmit={handleVerifyMockPayment} className="grid grid-cols-3 gap-3">
                  <div className="relative col-span-2">
                    <CreditCard className="absolute left-3 top-3 size-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={cardData.number}
                      onChange={(e) =>
                        setCardData({ ...cardData, number: e.target.value.replace(/\D/g, "") })
                      }
                      className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3.5 font-mono text-xs font-bold focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20 dark:border-zinc-800 dark:bg-zinc-950"
                      placeholder="Card number (4242 4242...)"
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={cardData.expiry}
                    onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                    className="h-10 rounded-xl border border-slate-200 px-3 text-center font-mono text-xs font-bold focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20 dark:border-zinc-800 dark:bg-zinc-950"
                    placeholder="MM/YY"
                  />
                  <div className="col-span-3 flex items-center justify-between pt-1.5">
                    <input
                      type="password"
                      required
                      value={cardData.cvc}
                      onChange={(e) =>
                        setCardData({ ...cardData, cvc: e.target.value.replace(/\D/g, "") })
                      }
                      className="h-10 w-24 rounded-xl border border-slate-200 px-3 text-center font-mono text-xs font-bold focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20 dark:border-zinc-800 dark:bg-zinc-950"
                      placeholder="CVC"
                    />
                    <button
                      type="submit"
                      disabled={verifyingPayment}
                      className="flex h-10 items-center justify-center rounded-xl bg-slate-900 px-5 text-xs font-bold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-slate-100"
                    >
                      {verifyingPayment ? "Stripe Checkout..." : "Verify Billing"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* STEP 6: Email Verification OTP */}
        {step === 6 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Email Address Verification
              </h4>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Verify ownership of the registration account email{" "}
                <span className="font-bold text-slate-900 dark:text-white">{formData.email}</span>.
              </p>
            </div>

            {/* OTP helper */}
            <div className="dark:text-blue-450 flex select-none items-center space-x-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-[10px] font-bold text-blue-800 dark:border-blue-900 dark:bg-blue-950/20">
              <Mail className="h-4 w-4 shrink-0 text-blue-600" />
              <span>
                [MOCK SMTP DISPATCHER]: Verification OTP is:{" "}
                <code className="rounded border bg-white px-1.5 py-0.5 font-mono font-bold text-blue-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-blue-400">
                  {generatedOtp}
                </code>
              </span>
            </div>

            <div className="space-y-4 pt-2">
              {otpVerified ? (
                <div className="border-emerald-250 text-emerald-850 flex items-center rounded-xl border bg-emerald-50 p-3 text-xs font-bold duration-150 animate-in fade-in dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-400">
                  <CheckCircle2 className="h-4.5 w-4.5 mr-2 shrink-0 text-emerald-600" />
                  <span>Email ownership successfully validated.</span>
                </div>
              ) : (
                <div className="flex max-w-sm items-center space-x-4">
                  <input
                    type="text"
                    value={userOtp}
                    onChange={(e) => {
                      setUserOtp(e.target.value);
                      setOtpError(false);
                    }}
                    className={`h-11 w-44 rounded-xl border px-3.5 text-center font-mono text-xs font-bold uppercase tracking-wider focus:outline-none dark:bg-zinc-950 dark:text-slate-100 ${
                      otpError
                        ? "border-rose-350 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                        : "border-slate-200 focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 dark:border-zinc-800"
                    }`}
                    placeholder="NDC-XXXX"
                  />
                  <button
                    onClick={handleVerifyOtp}
                    className="h-11 cursor-pointer select-none rounded-xl bg-slate-900 px-6 text-xs font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-zinc-950"
                  >
                    Verify Code
                  </button>
                </div>
              )}

              {otpError && (
                <p className="text-[10px] font-bold text-rose-600">
                  Invalid code. Please specify the mock OTP credentials exactly.
                </p>
              )}
            </div>
          </div>
        )}

        {/* STEP 7: Summary & Preview */}
        {step === 7 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Workspace Summary Review
              </h4>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Verify all credentials before submitting your clinic directory registration.
              </p>
            </div>

            {/* Preview Grid */}
            <div className="grid max-h-[300px] gap-4 overflow-y-auto pr-1 pt-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 sm:grid-cols-2">
              {/* Business Identity */}
              <div className="space-y-2 rounded-none border border-slate-200/60 bg-slate-50/50 p-4 dark:border-zinc-900 dark:bg-zinc-950/40">
                <span className="dark:text-zinc-550 block border-b border-slate-100 pb-1 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:border-zinc-900">
                  1. Business Identity
                </span>
                <p className="text-xs font-black text-slate-900 dark:text-white">{formData.name}</p>
                <p className="dark:text-slate-450 mt-0.5 text-[10px] text-slate-500">
                  Subdomain: {formData.slug}.nextdoorclinic.co.uk
                </p>
                <p className="dark:text-slate-450 mt-0.5 text-[10px] text-slate-500">
                  Login email: {formData.email}
                </p>
              </div>

              {/* Classification */}
              <div className="space-y-2 rounded-none border border-slate-200/60 bg-slate-50/50 p-4 dark:border-zinc-900 dark:bg-zinc-950/40">
                <span className="dark:text-zinc-550 block border-b border-slate-100 pb-1 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:border-zinc-900">
                  2. Provider Classification
                </span>
                <p className="text-[10px] font-bold capitalize text-slate-900 dark:text-white">
                  {formData.providerType}
                </p>
                <p className="dark:text-slate-450 mt-0.5 text-[10px] text-slate-500">
                  Phone: {formData.phone}
                </p>
                <p className="dark:text-slate-450 mt-0.5 truncate text-[10px] text-slate-500">
                  Address: {formData.address}
                </p>
              </div>

              {/* Roster Hours */}
              <div className="col-span-1 space-y-2 rounded-none border border-slate-200/60 bg-slate-50/50 p-4 dark:border-zinc-900 dark:bg-zinc-950/40 sm:col-span-2">
                <span className="dark:text-zinc-550 block border-b border-slate-100 pb-1 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:border-zinc-900">
                  3. Operating opening hours
                </span>
                <div className="dark:text-zinc-450 grid grid-cols-2 gap-2 text-[10px] font-medium text-slate-500 sm:grid-cols-3">
                  {formData.availability.map((day, idx) => (
                    <div key={idx}>
                      <span className="font-bold text-slate-800 dark:text-zinc-200">
                        {daysLabelMap[day.dayOfWeek]}:{" "}
                      </span>
                      {day.isClosed ? "Closed" : `${day.openTime}-${day.closeTime}`}
                    </div>
                  ))}
                </div>
              </div>

              {/* License Registry */}
              <div className="space-y-2 rounded-none border border-slate-200/60 bg-slate-50/50 p-4 dark:border-zinc-900 dark:bg-zinc-950/40">
                <span className="dark:text-zinc-550 block border-b border-slate-100 pb-1 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:border-zinc-900">
                  4. Accreditations Document
                </span>
                <p className="text-[10px] font-bold uppercase text-slate-900 dark:text-white">
                  {formData.documentType} ({formData.documentRef})
                </p>
                <p className="text-slate-550 dark:text-zinc-450 mt-0.5 truncate text-[10px]">
                  File: {uploadedFile?.name}
                </p>
              </div>

              {/* SaaS Subscription */}
              <div className="space-y-2 rounded-none border border-slate-200/60 bg-slate-50/50 p-4 dark:border-zinc-900 dark:bg-zinc-950/40">
                <span className="dark:text-zinc-550 block border-b border-slate-100 pb-1 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:border-zinc-900">
                  5. SaaS billing check
                </span>
                <p className="text-[10px] font-bold capitalize text-slate-900 dark:text-white">
                  {formData.subscriptionPlan === "MONTHLY" ? "Monthly" : "Annual"} Plan
                </p>
                <p className="dark:text-emerald-450 mt-0.5 flex items-center text-[10px] font-black text-emerald-600">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                  Card Verified
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: Success Pending Screen */}
        {step === 8 && (
          <div className="select-none space-y-6 py-10 text-center duration-200 animate-in zoom-in-95">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-600 shadow-lg shadow-emerald-500/5 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-400">
              <Check className="h-6 w-6 stroke-[3]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Workspace Registered
              </h3>
              <div className="inline-flex items-center gap-1 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-400">
                Status: Pending Approval
              </div>
              <p className="text-slate-550 dark:text-zinc-450 mx-auto max-w-sm text-xs font-normal leading-relaxed">
                Your credentials and billing details have been submitted. A platform administrator
                has been notified to verify your registration. You will receive an email once
                approved.
              </p>
            </div>

            <div className="mx-auto flex max-w-md items-start space-x-3 rounded-none border bg-slate-50 p-4 pt-4 text-left dark:border-zinc-900 dark:bg-zinc-950">
              <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
              <div>
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                  Administrative Audit Trail
                </h5>
                <p className="dark:text-zinc-450 mt-0.5 text-[10px] font-normal leading-relaxed text-slate-500">
                  A registration audit log entry was created for your branch. The verification
                  review is scheduled under UK pharmacy certification rules.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-slate-900 px-8 text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-800 dark:bg-white dark:text-zinc-950"
              >
                Go to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Wizard Footer Controls */}
      {step < 8 && (
        <div className="flex select-none items-center justify-between border-t border-slate-100 pt-6 dark:border-zinc-900">
          {step > 1 ? (
            <button
              onClick={handlePrevStep}
              className="dark:text-slate-350 inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              <span>Previous</span>
            </button>
          ) : (
            <span />
          )}

          {step < 7 ? (
            <button
              onClick={handleNextStep}
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-slate-900 px-5 text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-slate-100"
            >
              <span>Continue</span>
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmitRegistration}
              disabled={isSubmitting}
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-brand-teal px-6 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-teal/90 disabled:bg-brand-teal/50"
            >
              {isSubmitting ? "Submitting..." : "Confirm & Submit"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
