"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { toast } from "react-toastify";
import { createTenant, updateTenant } from "@/service/tenant.service";
import { tenantFormSchema } from "@/helper/schema/tenant.schema";
import type { TenantForm } from "@/helper/schema/tenant.schema";
import { getErrorMessage } from "@/helper/apiError";
import type { GuardianRelation, Tenant } from "@/types/tenant.types";

interface TenantFormDialogProps {
  visible: boolean;
  tenant: Tenant | null; // null = create
  onHide: () => void;
  onSaved: () => void;
}

interface RelationOption {
  label: string;
  value: GuardianRelation | "";
}

const RELATION_OPTIONS: RelationOption[] = [
  { label: "Not specified", value: "" },
  { label: "Father", value: "FATHER" },
  { label: "Husband", value: "HUSBAND" },
];

const EMPTY_FORM: TenantForm = {
  name: "",
  email: "",
  phone: "",
  guardianName: "",
  guardianRelation: "",
  address: "",
  voterCardNo: "",
};

const toForm = (t: Tenant): TenantForm => ({
  name: t.name,
  email: t.email,
  phone: t.phone,
  guardianName: t.guardianName,
  guardianRelation: t.guardianRelation ?? "",
  address: t.address,
  voterCardNo: t.voterCardNo ?? "",
});

export default function TenantFormDialog({
  visible,
  tenant,
  onHide,
  onSaved,
}: TenantFormDialogProps) {
  const isEdit = tenant !== null;
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TenantForm>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    if (!visible) return;
    reset(tenant ? toForm(tenant) : EMPTY_FORM);
  }, [visible, tenant, reset]);

  const onSubmit = async (data: TenantForm) => {
    setSubmitting(true);
    try {
      const res = tenant
        ? await updateTenant(tenant.id, {
            name: data.name,
            guardianName: data.guardianName,
            guardianRelation: data.guardianRelation,
            address: data.address,
            voterCardNo: data.voterCardNo,
          })
        : await createTenant(data);
      toast.success(res.message);
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const invalid = (hasError: boolean) => `w-full ${hasError ? "p-invalid" : ""}`;
  const locked = "w-full bg-slate-100 text-slate-500";
  const labelClass = "text-sm font-semibold text-slate-700";

  return (
    <Dialog
      header={isEdit ? "Edit Tenant" : "Add New Tenant"}
      visible={visible}
      onHide={() => !submitting && onHide()}
      style={{ width: "min(96vw, 640px)" }}
      contentStyle={{ maxHeight: "80vh" }}
      draggable={false}
      dismissableMask={false}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1" noValidate>
        {!isEdit && (
          <div className="flex gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-800">
            <i className="pi pi-info-circle mt-0.5" />
            <p>
              If this person already has a tenant account (for example with another owner), the
              existing account is linked automatically. The email and phone number must both
              match that account.
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="t-name" className={labelClass}>
            Full name <span className="text-red-500">*</span>
          </label>
          <InputText id="t-name" {...register("name")} placeholder="Tenant name" className={invalid(!!errors.name)} />
          {errors.name && <small className="text-red-500">{errors.name.message}</small>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="t-email" className={labelClass}>
              Email <span className="text-red-500">*</span>
            </label>
            <InputText
              id="t-email"
              type="email"
              readOnly={isEdit}
              {...register("email")}
              placeholder="tenant@example.com"
              className={isEdit ? locked : invalid(!!errors.email)}
            />
            {errors.email && <small className="text-red-500">{errors.email.message}</small>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="t-phone" className={labelClass}>
              Contact number <span className="text-red-500">*</span>
            </label>
            <InputText
              id="t-phone"
              inputMode="numeric"
              maxLength={10}
              readOnly={isEdit}
              {...register("phone")}
              placeholder="10 digit mobile number"
              className={isEdit ? locked : invalid(!!errors.phone)}
            />
            {errors.phone && <small className="text-red-500">{errors.phone.message}</small>}
          </div>
        </div>
        {isEdit && (
          <p className="-mt-2 text-[11px] text-slate-400">
            Email and phone are the tenant&apos;s login identity and cannot be changed.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="t-guardian" className={labelClass}>
              Guardian&apos;s name <span className="text-red-500">*</span>
            </label>
            <InputText id="t-guardian" {...register("guardianName")} placeholder="Father / husband name" className={invalid(!!errors.guardianName)} />
            {errors.guardianName && <small className="text-red-500">{errors.guardianName.message}</small>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="t-relation" className={labelClass}>
              Relation <span className="text-xs font-normal text-slate-400">(optional)</span>
            </label>
            <Controller
              name="guardianRelation"
              control={control}
              render={({ field }) => (
                <Dropdown
                  inputId="t-relation"
                  value={field.value}
                  options={RELATION_OPTIONS}
                  optionLabel="label"
                  optionValue="value"
                  onChange={(e) => field.onChange(e.value as GuardianRelation | "")}
                  className="w-full"
                />
              )}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="t-address" className={labelClass}>
            Address <span className="text-red-500">*</span>
          </label>
          <InputTextarea id="t-address" rows={2} {...register("address")} placeholder="Full address" className={invalid(!!errors.address)} />
          {errors.address && <small className="text-red-500">{errors.address.message}</small>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="t-voter" className={labelClass}>
            Voter card number <span className="text-xs font-normal text-slate-400">(optional)</span>
          </label>
          <InputText id="t-voter" maxLength={10} {...register("voterCardNo")} placeholder="e.g. ABC1234567" className={invalid(!!errors.voterCardNo)} />
          {errors.voterCardNo && <small className="text-red-500">{errors.voterCardNo.message}</small>}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" label="Cancel" outlined severity="secondary" className="flex-1" disabled={submitting} onClick={onHide} />
          <Button
            type="submit"
            label={submitting ? "Saving..." : isEdit ? "Update Tenant" : "Create Tenant"}
            icon={submitting ? "pi pi-spin pi-spinner" : "pi pi-check"}
            className="flex-1"
            disabled={submitting}
          />
        </div>
      </form>
    </Dialog>
  );
}