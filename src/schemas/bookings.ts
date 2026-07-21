import { z } from "zod";

export const requestOTPSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type RequestOTPInput = z.infer<typeof requestOTPSchema>;

export const createBookingSchema = z.object({
  pharmacyId: z.string().uuid("Pharmacy ID must be a valid UUID"),
  serviceId: z.string().uuid("Service ID must be a valid UUID"),
  patientName: z.string().min(2, "Full name is required"),
  patientEmail: z.string().email("Invalid email address"),
  patientPhone: z.string().min(10, "Valid phone number is required"),
  startTime: z.string().datetime("Invalid start time format"),
  endTime: z.string().datetime("Invalid end time format"),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
  notes: z.string().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
