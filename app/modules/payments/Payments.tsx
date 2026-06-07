"use client";

import { useCallback, useState } from "react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { Input } from "@/components/forms/Input";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { Panel } from "@/components/Panel";
import { Select } from "@/components/forms/Select";
import { DocumentView, type DocPayload } from "@/components/DocumentView";
import { TableToolbar } from "@/components/TableToolbar";
import { DatePicker } from "@/components/forms/DatePicker";
import { api } from "@/lib/api";
import { useCan } from "@/lib/permissions";
import { useDebounced, usePaginatedTable } from "@/lib/usePaginatedTable";
import { PAYMENT_METHODS } from "@/lib/constants";
import type { Column, Company, Invoice, Payment } from "@/lib/types";
import { formatDate, money } from "@/lib/utils";

interface PaymentsProps {
  data: { payments: Payment[]; invoices: Invoice[]; company?: Company | null };
  reload: () => void;
  currency: string;
}

export function Payments({ data, reload, currency }: PaymentsProps) {
  const can = useCan();
  const canWrite = can("Payments", "write");
  const canDelete = can("Payments", "delete");
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<DocPayload | null>(null);
  const [form, setForm] = useState({
    paymentType: "incoming",
    invoiceId: data.invoices[0]?.id || "",
    amount: 0,
    paymentMethod: "Bank transfer",
    reference: "",
    notes: ""
  });
  const [editing, setEditing] = useState<Payment | null>(null);
  const [createBusy, setCreateBusy] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [busyRow, setBusyRow] = useState<string>("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const debouncedSearch = useDebounced(search);
  const { rows, meta, page, setPage, loading, refetch } = usePaginatedTable<Payment>("/api/payments", {
    search: debouncedSearch,
    paymentType: typeFilter,
    paymentMethod: methodFilter,
    dateFrom,
    dateTo
  });

  const refresh = useCallback(() => {
    reload();
    refetch();
  }, [reload, refetch]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setCreateBusy(true);
    try {
      if (form.invoiceId) {
        await api(`/api/invoices/${form.invoiceId}/mark-paid`, {
          method: "POST",
          body: JSON.stringify(form),
          successMessage: "Payment applied to invoice"
        });
      } else {
        await api("/api/payments", {
          method: "POST",
          body: JSON.stringify(form),
          successMessage: "Payment recorded"
        });
      }
      setOpen(false);
      refresh();
    } finally {
      setCreateBusy(false);
    }
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setEditBusy(true);
    try {
      await api(`/api/payments/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          amount: editing.amount,
          paymentMethod: editing.paymentMethod,
          reference: editing.reference,
          notes: editing.notes,
          paymentDate: editing.paymentDate
        }),
        successMessage: "Payment updated",
        successDetail: editing.reference || undefined
      });
      setEditing(null);
      refresh();
    } finally {
      setEditBusy(false);
    }
  }

  async function remove(id: string, reference: string) {
    if (!confirm("Delete this payment? Linked invoice balances will be restored.")) return;
    setBusyRow(`${id}:delete`);
    try {
      await api(`/api/payments/${id}`, {
        method: "DELETE",
        successMessage: "Payment deleted",
        successDetail: reference || undefined
      });
      refresh();
    } finally {
      setBusyRow("");
    }
  }

  const columns: Column<Payment>[] = [
    {
      key: "paymentType",
      label: "Type",
      render: (row) => <Badge tone={row.paymentType === "incoming" ? "low" : "medium"}>{row.paymentType}</Badge>
    },
    { key: "paymentDate", label: "Date", render: (row) => formatDate(row.paymentDate || row.createdAt) },
    { key: "paymentMethod", label: "Method" },
    { key: "reference", label: "Reference", render: (row) => row.reference || <span className="text-slate-400">—</span> },
    { key: "notes", label: "Notes", render: (row) => row.notes || <span className="text-slate-400">—</span> },
    { key: "amount", label: "Amount", align: "right", render: (row) => money(row.amount, row.currency || currency) },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="inline-flex gap-2">
          <Button
            variant="small"
            type="button"
            onClick={() => setViewing({ kind: "payment", record: row, invoice: data.invoices.find((item) => item.id === row.invoiceId) })}
          >
            View
          </Button>
          {canWrite ? <Button variant="small" type="button" onClick={() => setEditing(row)}>Edit</Button> : null}
          {canDelete ? (
            <Button
              variant="smallDanger"
              type="button"
              loading={busyRow === `${row.id}:delete`}
              onClick={() => remove(row.id, row.reference || "")}
            >
              Delete
            </Button>
          ) : null}
        </div>
      )
    }
  ];

  return (
    <Panel>
      <PageHeader
        title="Payments"
        subtitle="Track incoming and outgoing payments"
        count={data.payments.length}
        actionLabel="Record payment"
        onAction={canWrite ? () => setOpen(true) : undefined}
      />
      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <DatePicker label="From date" value={dateFrom} onChange={setDateFrom} placeholder="Any start date" />
        <DatePicker label="To date" value={dateTo} onChange={setDateTo} placeholder="Any end date" />
      </div>
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search reference, notes or method…"
        resultCount={meta.total}
        totalCount={data.payments.length}
        filters={[
          {
            key: "type",
            label: "Type",
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { label: "Incoming", value: "incoming" },
              { label: "Outgoing", value: "outgoing" }
            ]
          },
          {
            key: "method",
            label: "Method",
            value: methodFilter,
            onChange: setMethodFilter,
            options: PAYMENT_METHODS.map((value) => ({ label: value, value }))
          }
        ]}
      />
      <DataTable columns={columns} rows={rows.map((row) => ({ ...row, _key: row.id }))} empty="No payments match the current filters." />
      <Pagination
        page={page}
        totalPages={meta.totalPages}
        total={meta.total}
        pageSize={meta.pageSize}
        onPageChange={setPage}
        loading={loading}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Record payment"
        subtitle="Apply a payment against an invoice"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)} disabled={createBusy}>Cancel</Button>
            <Button type="submit" form="payment-form" loading={createBusy}>Save payment</Button>
          </>
        }
      >
        <form id="payment-form" className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
          <Select
            label="Invoice"
            value={form.invoiceId}
            onChange={(invoiceId) => setForm({ ...form, invoiceId })}
            options={data.invoices.map((item) => ({ label: `${item.invoiceNumber} · ${item.customerName}`, value: item.id }))}
          />
          <Input label="Amount" type="number" value={form.amount} onChange={(amount) => setForm({ ...form, amount: Number(amount) })} />
          <Select
            label="Payment method"
            value={form.paymentMethod}
            onChange={(paymentMethod) => setForm({ ...form, paymentMethod })}
            options={PAYMENT_METHODS}
          />
          <Input label="Reference" value={form.reference} onChange={(reference) => setForm({ ...form, reference })} />
          <div className="col-span-full">
            <Input label="Notes" value={form.notes} onChange={(notes) => setForm({ ...form, notes })} />
          </div>
        </form>
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit payment"
        subtitle={editing?.reference || ""}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setEditing(null)} disabled={editBusy}>Cancel</Button>
            <Button type="submit" form="payment-edit-form" loading={editBusy}>Save changes</Button>
          </>
        }
      >
        {editing ? (
          <form id="payment-edit-form" className="grid gap-4 sm:grid-cols-2" onSubmit={saveEdit}>
            <Input label="Amount" type="number" value={editing.amount} onChange={(amount) => setEditing({ ...editing, amount: Number(amount) })} />
            <Input label="Date" type="date" value={editing.paymentDate || ""} onChange={(paymentDate) => setEditing({ ...editing, paymentDate })} />
            <Select
              label="Payment method"
              value={editing.paymentMethod}
              onChange={(paymentMethod) => setEditing({ ...editing, paymentMethod })}
              options={PAYMENT_METHODS}
            />
            <Input label="Reference" value={editing.reference || ""} onChange={(reference) => setEditing({ ...editing, reference })} />
            <div className="col-span-full">
              <Input label="Notes" value={editing.notes || ""} onChange={(notes) => setEditing({ ...editing, notes })} />
            </div>
          </form>
        ) : null}
      </Modal>

      <DocumentView doc={viewing} onClose={() => setViewing(null)} company={data.company ?? null} currency={currency} />
    </Panel>
  );
}
