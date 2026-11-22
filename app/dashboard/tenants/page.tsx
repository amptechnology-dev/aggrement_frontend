"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import type { DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { toast } from "react-toastify";
import { useAuth } from "@/components/AuthProvider";
import TenantFormDialog from "@/components/tenant/TenantFormDialog";
import { getTenants, updateTenantStatus } from "@/service/tenant.service";
import { getErrorMessage } from "@/helper/apiError";
import { formatDate } from "@/helper/format";
import type { GuardianRelation, Tenant } from "@/types/tenant.types";

const ROWS_OPTIONS: number[] = [10, 20, 50];

type StatusFilter = "" | "true" | "false";

interface StatusOption {
  label: string;
  value: StatusFilter;
}

const STATUS_OPTIONS: StatusOption[] = [
  { label: "All status", value: "" },
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

const RELATION_LABEL: Record<GuardianRelation, string> = {
  FATHER: "Father",
  HUSBAND: "Husband",
};

const guardianText = (t: Tenant): string =>
  t.guardianRelation
    ? `${t.guardianName} (${RELATION_LABEL[t.guardianRelation]})`
    : t.guardianName;

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

export default function TenantsPage() {
  const { user } = useAuth();
  const canManage = user?.role === "OWNER";
  const showOwner = user?.role === "SUPER_ADMIN";

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [reloadKey, setReloadKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [viewing, setViewing] = useState<Tenant | null>(null);

  const reqIdRef = useRef(0);

  const fetchTenants = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    setLoading(true);
    try {
      const res = await getTenants({
        page,
        limit: rows,
        ...(search ? { search } : {}),
        ...(status ? { isActive: status === "true" } : {}),
      });
      if (reqId !== reqIdRef.current) return;
      setTenants(res.tenants);
      setTotal(res.total);
    } catch (err) {
      if (reqId !== reqIdRef.current) return;
      toast.error(getErrorMessage(err));
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  }, [page, rows, search, status]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants, reloadKey]);

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

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (t: Tenant) => {
    setViewing(null);
    setEditing(t);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const handleSaved = () => {
    if (editing === null) setPage(1);
    closeForm();
    setReloadKey((k) => k + 1);
  };

  const confirmToggle = (t: Tenant) => {
    const next = !t.isActive;
    confirmDialog({
      header: next ? "Activate tenant" : "Deactivate tenant",
      message: next
        ? `Mark "${t.name}" as active again?`
        : `"${t.name}" will be marked inactive in your list. Their login and other owners are not affected.`,
      icon: "pi pi-exclamation-triangle",
      acceptClassName: next ? "p-button-success" : "p-button-danger",
      accept: async () => {
        try {
          const res = await updateTenantStatus(t.id, next);
          toast.success(res.message);
          setReloadKey((k) => k + 1);
        } catch (err) {
          toast.error(getErrorMessage(err));
        }
      },
    });
  };

  const nameCell = (t: Tenant) => (
    <div className="flex min-w-[170px] items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-bold uppercase text-teal-600">
        {t.name.charAt(0)}
      </span>
      <span className="truncate font-semibold text-slate-800">{t.name}</span>
    </div>
  );

  const contactCell = (t: Tenant) => (
    <div className="text-sm">
      <p className="text-slate-700">{t.email}</p>
      <p className="text-xs text-slate-500">{t.phone}</p>
    </div>
  );

  const actionCell = (t: Tenant) => (
    <div className="flex gap-1.5">
      <Button icon="pi pi-eye" rounded text severity="info" tooltip="View" tooltipOptions={{ position: "top" }} onClick={() => setViewing(t)} />
      {canManage && (
        <>
          <Button icon="pi pi-pencil" rounded text severity="secondary" tooltip="Edit" tooltipOptions={{ position: "top" }} onClick={() => openEdit(t)} />
          <Button
            icon={t.isActive ? "pi pi-ban" : "pi pi-check-circle"}
            rounded
            text
            severity={t.isActive ? "danger" : "success"}
            tooltip={t.isActive ? "Deactivate" : "Activate"}
            tooltipOptions={{ position: "top" }}
            onClick={() => confirmToggle(t)}
          />
        </>
      )}
    </div>
  );

  const hasFilter = !!(search || status);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Tenants</h2>
            <p className="text-sm text-slate-500">
              {total} {hasFilter ? "found" : "total"}
            </p>
          </div>
          {canManage && <Button label="Add Tenant" icon="pi pi-plus" onClick={openCreate} />}
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <span className="relative sm:col-span-2">
            <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
            <InputText
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, email, phone"
              className="w-full pl-9"
              aria-label="Search tenants"
            />
          </span>
          <Dropdown
            value={status}
            options={STATUS_OPTIONS}
            optionLabel="label"
            optionValue="value"
            onChange={(e) => {
              setStatus(e.value as StatusFilter);
              setPage(1);
            }}
            className="w-full"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <DataTable
          value={tenants}
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
          emptyMessage={
            hasFilter
              ? "No tenant matches your filters"
              : canManage
                ? "No tenants yet. Click 'Add Tenant' to create one."
                : "No tenants found."
          }
        >
          <Column header="#" body={(_: Tenant, opt) => (page - 1) * rows + opt.rowIndex + 1} style={{ width: "55px" }} />
          <Column header="Tenant" body={nameCell} />
          <Column header="Contact" body={contactCell} />
          <Column header="Guardian" body={(t: Tenant) => <span className="text-sm text-slate-600">{guardianText(t)}</span>} />
          {showOwner && <Column header="Owner" body={(t: Tenant) => t.owner?.name ?? "-"} />}
          <Column header="Status" body={(t: Tenant) => <StatusBadge active={t.isActive} />} />
          <Column header="Created" body={(t: Tenant) => formatDate(t.createdAt)} />
          <Column header="Actions" body={actionCell} style={{ width: "140px" }} />
        </DataTable>
      </div>

      {/* Create / Edit */}
      <TenantFormDialog visible={formOpen} tenant={editing} onHide={closeForm} onSaved={handleSaved} />

      {/* View */}
      <Dialog
        header="Tenant Details"
        visible={viewing !== null}
        onHide={() => setViewing(null)}
        style={{ width: "min(96vw, 600px)" }}
        contentStyle={{ maxHeight: "80vh" }}
        draggable={false}
        dismissableMask
      >
        {viewing && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-lg font-bold uppercase text-white">
                {viewing.name.charAt(0)}
              </span>
              <div>
                <p className="font-bold text-slate-800">{viewing.name}</p>
                <StatusBadge active={viewing.isActive} />
              </div>
            </div>

            <div className="grid gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-2">
              <DetailItem label="Email" value={viewing.email} />
              <DetailItem label="Contact number" value={viewing.phone} />
              <DetailItem label="Guardian's name" value={viewing.guardianName} />
              <DetailItem label="Relation" value={viewing.guardianRelation ? RELATION_LABEL[viewing.guardianRelation] : "-"} />
              <div className="sm:col-span-2">
                <DetailItem label="Address" value={viewing.address} />
              </div>
              <DetailItem label="Voter card number" value={viewing.voterCardNo ?? "-"} />
              {viewing.owner && <DetailItem label="Owner" value={viewing.owner.name} />}
              <DetailItem label="Added on" value={formatDate(viewing.createdAt)} />
            </div>

            {canManage && (
              <div className="flex justify-end">
                <Button label="Edit" icon="pi pi-pencil" onClick={() => openEdit(viewing)} />
              </div>
            )}
          </div>
        )}
      </Dialog>

      <ConfirmDialog />
    </div>
  );
}