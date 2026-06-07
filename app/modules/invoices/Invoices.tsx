"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { Input } from "@/components/forms/Input";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { Panel } from "@/components/Panel";
import { Select } from "@/components/forms/Select";
import { Combobox, type ComboboxOption } from "@/components/forms/Combobox";
import { DocumentView, type DocPayload } from "@/components/DocumentView";
import { TableToolbar } from "@/components/TableToolbar";
import { DatePicker } from "@/components/forms/DatePicker";
import { api } from "@/lib/api";
import { useCan } from "@/lib/permissions";
import { useDebounced, usePaginatedTable } from "@/lib/usePaginatedTable";
import type { Column, Company, InventoryItem, Invoice, Party } from "@/lib/types";
import { clsx, formatDate, money } from "@/lib/utils";

interface InvoicesProps {
  data: { invoices: Invoice[]; customers: Party[]; inventory?: InventoryItem[]; company?: Company | null };
  reload: () => void;
}

interface LineItem {
  rowId: string;
  description: string;
  inventoryId: string;
  quantity: number;
  unitPrice: number;
}

function newRow(): LineItem {
  return {
    rowId: `row_${Math.random().toString(36).slice(2, 9)}`,
    description: "",
    inventoryId: "",
    quantity: 0,
    unitPrice: 0
  };
}

export function Invoices({ data, reload }: InvoicesProps) {
  const can = useCan();
  const canWrite = can("Invoices", "write");
  const canDelete = can("Invoices", "delete");
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<DocPayload | null>(null);
  const currency = data.company?.defaultCurrency || "NGN";
  const inventory = data.inventory || [];
  const [form, setForm] = useState({
    customerId: data.customers[0]?.id || "",
    customerName: data.customers[0]?.name || "",
    dueDate: new Date().toISOString().slice(0, 10),
    taxRate: 0,
    status: "Sent"
  });
  const [lines, setLines] = useState<LineItem[]>([newRow()]);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [createBusy, setCreateBusy] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [busyRow, setBusyRow] = useState<string>("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const debouncedSearch = useDebounced(search);
  const { rows, meta, page, setPage, loading, refetch } = usePaginatedTable<Invoice>("/api/invoices", {
    search: debouncedSearch,
    status: statusFilter,
    customerId: customerFilter,
    dateFrom,
    dateTo
  });

  // Refresh both the bootstrap data (dropdowns / counts) and the current page.
  const refresh = useCallback(() => {
    reload();
    refetch();
  }, [reload, refetch]);

  const allStatuses = useMemo(() => {
    const set = new Set<string>(["Draft", "Sent", "Viewed", "Partially paid", "Paid", "Overdue", "Cancelled"]);
    data.invoices.forEach((inv) => set.add(inv.status));
    return Array.from(set);
  }, [data.invoices]);

  // Customers are selectable, but a free-typed name is also accepted — a new
  // customer record is created on submit before the invoice itself.
  const customerOptions: ComboboxOption[] = data.customers.map((customer) => ({
    label: customer.name,
    value: customer.id,
    hint: customer.companyName || customer.email || ""
  }));

  function pickCustomer(label: string, option: ComboboxOption | null) {
    setForm((prev) => ({ ...prev, customerName: label, customerId: option ? option.value : "" }));
  }

  const customerIsNew = !form.customerId && form.customerName.trim().length > 0;

  // Inventory items become selectable options; the Combobox also accepts a
  // free-typed value so users can invoice for one-off items not in stock.
  const itemOptions: ComboboxOption[] = inventory.map((item) => ({
    label: item.name,
    value: item.id,
    hint: `${item.sku} · ${item.quantity} in stock · ${money(item.unitPrice, currency)}`,
    badge: item.quantity <= item.reorderLevel ? "Low" : undefined
  }));

  function patchLine(rowId: string, patch: Partial<LineItem>) {
    setLines((prev) => prev.map((line) => (line.rowId === rowId ? { ...line, ...patch } : line)));
  }

  function pickItem(rowId: string, label: string, option: ComboboxOption | null) {
    const found = option ? inventory.find((entry) => entry.id === option.value) : undefined;
    patchLine(rowId, {
      description: label,
      inventoryId: found?.id || "",
      // Pull the inventory unit price when an item is selected; keep the
      // existing price for a custom item.
      unitPrice: found ? found.unitPrice : lines.find((line) => line.rowId === rowId)?.unitPrice || 0
    });
  }

  function addRow() {
    setLines((prev) => [...prev, newRow()]);
  }

  function removeRow(rowId: string) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((line) => line.rowId !== rowId)));
  }

  const safeTaxRate = Math.max(0, Number(form.taxRate) || 0);

  const linesWithMeta = useMemo(() => {
    return lines.map((line) => {
      const inventoryItem = line.inventoryId ? inventory.find((entry) => entry.id === line.inventoryId) : null;
      const qty = Math.max(1, Number(line.quantity) || 1);
      const price = Math.max(0, Number(line.unitPrice) || 0);
      const subtotal = qty * price;
      const taxAmount = subtotal * (safeTaxRate / 100);
      const total = subtotal + taxAmount;
      const overSelling = inventoryItem ? qty > inventoryItem.quantity : false;
      return { ...line, inventoryItem, qty, price, subtotal, taxAmount, total, overSelling };
    });
  }, [lines, inventory, safeTaxRate]);

  const subtotal = linesWithMeta.reduce((sum, line) => sum + line.subtotal, 0);
  const taxTotal = linesWithMeta.reduce((sum, line) => sum + line.taxAmount, 0);
  const grandTotal = subtotal + taxTotal;

  const linesReady = linesWithMeta.every((line) => line.description.trim().length > 0);
  const anyOversell = linesWithMeta.some((line) => line.overSelling);
  const customerReady = Boolean(form.customerId) || form.customerName.trim().length > 0;
  const canSubmit = customerReady && linesReady && grandTotal > 0 && !anyOversell;

  function openCreate() {
    setForm({
      customerId: data.customers[0]?.id || "",
      customerName: data.customers[0]?.name || "",
      dueDate: new Date().toISOString().slice(0, 10),
      taxRate: 0,
      status: "Sent"
    });
    setLines([newRow()]);
    setOpen(true);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setCreateBusy(true);
    try {
      // A new customer must exist before the invoice can reference its id, so
      // create it first and use the returned id.
      let customerId = form.customerId;
      if (!customerId) {
        const created = await api<{ id: string }>("/api/customers", {
          method: "POST",
          body: JSON.stringify({ name: form.customerName.trim(), notes: "Created from an invoice" }),
          successMessage: "Customer created",
          successDetail: form.customerName.trim()
        });
        customerId = created.id;
      }

      const items = linesWithMeta.map((line) => ({
        ...(line.inventoryId ? { inventoryId: line.inventoryId } : {}),
        description: line.description.trim(),
        quantity: line.qty,
        unitPrice: line.price,
        taxRate: safeTaxRate,
        discountAmount: 0
      }));
      await api<{ invoiceNumber: string }>("/api/invoices", {
        method: "POST",
        body: JSON.stringify({
          customerId,
          dueDate: form.dueDate,
          status: form.status,
          items
        }),
        successMessage: "Invoice created",
        successDetail: `${items.length} item${items.length === 1 ? "" : "s"} · ${money(grandTotal, currency)}`
      });
      setOpen(false);
      setLines([newRow()]);
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
      refresh();
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
      refresh();
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
      refresh();
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
          {canWrite ? (
            <Button
              variant="small"
              disabled={!row.balanceDue}
              loading={busyRow === `${row.id}:paid`}
              onClick={() => markPaid(row)}
              type="button"
            >
              Mark paid
            </Button>
          ) : null}
          {canWrite ? <Button variant="small" type="button" onClick={() => setEditing(row)}>Edit</Button> : null}
          {canDelete ? (
            <Button
              variant="smallDanger"
              type="button"
              loading={busyRow === `${row.id}:delete`}
              onClick={() => remove(row.id, row.invoiceNumber)}
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
        title="Invoices"
        subtitle="Track and manage billing"
        count={data.invoices.length}
        actionLabel="Create invoice"
        onAction={canWrite ? openCreate : undefined}
      />
      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <DatePicker label="From issue date" value={dateFrom} onChange={setDateFrom} placeholder="Any start date" />
        <DatePicker label="To issue date" value={dateTo} onChange={setDateTo} placeholder="Any end date" />
      </div>
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search invoice #, customer or status…"
        resultCount={meta.total}
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
      <DataTable columns={columns} rows={rows.map((row) => ({ ...row, _key: row.id }))} empty="No invoices match the current filters." />
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
        title="Create invoice"
        subtitle="Bill a customer for goods or services"
        size="xl"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)} disabled={createBusy}>Cancel</Button>
            <Button type="submit" form="invoice-form" loading={createBusy} disabled={!canSubmit}>Create invoice</Button>
          </>
        }
      >
        <form id="invoice-form" className="grid gap-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Combobox
                label="Customer"
                value={form.customerName}
                onChange={pickCustomer}
                options={customerOptions}
                placeholder="Search a customer or type a new name…"
                required
                emptyHint="No match — a new customer will be created with this name."
              />
              {customerIsNew ? (
                <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-fuchsia-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-fuchsia-700">
                  <CheckCircle2 className="h-3 w-3" />
                  New customer — will be created on save
                </p>
              ) : null}
            </div>
            <Input label="Due date" type="date" value={form.dueDate} onChange={(dueDate) => setForm({ ...form, dueDate })} />
            <Input label="Tax rate %" type="number" value={form.taxRate} onChange={(taxRate) => setForm({ ...form, taxRate: Number(taxRate) })} />
            <Select label="Status" value={form.status} onChange={(status) => setForm({ ...form, status })} options={["Draft", "Sent", "Viewed"]} />
          </div>

          {/* Line items — choose an item from inventory or type a custom one */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Items</p>
                <p className="mt-0.5 text-xs text-slate-400">Select from inventory or type a custom item. Add as many as you need.</p>
              </div>
              <Button variant="secondary" type="button" onClick={addRow}>
                <Plus className="h-4 w-4" />
                Add item
              </Button>
            </div>

            <div className="hidden grid-cols-[2fr_80px_130px_110px_36px] gap-3 px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 md:grid">
              <span>Item</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Unit price</span>
              <span className="text-right">Line total</span>
              <span />
            </div>

            <div className="grid gap-3">
              {linesWithMeta.map((line, index) => (
                <div
                  key={line.rowId}
                  className={clsx(
                    "grid gap-3 rounded-2xl border bg-slate-50/60 p-3 transition md:grid-cols-[2fr_80px_130px_110px_36px] md:items-center",
                    line.overSelling ? "border-rose-300 bg-rose-50/70" : "border-slate-200"
                  )}
                >
                  <div>
                    <Combobox
                      label={`Item ${index + 1}`}
                      value={line.description}
                      onChange={(label, option) => pickItem(line.rowId, label, option)}
                      options={itemOptions}
                      placeholder="Search inventory or type a custom item…"
                      required
                      emptyHint="No matches — this will be saved as a custom one-off item."
                    />
                    {line.inventoryItem ? (
                      <p
                        className={clsx(
                          "mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          line.overSelling ? "bg-rose-100 text-rose-700" : "bg-emerald-50 text-emerald-700"
                        )}
                      >
                        {line.overSelling ? <AlertCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                        {line.overSelling
                          ? `Only ${line.inventoryItem.quantity} in stock`
                          : `${line.inventoryItem.quantity} → ${Math.max(0, line.inventoryItem.quantity - line.qty)} after invoice`}
                      </p>
                    ) : line.description.trim() ? (
                      <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Custom item
                      </p>
                    ) : null}
                  </div>

                  <Input
                    label="Qty"
                    type="number"
                    value={line.quantity}
                    onChange={(v) => patchLine(line.rowId, { quantity: Math.max(1, Number(v) || 1) })}
                  />
                  <Input
                    label="Unit price"
                    type="number"
                    value={line.unitPrice}
                    onChange={(v) => patchLine(line.rowId, { unitPrice: Math.max(0, Number(v) || 0) })}
                  />
                  <div className="flex h-full flex-col justify-end">
                    <p className="text-[11px] font-medium text-slate-500 md:hidden">Line total</p>
                    <p className="text-right text-base font-extrabold tabular-nums text-slate-900">
                      {money(line.total, currency)}
                    </p>
                  </div>
                  <div className="flex items-end justify-end">
                    <button
                      type="button"
                      onClick={() => removeRow(line.rowId)}
                      disabled={lines.length <= 1}
                      aria-label="Remove line"
                      className={clsx(
                        "flex h-9 w-9 items-center justify-center rounded-xl border transition",
                        lines.length <= 1
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300"
                          : "border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
                      )}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 grid gap-1 rounded-2xl bg-slate-100/70 px-4 py-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-500">Subtotal</span>
                <span className="font-semibold text-slate-800 tabular-nums">{money(subtotal, currency)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-500">Tax ({safeTaxRate}%)</span>
                <span className="font-semibold text-slate-800 tabular-nums">{money(taxTotal, currency)}</span>
              </div>
              <div className="my-1 border-t border-dashed border-slate-300/70" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total</span>
                <span className="text-lg font-extrabold tabular-nums text-brand-700">{money(grandTotal, currency)}</span>
              </div>
            </div>
          </div>
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
