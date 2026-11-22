"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "primereact/dialog";
import { toast } from "react-toastify";
import RentScheduleTable from "@/components/agreement/RentScheduleTable";
import { createAgreement } from "@/service/agreement.service";
import { getTenants } from "@/service/tenant.service";
import { getStalls } from "@/service/stall.service";
import { getSettings } from "@/service/settings.service";
import { agreementFormSchema } from "@/helper/schema/agreement.schema";
import type {
  AgreementForm,
  AgreementFormInput,
} from "@/helper/schema/agreement.schema";
import { RULE_FIELDS } from "@/helper/schema/fields";
import { previewSchedule } from "@/helper/rentSchedule";
import { getErrorMessage } from "@/helper/apiError";
import { formatDate } from "@/helper/format";
import type { SavedTerm } from "@/types/settings.types";
import type { Tenant } from "@/types/tenant.types";

interface AgreementFormDialogProps {
  visible: boolean;
  onHide: () => void;
  onSaved: () => void;
}

interface Option {
  label: string;
  value: string;
}

const RELATION_OPTIONS: Option[] = [
  { label: "Father", value: "FATHER" },
  { label: "Husband", value: "HUSBAND" },
];

const today = (): string => new Date().toISOString().slice(0, 10);

const EMPTY_FORM: AgreementFormInput = {
  tenantId: "",
  stallId: "",
  agreementDate: "",
  effectiveFrom: "",
  monthlyRent: "",
  depositAmount: "",
  guardianRelation: "",
  voterCardNo: "",
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

const normalize = (s: string): string =>
  s.replace(/\s+/g, " ").trim().toLowerCase();

const cx = (...c: Array<string | false | undefined>) => c.filter(Boolean).join(" ");

const inputClass = (hasError: boolean) => cx("op-input", hasError && "is-invalid");

/* ---------- small presentational helpers ---------- */
function SectionTitle({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <h3 className="af-box__title">
      <span className="af-box__icon">{icon}</span>
      {children}
    </h3>
  );
}

function SelectField({
  options,
  placeholder,
  ...rest
}: {
  options: Option[];
  placeholder: string;
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "className">) {
  const hasError = rest["aria-invalid"] === true || rest["aria-invalid"] === "true";
  return (
    <div className="af-select">
      <select {...rest} className={inputClass(hasError)}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <i className="pi pi-chevron-down" />
    </div>
  );
}

export default function AgreementFormDialog({
  visible,
  onHide,
  onSaved,
}: AgreementFormDialogProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stallOptions, setStallOptions] = useState<Option[]>([]);
  const [savedTerms, setSavedTerms] = useState<SavedTerm[]>([]);
  const [terms, setTerms] = useState<string[]>([]);
  const [newTerm, setNewTerm] = useState("");
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
  } = useForm<AgreementFormInput, undefined, AgreementForm>({
    resolver: zodResolver(agreementFormSchema),
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    setTerms([]);
    setNewTerm("");
    setLoadingData(true);
    reset({ ...EMPTY_FORM, agreementDate: today(), effectiveFrom: today() });

    Promise.all([
      getTenants({ page: 1, limit: 100, isActive: true }),
      getStalls({ page: 1, limit: 100, status: "VACANT" }),
      getSettings(),
    ])
      .then(([tenantRes, stallRes, settingsRes]) => {
        if (cancelled) return;
        const s = settingsRes.settings;

        setTenants(tenantRes.tenants);
        setStallOptions(
          stallRes.stalls
            .filter((st) => st.isActive)
            .map((st) => ({
              label: `${st.stallNo} - ${st.property?.name ?? ""}`,
              value: st.id,
            })),
        );
        setSavedTerms(s.savedTerms);

        reset({
          ...EMPTY_FORM,
          agreementDate: today(),
          effectiveFrom: today(),
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
  }, [visible, reset]);

  const tenantOptions: Option[] = useMemo(
    () => tenants.map((t) => ({ label: `${t.name} (${t.phone})`, value: t.id })),
    [tenants],
  );

  const selectedTenantId = watch("tenantId");
  const selectedTenant = tenants.find((t) => t.id === selectedTenantId) ?? null;

  const [rent, from, years, every, percent] = watch([
    "monthlyRent",
    "effectiveFrom",
    "validityYears",
    "rentIncreaseEveryYears",
    "rentIncreasePercent",
  ]);
  const preview = useMemo(
    () =>
      previewSchedule({
        monthlyRent: rent,
        effectiveFrom: from,
        validityYears: years,
        rentIncreaseEveryYears: every,
        rentIncreasePercent: percent,
      }),
    [rent, from, years, every, percent],
  );

  const handleTenantChange = (id: string) => {
    setValue("tenantId", id, { shouldValidate: true });
    const t = tenants.find((x) => x.id === id);
    if (!t) return;
    setValue("guardianRelation", t.guardianRelation ?? "", { shouldValidate: true });
    setValue("voterCardNo", t.voterCardNo ?? "", { shouldValidate: true });
  };

  // ---------- terms ----------
  const addTermText = (text: string): boolean => {
    const clean = text.trim();
    if (clean.length < 5) {
      toast.error("A term must be at least 5 characters");
      return false;
    }
    if (terms.some((t) => normalize(t) === normalize(clean))) {
      toast.error("This term is already added");
      return false;
    }
    setTerms((prev) => [...prev, clean]);
    return true;
  };

  const addNewTerm = () => {
    if (addTermText(newTerm)) setNewTerm("");
  };

  const availableSaved: Option[] = savedTerms
    .filter((st) => !terms.some((t) => normalize(t) === normalize(st.text)))
    .map((st) => ({
      label: st.text.length > 90 ? `${st.text.slice(0, 90)}...` : st.text,
      value: st.text,
    }));

  const addAllSaved = () => {
    setTerms((prev) => {
      const known = new Set(prev.map(normalize));
      const extra = savedTerms
        .map((s) => s.text)
        .filter((t) => !known.has(normalize(t)));
      return [...prev, ...extra];
    });
  };

  const removeTerm = (index: number) =>
    setTerms((prev) => prev.filter((_, i) => i !== index));

  // ---------- submit ----------
  const onSubmit = async (data: AgreementForm) => {
    // "Add" na chepe likhe rakhleo term harabe na
    const pending = newTerm.trim();
    const finalTerms =
      pending.length >= 5 && !terms.some((t) => normalize(t) === normalize(pending))
        ? [...terms, pending]
        : terms;

    setSubmitting(true);
    try {
      const res = await createAgreement({
        tenantId: data.tenantId,
        stallId: data.stallId,
        agreementDate: data.agreementDate,
        effectiveFrom: data.effectiveFrom,
        monthlyRent: data.monthlyRent,
        depositAmount: data.depositAmount,
        guardianRelation: data.guardianRelation,
        voterCardNo: data.voterCardNo,
        officeName: data.officeName,
        officeAddress: data.officeAddress,
        lateFineAmountPerDay: data.lateFineAmountPerDay,
        lateFineAfterDay: data.lateFineAfterDay,
        validityYears: data.validityYears,
        rentIncreaseEveryYears: data.rentIncreaseEveryYears,
        rentIncreasePercent: data.rentIncreasePercent,
        stallCannotCloseForDays: data.stallCannotCloseForDays,
        noticePeriodMonths: data.noticePeriodMonths,
        terms: finalTerms,
      });
      toast.success(`${res.message} (${res.agreement.agreementNo})`);
      if (res.newTermsSaved && res.newTermsSaved > 0) {
        toast.info(
          `${res.newTermsSaved} new term(s) saved to your library for future agreements`,
        );
      }
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const req = <span>*</span>;

  return (
    <Dialog
      header="Create Agreement"
      visible={visible}
      onHide={() => !submitting && onHide()}
      style={{ width: "min(98vw, 900px)" }}
      contentStyle={{ maxHeight: "82vh" }}
      className="op-dialog"
      draggable={false}
      dismissableMask={false}
    >
      {loadingData ? (
        <div className="op-loading">
          <i className="pi pi-spin pi-spinner" />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="af" noValidate>
          {/* 1. Tenant & stall */}
          <section className="af-box">
            <SectionTitle icon={<i className="pi pi-users" />}>Tenant and stall</SectionTitle>

            <div className="af-grid af-grid--2">
              <div className="op-field">
                <label htmlFor="a-tenant" className="op-label">
                  Tenant {req}
                </label>
                <Controller
                  name="tenantId"
                  control={control}
                  render={({ field }) => (
                    <SelectField
                      id="a-tenant"
                      value={field.value}
                      options={tenantOptions}
                      aria-invalid={!!errors.tenantId}
                      onChange={(e) => handleTenantChange(e.target.value)}
                      placeholder={
                        tenantOptions.length === 0 ? "No active tenant found" : "Select tenant"
                      }
                    />
                  )}
                />
                {errors.tenantId && <small className="op-error">{errors.tenantId.message}</small>}
              </div>

              <div className="op-field">
                <label htmlFor="a-stall" className="op-label">
                  Stall {req}
                </label>
                <Controller
                  name="stallId"
                  control={control}
                  render={({ field }) => (
                    <SelectField
                      id="a-stall"
                      value={field.value}
                      options={stallOptions}
                      aria-invalid={!!errors.stallId}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder={
                        stallOptions.length === 0
                          ? "No vacant stall available"
                          : "Select vacant stall"
                      }
                    />
                  )}
                />
                {errors.stallId && <small className="op-error">{errors.stallId.message}</small>}
              </div>
            </div>

            {selectedTenant && (
              <div className="af-info">
                <div className="op-detail">
                  <p className="op-detail__label">Guardian</p>
                  <p className="op-detail__value">{selectedTenant.guardianName}</p>
                </div>
                <div className="op-detail">
                  <p className="op-detail__label">Address</p>
                  <p className="op-detail__value">{selectedTenant.address}</p>
                </div>
              </div>
            )}

            <div className="af-grid af-grid--2">
              <div className="op-field">
                <label htmlFor="a-relation" className="op-label">
                  Father / Husband {req}
                </label>
                <Controller
                  name="guardianRelation"
                  control={control}
                  render={({ field }) => (
                    <SelectField
                      id="a-relation"
                      value={field.value}
                      options={RELATION_OPTIONS}
                      aria-invalid={!!errors.guardianRelation}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="Select relation"
                    />
                  )}
                />
                {errors.guardianRelation && (
                  <small className="op-error">{errors.guardianRelation.message}</small>
                )}
              </div>

              <div className="op-field">
                <label htmlFor="a-voter" className="op-label">
                  Voter card number {req}
                </label>
                <input
                  id="a-voter"
                  maxLength={10}
                  {...register("voterCardNo")}
                  placeholder="ABC1234567"
                  className={inputClass(!!errors.voterCardNo)}
                />
                {errors.voterCardNo && (
                  <small className="op-error">{errors.voterCardNo.message}</small>
                )}
              </div>
            </div>
          </section>

          {/* 2. Office */}
          <section className="af-box">
            <SectionTitle icon={<i className="pi pi-building" />}>Office details</SectionTitle>
            <div className="af-grid af-grid--2">
              <div className="op-field">
                <label htmlFor="a-oname" className="op-label">
                  Office name {req}
                </label>
                <input
                  id="a-oname"
                  {...register("officeName")}
                  className={inputClass(!!errors.officeName)}
                />
                {errors.officeName && (
                  <small className="op-error">{errors.officeName.message}</small>
                )}
              </div>
              <div className="op-field">
                <label htmlFor="a-oaddr" className="op-label">
                  Office address {req}
                </label>
                <textarea
                  id="a-oaddr"
                  rows={2}
                  {...register("officeAddress")}
                  className={inputClass(!!errors.officeAddress)}
                />
                {errors.officeAddress && (
                  <small className="op-error">{errors.officeAddress.message}</small>
                )}
              </div>
            </div>
            <p className="af-box__foot">
              Set these once in Settings to avoid typing them every time.
            </p>
          </section>

          {/* 3. Rent */}
          <section className="af-box">
            <SectionTitle icon="₹">Rent and deposit</SectionTitle>
            <div className="af-grid af-grid--4">
              <div className="op-field">
                <label htmlFor="a-date" className="op-label">
                  Agreement date {req}
                </label>
                <input
                  id="a-date"
                  type="date"
                  {...register("agreementDate")}
                  className={inputClass(!!errors.agreementDate)}
                />
                {errors.agreementDate && (
                  <small className="op-error">{errors.agreementDate.message}</small>
                )}
              </div>
              <div className="op-field">
                <label htmlFor="a-from" className="op-label">
                  Rent effective from {req}
                </label>
                <input
                  id="a-from"
                  type="date"
                  {...register("effectiveFrom")}
                  className={inputClass(!!errors.effectiveFrom)}
                />
                {errors.effectiveFrom && (
                  <small className="op-error">{errors.effectiveFrom.message}</small>
                )}
              </div>
              <div className="op-field">
                <label htmlFor="a-rent" className="op-label">
                  Monthly rent (₹) {req}
                </label>
                <input
                  id="a-rent"
                  inputMode="decimal"
                  {...register("monthlyRent")}
                  placeholder="700"
                  className={inputClass(!!errors.monthlyRent)}
                />
                {errors.monthlyRent && (
                  <small className="op-error">{errors.monthlyRent.message}</small>
                )}
              </div>
              <div className="op-field">
                <label htmlFor="a-dep" className="op-label">
                  Deposit (₹) {req}
                </label>
                <input
                  id="a-dep"
                  inputMode="decimal"
                  {...register("depositAmount")}
                  placeholder="50000"
                  className={inputClass(!!errors.depositAmount)}
                />
                {errors.depositAmount && (
                  <small className="op-error">{errors.depositAmount.message}</small>
                )}
              </div>
            </div>
          </section>

          {/* 4. Rules */}
          <section className="af-box">
            <SectionTitle icon={<i className="pi pi-sliders-h" />}>Agreement rules</SectionTitle>
            <p className="af-box__note">
              Filled from your Settings. Changing a value here affects only this agreement.
            </p>
            <div className="af-grid af-grid--3">
              {RULE_FIELDS.map((f) => (
                <div key={f.name} className="op-field">
                  <label htmlFor={`a-${f.name}`} className="op-label">
                    {f.label}
                  </label>
                  <input
                    id={`a-${f.name}`}
                    inputMode="decimal"
                    {...register(f.name)}
                    className={inputClass(!!errors[f.name])}
                  />
                  {errors[f.name] ? (
                    <small className="op-error">{errors[f.name]?.message}</small>
                  ) : (
                    <small className="af-hint">{f.hint}</small>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 5. Schedule preview */}
          {preview && (
            <section>
              <SectionTitle icon={<i className="pi pi-chart-line" />}>
                Rent schedule preview{" "}
                <span className="af-box__aside">
                  (agreement ends {formatDate(preview.endDate)})
                </span>
              </SectionTitle>
              <RentScheduleTable periods={preview.periods} />
            </section>
          )}

          {/* 6. Terms */}
          <section className="af-box">
            <SectionTitle icon={<i className="pi pi-list" />}>Terms and conditions</SectionTitle>

            {terms.length === 0 ? (
              <p className="af-empty">No terms added yet.</p>
            ) : (
              <ol className="af-terms">
                {terms.map((t, i) => (
                  <li key={`${i}-${t.slice(0, 12)}`} className="af-term">
                    <span className="af-term__no">{i + 1}.</span>
                    <span className="af-term__text">{t}</span>
                    <button
                      type="button"
                      className="af-term__remove"
                      onClick={() => removeTerm(i)}
                      aria-label="Remove term"
                    >
                      <i className="pi pi-times" />
                    </button>
                  </li>
                ))}
              </ol>
            )}

            {savedTerms.length > 0 && (
              <div className="af-saved">
                <div className="af-select">
                  <select
                    value=""
                    className="op-input"
                    disabled={availableSaved.length === 0}
                    aria-label="Add from saved terms"
                    onChange={(e) => {
                      if (e.target.value) addTermText(e.target.value);
                    }}
                  >
                    <option value="">
                      {availableSaved.length === 0
                        ? "All saved terms are added"
                        : "Add from your saved terms"}
                    </option>
                    {availableSaved.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <i className="pi pi-chevron-down" />
                </div>
                <button
                  type="button"
                  className="op-btn op-btn--outline"
                  disabled={availableSaved.length === 0}
                  onClick={addAllSaved}
                >
                  <i className="pi pi-plus" />
                  Add all saved
                </button>
              </div>
            )}

            <div className="af-addterm" style={{ width: "100%" }}>
              <textarea
                rows={2}
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="Write a new term..."
                className="op-input"
              />
              <button type="button" className="op-btn op-btn--outline op-btn--sm" onClick={addNewTerm}>
                <i className="pi pi-plus" />
                Add term
              </button>
              <p className="af-box__foot" style={{ margin: 0 }}>
                New terms are saved to your library automatically, so you can reuse them for other
                tenants.
              </p>
            </div>
          </section>

          {/* Footer */}
          <div className="op-form__foot">
            <button
              type="button"
              className="op-btn op-btn--ghost op-btn--block"
              disabled={submitting}
              onClick={onHide}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="op-btn op-btn--primary op-btn--block"
              disabled={submitting}
            >
              <i className={`pi ${submitting ? "pi-spin pi-spinner" : "pi-check"}`} />
              {submitting ? "Creating..." : "Create Agreement"}
            </button>
          </div>
        </form>
      )}
    </Dialog>
  );
}