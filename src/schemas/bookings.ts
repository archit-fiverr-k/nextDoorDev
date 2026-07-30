import { z } from "zod";
import { isValidUKOrDevPhone } from "@/lib/phone-validation";

export const requestOTPSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type RequestOTPInput = z.infer<typeof requestOTPSchema>;

export const createBookingSchema = z.object({
  pharmacyId: z.string().uuid("Pharmacy ID must be a valid UUID"),
  serviceId: z.string().uuid("Service ID must be a valid UUID"),
  patientName: z.string().min(2, "Full name is required"),
  patientEmail: z.string().email("Invalid email address"),
  patientPhone: z
    .string()
    .min(5, "Mobile number is required")
    .refine(
      (val) => isValidUKOrDevPhone(val),
      "Only UK mobile numbers (+44 / 07...) are supported."
    ),
  startTime: z.string().datetime("Invalid start time format"),
  endTime: z.string().datetime("Invalid end time format"),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
  notes: z.string().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
