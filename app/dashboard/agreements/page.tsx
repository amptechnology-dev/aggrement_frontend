"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import type { DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { toast } from "react-toastify";
import { useAuth } from "@/components/AuthProvider";
import AgreementFormDialog from "@/components/agreement/AgreementFormDialog";
import RentScheduleTable from "@/components/agreement/RentScheduleTable";
import {
  getAgreementById,
  getAgreements,
  terminateAgreement,
} from "@/service/agreement.service";
import { getErrorMessage } from "@/helper/apiError";
import { formatDate, formatDateTime, formatMoney } from "@/helper/format";
import type { Agreement, AgreementStatus } from "@/types/agreement.types";

const ROWS_OPTIONS: number[] = [10, 20, 50];

interface StatusOption {
  label: string;
  value: AgreementStatus | "";
}

const STATUS_OPTIONS: StatusOption[] = [
  { label: "All status", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Terminated", value: "TERMINATED" },
  { label: "Expired", value: "EXPIRED" },
];

const cx = (...c: Array<string | false | undefined>) =>
  c.filter(Boolean).join(" ");

function StatusBadge({ agreement }: { agreement: Agreement }) {
  let text = "Active";
  let tone = "op-badge--on";

  if (agreement.status === "TERMINATED") {
    text = "Terminated";
    tone = "op-badge--off";
  } else if (agreement.status === "EXPIRED") {
    text = "Expired";
    tone = "op-badge--muted";
  } else if (agreement.isExpired) {
    text = "Term over";
    tone = "op-badge--warn";
  }

  return <span className={cx("op-badge", tone)}>{text}</span>;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="op-detail">
      <p className="op-detail__label">{label}</p>
      <p className="op-detail__value">{value}</p>
    </div>
  );
}

export default function AgreementsPage() {
  const { user } = useAuth();
  const canManage = user?.role === "OWNER";
  const showOwner = user?.role === "SUPER_ADMIN";

  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AgreementStatus | "">("");
  const [reloadKey, setReloadKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState<Agreement | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [terminating, setTerminating] = useState<Agreement | null>(null);
  const [reason, setReason] = useState("");
  const [terminateBusy, setTerminateBusy] = useState(false);

  const reqIdRef = useRef(0);

  // ---------- list ----------
  const fetchAgreements = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    setLoading(true);
    try {
      const res = await getAgreements({
        page,
        limit: rows,
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
      });
      if (reqId !== reqIdRef.current) return;
      setAgreements(res.agreements);
      setTotal(res.total);
    } catch (err) {
      if (reqId !== reqIdRef.current) return;
      toast.error(getErrorMessage(err));
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  }, [page, rows, search, status]);

  useEffect(() => {
    fetchAgreements();
  }, [fetchAgreements, reloadKey]);

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

  // ---------- view ----------
  // list-e schedule thake na, tai view-te single API call
  const openView = async (id: string) => {
    setViewing(null);
    setViewLoading(true);
    try {
      const res = await getAgreementById(id);
      setViewing(res.agreement);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setViewLoading(false);
    }
  };

  // ---------- terminate ----------
  const openTerminate = (a: Agreement) => {
    setViewing(null);
    setReason("");
    setTerminating(a);
  };

  const confirmTerminate = async () => {
    if (!terminating) return;
    setTerminateBusy(true);
    try {
      const res = await terminateAgreement(terminating.id, reason);
      toast.success(res.message);
      setTerminating(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTerminateBusy(false);
    }
  };

  const handleSaved = () => {
    setFormOpen(false);
    setPage(1);
    setReloadKey((k) => k + 1);
  };

  // ---------- table cells ----------
  const agreementCell = (a: Agreement) => (
    <div className="op-agno">
      <span className="op-agno__icon">
        <i className="pi pi-file-edit" />
      </span>
      <div className="op-cell">
        <span className="op-cell__title">{a.agreementNo}</span>
        <span className="op-cell__sub">{formatDate(a.agreementDate)}</span>
      </div>
    </div>
  );

  const tenantCell = (a: Agreement) => (
    <div className="op-cell" style={{ minWidth: 150 }}>
      <span className="op-cell__title">{a.tenant.name}</span>
      <span className="op-cell__sub">{a.tenant.phone}</span>
    </div>
  );

  const stallCell = (a: Agreement) => (
    <div className="op-cell" style={{ minWidth: 150 }}>
      <span className="op-cell__title">Stall {a.stall.stallNo}</span>
      <span className="op-cell__sub">{a.stall.propertyName}</span>
    </div>
  );

  const ownerCell = (a: Agreement) => (
    <span className="op-cell__title">{a.owner?.name ?? "-"}</span>
  );

  const rentCell = (a: Agreement) => (
    <span className="op-money">{formatMoney(a.currentRent)}</span>
  );

  const validityCell = (a: Agreement) => (
    <div className="op-cell" style={{ minWidth: 120 }}>
      <span className="op-date">{formatDate(a.effectiveFrom)}</span>
      <span className="op-cell__sub">to {formatDate(a.endDate)}</span>
    </div>
  );

  const statusCell = (a: Agreement) => <StatusBadge agreement={a} />;

  const actionCell = (a: Agreement) => (
    <div className="op-actions">
      {a.pdfUrl && (
        <a
          href={a.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="op-iconbtn op-iconbtn--view"
          title="Open PDF"
          aria-label={`Open PDF of ${a.agreementNo}`}
        >
          <i className="pi pi-file-pdf" />
        </a>
      )}
      <button
        type="button"
        className="op-iconbtn op-iconbtn--view"
        title="View details"
        aria-label={`View ${a.agreementNo}`}
        onClick={() => openView(a.id)}
      >
        <i className="pi pi-eye" />
      </button>
      {canManage && a.status === "ACTIVE" && (
        <button
          type="button"
          className="op-iconbtn op-iconbtn--danger"
          title="Terminate"
          aria-label={`Terminate ${a.agreementNo}`}
          onClick={() => openTerminate(a)}
        >
          <i className="pi pi-ban" />
        </button>
      )}
    </div>
  );

  const hasFilter = !!(search || status);

  const emptyState = (
    <div className="op-empty">
      <span className="op-empty__icon">
        <i className={`pi ${hasFilter ? "pi-search" : "pi-file-edit"}`} />
      </span>
      <p className="op-empty__title">
        {hasFilter ? "No agreements found" : "No agreements yet"}
      </p>
      <p className="op-empty__text">
        {hasFilter
          ? "Nothing matches your filters. Try a different keyword or status."
          : canManage
            ? "Click 'Create Agreement' to start."
            : "No agreements found."}
      </p>
    </div>
  );

  return (
    <div className="op">
      {/* Header */}
      <div className="op-head">
        <div className="op-head__left">
          <span className="op-head__icon">
            <i className="pi pi-file-edit" />
          </span>
          <div style={{ minWidth: 0 }}>
            <h2 className="op-head__title">Agreements</h2>
            <p className="op-head__sub">
              <strong>{total}</strong> {hasFilter ? "found" : "total"}
            </p>
          </div>
        </div>

        <div className="op-head__right">
          <div className="op-search op-search--wide">
            <i className="pi pi-search" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search agreement, tenant, stall"
              className="op-search__input"
              aria-label="Search agreements"
            />
            {searchInput && (
              <button
                type="button"
                className="op-search__clear"
                onClick={() => setSearchInput("")}
                aria-label="Clear search"
              >
                <i className="pi pi-times" />
              </button>
            )}
          </div>

          <div className="op-select">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as AgreementStatus | "");
                setPage(1);
              }}
              className="op-select__input"
              aria-label="Filter by status"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <i className="pi pi-chevron-down" />
          </div>

          {canManage && (
            <button
              type="button"
              className="op-btn op-btn--primary"
              onClick={() => setFormOpen(true)}
            >
              <i className="pi pi-plus" />
              Create Agreement
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="op-card">
        <DataTable
          value={agreements}
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
          emptyMessage={emptyState}
        >
          <Column header="Agreement" body={agreementCell} />
          <Column header="Tenant" body={tenantCell} />
          <Column header="Stall" body={stallCell} />
          {showOwner && <Column header="Owner" body={ownerCell} />}
          <Column header="Current rent" body={rentCell} />
          <Column header="Validity" body={validityCell} />
          <Column header="Status" body={statusCell} />
          <Column
            header="Actions"
            body={actionCell}
            style={{ width: "110px" }}
          />
        </DataTable>
      </div>

      <AgreementFormDialog
        visible={formOpen}
        onHide={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      {/* View dialog */}
      <Dialog
        header={viewing ? `Agreement ${viewing.agreementNo}` : "Agreement"}
        visible={viewLoading || viewing !== null}
        onHide={() => setViewing(null)}
        style={{ width: "min(98vw, 860px)" }}
        contentStyle={{ maxHeight: "82vh" }}
        className="op-dialog"
        draggable={false}
        dismissableMask
      >
        {viewLoading || !viewing ? (
          <div className="op-loading">
            <i className="pi pi-spin pi-spinner" />
          </div>
        ) : (
          <div>
            <div className="op-view__bar">
              <div className="op-view__meta">
                <StatusBadge agreement={viewing} />
                <span>Dated {formatDate(viewing.agreementDate)}</span>
                {viewing.pdfUrl && (
                  <a
                    href={viewing.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="op-btn op-btn--outline op-btn--sm"
                  >
                    <i className="pi pi-file-pdf" />
                    View PDF
                  </a>
                )}
              </div>
              {canManage && viewing.status === "ACTIVE" && (
                <button
                  type="button"
                  className="op-btn op-btn--danger-outline op-btn--sm"
                  onClick={() => openTerminate(viewing)}
                >
                  <i className="pi pi-ban" />
                  Terminate
                </button>
              )}
            </div>

            {viewing.isExpired && viewing.status === "ACTIVE" && (
              <div className="op-alert">
                The agreement period is over but it is still active. Terminate
                it to free the stall, or create a new agreement for the stall
                (this one will then be marked expired automatically).
              </div>
            )}

            <section className="op-section">
              <h4 className="op-section__title">Parties</h4>
              <div className="op-view__grid">
                <DetailItem label="Office" value={viewing.office.name} />
                <DetailItem
                  label="Office address"
                  value={viewing.office.address}
                />
                <DetailItem label="Tenant" value={viewing.tenant.name} />
                <DetailItem
                  label={
                    viewing.tenant.guardianRelation === "HUSBAND"
                      ? "Husband's name"
                      : "Father's name"
                  }
                  value={viewing.tenant.guardianName}
                />
                <DetailItem
                  label="Voter card no"
                  value={viewing.tenant.voterCardNo}
                />
                <DetailItem
                  label="Contact"
                  value={`${viewing.tenant.phone} | ${viewing.tenant.email}`}
                />
                <div className="op-view__full">
                  <DetailItem
                    label="Tenant address"
                    value={viewing.tenant.address}
                  />
                </div>
                <DetailItem
                  label="Stall"
                  value={`Stall ${viewing.stall.stallNo}`}
                />
                <DetailItem
                  label="Market complex"
                  value={viewing.stall.propertyName}
                />
                <div className="op-view__full">
                  <DetailItem
                    label="Market address"
                    value={viewing.stall.propertyAddress}
                  />
                </div>
              </div>
            </section>

            <section className="op-section">
              <h4 className="op-section__title">Rent and rules</h4>
              <div className="op-view__grid op-view__grid--3">
                <DetailItem
                  label="Monthly rent (start)"
                  value={formatMoney(viewing.monthlyRent)}
                />
                <DetailItem
                  label="Current rent"
                  value={formatMoney(viewing.currentRent)}
                />
                <DetailItem
                  label="Deposit"
                  value={formatMoney(viewing.depositAmount)}
                />
                <DetailItem
                  label="Effective from"
                  value={formatDate(viewing.effectiveFrom)}
                />
                <DetailItem
                  label="Valid till"
                  value={`${formatDate(viewing.endDate)} (${viewing.validityYears} years)`}
                />
                <DetailItem
                  label="Rent increase"
                  value={
                    viewing.rentIncreaseEveryYears > 0 &&
                    viewing.rentIncreasePercent > 0
                      ? `${viewing.rentIncreasePercent}% every ${viewing.rentIncreaseEveryYears} years`
                      : "None"
                  }
                />
                <DetailItem
                  label="Late fine"
                  value={`${formatMoney(viewing.lateFineAmountPerDay)} per day after the ${viewing.lateFineAfterDay}th of every month`}
                />
                <DetailItem
                  label="Stall cannot be closed for"
                  value={`${viewing.stallCannotCloseForDays} days`}
                />
                <DetailItem
                  label="Notice period"
                  value={`${viewing.noticePeriodMonths} month(s)`}
                />
              </div>
            </section>

            {viewing.schedule && (
              <section className="op-section">
                <h4 className="op-section__title">Rent schedule</h4>
                <RentScheduleTable periods={viewing.schedule} />
              </section>
            )}

            <section className="op-section">
              <h4 className="op-section__title">Terms and conditions</h4>
              {viewing.terms.length === 0 ? (
                <p className="op-muted-text">No additional terms.</p>
              ) : (
                <ol className="op-terms">
                  {viewing.terms.map((t, i) => (
                    <li key={`${i}-${t.slice(0, 10)}`} className="op-term">
                      <span className="op-term__no">{i + 1}.</span>
                      <span className="op-term__text">{t}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {viewing.status !== "ACTIVE" && (
              <div className="op-endnote">
                {viewing.status === "TERMINATED" ? "Terminated" : "Expired"}
                {viewing.terminatedAt
                  ? ` on ${formatDateTime(viewing.terminatedAt)}`
                  : ""}
                {viewing.terminationReason
                  ? `: ${viewing.terminationReason}`
                  : ""}
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* Terminate dialog */}
      <Dialog
        header="Terminate agreement"
        visible={terminating !== null}
        onHide={() => !terminateBusy && setTerminating(null)}
        style={{ width: "min(96vw, 480px)" }}
        className="op-dialog"
        draggable={false}
      >
        {terminating && (
          <div>
            <p className="op-text">
              <b>{terminating.agreementNo}</b> ({terminating.tenant.name}, Stall{" "}
              {terminating.stall.stallNo}) will be ended and the stall becomes
              vacant. This cannot be undone.
            </p>

            <div className="op-field">
              <label htmlFor="t-reason" className="op-label">
                Reason <span className="op-optional">(optional)</span>
              </label>
              <textarea
                id="t-reason"
                rows={3}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this agreement being terminated?"
                className="op-input"
              />
            </div>

            <div className="op-form__foot" style={{ paddingTop: 16 }}>
              <button
                type="button"
                className="op-btn op-btn--ghost op-btn--block"
                disabled={terminateBusy}
                onClick={() => setTerminating(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="op-btn op-btn--danger op-btn--block"
                disabled={terminateBusy}
                onClick={confirmTerminate}
              >
                <i
                  className={`pi ${terminateBusy ? "pi-spin pi-spinner" : "pi-ban"}`}
                />
                {terminateBusy ? "Terminating..." : "Terminate"}
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
