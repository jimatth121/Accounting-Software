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
import { PAYMENT_METHODS } from "@/lib/constants";
import type { Column, Company, Expense, Party } from "@/lib/types";
import { formatDate, money } from "@/lib/utils";

interface ExpensesProps {
  data: { expenses: Expense[]; vendors: Party[]; company?: Company | null };
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
  const [editing, setEditing] = useState<Expense | null>(null);
  const [viewing, setViewing] = useState<DocPayload | null>(null);
  const [createBusy, setCreateBusy] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [extractBusy, setExtractBusy] = useState(false);
  const [busyRow, setBusyRow] = useState<string>("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    data.expenses.forEach((e) => e.category && set.add(e.category));
    return Array.from(set).sort();
  }, [data.expenses]);

  const allStatuses = useMemo(() => {
    const set = new Set<string>(["Recorded", "Paid", "Pending"]);
    data.expenses.forEach((e) => e.status && set.add(e.status));
    return Array.from(set);
  }, [data.expenses]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return data.expenses.filter((row) => {
      if (categoryFilter !== "all" && row.category !== categoryFilter) return false;
      if (vendorFilter !== "all" && row.vendorId !== vendorFilter) return false;
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (dateFrom && (row.expenseDate || "") < dateFrom) return false;
      if (dateTo && (row.expenseDate || "") > dateTo) return false;
      if (term) {
        const blob = `${row.description || ""} ${row.vendorName || ""} ${row.category || ""} ${row.paymentMethod || ""}`.toLowerCase();
        if (!blob.includes(term)) return false;
      }
      return true;
    });
  }, [data.expenses, search, categoryFilter, vendorFilter, statusFilter, dateFrom, dateTo]);

  async function extractReceipt() {
    setExtractBusy(true);
    try {
      const result = await api<{ extractedData: Extraction }>("/api/ai/extract-document", {
        method: "POST",
        body: JSON.stringify({ fileName: form.receiptName }),
        successMessage: "Receipt extracted",
        successDetail: "Review the extracted values before saving"
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
    } finally {
      setExtractBusy(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setCreateBusy(true);
    try {
      await api("/api/expenses", {
        method: "POST",
        body: JSON.stringify(form),
        successMessage: "Expense recorded",
        successDetail: form.description
      });
      setExtraction(null);
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
      await api(`/api/expenses/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          vendorId: editing.vendorId,
          expenseDate: editing.expenseDate,
          amount: editing.amount,
          taxAmount: editing.taxAmount,
          category: editing.category,
          paymentMethod: editing.paymentMethod,
          description: editing.description,
          status: editing.status
        }),
        successMessage: "Expense updated",
        successDetail: editing.description
      });
      setEditing(null);
      reload();
    } finally {
      setEditBusy(false);
    }
  }

  async function remove(id: string, description: string) {
    if (!confirm("Delete this expense?")) return;
    setBusyRow(`${id}:delete`);
    try {
      await api(`/api/expenses/${id}`, {
        method: "DELETE",
        successMessage: "Expense deleted",
        successDetail: description
      });
      reload();
    } finally {
      setBusyRow("");
    }
  }

  const columns: Column<Expense>[] = [
    { key: "expenseDate", label: "Date", render: (row) => formatDate(row.expenseDate) },
    { key: "vendorName", label: "Vendor", render: (row) => <strong>{row.vendorName || "—"}</strong> },
    { key: "category", label: "Category", render: (row) => <Badge>{row.category}</Badge> },
    { key: "description", label: "Description", render: (row) => row.description || <span className="text-slate-400">—</span> },
    { key: "paymentMethod", label: "Method" },
    { key: "amount", label: "Amount", align: "right", render: (row) => money(row.amount, row.currency || currency) },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="inline-flex gap-2">
          <Button variant="small" type="button" onClick={() => setViewing({ kind: "expense", record: row })}>View</Button>
          <Button variant="small" type="button" onClick={() => setEditing(row)}>Edit</Button>
          <Button
            variant="smallDanger"
            type="button"
            loading={busyRow === `${row.id}:delete`}
            onClick={() => remove(row.id, row.description || row.vendorName || "")}
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
        title="Expenses"
        subtitle="Track business spending"
        count={data.expenses.length}
        actionLabel="Record expense"
        onAction={() => setOpen(true)}
      />
      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <DatePicker label="From date" value={dateFrom} onChange={setDateFrom} placeholder="Any start date" />
        <DatePicker label="To date" value={dateTo} onChange={setDateTo} placeholder="Any end date" />
      </div>
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search description, vendor, category or method…"
        resultCount={filtered.length}
        totalCount={data.expenses.length}
        filters={[
          {
            key: "category",
            label: "Category",
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: allCategories.map((value) => ({ label: value, value }))
          },
          {
            key: "vendor",
            label: "Vendor",
            value: vendorFilter,
            onChange: setVendorFilter,
            options: data.vendors.map((v) => ({ label: v.name, value: v.id }))
          },
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: allStatuses.map((value) => ({ label: value, value }))
          }
        ]}
      />
      <DataTable columns={columns} rows={filtered.map((row) => ({ ...row, _key: row.id }))} empty="No expenses match the current filters." />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Record expense"
        subtitle="Log a business expense or upload a receipt"
        size="lg"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)} disabled={createBusy}>Cancel</Button>
            <Button type="submit" form="expense-form" loading={createBusy}>Save expense</Button>
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
            <Button variant="secondary" type="button" onClick={extractReceipt} loading={extractBusy}>
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

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit expense"
        subtitle={editing?.description || ""}
        size="lg"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setEditing(null)} disabled={editBusy}>Cancel</Button>
            <Button type="submit" form="expense-edit-form" loading={editBusy}>Save changes</Button>
          </>
        }
      >
        {editing ? (
          <form id="expense-edit-form" className="grid gap-4 sm:grid-cols-2" onSubmit={saveEdit}>
            <Select
              label="Vendor"
              value={editing.vendorId || ""}
              onChange={(vendorId) => setEditing({ ...editing, vendorId })}
              options={data.vendors.map((item) => ({ label: item.name, value: item.id }))}
            />
            <Input label="Expense date" type="date" value={editing.expenseDate || ""} onChange={(expenseDate) => setEditing({ ...editing, expenseDate })} />
            <Input label="Amount" type="number" value={editing.amount} onChange={(amount) => setEditing({ ...editing, amount: Number(amount) })} />
            <Input label="Tax amount" type="number" value={editing.taxAmount || 0} onChange={(taxAmount) => setEditing({ ...editing, taxAmount: Number(taxAmount) })} />
            <Input label="Category" value={editing.category || ""} onChange={(category) => setEditing({ ...editing, category })} />
            <Select
              label="Payment method"
              value={editing.paymentMethod || "Bank transfer"}
              onChange={(paymentMethod) => setEditing({ ...editing, paymentMethod })}
              options={PAYMENT_METHODS}
            />
            <Select label="Status" value={editing.status || "Recorded"} onChange={(status) => setEditing({ ...editing, status })} options={["Recorded", "Paid", "Pending"]} />
            <div className="col-span-full">
              <Input label="Description" value={editing.description || ""} onChange={(description) => setEditing({ ...editing, description })} />
            </div>
          </form>
        ) : null}
      </Modal>

      <DocumentView doc={viewing} onClose={() => setViewing(null)} company={data.company ?? null} currency={currency} />
    </Panel>
  );
}
