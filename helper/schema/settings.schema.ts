import { z } from "zod";

const numberField = (
  label: string,
  opts: { min?: number; max?: number; int?: boolean } = {}
) => {
  const { min = 0, max, int = false } = opts;

  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine((v) => v === "" || !Number.isNaN(Number(v)), `${label} must be a number`)
    .refine((v) => Number(v) >= min, `${label} must be at least ${min}`)
    .refine((v) => max === undefined || Number(v) <= max, `${label} must be at most ${max}`)
    .refine((v) => !int || Number.isInteger(Number(v)), `${label} must be a whole number`);
};

export const settingsFormSchema = z.object({
  officeName: z.string().trim().min(2, "Office name is required"),
  officeAddress: z.string().trim().min(5, "Office address is required"),
  lateFineAmountPerDay: numberField("Late fine amount", { min: 0 }),
  lateFineAfterDay: numberField("Late fine after day", { min: 0, int: true }),
  validityYears: numberField("Validity years", { min: 1, int: true }),
  rentIncreaseEveryYears: numberField("Rent increase interval", { min: 1, int: true }),
  rentIncreasePercent: numberField("Rent increase percent", { min: 0, max: 100 }),
  stallCannotCloseForDays: numberField("Stall cannot close days", { min: 0, int: true }),
  noticePeriodMonths: numberField("Notice period", { min: 0, int: true }),
});

// Form e sob numeric field string (input value), API te pathanor somoy Number() hoy
export type SettingsForm = z.infer<typeof settingsFormSchema>;