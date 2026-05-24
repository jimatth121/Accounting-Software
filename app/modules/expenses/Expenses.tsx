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
import type { Column, Expense, Party } from "@/lib/types";
import { formatDate, money } from "@/lib/utils";

interface ExpensesProps {
  data: { expenses: Expense[]; vendors: Party[] };
  reload: () => void;
  currency: string;
}

interface Extraction {
  vendorId: string;
  vendorName: string;
  date: string;
  totalAmount: number;
  taxAmount: number;
  currency: string;
  categorySuggestion: string;
  paymentMethod: string;
  receiptNumber: string;
}

export function Expenses({ data, reload, currency }: ExpensesProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    vendorId: data.vendors[0]?.id || "",
    expenseDate: new Date().toISOString().slice(0, 10),
    amount: 25000,
    taxAmount: 0,
    category: "Software/Hosting",
    paymentMethod: "Card",
    description: "Business expense",
    status: "Recorded",
    receiptName: ""
  });
  const [extraction, setExtraction] = useState<Extraction | null>(null);

  async function extractReceipt() {
    const result = await api<{ extractedData: Extraction }>("/api/ai/extract-document", {
      method: "POST",
      body: JSON.stringify({ fileName: form.receiptName })
    });
    setExtraction(result.extractedData);
    setForm({
      ...form,
      vendorId: result.extractedData.vendorId,
      expenseDate: result.extractedData.date,
      amount: result.extractedData.totalAmount,
      taxAmount: result.extractedData.taxAmount,
      category: result.extractedData.categorySuggestion,
      paymentMethod: result.extractedData.paymentMethod,
      description: `Receipt ${result.extractedData.receiptNumber}`
    });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await api("/api/expenses", { method: "POST", body: JSON.stringify(form) });
    setExtraction(null);
    setOpen(false);
    reload();
  }

  const columns: Column<Expense>[] = [
    { key: "expenseDate", label: "Date", render: (row) => formatDate(row.expenseDate) },
    { key: "vendorName", label: "Vendor", render: (row) => <strong>{row.vendorName || "—"}</strong> },
    { key: "category", label: "Category", render: (row) => <Badge>{row.category}</Badge> },
    { key: "description", label: "Description", render: (row) => row.description || <span className="text-slate-400">—</span> },
    { key: "paymentMethod", label: "Method" },
    { key: "amount", label: "Amount", align: "right", render: (row) => money(row.amount, row.currency || currency) }
  ];

  return (
    <Panel>
      <PageHeader
        title="Expenses"
        subtitle="Track business spending"
        count={data.expenses.length}
        actionLabel="Record expense"
        onAction={() => setOpen(true)}
      />
      <DataTable columns={columns} rows={data.expenses.map((row) => ({ ...row, _key: row.id }))} empty="No expenses yet" />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Record expense"
        subtitle="Log a business expense or upload a receipt"
        size="lg"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form="expense-form">Save expense</Button>
          </>
        }
      >
        <form id="expense-form" className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
          <Select
            label="Vendor"
            value={form.vendorId}
            onChange={(vendorId) => setForm({ ...form, vendorId })}
            options={data.vendors.map((item) => ({ label: item.name, value: item.id }))}
          />
          <Input label="Expense date" type="date" value={form.expenseDate} onChange={(expenseDate) => setForm({ ...form, expenseDate })} />

          <div className="col-span-full grid gap-2.5 rounded-xl border border-dashed border-brand-500 bg-brand-50 p-4">
            <Input label="Receipt file name" value={form.receiptName} onChange={(receiptName) => setForm({ ...form, receiptName })} />
            <Button variant="secondary" type="button" onClick={extractReceipt}>
              ✦ Extract receipt with AI
            </Button>
            {extraction ? (
              <p className="text-xs text-slate-600">
                Review required: extracted {money(extraction.totalAmount, extraction.currency)} from {extraction.vendorName}.
              </p>
            ) : null}
          </div>

          <Input label="Amount" type="number" value={form.amount} onChange={(amount) => setForm({ ...form, amount: Number(amount) })} />
          <Input label="Tax amount" type="number" value={form.taxAmount} onChange={(taxAmount) => setForm({ ...form, taxAmount: Number(taxAmount) })} />
          <Input label="Category" value={form.category} onChange={(category) => setForm({ ...form, category })} />
          <Select
            label="Payment method"
            value={form.paymentMethod}
            onChange={(paymentMethod) => setForm({ ...form, paymentMethod })}
            options={PAYMENT_METHODS}
          />
          <div className="col-span-full">
            <Input label="Description" value={form.description} onChange={(description) => setForm({ ...form, description })} />
          </div>
        </form>
      </Modal>
    </Panel>
  );
}
