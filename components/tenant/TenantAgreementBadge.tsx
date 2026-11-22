import type { Agreement } from "@/types/agreement.types";

interface TenantAgreementBadgeProps {
  agreement: Agreement;
}

export default function TenantAgreementBadge({ agreement }: TenantAgreementBadgeProps) {
  let text = "Active";
  let style = "bg-emerald-50 text-emerald-700";

  if (agreement.status === "TERMINATED") {
    text = "Terminated";
    style = "bg-red-50 text-red-600";
  } else if (agreement.status === "EXPIRED") {
    text = "Expired";
    style = "bg-slate-100 text-slate-600";
  } else if (agreement.isExpired) {
    text = "Term over";
    style = "bg-amber-50 text-amber-700";
  }

  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${style}`}>{text}</span>;
}