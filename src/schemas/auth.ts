import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  pharmacyName: z.string().min(3, "Pharmacy name must be at least 3 characters long"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters long")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase alphanumeric characters and hyphens"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const registerPatientSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters long"),
  lastName: z.string().min(2, "Last name must be at least 2 characters long"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(5, "Mobile number is too short"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters long"),
  acceptPrivacyPolicy: z
    .boolean()
    .refine((val) => val === true, "You must accept the privacy policy"),
  acceptTerms: z.boolean().refine((val) => val === true, "You must accept the terms & conditions"),
});

export type RegisterPatientInput = z.infer<typeof registerPatientSchema>;
