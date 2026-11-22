import { z } from "zod";

interface NumberRule {
  min: number;
  max: number;
  int?: boolean;
}

export const numberField = (label: string, rule: NumberRule) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine((v) => {
      const n = Number(v);
      return (
        Number.isFinite(n) && n >= rule.min && n <= rule.max && (!rule.int || Number.isInteger(n))
      );
    }, `${label} must be ${rule.int ? "a whole number" : "a number"} between ${rule.min} and ${rule.max}`)
    .transform((v) => Number(v));

export const rulesShape = {
  lateFineAmountPerDay: numberField("Late fine", { min: 0, max: 100000 }),
  lateFineAfterDay: numberField("Late fine start day", { min: 1, max: 28, int: true }),
  validityYears: numberField("Validity", { min: 1, max: 99, int: true }),
  rentIncreaseEveryYears: numberField("Increase interval", { min: 0, max: 50, int: true }),
  rentIncreasePercent: numberField("Increase percent", { min: 0, max: 100 }),
  stallCannotCloseForDays: numberField("Closing limit", { min: 0, max: 365, int: true }),
  noticePeriodMonths: numberField("Notice period", { min: 0, max: 24, int: true }),
};

export type RuleKey = keyof typeof rulesShape;

export interface RuleFieldMeta {
  name: RuleKey;
  label: string;
  hint: string;
}

export const RULE_FIELDS: RuleFieldMeta[] = [
  { name: "lateFineAmountPerDay", label: "Late fine per day (₹)", hint: "Charged for every late day" },
  { name: "lateFineAfterDay", label: "Late fine after day of month", hint: "e.g. 7 = after the 7th" },
  { name: "validityYears", label: "Agreement validity (years)", hint: "e.g. 15" },
  { name: "rentIncreaseEveryYears", label: "Rent increase every (years)", hint: "0 = no increase" },
  { name: "rentIncreasePercent", label: "Rent increase (%)", hint: "Applied on the previous rent" },
  { name: "stallCannotCloseForDays", label: "Stall cannot stay closed (days)", hint: "e.g. 7" },
  { name: "noticePeriodMonths", label: "Notice period (months)", hint: "e.g. 1" },
];