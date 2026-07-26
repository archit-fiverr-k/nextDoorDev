"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  createBookingDirectAction,
  sendBookingOtpAction,
  verifyOtpAndCompleteBookingAction,
  createAccountPostBookingAction,
} from "@/actions/booking";
import {
  Clock,
  Calendar,
  CheckCircle2,
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
  Navigation,
  Lock,
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isBefore,
  startOfDay,
} from "date-fns";
import Link from "next/link";

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
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  townCity: z.string().optional(),
  postcode: z.string().optional(),
  dob: z.string().optional(),
  emergencyContact: z.string().optional(),
  consentTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms & conditions to proceed",
  }),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function BookingWizard({
  pharmacy,
  services,
  categories = [],
  currentUser,
  initialServiceId,
  onClose,
}: BookingWizardProps) {
  const brandColor = pharmacy.brandColor || "#10B981";
  const pharmacyName = pharmacy.displayName || pharmacy.name;
  const LOCAL_STORAGE_KEY = `ndc_booking_progress_${pharmacy.slug}`;

  // Filtering & selection states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [medicalConditions, setMedicalConditions] = useState<{ [key: string]: boolean }>({
    allergies: false,
    hypertension: false,
    diabetes: false,
    none: true,
  });

  // Services selection
  const initialService = initialServiceId
    ? services.find((s) => s.id === initialServiceId) || services[0] || null
    : services[0] || null;

  const [selectedServices, setSelectedServices] = useState<Service[]>(
    initialService ? [initialService] : []
  );

  // Step state:
  // 0: Service Selection Landing
  // 1: Review Services
  // 2: Choose Date
  // 3: Choose Time Slot
  // 4: Enter Personal Details
  // 5: Review Booking Summary & Confirm
  // 7: Booking Confirmed (with Reference Code NDC-XXXXXX)
  const [step, setStep] = useState(initialServiceId ? 2 : 0);

  // Date selection states
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [datesLoading, setDatesLoading] = useState(false);

  // Time slot states
  const [slots, setSlots] = useState<{ label: string; startTime: string; isAvailable: boolean }[]>(
    []
  );
  const [selectedSlot, setSelectedSlot] = useState<{
    label: string;
    startTime: string;
    isAvailable: boolean;
  } | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Form transition & submission states
  const [isPending, startSubmitTransition] = useTransition();
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmedDetails, setConfirmedDetails] = useState<{
    referenceCode: string;
    dateLabel: string;
    timeLabel: string;
    manageToken?: string;
    manageUrl?: string;
    patientEmail?: string;
  } | null>(null);

  // Post-booking Account Creation States
  const [postBookingPassword, setPostBookingPassword] = useState("");
  const [postBookingConfirmPassword, setPostBookingConfirmPassword] = useState("");
  const [postBookingAccountCreated, setPostBookingAccountCreated] = useState(false);
  const [postBookingAccountPending, setPostBookingAccountPending] = useState(false);
  const [postBookingAccountError, setPostBookingAccountError] = useState<string | null>(null);
  const [hideAccountCard, setHideAccountCard] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: {
      firstName: currentUser?.firstName || "",
      lastName: currentUser?.lastName || "",
      mobile: currentUser?.phone || "",
      email: currentUser?.email || "",
      addressLine1: currentUser?.address || "",
      addressLine2: "",
      townCity: "",
      postcode: "",
      dob: "",
      emergencyContact: "",
      consentTerms: true,
      notes: "",
    },
  });

  // Load available dates when month changes
  useEffect(() => {
    if (selectedServices.length === 0) return;
    async function loadDates() {
      setDatesLoading(true);
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        const res = await fetch(
          `/api/booking/${pharmacy.slug}/available-dates?year=${year}&month=${month}&serviceId=${selectedServices[0].id}`
        );
        const data = await res.json();
        const loadedDates = data.availableDates || data.dates || [];
        setAvailableDates(loadedDates);
      } catch (e) {
        console.error("Failed to load available dates:", e);
      } finally {
        setDatesLoading(false);
      }
    }
    loadDates();
  }, [currentMonth, pharmacy.slug, selectedServices]);

  // Load timeslots when date changes
  useEffect(() => {
    if (!selectedDate || selectedServices.length === 0) return;
    async function loadSlots() {
      setSlotsLoading(true);
      setSlotsError(null);
      setSelectedSlot(null);
      try {
        const dateStr = format(selectedDate!, "yyyy-MM-dd");
        const serviceIds = selectedServices.map((s) => s.id).join(",");
        const res = await fetch(
          `/api/booking/${pharmacy.slug}/slots?date=${dateStr}&serviceId=${serviceIds}`
        );
        const data = await res.json();
        if (data.slots) {
          setSlots(data.slots);
        } else {
          setSlotsError("No timeslots available for this date.");
        }
      } catch (e) {
        setSlotsError("Failed to load time slots.");
      } finally {
        setSlotsLoading(false);
      }
    }
    loadSlots();
  }, [selectedDate, pharmacy.slug, selectedServices]);

  // Service toggle handler
  const handleSelectService = (service: Service) => {
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s.id === service.id);
      if (exists) {
        if (prev.length === 1) return prev;
        return prev.filter((s) => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  // Direct Booking Handler - Instant Confirmation
  const handleConfirmBookingDirect = async () => {
    const isValid = await trigger();
    if (!isValid) {
      setBookingError("Please complete all required fields correctly.");
      return;
    }

    const values = getValues();
    setBookingError(null);

    startSubmitTransition(async () => {
      try {
        const conditionsList = Object.entries(medicalConditions)
          .filter(([key, val]) => val && key !== "none")
          .map(([key]) => key.toUpperCase());

        const notesCombined = [
          conditionsList.length > 0 ? `Medical Conditions: ${conditionsList.join(", ")}` : null,
          values.dob ? `DOB: ${values.dob}` : null,
          values.emergencyContact ? `Emergency Contact: ${values.emergencyContact}` : null,
          values.notes ? `Patient Notes: ${values.notes}` : null,
        ]
          .filter(Boolean)
          .join(" | ");

        const serviceIdsParam = selectedServices.map((s) => s.id).join(",");

        const res = await createBookingDirectAction({
          pharmacyId: pharmacy.id,
          serviceId: serviceIdsParam,
          startTime: selectedSlot!.startTime,
          firstName: values.firstName,
          lastName: values.lastName,
          mobile: values.mobile,
          email: values.email,
          addressLine1: values.addressLine1 || "",
          addressLine2: values.addressLine2,
          townCity: values.townCity || "",
          postcode: values.postcode || "",
          notes: notesCombined,
        });

        if (res.success && res.referenceCode) {
          setConfirmedDetails({
            referenceCode: res.referenceCode,
            dateLabel: format(selectedDate!, "EEE d MMM yyyy"),
            timeLabel: selectedSlot!.label,
            manageToken: res.manageToken,
            manageUrl: res.manageUrl,
            patientEmail: res.patientEmail,
          });

          try {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
          } catch (e) {}

          setStep(7);
        } else {
          setBookingError(res.error || "Failed to confirm appointment. Please try again.");
        }
      } catch (err: any) {
        console.error("Booking error:", err);
        setBookingError(
          "An unexpected error occurred while confirming your booking. Please try again."
        );
      }
    });
  };

  // Post-booking account creation handler
  const handleCreatePostBookingAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostBookingAccountError(null);

    if (postBookingPassword.length < 8) {
      setPostBookingAccountError("Password must be at least 8 characters long.");
      return;
    }
    if (postBookingPassword !== postBookingConfirmPassword) {
      setPostBookingAccountError("Passwords do not match.");
      return;
    }

    setPostBookingAccountPending(true);
    try {
      const emailToUse = confirmedDetails?.patientEmail || getValues("email");
      const res = await createAccountPostBookingAction({
        email: emailToUse,
        password: postBookingPassword,
      });

      if (res.success) {
        setPostBookingAccountCreated(true);
      } else {
        setPostBookingAccountError(res.error || "Failed to create account.");
      }
    } catch (e) {
      setPostBookingAccountError("Failed to create account. Please try again.");
    } finally {
      setPostBookingAccountPending(false);
    }
  };

  // Total calculation
  const totalPrice = selectedServices.reduce((sum, s) => sum + Number(s.price), 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

  // Calendar days grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const today = startOfDay(new Date());

  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all";

  return (
    <div className="mx-auto max-w-4xl font-sans text-slate-900 antialiased">
      {/* Top Header Card */}
      <div className="shadow-xs mb-6 rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-xl font-black text-white shadow-md">
              {pharmacy.logoUrl ? (
                <img
                  src={pharmacy.logoUrl}
                  alt={pharmacyName}
                  className="h-10 w-10 object-contain"
                />
              ) : (
                pharmacyName.substring(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 sm:text-2xl">{pharmacyName}</h1>
              <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-slate-500">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span>{pharmacy.address}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start rounded-full border border-emerald-200/80 bg-emerald-50 px-3.5 py-2 text-xs font-extrabold text-emerald-700 sm:self-auto">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>GPhC Regulated Pharmacy</span>
          </div>
        </div>
      </div>

      {/* Preselected Service Context Banner */}
      {selectedServices.length > 0 && step >= 2 && step <= 5 && (
        <div className="shadow-xs mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-emerald-200/60 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800">
                  Preselected Service
                </span>
                <span className="text-xs font-extrabold text-emerald-950">
                  {selectedServices.map((s) => s.name).join(" + ")}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] font-semibold text-emerald-700">
                Consultation Fee: £{totalPrice.toFixed(2)} • Duration: {totalDuration} mins
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep(0)}
            className="cursor-pointer text-xs font-extrabold text-emerald-800 underline hover:text-emerald-950"
          >
            Change Service
          </button>
        </div>
      )}

      {/* Progress Bar (Steps 0 to 5) */}
      {step <= 5 && (
        <div className="shadow-xs mb-6 rounded-2xl border border-slate-200/80 bg-white p-4">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>
              Step {step === 0 ? "1" : step}:{" "}
              {step === 0 || step === 1
                ? "Select Services"
                : step === 2
                  ? "Choose Date"
                  : step === 3
                    ? "Choose Time"
                    : step === 4
                      ? "Patient Details"
                      : "Confirm Booking"}
            </span>
            <span className="font-extrabold text-emerald-600">
              {Math.round(((step === 0 ? 1 : step) / 5) * 100)}% Complete
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${Math.round(((step === 0 ? 1 : step) / 5) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Wizard Content Box */}
      <div className="space-y-6 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
        {/* STEP 0: SERVICE SELECTION */}
        {(step === 0 || step === 1) && (
          <div className="space-y-6 duration-300 animate-in fade-in">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                Select Healthcare Service
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Choose one or more clinical services for your consultation at {pharmacyName}.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {services.map((svc) => {
                const isSelected = selectedServices.some((s) => s.id === svc.id);
                return (
                  <div
                    key={svc.id}
                    onClick={() => handleSelectService(svc)}
                    className={`cursor-pointer rounded-2xl border p-5 transition-all ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">{svc.name}</h3>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                          {svc.description}
                        </p>
                      </div>
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="h-3.5 w-3.5 text-emerald-600" /> {svc.duration} mins
                      </span>
                      <span className="text-sm font-extrabold text-emerald-700">
                        £{Number(svc.price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-xs font-bold text-slate-600">
                Selected: {selectedServices.length} Service(s) • Total: £{totalPrice.toFixed(2)}
              </span>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={selectedServices.length === 0}
                className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-xs font-extrabold text-white shadow-md transition hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
              >
                <span>Continue to Date</span> <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CHOOSE DATE */}
        {step === 2 && (
          <div className="space-y-6 duration-300 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                  Select Appointment Date
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Choose an available consultation date.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(0)}
                className="text-xs font-bold text-emerald-600 hover:underline"
              >
                Change Service
              </button>
            </div>

            {/* Calendar Controls */}
            <div className="shadow-xs rounded-2xl border border-slate-200/90 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900">
                  {format(currentMonth, "MMMM yyyy")}
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="rounded-xl p-2 text-slate-600 hover:bg-slate-100"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="rounded-xl p-2 text-slate-600 hover:bg-slate-100"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Days Header */}
              <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              {/* Grid Days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isPast = isBefore(day, today);
                  const isAvailable =
                    !isPast &&
                    (availableDates.length > 0 ? availableDates.includes(dateStr) : true);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={!isAvailable || !isCurrentMonth}
                      onClick={() => {
                        setSelectedDate(day);
                        setStep(3);
                      }}
                      className={`flex h-11 flex-col items-center justify-center rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? "bg-emerald-600 text-white shadow-md"
                          : isAvailable
                            ? "border border-emerald-200/60 bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white"
                            : "cursor-not-allowed bg-slate-50 text-slate-300 opacity-40"
                      }`}
                    >
                      <span>{format(day, "d")}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: CHOOSE TIME SLOT */}
        {step === 3 && selectedDate && (
          <div className="space-y-6 duration-300 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                  Select Time Slot for {format(selectedDate, "EEE d MMM yyyy")}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Available slots for your consultation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs font-bold text-emerald-600 hover:underline"
              >
                Change Date
              </button>
            </div>

            {slotsLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              </div>
            ) : slotsError || slots.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
                {slotsError || "No available timeslots for this date. Please select another day."}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {slots.map((slot, idx) => {
                  const isSelected = selectedSlot?.startTime === slot.startTime;
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={!slot.isAvailable}
                      onClick={() => setSelectedSlot(slot)}
                      className={`rounded-2xl border p-3 text-xs font-bold transition-all ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-600 text-white shadow-md"
                          : slot.isAvailable
                            ? "border-slate-200 bg-white text-slate-800 hover:border-emerald-500 hover:bg-emerald-50"
                            : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 opacity-50"
                      }`}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs font-bold text-slate-500 hover:text-slate-900"
              >
                Back to Date
              </button>

              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={!selectedSlot}
                className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-xs font-extrabold text-white shadow-md transition hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
              >
                <span>Enter Personal Details</span> <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: ENTER PERSONAL DETAILS */}
        {step === 4 && (
          <form
            onSubmit={handleSubmit(() => setStep(5))}
            className="space-y-6 duration-300 animate-in fade-in"
          >
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                Enter Personal Details
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Provide your contact information for booking updates & confirmations.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register("firstName")}
                  className={inputCls}
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-rose-500">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register("lastName")}
                  className={inputCls}
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-rose-500">{errors.lastName.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  {...register("mobile")}
                  className={inputCls}
                  placeholder="+44 7700 900123"
                />
                {errors.mobile && (
                  <p className="mt-1 text-xs text-rose-500">{errors.mobile.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  {...register("email")}
                  className={inputCls}
                  placeholder="john.doe@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Date of Birth <span className="font-normal text-slate-400">(Optional)</span>
                </label>
                <input type="date" {...register("dob")} className={inputCls} />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Postcode <span className="font-normal text-slate-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  {...register("postcode")}
                  className={inputCls}
                  placeholder="LS1 6AZ"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Address Line 1 <span className="font-normal text-slate-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  {...register("addressLine1")}
                  className={inputCls}
                  placeholder="123 High Street"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-2">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  {...register("consentTerms")}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs leading-relaxed text-slate-600">
                  I confirm that the personal information provided is correct, and I agree to
                  receive appointment updates via SMS and email.
                </span>
              </label>
              {errors.consentTerms && (
                <p className="mt-1 text-xs text-rose-500">{errors.consentTerms.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-xs font-bold text-slate-500 hover:text-slate-900"
              >
                Back to Time Slot
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-xs font-extrabold text-white shadow-md transition hover:bg-emerald-500 active:scale-95"
              >
                <span>Review Booking</span> <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 5: REVIEW BOOKING & CONFIRM */}
        {step === 5 && selectedServices.length > 0 && selectedDate && selectedSlot && (
          <div className="space-y-6 duration-300 animate-in fade-in">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                Review & Confirm Booking
              </h2>
              <p className="mt-1 text-xs text-slate-500">Verify your details before confirming.</p>
            </div>

            {bookingError && (
              <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            <div className="space-y-6 rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
              {/* Summary */}
              <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
                <div>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">
                    {pharmacyName}
                  </span>
                  <h3 className="mt-2 text-lg font-black text-slate-900">
                    {selectedServices.map((s) => s.name).join(" + ")}
                  </h3>
                  <p className="text-xs text-slate-500">{pharmacy.address}</p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500">Total Fee</p>
                  <p className="text-2xl font-black text-emerald-700">£{totalPrice.toFixed(2)}</p>
                </div>
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-1 gap-4 text-xs font-semibold sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <Calendar className="h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-slate-400">Date</p>
                    <p className="font-bold text-slate-900">
                      {format(selectedDate, "EEEE, d MMMM yyyy")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <Clock className="h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-slate-400">Time</p>
                    <p className="font-bold text-slate-900">{selectedSlot.label}</p>
                  </div>
                </div>
              </div>

              {/* Patient */}
              <div className="space-y-2 text-xs">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Patient Contact Details
                </h4>
                <div className="flex flex-wrap gap-6 rounded-xl border border-slate-200 bg-white p-4 font-semibold">
                  <div>
                    <span className="block text-slate-400">Name</span>
                    <span className="font-bold text-slate-900">
                      {getValues("firstName")} {getValues("lastName")}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400">Mobile</span>
                    <span className="font-bold text-emerald-700">{getValues("mobile")}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400">Email</span>
                    <span className="font-bold text-slate-900">{getValues("email")}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900"
                >
                  Edit Details
                </button>

                <button
                  type="button"
                  onClick={handleConfirmBookingDirect}
                  disabled={isPending}
                  className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-8 py-3.5 text-xs font-extrabold text-white shadow-md transition hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Confirming Booking...
                    </>
                  ) : (
                    <>
                      Confirm Appointment <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: BOOKING CONFIRMED */}
        {step === 7 && confirmedDetails && (
          <div className="space-y-6 py-4 text-center duration-300 animate-in fade-in">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-md">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div>
              <span className="inline-block rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                Booking Reference: {confirmedDetails.referenceCode}
              </span>
              <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
                Appointment Confirmed!
              </h2>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                We have sent your booking details and instructions to{" "}
                <strong>{confirmedDetails.patientEmail}</strong>.
              </p>
            </div>

            <div className="mx-auto max-w-lg space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-left text-xs font-semibold">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-slate-500">Service</span>
                <span className="font-bold text-slate-900">
                  {selectedServices.map((s) => s.name).join(" + ")}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-slate-500">Clinic</span>
                <span className="font-bold text-slate-900">{pharmacyName}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-slate-500">Date & Time</span>
                <span className="font-bold text-emerald-700">
                  {confirmedDetails.dateLabel} at {confirmedDetails.timeLabel}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Address</span>
                <span className="text-right font-bold text-slate-900">{pharmacy.address}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {confirmedDetails.manageUrl && (
                <Link
                  href={confirmedDetails.manageUrl}
                  className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-6 py-3 text-xs font-extrabold text-white shadow-md transition hover:bg-emerald-500"
                >
                  <Navigation className="h-4 w-4" /> Manage Booking Online
                </Link>
              )}
              <Link
                href="/patient/dashboard"
                className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Go to Dashboard
              </Link>
            </div>

            {/* Optional Post-Booking Account Creation Card */}
            {!hideAccountCard && !postBookingAccountCreated && (
              <div className="shadow-xs mx-auto mt-8 max-w-lg space-y-4 rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6 text-left">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-xl bg-emerald-600 p-2 text-white">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-emerald-950">
                        Create a free account to manage your appointments
                      </h3>
                      <p className="text-[11px] font-medium text-emerald-800">
                        Set a password to link all past & future bookings.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setHideAccountCard(true)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-950"
                  >
                    Maybe Later
                  </button>
                </div>

                <form onSubmit={handleCreatePostBookingAccount} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-emerald-900">
                      Create Password
                    </label>
                    <input
                      type="password"
                      required
                      value={postBookingPassword}
                      onChange={(e) => setPostBookingPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="w-full rounded-xl border border-emerald-300 bg-white px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-emerald-900">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      required
                      value={postBookingConfirmPassword}
                      onChange={(e) => setPostBookingConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full rounded-xl border border-emerald-300 bg-white px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {postBookingAccountError && (
                    <p className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-medium text-rose-600">
                      {postBookingAccountError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={postBookingAccountPending}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-extrabold text-white shadow transition hover:bg-emerald-500"
                  >
                    {postBookingAccountPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Create Account & Save Bookings"
                    )}
                  </button>
                </form>
              </div>
            )}

            {postBookingAccountCreated && (
              <div className="mx-auto mt-6 max-w-lg rounded-2xl border border-emerald-300 bg-emerald-100 p-4 text-center text-xs font-bold text-emerald-900">
                ✓ Account created successfully! All your bookings are now linked.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
