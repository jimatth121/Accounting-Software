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
import type { Column, Invoice, Party } from "@/lib/types";
import { formatDate, money } from "@/lib/utils";

interface InvoicesProps {
  data: { invoices: Invoice[]; customers: Party[] };
  reload: () => void;
}

export function Invoices({ data, reload }: InvoicesProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    customerId: data.customers[0]?.id || "",
    dueDate: new Date().toISOString().slice(0, 10),
    description: "Accounting services",
    amount: 100000,
    taxRate: 7.5,
    status: "Sent"
  });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await api("/api/invoices", {
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
      })
    });
    setOpen(false);
    reload();
  }

  async function markPaid(invoice: Invoice) {
    await api(`/api/invoices/${invoice.id}/mark-paid`, {
      method: "POST",
      body: JSON.stringify({ amount: invoice.balanceDue })
    });
    reload();
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
        <Button variant="small" disabled={!row.balanceDue} onClick={() => markPaid(row)} type="button">
          Mark paid
        </Button>
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
      <DataTable columns={columns} rows={data.invoices.map((row) => ({ ...row, _key: row.id }))} empty="No invoices yet" />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create invoice"
        subtitle="Bill a customer for goods or services"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form="invoice-form">Create invoice</Button>
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
    </Panel>
  );
}
