"use client";

import React, { useState, useTransition, useEffect, useRef, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { localDateTimeToUTC } from "@/lib/timezone";
import { formatErrorMessage } from "@/lib/error-utils";
import {
  createBookingDirectAction,
  getAvailableSlotsAction,
  sendBookingOtpAction,
  verifyOtpAndCompleteBookingAction,
} from "@/actions/booking";
import {
  Clock,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  User,
  MapPin,
  Phone,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Building2,
  AlertCircle,
  Mail,
  Plus,
  Search,
  Check,
  CheckCircle2,
  Navigation,
  Lock,
  Download,
  ExternalLink,
  Share2,
  HelpCircle,
} from "lucide-react";
import { format, addDays, isToday, isTomorrow, isSameDay } from "date-fns";
import Link from "next/link";
import { slugify } from "@/lib/slug";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  icon?: string | null;
  color?: string | null;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  isActive: boolean;
  category?: string;
  imageUrl?: string | null;
}

interface BookingWizardProps {
  pharmacy: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    brandColor: string | null;
    displayName: string | null;
    address: string;
    phone: string;
    description?: string | null;
    welcomeMessage?: string | null;
    availability?: { dayOfWeek: number; openTime: string; closeTime: string }[];
    blockedDates?: { date: string; reason?: string | null }[];
  };
  services: Service[];
  categories?: CategoryItem[];
  currentUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string | null;
  } | null;
  initialServiceId?: string;
  unofferedServiceQuery?: string;
  onClose?: () => void;
}

const formSchema = z.object({
  firstName: z.string().min(1, "Enter your first name"),
  lastName: z.string().min(1, "Enter your last name"),
  mobile: z.string().refine(
    (val) => {
      const digits = val.replace(/\D/g, "");
      return digits.length >= 8 && digits.length <= 15;
    },
    {
      message: "Enter a valid mobile number (e.g. +44 7700 900123)",
    }
  ),
  email: z.string().email("Enter a valid email address"),
  dob: z.string().optional(),
  notes: z.string().optional(),
  consentTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept terms to continue",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export function BookingWizard({
  pharmacy,
  services,
  categories = [],
  currentUser,
  initialServiceId,
  unofferedServiceQuery,
  onClose,
}: BookingWizardProps) {
  // Pre-select service if initialServiceId is passed
  const preselectedService = services.find((s) => s.id === initialServiceId);
  const [selectedService, setSelectedService] = useState<Service | null>(
    preselectedService || (services.length === 1 ? services[0] : null)
  );

  // Step Index:
  // 0: Service Selection (if not preselected)
  // 1: Date & Time Picker
  // 2: Patient Info ("Who is this appointment for?")
  // 3: Review Booking ("Almost done — let's review your appointment")
  // 4: OTP Verification
  // 5: Emotional Success Page
  const [currentStep, setCurrentStep] = useState<number>(() => {
    return preselectedService || services.length === 1 ? 1 : 0;
  });

  // Date & Time states
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");

  // OTP Verification state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(30);

  // Final Booking Result state
  const [bookingResult, setBookingResult] = useState<{
    referenceCode: string;
    appointmentId: string;
    manageUrl?: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: currentUser?.firstName || "",
      lastName: currentUser?.lastName || "",
      mobile: currentUser?.phone || "",
      email: currentUser?.email || "",
      dob: "",
      notes: "",
      consentTerms: true,
    },
  });

  const formValues = watch();

  // Resend OTP Countdown timer
  useEffect(() => {
    let interval: any = null;
    if (otpSent && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, resendTimer]);

  // Dynamic Real-Time Slot Fetching state
  const [availableSlots, setAvailableSlots] = useState<
    {
      time: string;
      label: string;
      group: string;
      isAvailable: boolean;
      reason?: string;
      badge?: string;
    }[]
  >([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  // Clinic Schedule & Off-Day Helper
  const getClinicDateStatus = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dayOfWeek = date.getDay();

    const isBlocked = (pharmacy.blockedDates || []).some((b: any) => {
      const bStr =
        typeof b.date === "string" ? b.date.split("T")[0] : format(new Date(b.date), "yyyy-MM-dd");
      return bStr === dateStr;
    });

    const avail = (pharmacy.availability || []).find((a: any) => a.dayOfWeek === dayOfWeek);
    const isClosed = !avail;

    return {
      isClosed,
      isBlocked,
      openTime: avail?.openTime,
      closeTime: avail?.closeTime,
    };
  };

  useEffect(() => {
    if (!selectedService || !pharmacy?.id) return;

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    let isCancelled = false;
    setLoadingSlots(true);

    getAvailableSlotsAction(pharmacy.id, selectedService.id, dateStr, "Europe/London")
      .then((res) => {
        if (isCancelled) return;
        if (res.success && Array.isArray(res.slots)) {
          const mapped = res.slots.map((s: any, idx: number) => {
            const timeStr = s.formattedTime || format(new Date(s.startTime), "HH:mm");
            const dateObj = new Date(s.startTime);
            const hour = dateObj.getHours();
            const formattedLabel = format(dateObj, "hh:mm a");
            const group = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
            const isAvailable = s.isAvailable !== false;
            const badge = !isAvailable
              ? s.reason === "BOOKED"
                ? "Booked"
                : "Unavailable"
              : idx === 0
                ? "Earliest"
                : idx === 2
                  ? "Most Popular"
                  : undefined;
            return {
              time: timeStr,
              label: formattedLabel,
              group,
              isAvailable,
              reason: s.reason,
              badge,
            };
          });
          setAvailableSlots(mapped);

          const firstAvail = mapped.find((m: any) => m.isAvailable);
          if (
            firstAvail &&
            (!selectedTime || !mapped.some((m: any) => m.time === selectedTime && m.isAvailable))
          ) {
            setSelectedTime(firstAvail.time);
          }
        } else {
          setAvailableSlots([]);
        }
      })
      .catch((err) => {
        if (!isCancelled) setAvailableSlots([]);
      })
      .finally(() => {
        if (!isCancelled) setLoadingSlots(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [pharmacy?.id, selectedService?.id, selectedDate]);

  const morningSlots = useMemo(
    () => availableSlots.filter((s) => s.group === "Morning"),
    [availableSlots]
  );
  const afternoonSlots = useMemo(
    () => availableSlots.filter((s) => s.group === "Afternoon"),
    [availableSlots]
  );
  const eveningSlots = useMemo(
    () => availableSlots.filter((s) => s.group === "Evening"),
    [availableSlots]
  );

  // Handle OTP digit inputs
  const handleOtpDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otpCode];
      digits.forEach((d, i) => {
        newOtp[i] = d;
      });
      setOtpCode(newOtp);
      const nextFocus = Math.min(digits.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Construct ISO start time in pharmacy timezone (Europe/London)
  const getStartTimeISO = () => {
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    const timeStr = selectedTime || "09:00";
    return localDateTimeToUTC(formattedDate, timeStr, "Europe/London").toISOString();
  };

  // Submit Booking & Send OTP
  const handleReviewConfirm = async (data: FormValues) => {
    setErrorMsg("");
    if (!selectedService || !selectedTime) {
      setErrorMsg("Please select a valid service, date, and time slot.");
      return;
    }

    startTransition(async () => {
      try {
        const otpRes = await sendBookingOtpAction(data.mobile, data.email);

        if (otpRes.success) {
          setOtpSent(true);
          setResendTimer(30);
          setCurrentStep(4);
        } else {
          executeDirectBooking(data);
        }
      } catch (err: any) {
        executeDirectBooking(data);
      }
    });
  };

  const executeDirectBooking = async (data: FormValues) => {
    const startTimeISO = getStartTimeISO();
    const res = await createBookingDirectAction({
      pharmacyId: pharmacy.id,
      serviceId: selectedService!.id,
      startTime: startTimeISO,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      mobile: data.mobile,
      addressLine1: pharmacy.address || "Main Street",
      townCity: "Leeds",
      postcode: "LS1 6AZ",
      notes: data.notes,
    });

    if (res.success && res.referenceCode) {
      setBookingResult({
        referenceCode: res.referenceCode,
        appointmentId: res.appointmentId || "",
        manageUrl: res.manageUrl,
      });
      setCurrentStep(5);
    } else {
      setErrorMsg(formatErrorMessage(res.error));
    }
  };

  // Verify OTP & Complete Booking
  const handleVerifyOtp = async () => {
    const code = otpCode.join("");
    if (code.length !== 6) {
      setOtpError("Please enter the 6-digit code sent to your phone");
      return;
    }

    setOtpError("");
    startTransition(async () => {
      const startTimeISO = getStartTimeISO();
      const res = await verifyOtpAndCompleteBookingAction({
        pharmacyId: pharmacy.id,
        serviceId: selectedService!.id,
        startTime: startTimeISO,
        firstName: formValues.firstName,
        lastName: formValues.lastName,
        mobile: formValues.mobile,
        email: formValues.email,
        addressLine1: pharmacy.address || "Main Street",
        townCity: "Leeds",
        postcode: "LS1 6AZ",
        notes: formValues.notes,
        otpCode: code,
      });

      if (res.success && res.referenceCode) {
        setBookingResult({
          referenceCode: res.referenceCode,
          appointmentId: res.appointmentId || "",
          manageUrl: res.manageUrl,
        });
        setCurrentStep(5);
      } else {
        setOtpError(formatErrorMessage(res.error));
      }
    });
  };

  const goBackStep = () => {
    if (currentStep > 0 && currentStep !== 5) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen select-text bg-[#F8FAFC] pb-28 font-sans text-slate-900 antialiased dark:bg-zinc-950 dark:text-slate-100 md:pb-12">
      {/* ========================================================================= */}
      {/* 1. DEDICATED MOBILE & DESKTOP BOOKING HEADER */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 h-16 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Left Back Button & Step Badge */}
          <div className="flex items-center space-x-2">
            {currentStep > 0 && currentStep !== 5 && (
              <button
                onClick={goBackStep}
                className="flex h-10 min-h-[44px] w-10 min-w-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                aria-label="Back step"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            <Link href="/" className="flex items-center space-x-2">
              <img
                src="/assets/header-logo.png"
                alt="NextDoorClinic"
                className="h-7 w-auto object-contain dark:brightness-0 dark:invert sm:h-8"
              />
            </Link>
          </div>

          {/* Center Compact Step Indicator (Mobile & Desktop) */}
          {currentStep < 4 && (
            <div className="flex items-center space-x-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              <span className="text-[#10B981]">Step {currentStep + 1}</span>
              <span className="text-slate-300 dark:text-zinc-700">/</span>
              <span>4</span>
            </div>
          )}
          {currentStep === 4 && (
            <div className="flex items-center space-x-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
              <span className="text-[#10B981]">Verification</span>
            </div>
          )}

          {/* Right GPhC Badge & Support */}
          <div className="flex items-center space-x-2">
            <Link
              href={
                selectedService ? `/search?service=${slugify(selectedService.name)}` : "/search"
              }
              className="inline-flex items-center space-x-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-slate-400" />
              <span>Back to Results</span>
            </Link>

            <span className="hidden items-center space-x-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1 text-[11px] font-bold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 sm:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" />
              <span>GPhC Regulated</span>
            </span>

            {onClose && (
              <button
                onClick={onClose}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                &times;
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. COMPACT MOBILE PROVIDER & SERVICE RIBBON */}
      {/* ========================================================================= */}
      <div className="shadow-2xs border-b border-slate-200/80 bg-white py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2.5 px-4 sm:px-6">
          <div className="flex min-w-0 items-center space-x-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 font-bold text-[#10B981] dark:bg-emerald-950/60">
              {pharmacy.logoUrl ? (
                <img
                  src={pharmacy.logoUrl}
                  alt={pharmacy.name}
                  className="h-full w-full rounded-xl object-cover"
                />
              ) : (
                <Building2 className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <h2 className="truncate text-xs font-bold text-slate-900 dark:text-white sm:text-sm">
                  {pharmacy.displayName || pharmacy.name}
                </h2>
                <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-extrabold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Verified
                </span>
              </div>
              <p className="max-w-xs truncate text-[11px] text-slate-500 dark:text-zinc-400 sm:max-w-md">
                {pharmacy.address}
              </p>
            </div>
          </div>

          {/* Selected Service Ribbon Info */}
          {selectedService && (
            <div className="flex items-center space-x-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-950">
              <div>
                <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Treatment
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {selectedService.name} &bull; £{selectedService.price.toFixed(2)}
                </span>
              </div>
              {services.length > 1 && currentStep !== 5 && (
                <button
                  onClick={() => setCurrentStep(0)}
                  className="text-[11px] font-bold text-[#10B981] hover:underline"
                >
                  Change
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN WORKSPACE (Mobile First / Desktop Split Layout) */}
      {/* ========================================================================= */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* LEFT COLUMN: MOBILE-FIRST CONVERSATIONAL STEPS (7 Cols) */}
          <div className="space-y-6 lg:col-span-7">
            {/* STEP 0: SERVICE SELECTION (If not preselected) */}
            {currentStep === 0 && (
              <div className="space-y-5">
                {/* UNOFFERED SERVICE WARNING BANNER */}
                {unofferedServiceQuery && !selectedService && (
                  <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center dark:border-amber-900/50 dark:bg-amber-950/30">
                    <AlertCircle className="mx-auto h-7 w-7 text-amber-600 dark:text-amber-400" />
                    <div className="space-y-1">
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        This pharmacy does not currently offer &quot;{unofferedServiceQuery}&quot;.
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-zinc-400">
                        Select an available service below or return to search results to find
                        clinics providing this treatment.
                      </p>
                    </div>
                    <Link
                      href={`/search?service=${encodeURIComponent(unofferedServiceQuery)}`}
                      className="shadow-xs inline-flex items-center space-x-2 rounded-xl bg-[#10B981] px-4 py-2 text-xs font-extrabold text-white hover:bg-emerald-600"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Search other clinics offering {unofferedServiceQuery}</span>
                    </Link>
                  </div>
                )}
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#10B981]">
                    Step 1 of 4
                  </span>
                  <h1 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                    Select a treatment service
                  </h1>
                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                    Choose from GPhC approved clinical services offered at this pharmacy location.
                  </p>
                </div>

                <div className="space-y-3">
                  {services.map((service) => {
                    const isSel = selectedService?.id === service.id;
                    return (
                      <div
                        key={service.id}
                        onClick={() => {
                          setSelectedService(service);
                          setCurrentStep(1);
                        }}
                        className={`group flex min-h-[52px] cursor-pointer items-center justify-between rounded-2xl border p-4 transition-all ${
                          isSel
                            ? "shadow-xs border-[#10B981] bg-emerald-50/40 dark:bg-emerald-950/20"
                            : "border-slate-200/80 bg-white hover:border-[#10B981]/50 dark:border-zinc-800 dark:bg-zinc-900"
                        }`}
                      >
                        <div className="space-y-1 pr-3">
                          <h3 className="text-xs font-bold text-slate-900 transition-colors group-hover:text-[#10B981] dark:text-white sm:text-sm">
                            {service.name}
                          </h3>
                          {service.description && (
                            <p className="line-clamp-2 text-[11px] text-slate-500 dark:text-zinc-400">
                              {service.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-3 pt-1 text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              <span>{service.duration} mins</span>
                            </span>
                            <span>&bull;</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              £{service.price.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <button className="shadow-xs flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-[#10B981] px-4 py-2 text-xs font-bold text-white transition-all group-hover:bg-emerald-600">
                          Select &rarr;
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 1: MOBILE HORIZONTAL SNAP-SCROLL DATE & TIME PICKER */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#10B981]">
                    Step 2 of 4
                  </span>
                  <h1 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                    Choose a time that works for you
                  </h1>
                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                    Swipe dates below to find an available clinical slot.
                  </p>
                </div>

                {/* Mobile Horizontal Snap-Scroll Date Strip */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Select Appointment Date
                  </label>

                  <div className="scrollbar-none flex snap-x snap-mandatory items-center space-x-2.5 overflow-x-auto pb-2">
                    {Array.from({ length: 14 }).map((_, idx) => {
                      const dateObj = addDays(new Date(), idx);
                      const isSel = isSameDay(selectedDate, dateObj);
                      const status = getClinicDateStatus(dateObj);
                      const isTodayDate = isToday(dateObj);
                      const isTomorrowDate = isTomorrow(dateObj);

                      const dateLabel = isTodayDate
                        ? "Today"
                        : isTomorrowDate
                          ? "Tomorrow"
                          : format(dateObj, "EEE");
                      const dateSub = format(dateObj, "d MMM");

                      const badgeText = status.isBlocked
                        ? "Off Day"
                        : status.isClosed
                          ? "Closed"
                          : isTodayDate
                            ? "Earliest"
                            : isTomorrowDate
                              ? "Popular"
                              : undefined;

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedDate(dateObj)}
                          className={`relative flex min-h-[60px] min-w-[95px] snap-center flex-col items-center justify-center rounded-2xl px-4 py-3 transition-all ${
                            isSel
                              ? "bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900"
                              : status.isBlocked || status.isClosed
                                ? "border border-slate-200/60 bg-slate-100/60 text-slate-400 dark:border-zinc-800/60 dark:bg-zinc-900/40 dark:text-zinc-600"
                                : "border border-slate-200/90 bg-white text-slate-700 hover:border-[#10B981] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                          }`}
                        >
                          <span className="text-xs font-extrabold">{dateLabel}</span>
                          <span className="text-[10px] font-medium opacity-80">{dateSub}</span>
                          {badgeText && (
                            <span
                              className={`py-0.2 shadow-2xs absolute -top-2 rounded-full px-1.5 text-[7px] font-extrabold uppercase text-white ${
                                status.isBlocked
                                  ? "bg-rose-500"
                                  : status.isClosed
                                    ? "bg-slate-400"
                                    : "bg-[#10B981]"
                              }`}
                            >
                              {badgeText}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* CLINIC OFF DAY / CLOSED WARNING BANNER */}
                {(() => {
                  const selStatus = getClinicDateStatus(selectedDate);
                  if (selStatus.isBlocked || selStatus.isClosed) {
                    return (
                      <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/60 dark:bg-amber-950/40">
                        <div className="flex items-center space-x-2 font-bold text-amber-900 dark:text-amber-200">
                          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                          <span>
                            Clinic is {selStatus.isBlocked ? "Off / Blocked" : "Closed"} on{" "}
                            {format(selectedDate, "EEEE, d MMMM yyyy")}
                          </span>
                        </div>
                        <p className="text-xs text-amber-800 dark:text-amber-300">
                          {selStatus.isBlocked
                            ? "This clinic has marked this date as an off day. No appointments can be booked."
                            : "This pharmacy is closed on this day of the week. Please select another date above."}
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* REAL-TIME SLOT LOADING & SELECTION */}
                {loadingSlots ? (
                  <div className="flex flex-col items-center justify-center space-y-2 rounded-2xl border border-slate-200/80 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
                    <Loader2 className="h-6 w-6 animate-spin text-[#10B981]" />
                    <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                      Checking real-time slot availability for {format(selectedDate, "d MMM yyyy")}
                      ...
                    </span>
                  </div>
                ) : (
                  <div className="space-y-5 pt-2">
                    {!getClinicDateStatus(selectedDate).isClosed &&
                      !getClinicDateStatus(selectedDate).isBlocked &&
                      availableSlots.length === 0 && (
                        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
                          <Clock className="mx-auto h-8 w-8 text-slate-400" />
                          <div className="space-y-1">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                              No slots available on {format(selectedDate, "EEEE, d MMMM")}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-zinc-400">
                              All time slots for this date are fully booked or unavailable.
                            </p>
                          </div>
                        </div>
                      )}

                    {/* Morning Slots */}
                    {morningSlots.length > 0 && (
                      <div className="space-y-2.5">
                        <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                          Morning Slots
                        </span>
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                          {morningSlots.map((slot) => {
                            const isSel = selectedTime === slot.time && slot.isAvailable;
                            const isDis = !slot.isAvailable;
                            return (
                              <button
                                key={slot.time}
                                type="button"
                                disabled={isDis}
                                onClick={() => {
                                  if (!isDis) setSelectedTime(slot.time);
                                }}
                                className={`relative flex min-h-[52px] flex-col items-center justify-center rounded-2xl p-3 text-center transition-all ${
                                  isDis
                                    ? "cursor-not-allowed border border-slate-200/60 bg-slate-100/70 text-slate-400 dark:border-zinc-800/60 dark:bg-zinc-900/40 dark:text-zinc-600"
                                    : isSel
                                      ? "shadow-xs border-2 border-[#10B981] bg-emerald-50/70 dark:bg-emerald-950/40"
                                      : "border border-slate-200/90 bg-white hover:border-[#10B981]/60 dark:border-zinc-800 dark:bg-zinc-900"
                                }`}
                              >
                                <span
                                  className={`text-xs font-extrabold ${
                                    isDis
                                      ? "line-through opacity-70"
                                      : "text-slate-900 dark:text-white"
                                  }`}
                                >
                                  {slot.label}
                                </span>
                                {slot.badge && (
                                  <span
                                    className={`shadow-2xs absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[8px] font-extrabold uppercase text-white ${
                                      isDis ? "bg-slate-400 dark:bg-zinc-700" : "bg-[#10B981]"
                                    }`}
                                  >
                                    {slot.badge}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Afternoon Slots */}
                    {afternoonSlots.length > 0 && (
                      <div className="space-y-2.5">
                        <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                          Afternoon Slots
                        </span>
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                          {afternoonSlots.map((slot) => {
                            const isSel = selectedTime === slot.time && slot.isAvailable;
                            const isDis = !slot.isAvailable;
                            return (
                              <button
                                key={slot.time}
                                type="button"
                                disabled={isDis}
                                onClick={() => {
                                  if (!isDis) setSelectedTime(slot.time);
                                }}
                                className={`relative flex min-h-[52px] flex-col items-center justify-center rounded-2xl p-3 text-center transition-all ${
                                  isDis
                                    ? "cursor-not-allowed border border-slate-200/60 bg-slate-100/70 text-slate-400 dark:border-zinc-800/60 dark:bg-zinc-900/40 dark:text-zinc-600"
                                    : isSel
                                      ? "shadow-xs border-2 border-[#10B981] bg-emerald-50/70 dark:bg-emerald-950/40"
                                      : "border border-slate-200/90 bg-white hover:border-[#10B981]/60 dark:border-zinc-800 dark:bg-zinc-900"
                                }`}
                              >
                                <span
                                  className={`text-xs font-extrabold ${
                                    isDis
                                      ? "line-through opacity-70"
                                      : "text-slate-900 dark:text-white"
                                  }`}
                                >
                                  {slot.label}
                                </span>
                                {slot.badge && (
                                  <span
                                    className={`shadow-2xs absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[8px] font-extrabold uppercase text-white ${
                                      isDis ? "bg-slate-400 dark:bg-zinc-700" : "bg-[#10B981]"
                                    }`}
                                  >
                                    {slot.badge}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Evening Slots */}
                    {eveningSlots.length > 0 && (
                      <div className="space-y-2.5">
                        <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                          Evening Slots
                        </span>
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                          {eveningSlots.map((slot) => {
                            const isSel = selectedTime === slot.time && slot.isAvailable;
                            const isDis = !slot.isAvailable;
                            return (
                              <button
                                key={slot.time}
                                type="button"
                                disabled={isDis}
                                onClick={() => {
                                  if (!isDis) setSelectedTime(slot.time);
                                }}
                                className={`relative flex min-h-[52px] flex-col items-center justify-center rounded-2xl p-3 text-center transition-all ${
                                  isDis
                                    ? "cursor-not-allowed border border-slate-200/60 bg-slate-100/70 text-slate-400 dark:border-zinc-800/60 dark:bg-zinc-900/40 dark:text-zinc-600"
                                    : isSel
                                      ? "shadow-xs border-2 border-[#10B981] bg-emerald-50/70 dark:bg-emerald-950/40"
                                      : "border border-slate-200/90 bg-white hover:border-[#10B981]/60 dark:border-zinc-800 dark:bg-zinc-900"
                                }`}
                              >
                                <span
                                  className={`text-xs font-extrabold ${
                                    isDis
                                      ? "line-through opacity-70"
                                      : "text-slate-900 dark:text-white"
                                  }`}
                                >
                                  {slot.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2 Desktop-Only Inline Action Button */}
                <div className="hidden border-t border-slate-200/80 pt-6 dark:border-zinc-800 lg:block">
                  <button
                    type="button"
                    disabled={!selectedTime}
                    onClick={() => {
                      if (!selectedTime) return;
                      setCurrentStep(2);
                    }}
                    className="flex min-h-[52px] w-full items-center justify-center space-x-2 rounded-2xl bg-[#10B981] py-4 text-xs font-extrabold text-white shadow-lg transition-all hover:bg-emerald-600 active:scale-95 disabled:opacity-50"
                  >
                    <span>Continue to Patient Details</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: STRIPE CHECKOUT-STYLE PATIENT FORM (Min 52px Inputs) */}
            {currentStep === 2 && (
              <form onSubmit={handleSubmit((d) => setCurrentStep(3))} className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#10B981]">
                    Step 3 of 4
                  </span>
                  <h1 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                    Who is this appointment for?
                  </h1>
                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                    Provide basic patient details. Encrypted and protected under UK GDPR.
                  </p>
                </div>

                <div className="shadow-xs space-y-5 rounded-2xl border border-slate-200/90 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                  {/* Group A: Personal Info */}
                  <div className="space-y-4">
                    <h3 className="border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-zinc-800">
                      Personal Information
                    </h3>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                          First Name *
                        </label>
                        <input
                          type="text"
                          inputMode="text"
                          {...register("firstName")}
                          className="min-h-[52px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-900 focus:border-[#10B981] focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                          placeholder="e.g. Sarah"
                        />
                        {errors.firstName && (
                          <p className="text-[10px] font-bold text-rose-600">
                            {errors.firstName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          inputMode="text"
                          {...register("lastName")}
                          className="min-h-[52px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-900 focus:border-[#10B981] focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                          placeholder="e.g. Jenkins"
                        />
                        {errors.lastName && (
                          <p className="text-[10px] font-bold text-rose-600">
                            {errors.lastName.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Group B: Contact Details */}
                  <div className="space-y-4 pt-2">
                    <h3 className="border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-zinc-800">
                      Contact Information
                    </h3>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          inputMode="email"
                          {...register("email")}
                          className="min-h-[52px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-900 focus:border-[#10B981] focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                          placeholder="sarah@example.com"
                        />
                        {errors.email && (
                          <p className="text-[10px] font-bold text-rose-600">
                            {errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                          Mobile Phone (SMS & WhatsApp logs) *
                        </label>
                        <input
                          type="tel"
                          inputMode="tel"
                          {...register("mobile")}
                          className="min-h-[52px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-900 focus:border-[#10B981] focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                          placeholder="+44 7700 900123"
                        />
                        {errors.mobile && (
                          <p className="text-[10px] font-bold text-rose-600">
                            {errors.mobile.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Group C: Additional Notes */}
                  <div className="space-y-2 pt-2">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                      Clinical Notes or Symptoms (Optional)
                    </label>
                    <textarea
                      rows={2}
                      {...register("notes")}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-900 focus:border-[#10B981] focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                      placeholder="Mention any allergies, medical preferences, or symptoms..."
                    />
                  </div>
                </div>
              </form>
            )}

            {/* STEP 3: REVIEW PAGE ("Almost done — let's review your appointment") */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#10B981]">
                    Step 4 of 4
                  </span>
                  <h1 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                    Almost done — let&apos;s review your appointment
                  </h1>
                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                    Check your appointment details below before confirming.
                  </p>
                </div>

                {errorMsg && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="flex flex-col justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs dark:border-rose-900/60 dark:bg-rose-950/40 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center space-x-2.5">
                      <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                      <span className="font-bold text-rose-900 dark:text-rose-200">
                        {errorMsg === "SLOT_TAKEN"
                          ? "This time slot is no longer available. Please select another convenient time slot."
                          : errorMsg}
                      </span>
                    </div>
                    {(errorMsg === "SLOT_TAKEN" || errorMsg.includes("no longer available")) && (
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg("");
                          setCurrentStep(1);
                        }}
                        className="shadow-xs inline-flex shrink-0 items-center justify-center rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-extrabold text-white transition-all hover:bg-rose-700 active:scale-95"
                      >
                        Change Time Slot
                      </button>
                    )}
                  </div>
                )}

                {/* Booking Review Card */}
                <div className="shadow-xs space-y-4 rounded-2xl border border-slate-200/90 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                  <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-zinc-800">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Treatment & Clinic
                      </span>
                      <h3 className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white sm:text-base">
                        {selectedService?.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        {pharmacy.displayName || pharmacy.name} &bull; {pharmacy.address}
                      </p>
                    </div>
                    <span className="text-base font-extrabold text-[#10B981]">
                      £{selectedService?.price.toFixed(2)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 border-b border-slate-100 pb-4 text-xs dark:border-zinc-800 sm:grid-cols-2">
                    <div>
                      <span className="block text-[10px] font-semibold uppercase text-slate-400">
                        Scheduled Date & Time
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {format(selectedDate, "EEE, d MMMM yyyy")} at {selectedTime}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-semibold uppercase text-slate-400">
                        Patient Name & Phone
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formValues.firstName} {formValues.lastName} ({formValues.mobile})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: DEDICATED MOBILE OTP SCREEN */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#10B981]">
                    Verification
                  </span>
                  <h1 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                    Enter 6-digit verification code
                  </h1>
                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                    We sent a security code to{" "}
                    <strong className="text-slate-900 dark:text-white">{formValues.mobile}</strong>.
                  </p>
                </div>

                <div className="shadow-xs space-y-6 rounded-2xl border border-slate-200/90 bg-white p-5 text-center dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                  <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-3">
                    {otpCode.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpInputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !digit && idx > 0) {
                            otpInputRefs.current[idx - 1]?.focus();
                          }
                        }}
                        className="shadow-2xs h-11 w-10 rounded-xl border border-slate-200 bg-white text-center text-lg font-extrabold text-slate-900 transition-all focus:border-[#10B981] focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white sm:h-14 sm:w-12"
                      />
                    ))}
                  </div>

                  {otpError && (
                    <p role="alert" aria-live="polite" className="text-xs font-bold text-rose-600">
                      {otpError}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                    <button
                      disabled={resendTimer > 0}
                      onClick={() => handleReviewConfirm(formValues)}
                      className="min-h-[44px] font-bold text-[#10B981] hover:underline disabled:opacity-50"
                    >
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
                    </button>

                    <button
                      onClick={() => setCurrentStep(2)}
                      className="min-h-[44px] text-slate-400 hover:text-slate-700"
                    >
                      Change Number
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: EMOTIONAL MOBILE SUCCESS SCREEN */}
            {currentStep === 5 && bookingResult && (
              <div className="space-y-6 duration-300 animate-in fade-in zoom-in-95">
                <div className="shadow-xs space-y-4 rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6 text-center dark:border-emerald-900/60 dark:bg-emerald-950/40 sm:p-8">
                  <div className="mx-auto flex h-16 w-16 animate-bounce items-center justify-center rounded-full bg-[#10B981] text-white shadow-lg">
                    <Check className="h-8 w-8 stroke-[3]" />
                  </div>

                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-widest text-[#10B981]">
                      Appointment Confirmed
                    </span>
                    <h1 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                      You&apos;re all set for your appointment!
                    </h1>
                    <p className="mx-auto mt-1 max-w-md text-xs text-slate-600 dark:text-zinc-300">
                      Confirmation sent to{" "}
                      <strong className="text-slate-900 dark:text-white">{formValues.email}</strong>{" "}
                      and{" "}
                      <strong className="text-slate-900 dark:text-white">
                        {formValues.mobile}
                      </strong>
                      .
                    </p>
                  </div>

                  {/* Booking Reference Code Pill */}
                  <div className="shadow-xs inline-flex items-center space-x-2 rounded-2xl border border-emerald-300 bg-white px-5 py-2.5 dark:border-emerald-800 dark:bg-zinc-900">
                    <span className="text-xs font-medium text-slate-500">Booking Ref:</span>
                    <span className="font-mono text-sm font-extrabold text-slate-900 dark:text-white">
                      {bookingResult.referenceCode}
                    </span>
                  </div>

                  {/* Add to Calendar & Directions */}
                  <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
                    <a
                      href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                        selectedService?.name || "Healthcare Appointment"
                      )}&dates=${format(selectedDate, "yyyyMMdd")}T090000Z/${format(
                        selectedDate,
                        "yyyyMMdd"
                      )}T100000Z&details=${encodeURIComponent(
                        `Appointment at ${pharmacy.name}. Ref: ${bookingResult.referenceCode}`
                      )}&location=${encodeURIComponent(pharmacy.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shadow-xs inline-flex min-h-[52px] w-full items-center justify-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 sm:w-auto"
                    >
                      <CalendarIcon className="h-4 w-4 text-[#10B981]" />
                      <span>Add to Google Calendar</span>
                    </a>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        pharmacy.address
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shadow-xs inline-flex min-h-[52px] w-full items-center justify-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 sm:w-auto"
                    >
                      <MapPin className="h-4 w-4 text-[#10B981]" />
                      <span>Get Directions</span>
                    </a>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <Link
                    href="/"
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#10B981] hover:underline"
                  >
                    <span>Return to NextDoorClinic Homepage</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: STICKY SPLIT SUMMARY CARD & TRUST BADGES (>1024px) */}
          <div className="sticky top-24 hidden space-y-4 lg:col-span-5 lg:block">
            <div className="shadow-xs space-y-4 rounded-2xl border border-slate-200/90 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-3 dark:border-zinc-800">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-800 dark:bg-zinc-800 dark:text-zinc-200">
                  {pharmacy.logoUrl ? (
                    <img
                      src={pharmacy.logoUrl}
                      alt={pharmacy.name}
                      className="h-full w-full rounded-xl object-cover"
                    />
                  ) : (
                    <Building2 className="h-5 w-5 text-[#10B981]" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {pharmacy.displayName || pharmacy.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                    {pharmacy.address}
                  </p>
                </div>
              </div>

              {/* Treatment Specs Summary */}
              {selectedService ? (
                <div className="space-y-2 border-b border-slate-100 pb-3 text-xs dark:border-zinc-800">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-500">Service</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {selectedService.name}
                    </span>
                  </div>

                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-500">Duration</span>
                    <span className="text-slate-900 dark:text-white">
                      {selectedService.duration} mins
                    </span>
                  </div>

                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-500">Date & Time</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {format(selectedDate, "d MMM")} at {selectedTime || "Pending"}
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-extrabold dark:border-zinc-800">
                    <span className="text-slate-900 dark:text-white">Total Fee</span>
                    <span className="text-[#10B981]">£{selectedService.price.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs italic text-slate-400">
                  Select a service to view pricing details.
                </p>
              )}

              {/* Trust Badges Bar */}
              <div className="space-y-2 pt-1 text-[11px] font-semibold text-slate-600 dark:text-zinc-400">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="h-4 w-4 text-[#10B981]" />
                  <span>GPhC Registered Premises</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-[#10B981]" />
                  <span>256-bit SSL Encrypted Patient Data</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                  <span>Free Cancellation & Reschedule</span>
                </div>
              </div>

              {/* Desktop Step Action Button */}
              {currentStep < 5 && (
                <div className="border-t border-slate-100 pt-2 dark:border-zinc-800">
                  {currentStep === 1 && (
                    <button
                      disabled={!selectedTime}
                      onClick={() => setCurrentStep(2)}
                      className="flex min-h-[44px] w-full items-center justify-center space-x-2 rounded-xl bg-[#10B981] py-3.5 text-xs font-black text-white shadow-md transition-all hover:bg-emerald-600 disabled:opacity-50"
                    >
                      <span>Continue to Patient Details</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}

                  {currentStep === 2 && (
                    <button
                      type="button"
                      onClick={handleSubmit((d) => setCurrentStep(3))}
                      className="flex min-h-[44px] w-full items-center justify-center space-x-2 rounded-xl bg-[#10B981] py-3.5 text-xs font-black text-white shadow-md transition-all hover:bg-emerald-600"
                    >
                      <span>Review Appointment</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}

                  {currentStep === 3 && (
                    <button
                      disabled={isPending}
                      onClick={() => handleReviewConfirm(formValues)}
                      className="flex min-h-[44px] w-full items-center justify-center space-x-2 rounded-xl bg-[#10B981] py-3.5 text-xs font-black text-white shadow-md transition-all hover:bg-emerald-600 disabled:opacity-50"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Sending Verification...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          <span>Confirm Appointment</span>
                        </>
                      )}
                    </button>
                  )}

                  {currentStep === 4 && (
                    <button
                      disabled={isPending || otpCode.join("").length !== 6}
                      onClick={handleVerifyOtp}
                      className="flex min-h-[44px] w-full items-center justify-center space-x-2 rounded-xl bg-[#10B981] py-3.5 text-xs font-black text-white shadow-md transition-all hover:bg-emerald-600 disabled:opacity-50"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <span>Verify & Complete Booking</span>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 4. MOBILE STICKY FIXED BOTTOM ACTION BAR (<1024px) */}
      {/* ========================================================================= */}
      {currentStep < 5 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/90 bg-white/95 p-4 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 lg:hidden">
          <div className="mx-auto flex max-w-md items-center justify-between gap-3">
            {currentStep === 1 && (
              <button
                disabled={!selectedTime}
                onClick={() => setCurrentStep(2)}
                className="flex min-h-[52px] w-full items-center justify-center space-x-2 rounded-2xl bg-[#10B981] py-3.5 text-xs font-extrabold text-white shadow-md transition-all hover:bg-emerald-600 disabled:opacity-50"
              >
                <span>Continue to Patient Info</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                onClick={handleSubmit((d) => setCurrentStep(3))}
                className="flex min-h-[52px] w-full items-center justify-center space-x-2 rounded-2xl bg-[#10B981] py-3.5 text-xs font-extrabold text-white shadow-md transition-all hover:bg-emerald-600"
              >
                <span>Review Appointment</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {currentStep === 3 && (
              <button
                disabled={isPending}
                onClick={() => handleReviewConfirm(formValues)}
                className="flex min-h-[52px] w-full items-center justify-center space-x-2 rounded-2xl bg-[#10B981] py-3.5 text-xs font-extrabold text-white shadow-md transition-all hover:bg-emerald-600 disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending Verification...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>Confirm Appointment</span>
                  </>
                )}
              </button>
            )}

            {currentStep === 4 && (
              <button
                disabled={isPending || otpCode.join("").length !== 6}
                onClick={handleVerifyOtp}
                className="flex min-h-[52px] w-full items-center justify-center space-x-2 rounded-2xl bg-[#10B981] py-3.5 text-xs font-extrabold text-white shadow-md transition-all hover:bg-emerald-600 disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify & Complete Booking</span>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
