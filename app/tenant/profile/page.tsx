"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getMyProfile } from "@/service/tenantPortal.service";
import { getErrorMessage } from "@/helper/apiError";
import type { AuthUser } from "@/types/auth.types";
import type { TenantProfile } from "@/types/tenantPortal.types";

interface DetailItemProps {
  label: string;
  value: string;
}

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 break-words text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

export default function TenantProfilePage() {
  const [account, setAccount] = useState<AuthUser | null>(null);
  const [profiles, setProfiles] = useState<TenantProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMyProfile()
      .then((res) => {
        if (cancelled) return;
        setAccount(res.user);
        setProfiles(res.profiles);
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

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <i className="pi pi-spin pi-spinner text-3xl text-teal-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {account && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-lg font-bold uppercase text-white">
              {account.name.charAt(0)}
            </span>
            <div>
              <p className="font-bold text-slate-800">{account.name}</p>
              <p className="text-sm text-slate-500">
                {account.email} | {account.phone}
              </p>
            </div>
          </div>
        </div>
      )}

      {profiles.map((p) => (
        <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-slate-800">
            Tenant details{p.owner ? ` (Owner: ${p.owner.name})` : ""}
          </h3>
          <div className="grid gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-2">
            <DetailItem label="Name" value={p.name} />
            <DetailItem label="Contact number" value={p.phone} />
            <DetailItem label="Email" value={p.email} />
            <DetailItem
              label={p.guardianRelation === "HUSBAND" ? "Husband's name" : "Father's name"}
              value={p.guardianName}
            />
            <DetailItem label="Voter card no" value={p.voterCardNo ?? "-"} />
            {p.owner && <DetailItem label="Owner contact" value={p.owner.phone} />}
            <div className="sm:col-span-2">
              <DetailItem label="Address" value={p.address} />
            </div>
          </div>
        </div>
      ))}

      <p className="text-xs text-slate-400">
        To change any of these details, please contact your owner.
      </p>
    </div>
  );
}