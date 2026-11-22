import { z } from "zod";
import { numberField, rulesShape } from "@/helper/schema/fields";

export const GUARDIAN_RELATIONS = ["FATHER", "HUSBAND"] as const;
export type GuardianRelationValue = (typeof GUARDIAN_RELATIONS)[number];

const isGuardianRelation = (v: string): v is GuardianRelationValue =>
  v === "FATHER" || v === "HUSBAND";

export const agreementFormSchema = z.object({
  tenantId: z.string().min(1, "Select a tenant"),
  stallId: z.string().min(1, "Select a stall"),
  agreementDate: z.string().min(1, "Select agreement date"),
  effectiveFrom: z.string().min(1, "Select effective date"),
  monthlyRent: numberField("Monthly rent", { min: 1, max: 10000000 }),
  depositAmount: numberField("Deposit", { min: 0, max: 100000000 }),
  guardianRelation: z
    .string()
    .refine(isGuardianRelation, "Select father or husband")
    .transform((v) => v as GuardianRelationValue),
  voterCardNo: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}\d{7}$/, "Voter ID must be 3 letters followed by 7 digits (e.g. ABC1234567)"),
  officeName: z.string().trim().min(1, "Office name is required").max(150),
  officeAddress: z.string().trim().min(5, "Office address is required").max(300),
  ...rulesShape,
});

/** Form-er bhetore thaka value (guardianRelation: string, "" allowed) */
export type AgreementFormInput = z.input<typeof agreementFormSchema>;

/** Validation-er por value (guardianRelation: "FATHER" | "HUSBAND") */
export type AgreementForm = z.output<typeof agreementFormSchema>;