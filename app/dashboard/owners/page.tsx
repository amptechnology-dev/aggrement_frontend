"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DataTable } from "primereact/datatable";
import type { DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
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

const cx = (...c: Array<string | false | undefined>) => c.filter(Boolean).join(" ");

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={cx("op-badge", active ? "op-badge--on" : "op-badge--off")}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="op-detail">
      <p className="op-detail__label">{label}</p>
      <p className="op-detail__value">{value}</p>
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
  const indexCell = (_: Owner, opt: { rowIndex: number }) => (
    <span className="op-idx">{(page - 1) * rows + opt.rowIndex + 1}</span>
  );

  const nameCell = (o: Owner) => (
    <div className="op-owner">
      <span className="op-avatar">{o.name.charAt(0)}</span>
      <span className="op-owner__name">{o.name}</span>
    </div>
  );

  const contactCell = (o: Owner) => (
    <div className="op-contact">
      <span className="op-contact__line">
        <i className="pi pi-envelope" />
        {o.email}
      </span>
      <span className="op-contact__line op-contact__line--muted">
        <i className="pi pi-phone" />
        {o.phone}
      </span>
    </div>
  );

  const addressCell = (o: Owner) => <span className="op-addr">{o.address}</span>;

  const statusCell = (o: Owner) => <StatusBadge active={o.isActive} />;

  const dateCell = (o: Owner) => <span className="op-date">{formatDate(o.createdAt)}</span>;

  const actionCell = (o: Owner) => (
    <div className="op-actions">
      <button
        type="button"
        className="op-iconbtn op-iconbtn--view"
        title="View details"
        aria-label={`View ${o.name}`}
        onClick={() => openView(o.id)}
      >
        <i className="pi pi-eye" />
      </button>
      <button
        type="button"
        className={cx("op-iconbtn", o.isActive ? "op-iconbtn--danger" : "op-iconbtn--success")}
        title={o.isActive ? "Deactivate" : "Activate"}
        aria-label={`${o.isActive ? "Deactivate" : "Activate"} ${o.name}`}
        onClick={() => confirmStatus(o)}
      >
        <i className={`pi ${o.isActive ? "pi-ban" : "pi-check-circle"}`} />
      </button>
    </div>
  );

  const emptyState = (
    <div className="op-empty">
      <span className="op-empty__icon">
        <i className={`pi ${search ? "pi-search" : "pi-id-card"}`} />
      </span>
      <p className="op-empty__title">{search ? "No owners found" : "No owners yet"}</p>
      <p className="op-empty__text">
        {search
          ? `Nothing matches "${search}". Try a different keyword.`
          : "Click 'Add Owner' to create the first one."}
      </p>
    </div>
  );

  const inputClass = (hasError: boolean) => cx("op-input", hasError && "is-invalid");

  return (
    <div className="op">
      {/* Header */}
      <div className="op-head">
        <div className="op-head__left">
          <span className="op-head__icon">
            <i className="pi pi-id-card" />
          </span>
          <div style={{ minWidth: 0 }}>
            <h2 className="op-head__title">Owners</h2>
            <p className="op-head__sub">
              <strong>{total}</strong> {search ? "found" : "total"}
            </p>
          </div>
        </div>

        <div className="op-head__right">
          <div className="op-search">
            <i className="pi pi-search" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, email, phone"
              className="op-search__input"
              aria-label="Search owners"
            />
            {searchInput && (
              <button
                type="button"
                className="op-search__clear"
                onClick={() => setSearchInput("")}
                aria-label="Clear search"
              >
                <i className="pi pi-times" />
              </button>
            )}
          </div>

          <button type="button" className="op-btn op-btn--primary" onClick={openCreate}>
            <i className="pi pi-plus" />
            Add Owner
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="op-card">
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
          emptyMessage={emptyState}
        >
          <Column header="#" body={indexCell} style={{ width: "56px" }} />
          <Column header="Owner" body={nameCell} />
          <Column header="Contact" body={contactCell} />
          <Column header="Address" body={addressCell} />
          <Column header="Status" body={statusCell} />
          <Column header="Created" body={dateCell} />
          <Column header="Actions" body={actionCell} style={{ width: "110px" }} />
        </DataTable>
      </div>

      {/* Create dialog */}
      <Dialog
        header="Add New Owner"
        visible={createOpen}
        onHide={() => !submitting && setCreateOpen(false)}
        style={{ width: "min(94vw, 520px)" }}
        className="op-dialog"
        draggable={false}
        dismissableMask={false}
      >
        <form onSubmit={handleSubmit(onCreate)} className="op-form" noValidate>
          <div className="op-field">
            <label htmlFor="o-name" className="op-label">
              Full name <span>*</span>
            </label>
            <input
              id="o-name"
              {...register("name")}
              placeholder="e.g. Ram Das"
              className={inputClass(!!errors.name)}
            />
            {errors.name && <small className="op-error">{errors.name.message}</small>}
          </div>

          <div className="op-field">
            <label htmlFor="o-email" className="op-label">
              Email <span>*</span>
            </label>
            <input
              id="o-email"
              type="email"
              {...register("email")}
              placeholder="owner@example.com"
              className={inputClass(!!errors.email)}
            />
            {errors.email && <small className="op-error">{errors.email.message}</small>}
          </div>

          <div className="op-field">
            <label htmlFor="o-phone" className="op-label">
              Contact number <span>*</span>
            </label>
            <input
              id="o-phone"
              inputMode="numeric"
              maxLength={10}
              {...register("phone")}
              placeholder="10 digit mobile number"
              className={inputClass(!!errors.phone)}
            />
            {errors.phone && <small className="op-error">{errors.phone.message}</small>}
          </div>

          <div className="op-field">
            <label htmlFor="o-address" className="op-label">
              Address <span>*</span>
            </label>
            <textarea
              id="o-address"
              rows={3}
              {...register("address")}
              placeholder="Full address"
              className={inputClass(!!errors.address)}
            />
            {errors.address && <small className="op-error">{errors.address.message}</small>}
          </div>

          <div className="op-form__foot">
            <button
              type="button"
              className="op-btn op-btn--ghost op-btn--block"
              disabled={submitting}
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="op-btn op-btn--primary op-btn--block" disabled={submitting}>
              <i className={`pi ${submitting ? "pi-spin pi-spinner" : "pi-check"}`} />
              {submitting ? "Creating..." : "Create Owner"}
            </button>
          </div>
        </form>
      </Dialog>

      {/* View dialog */}
      <Dialog
        header="Owner Details"
        visible={viewOpen}
        onHide={() => setViewOpen(false)}
        style={{ width: "min(94vw, 560px)" }}
        className="op-dialog"
        draggable={false}
        dismissableMask
      >
        {viewLoading || !viewOwner ? (
          <div className="op-loading">
            <i className="pi pi-spin pi-spinner" />
          </div>
        ) : (
          <div>
            <div className="op-view__top">
              <span className="op-avatar op-avatar--lg">{viewOwner.name.charAt(0)}</span>
              <div>
                <p className="op-view__name">{viewOwner.name}</p>
                <StatusBadge active={viewOwner.isActive} />
              </div>
            </div>

            <div className="op-view__grid">
              <DetailItem label="Email" value={viewOwner.email} />
              <DetailItem label="Contact number" value={viewOwner.phone} />
              <div className="op-view__full">
                <DetailItem label="Address" value={viewOwner.address} />
              </div>
              <DetailItem
                label="Email verified"
                value={viewOwner.isVerified ? "Yes" : "Not yet (verified on first login)"}
              />
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