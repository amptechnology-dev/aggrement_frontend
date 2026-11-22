import RentScheduleTable from "@/components/agreement/RentScheduleTable";
import TenantAgreementBadge from "@/components/tenant/TenantAgreementBadge";
import { formatDate, formatDateTime, formatMoney } from "@/helper/format";
import type { Agreement } from "@/types/agreement.types";

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

interface AgreementDetailProps {
  agreement: Agreement;
}

export default function AgreementDetail({ agreement: a }: AgreementDetailProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <TenantAgreementBadge agreement={a} />
        <span className="text-sm text-slate-500">Dated {formatDate(a.agreementDate)}</span>
      </div>

      <section>
        <h4 className="mb-2 text-sm font-bold text-slate-800">Parties</h4>
        <div className="grid gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-2">
          <DetailItem label="Office" value={a.office.name} />
          <DetailItem label="Office address" value={a.office.address} />
          <DetailItem label="Tenant" value={a.tenant.name} />
          <DetailItem
            label={a.tenant.guardianRelation === "HUSBAND" ? "Husband's name" : "Father's name"}
            value={a.tenant.guardianName}
          />
          <DetailItem label="Voter card no" value={a.tenant.voterCardNo} />
          <DetailItem label="Contact" value={`${a.tenant.phone} | ${a.tenant.email}`} />
          <div className="sm:col-span-2">
            <DetailItem label="Tenant address" value={a.tenant.address} />
          </div>
          <DetailItem label="Stall" value={`Stall ${a.stall.stallNo}`} />
          <DetailItem label="Market complex" value={a.stall.propertyName} />
          <div className="sm:col-span-2">
            <DetailItem label="Market address" value={a.stall.propertyAddress} />
          </div>
          {a.owner && <DetailItem label="Owner contact" value={`${a.owner.name} | ${a.owner.phone}`} />}
        </div>
      </section>

      <section>
        <h4 className="mb-2 text-sm font-bold text-slate-800">Rent and rules</h4>
        <div className="grid gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Monthly rent (start)" value={formatMoney(a.monthlyRent)} />
          <DetailItem label="Current rent" value={formatMoney(a.currentRent)} />
          <DetailItem label="Deposit" value={formatMoney(a.depositAmount)} />
          <DetailItem label="Effective from" value={formatDate(a.effectiveFrom)} />
          <DetailItem label="Valid till" value={`${formatDate(a.endDate)} (${a.validityYears} years)`} />
          <DetailItem
            label="Rent increase"
            value={
              a.rentIncreaseEveryYears > 0 && a.rentIncreasePercent > 0
                ? `${a.rentIncreasePercent}% every ${a.rentIncreaseEveryYears} years`
                : "None"
            }
          />
          <DetailItem
            label="Late fine"
            value={`${formatMoney(a.lateFineAmountPerDay)} per day after the ${a.lateFineAfterDay}th of every month`}
          />
          <DetailItem label="Stall cannot be closed for" value={`${a.stallCannotCloseForDays} days`} />
          <DetailItem label="Notice period" value={`${a.noticePeriodMonths} month(s)`} />
        </div>
      </section>

      {a.schedule && (
        <section>
          <h4 className="mb-2 text-sm font-bold text-slate-800">Rent schedule</h4>
          <RentScheduleTable periods={a.schedule} />
        </section>
      )}

      <section>
        <h4 className="mb-2 text-sm font-bold text-slate-800">Terms and conditions</h4>
        {a.terms.length === 0 ? (
          <p className="text-sm text-slate-400">No additional terms.</p>
        ) : (
          <ol className="space-y-2">
            {a.terms.map((t, i) => (
              <li key={`${i}-${t.slice(0, 10)}`} className="flex gap-2 rounded-lg border border-slate-200 p-2.5 text-sm">
                <span className="font-bold text-teal-600">{i + 1}.</span>
                <span className="whitespace-pre-line text-slate-700">{t}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {a.status !== "ACTIVE" && (
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          {a.status === "TERMINATED" ? "Terminated" : "Expired"}
          {a.terminatedAt ? ` on ${formatDateTime(a.terminatedAt)}` : ""}
          {a.terminationReason ? `: ${a.terminationReason}` : ""}
        </section>
      )}
    </div>
  );
}