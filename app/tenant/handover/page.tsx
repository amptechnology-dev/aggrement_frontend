"use client";

import { useEffect, useMemo, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { toast } from "react-toastify";
import { getMyAgreements, getMyHandovers } from "@/service/tenantPortal.service";
import { getErrorMessage } from "@/helper/apiError";
import { formatDate } from "@/helper/format";
import type { Agreement } from "@/types/agreement.types";
import type { Handover } from "@/types/handover.types";

export default function TenantHandoverPage() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getMyAgreements(), getMyHandovers()])
      .then(([agreementRes, handoverRes]) => {
        if (cancelled) return;
        setAgreements(agreementRes.agreements);
        setHandovers(handoverRes.handovers);
      })
      .catch((err) => {
        if (!cancelled) toast.error(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pending = useMemo(() => {
    const done = new Set(handovers.map((h) => h.agreementId));
    return agreements.filter((a) => a.status === "ACTIVE" && !done.has(a.id));
  }, [agreements, handovers]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800">Key Handover</h2>
        <p className="text-sm text-slate-500">{handovers.length} recorded</p>
      </div>

      {pending.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">Handover pending</p>
          <ul className="mt-1 list-inside list-disc">
            {pending.map((a) => (
              <li key={a.id}>
                {a.agreementNo}: Stall {a.stall.stallNo}, {a.stall.propertyName}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <DataTable
          value={handovers}
          loading={loading}
          dataKey="id"
          responsiveLayout="scroll"
          emptyMessage="No handover has been recorded yet."
        >
          <Column
            header="Agreement"
            body={(h: Handover) => <span className="font-semibold text-slate-800">{h.agreementNo}</span>}
          />
          <Column
            header="Stall"
            body={(h: Handover) => (
              <div className="text-sm">
                <p className="font-medium text-slate-800">Stall {h.stall.stallNo}</p>
                <p className="text-xs text-slate-500">{h.stall.propertyName}</p>
              </div>
            )}
          />
          <Column
            header="Keys"
            body={(h: Handover) => (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
                <i className="pi pi-key text-[10px]" /> {h.numberOfKeys}
              </span>
            )}
          />
          <Column header="Handover date" body={(h: Handover) => formatDate(h.handoverDate)} />
          <Column header="Remarks" body={(h: Handover) => <span className="text-sm text-slate-600">{h.remarks || "-"}</span>} />
        </DataTable>
      </div>
    </div>
  );
}