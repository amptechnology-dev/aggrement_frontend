"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { toast } from "react-toastify";
import { createStall, updateStall } from "@/service/stall.service";
import { getProperties } from "@/service/property.service";
import { stallFormSchema } from "@/helper/schema/stall.schema";
import type { StallForm } from "@/helper/schema/stall.schema";
import { getErrorMessage } from "@/helper/apiError";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_MB } from "@/helper/constants";
import type { Property } from "@/types/property.types";
import type { Stall } from "@/types/stall.types";

interface StallFormDialogProps {
  visible: boolean;
  stall: Stall | null; // null = create
  defaultPropertyId?: string;
  onHide: () => void;
  onSaved: () => void;
}

interface PropertyOption {
  label: string;
  value: string;
}

const EMPTY_FORM: StallForm = { propertyId: "", stallNo: "", numberOfKeys: "" };

export default function StallFormDialog({
  visible,
  stall,
  defaultPropertyId,
  onHide,
  onSaved,
}: StallFormDialogProps) {
  const isEdit = stall !== null;
  const [options, setOptions] = useState<PropertyOption[]>([]);
  const [loadingProps, setLoadingProps] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const [imageError, setImageError] = useState("");

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StallForm>({
    resolver: zodResolver(stallFormSchema),
    defaultValues: EMPTY_FORM,
  });

  // dialog খুললে form reset + property list
  useEffect(() => {
    if (!visible) return;

    reset(
      stall
        ? {
            propertyId: stall.property?.id ?? "",
            stallNo: stall.stallNo,
            numberOfKeys: stall.numberOfKeys === null ? "" : String(stall.numberOfKeys),
          }
        : { ...EMPTY_FORM, propertyId: defaultPropertyId ?? "" },
    );
    setFile(null);
    setRemoveImage(false);
    setImageError("");

    let cancelled = false;
    setLoadingProps(true);
    getProperties({ page: 1, limit: 100 })
      .then((res) => {
        if (cancelled) return;
        const list: Property[] = res.properties.filter((p) => p.isActive);
        const mapped: PropertyOption[] = list.map((p) => ({
          label: `${p.name} (${p.city})`,
          value: p.id,
        }));
        // edit-এ property inactive হলেও নামটা দেখাতে হবে
        if (stall?.property && !mapped.some((o) => o.value === stall.property?.id)) {
          mapped.push({ label: stall.property.name, value: stall.property.id });
        }
        setOptions(mapped);
      })
      .catch((err) => {
        if (!cancelled) toast.error(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoadingProps(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, stall, defaultPropertyId, reset]);

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    e.target.value = "";
    if (!selected) return;

    if (!ALLOWED_IMAGE_TYPES.includes(selected.type)) {
      setImageError("Only JPG, PNG or WEBP images are allowed");
      return;
    }
    if (selected.size > MAX_IMAGE_MB * 1024 * 1024) {
      setImageError(`Image must be under ${MAX_IMAGE_MB}MB`);
      return;
    }
    setImageError("");
    setRemoveImage(false);
    setFile(selected);
  };

  const onSubmit = async (data: StallForm) => {
    const formData = new FormData();
    formData.append("stallNo", data.stallNo);
    formData.append("numberOfKeys", data.numberOfKeys);
    if (!isEdit) formData.append("propertyId", data.propertyId);
    if (file) formData.append("image", file);
    if (isEdit && removeImage && !file) formData.append("removeImage", "true");

    setSubmitting(true);
    try {
      const res = stall
        ? await updateStall(stall.id, formData)
        : await createStall(formData);
      toast.success(res.message);
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const currentImage = removeImage ? "" : (stall?.image ?? "");
  const shownImage = preview || currentImage;
  const invalid = (hasError: boolean) => `w-full ${hasError ? "p-invalid" : ""}`;
  const labelClass = "text-sm font-semibold text-slate-700";

  return (
    <Dialog
      header={isEdit ? "Edit Stall" : "Add New Stall"}
      visible={visible}
      onHide={() => !submitting && onHide()}
      style={{ width: "min(96vw, 560px)" }}
      contentStyle={{ maxHeight: "80vh" }}
      draggable={false}
      dismissableMask={false}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="s-property" className={labelClass}>
            Property <span className="text-red-500">*</span>
          </label>
          <Controller
            name="propertyId"
            control={control}
            render={({ field }) => (
              <Dropdown
                inputId="s-property"
                value={field.value}
                options={options}
                optionLabel="label"
                optionValue="value"
                onChange={(e) => field.onChange(e.value as string)}
                placeholder={
                  loadingProps
                    ? "Loading properties..."
                    : options.length === 0
                      ? "No active property found"
                      : "Select property"
                }
                disabled={isEdit || loadingProps}
                filter
                className={invalid(!!errors.propertyId)}
              />
            )}
          />
          {errors.propertyId && <small className="text-red-500">{errors.propertyId.message}</small>}
          {isEdit && <p className="text-[11px] text-slate-400">A stall cannot be moved to another property.</p>}
          {!isEdit && !loadingProps && options.length === 0 && (
            <p className="text-[11px] text-amber-600">Create an active property first.</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="s-no" className={labelClass}>
              Stall / Room number <span className="text-red-500">*</span>
            </label>
            <InputText id="s-no" {...register("stallNo")} placeholder="e.g. A-12" className={invalid(!!errors.stallNo)} />
            {errors.stallNo && <small className="text-red-500">{errors.stallNo.message}</small>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="s-keys" className={labelClass}>
              Number of keys <span className="text-xs font-normal text-slate-400">(optional)</span>
            </label>
            <InputText id="s-keys" inputMode="numeric" maxLength={2} {...register("numberOfKeys")} placeholder="e.g. 2" className={invalid(!!errors.numberOfKeys)} />
            {errors.numberOfKeys && <small className="text-red-500">{errors.numberOfKeys.message}</small>}
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClass}>
            Image <span className="text-xs font-normal text-slate-400">(optional)</span>
          </label>
          {shownImage && (
            <div className="flex items-end gap-3">
              <img src={shownImage} alt="Stall preview" className="h-32 w-48 rounded-xl border border-slate-200 object-cover" />
              {!preview && currentImage && (
                <Button type="button" label="Remove" icon="pi pi-trash" size="small" outlined severity="danger" onClick={() => setRemoveImage(true)} />
              )}
            </div>
          )}
          <input
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            onChange={handleFile}
            className="block w-full rounded-lg border border-slate-200 p-1.5 text-sm"
          />
          <p className="text-[11px] text-slate-400">JPG, PNG or WEBP, up to {MAX_IMAGE_MB}MB.</p>
          {imageError && <small className="block text-red-500">{imageError}</small>}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" label="Cancel" outlined severity="secondary" className="flex-1" disabled={submitting} onClick={onHide} />
          <Button
            type="submit"
            label={submitting ? "Saving..." : isEdit ? "Update Stall" : "Create Stall"}
            icon={submitting ? "pi pi-spin pi-spinner" : "pi pi-check"}
            className="flex-1"
            disabled={submitting || (!isEdit && options.length === 0)}
          />
        </div>
      </form>
    </Dialog>
  );
}