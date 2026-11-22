"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { toast } from "react-toastify";
import { createHandover, getEligibleAgreements, updateHandover } from "@/service/handover.service";
import { handoverFormSchema } from "@/helper/schema/handover.schema";
import type { HandoverForm, HandoverFormInput } from "@/helper/schema/handover.schema";
import { getErrorMessage } from "@/helper/apiError";
import { formatDate } from "@/helper/format";
import type { EligibleAgreement, Handover } from "@/types/handover.types";

interface HandoverFormDialogProps {
  visible: boolean;
  editing: Handover | null;
  onHide: () => void;
  onSaved: () => void;
}

interface Option {
  label: string;
  value: string;
}

const today = (): string => new Date().toISOString().slice(0, 10);

const EMPTY_FORM: HandoverFormInput = {
  agreementId: "",
  numberOfKeys: "",
  handoverDate: "",
  remarks: "",
};

export default function HandoverFormDialog({ visible, editing, onHide, onSaved }: HandoverFormDialogProps) {
  const [eligible, setEligible] = useState<EligibleAgreement[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<HandoverFormInput, undefined, HandoverForm>({
    resolver: zodResolver(handoverFormSchema),
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    // edit mode: kono API call lagbe na, row-er data diyei form bhore jay
    if (editing) {
      setEligible([]);
      setLoadingData(false);
      reset({
        agreementId: editing.agreementId,
        numberOfKeys: String(editing.numberOfKeys),
        handoverDate: editing.handoverDate,
        remarks: editing.remarks,
      });
      return;
    }

    setLoadingData(true);
    reset({ ...EMPTY_FORM, handoverDate: today() });

    getEligibleAgreements()
      .then((res) => {
        if (!cancelled) setEligible(res.agreements);
      })
      .catch((err) => {
        if (!cancelled) toast.error(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoadingData(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, editing, reset]);

  const agreementOptions: Option[] = useMemo(
    () =>
      eligible.map((a) => ({
        label: `${a.agreementNo} - ${a.tenantName} (Stall ${a.stallNo})`,
        value: a.id,
      })),
    [eligible],
  );

  const selectedId = watch("agreementId");
  const selected = eligible.find((a) => a.id === selectedId) ?? null;

  const handleAgreementChange = (id: string) => {
    setValue("agreementId", id, { shouldValidate: true });
    const a = eligible.find((x) => x.id === id);
    // stall-er record-e joto chabi ache seta auto bose jabe
    if (a) setValue("numberOfKeys", String(a.defaultKeys), { shouldValidate: true });
  };

  const onSubmit = async (data: HandoverForm) => {
    setSubmitting(true);
    try {
      const body = {
        numberOfKeys: data.numberOfKeys,
        handoverDate: data.handoverDate,
        remarks: data.remarks,
      };
      const res = editing
        ? await updateHandover(editing.id, body)
        : await createHandover({ agreementId: data.agreementId, ...body });

      toast.success(res.message);
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const invalid = (hasError: boolean) => `w-full ${hasError ? "p-invalid" : ""}`;
  const labelClass = "text-sm font-semibold text-slate-700";
  const box = "rounded-xl border border-slate-200 bg-slate-50 p-4";

  return (
    <Dialog
      header={editing ? `Edit Handover (${editing.agreementNo})` : "Record Handover"}
      visible={visible}
      onHide={() => !submitting && onHide()}
      style={{ width: "min(96vw, 600px)" }}
      draggable={false}
      dismissableMask={false}
    >
      {loadingData ? (
        <div className="flex justify-center py-14">
          <i className="pi pi-spin pi-spinner text-3xl text-teal-500" />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1" noValidate>
          {editing ? (
            <div className={`${box} grid gap-3 text-sm sm:grid-cols-3`}>
              <div>
                <p className="text-[11px] uppercase text-slate-400">Agreement</p>
                <p className="font-medium text-slate-800">{editing.agreementNo}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-slate-400">Tenant</p>
                <p className="font-medium text-slate-800">{editing.tenant.name}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-slate-400">Stall</p>
                <p className="font-medium text-slate-800">
                  {editing.stall.stallNo} - {editing.stall.propertyName}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className={labelClass}>
                Agreement <span className="text-red-500">*</span>
              </label>
              <Controller
                name="agreementId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    value={field.value}
                    options={agreementOptions}
                    optionLabel="label"
                    optionValue="value"
                    onChange={(e) => handleAgreementChange(e.value as string)}
                    placeholder={
                      agreementOptions.length === 0
                        ? "No agreement is waiting for handover"
                        : "Select agreement"
                    }
                    filter
                    className={invalid(!!errors.agreementId)}
                  />
                )}
              />
              {errors.agreementId && <small className="text-red-500">{errors.agreementId.message}</small>}

              {selected && (
                <div className="mt-2 grid gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-[11px] uppercase text-slate-400">Tenant</p>
                    <p className="font-medium text-slate-800">{selected.tenantName}</p>
                    <p className="text-xs text-slate-500">{selected.tenantPhone}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase text-slate-400">Stall</p>
                    <p className="font-medium text-slate-800">Stall {selected.stallNo}</p>
                    <p className="text-xs text-slate-500">{selected.propertyName}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase text-slate-400">Agreement date</p>
                    <p className="font-medium text-slate-800">{formatDate(selected.agreementDate)}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="h-keys" className={labelClass}>
                Number of keys <span className="text-red-500">*</span>
              </label>
              <InputText
                id="h-keys"
                inputMode="numeric"
                {...register("numberOfKeys")}
                placeholder="e.g. 2"
                className={invalid(!!errors.numberOfKeys)}
              />
              {errors.numberOfKeys ? (
                <small className="text-red-500">{errors.numberOfKeys.message}</small>
              ) : (
                selected && <small className="text-slate-400">Stall record: {selected.defaultKeys} key(s)</small>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="h-date" className={labelClass}>
                Handover date <span className="text-red-500">*</span>
              </label>
              <input
                id="h-date"
                type="date"
                {...register("handoverDate")}
                className={`h-10 w-full rounded-md border px-3 text-sm ${
                  errors.handoverDate ? "border-red-400" : "border-slate-300"
                }`}
              />
              {errors.handoverDate && <small className="text-red-500">{errors.handoverDate.message}</small>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="h-remarks" className={labelClass}>
              Remarks <span className="text-xs font-normal text-slate-400">(optional)</span>
            </label>
            <InputTextarea
              id="h-remarks"
              rows={3}
              maxLength={500}
              {...register("remarks")}
              placeholder="e.g. Stall handed over with new shutter lock"
              className={invalid(!!errors.remarks)}
            />
            {errors.remarks && <small className="text-red-500">{errors.remarks.message}</small>}
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" label="Cancel" outlined severity="secondary" className="flex-1" disabled={submitting} onClick={onHide} />
            <Button
              type="submit"
              label={submitting ? "Saving..." : editing ? "Save changes" : "Record Handover"}
              icon={submitting ? "pi pi-spin pi-spinner" : "pi pi-check"}
              className="flex-1"
              disabled={submitting || (!editing && agreementOptions.length === 0)}
            />
          </div>
        </form>
      )}
    </Dialog>
  );
}