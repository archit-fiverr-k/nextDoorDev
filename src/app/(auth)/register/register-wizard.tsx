"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building,
  MapPin,
  Clock,
  CreditCard,
  Mail,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  FileText,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Check,
  Phone,
  Calendar,
  Fingerprint,
  Key,
  Loader2,
  Building2,
  BadgeCheck,
  Sparkles,
} from "lucide-react";
import { registerProviderAction } from "@/actions/register";
import { Button } from "@/components/ui/button";

export function RegisterWizard() {
  const router = useRouter();

  // Wizard Step State
  const [step, setStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    subscriptionPlan: "MONTHLY",
    availability: [
      { dayOfWeek: 1, openTime: "09:00", closeTime: "18:00", isClosed: false },
      { dayOfWeek: 2, openTime: "09:00", closeTime: "18:00", isClosed: false },
      { dayOfWeek: 3, openTime: "09:00", closeTime: "18:00", isClosed: false },
      { dayOfWeek: 4, openTime: "09:00", closeTime: "18:00", isClosed: false },
      { dayOfWeek: 5, openTime: "09:00", closeTime: "18:00", isClosed: false },
      { dayOfWeek: 6, openTime: "09:00", closeTime: "13:00", isClosed: false },
      { dayOfWeek: 0, openTime: "09:00", closeTime: "18:00", isClosed: true },
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

  // AutoSave Logic: Restore from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ndc_register_draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({
          ...prev,
          ...parsed,
          password: "",
        }));
      }
    } catch (e) {
      console.error("Failed to restore registration draft:", e);
    }

    const code = `NDC-${Math.floor(1000 + Math.random() * 9000)}`;
    setGeneratedOtp(code);
  }, []);

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

  const handleAvailabilityChange = (index: number, key: string, value: any) => {
    const updatedAvail = [...formData.availability];
    updatedAvail[index] = { ...updatedAvail[index], [key]: value };
    const updated = { ...formData, availability: updatedAvail };
    setFormData(updated);
    saveDraft(updated);
  };

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
      }, 1000);
    }
  };

  const handleVerifyMockPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardData.number && cardData.expiry && cardData.cvc) {
      setVerifyingPayment(true);
      setTimeout(() => {
        setVerifyingPayment(false);
        setCardVerified(true);
      }, 1200);
    }
  };

  const handleVerifyOtp = () => {
    if (userOtp.trim().toUpperCase() === generatedOtp) {
      setOtpVerified(true);
      setOtpError(false);
    } else {
      setOtpError(true);
    }
  };

  const handleNextStep = () => {
    setErrorMessage("");
    if (step === 1) {
      if (!formData.name || !formData.slug || !formData.email || !formData.password) {
        setErrorMessage("Please complete all required business credentials.");
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
        setErrorMessage(
          "Please upload your accreditation document and supply the registration reference."
        );
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
      documentName: uploadedFile?.name || "Accreditation_Doc.pdf",
      documentRef: formData.documentRef,
      subscriptionPlan: formData.subscriptionPlan,
    });

    setIsSubmitting(false);

    if (result.success) {
      localStorage.removeItem("ndc_register_draft");
      setStep(8);
    } else {
      setErrorMessage(result.error || "An error occurred during registration submission.");
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
    { label: "Hours", icon: Clock },
    { label: "Accreditation", icon: ShieldCheck },
    { label: "Billing Plan", icon: CreditCard },
    { label: "Verification", icon: Fingerprint },
    { label: "Summary", icon: CheckCircle2 },
  ];

  return (
    <div className="w-full select-text space-y-6 font-sans text-slate-800 dark:text-zinc-200">
      {/* Stepper Node Progress Bar */}
      {step < 8 && (
        <div className="space-y-3">
          <div className="dark:border-zinc-850 hidden grid-cols-7 gap-1 border-b border-slate-100 pb-4 md:grid">
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
                    className={`flex h-8 w-8 items-center justify-center rounded-xl border text-xs font-black transition-all ${
                      isCurrent
                        ? "border-[#10B981] bg-[#10B981] text-white shadow-md"
                        : isCompleted
                          ? "border-emerald-200 bg-emerald-50 text-[#10B981] dark:border-emerald-900 dark:bg-emerald-950/40"
                          : "border-slate-200 bg-slate-50 text-slate-400 dark:border-zinc-800 dark:bg-zinc-900"
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : num}
                  </div>
                  <span
                    className={`block text-[10px] font-black uppercase tracking-wider ${
                      isCurrent
                        ? "text-slate-900 dark:text-white"
                        : isCompleted
                          ? "text-[#10B981]"
                          : "text-slate-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress Percent Indicator */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-zinc-400">
            <span>
              Step {step} of 7:{" "}
              <strong className="text-slate-900 dark:text-white">
                {stepsMeta[step - 1]?.label}
              </strong>
            </span>
            <span className="font-black text-[#10B981]">
              {Math.round(((step - 1) / 7) * 100)}% Completed
            </span>
          </div>

          <div className="dark:bg-zinc-850 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-[#10B981] transition-all duration-300"
              style={{ width: `${((step - 1) / 7) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Main wizard steps container */}
      <div className="min-h-[320px] space-y-6">
        {errorMessage && (
          <div className="flex items-start space-x-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-bold text-rose-600 animate-in fade-in dark:text-rose-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ================= STEP 1: Business Credentials ================= */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                Step 1: Account Credentials
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Configure your pharmacy workspace name, URL domain slug, and manager sign-in email.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                  Registered Pharmacy / Clinic Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-xs font-bold text-slate-900 outline-none transition-all focus:border-[#10B981] focus:bg-white focus:ring-2 focus:ring-[#10B981]/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                    placeholder="e.g. Briggate Health Pharmacy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
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
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-3.5 pr-28 font-mono text-xs font-black text-slate-900 outline-none transition-all focus:border-[#10B981] focus:bg-white focus:ring-2 focus:ring-[#10B981]/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                      placeholder="briggate-pharmacy"
                    />
                    <span className="absolute right-3.5 top-3.5 select-none text-[10px] font-extrabold text-slate-400">
                      .nextdoorclinic
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                    Public Display Name
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => handleFieldChange("displayName", e.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-bold text-slate-900 outline-none transition-all focus:border-[#10B981] focus:bg-white focus:ring-2 focus:ring-[#10B981]/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                    placeholder="e.g. Briggate Health"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                    Account Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 text-xs font-bold text-slate-900 outline-none transition-all focus:border-[#10B981] focus:bg-white focus:ring-2 focus:ring-[#10B981]/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                      placeholder="manager@briggatehealth.co.uk"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                    Account Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={(e) => handleFieldChange("password", e.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-10 text-xs font-bold text-slate-900 outline-none transition-all focus:border-[#10B981] focus:bg-white focus:ring-2 focus:ring-[#10B981]/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: Address & Contact ================= */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                Step 2: Branch Location & Contact
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Specify your physical pharmacy branch address and contact phone number.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                  Full Branch Street Address & Postcode *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => handleFieldChange("address", e.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-xs font-bold text-slate-900 outline-none transition-all focus:border-[#10B981] focus:bg-white focus:ring-2 focus:ring-[#10B981]/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                    placeholder="e.g. 85 Briggate, Leeds, LS1 6AZ"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                  Branch Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-xs font-bold text-slate-900 outline-none transition-all focus:border-[#10B981] focus:bg-white focus:ring-2 focus:ring-[#10B981]/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                    placeholder="0113 245 9182"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                  Provider Classification
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "independent", label: "Independent Pharmacy" },
                    { id: "clinic", label: "Clinical Center" },
                    { id: "group", label: "Pharmacy Group" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleFieldChange("providerType", item.id)}
                      className={`rounded-2xl border p-3 text-center text-xs font-extrabold transition-all ${
                        formData.providerType === item.id
                          ? "shadow-xs border-[#10B981] bg-emerald-50 text-[#10B981] dark:border-emerald-800 dark:bg-emerald-950/40"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: Opening Hours ================= */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                Step 3: Branch Opening Hours
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Configure your weekly consultation slot windows for online patient booking.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              {formData.availability.map((item, idx) => (
                <div
                  key={idx}
                  className="shadow-xs dark:border-zinc-850 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 dark:bg-zinc-900"
                >
                  <span className="w-24 text-xs font-black text-slate-900 dark:text-white">
                    {daysLabelMap[item.dayOfWeek]}
                  </span>

                  <div className="flex items-center space-x-2">
                    <input
                      type="time"
                      disabled={item.isClosed}
                      value={item.openTime}
                      onChange={(e) => handleAvailabilityChange(idx, "openTime", e.target.value)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                    />
                    <span className="text-xs text-slate-400">to</span>
                    <input
                      type="time"
                      disabled={item.isClosed}
                      value={item.closeTime}
                      onChange={(e) => handleAvailabilityChange(idx, "closeTime", e.target.value)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAvailabilityChange(idx, "isClosed", !item.isClosed)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-black transition-all ${
                      item.isClosed
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                        : "bg-emerald-100 text-[#10B981] dark:bg-emerald-950/40"
                    }`}
                  >
                    {item.isClosed ? "Closed" : "Open"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= STEP 4: Accreditation & Upload ================= */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                Step 4: Accreditation & Document Upload
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Supply your General Pharmaceutical Council (GPhC) or CQC registration reference.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                    Accreditation Type
                  </label>
                  <select
                    value={formData.documentType}
                    onChange={(e) => handleFieldChange("documentType", e.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-bold text-slate-900 outline-none focus:border-[#10B981] focus:bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                  >
                    <option value="gphc">GPhC Premises Register</option>
                    <option value="cqc">CQC Registration Certificate</option>
                    <option value="utility">Premises Utility / Lease Proof</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                    Register Reference ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.documentRef}
                    onChange={(e) => handleFieldChange("documentRef", e.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 font-mono text-xs font-bold text-slate-900 outline-none focus:border-[#10B981] focus:bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                    placeholder="e.g. 1039841"
                  />
                </div>
              </div>

              {/* Drag & Drop Upload Widget */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                  Upload Certificate Document (PDF / PNG)
                </label>

                <div className="relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 text-center transition-all hover:border-[#10B981] hover:bg-emerald-50/20 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg"
                    onChange={handleFileMockUpload}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                  <UploadCloud className="mb-2 h-8 w-8 text-[#10B981]" />
                  <span className="text-xs font-bold text-slate-800 dark:text-white">
                    Click or drag certificate document here
                  </span>
                  <span className="text-[10px] text-slate-400">PDF, PNG or JPG up to 10MB</span>
                </div>

                {uploadingFile && (
                  <div className="flex items-center space-x-2 text-xs font-bold text-[#10B981]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Uploading document to secure cloud storage...</span>
                  </div>
                )}

                {uploadedFile && (
                  <div className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-50/60 p-3.5 dark:border-emerald-900/60 dark:bg-emerald-950/40">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-[#10B981]" />
                      <div>
                        <p className="text-xs font-black text-slate-900 dark:text-white">
                          {uploadedFile.name}
                        </p>
                        <p className="text-[10px] text-slate-400">{uploadedFile.size}</p>
                      </div>
                    </div>
                    <span className="rounded-md bg-[#10B981] px-2 py-0.5 text-[9px] font-black text-white">
                      Uploaded
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 5: Billing Subscription ================= */}
        {step === 5 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                Step 5: Billing & Plan Selection
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Select your practice directory plan and verify payment card authorization.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {/* Plan Options */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div
                  onClick={() => handleFieldChange("subscriptionPlan", "MONTHLY")}
                  className={`cursor-pointer space-y-2 rounded-3xl border p-5 transition-all ${
                    formData.subscriptionPlan === "MONTHLY"
                      ? "border-[#10B981] bg-emerald-50/60 ring-2 ring-[#10B981]/20 dark:border-emerald-800 dark:bg-emerald-950/40"
                      : "border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                  }`}
                >
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-[9px] font-black uppercase text-white">
                    Standard Monthly
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    £49.00 <span className="text-xs font-normal text-slate-400">/ mo</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Full directory listing, booking engine, & automated patient notifications.
                  </p>
                </div>

                <div
                  onClick={() => handleFieldChange("subscriptionPlan", "ANNUAL")}
                  className={`cursor-pointer space-y-2 rounded-3xl border p-5 transition-all ${
                    formData.subscriptionPlan === "ANNUAL"
                      ? "border-[#10B981] bg-emerald-50/60 ring-2 ring-[#10B981]/20 dark:border-emerald-800 dark:bg-emerald-950/40"
                      : "border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                  }`}
                >
                  <span className="rounded-full bg-[#10B981] px-3 py-1 text-[9px] font-black uppercase text-white">
                    Annual Discount (Save 20%)
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    £490.00 <span className="text-xs font-normal text-slate-400">/ yr</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Includes 2 months free, priority directory placement & dedicated support.
                  </p>
                </div>
              </div>

              {/* Mock Stripe Form */}
              <form
                onSubmit={handleVerifyMockPayment}
                className="dark:border-zinc-850 space-y-3 rounded-3xl border border-slate-200 bg-slate-50/50 p-5 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    Card Authorization Check
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">Stripe Encrypted</span>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Card Number (4242 •••• •••• 4242)"
                    value={cardData.number}
                    onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-xs font-bold text-slate-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardData.expiry}
                      onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-xs font-bold text-slate-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="CVC"
                      value={cardData.cvc}
                      onChange={(e) => setCardData({ ...cardData, cvc: e.target.value })}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-xs font-bold text-slate-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                    />
                  </div>
                </div>

                {!cardVerified ? (
                  <button
                    type="submit"
                    disabled={verifyingPayment || !cardData.number}
                    className="shadow-xs w-full rounded-xl bg-slate-900 py-2.5 text-xs font-black text-white hover:bg-[#10B981] disabled:opacity-50"
                  >
                    {verifyingPayment ? (
                      <Loader2 className="mx-auto h-4 w-4 animate-spin text-white" />
                    ) : (
                      "Verify Card Details"
                    )}
                  </button>
                ) : (
                  <div className="flex items-center space-x-2 text-xs font-bold text-[#10B981]">
                    <Check className="h-4 w-4" />
                    <span>Card verification authorized successfully</span>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* ================= STEP 6: OTP Verification ================= */}
        {step === 6 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                Step 6: Manager Email Verification
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Input the verification code sent to{" "}
                <strong className="text-slate-900 dark:text-white">{formData.email}</strong>.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-3 rounded-3xl border border-emerald-500/20 bg-emerald-50/60 p-5 text-center dark:border-emerald-900/60 dark:bg-emerald-950/40">
                <Mail className="mx-auto h-8 w-8 animate-pulse text-[#10B981]" />
                <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Verification OTP code:{" "}
                  <code className="rounded-lg bg-white px-2 py-1 font-mono text-sm font-black text-[#10B981] dark:bg-zinc-900">
                    {generatedOtp}
                  </code>
                </p>

                <div className="flex justify-center gap-2 pt-2">
                  <input
                    type="text"
                    value={userOtp}
                    onChange={(e) => setUserOtp(e.target.value)}
                    className="w-36 rounded-2xl border border-slate-200 bg-white p-2.5 text-center font-mono text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    placeholder="NDC-••••"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    className="shadow-xs rounded-2xl bg-[#10B981] px-5 py-2.5 text-xs font-black text-white hover:bg-emerald-600 active:scale-95"
                  >
                    Confirm Code
                  </button>
                </div>

                {otpError && (
                  <span className="block text-xs font-bold text-rose-600">
                    Incorrect code. Please match the code above.
                  </span>
                )}

                {otpVerified && (
                  <div className="flex items-center justify-center space-x-1.5 text-xs font-bold text-[#10B981]">
                    <Check className="h-4 w-4" />
                    <span>Email verified successfully</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 7: Final Summary ================= */}
        {step === 7 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                Step 7: Registration Summary Review
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Review your pharmacy practice information before final submission.
              </p>
            </div>

            <div className="dark:border-zinc-850 space-y-3 rounded-3xl border border-slate-200 bg-slate-50/60 p-5 text-xs dark:bg-zinc-900">
              <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2 dark:border-zinc-800">
                <span className="text-slate-500">Pharmacy Name:</span>
                <span className="font-black text-slate-900 dark:text-white">{formData.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2 dark:border-zinc-800">
                <span className="text-slate-500">Booking URL:</span>
                <span className="font-mono font-bold text-[#10B981]">
                  {formData.slug}.nextdoorclinic
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2 dark:border-zinc-800">
                <span className="text-slate-500">Manager Email:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formData.email}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2 dark:border-zinc-800">
                <span className="text-slate-500">Branch Address:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formData.address}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-slate-500">GPhC Reference:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formData.documentRef}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 8: SUCCESS SCREEN ================= */}
        {step === 8 && (
          <div className="flex flex-col items-center space-y-4 rounded-3xl border border-emerald-500/20 bg-emerald-50/60 p-8 text-center text-[#10B981] animate-in fade-in dark:border-emerald-900/60 dark:bg-emerald-950/40">
            <CheckCircle2 className="h-14 w-14 animate-bounce text-[#10B981]" />
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              Registration Submitted!
            </h3>
            <p className="max-w-md text-xs font-semibold leading-relaxed text-slate-600 dark:text-zinc-300">
              Your practice workspace registration has been submitted successfully. Our operations
              desk will audit your GPhC reference within 24 working hours.
            </p>
            <Link
              href="/login"
              className="mt-2 rounded-2xl bg-[#10B981] px-8 py-3 text-xs font-black text-white shadow-md hover:bg-emerald-600"
            >
              Sign In to Provider Dashboard
            </Link>
          </div>
        )}
      </div>

      {/* Navigation Toolbar */}
      {step < 8 && (
        <div className="dark:border-zinc-850 flex items-center justify-between border-t border-slate-100 pt-5">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 7 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="flex items-center space-x-1.5 rounded-2xl bg-[#10B981] px-6 py-3 text-xs font-black text-white shadow-md hover:bg-emerald-600 active:scale-95"
            >
              <span>Continue</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitRegistration}
              className="flex items-center space-x-2 rounded-2xl bg-[#10B981] px-8 py-3.5 text-xs font-black text-white shadow-lg hover:bg-emerald-600 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <>
                  <span>Complete & Submit Registration</span>
                  <CheckCircle2 className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
