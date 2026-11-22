"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Paginator } from "primereact/paginator";
import type { PaginatorPageChangeEvent } from "primereact/paginator";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { toast } from "react-toastify";
import { useAuth } from "@/components/AuthProvider";
import PropertyFormDialog from "@/components/property/PropertyFormDialog";
import { getProperties, updatePropertyStatus } from "@/service/property.service";
import { getErrorMessage } from "@/helper/apiError";
import { formatDate } from "@/helper/format";
import type { Property } from "@/types/property.types";

const ROWS_OPTIONS: number[] = [6, 12, 24];

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

interface PropertyCardProps {
  property: Property;
  canManage: boolean;
  showOwner: boolean;
  onView: (p: Property) => void;
  onEdit: (p: Property) => void;
  onToggle: (p: Property) => void;
}

function PropertyCard({ property: p, canManage, showOwner, onView, onEdit, onToggle }: PropertyCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <button type="button" onClick={() => onView(p)} className="relative block h-44 w-full bg-slate-100" title="View details">
        <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
        <span className="absolute right-2 top-2">
          <StatusBadge active={p.isActive} />
        </span>
      </button>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="min-w-0">
          <h3 className="truncate font-bold text-slate-800" title={p.name}>{p.name}</h3>
          <p className="mt-0.5 flex items-start gap-1.5 text-sm text-slate-500">
            <i className="pi pi-map-marker mt-0.5 text-xs text-teal-500" />
            <span className="line-clamp-2">{p.address}, {p.city}, {p.state} - {p.pin}</span>
          </p>
        </div>

        {showOwner && p.owner && (
          <p className="truncate text-xs text-slate-500">
            <i className="pi pi-user mr-1 text-[10px]" />
            {p.owner.name}
          </p>
        )}

        <p className="text-[11px] text-slate-400">Added on {formatDate(p.createdAt)}</p>

        <div className="mt-auto flex gap-2 pt-2">
          <Button label="View" icon="pi pi-eye" size="small" outlined className="flex-1" onClick={() => onView(p)} />
          {canManage && (
            <>
              <Button icon="pi pi-pencil" size="small" outlined severity="info" tooltip="Edit" tooltipOptions={{ position: "top" }} onClick={() => onEdit(p)} />
              <Button
                icon={p.isActive ? "pi pi-ban" : "pi pi-check-circle"}
                size="small"
                outlined
                severity={p.isActive ? "danger" : "success"}
                tooltip={p.isActive ? "Deactivate" : "Activate"}
                tooltipOptions={{ position: "top" }}
                onClick={() => onToggle(p)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  const { user } = useAuth();
  const canManage = user?.role === "OWNER";
  const showOwner = user?.role === "SUPER_ADMIN";

  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(6);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [viewing, setViewing] = useState<Property | null>(null);

  const reqIdRef = useRef(0);

  const fetchProperties = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    setLoading(true);
    try {
      const res = await getProperties({ page, limit: rows, ...(search ? { search } : {}) });
      if (reqId !== reqIdRef.current) return;
      setProperties(res.properties);
      setTotal(res.total);
    } catch (err) {
      if (reqId !== reqIdRef.current) return;
      toast.error(getErrorMessage(err));
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  }, [page, rows, search]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties, reloadKey]);

  // search debounce
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const onPageChange = (e: PaginatorPageChangeEvent) => {
    setPage(e.page + 1);
    setRows(e.rows);
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (p: Property) => {
    setViewing(null);
    setEditing(p);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const handleSaved = () => {
    const wasCreate = editing === null;
    closeForm();
    if (wasCreate) setPage(1);
    setReloadKey((k) => k + 1);
  };

  const confirmToggle = (p: Property) => {
    const next = !p.isActive;
    confirmDialog({
      header: next ? "Activate property" : "Deactivate property",
      message: next
        ? `Mark "${p.name}" as active again?`
        : `"${p.name}" will be marked inactive. Existing data is not deleted.`,
      icon: "pi pi-exclamation-triangle",
      acceptClassName: next ? "p-button-success" : "p-button-danger",
      accept: async () => {
        try {
          const res = await updatePropertyStatus(p.id, next);
          toast.success(res.message);
          setReloadKey((k) => k + 1);
        } catch (err) {
          toast.error(getErrorMessage(err));
        }
      },
    });
  };

  const showEmpty = !loading && properties.length === 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Properties</h2>
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
              placeholder="Search name, city, state, PIN"
              className="w-full pl-9 sm:w-72"
              aria-label="Search properties"
            />
          </span>
          {canManage && <Button label="Add Property" icon="pi pi-plus" onClick={openCreate} />}
        </div>
      </div>

      {/* First load */}
      {loading && properties.length === 0 && (
        <div className="flex justify-center py-16">
          <i className="pi pi-spin pi-spinner text-3xl text-teal-500" />
        </div>
      )}

      {/* Empty */}
      {showEmpty && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-14 text-center">
          <i className="pi pi-building text-4xl text-slate-300" />
          <p className="mt-3 font-semibold text-slate-700">
            {search ? "No property found" : "No properties yet"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {search
              ? `Nothing matches "${search}".`
              : canManage
                ? "Click 'Add Property' to create your first market complex."
                : "No owner has added a property yet."}
          </p>
        </div>
      )}

      {/* Grid */}
      {properties.length > 0 && (
        <>
          <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ${loading ? "opacity-60" : ""}`}>
            {properties.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                canManage={canManage}
                showOwner={showOwner}
                onView={setViewing}
                onEdit={openEdit}
                onToggle={confirmToggle}
              />
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            <Paginator
              first={(page - 1) * rows}
              rows={rows}
              totalRecords={total}
              rowsPerPageOptions={ROWS_OPTIONS}
              onPageChange={onPageChange}
            />
          </div>
        </>
      )}

      {/* Create / Edit */}
      <PropertyFormDialog visible={formOpen} property={editing} onHide={closeForm} onSaved={handleSaved} />

      {/* View */}
      <Dialog
        header="Property Details"
        visible={viewing !== null}
        onHide={() => setViewing(null)}
        style={{ width: "min(96vw, 640px)" }}
        contentStyle={{ maxHeight: "80vh" }}
        draggable={false}
        dismissableMask
      >
        {viewing && (
          <div className="space-y-4">
            <img src={viewing.image} alt={viewing.name} className="h-56 w-full rounded-xl border border-slate-200 object-cover" />

            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-800">{viewing.name}</h3>
              <StatusBadge active={viewing.isActive} />
            </div>

            <div className="grid gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <DetailItem label="Address" value={viewing.address} />
              </div>
              <DetailItem label="City" value={viewing.city} />
              <DetailItem label="State" value={viewing.state} />
              <DetailItem label="PIN" value={viewing.pin} />
              <DetailItem label="Location" value={viewing.location} />
              <DetailItem label="Latitude" value={String(viewing.lat)} />
              <DetailItem label="Longitude" value={String(viewing.long)} />
              {viewing.owner && <DetailItem label="Owner" value={`${viewing.owner.name} (${viewing.owner.phone})`} />}
              <DetailItem label="Added on" value={formatDate(viewing.createdAt)} />
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <a
                href={`https://www.google.com/maps?q=${viewing.lat},${viewing.long}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <i className="pi pi-map" /> Open in Maps
              </a>
              {canManage && <Button label="Edit" icon="pi pi-pencil" onClick={() => openEdit(viewing)} />}
            </div>
          </div>
        )}
      </Dialog>

      <ConfirmDialog />
    </div>
  );
}