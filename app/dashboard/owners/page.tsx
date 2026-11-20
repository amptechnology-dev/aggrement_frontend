"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DataTable } from "primereact/datatable";
import type { DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { toast } from "react-toastify";
import {
  createOwner,
  getOwnerById,
  getOwners,
  updateOwnerStatus,
} from "@/service/owner.service";
import { createOwnerFormSchema } from "@/helper/schema/auth.schema";
import type { CreateOwnerForm } from "@/helper/schema/auth.schema";
import { getErrorMessage } from "@/helper/apiError";
import { formatDate, formatDateTime } from "@/helper/format";
import type { Owner } from "@/types/owner.types";

const ROWS_OPTIONS: number[] = [10, 20, 50];

const EMPTY_FORM: CreateOwnerForm = { name: "", email: "", phone: "", address: "" };

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 break-words text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

export default function OwnersPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewOwner, setViewOwner] = useState<Owner | null>(null);

  const reqIdRef = useRef(0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateOwnerForm>({
    resolver: zodResolver(createOwnerFormSchema),
    defaultValues: EMPTY_FORM,
  });

  // ---------- list ----------
  const fetchOwners = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    setLoading(true);
    try {
      const res = await getOwners({ page, limit: rows, ...(search ? { search } : {}) });
      if (reqId !== reqIdRef.current) return;
      setOwners(res.owners);
      setTotal(res.total);
    } catch (err) {
      if (reqId !== reqIdRef.current) return;
      toast.error(getErrorMessage(err));
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  }, [page, rows, search]);

  useEffect(() => {
    fetchOwners();
  }, [fetchOwners, reloadKey]);

  // search debounce
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const onPage = (e: DataTablePageEvent) => {
    setPage((e.page ?? 0) + 1);
    setRows(e.rows);
  };

  // ---------- create ----------
  const openCreate = () => {
    reset(EMPTY_FORM);
    setCreateOpen(true);
  };

  const onCreate = async (data: CreateOwnerForm) => {
    setSubmitting(true);
    try {
      const res = await createOwner(data);
      toast.success(res.message);
      setCreateOpen(false);
      reset(EMPTY_FORM);
      setPage(1);
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- view ----------
  const openView = async (ownerId: string) => {
    setViewOpen(true);
    setViewLoading(true);
    setViewOwner(null);
    try {
      const res = await getOwnerById(ownerId);
      setViewOwner(res.owner);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  // ---------- status ----------
  const confirmStatus = (owner: Owner) => {
    const next = !owner.isActive;
    confirmDialog({
      header: next ? "Activate owner" : "Deactivate owner",
      message: next
        ? `Allow "${owner.name}" to log in again?`
        : `"${owner.name}" will not be able to log in until activated again.`,
      icon: "pi pi-exclamation-triangle",
      acceptClassName: next ? "p-button-success" : "p-button-danger",
      accept: async () => {
        try {
          const res = await updateOwnerStatus(owner.id, next);
          toast.success(res.message);
          setReloadKey((k) => k + 1);
        } catch (err) {
          toast.error(getErrorMessage(err));
        }
      },
    });
  };

  // ---------- table cells ----------
  const nameCell = (o: Owner) => (
    <div className="flex min-w-[180px] items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-bold uppercase text-teal-600">
        {o.name.charAt(0)}
      </span>
      <span className="truncate font-semibold text-slate-800">{o.name}</span>
    </div>
  );

  const contactCell = (o: Owner) => (
    <div className="text-sm">
      <p className="text-slate-700">{o.email}</p>
      <p className="text-xs text-slate-500">{o.phone}</p>
    </div>
  );

  const actionCell = (o: Owner) => (
    <div className="flex gap-1.5">
      <Button
        icon="pi pi-eye"
        rounded
        text
        severity="info"
        tooltip="View"
        tooltipOptions={{ position: "top" }}
        onClick={() => openView(o.id)}
      />
      <Button
        icon={o.isActive ? "pi pi-ban" : "pi pi-check-circle"}
        rounded
        text
        severity={o.isActive ? "danger" : "success"}
        tooltip={o.isActive ? "Deactivate" : "Activate"}
        tooltipOptions={{ position: "top" }}
        onClick={() => confirmStatus(o)}
      />
    </div>
  );

  const fieldClass = (hasError: boolean) => `w-full ${hasError ? "p-invalid" : ""}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Owners</h2>
          <p className="text-sm text-slate-500">
            {total} {search ? "found" : "total"}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="relative">
            <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
            <InputText
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, email, phone"
              className="w-full pl-9 sm:w-72"
              aria-label="Search owners"
            />
          </span>
          <Button label="Add Owner" icon="pi pi-plus" onClick={openCreate} />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <DataTable
          value={owners}
          lazy
          paginator
          first={(page - 1) * rows}
          rows={rows}
          totalRecords={total}
          rowsPerPageOptions={ROWS_OPTIONS}
          onPage={onPage}
          loading={loading}
          dataKey="id"
          responsiveLayout="scroll"
          emptyMessage={search ? `No owner matches "${search}"` : "No owners yet. Click 'Add Owner' to create one."}
        >
          <Column header="#" body={(_: Owner, opt) => (page - 1) * rows + opt.rowIndex + 1} style={{ width: "55px" }} />
          <Column header="Owner" body={nameCell} />
          <Column header="Contact" body={contactCell} />
          <Column header="Address" body={(o: Owner) => <span className="line-clamp-2 text-sm text-slate-600">{o.address}</span>} />
          <Column header="Status" body={(o: Owner) => <StatusBadge active={o.isActive} />} />
          <Column header="Created" body={(o: Owner) => formatDate(o.createdAt)} />
          <Column header="Actions" body={actionCell} style={{ width: "110px" }} />
        </DataTable>
      </div>

      {/* Create dialog */}
      <Dialog
        header="Add New Owner"
        visible={createOpen}
        onHide={() => !submitting && setCreateOpen(false)}
        style={{ width: "min(94vw, 520px)" }}
        draggable={false}
        dismissableMask={false}
      >
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4 pt-1" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="o-name" className="text-sm font-semibold text-slate-700">
              Full name <span className="text-red-500">*</span>
            </label>
            <InputText id="o-name" {...register("name")} placeholder="e.g. Ram Das" className={fieldClass(!!errors.name)} />
            {errors.name && <small className="text-red-500">{errors.name.message}</small>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="o-email" className="text-sm font-semibold text-slate-700">
              Email <span className="text-red-500">*</span>
            </label>
            <InputText id="o-email" type="email" {...register("email")} placeholder="owner@example.com" className={fieldClass(!!errors.email)} />
            {errors.email && <small className="text-red-500">{errors.email.message}</small>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="o-phone" className="text-sm font-semibold text-slate-700">
              Contact number <span className="text-red-500">*</span>
            </label>
            <InputText id="o-phone" inputMode="numeric" maxLength={10} {...register("phone")} placeholder="10 digit mobile number" className={fieldClass(!!errors.phone)} />
            {errors.phone && <small className="text-red-500">{errors.phone.message}</small>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="o-address" className="text-sm font-semibold text-slate-700">
              Address <span className="text-red-500">*</span>
            </label>
            <InputTextarea id="o-address" rows={3} {...register("address")} placeholder="Full address" className={fieldClass(!!errors.address)} />
            {errors.address && <small className="text-red-500">{errors.address.message}</small>}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" label="Cancel" outlined severity="secondary" className="flex-1" disabled={submitting} onClick={() => setCreateOpen(false)} />
            <Button type="submit" label={submitting ? "Creating..." : "Create Owner"} icon={submitting ? "pi pi-spin pi-spinner" : "pi pi-check"} className="flex-1" disabled={submitting} />
          </div>
        </form>
      </Dialog>

      {/* View dialog */}
      <Dialog
        header="Owner Details"
        visible={viewOpen}
        onHide={() => setViewOpen(false)}
        style={{ width: "min(94vw, 560px)" }}
        draggable={false}
        dismissableMask
      >
        {viewLoading || !viewOwner ? (
          <div className="flex justify-center py-10">
            <i className="pi pi-spin pi-spinner text-2xl text-teal-500" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-lg font-bold uppercase text-white">
                {viewOwner.name.charAt(0)}
              </span>
              <div>
                <p className="font-bold text-slate-800">{viewOwner.name}</p>
                <StatusBadge active={viewOwner.isActive} />
              </div>
            </div>

            <div className="grid gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-2">
              <DetailItem label="Email" value={viewOwner.email} />
              <DetailItem label="Contact number" value={viewOwner.phone} />
              <div className="sm:col-span-2">
                <DetailItem label="Address" value={viewOwner.address} />
              </div>
              <DetailItem label="Email verified" value={viewOwner.isVerified ? "Yes" : "Not yet (verified on first login)"} />
              <DetailItem label="Last login" value={formatDateTime(viewOwner.lastLoginAt)} />
              <DetailItem label="Created by" value={viewOwner.createdBy?.name ?? "-"} />
              <DetailItem label="Created on" value={formatDate(viewOwner.createdAt)} />
            </div>
          </div>
        )}
      </Dialog>

      <ConfirmDialog />
    </div>
  );
}