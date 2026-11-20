import { z } from "zod";

export const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Valid email is required"),
});
export type EmailForm = z.infer<typeof emailSchema>;

export const createOwnerFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().toLowerCase().email("Valid email is required"),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10 digit mobile number"),
  address: z.string().trim().min(5, "Address must be at least 5 characters"),
});
export type CreateOwnerForm = z.infer<typeof createOwnerFormSchema>;