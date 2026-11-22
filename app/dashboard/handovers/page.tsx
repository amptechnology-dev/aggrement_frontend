"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import type { DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { toast } from "react-toastify";
import { useAuth } from "@/components/AuthProvider";
import HandoverFormDialog from "@/components/handover/HandoverFormDialog";
import { getHandovers } from "@/service/handover.service";
import { getErrorMessage } from "@/helper/apiError";
import { formatDate, formatDateTime } from "@/helper/format";
import type { Handover } from "@/types/handover.types";

const ROWS_OPTIONS: number[] = [10, 20, 50];

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 break-words text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

export default function HandoversPage() {
  const { user } = useAuth();
  const canManage = user?.role === "OWNER";
  const showOwner = user?.role === "SUPER_ADMIN";

  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Handover | null>(null);
  const [viewing, setViewing] = useState<Handover | null>(null);

  const reqIdRef = useRef(0);

  const fetchHandovers = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    setLoading(true);
    try {
      const res = await getHandovers({ page, limit: rows, ...(search ? { search } : {}) });
      if (reqId !== reqIdRef.current) return;
      setHandovers(res.handovers);
      setTotal(res.total);
    } catch (err) {
      if (reqId !== reqIdRef.current) return;
      toast.error(getErrorMessage(err));
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  }, [page, rows, search]);

  useEffect(() => {
    fetchHandovers();
  }, [fetchHandovers, reloadKey]);

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

  const openEdit = (h: Handover) => {
    setViewing(null);
    setEditing(h);
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

  const agreementCell = (h: Handover) => (
    <div className="min-w-[130px]">
      <p className="font-semibold text-slate-800">{h.agreementNo}</p>
      <p className="text-xs text-slate-500">Recorded {formatDate(h.createdAt)}</p>
    </div>
  );

  const stallCell = (h: Handover) => (
    <div className="min-w-[150px] text-sm">
      <p className="font-medium text-slate-800">Stall {h.stall.stallNo}</p>
      <p className="text-xs text-slate-500">{h.stall.propertyName}</p>
    </div>
  );

  const actionCell = (h: Handover) => (
    <div className="flex gap-1.5">
      <Button icon="pi pi-eye" rounded text severity="info" tooltip="View" tooltipOptions={{ position: "top" }} onClick={() => setViewing(h)} />
      {canManage && (
        <Button icon="pi pi-pencil" rounded text severity="secondary" tooltip="Edit" tooltipOptions={{ position: "top" }} onClick={() => openEdit(h)} />
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Handovers</h2>
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
              placeholder="Search agreement, tenant, stall"
              className="w-full pl-9 sm:w-72"
              aria-label="Search handovers"
            />
          </span>
          {canManage && <Button label="Record Handover" icon="pi pi-plus" onClick={openCreate} />}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <DataTable
          value={handovers}
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
            search
              ? `No handover matches "${search}"`
              : canManage
                ? "No handovers yet. Click 'Record Handover' to add one."
                : "No handovers found."
          }
        >
          <Column header="Agreement" body={agreementCell} />
          <Column header="Tenant" body={(h: Handover) => <span className="font-medium text-slate-800">{h.tenant.name}</span>} />
          <Column header="Stall" body={stallCell} />
          {showOwner && <Column header="Owner" body={(h: Handover) => h.owner?.name ?? "-"} />}
          <Column
            header="Keys"
            body={(h: Handover) => (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
                <i className="pi pi-key text-[10px]" /> {h.numberOfKeys}
              </span>
            )}
          />
          <Column header="Handover date" body={(h: Handover) => formatDate(h.handoverDate)} />
          <Column header="Actions" body={actionCell} style={{ width: "110px" }} />
        </DataTable>
      </div>

      <HandoverFormDialog visible={formOpen} editing={editing} onHide={closeForm} onSaved={handleSaved} />

      {/* View */}
      <Dialog
        header={viewing ? `Handover ${viewing.agreementNo}` : "Handover"}
        visible={viewing !== null}
        onHide={() => setViewing(null)}
        style={{ width: "min(96vw, 560px)" }}
        draggable={false}
        dismissableMask
      >
        {viewing && (
          <div className="space-y-4">
            <div className="grid gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-2">
              <DetailItem label="Agreement no" value={viewing.agreementNo} />
              <DetailItem label="Tenant" value={viewing.tenant.name} />
              <DetailItem label="Stall" value={`Stall ${viewing.stall.stallNo}`} />
              <DetailItem label="Market complex" value={viewing.stall.propertyName} />
              <DetailItem label="Number of keys" value={String(viewing.numberOfKeys)} />
              <DetailItem label="Handover date" value={formatDate(viewing.handoverDate)} />
              {viewing.owner && <DetailItem label="Owner" value={viewing.owner.name} />}
              <DetailItem label="Last updated" value={formatDateTime(viewing.updatedAt)} />
              <div className="sm:col-span-2">
                <DetailItem label="Remarks" value={viewing.remarks || "-"} />
              </div>
            </div>
            {canManage && (
              <div className="flex justify-end">
                <Button label="Edit" icon="pi pi-pencil" size="small" outlined onClick={() => openEdit(viewing)} />
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}