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
import StallFormDialog from "@/components/stall/StallFormDialog";
import { getStalls, updateStallStatus } from "@/service/stall.service";
import { getProperties } from "@/service/property.service";
import { getErrorMessage } from "@/helper/apiError";
import { formatDate } from "@/helper/format";
import type { Stall, StallStatus } from "@/types/stall.types";

const ROWS_OPTIONS: number[] = [10, 20, 50];

interface FilterOption<T> {
  label: string;
  value: T;
}

const STATUS_OPTIONS: FilterOption<StallStatus | "">[] = [
  { label: "All status", value: "" },
  { label: "Vacant", value: "VACANT" },
  { label: "Occupied", value: "OCCUPIED" },
];

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function OccupancyBadge({ status }: { status: StallStatus }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        status === "OCCUPIED" ? "bg-amber-50 text-amber-700" : "bg-sky-50 text-sky-700"
      }`}
    >
      {status === "OCCUPIED" ? "Occupied" : "Vacant"}
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

export default function StallsPage() {
  const { user } = useAuth();
  const canManage = user?.role === "OWNER";
  const showOwner = user?.role === "SUPER_ADMIN";

  const [stalls, setStalls] = useState<Stall[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [status, setStatus] = useState<StallStatus | "">("");
  const [propertyOptions, setPropertyOptions] = useState<FilterOption<string>[]>([
    { label: "All properties", value: "" },
  ]);
  const [reloadKey, setReloadKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Stall | null>(null);
  const [viewing, setViewing] = useState<Stall | null>(null);

  const reqIdRef = useRef(0);

  // filter-এর জন্য property list
  useEffect(() => {
    let cancelled = false;
    getProperties({ page: 1, limit: 100 })
      .then((res) => {
        if (cancelled) return;
        setPropertyOptions([
          { label: "All properties", value: "" },
          ...res.properties.map((p) => ({ label: p.name, value: p.id })),
        ]);
      })
      .catch((err) => {
        if (!cancelled) toast.error(getErrorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchStalls = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    setLoading(true);
    try {
      const res = await getStalls({
        page,
        limit: rows,
        ...(search ? { search } : {}),
        ...(propertyId ? { propertyId } : {}),
        ...(status ? { status } : {}),
      });
      if (reqId !== reqIdRef.current) return;
      setStalls(res.stalls);
      setTotal(res.total);
    } catch (err) {
      if (reqId !== reqIdRef.current) return;
      toast.error(getErrorMessage(err));
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  }, [page, rows, search, propertyId, status]);

  useEffect(() => {
    fetchStalls();
  }, [fetchStalls, reloadKey]);

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

  const openEdit = (s: Stall) => {
    setViewing(null);
    setEditing(s);
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

  const confirmToggle = (s: Stall) => {
    const next = !s.isActive;
    confirmDialog({
      header: next ? "Activate stall" : "Deactivate stall",
      message: next
        ? `Mark stall "${s.stallNo}" as active again?`
        : `Stall "${s.stallNo}" will be marked inactive. Existing data is not deleted.`,
      icon: "pi pi-exclamation-triangle",
      acceptClassName: next ? "p-button-success" : "p-button-danger",
      accept: async () => {
        try {
          const res = await updateStallStatus(s.id, next);
          toast.success(res.message);
          setReloadKey((k) => k + 1);
        } catch (err) {
          toast.error(getErrorMessage(err));
        }
      },
    });
  };

  const stallCell = (s: Stall) => (
    <div className="flex min-w-[160px] items-center gap-3">
      {s.image ? (
        <img src={s.image} alt={s.stallNo} loading="lazy" className="h-10 w-12 shrink-0 rounded-lg border border-slate-200 object-cover" />
      ) : (
        <span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
          <i className="pi pi-shop" />
        </span>
      )}
      <span className="font-semibold text-slate-800">{s.stallNo}</span>
    </div>
  );

  const propertyCell = (s: Stall) => (
    <div className="text-sm">
      <p className="text-slate-700">{s.property?.name ?? "-"}</p>
      {s.property && <p className="text-xs text-slate-500">{s.property.city}</p>}
    </div>
  );

  const actionCell = (s: Stall) => (
    <div className="flex gap-1.5">
      <Button icon="pi pi-eye" rounded text severity="info" tooltip="View" tooltipOptions={{ position: "top" }} onClick={() => setViewing(s)} />
      {canManage && (
        <>
          <Button icon="pi pi-pencil" rounded text severity="secondary" tooltip="Edit" tooltipOptions={{ position: "top" }} onClick={() => openEdit(s)} />
          <Button
            icon={s.isActive ? "pi pi-ban" : "pi pi-check-circle"}
            rounded
            text
            severity={s.isActive ? "danger" : "success"}
            tooltip={s.isActive ? "Deactivate" : "Activate"}
            tooltipOptions={{ position: "top" }}
            onClick={() => confirmToggle(s)}
          />
        </>
      )}
    </div>
  );

  const hasFilter = !!(search || propertyId || status);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Stalls / Rooms</h2>
            <p className="text-sm text-slate-500">
              {total} {hasFilter ? "found" : "total"}
            </p>
          </div>
          {canManage && <Button label="Add Stall" icon="pi pi-plus" onClick={openCreate} />}
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <span className="relative">
            <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
            <InputText
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search stall number"
              className="w-full pl-9"
              aria-label="Search stalls"
            />
          </span>
          <Dropdown
            value={propertyId}
            options={propertyOptions}
            optionLabel="label"
            optionValue="value"
            onChange={(e) => {
              setPropertyId(e.value as string);
              setPage(1);
            }}
            filter
            className="w-full"
          />
          <Dropdown
            value={status}
            options={STATUS_OPTIONS}
            optionLabel="label"
            optionValue="value"
            onChange={(e) => {
              setStatus(e.value as StallStatus | "");
              setPage(1);
            }}
            className="w-full"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <DataTable
          value={stalls}
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
              ? "No stall matches your filters"
              : canManage
                ? "No stalls yet. Click 'Add Stall' to create one."
                : "No stalls found."
          }
        >
          <Column header="#" body={(_: Stall, opt) => (page - 1) * rows + opt.rowIndex + 1} style={{ width: "55px" }} />
          <Column header="Stall" body={stallCell} />
          <Column header="Property" body={propertyCell} />
          {showOwner && <Column header="Owner" body={(s: Stall) => s.owner?.name ?? "-"} />}
          <Column header="Keys" body={(s: Stall) => (s.numberOfKeys === null ? "-" : s.numberOfKeys)} style={{ width: "80px" }} />
          <Column header="Occupancy" body={(s: Stall) => <OccupancyBadge status={s.status} />} />
          <Column header="Status" body={(s: Stall) => <ActiveBadge active={s.isActive} />} />
          <Column header="Created" body={(s: Stall) => formatDate(s.createdAt)} />
          <Column header="Actions" body={actionCell} style={{ width: "140px" }} />
        </DataTable>
      </div>

      {/* Create / Edit */}
      <StallFormDialog
        visible={formOpen}
        stall={editing}
        defaultPropertyId={propertyId || undefined}
        onHide={closeForm}
        onSaved={handleSaved}
      />

      {/* View */}
      <Dialog
        header="Stall Details"
        visible={viewing !== null}
        onHide={() => setViewing(null)}
        style={{ width: "min(96vw, 560px)" }}
        contentStyle={{ maxHeight: "80vh" }}
        draggable={false}
        dismissableMask
      >
        {viewing && (
          <div className="space-y-4">
            {viewing.image && (
              <img src={viewing.image} alt={viewing.stallNo} className="h-52 w-full rounded-xl border border-slate-200 object-cover" />
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-800">Stall {viewing.stallNo}</h3>
              <div className="flex gap-1.5">
                <OccupancyBadge status={viewing.status} />
                <ActiveBadge active={viewing.isActive} />
              </div>
            </div>

            <div className="grid gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-2">
              <DetailItem label="Property" value={viewing.property?.name ?? "-"} />
              <DetailItem label="City" value={viewing.property ? `${viewing.property.city}, ${viewing.property.state}` : "-"} />
              <DetailItem label="Number of keys" value={viewing.numberOfKeys === null ? "-" : String(viewing.numberOfKeys)} />
              {viewing.owner && <DetailItem label="Owner" value={viewing.owner.name} />}
              <DetailItem label="Created on" value={formatDate(viewing.createdAt)} />
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