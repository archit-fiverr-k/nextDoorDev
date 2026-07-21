import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional().or(z.literal("")),
  duration: z.coerce
    .number()
    .int("Duration must be a whole number")
    .min(5, "Duration must be at least 5 minutes")
    .max(480, "Duration cannot exceed 480 minutes (8 hours)"),
  price: z.coerce
    .number()
    .min(0, "Price cannot be negative")
    .max(10000, "Price cannot exceed $10,000"),
  isActive: z.boolean().default(true),

  category: z.string().optional().or(z.literal("")),
  prepNotes: z.string().optional().or(z.literal("")),
  instructions: z.string().optional().or(z.literal("")),
  displayOrder: z.coerce.number().int().default(0),
  status: z.string().default("ACTIVE"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color")
    .optional()
    .or(z.literal("")),
  categoryId: z.string().uuid("Invalid category ID").optional().nullable().or(z.literal("")),
  serviceSlug: z.string().optional().nullable().or(z.literal("")),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
