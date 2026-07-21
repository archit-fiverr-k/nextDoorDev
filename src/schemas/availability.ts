import { z } from "zod";

export const weeklyScheduleItemSchema = z
  .object({
    dayOfWeek: z.number().min(0).max(6),
    isOpen: z.boolean(),
    openTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid open time format"),
    closeTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid close time format"),
  })
  .refine(
    (data) => {
      if (!data.isOpen) return true;
      const [openH, openM] = data.openTime.split(":").map(Number);
      const [closeH, closeM] = data.closeTime.split(":").map(Number);
      return openH * 60 + openM < closeH * 60 + closeM;
    },
    {
      message: "Open time must be before close time",
      path: ["closeTime"],
    }
  );

export const weeklyScheduleSchema = z.array(weeklyScheduleItemSchema);

export const blockedDateSchema = z.object({
  date: z.string().min(1, "Date is required"),
  reason: z.string().min(2, "Reason must be at least 2 characters").max(100, "Reason too long"),
});

export type WeeklyScheduleItemInput = z.infer<typeof weeklyScheduleItemSchema>;
export type BlockedDateInput = z.infer<typeof blockedDateSchema>;
