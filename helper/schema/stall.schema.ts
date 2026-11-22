import { z } from "zod";

export const stallFormSchema = z.object({
  propertyId: z.string().min(1, "Select a property"),
  stallNo: z.string().trim().min(1, "Stall number is required").max(20, "Stall number is too long"),
  numberOfKeys: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || (/^\d+$/.test(v) && Number(v) <= 50),
      "Enter a whole number between 0 and 50",
    ),
});

export type StallForm = z.infer<typeof stallFormSchema>;