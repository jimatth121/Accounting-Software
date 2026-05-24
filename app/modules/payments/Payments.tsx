"use client";

import { useState } from "react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { Input } from "@/components/forms/Input";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { Select } from "@/components/forms/Select";
import { api } from "@/lib/api";
import { PAYMENT_METHODS } from "@/lib/constants";
import type { Column, Invoice, Payment } from "@/lib/types";
import { formatDate, money } from "@/lib/utils";

interface PaymentsProps {
  data: { payments: Payment[]; invoices: Invoice[] };
  reload: () => void;
  currency: string;
}

export function Payments({ data, reload, currency }: PaymentsProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    paymentType: "incoming",
    invoiceId: data.invoices[0]?.id || "",
    amount: 50000,
    paymentMethod: "Bank transfer",
    reference: "",
    notes: ""
  });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (form.invoiceId) {
      await api(`/api/invoices/${form.invoiceId}/mark-paid`, { method: "POST", body: JSON.stringify(form) });
    } else {
      await api("/api/payments", { method: "POST", body: JSON.stringify(form) });
    }
    setOpen(false);
    reload();
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
    { key: "amount", label: "Amount", align: "right", render: (row) => money(row.amount, row.currency || currency) }
  ];

  return (
    <Panel>
      <PageHeader
        title="Payments"
        subtitle="Track incoming and outgoing payments"
        count={data.payments.length}
        actionLabel="Record payment"
        onAction={() => setOpen(true)}
      />
      <DataTable columns={columns} rows={data.payments.map((row) => ({ ...row, _key: row.id }))} empty="No payments yet" />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Record payment"
        subtitle="Apply a payment against an invoice"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form="payment-form">Save payment</Button>
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
    </Panel>
  );
}
