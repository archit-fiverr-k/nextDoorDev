import { z } from "zod";

export const branchSchema = z.object({
  name: z.string().min(3, "Branch name must be at least 3 characters long"),
  address: z.string().min(5, "Address must be at least 5 characters long"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Invalid branch contact email"),
  timezone: z.string().default("UTC"),
});

export type BranchInput = z.infer<typeof branchSchema>;

export const serviceSchema = z.object({
  name: z.string().min(3, "Service name must be at least 3 characters long"),
  description: z.string().optional(),
  duration: z.number().int().min(5, "Duration must be at least 5 minutes"),
  price: z.number().min(0, "Price must be a positive number"),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
