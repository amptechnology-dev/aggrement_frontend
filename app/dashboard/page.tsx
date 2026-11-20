"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { useAuth } from "@/components/AuthProvider";
import { getOwners } from "@/service/owner.service";
import { getErrorMessage } from "@/helper/apiError";
import { formatDate } from "@/helper/format";
import type { Owner } from "@/types/owner.types";

const OWNER_ROADMAP: { title: string; description: string; icon: string }[] = [
  { title: "Properties", description: "Add your market complexes with location and images", icon: "pi-building" },
  { title: "Stalls", description: "Create rooms or stalls under each property", icon: "pi-shop" },
  { title: "Tenants", description: "Register tenants and give them login access", icon: "pi-users" },
  { title: "Agreements", description: "Create rent agreements with all terms", icon: "pi-file-edit" },
  { title: "Handovers", description: "Record stall number, keys and handover date", icon: "pi-key" },
];

function SuperAdminHome() {
  const [total, setTotal] = useState(0);
  const [recent, setRecent] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getOwners({ page: 1, limit: 5 })
      .then((res) => {
        if (cancelled) return;
        setTotal(res.total);
        setRecent(res.owners);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 p-5 text-white shadow-lg shadow-teal-500/20">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white/80">Total Owners</p>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
              <i className="pi pi-id-card" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold">{loading ? "-" : total}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">Recently added owners</h2>
          <Link href="/dashboard/owners" className="text-sm font-semibold text-teal-600 hover:text-teal-700">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <i className="pi pi-spin pi-spinner text-2xl text-teal-500" />
          </div>
        ) : recent.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            No owners yet. Add your first owner from the Owners page.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-bold uppercase text-teal-600">
                    {o.name.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{o.name}</p>
                    <p className="truncate text-xs text-slate-500">{o.email}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      o.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                    }`}
                  >
                    {o.isActive ? "Active" : "Inactive"}
                  </span>
                  <p className="mt-1 text-[11px] text-slate-400">{formatDate(o.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function OwnerHome({ name }: { name: string }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-lg">
        <p className="text-sm text-teal-300">Welcome back</p>
        <h2 className="mt-1 text-2xl font-bold">{name}</h2>
        <p className="mt-2 max-w-xl text-sm text-slate-300">
          Your workspace is ready. The modules below will be enabled one by one.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {OWNER_ROADMAP.map((m) => (
          <div key={m.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <i className={`pi ${m.icon}`} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-800">{m.title}</p>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-600">
                  Soon
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">{m.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === "SUPER_ADMIN" ? <SuperAdminHome /> : <OwnerHome name={user.name} />;
}