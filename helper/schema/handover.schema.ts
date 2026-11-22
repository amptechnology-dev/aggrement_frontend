import { z } from "zod";
import { numberField } from "@/helper/schema/fields";

export const handoverFormSchema = z.object({
  agreementId: z.string().min(1, "Select an agreement"),
  numberOfKeys: numberField("Number of keys", { min: 1, max: 100, int: true }),
  handoverDate: z.string().min(1, "Select handover date"),
  remarks: z.string().trim().max(500, "Remarks can be at most 500 characters"),
});

/** Form-er bhetore thaka value (numberOfKeys: string) */
export type HandoverFormInput = z.input<typeof handoverFormSchema>;

/** Validation-er por value (numberOfKeys: number) */
export type HandoverForm = z.output<typeof handoverFormSchema>;