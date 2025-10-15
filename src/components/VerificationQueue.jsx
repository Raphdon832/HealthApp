// src/components/VerificationQueue.jsx
import React, { useMemo, useState } from "react";
import Modal from "@/components/Modal";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in_review", label: "In Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "needs_more_info", label: "Needs Info" },
];

const PRIORITY_COLORS = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-emerald-100 text-emerald-700",
};

function formatDate(dateValue) {
  if (!dateValue) return "--";
  try {
    const date =
      typeof dateValue?.toDate === "function"
        ? dateValue.toDate()
        : new Date(dateValue);
    return date.toLocaleString();
  } catch (err) {
    console.warn("[VerificationQueue] Failed to format date", err);
    return "--";
  }
}

export default function VerificationQueue({
  items,
  onUpdateStatus,
  onAssign,
  onAddAuditEntry,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");

  const filteredItems = useMemo(() => {
    const lowerSearch = searchTerm.trim().toLowerCase();
    return (items || []).filter((item) => {
      const matchesStatus =
        statusFilter === "all" ? true : item?.status === statusFilter;
      if (!matchesStatus) return false;

      if (!lowerSearch) return true;

      const haystack = [
        item?.entityName,
        item?.contactEmail,
        item?.contactPhone,
        item?.submittedBy,
        item?.applicationId,
        item?.applicantType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(lowerSearch);
    });
  }, [items, searchTerm, statusFilter]);

  const handleStatusChange = (status) => {
    if (!selected || typeof onUpdateStatus !== "function") return;
    onUpdateStatus(selected, status, note || undefined);
    setNote("");
  };

  const handleAssign = (assignee) => {
    if (!selected || typeof onAssign !== "function") return;
    onAssign(selected, assignee);
  };

  const handleAddAudit = () => {
    if (!selected || !note?.trim() || typeof onAddAuditEntry !== "function")
      return;
    onAddAuditEntry(selected, note.trim());
    setNote("");
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Verification Queue
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track onboarding submissions, assign reviewers, and finalize
            approvals.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            placeholder="Search applicant, email, or ID"
            value={searchTerm}
            onChange={(evt) => setSearchTerm(evt.target.value)}
            className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-700 sm:w-72"
          />
          <select
            value={statusFilter}
            onChange={(evt) => setStatusFilter(evt.target.value)}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-700"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="hidden border-b border-slate-200 bg-slate-50 px-6 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 md:grid md:grid-cols-12">
          <span className="col-span-3">Applicant</span>
          <span className="col-span-2">Submitted</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-2">Reviewer</span>
          <span className="col-span-3 text-right">Actions</span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
            No submissions match your filters.
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredItems.map((item) => (
              <li
                key={item.id}
                className="grid gap-4 px-4 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/30 md:grid-cols-12 md:items-center md:px-6"
              >
                <div className="md:col-span-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {item.entityName || item.submittedBy || "Unnamed Applicant"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.applicantType || "pharmacy"} |{" "}
                    {item.applicationId || item.id}
                  </p>
                  {item.priority && (
                    <span
                      className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.low
                        }`}
                    >
                      {item.priority} priority
                    </span>
                  )}
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {formatDate(item.submittedAt)}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {item.status || "pending"}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {item.assignedTo || "Unassigned"}
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2 md:col-span-3">
                  <button
                    type="button"
                    onClick={() => setSelected(item)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    View
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <div className="flex flex-col gap-6">
            <header>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Application #{selected.applicationId || selected.id}
              </p>
              <h3 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                {selected.entityName || selected.submittedBy || "Unnamed"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-300">
                {selected.applicantType || "pharmacy"} | Submitted{" "}
                {formatDate(selected.submittedAt)}
              </p>
            </header>

            <section className="grid gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/50 sm:grid-cols-2">
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-500">
                  Contact
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-200">
                  <li>{selected.contactName}</li>
                  <li>{selected.contactEmail}</li>
                  <li>{selected.contactPhone}</li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-500">
                  Location
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-200">
                  <li>{selected.location?.addressLine1}</li>
                  <li>{selected.location?.city}</li>
                  <li>{selected.location?.state}</li>
                </ul>
              </div>
            </section>

            {Array.isArray(selected.documents) && selected.documents.length > 0 && (
              <section>
                <h4 className="text-xs font-semibold uppercase text-slate-500">
                  Submitted Documents
                </h4>
                <ul className="mt-2 space-y-2">
                  {selected.documents.map((doc) => (
                    <li
                      key={doc.url || doc.name}
                      className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200"
                    >
                      <span>{doc.label || doc.name}</span>
                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-sky-500 hover:text-sky-600"
                        >
                          View
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {selected.checklist && (
              <section>
                <h4 className="text-xs font-semibold uppercase text-slate-500">
                  Verification Checklist
                </h4>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {Object.entries(selected.checklist).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      <span className="capitalize">
                        {key.replace(/[_-]/g, " ")}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${value === true || value === "passed"
                            ? "bg-emerald-100 text-emerald-700"
                            : value === false || value === "failed"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                      >
                        {typeof value === "boolean" ? (value ? "passed" : "failed") : value}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <label className="text-xs font-semibold uppercase text-slate-500">
                Internal note
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={(evt) => setNote(evt.target.value)}
                placeholder="Add reviewer notes or checklist findings…"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-700"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <button
                  type="button"
                  onClick={handleAddAudit}
                  disabled={!note?.trim()}
                  className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Add to audit log
                </button>
                {typeof onAssign === "function" && (
                  <>
                    <span className="text-slate-400 dark:text-slate-500">|</span>
                    <button
                      type="button"
                      onClick={() => handleAssign("self")}
                      className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      Assign to me
                    </button>
                  </>
                )}
              </div>
            </section>

            {Array.isArray(selected.auditTrail) && selected.auditTrail.length > 0 && (
              <section>
                <h4 className="text-xs font-semibold uppercase text-slate-500">
                  Audit trail
                </h4>
                <ul className="mt-2 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  {selected.auditTrail.map((entry, idx) => (
                    <li key={entry.timestamp || idx} className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900/50">
                      <p className="font-medium text-slate-700 dark:text-slate-100">
                        {entry.actor || "System"}{" "}
                        <span className="text-xs font-normal text-slate-400">
                          {formatDate(entry.timestamp)}
                        </span>
                      </p>
                      <p>{entry.message}</p>
                      {entry.status && (
                        <span className="mt-1 inline-flex rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {entry.status}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <footer className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:gap-4">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Close
              </button>

              <div className="flex flex-1 flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleStatusChange("needs_more_info")}
                  className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-300"
                >
                  Request Docs
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange("rejected")}
                  className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/50 dark:bg-rose-500/10 dark:text-rose-300"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange("approved")}
                  className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  Approve
                </button>
              </div>
            </footer>
          </div>
        )}
      </Modal>
    </div>
  );
}
