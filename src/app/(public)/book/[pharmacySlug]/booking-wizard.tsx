"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  createBookingDirectAction,
  checkEmailAction,
  verifyAndFetchPatientAction,
} from "@/actions/booking";
import { loginAction } from "@/actions/auth";
import {
  Clock,
  Calendar as CalendarIcon,
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
  ShieldAlert,
  CalendarDays,
  Sun,
  Sunset,
  Moon,
  FileText,
  Lock,
  ShieldCheck,
  CalendarCheck,
  X,
  Search,
  LayoutGrid,
  Syringe,
  Droplets,
  Plane,
  Stethoscope,
  HeartPulse,
  Star,
  Check,
  MessageCircle,
  ExternalLink,
  Navigation,
  Info,
  CreditCard,
  Download,
  Building2,
  Award,
  ShoppingBag,
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
  parseISO,
} from "date-fns";

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

const formSchema = z
  .object({
    firstName: z.string().min(1, "Enter your first name"),
    lastName: z.string().min(1, "Enter your last name"),
    mobile: z
      .string()
      .regex(
        /^(\+44\s?7|07)\d{3}\s?\d{3}\s?\d{3}$/,
        "Enter a valid UK mobile number (e.g. 07700 900123)"
      ),
    email: z.string().email("Enter a valid email address"),
    addressLine1: z.string().min(1, "Enter your address"),
    addressLine2: z.string().optional(),
    townCity: z.string().min(1, "Enter your town or city"),
    postcode: z
      .string()
      .regex(/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i, "Enter a valid UK postcode (e.g. SW1A 1AA)"),
    dob: z.string().optional(),
    nhsNumber: z.string().optional(),
    emergencyContact: z.string().optional(),
    consentTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the Privacy Policy and Clinical Terms to proceed",
    }),
    notes: z.string().optional(),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.password && data.password.length < 6) {
        return false;
      }
      return true;
    },
    {
      message: "Password must be at least 6 characters",
      path: ["password"],
    }
  )
  .refine(
    (data) => {
      if (data.password && data.password !== data.confirmPassword) {
        return false;
      }
      return true;
    },
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

export function BookingWizard({
  pharmacy,
  services,
  categories = [],
  currentUser,
  initialServiceId,
  onClose,
}: BookingWizardProps) {
  // Pharmacy Custom Branding Token
  const brandColor = pharmacy.brandColor || "#006c4a";
  const pharmacyName = pharmacy.displayName || pharmacy.name;
  const LOCAL_STORAGE_KEY = `ndc_booking_progress_${pharmacy.slug}`;

  // Search and Category filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Medical conditions checkboxes
  const [medicalConditions, setMedicalConditions] = useState<{ [key: string]: boolean }>({
    allergies: false,
    hypertension: false,
    diabetes: false,
    none: true,
  });

  // Mobile summary drawer
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [restoredNotice, setRestoredNotice] = useState(false);

  // OTP Verification states
  const [otpSent, setOtpSent] = useState(false);
  const [otpValues, setOtpValues] = useState(["", "", "", ""]);
  const [otpVerified, setOtpVerified] = useState(false);
  const otpRef0 = useRef<HTMLInputElement>(null);
  const otpRef1 = useRef<HTMLInputElement>(null);
  const otpRef2 = useRef<HTMLInputElement>(null);
  const otpRef3 = useRef<HTMLInputElement>(null);

  // Progressive Account States
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailState, setEmailState] = useState<
    "NEW_ACCOUNT" | "EXISTING_ACCOUNT" | "LOGGED_IN" | null
  >(null);
  const [loggedInUser, setLoggedInUser] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null>(null);
  const [inputPassword, setInputPassword] = useState("");
  const [loginPending, setLoginPending] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Multi-service booking support
  const initialService = initialServiceId
    ? services.find((s) => s.id === initialServiceId) || services[0] || null
    : services[0] || null;

  const [selectedServices, setSelectedServices] = useState<Service[]>(
    initialService ? [initialService] : []
  );
  // 7-step flow: 0=Pharmacy Landing Page, 1=Review Service, 2=Choose Date, 3=Choose Time, 4=Patient Details, 5=Review Booking, 6=Inline Auth, 7=Booking Confirmed
  const [step, setStep] = useState(initialServiceId ? 2 : 0);

  // Check URL query parameters for Aid Bag checkout
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const serviceIdsParam = params.get("services");
      const scheduleParam = params.get("schedule");

      if (serviceIdsParam) {
        const ids = serviceIdsParam.split(",");
        const matched = services.filter((s) => ids.includes(s.id));
        if (matched.length > 0) {
          setSelectedServices(matched);
          if (scheduleParam === "true") {
            setStep(2);
          }
        }
      }
    }
  }, [services]);

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

  // Form submission state
  const [isPending, startSubmitTransition] = useTransition();
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmedDetails, setConfirmedDetails] = useState<{
    referenceCode: string;
    dateLabel: string;
    timeLabel: string;
  } | null>(null);

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
      nhsNumber: "",
      emergencyContact: "",
      consentTerms: true,
      notes: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Deep-linking to a specific service
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const serviceId = params.get("serviceId");
      if (serviceId) {
        const match = services.find((s) => s.id === serviceId);
        if (match) {
          setSelectedServices([match]);
          setStep(2);
        }
      }
    }
  }, [services]);

  // Auto-Save Progress to LocalStorage
  useEffect(() => {
    if (typeof window === "undefined" || step === 7) return;
    try {
      const stateToSave = {
        step,
        selectedServiceIds: selectedServices.map((s) => s.id),
        selectedDateStr: selectedDate ? selectedDate.toISOString() : null,
        selectedSlot,
        medicalConditions,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error("Auto-save failed:", e);
    }
  }, [step, selectedServices, selectedDate, selectedSlot, medicalConditions, LOCAL_STORAGE_KEY]);

  // Auto-Restore Progress on Mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.step && parsed.step > 1 && parsed.step < 7) {
          if (parsed.selectedServiceIds?.length > 0) {
            const matched = services.filter((s) => parsed.selectedServiceIds.includes(s.id));
            if (matched.length > 0) setSelectedServices(matched);
          }
          if (parsed.selectedDateStr) {
            setSelectedDate(new Date(parsed.selectedDateStr));
          }
          if (parsed.selectedSlot) {
            setSelectedSlot(parsed.selectedSlot);
          }
          if (parsed.medicalConditions) {
            setMedicalConditions(parsed.medicalConditions);
          }
          setStep(parsed.step);
          setRestoredNotice(true);
        }
      }
    } catch (e) {
      console.error("Could not restore booking progress:", e);
    }
  }, [LOCAL_STORAGE_KEY, services]);

  // Pre-fetch available dates when service changes
  useEffect(() => {
    if (selectedServices.length === 0) return;

    setDatesLoading(true);
    const serviceIdsParam = selectedServices.map((s) => s.id).join(",");
    fetch(`/api/booking/${pharmacy.slug}/available-dates?serviceId=${serviceIdsParam}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.dates) {
          setAvailableDates(data.dates);
        }
      })
      .catch((err) => console.error("Error fetching available dates", err))
      .finally(() => setDatesLoading(false));
  }, [selectedServices, pharmacy.slug]);

  // Fetch slots when selectedDate changes
  useEffect(() => {
    if (selectedServices.length === 0 || !selectedDate) return;

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    setSlotsLoading(true);
    setSlotsError(null);
    setSelectedSlot(null);

    const serviceIdsParam = selectedServices.map((s) => s.id).join(",");
    fetch(`/api/booking/${pharmacy.slug}/slots?serviceId=${serviceIdsParam}&date=${dateStr}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setSlotsError(data.error);
        } else if (data.slots) {
          setSlots(data.slots);
        }
      })
      .catch((err) => {
        console.error("Error fetching slots", err);
        setSlotsError("Could not retrieve available time slots");
      })
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, selectedServices, pharmacy.slug]);

  // Prefill details if currentUser is already logged in
  useEffect(() => {
    if (currentUser) {
      setValue("firstName", currentUser.firstName);
      setValue("lastName", currentUser.lastName);
      setValue("email", currentUser.email);
      setValue("mobile", currentUser.phone);
      if (currentUser.address) {
        const parts = currentUser.address.split(", ");
        if (parts.length >= 3) {
          setValue("addressLine1", parts[0]);
          setValue("addressLine2", parts.slice(1, parts.length - 2).join(", "));
          setValue("townCity", parts[parts.length - 2]);
          setValue("postcode", parts[parts.length - 1]);
        } else {
          setValue("addressLine1", currentUser.address);
        }
      }
      setEmailState("LOGGED_IN");
      setLoggedInUser({
        id: currentUser.id,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email,
      });
    }
  }, [currentUser, setValue]);

  const handleEmailBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const emailValue = e.target.value;
    if (!emailValue || errors.email) return;

    if (emailState === "LOGGED_IN" && loggedInUser?.email === emailValue) return;

    setEmailChecking(true);
    setEmailState(null);
    setLoginError(null);
    try {
      const res = await checkEmailAction(emailValue);
      if (res.success) {
        if (res.exists) {
          if (res.hasPassword) {
            setEmailState("EXISTING_ACCOUNT");
          } else {
            setEmailState("NEW_ACCOUNT");
          }
        } else {
          setEmailState("NEW_ACCOUNT");
        }
      }
    } catch (err) {
      console.error("Email checking failed", err);
    } finally {
      setEmailChecking(false);
    }
  };

  const handleSignIn = async () => {
    const emailValue = getValues("email");
    if (!emailValue || !inputPassword) {
      setLoginError("Please enter your account password");
      return;
    }
    setLoginError(null);
    setLoginPending(true);
    try {
      const authRes = await verifyAndFetchPatientAction(emailValue, inputPassword);
      if (authRes.success && authRes.data) {
        const p = authRes.data;
        setValue("password", inputPassword);
        setValue("confirmPassword", inputPassword);
        setValue("firstName", p.firstName);
        setValue("lastName", p.lastName);
        if (p.phone) setValue("mobile", p.phone);
        if (p.address) {
          const parts = p.address.split(", ");
          if (parts.length >= 3) {
            setValue("addressLine1", parts[0]);
            setValue("addressLine2", parts.slice(1, parts.length - 2).join(", "));
            setValue("townCity", parts[parts.length - 2]);
            setValue("postcode", parts[parts.length - 1]);
          } else {
            setValue("addressLine1", p.address);
          }
        }
        setLoggedInUser({
          id: p.id,
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
        });
        setEmailState("LOGGED_IN");

        // Attempt session login
        try {
          await loginAction({ email: emailValue, password: inputPassword });
        } catch (e) {
          console.log("Inline login notice:", e);
        }

        const finalValues = getValues();
        finalValues.password = inputPassword;
        executeFinalBooking(finalValues);
      } else {
        setLoginError(authRes.error || "Invalid password");
      }
    } catch (err) {
      setLoginError("An error occurred during sign in");
    } finally {
      setLoginPending(false);
    }
  };

  const handleCreateAccountAndBook = () => {
    const values = getValues();
    const pass = values.password;
    const confirmPass = values.confirmPassword;

    if (!pass || pass.length < 6) {
      setBookingError("Password must be at least 6 characters long");
      return;
    }

    if (pass !== confirmPass) {
      setBookingError("Passwords do not match");
      return;
    }

    setBookingError(null);
    executeFinalBooking(values);
  };

  // Initials generator
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  };

  // Toggle multiple service selections
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
    setSelectedDate(null);
    setSelectedSlot(null);
  };

  // OTP handlers
  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val[val.length - 1];
    const newValues = [...otpValues];
    newValues[index] = val;
    setOtpValues(newValues);

    if (val && index < 3) {
      if (index === 0) otpRef1.current?.focus();
      if (index === 1) otpRef2.current?.focus();
      if (index === 2) otpRef3.current?.focus();
    }

    if (newValues.every((v) => v !== "")) {
      setOtpVerified(true);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      if (index === 1) otpRef0.current?.focus();
      if (index === 2) otpRef1.current?.focus();
      if (index === 3) otpRef2.current?.focus();
    }
  };

  // Google Calendar Integration
  const handleAddToCalendar = () => {
    if (!selectedDate || !selectedSlot) return;
    const title = `Appointment at ${pharmacyName} - ${selectedServices.map((s) => s.name).join(" + ")}`;
    const description = `Appointment at ${pharmacyName}. Reference: ${confirmedDetails?.referenceCode}`;
    const location = pharmacy.address;

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
    window.open(googleCalendarUrl, "_blank");
  };

  // Google Maps Directions Integration
  const handleGetDirections = () => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      pharmacyName + " " + pharmacy.address
    )}`;
    window.open(mapsUrl, "_blank");
  };

  // Download PDF / Summary
  const handleDownloadConfirmation = () => {
    const content = `${pharmacyName.toUpperCase()} BOOKING CONFIRMATION
Reference: #${confirmedDetails?.referenceCode}
Clinic Provider: ${pharmacyName}
Address: ${pharmacy.address}
Phone: ${pharmacy.phone}
Services: ${selectedServices.map((s) => s.name).join(" + ")}
Date: ${selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : ""}
Time Slot: ${selectedSlot?.label}
Total Paid Fee: £${totalPrice.toFixed(2)}
Patient: ${getValues("firstName")} ${getValues("lastName")} (${getValues("email")})
Registered with CQC and NHS partners.`;

    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${pharmacy.slug}_booking_${confirmedDetails?.referenceCode || "Confirmation"}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Execute Final Atomic Booking
  const executeFinalBooking = (values: FormValues) => {
    if (selectedServices.length === 0 || !selectedSlot || !selectedDate) return;

    setBookingError(null);
    startSubmitTransition(async () => {
      const conditionsList = Object.entries(medicalConditions)
        .filter(([key, val]) => val && key !== "none")
        .map(([key]) => key.toUpperCase());

      const notesCombined = [
        conditionsList.length > 0 ? `Medical Conditions: ${conditionsList.join(", ")}` : null,
        values.dob ? `DOB: ${values.dob}` : null,
        values.nhsNumber ? `NHS ID: ${values.nhsNumber}` : null,
        values.emergencyContact ? `Emergency Contact: ${values.emergencyContact}` : null,
        values.notes ? `Patient Notes: ${values.notes}` : null,
      ]
        .filter(Boolean)
        .join(" | ");

      const serviceIdsParam = selectedServices.map((s) => s.id).join(",");
      const res = await createBookingDirectAction({
        pharmacyId: pharmacy.id,
        serviceId: serviceIdsParam,
        startTime: selectedSlot.startTime,
        firstName: values.firstName,
        lastName: values.lastName,
        mobile: values.mobile,
        email: values.email,
        addressLine1: values.addressLine1,
        addressLine2: values.addressLine2,
        townCity: values.townCity,
        postcode: values.postcode,
        notes: notesCombined,
        password: values.password,
      });

      if (res.success && res.referenceCode) {
        setConfirmedDetails({
          referenceCode: res.referenceCode,
          dateLabel: format(selectedDate, "EEE d MMM yyyy"),
          timeLabel: selectedSlot.label,
        });

        try {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        } catch (e) {}

        setStep(7);

        // Background session login without blocking Step 7 confirmation screen
        if (values.password) {
          loginAction({ email: values.email, password: values.password }).catch((err) => {
            console.log("Background login handled:", err);
          });
        }
      } else if (res.error === "SLOT_TAKEN") {
        setBookingError(
          "This slot was just taken by someone else. Please go back and choose another time."
        );
      } else {
        setBookingError(res.error || "Failed to confirm booking");
      }
    });
  };

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    if (step === 4) {
      setStep(5);
      return;
    }

    if (step === 5) {
      setEmailChecking(true);
      try {
        const res = await checkEmailAction(values.email);
        if (res.success) {
          if (res.exists) {
            if (res.hasPassword) setEmailState("EXISTING_ACCOUNT");
            else setEmailState("NEW_ACCOUNT");
          } else {
            setEmailState("NEW_ACCOUNT");
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setEmailChecking(false);
      }
      setStep(6);
      return;
    }

    if (step === 6) {
      executeFinalBooking(values);
    }
  };

  const isDateAvailable = (date: Date) => {
    const today = startOfDay(new Date());
    if (isBefore(date, today)) return false;
    const dateStr = format(date, "yyyy-MM-dd");
    return availableDates.includes(dateStr);
  };

  const generateMonthDays = () => {
    const startOfCurrentMonth = startOfMonth(currentMonth);
    const endOfCurrentMonth = endOfMonth(currentMonth);
    const startOfWeekGrid = startOfWeek(startOfCurrentMonth, { weekStartsOn: 1 });
    const endOfWeekGrid = endOfWeek(endOfCurrentMonth, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: startOfWeekGrid, end: endOfWeekGrid });
  };

  const handlePostcodeBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    let val = e.target.value.trim().toUpperCase();
    if (val.length > 3 && !val.includes(" ")) {
      val = val.slice(0, -3) + " " + val.slice(-3);
    }
    setValue("postcode", val);
    await trigger("postcode");
  };

  const handleMobileBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setValue("mobile", val);
    await trigger("mobile");
  };

  const handleContinueFromStep1 = () => {
    if (selectedServices.length > 0) setStep(2);
  };

  const handleContinueFromStep2 = () => {
    if (selectedDate) setStep(3);
  };

  const handleContinueFromStep3 = () => {
    if (selectedDate && selectedSlot) setStep(4);
  };

  const getSlotPeriod = (timeStr: string) => {
    const isPM = timeStr.toLowerCase().includes("pm");
    let hour = parseInt(timeStr.split(":")[0], 10);
    if (isPM && hour !== 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;

    if (hour < 12) return "Morning";
    if (hour < 17) return "Afternoon";
    return "Evening";
  };

  const groupedSlots = slots.reduce(
    (acc, slot) => {
      const period = getSlotPeriod(slot.label);
      acc[period].push(slot);
      return acc;
    },
    { Morning: [], Afternoon: [], Evening: [] } as Record<
      "Morning" | "Afternoon" | "Evening",
      typeof slots
    >
  );

  const totalGroupedSlotsCount =
    groupedSlots.Morning.length + groupedSlots.Afternoon.length + groupedSlots.Evening.length;

  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

  const filteredServices = services.filter((s) => {
    const nameLower = s.name.toLowerCase();
    const descLower = (s.description || "").toLowerCase();
    const queryLower = searchQuery.toLowerCase();

    const matchesSearch = nameLower.includes(queryLower) || descLower.includes(queryLower);
    if (!matchesSearch) return false;

    if (selectedCategory === "all") return true;
    if (selectedCategory === "vaccinations")
      return (
        nameLower.includes("vaccin") || nameLower.includes("flu") || nameLower.includes("covid")
      );
    if (selectedCategory === "blood-tests")
      return (
        nameLower.includes("blood") ||
        nameLower.includes("profile") ||
        nameLower.includes("screen") ||
        nameLower.includes("test")
      );
    if (selectedCategory === "travel")
      return (
        nameLower.includes("travel") ||
        nameLower.includes("yellow") ||
        nameLower.includes("typhoid")
      );
    if (selectedCategory === "sexual-health")
      return (
        nameLower.includes("sexual") || nameLower.includes("women") || nameLower.includes("men")
      );
    if (selectedCategory === "general") return true;

    return true;
  });

  const getServiceIcon = (name: string) => {
    const n = name.toLowerCase();
    if (
      n.includes("vaccin") ||
      n.includes("flu") ||
      n.includes("covid") ||
      n.includes("injection") ||
      n.includes("b12")
    ) {
      return <Syringe style={{ color: brandColor }} className="h-6 w-6" />;
    }
    if (
      n.includes("blood") ||
      n.includes("profile") ||
      n.includes("screen") ||
      n.includes("test")
    ) {
      return <Droplets style={{ color: brandColor }} className="h-6 w-6" />;
    }
    if (n.includes("travel") || n.includes("flight") || n.includes("malaria")) {
      return <Plane style={{ color: brandColor }} className="h-6 w-6" />;
    }
    if (n.includes("sexual") || n.includes("women") || n.includes("men")) {
      return <Stethoscope style={{ color: brandColor }} className="h-6 w-6" />;
    }
    return <HeartPulse style={{ color: brandColor }} className="h-6 w-6" />;
  };

  if (services.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9ff] p-6">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-700">
            This pharmacy hasn&apos;t set up any services yet. Please call us on{" "}
            <span className="font-bold text-slate-900">{pharmacy.phone}</span> to book.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-[#F4F7FB] font-sans text-[#0b1c30] antialiased">
      {/* Auto-restore Notification Toast */}
      {restoredNotice && (
        <div
          style={{ backgroundColor: brandColor }}
          className="z-50 flex items-center justify-between px-4 py-2.5 text-xs text-white"
        >
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-white" />
            <span>
              Your previous booking progress with {pharmacyName} was automatically restored.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setRestoredNotice(false)}
            className="text-slate-200 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 1. Dynamic Pharmacy Header Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/95 py-3.5 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 md:px-10">
          {/* Pharmacy Branding & Logo */}
          <div className="flex items-center gap-4">
            {pharmacy.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={pharmacy.logoUrl}
                alt={pharmacyName}
                className="h-10 max-w-[160px] object-contain"
              />
            ) : (
              <div
                style={{ backgroundColor: brandColor }}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black text-white shadow-sm"
              >
                {getInitials(pharmacyName)}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-[#000e35]">
                  {pharmacyName}
                </h1>
                <span
                  style={{ backgroundColor: `${brandColor}20`, color: brandColor }}
                  className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest"
                >
                  Verified Clinic
                </span>
              </div>
              <p className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                <MapPin className="h-3 w-3 text-slate-400" />
                <span className="max-w-xs truncate">{pharmacy.address}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-600 sm:flex">
              <Phone className="h-3.5 w-3.5" style={{ color: brandColor }} />
              <span>{pharmacy.phone}</span>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                type="button"
                className="cursor-pointer rounded-xl border border-slate-200 p-2 text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900"
                title="Close Booking Window"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Container */}
      <main className="mx-auto w-full max-w-7xl flex-grow px-5 py-8 md:px-10">
        {/* Progress Stepper Header (Steps 1 to 6 only) */}
        {step > 0 && step < 7 && (
          <div className="mx-auto mb-8 max-w-4xl space-y-3">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-600">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(step === 1 ? 0 : step - 1)}
                  className="flex items-center gap-1 text-xs font-bold text-slate-500 transition-colors hover:text-slate-900"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>{step === 1 ? "Overview" : "Back"}</span>
                </button>
                <span style={{ color: brandColor }}>STEP {step} OF 6</span>
              </div>
              <span>
                {step === 1 && "Select Service"}
                {step === 2 && "Choose Date"}
                {step === 3 && "Choose Time"}
                {step === 4 && "Patient Details"}
                {step === 5 && "Review Booking"}
                {step === 6 && "Inline Authentication"}
              </span>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                style={{ backgroundColor: brandColor, width: `${(step / 6) * 100}%` }}
                className="h-full transition-all duration-300"
              />
            </div>

            <div className="flex items-center justify-between pt-1 text-xs font-bold">
              {[
                { s: 1, label: "Service" },
                { s: 2, label: "Date" },
                { s: 3, label: "Time" },
                { s: 4, label: "Details" },
                { s: 5, label: "Review" },
                { s: 6, label: "Auth" },
              ].map(({ s, label }) => (
                <button
                  key={s}
                  disabled={s > step}
                  onClick={() => s <= step && setStep(s)}
                  className={`flex items-center space-x-1 transition-all ${
                    s === step
                      ? "font-black"
                      : s < step
                        ? "cursor-pointer hover:underline"
                        : "pointer-events-none text-slate-300"
                  }`}
                  style={{ color: s <= step ? brandColor : undefined }}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${
                      s === step || s < step
                        ? "text-white"
                        : "border border-slate-200 bg-white text-slate-400"
                    }`}
                    style={{ backgroundColor: s <= step ? brandColor : undefined }}
                  >
                    {s < step ? "✓" : s}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 0: PHARMACY EDITORIAL LANDING PAGE VIEW */}
        {step === 0 && (
          <div className="w-full space-y-16 pb-20">
            {/* 1. HERO LANDING BANNER */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm dark:bg-zinc-950 sm:p-12">
              <div className="grid items-center gap-10 lg:grid-cols-12">
                {/* Left Column: Pharmacy Headline & Details */}
                <div className="space-y-6 lg:col-span-7">
                  <div className="inline-flex items-center gap-2 rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 px-3 py-1.5 text-xs font-bold text-[#10B981]">
                    <ShieldCheck className="h-4 w-4" />
                    <span>GPhC Registered Premises & NHS Partner</span>
                  </div>

                  <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight text-[#0F172A] dark:text-white sm:text-5xl">
                    {pharmacyName}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-[#10B981]" />
                      {pharmacy.address}
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1 font-bold text-amber-500">
                      <Star className="h-4 w-4 fill-current" />
                      4.9 ★ (142 reviews)
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <Phone className="h-3.5 w-3.5 text-[#10B981]" />
                      {pharmacy.phone}
                    </span>
                  </div>

                  <p className="max-w-xl text-sm font-normal leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
                    {pharmacy.welcomeMessage ||
                      pharmacy.description ||
                      `Welcome to ${pharmacyName}. We provide face-to-face clinical advice, vaccinations, NHS Pharmacy First treatments, and private consultations directly on your local high street.`}
                  </p>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      style={{ backgroundColor: brandColor }}
                      className="flex items-center gap-2 rounded-xl px-6 py-3.5 text-xs font-bold text-white shadow-md transition-all hover:opacity-95"
                    >
                      <CalendarIcon className="h-4 w-4" />
                      <span>Book an Appointment</span>
                    </button>
                    <a
                      href="#services-section"
                      className="rounded-xl bg-slate-100 px-6 py-3.5 text-xs font-bold text-[#0F172A] transition-all hover:bg-slate-200 dark:bg-zinc-800 dark:text-white"
                    >
                      Browse Treatments ({services.length})
                    </a>
                  </div>
                </div>

                {/* Right Column: High Definition Photography Frame */}
                <div className="relative lg:col-span-5">
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-900 shadow-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/pharmacy_consultation.png"
                      alt={pharmacyName}
                      className="h-[340px] w-full object-cover object-center sm:h-[380px]"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0F172A]/85 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl border border-slate-200/60 bg-white/95 p-3.5 shadow-sm backdrop-blur-md">
                      <div>
                        <p className="text-xs font-bold text-[#0F172A]">{pharmacyName}</p>
                        <p className="text-[11px] font-medium text-slate-500">
                          Private Consultation Suite
                        </p>
                      </div>
                      <span className="rounded-lg bg-[#10B981]/10 px-2.5 py-1 text-xs font-bold text-[#10B981]">
                        Slots Available
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. CATEGORY & SERVICES SHOWCASE (With Admin Category Images) */}
            <section id="services-section" className="space-y-8">
              <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#10B981]">
                    Clinical Services Directory
                  </span>
                  <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#0F172A] dark:text-white sm:text-3xl">
                    Book Treatments & Consultations
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{ color: brandColor }}
                  className="flex items-center gap-1 text-xs font-bold hover:underline"
                >
                  <span>Launch Interactive Scheduler</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Render Categories Visual Cards Grid */}
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {(categories.length > 0
                  ? categories
                  : [
                      {
                        id: "cat-1",
                        name: "Vaccinations",
                        slug: "vaccinations",
                        description: "Seasonal flu jabs, travel immunisations, and boosters.",
                        imageUrl: "/assets/vaccination_care.png",
                      },
                      {
                        id: "cat-2",
                        name: "Travel Health",
                        slug: "travel-health",
                        description: "Yellow Fever, Typhoid, Malaria prophylaxis & travel advice.",
                        imageUrl: "/assets/pharmacy_consultation.png",
                      },
                      {
                        id: "cat-3",
                        name: "Ear Wax Removal",
                        slug: "ear-wax-removal",
                        description: "Safe microsuction cleaning by qualified clinicians.",
                        imageUrl: "/assets/pharmacy_consultation.png",
                      },
                      {
                        id: "cat-4",
                        name: "Blood Diagnostics",
                        slug: "blood-diagnostics",
                        description: "Comprehensive biomarker screenings & health checks.",
                        imageUrl: "/assets/vaccination_care.png",
                      },
                      {
                        id: "cat-5",
                        name: "General Consultations",
                        slug: "general-consultations",
                        description:
                          "Face-to-face consultation for minor ailments & prescriptions.",
                        imageUrl: "/assets/pharmacy_consultation.png",
                      },
                    ]
                ).map((cat, idx) => {
                  const catServices = services.filter(
                    (s) => (s.category || "General").toLowerCase() === cat.name.toLowerCase()
                  );
                  const activeServices =
                    catServices.length > 0 ? catServices : services.slice(0, 3);
                  const categoryVisual =
                    cat.imageUrl ||
                    (idx % 2 === 0
                      ? "/assets/vaccination_care.png"
                      : "/assets/pharmacy_consultation.png");

                  return (
                    <div
                      key={cat.id || idx}
                      className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <div>
                        {/* Category Banner Image (Admin uploaded or fallback visual) */}
                        <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={categoryVisual}
                            alt={cat.name}
                            className="h-full w-full object-cover object-center transition-transform duration-500 hover:scale-105"
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0F172A]/70 via-transparent to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3 text-white">
                            <span className="rounded bg-white/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                              Category
                            </span>
                            <h3 className="mt-1 text-lg font-bold text-white">{cat.name}</h3>
                          </div>
                        </div>

                        {/* Category Services List */}
                        <div className="space-y-3 p-5">
                          <p className="line-clamp-2 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                            {cat.description ||
                              `Professional clinical care and consultations for ${cat.name.toLowerCase()}.`}
                          </p>

                          <div className="space-y-2 border-t border-slate-100 pt-2 dark:border-zinc-800">
                            {activeServices.map((svc) => (
                              <div
                                key={svc.id}
                                className="group flex items-center justify-between gap-2 rounded-xl border border-slate-100 p-2.5 transition-all hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60"
                              >
                                <div className="min-w-0 flex-1">
                                  <h4 className="truncate text-xs font-bold text-[#0F172A] transition-colors group-hover:text-[#10B981] dark:text-white">
                                    {svc.name}
                                  </h4>
                                  <span className="text-[10px] font-semibold text-slate-400">
                                    {svc.duration} mins &bull; £{svc.price.toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex shrink-0 items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedServices([svc]);
                                      setStep(2);
                                    }}
                                    style={{ backgroundColor: brandColor }}
                                    className="rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-white transition-all"
                                  >
                                    Book &rarr;
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="p-5 pt-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (activeServices[0]) setSelectedServices([activeServices[0]]);
                            setStep(2);
                          }}
                          style={{ backgroundColor: brandColor }}
                          className="shadow-xs w-full rounded-xl py-2.5 text-center text-xs font-bold text-white transition-all hover:opacity-95"
                        >
                          Book Category Treatments
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 3. PHARMACY FACILITIES & OPERATING HOURS */}
            <section className="grid items-start gap-8 lg:grid-cols-12">
              {/* Operating Hours Table */}
              <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-8 dark:bg-zinc-900 lg:col-span-7">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-[#10B981]" />
                  <h3 className="text-base font-extrabold text-[#0F172A] dark:text-white">
                    Pharmacy Opening Schedule
                  </h3>
                </div>
                <div className="divide-y divide-slate-100 text-xs font-medium dark:divide-zinc-800">
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-slate-600 dark:text-slate-300">
                      Monday &ndash; Friday
                    </span>
                    <span className="font-bold text-[#0F172A] dark:text-white">
                      08:30 &ndash; 18:30
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-slate-600 dark:text-slate-300">Saturday</span>
                    <span className="font-bold text-[#0F172A] dark:text-white">
                      09:00 &ndash; 17:00
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-slate-600 dark:text-slate-300">
                      Sunday & Bank Holidays
                    </span>
                    <span className="font-bold text-rose-500">Closed</span>
                  </div>
                </div>
              </div>

              {/* Location Directions */}
              <div className="space-y-4 rounded-2xl bg-slate-900 p-8 text-white shadow-md lg:col-span-5">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#10B981]" />
                  <h3 className="text-base font-extrabold text-white">
                    High Street Clinic Location
                  </h3>
                </div>
                <p className="text-xs font-normal leading-relaxed text-slate-300">
                  {pharmacy.address}
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleGetDirections}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#10B981] py-2.5 text-xs font-bold text-white transition-all hover:bg-[#0e9f6e]"
                  >
                    <Navigation className="h-4 w-4" />
                    <span>Get Maps Directions</span>
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* STEP 1: REVIEW & SELECT SERVICE */}
        {step === 1 && (
          <div className="mx-auto flex w-full max-w-7xl gap-10">
            {/* Left Sidebar: Service Categories */}
            <aside className="sticky top-28 hidden w-64 shrink-0 flex-col gap-6 self-start lg:flex">
              <div className="flex flex-col gap-2">
                <h3 className="mb-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Service Categories
                </h3>

                <button
                  onClick={() => setSelectedCategory("all")}
                  style={
                    selectedCategory === "all"
                      ? { backgroundColor: brandColor, color: "white" }
                      : {}
                  }
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition-all ${
                    selectedCategory === "all"
                      ? "shadow-lg"
                      : "border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-200/50"
                  }`}
                >
                  <LayoutGrid className="h-5 w-5" />
                  <span>All Services</span>
                </button>

                <button
                  onClick={() => setSelectedCategory("vaccinations")}
                  style={
                    selectedCategory === "vaccinations"
                      ? { backgroundColor: brandColor, color: "white" }
                      : {}
                  }
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition-all ${
                    selectedCategory === "vaccinations"
                      ? "shadow-lg"
                      : "border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-200/50"
                  }`}
                >
                  <Syringe className="h-5 w-5" />
                  <span>Vaccinations</span>
                </button>

                <button
                  onClick={() => setSelectedCategory("blood-tests")}
                  style={
                    selectedCategory === "blood-tests"
                      ? { backgroundColor: brandColor, color: "white" }
                      : {}
                  }
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition-all ${
                    selectedCategory === "blood-tests"
                      ? "shadow-lg"
                      : "border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-200/50"
                  }`}
                >
                  <Droplets className="h-5 w-5" />
                  <span>Blood Tests</span>
                </button>

                <button
                  onClick={() => setSelectedCategory("travel")}
                  style={
                    selectedCategory === "travel"
                      ? { backgroundColor: brandColor, color: "white" }
                      : {}
                  }
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition-all ${
                    selectedCategory === "travel"
                      ? "shadow-lg"
                      : "border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-200/50"
                  }`}
                >
                  <Plane className="h-5 w-5" />
                  <span>Travel Health</span>
                </button>

                <button
                  onClick={() => setSelectedCategory("sexual-health")}
                  style={
                    selectedCategory === "sexual-health"
                      ? { backgroundColor: brandColor, color: "white" }
                      : {}
                  }
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition-all ${
                    selectedCategory === "sexual-health"
                      ? "shadow-lg"
                      : "border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-200/50"
                  }`}
                >
                  <Stethoscope className="h-5 w-5" />
                  <span>Sexual Health</span>
                </button>

                <button
                  onClick={() => setSelectedCategory("general")}
                  style={
                    selectedCategory === "general"
                      ? { backgroundColor: brandColor, color: "white" }
                      : {}
                  }
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition-all ${
                    selectedCategory === "general"
                      ? "shadow-lg"
                      : "border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-200/50"
                  }`}
                >
                  <HeartPulse className="h-5 w-5" />
                  <span>General Consult</span>
                </button>
              </div>

              {/* Need Help Widget */}
              <div
                style={{ backgroundColor: `${brandColor}10`, borderColor: `${brandColor}20` }}
                className="mt-6 space-y-3 rounded-2xl border p-6"
              >
                <h4 className="text-sm font-extrabold text-[#000e35]">Pharmacy Support</h4>
                <p className="text-xs font-medium leading-relaxed text-slate-600">
                  Questions about our services at {pharmacyName}? Speak to our team.
                </p>
                <button
                  type="button"
                  onClick={() => window.open(`tel:${pharmacy.phone}`)}
                  style={{ color: brandColor, borderColor: brandColor }}
                  className="flex w-full items-center justify-center space-x-2 rounded-xl border bg-white py-2.5 text-xs font-bold transition-all hover:opacity-90"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Call {pharmacyName}</span>
                </button>
              </div>
            </aside>

            {/* Main Content Area */}
            <div className="min-w-0 flex-grow space-y-8 duration-300 animate-in fade-in">
              <div>
                <h1 className="mb-1 text-2xl font-extrabold tracking-tight text-[#0a2259] sm:text-3xl">
                  Select your service at {pharmacyName}
                </h1>
                <p className="text-sm font-medium text-slate-600">
                  Select one or more services to combine into a single appointment visit.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  <Search className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search services at ${pharmacyName}...`}
                  className="block w-full rounded-2xl border border-slate-200/90 bg-white py-4 pl-12 pr-4 text-sm font-semibold shadow-sm transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2"
                />
              </div>

              {/* Bento Grid */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {filteredServices.map((service, index) => {
                  const isSelected = selectedServices.some((s) => s.id === service.id);
                  const isFeatured = index === 0 && filteredServices.length > 2;

                  if (isFeatured) {
                    return (
                      <div
                        key={service.id}
                        onClick={() => handleSelectService(service)}
                        style={isSelected ? { borderColor: brandColor } : {}}
                        className={`relative flex cursor-pointer flex-col items-center gap-6 overflow-hidden rounded-2xl border bg-gradient-to-br from-white to-[#eff4ff] p-6 transition-all duration-200 sm:p-8 md:col-span-2 md:flex-row ${
                          isSelected
                            ? "shadow-md ring-2"
                            : "border-slate-200/80 shadow-sm hover:border-slate-300"
                        }`}
                      >
                        <div className="flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 md:aspect-square md:w-1/3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80"
                            alt={service.name}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="flex-grow space-y-3">
                          <div className="flex items-center justify-between">
                            <span
                              style={{ backgroundColor: `${brandColor}20`, color: brandColor }}
                              className="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest"
                            >
                              Featured Treatment
                            </span>
                            {isSelected && (
                              <span
                                style={{ backgroundColor: `${brandColor}30`, color: brandColor }}
                                className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold"
                              >
                                <CheckCircle2 className="h-4 w-4" /> Selected
                              </span>
                            )}
                          </div>

                          <h3 className="text-xl font-bold text-[#0a2259]">{service.name}</h3>
                          <p className="text-xs font-medium leading-relaxed text-slate-600">
                            {service.description ||
                              "Comprehensive clinical consultation and treatment review."}
                          </p>

                          <div className="flex flex-wrap gap-2 pt-1">
                            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600">
                              Duration: {service.duration} mins
                            </span>
                            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600">
                              Official Clinical Service
                            </span>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-200/60 pt-3">
                            <div className="text-xl font-black text-[#000e35]">
                              £{service.price.toFixed(2)}
                            </div>
                            <button
                              type="button"
                              style={{ backgroundColor: isSelected ? brandColor : "#000e35" }}
                              className="rounded-xl px-6 py-2.5 text-xs font-bold text-white transition-all hover:opacity-90"
                            >
                              {isSelected ? "Selected ✓" : "Select Service"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={service.id}
                      onClick={() => handleSelectService(service)}
                      style={isSelected ? { borderColor: brandColor } : {}}
                      className={`group relative flex cursor-pointer flex-col justify-between rounded-2xl border bg-white/90 p-6 backdrop-blur-sm transition-all duration-200 ${
                        isSelected
                          ? "shadow-md ring-2"
                          : "border-slate-200/80 shadow-sm hover:border-slate-300"
                      }`}
                    >
                      {index === 1 && (
                        <div
                          style={{ backgroundColor: `${brandColor}20`, color: brandColor }}
                          className="absolute right-4 top-4 flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-extrabold shadow-sm"
                        >
                          <Star className="h-3 w-3 fill-current" /> Most Popular
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 transition-colors">
                          {getServiceIcon(service.name)}
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-[#0a2259]">{service.name}</h3>
                          <p className="mt-1 line-clamp-2 text-xs font-medium leading-normal text-slate-600">
                            {service.description ||
                              "Standard clinical service with professional consultation."}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                        <div>
                          <span className="text-lg font-black text-[#000e35]">
                            £{service.price.toFixed(2)}
                          </span>
                          <span className="ml-1.5 text-[10px] font-bold text-slate-400">
                            ({service.duration}m)
                          </span>
                        </div>

                        <button
                          type="button"
                          style={{ backgroundColor: isSelected ? brandColor : "#000e35" }}
                          className="rounded-xl px-5 py-2 text-xs font-bold text-white transition-all hover:opacity-90"
                        >
                          {isSelected ? "Selected ✓" : "Select"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Action Bar */}
              <div className="flex items-center justify-between border-t border-slate-200 pt-6">
                <div className="text-xs font-semibold text-slate-600">
                  <span className="font-bold text-[#000e35]">{selectedServices.length}</span>{" "}
                  service{selectedServices.length !== 1 ? "s" : ""} selected • Total:{" "}
                  <span style={{ color: brandColor }} className="font-extrabold">
                    £{totalPrice.toFixed(2)}
                  </span>
                </div>

                <button
                  disabled={selectedServices.length === 0}
                  onClick={handleContinueFromStep1}
                  style={{ backgroundColor: brandColor }}
                  className="flex items-center space-x-2 rounded-xl px-8 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:opacity-95 disabled:pointer-events-none disabled:opacity-30"
                >
                  <span>Continue to Date</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CHOOSE DATE & TIME SLOT (UNIFIED) */}
        {step === 2 && selectedServices.length > 0 && (
          <div className="mx-auto max-w-5xl space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm duration-300 animate-in fade-in-50 sm:p-8">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-extrabold text-[#000e35]">Select Date & Time Slot</h2>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                Choose an available date on the calendar, then pick your preferred time slot at{" "}
                {pharmacyName}.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              {/* LEFT COLUMN: CALENDAR DATE PICKER */}
              <div className="space-y-4 lg:col-span-5">
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                  <button
                    type="button"
                    onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
                    disabled={startOfMonth(currentMonth) <= startOfMonth(new Date())}
                    className="rounded-full p-1.5 transition-colors hover:bg-slate-200/70 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4 text-[#000e35]" />
                  </button>
                  <span className="text-xs font-extrabold capitalize text-slate-800">
                    {format(currentMonth, "MMMM yyyy")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                    className="rounded-full p-1.5 transition-colors hover:bg-slate-200/70"
                  >
                    <ChevronRight className="h-4 w-4 text-[#000e35]" />
                  </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 text-center text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  <span>MON</span>
                  <span>TUE</span>
                  <span>WED</span>
                  <span>THU</span>
                  <span>FRI</span>
                  <span>SAT</span>
                  <span>SUN</span>
                </div>

                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {generateMonthDays().map((day, idx) => {
                    const inMonth = isSameMonth(day, currentMonth);
                    const available = isDateAvailable(day);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isPast = isBefore(day, startOfDay(new Date()));

                    return (
                      <div key={idx} className="flex items-center justify-center">
                        {available ? (
                          <button
                            onClick={() => {
                              setSelectedDate(day);
                              setSelectedSlot(null);
                            }}
                            type="button"
                            style={isSelected ? { backgroundColor: brandColor } : {}}
                            className={`w-full cursor-pointer rounded-lg py-2.5 text-center text-xs transition-all ${
                              !inMonth ? "text-slate-350" : ""
                            } ${
                              isSelected
                                ? "font-bold text-white shadow-md"
                                : "border border-slate-200 bg-white font-semibold text-slate-800 hover:bg-slate-100"
                            }`}
                          >
                            {format(day, "d")}
                          </button>
                        ) : (
                          <div
                            className={`w-full select-none py-2.5 text-center text-xs font-normal text-slate-300 ${
                              !inMonth || isPast ? "opacity-30" : ""
                            }`}
                          >
                            {format(day, "d")}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT COLUMN: TIME SLOTS FOR SELECTED DATE */}
              <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50/50 p-5 lg:col-span-7">
                {!selectedDate ? (
                  <div className="flex h-full min-h-[260px] flex-col items-center justify-center space-y-3 p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <CalendarIcon className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-600">
                      Select a date on the calendar to view available time slots.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                      <h3 className="text-xs font-black uppercase tracking-wider text-[#000e35]">
                        Available Slots for {format(selectedDate, "EEE, MMM d, yyyy")}
                      </h3>
                      {selectedSlot && (
                        <span className="text-[11px] font-bold text-emerald-600">
                          Selected: {selectedSlot.label}
                        </span>
                      )}
                    </div>

                    <div className="max-h-80 space-y-4 overflow-y-auto pr-1">
                      {slotsLoading ? (
                        <div className="flex h-36 items-center justify-center space-x-2 text-slate-400">
                          <Loader2 className="h-5 w-5 animate-spin text-[#006c4a]" />
                          <span className="text-xs font-bold">Checking slot availability...</span>
                        </div>
                      ) : slotsError ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-600">
                          {slotsError}
                        </div>
                      ) : totalGroupedSlotsCount === 0 ? (
                        <div className="py-10 text-center text-xs font-bold text-slate-400">
                          No available slots on this date. Please choose another date.
                        </div>
                      ) : (
                        (["Morning", "Afternoon", "Evening"] as const).map((period) => {
                          const periodSlots = groupedSlots[period];
                          if (periodSlots.length === 0) return null;
                          return (
                            <div key={period} className="space-y-2">
                              <div className="flex items-center gap-1.5 text-slate-400">
                                {period === "Morning" && <Sun className="h-3.5 w-3.5" />}
                                {period === "Afternoon" && (
                                  <Sun className="h-3.5 w-3.5 text-amber-500" />
                                )}
                                {period === "Evening" && <Moon className="h-3.5 w-3.5" />}
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                                  {period}
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-2">
                                {periodSlots.map((slot) => {
                                  const isSelected = selectedSlot?.startTime === slot.startTime;
                                  return slot.isAvailable ? (
                                    <button
                                      key={slot.startTime}
                                      onClick={() => setSelectedSlot(slot)}
                                      type="button"
                                      style={
                                        isSelected
                                          ? { backgroundColor: brandColor, borderColor: brandColor }
                                          : {}
                                      }
                                      className={`cursor-pointer rounded-xl border px-2 py-2.5 text-xs font-bold transition-all ${
                                        isSelected
                                          ? "text-white shadow-md"
                                          : "border-slate-200 bg-white text-slate-800 hover:border-slate-400"
                                      }`}
                                    >
                                      {slot.label}
                                    </button>
                                  ) : (
                                    <div
                                      key={slot.startTime}
                                      className="select-none rounded-xl border border-slate-100 bg-slate-100/60 px-2 py-2.5 text-center text-xs font-bold text-slate-300"
                                    >
                                      {slot.label}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step Navigation Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-[#000e35]"
              >
                <ChevronLeft className="h-4 w-4" /> Back to Services
              </button>

              <button
                disabled={!selectedDate || !selectedSlot}
                onClick={() => setStep(4)}
                style={{ backgroundColor: brandColor }}
                className="flex items-center gap-2 rounded-xl px-8 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:opacity-95 disabled:opacity-30"
              >
                <span>Continue to Patient Details</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: PATIENT DETAILS */}
        {step === 4 && selectedServices.length > 0 && selectedDate && selectedSlot && (
          <div className="mx-auto max-w-2xl space-y-8 duration-300 animate-in fade-in-50">
            <div className="mb-4 space-y-2 text-center">
              <h1 className="text-2xl font-extrabold text-[#0b1c30] sm:text-3xl">
                Complete Patient Record
              </h1>
              <p className="text-xs font-medium text-slate-600 sm:text-sm">
                Verify your details to ensure fast-track check-in at {pharmacyName}.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Personal Information */}
              <section className="space-y-6 rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <User className="h-5 w-5" style={{ color: brandColor }} />
                  <h2 className="text-base font-extrabold text-[#000e35]">
                    01. Personal Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">First Name *</label>
                    <input
                      type="text"
                      {...register("firstName")}
                      disabled={isPending}
                      placeholder="e.g. James"
                      className="h-11 w-full rounded-lg border border-slate-200 bg-[#F8FAFC] px-3.5 text-sm font-semibold transition-all focus:border-[#000e35] focus:bg-white focus:outline-none"
                    />
                    {errors.firstName && (
                      <p className="mt-0.5 text-xs font-bold text-rose-600">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Last Name *</label>
                    <input
                      type="text"
                      {...register("lastName")}
                      disabled={isPending}
                      placeholder="e.g. Wilson"
                      className="h-11 w-full rounded-lg border border-slate-200 bg-[#F8FAFC] px-3.5 text-sm font-semibold transition-all focus:border-[#000e35] focus:bg-white focus:outline-none"
                    />
                    {errors.lastName && (
                      <p className="mt-0.5 text-xs font-bold text-rose-600">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Date of Birth</label>
                    <input
                      type="date"
                      {...register("dob")}
                      disabled={isPending}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-[#F8FAFC] px-3.5 text-sm font-semibold transition-all focus:border-[#000e35] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      NHS Number (Optional)
                    </label>
                    <input
                      type="text"
                      {...register("nhsNumber")}
                      disabled={isPending}
                      placeholder="10-digit NHS ID"
                      className="h-11 w-full rounded-lg border border-slate-200 bg-[#F8FAFC] px-3.5 text-sm font-semibold transition-all focus:border-[#000e35] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* Contact Information & OTP */}
              <section className="space-y-6 rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <ShieldCheck className="h-5 w-5" style={{ color: brandColor }} />
                  <h2 className="text-base font-extrabold text-[#000e35]">
                    02. Contact & Verification
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700">
                        Mobile Number *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          {...register("mobile", { onBlur: handleMobileBlur })}
                          disabled={isPending}
                          placeholder="e.g. 07700 900123"
                          className="h-11 flex-grow rounded-lg border border-slate-200 bg-[#F8FAFC] px-3.5 text-sm font-semibold transition-all focus:border-[#000e35] focus:bg-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setOtpSent(true)}
                          className="min-w-[100px] shrink-0 rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-[#000e35] transition-colors hover:bg-slate-200"
                        >
                          {otpSent ? "Resend Code" : "Send Code"}
                        </button>
                      </div>
                      {errors.mobile && (
                        <p className="mt-0.5 text-xs font-bold text-rose-600">
                          {errors.mobile.message}
                        </p>
                      )}
                    </div>

                    {/* Integrated OTP Verification Box */}
                    {otpSent && (
                      <div className="rounded-xl border border-slate-200 bg-[#eff4ff] p-5 duration-200 animate-in fade-in sm:col-span-2">
                        <div className="flex flex-col items-center gap-3 text-center">
                          <span className="text-xs font-semibold text-slate-700">
                            Enter the 4-digit verification code sent to your mobile
                          </span>

                          <div className="my-1 flex gap-3">
                            <input
                              ref={otpRef0}
                              type="text"
                              maxLength={1}
                              value={otpValues[0]}
                              onChange={(e) => handleOtpChange(0, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(0, e)}
                              className="h-14 w-12 rounded-xl border-2 border-slate-300 bg-white text-center text-xl font-bold transition-all focus:border-[#000e35] focus:outline-none"
                            />
                            <input
                              ref={otpRef1}
                              type="text"
                              maxLength={1}
                              value={otpValues[1]}
                              onChange={(e) => handleOtpChange(1, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(1, e)}
                              className="h-14 w-12 rounded-xl border-2 border-slate-300 bg-white text-center text-xl font-bold transition-all focus:border-[#000e35] focus:outline-none"
                            />
                            <input
                              ref={otpRef2}
                              type="text"
                              maxLength={1}
                              value={otpValues[2]}
                              onChange={(e) => handleOtpChange(2, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(2, e)}
                              className="h-14 w-12 rounded-xl border-2 border-slate-300 bg-white text-center text-xl font-bold transition-all focus:border-[#000e35] focus:outline-none"
                            />
                            <input
                              ref={otpRef3}
                              type="text"
                              maxLength={1}
                              value={otpValues[3]}
                              onChange={(e) => handleOtpChange(3, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(3, e)}
                              className="h-14 w-12 rounded-xl border-2 border-slate-300 bg-white text-center text-xl font-bold transition-all focus:border-[#000e35] focus:outline-none"
                            />
                          </div>

                          {otpVerified ? (
                            <div
                              style={{ color: brandColor }}
                              className="flex items-center gap-1.5 text-xs font-bold"
                            >
                              <CheckCircle2 className="h-4 w-4" /> Code Verified
                            </div>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-500">
                              Resend code in <strong className="text-[#000e35]">00:54</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1 sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        {...register("email", { onBlur: handleEmailBlur })}
                        disabled={isPending}
                        placeholder="e.g. james.wilson@example.co.uk"
                        className="h-11 w-full rounded-lg border border-slate-200 bg-[#F8FAFC] px-3.5 text-sm font-semibold transition-all focus:border-[#000e35] focus:bg-white focus:outline-none"
                      />
                      {errors.email && (
                        <p className="mt-0.5 text-xs font-bold text-rose-600">
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Medical Summary */}
              <section className="space-y-6 rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <FileText className="h-5 w-5" style={{ color: brandColor }} />
                  <h2 className="text-base font-extrabold text-[#000e35]">03. Medical Summary</h2>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-semibold text-slate-600">
                    Do you have any of the following? (Select all that apply)
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={medicalConditions.allergies}
                        onChange={(e) =>
                          setMedicalConditions({
                            ...medicalConditions,
                            allergies: e.target.checked,
                            none: false,
                          })
                        }
                        className="h-5 w-5 rounded border-slate-300 text-[#000e35] focus:ring-[#000e35]"
                      />
                      <span className="text-xs font-bold text-slate-800">Allergies</span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={medicalConditions.hypertension}
                        onChange={(e) =>
                          setMedicalConditions({
                            ...medicalConditions,
                            hypertension: e.target.checked,
                            none: false,
                          })
                        }
                        className="h-5 w-5 rounded border-slate-300 text-[#000e35] focus:ring-[#000e35]"
                      />
                      <span className="text-xs font-bold text-slate-800">Hypertension</span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={medicalConditions.diabetes}
                        onChange={(e) =>
                          setMedicalConditions({
                            ...medicalConditions,
                            diabetes: e.target.checked,
                            none: false,
                          })
                        }
                        className="h-5 w-5 rounded border-slate-300 text-[#000e35] focus:ring-[#000e35]"
                      />
                      <span className="text-xs font-bold text-slate-800">Diabetes</span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={medicalConditions.none}
                        onChange={(e) =>
                          setMedicalConditions({
                            allergies: false,
                            hypertension: false,
                            diabetes: false,
                            none: e.target.checked,
                          })
                        }
                        className="h-5 w-5 rounded border-slate-300 text-[#000e35] focus:ring-[#000e35]"
                      />
                      <span className="text-xs font-bold text-slate-800">None</span>
                    </label>
                  </div>

                  <div className="space-y-1 pt-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Emergency Contact (Optional)
                    </label>
                    <input
                      type="text"
                      {...register("emergencyContact")}
                      placeholder="Name & Relationship (e.g. Jane Wilson - Spouse)"
                      className="h-11 w-full rounded-lg border border-slate-200 bg-[#F8FAFC] px-3.5 text-sm font-semibold transition-all focus:border-[#000e35] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* Address Details & Consent */}
              <section className="space-y-6 rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <MapPin className="h-5 w-5" style={{ color: brandColor }} />
                  <h2 className="text-base font-extrabold text-[#000e35]">04. Address & Consent</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Address line 1 *
                    </label>
                    <input
                      type="text"
                      {...register("addressLine1")}
                      disabled={isPending}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-[#F8FAFC] px-3.5 text-sm font-semibold transition-all focus:border-[#000e35] focus:bg-white focus:outline-none"
                    />
                    {errors.addressLine1 && (
                      <p className="mt-0.5 text-xs font-bold text-rose-600">
                        {errors.addressLine1.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Address line 2 (optional)
                    </label>
                    <input
                      type="text"
                      {...register("addressLine2")}
                      disabled={isPending}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-[#F8FAFC] px-3.5 text-sm font-semibold transition-all focus:border-[#000e35] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Town / City *</label>
                    <input
                      type="text"
                      {...register("townCity")}
                      disabled={isPending}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-[#F8FAFC] px-3.5 text-sm font-semibold transition-all focus:border-[#000e35] focus:bg-white focus:outline-none"
                    />
                    {errors.townCity && (
                      <p className="mt-0.5 text-xs font-bold text-rose-600">
                        {errors.townCity.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">UK Postcode *</label>
                    <input
                      type="text"
                      {...register("postcode", { onBlur: handlePostcodeBlur })}
                      disabled={isPending}
                      placeholder="e.g. SW1A 1AA"
                      className="h-11 w-full rounded-lg border border-slate-200 bg-[#F8FAFC] px-3.5 text-sm font-semibold transition-all focus:border-[#000e35] focus:bg-white focus:outline-none"
                    />
                    {errors.postcode && (
                      <p className="mt-0.5 text-xs font-bold text-rose-600">
                        {errors.postcode.message}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 sm:col-span-2">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        {...register("consentTerms")}
                        className="mt-0.5 h-5 w-5 rounded border-slate-300 text-[#000e35] focus:ring-[#000e35]"
                      />
                      <span className="text-xs font-medium leading-relaxed text-slate-600">
                        I confirm that all clinical details provided are accurate and I agree to the{" "}
                        <a href="#" className="font-bold text-[#000e35] underline">
                          Terms of Clinical Service
                        </a>{" "}
                        and{" "}
                        <a href="#" className="font-bold text-[#000e35] underline">
                          Privacy Policy
                        </a>
                        .
                      </span>
                    </label>
                    {errors.consentTerms && (
                      <p className="mt-1 text-xs font-bold text-rose-600">
                        {errors.consentTerms.message}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-[#000e35]"
                >
                  <ChevronLeft className="h-4 w-4" /> Back to Date & Time
                </button>

                <button
                  type="submit"
                  style={{ backgroundColor: brandColor }}
                  className="flex cursor-pointer items-center gap-2 rounded-xl px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:opacity-95"
                >
                  <span>Review Booking</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 5: REVIEW BOOKING SUMMARY */}
        {step === 5 && selectedServices.length > 0 && selectedDate && selectedSlot && (
          <div className="mx-auto max-w-2xl space-y-8 duration-300 animate-in fade-in-50">
            <div className="space-y-1 text-center">
              <h1 className="text-2xl font-extrabold text-[#000e35] sm:text-3xl">
                Review Your Appointment at {pharmacyName}
              </h1>
              <p className="text-xs font-medium text-slate-500">
                Please double-check your booking details before proceeding to sign in or register.
              </p>
            </div>

            <div className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
              {/* Clinic & Service Summary */}
              <div className="space-y-4 border-b border-slate-100 pb-6">
                <div className="flex items-center justify-between">
                  <span
                    style={{ backgroundColor: `${brandColor}20`, color: brandColor }}
                    className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest"
                  >
                    {pharmacyName}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    Total Duration: {totalDuration} mins
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-[#000e35]">
                    {selectedServices.map((s) => s.name).join(" + ")}
                  </h3>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">{pharmacy.address}</p>
                </div>
              </div>

              {/* Date & Time Grid */}
              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-6 text-xs font-semibold">
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Date
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Time Slot
                  </span>
                  <span className="text-sm font-bold text-slate-900">{selectedSlot.label}</span>
                </div>
              </div>

              {/* Patient Details Summary */}
              <div className="space-y-2 border-b border-slate-100 pb-6 text-xs font-semibold text-slate-700">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Patient Summary
                </span>
                <p>
                  <strong>Name:</strong> {getValues("firstName")} {getValues("lastName")}
                </p>
                <p>
                  <strong>Contact:</strong> {getValues("email")} • {getValues("mobile")}
                </p>
                <p>
                  <strong>Address:</strong> {getValues("addressLine1")}, {getValues("townCity")},{" "}
                  {getValues("postcode")}
                </p>
              </div>

              {/* Consultation Fee Breakdown */}
              <div className="flex items-baseline justify-between pt-2">
                <span className="text-sm font-extrabold text-[#000e35]">
                  Total Consultation Fee:
                </span>
                <span style={{ color: brandColor }} className="text-2xl font-black">
                  £{totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Policy Box */}
            <div className="space-y-1 rounded-xl border border-slate-200 bg-[#eff4ff] p-5 text-xs font-medium text-slate-600">
              <p className="font-bold text-[#000e35]">Cancellation Policy:</p>
              <p>
                Free cancellation or rescheduling is available up to 24 hours prior to your slot.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-[#000e35]"
              >
                <ChevronLeft className="h-4 w-4" /> Back to Details
              </button>

              <button
                type="button"
                onClick={() => onSubmit(getValues())}
                style={{ backgroundColor: brandColor }}
                className="flex cursor-pointer items-center gap-2 rounded-xl px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:opacity-95"
              >
                <span>Confirm & Continue</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: INLINE AUTHENTICATION */}
        {step === 6 && selectedServices.length > 0 && (
          <div className="mx-auto max-w-md space-y-6 duration-300 animate-in fade-in-50">
            <div className="space-y-2 text-center">
              <div
                style={{ backgroundColor: brandColor }}
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-md"
              >
                <Lock className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-extrabold text-[#000e35]">Inline Authentication</h1>
              <p className="text-xs font-medium text-slate-600">
                You never leave the booking flow. Sign in or set a password to finalize your
                appointment with {pharmacyName}.
              </p>
            </div>

            <div className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
              {emailChecking ? (
                <div className="flex flex-col items-center justify-center space-y-3 py-12 text-slate-400">
                  <Loader2 className="h-8 w-8 animate-spin" style={{ color: brandColor }} />
                  <span className="text-xs font-bold">Verifying account email...</span>
                </div>
              ) : emailState === "EXISTING_ACCOUNT" ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                    Account detected for <strong>{getValues("email")}</strong>. Please enter your
                    password to complete your booking.
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Password</label>
                    <input
                      type="password"
                      value={inputPassword}
                      onChange={(e) => setInputPassword(e.target.value)}
                      disabled={loginPending}
                      placeholder="Enter your account password"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold focus:border-[#000e35] focus:outline-none"
                    />
                    {loginError && (
                      <p className="mt-1 text-xs font-bold text-rose-600">{loginError}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleSignIn}
                    disabled={loginPending}
                    style={{ backgroundColor: brandColor }}
                    className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:opacity-90"
                  >
                    {loginPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In & Finalize Booking</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmailState("NEW_ACCOUNT")}
                    className="mx-auto block pt-2 text-xs font-bold text-slate-500 underline hover:text-slate-900"
                  >
                    Want to set or change your password instead?
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div
                    style={{
                      backgroundColor: `${brandColor}15`,
                      borderColor: `${brandColor}30`,
                      color: brandColor,
                    }}
                    className="rounded-xl border p-3 text-xs font-semibold"
                  >
                    Create a password to set up your account for{" "}
                    <strong>{getValues("email")}</strong>. Account creation is instant and
                    won&apos;t interrupt your booking.
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Password (min 6 chars) *
                    </label>
                    <input
                      type="password"
                      {...register("password")}
                      disabled={isPending}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold focus:border-[#000e35] focus:outline-none"
                    />
                    {errors.password && (
                      <p className="mt-1 text-xs font-bold text-rose-600">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      {...register("confirmPassword")}
                      disabled={isPending}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold focus:border-[#000e35] focus:outline-none"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-xs font-bold text-rose-600">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  {bookingError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-600">
                      {bookingError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleCreateAccountAndBook}
                    disabled={isPending}
                    style={{ backgroundColor: brandColor }}
                    className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:opacity-90"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Confirming Appointment...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account & Book</span>
                        <CheckCircle2 className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmailState("EXISTING_ACCOUNT")}
                    className="mx-auto block pt-2 text-xs font-bold text-slate-500 underline hover:text-slate-900"
                  >
                    Already have an account? Click here to sign in with your password
                  </button>
                </div>
              )}
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep(5)}
                className="text-xs font-bold text-slate-500 hover:text-slate-900"
              >
                ← Back to Review
              </button>
            </div>
          </div>
        )}

        {/* STEP 7: BOOKING CONFIRMED BENTO DASHBOARD */}
        {step === 7 && confirmedDetails && (
          <div className="mx-auto w-full max-w-7xl space-y-12 py-6 duration-500 animate-in fade-in-50">
            {/* Success Header */}
            <div className="flex flex-col items-center space-y-3 text-center">
              <div
                style={{
                  backgroundColor: `${brandColor}20`,
                  borderColor: `${brandColor}40`,
                  color: brandColor,
                }}
                className="flex h-20 w-20 items-center justify-center rounded-full border shadow-sm duration-500 animate-in zoom-in-50"
              >
                <Check className="h-10 w-10 stroke-[3]" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#000e35]">
                Booking Request Submitted!
              </h1>
              <p className="max-w-lg text-sm font-medium leading-relaxed text-slate-600">
                Your appointment request at{" "}
                <strong style={{ color: brandColor }}>{pharmacyName}</strong> has been submitted.
                Pharmacy owners review and approve appointments manually. We&apos;ve sent a
                confirmation email to{" "}
                <strong className="text-[#000e35]">
                  {getValues("email") || "your email address"}
                </strong>
                .
              </p>
            </div>

            {/* Bento Grid Layout Dashboard */}
            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
              {/* Left Column (lg:col-span-7): Appointment & Location */}
              <div className="space-y-8 lg:col-span-7">
                {/* Card 1: Appointment Details */}
                <div className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                  <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                    <h2 className="text-lg font-bold text-[#000e35]">
                      Appointment Request Details
                    </h2>
                    <span className="rounded-full border border-amber-300 bg-amber-100 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wide text-amber-800">
                      Pending Pharmacy Approval
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#000e35]">
                        <Stethoscope className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Service
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-slate-900">
                          {selectedServices.map((s) => s.name).join(" + ")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#000e35]">
                        <CalendarIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Date & Time
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-slate-900">
                          {format(selectedDate!, "EEEE, MMM d")} • {selectedSlot?.label}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#000e35]">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Pharmacy
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-slate-900">{pharmacyName}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#000e35]">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Reference
                        </p>
                        <p
                          style={{ color: brandColor }}
                          className="mt-0.5 select-all font-mono text-sm font-extrabold"
                        >
                          #{confirmedDetails.referenceCode}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 border-t border-slate-100 pt-6">
                    <button
                      type="button"
                      onClick={handleAddToCalendar}
                      style={{ backgroundColor: brandColor }}
                      className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-white shadow-md transition-all hover:opacity-90"
                    >
                      <CalendarDays className="h-4 w-4" />
                      <span>Add to Calendar</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadConfirmation}
                      className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 py-3 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50"
                    >
                      <Download className="h-4 w-4" style={{ color: brandColor }} />
                      <span>Download Summary</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (onClose) onClose();
                        else window.location.href = `/book/${pharmacy.slug}`;
                      }}
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#000e35] px-6 py-3 text-xs font-bold text-[#000e35] transition-all hover:bg-slate-50 sm:w-auto"
                    >
                      <LayoutGrid className="h-4 w-4" />
                      <span>Patient Dashboard</span>
                    </button>
                  </div>
                </div>

                {/* Card 2: Location Map Section */}
                <div className="space-y-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                  <h2 className="text-lg font-bold text-[#000e35]">Clinic Location</h2>
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0" style={{ color: brandColor }} />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{pharmacyName}</p>
                      <p className="text-xs font-medium text-slate-600">{pharmacy.address}</p>
                    </div>
                  </div>

                  {/* Map View Banner */}
                  <div className="relative h-48 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80"
                      alt="Clinic Location Map"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleGetDirections}
                      className="absolute bottom-4 right-4 flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#000e35] shadow-lg transition-all hover:bg-slate-50"
                    >
                      <Navigation className="h-4 w-4" style={{ color: brandColor }} />
                      <span>Get Directions</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column (lg:col-span-5): What Happens Next Checklist */}
              <aside className="space-y-6 lg:col-span-5">
                {/* Next Steps Checklist Box */}
                <div className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                  <h2 className="text-lg font-bold text-[#000e35]">What Happens Next?</h2>

                  <div className="relative space-y-8">
                    {/* Vertical Timeline Line */}
                    <div className="absolute bottom-4 left-[19px] top-4 w-0.5 bg-slate-200" />

                    {/* Step 1 */}
                    <div className="relative z-10 flex gap-4">
                      <div
                        style={{ backgroundColor: brandColor }}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-white shadow-sm"
                      >
                        <Check className="h-5 w-5" />
                      </div>
                      <div className="space-y-1 pt-0.5">
                        <h3 className="text-sm font-bold text-slate-900">Digital Check-in</h3>
                        <p className="text-xs font-medium leading-relaxed text-slate-600">
                          We&apos;ll send you a digital check-in form 24 hours before your
                          appointment. Please complete it to save time at {pharmacyName}.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="relative z-10 flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#000e35] bg-white font-bold text-[#000e35]">
                        <Navigation className="h-5 w-5" />
                      </div>
                      <div className="space-y-1 pt-0.5">
                        <h3 className="text-sm font-bold text-slate-900">Arrive 10m Early</h3>
                        <p className="text-xs font-medium leading-relaxed text-slate-600">
                          Please arrive at the {pharmacyName} reception 10 minutes before your
                          scheduled slot. Bring a valid ID.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="relative z-10 flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 bg-white font-bold text-slate-400">
                        <Stethoscope className="h-5 w-5" />
                      </div>
                      <div className="space-y-1 pt-0.5">
                        <h3 className="text-sm font-bold text-slate-800">Consultation</h3>
                        <p className="text-xs font-medium leading-relaxed text-slate-500">
                          Your session with our clinical specialist will begin promptly. Most
                          consultations last approximately {totalDuration} minutes.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reassurance Policy Banner */}
                <div className="space-y-4 rounded-2xl bg-[#0a2259] p-6 text-white shadow-md sm:p-8">
                  <div className="flex items-center gap-3">
                    <Info className="h-6 w-6 text-[#6bfcbe]" />
                    <h4 className="text-base font-extrabold text-white">
                      Need to change something?
                    </h4>
                  </div>
                  <p className="text-xs font-medium leading-relaxed text-slate-200">
                    You can cancel or reschedule your appointment free of charge up to 24 hours
                    before your time slot.
                  </p>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(
                        "Free cancellation & rescheduling is available up to 24 hours before your slot via your patient dashboard."
                      );
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6bfcbe] hover:underline"
                  >
                    <span>Cancellation Policy</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </aside>
            </div>
          </div>
        )}
      </main>

      {/* 3. Dynamic Footer */}
      <footer className="mt-auto w-full border-t border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 py-10 md:flex-row md:px-10">
          <div className="max-w-xs space-y-3">
            <span className="text-lg font-extrabold text-[#000e35]">{pharmacyName}</span>
            <p className="text-xs font-medium leading-relaxed text-slate-500">
              Official healthcare provider partner on NextDoorClinic. Registered with CQC and NHS
              partners.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 text-xs font-semibold md:grid-cols-3">
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#000e35]">
                Patients
              </span>
              <a href="#" className="text-slate-500 transition-colors hover:text-[#000e35]">
                Find Care
              </a>
              <a href="#" className="text-slate-500 transition-colors hover:text-[#000e35]">
                Direct Solutions
              </a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#000e35]">
                Clinics
              </span>
              <a href="#" className="text-slate-500 transition-colors hover:text-[#000e35]">
                List Your Clinic
              </a>
              <a href="#" className="text-slate-500 transition-colors hover:text-[#000e35]">
                Pricing
              </a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#000e35]">
                Legal & Trust
              </span>
              <a href="#" className="text-slate-500 transition-colors hover:text-[#000e35]">
                Privacy Policy
              </a>
              <a href="#" className="text-slate-500 transition-colors hover:text-[#000e35]">
                Terms of Service
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 py-6">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 text-xs font-medium text-slate-500 md:flex-row md:px-10">
            <p>© 2024 {pharmacyName}. Powered by NextDoorClinic. CQC, NHS & ICO Registered.</p>
            <div className="flex gap-4 font-bold text-[#000e35]">
              <span>CQC</span>
              <span>NHS</span>
              <span>ICO</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default BookingWizard;
