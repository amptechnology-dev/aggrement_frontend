"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { useAuth } from "@/components/AuthProvider";
import { getMyAgreements, getMyHandovers } from "@/service/tenantPortal.service";
import { findNextIncrease } from "@/helper/tenantRent";
import { getErrorMessage } from "@/helper/apiError";
import { formatDate, formatMoney } from "@/helper/format";
import type { Agreement } from "@/types/agreement.types";
import type { Handover } from "@/types/handover.types";

interface StatProps {
  label: string;
  value: string;
  hint?: string;
}

function Stat({ label, value, hint }: StatProps) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-slate-800">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

interface ActiveCardProps {
  agreement: Agreement;
  handover: Handover | undefined;
}

function ActiveCard({ agreement: a, handover }: ActiveCardProps) {
  const next = findNextIncrease(a.schedule);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">{a.agreementNo}</p>
          <h3 className="mt-0.5 text-lg font-bold text-slate-800">Stall {a.stall.stallNo}</h3>
          <p className="text-sm text-slate-500">{a.stall.propertyName}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Current monthly rent</p>
          <p className="text-2xl font-bold text-slate-900">{formatMoney(a.currentRent)}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Deposit" value={formatMoney(a.depositAmount)} />
        <Stat label="Valid till" value={formatDate(a.endDate)} hint={`${a.validityYears} year agreement`} />
        <Stat
          label="Next rent increase"
          value={next ? formatMoney(next.monthlyRent) : "None"}
          hint={next ? `from ${formatDate(next.from)} (+${next.increasePercent}%)` : "No more increase"}
        />
        <Stat
          label="Late fine"
          value={`${formatMoney(a.lateFineAmountPerDay)} / day`}
          hint={`after the ${a.lateFineAfterDay}th of the month`}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 p-3 text-sm">
        <span className="flex items-center gap-2 text-slate-600">
          <i className="pi pi-key text-teal-600" />
          {handover
            ? `${handover.numberOfKeys} key(s) handed over on ${formatDate(handover.handoverDate)}`
            : "Key handover is pending"}
        </span>
        <Link href="/tenant/agreements" className="font-semibold text-teal-600 hover:text-teal-700">
          View full agreement
        </Link>
      </div>

      {a.isExpired && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          The agreement period is over. Please contact your owner
          {a.owner ? ` (${a.owner.name}, ${a.owner.phone})` : ""}.
        </div>
      )}
    </div>
  );
}

export default function TenantHomePage() {
  const { user } = useAuth();
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

  const active = useMemo(() => agreements.filter((a) => a.status === "ACTIVE"), [agreements]);
  const handoverByAgreement = useMemo(
    () => new Map(handovers.map((h) => [h.agreementId, h])),
    [handovers],
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-lg">
        <p className="text-sm text-teal-300">Welcome</p>
        <h2 className="mt-1 text-2xl font-bold">{user?.name}</h2>
        <p className="mt-2 max-w-xl text-sm text-slate-300">
          Here you can see your stall, rent, agreement and key handover details.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <i className="pi pi-spin pi-spinner text-3xl text-teal-500" />
        </div>
      ) : active.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <i className="pi pi-file-edit text-3xl text-slate-300" />
          <p className="mt-3 font-semibold text-slate-700">No active agreement</p>
          <p className="mt-1 text-sm text-slate-500">
            Your owner has not created an agreement for you yet, or it has ended.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {active.map((a) => (
            <ActiveCard key={a.id} agreement={a} handover={handoverByAgreement.get(a.id)} />
          ))}
        </div>
      )}
    </div>
  );
}