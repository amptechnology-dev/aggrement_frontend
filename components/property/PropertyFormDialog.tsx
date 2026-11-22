"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { toast } from "react-toastify";
import { createProperty, updateProperty } from "@/service/property.service";
import { propertyFormSchema } from "@/helper/schema/property.schema";
import type { PropertyForm } from "@/helper/schema/property.schema";
import { getErrorMessage } from "@/helper/apiError";
import { ALLOWED_IMAGE_TYPES, INDIAN_STATES, MAX_IMAGE_MB } from "@/helper/constants";
import type { Property } from "@/types/property.types";

interface PropertyFormDialogProps {
  visible: boolean;
  property: Property | null; // null = create, value = edit
  onHide: () => void;
  onSaved: () => void;
}

const EMPTY_FORM: PropertyForm = {
  name: "",
  address: "",
  pin: "",
  city: "",
  state: "",
  location: "",
  lat: "",
  long: "",
};

const toForm = (p: Property): PropertyForm => ({
  name: p.name,
  address: p.address,
  pin: p.pin,
  city: p.city,
  state: p.state,
  location: p.location,
  lat: String(p.lat),
  long: String(p.long),
});

const FORM_KEYS: Array<keyof PropertyForm> = [
  "name", "address", "pin", "city", "state", "location", "lat", "long",
];

export default function PropertyFormDialog({
  visible,
  property,
  onHide,
  onSaved,
}: PropertyFormDialogProps) {
  const isEdit = property !== null;
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [imageError, setImageError] = useState("");

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PropertyForm>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: EMPTY_FORM,
  });

  // dialog খুললে form reset
  useEffect(() => {
    if (!visible) return;
    reset(property ? toForm(property) : EMPTY_FORM);
    setFile(null);
    setImageError("");
  }, [visible, property, reset]);

  // নতুন file-এর preview
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
    setFile(selected);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location is not supported in this browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue("lat", pos.coords.latitude.toFixed(6), { shouldValidate: true });
        setValue("long", pos.coords.longitude.toFixed(6), { shouldValidate: true });
      },
      () => toast.error("Could not get your location. Allow location access and try again."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const onSubmit = async (data: PropertyForm) => {
    if (!isEdit && !file) {
      setImageError("Property image is required");
      return;
    }

    const formData = new FormData();
    FORM_KEYS.forEach((key) => formData.append(key, data[key]));
    if (file) formData.append("image", file);

    setSubmitting(true);
    try {
      const res = property
        ? await updateProperty(property.id, formData)
        : await createProperty(formData);
      toast.success(res.message);
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const shownImage = preview || property?.image || "";
  const invalid = (hasError: boolean) => `w-full ${hasError ? "p-invalid" : ""}`;
  const labelClass = "text-sm font-semibold text-slate-700";

  return (
    <Dialog
      header={isEdit ? "Edit Property" : "Add New Property"}
      visible={visible}
      onHide={() => !submitting && onHide()}
      style={{ width: "min(96vw, 720px)" }}
      contentStyle={{ maxHeight: "80vh" }}
      draggable={false}
      dismissableMask={false}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="p-name" className={labelClass}>
            Market complex name <span className="text-red-500">*</span>
          </label>
          <InputText id="p-name" {...register("name")} placeholder="e.g. Park Street Market" className={invalid(!!errors.name)} />
          {errors.name && <small className="text-red-500">{errors.name.message}</small>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="p-address" className={labelClass}>
            Address <span className="text-red-500">*</span>
          </label>
          <InputTextarea id="p-address" rows={2} {...register("address")} placeholder="Full address" className={invalid(!!errors.address)} />
          {errors.address && <small className="text-red-500">{errors.address.message}</small>}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label htmlFor="p-pin" className={labelClass}>
              PIN <span className="text-red-500">*</span>
            </label>
            <InputText id="p-pin" inputMode="numeric" maxLength={6} {...register("pin")} placeholder="6 digit PIN" className={invalid(!!errors.pin)} />
            {errors.pin && <small className="text-red-500">{errors.pin.message}</small>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="p-city" className={labelClass}>
              City <span className="text-red-500">*</span>
            </label>
            <InputText id="p-city" {...register("city")} placeholder="City" className={invalid(!!errors.city)} />
            {errors.city && <small className="text-red-500">{errors.city.message}</small>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="p-state" className={labelClass}>
              State <span className="text-red-500">*</span>
            </label>
            <Controller
              name="state"
              control={control}
              render={({ field }) => (
                <Dropdown
                  inputId="p-state"
                  value={field.value}
                  options={INDIAN_STATES}
                  onChange={(e) => field.onChange(e.value as string)}
                  placeholder="Select state"
                  filter
                  className={invalid(!!errors.state)}
                />
              )}
            />
            {errors.state && <small className="text-red-500">{errors.state.message}</small>}
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="p-location" className={labelClass}>
            Location / Landmark <span className="text-red-500">*</span>
          </label>
          <InputText id="p-location" {...register("location")} placeholder="e.g. Near City Center Bus Stand" className={invalid(!!errors.location)} />
          {errors.location && <small className="text-red-500">{errors.location.message}</small>}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-700">Map coordinates</p>
            <Button type="button" label="Use my location" icon="pi pi-map-marker" size="small" outlined onClick={useMyLocation} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="p-lat" className={labelClass}>
                Latitude <span className="text-red-500">*</span>
              </label>
              <InputText id="p-lat" inputMode="decimal" {...register("lat")} placeholder="e.g. 22.572646" className={invalid(!!errors.lat)} />
              {errors.lat && <small className="text-red-500">{errors.lat.message}</small>}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="p-long" className={labelClass}>
                Longitude <span className="text-red-500">*</span>
              </label>
              <InputText id="p-long" inputMode="decimal" {...register("long")} placeholder="e.g. 88.363895" className={invalid(!!errors.long)} />
              {errors.long && <small className="text-red-500">{errors.long.message}</small>}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClass}>
            Property image {!isEdit && <span className="text-red-500">*</span>}
          </label>
          {shownImage && (
            <img src={shownImage} alt="Property preview" className="h-40 w-full rounded-xl border border-slate-200 object-cover sm:w-72" />
          )}
          <input
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            onChange={handleFile}
            className="block w-full rounded-lg border border-slate-200 p-1.5 text-sm"
          />
          <p className="text-[11px] text-slate-400">
            JPG, PNG or WEBP, up to {MAX_IMAGE_MB}MB.{isEdit ? " Leave empty to keep the current image." : ""}
          </p>
          {imageError && <small className="block text-red-500">{imageError}</small>}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" label="Cancel" outlined severity="secondary" className="flex-1" disabled={submitting} onClick={onHide} />
          <Button
            type="submit"
            label={submitting ? "Saving..." : isEdit ? "Update Property" : "Create Property"}
            icon={submitting ? "pi pi-spin pi-spinner" : "pi pi-check"}
            className="flex-1"
            disabled={submitting}
          />
        </div>
      </form>
    </Dialog>
  );
}