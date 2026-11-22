import { z } from "zod";

const requiredText = (label: string, min = 2) =>
  z.string().trim().min(min, `${label} must be at least ${min} characters`);

const coordinate = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine((value) => {
      const n = Number(value);
      return Number.isFinite(n) && n >= min && n <= max;
    }, `${label} must be a number between ${min} and ${max}`);

export const propertyFormSchema = z.object({
  name: requiredText("Name"),
  address: requiredText("Address", 5),
  pin: z.string().trim().regex(/^\d{6}$/, "PIN must be 6 digits"),
  city: requiredText("City"),
  state: z.string().trim().min(1, "Select a state"),
  location: requiredText("Location"),
  lat: coordinate("Latitude", -90, 90),
  long: coordinate("Longitude", -180, 180),
});

export type PropertyForm = z.infer<typeof propertyFormSchema>;