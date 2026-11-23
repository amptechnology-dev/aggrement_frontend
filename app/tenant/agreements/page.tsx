"use client";

import { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { toast } from "react-toastify";
import AgreementDetail from "@/components/tenant/AgreementDetail";
import TenantAgreementBadge from "@/components/tenant/TenantAgreementBadge";
import { getMyAgreements } from "@/service/tenantPortal.service";
import { getErrorMessage } from "@/helper/apiError";
import { formatDate, formatMoney } from "@/helper/format";
import type { Agreement } from "@/types/agreement.types";

export default function TenantAgreementsPage() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Agreement | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyAgreements()
      .then((res) => {
        if (!cancelled) setAgreements(res.agreements);
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
      <div className="op-loading">
        <i className="pi pi-spin pi-spinner" />
      </div>
    );
  }

  return (
    <div className="op">
      {/* Header */}
      <div className="op-head">
        <div className="op-head__left">
          <span className="op-head__icon">
            <i className="pi pi-file-edit" />
          </span>
          <div style={{ minWidth: 0 }}>
            <h2 className="op-head__title">My Agreements</h2>
            <p className="op-head__sub">
              <strong>{agreements.length}</strong> total
            </p>
          </div>
        </div>
      </div>

      {/* Cards */}
      {agreements.length === 0 ? (
        <div className="op-card">
          <div className="op-empty">
            <span className="op-empty__icon">
              <i className="pi pi-file-edit" />
            </span>
            <p className="op-empty__title">No agreements found</p>
            <p className="op-empty__text">
              Your agreements will appear here once created.
            </p>
          </div>
        </div>
      ) : (
        <div className="tp-grid">
          {agreements.map((a) => (
            <div key={a.id} className="tp-card">
              <div className="tp-card__top">
                <div className="tp-card__id">
                  <span className="tp-card__icon">
                    <i className="pi pi-file-edit" />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p className="tp-card__title">{a.agreementNo}</p>
                    <p className="tp-card__sub">
                      <i className="pi pi-shop" />
                      Stall {a.stall.stallNo}, {a.stall.propertyName}
                    </p>
                  </div>
                </div>
                <TenantAgreementBadge agreement={a} />
              </div>

              <div className="tp-card__stats">
                <div className="tp-stat">
                  <p className="tp-stat__label">Current rent</p>
                  <p className="tp-stat__value">{formatMoney(a.currentRent)}</p>
                </div>
                <div className="tp-stat">
                  <p className="tp-stat__label">Deposit</p>
                  <p className="tp-stat__value">
                    {formatMoney(a.depositAmount)}
                  </p>
                </div>
                <div className="tp-stat tp-stat--full">
                  <p className="tp-stat__label">Validity</p>
                  <p className="tp-stat__value tp-stat__value--sm">
                    {formatDate(a.effectiveFrom)} - {formatDate(a.endDate)}
                  </p>
                </div>
              </div>

              <div className="tp-card__foot">
                <button
                  type="button"
                  className="op-btn op-btn--outline op-btn--sm"
                  onClick={() => setViewing(a)}
                >
                  <i className="pi pi-eye" />
                  View details
                </button>
                {a.pdfUrl && (
                  <a
                    href={a.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="op-btn op-btn--outline op-btn--sm"
                  >
                    <i className="pi pi-file-pdf" />
                    PDF
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View dialog */}
      <Dialog
        header={viewing ? `Agreement ${viewing.agreementNo}` : "Agreement"}
        visible={viewing !== null}
        onHide={() => setViewing(null)}
        style={{ width: "min(98vw, 860px)" }}
        contentStyle={{ maxHeight: "82vh" }}
        className="op-dialog"
        draggable={false}
        dismissableMask
      >
        {viewing && <AgreementDetail agreement={viewing} />}
      </Dialog>
    </div>
  );
}
