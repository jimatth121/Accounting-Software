"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { Input } from "@/components/forms/Input";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { Select } from "@/components/forms/Select";
import { DocumentView, type DocPayload } from "@/components/DocumentView";
import { TableToolbar } from "@/components/TableToolbar";
import { DatePicker } from "@/components/forms/DatePicker";
import { api } from "@/lib/api";
import type { Column, Company, Invoice, Party } from "@/lib/types";
import { formatDate, money } from "@/lib/utils";

interface InvoicesProps {
  data: { invoices: Invoice[]; customers: Party[]; company?: Company | null };
  reload: () => void;
}

export function Invoices({ data, reload }: InvoicesProps) {
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<DocPayload | null>(null);
  const currency = data.company?.defaultCurrency || "NGN";
  const [form, setForm] = useState({
    customerId: data.customers[0]?.id || "",
    dueDate: new Date().toISOString().slice(0, 10),
    description: "Accounting services",
    amount: 100000,
    taxRate: 7.5,
    status: "Sent"
  });
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [createBusy, setCreateBusy] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [busyRow, setBusyRow] = useState<string>("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return data.invoices.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (customerFilter !== "all" && row.customerId !== customerFilter) return false;
      if (dateFrom && (row.issueDate || "") < dateFrom) return false;
      if (dateTo && (row.issueDate || "") > dateTo) return false;
      if (term) {
        const blob = `${row.invoiceNumber} ${row.customerName} ${row.status}`.toLowerCase();
        if (!blob.includes(term)) return false;
      }
      return true;
    });
  }, [data.invoices, search, statusFilter, customerFilter, dateFrom, dateTo]);

  const allStatuses = useMemo(() => {
    const set = new Set<string>(["Draft", "Sent", "Viewed", "Partially paid", "Paid", "Overdue", "Cancelled"]);
    data.invoices.forEach((inv) => set.add(inv.status));
    return Array.from(set);
  }, [data.invoices]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setCreateBusy(true);
    try {
      const result = await api<{ invoiceNumber: string }>("/api/invoices", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          items: [
            {
              description: form.description,
              quantity: 1,
              unitPrice: Number(form.amount),
              taxRate: Number(form.taxRate),
              discountAmount: 0
            }
          ]
        }),
        successMessage: "Invoice created",
        successDetail: undefined
      });
      if (result?.invoiceNumber) {
        // re-use the toast already shown; nothing extra needed
      }
      setOpen(false);
      reload();
    } finally {
      setCreateBusy(false);
    }
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setEditBusy(true);
    try {
      await api(`/api/invoices/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          customerId: editing.customerId,
          dueDate: editing.dueDate,
          status: editing.status
        }),
        successMessage: "Invoice updated",
        successDetail: editing.invoiceNumber
      });
      setEditing(null);
      reload();
    } finally {
      setEditBusy(false);
    }
  }

  async function markPaid(invoice: Invoice) {
    setBusyRow(`${invoice.id}:paid`);
    try {
      await api(`/api/invoices/${invoice.id}/mark-paid`, {
        method: "POST",
        body: JSON.stringify({ amount: invoice.balanceDue }),
        successMessage: "Invoice marked as paid",
        successDetail: invoice.invoiceNumber
      });
      reload();
    } finally {
      setBusyRow("");
    }
  }

  async function remove(id: string, number: string) {
    if (!confirm("Delete this invoice? Linked payments will also be removed.")) return;
    setBusyRow(`${id}:delete`);
    try {
      await api(`/api/invoices/${id}`, {
        method: "DELETE",
        successMessage: "Invoice deleted",
        successDetail: number
      });
      reload();
    } finally {
      setBusyRow("");
    }
  }

  const columns: Column<Invoice>[] = [
    { key: "invoiceNumber", label: "Invoice #", render: (row) => <strong>{row.invoiceNumber}</strong> },
    { key: "customerName", label: "Customer" },
    { key: "dueDate", label: "Due date", render: (row) => formatDate(row.dueDate) },
    { key: "totalAmount", label: "Amount", align: "right", render: (row) => money(row.totalAmount, row.currency) },
    {
      key: "balanceDue",
      label: "Balance",
      align: "right",
      render: (row) => (
        <span className={row.balanceDue > 0 ? "font-bold text-rose-600" : "text-slate-400"}>
          {money(row.balanceDue, row.currency)}
        </span>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <Badge tone={row.balanceDue > 0 ? "medium" : "low"}>{row.status}</Badge>
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="inline-flex gap-2">
          <Button variant="small" type="button" onClick={() => setViewing({ kind: "invoice", record: row })}>View</Button>
          <Button
            variant="small"
            disabled={!row.balanceDue}
            loading={busyRow === `${row.id}:paid`}
            onClick={() => markPaid(row)}
            type="button"
          >
            Mark paid
          </Button>
          <Button variant="small" type="button" onClick={() => setEditing(row)}>Edit</Button>
          <Button
            variant="smallDanger"
            type="button"
            loading={busyRow === `${row.id}:delete`}
            onClick={() => remove(row.id, row.invoiceNumber)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <Panel>
      <PageHeader
        title="Invoices"
        subtitle="Track and manage billing"
        count={data.invoices.length}
        actionLabel="Create invoice"
        onAction={() => setOpen(true)}
      />
      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <DatePicker label="From issue date" value={dateFrom} onChange={setDateFrom} placeholder="Any start date" />
        <DatePicker label="To issue date" value={dateTo} onChange={setDateTo} placeholder="Any end date" />
      </div>
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search invoice #, customer or status…"
        resultCount={filtered.length}
        totalCount={data.invoices.length}
        filters={[
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: allStatuses.map((value) => ({ label: value, value }))
          },
          {
            key: "customer",
            label: "Customer",
            value: customerFilter,
            onChange: setCustomerFilter,
            options: data.customers.map((c) => ({ label: c.name, value: c.id }))
          }
        ]}
      />
      <DataTable columns={columns} rows={filtered.map((row) => ({ ...row, _key: row.id }))} empty="No invoices match the current filters." />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create invoice"
        subtitle="Bill a customer for goods or services"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)} disabled={createBusy}>Cancel</Button>
            <Button type="submit" form="invoice-form" loading={createBusy}>Create invoice</Button>
          </>
        }
      >
        <form id="invoice-form" className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
          <Select
            label="Customer"
            value={form.customerId}
            onChange={(customerId) => setForm({ ...form, customerId })}
            options={data.customers.map((item) => ({ label: item.name, value: item.id }))}
          />
          <Input label="Due date" type="date" value={form.dueDate} onChange={(dueDate) => setForm({ ...form, dueDate })} />
          <Input label="Item description" value={form.description} onChange={(description) => setForm({ ...form, description })} />
          <Input label="Amount" type="number" value={form.amount} onChange={(amount) => setForm({ ...form, amount: Number(amount) })} />
          <Input label="Tax rate %" type="number" value={form.taxRate} onChange={(taxRate) => setForm({ ...form, taxRate: Number(taxRate) })} />
          <Select label="Status" value={form.status} onChange={(status) => setForm({ ...form, status })} options={["Draft", "Sent", "Viewed"]} />
        </form>
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit invoice"
        subtitle={editing ? editing.invoiceNumber : ""}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setEditing(null)} disabled={editBusy}>Cancel</Button>
            <Button type="submit" form="invoice-edit-form" loading={editBusy}>Save changes</Button>
          </>
        }
      >
        {editing ? (
          <form id="invoice-edit-form" className="grid gap-4 sm:grid-cols-2" onSubmit={saveEdit}>
            <Select
              label="Customer"
              value={editing.customerId}
              onChange={(customerId) => setEditing({ ...editing, customerId })}
              options={data.customers.map((item) => ({ label: item.name, value: item.id }))}
            />
            <Input label="Due date" type="date" value={editing.dueDate || ""} onChange={(dueDate) => setEditing({ ...editing, dueDate })} />
            <Select label="Status" value={editing.status} onChange={(status) => setEditing({ ...editing, status })} options={["Draft", "Sent", "Viewed", "Partially paid", "Paid", "Cancelled"]} />
          </form>
        ) : null}
      </Modal>

      <DocumentView doc={viewing} onClose={() => setViewing(null)} company={data.company ?? null} currency={currency} />
    </Panel>
  );
}
