import { z } from "zod";

export const tenantFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().toLowerCase().email("Valid email is required"),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10 digit mobile number"),
  guardianName: z.string().trim().min(2, "Guardian's name must be at least 2 characters"),
  guardianRelation: z.enum(["", "FATHER", "HUSBAND"]),
  address: z.string().trim().min(5, "Address must be at least 5 characters"),
  voterCardNo: z
    .string()
    .trim()
    .toUpperCase()
    .refine(
      (v) => v === "" || /^[A-Z]{3}\d{7}$/.test(v),
      "Voter ID must be 3 letters followed by 7 digits (e.g. ABC1234567)",
    ),
});

export type TenantForm = z.infer<typeof tenantFormSchema>;