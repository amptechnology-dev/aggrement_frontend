import { formatDate, formatMoney } from "@/helper/format";
import type { RentPeriod } from "@/types/agreement.types";

interface RentScheduleTableProps {
  periods: RentPeriod[];
}

export default function RentScheduleTable({ periods }: RentScheduleTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2 text-left">Period</th>
            <th className="px-3 py-2 text-left">From</th>
            <th className="px-3 py-2 text-left">To</th>
            <th className="px-3 py-2 text-right">Monthly rent</th>
            <th className="px-3 py-2 text-right">Increase</th>
          </tr>
        </thead>
        <tbody>
          {periods.map((p) => (
            <tr key={p.period} className="border-t border-slate-100">
              <td className="px-3 py-2 font-semibold text-slate-700">{p.period}</td>
              <td className="px-3 py-2 text-slate-600">{formatDate(p.from)}</td>
              <td className="px-3 py-2 text-slate-600">{formatDate(p.to)}</td>
              <td className="px-3 py-2 text-right font-semibold text-slate-800">{formatMoney(p.monthlyRent)}</td>
              <td className="px-3 py-2 text-right text-slate-500">
                {p.increasePercent > 0 ? `+${p.increasePercent}%` : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}