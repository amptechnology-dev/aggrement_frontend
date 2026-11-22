"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { toast } from "react-toastify";
import { addTerm, deleteTerm, getSettings, updateSettings, updateTerm } from "@/service/settings.service";
import { settingsFormSchema } from "@/helper/schema/settings.schema";
import type { SettingsForm } from "@/helper/schema/settings.schema";
import { RULE_FIELDS } from "@/helper/schema/fields";
import { getErrorMessage } from "@/helper/apiError";
import type { OwnerSettings, SavedTerm } from "@/types/settings.types";

const EMPTY_FORM: SettingsForm = {
  officeName: "",
  officeAddress: "",
  lateFineAmountPerDay: "",
  lateFineAfterDay: "",
  validityYears: "",
  rentIncreaseEveryYears: "",
  rentIncreasePercent: "",
  stallCannotCloseForDays: "",
  noticePeriodMonths: "",
};

const toForm = (s: OwnerSettings): SettingsForm => ({
  officeName: s.officeName,
  officeAddress: s.officeAddress,
  lateFineAmountPerDay: String(s.lateFineAmountPerDay),
  lateFineAfterDay: String(s.lateFineAfterDay),
  validityYears: String(s.validityYears),
  rentIncreaseEveryYears: String(s.rentIncreaseEveryYears),
  rentIncreasePercent: String(s.rentIncreasePercent),
  stallCannotCloseForDays: String(s.stallCannotCloseForDays),
  noticePeriodMonths: String(s.noticePeriodMonths),
});

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [terms, setTerms] = useState<SavedTerm[]>([]);
  const [newTerm, setNewTerm] = useState("");
  const [termBusy, setTermBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    let cancelled = false;
    getSettings()
      .then((res) => {
        if (cancelled) return;
        reset(toForm(res.settings));
        setTerms(res.settings.savedTerms);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reset]);

  const onSave = async (data: SettingsForm) => {
    setSaving(true);
    try {
      const res = await updateSettings({
        officeName: data.officeName,
        officeAddress: data.officeAddress,
        lateFineAmountPerDay: Number(data.lateFineAmountPerDay),
        lateFineAfterDay: Number(data.lateFineAfterDay),
        validityYears: Number(data.validityYears),
        rentIncreaseEveryYears: Number(data.rentIncreaseEveryYears),
        rentIncreasePercent: Number(data.rentIncreasePercent),
        stallCannotCloseForDays: Number(data.stallCannotCloseForDays),
        noticePeriodMonths: Number(data.noticePeriodMonths),
      });
      reset(toForm(res.settings));
      toast.success(res.message ?? "Settings saved");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAddTerm = async () => {
    if (newTerm.trim().length < 5) {
      toast.error("A term must be at least 5 characters");
      return;
    }
    setTermBusy(true);
    try {
      const res = await addTerm(newTerm);
      setTerms(res.savedTerms);
      setNewTerm("");
      toast.success(res.message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTermBusy(false);
    }
  };

  const startEdit = (t: SavedTerm) => {
    setEditingId(t.id);
    setEditText(t.text);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (editText.trim().length < 5) {
      toast.error("A term must be at least 5 characters");
      return;
    }
    setTermBusy(true);
    try {
      const res = await updateTerm(editingId, editText);
      setTerms(res.savedTerms);
      setEditingId(null);
      toast.success(res.message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTermBusy(false);
    }
  };

  const confirmDelete = (t: SavedTerm) => {
    confirmDialog({
      header: "Remove saved term",
      message: "Remove this term from your library? Existing agreements keep their copy.",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          const res = await deleteTerm(t.id);
          setTerms(res.savedTerms);
          toast.success(res.message);
        } catch (err) {
          toast.error(getErrorMessage(err));
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <i className="pi pi-spin pi-spinner text-3xl text-teal-500" />
      </div>
    );
  }

  const invalid = (hasError: boolean) => `w-full ${hasError ? "p-invalid" : ""}`;
  const labelClass = "text-sm font-semibold text-slate-700";
  const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSave)} className="space-y-4" noValidate>
        <div className={card}>
          <h2 className="text-lg font-bold text-slate-800">Office details</h2>
          <p className="mb-4 text-sm text-slate-500">Printed on every new agreement.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="s-oname" className={labelClass}>Office name</label>
              <InputText id="s-oname" {...register("officeName")} className={invalid(!!errors.officeName)} />
              {errors.officeName && <small className="text-red-500">{errors.officeName.message}</small>}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="s-oaddr" className={labelClass}>Office address</label>
              <InputTextarea id="s-oaddr" rows={2} {...register("officeAddress")} className={invalid(!!errors.officeAddress)} />
              {errors.officeAddress && <small className="text-red-500">{errors.officeAddress.message}</small>}
            </div>
          </div>
        </div>

        <div className={card}>
          <h2 className="text-lg font-bold text-slate-800">Default agreement rules</h2>
          <p className="mb-4 text-sm text-slate-500">
            New agreements start with these values. Changing them does not affect agreements already created.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {RULE_FIELDS.map((f) => (
              <div key={f.name} className="space-y-1.5">
                <label htmlFor={`s-${f.name}`} className={labelClass}>{f.label}</label>
                <InputText id={`s-${f.name}`} inputMode="decimal" {...register(f.name)} className={invalid(!!errors[f.name])} />
                {errors[f.name] ? <small className="text-red-500">{errors[f.name]?.message}</small> : <small className="text-slate-400">{f.hint}</small>}
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-end">
            <Button type="submit" label={saving ? "Saving..." : "Save settings"} icon={saving ? "pi pi-spin pi-spinner" : "pi pi-check"} disabled={saving || !isDirty} />
          </div>
        </div>
      </form>

      <div className={card}>
        <h2 className="text-lg font-bold text-slate-800">Saved terms and conditions</h2>
        <p className="mb-4 text-sm text-slate-500">
          Terms you write in an agreement are saved here automatically. Pick them again for any other tenant.
        </p>

        {terms.length === 0 ? (
          <p className="mb-4 rounded-xl border border-dashed border-slate-300 py-6 text-center text-sm text-slate-400">
            No saved terms yet.
          </p>
        ) : (
          <ul className="mb-4 space-y-2">
            {terms.map((t) => (
              <li key={t.id} className="rounded-xl border border-slate-200 p-3">
                {editingId === t.id ? (
                  <div className="space-y-2">
                    <InputTextarea rows={3} value={editText} onChange={(e) => setEditText(e.target.value)} className="w-full" />
                    <div className="flex gap-2">
                      <Button type="button" label="Save" icon="pi pi-check" size="small" disabled={termBusy} onClick={saveEdit} />
                      <Button type="button" label="Cancel" size="small" outlined severity="secondary" onClick={() => setEditingId(null)} />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <p className="flex-1 whitespace-pre-line text-sm text-slate-700">{t.text}</p>
                    <Button type="button" icon="pi pi-pencil" rounded text severity="secondary" onClick={() => startEdit(t)} aria-label="Edit term" />
                    <Button type="button" icon="pi pi-trash" rounded text severity="danger" onClick={() => confirmDelete(t)} aria-label="Delete term" />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-2">
          <InputTextarea rows={2} value={newTerm} onChange={(e) => setNewTerm(e.target.value)} placeholder="Add a new term..." className="w-full" />
          <Button type="button" label="Add term" icon="pi pi-plus" size="small" disabled={termBusy} onClick={handleAddTerm} />
        </div>
      </div>

      <ConfirmDialog />
    </div>
  );
}