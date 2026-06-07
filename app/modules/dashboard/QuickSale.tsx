"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  Receipt,
  ShoppingCart,
  Sparkles,
  Trash2
} from "lucide-react";
import { Button } from "@/components/Button";
import { Combobox, type ComboboxOption } from "@/components/forms/Combobox";
import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";
import { api } from "@/lib/api";
import { PAYMENT_METHODS } from "@/lib/constants";
import type { AppData, InventoryItem, Party } from "@/lib/types";
import { clsx, money } from "@/lib/utils";

interface QuickSaleProps {
  data: AppData;
  reload: () => void;
  currency: string;
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

const DEFAULT_TAX = 0;

export function QuickSale({ data, reload, currency }: QuickSaleProps) {
  const customers = data.customers || [];
  const inventory = data.inventory || [];

  const [customerId, setCustomerId] = useState<string>(customers[0]?.id || "");
  const [customerName, setCustomerName] = useState<string>(customers[0]?.name || "");
  const [lines, setLines] = useState<LineItem[]>([newRow()]);
  const [taxRate, setTaxRate] = useState<number>(DEFAULT_TAX);
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [amountPaidInput, setAmountPaidInput] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const itemOptions: ComboboxOption[] = inventory.map((item) => ({
    label: item.name,
    value: item.id,
    hint: `${item.sku} · ${item.quantity} in stock · ${money(item.unitPrice, currency)}`,
    badge: item.quantity <= item.reorderLevel ? "Low" : undefined
  }));

  const customerOptions: ComboboxOption[] = customers.map((customer: Party) => ({
    label: customer.name,
    value: customer.id,
    hint: customer.companyName || customer.email || ""
  }));

  function pickCustomer(label: string, option: ComboboxOption | null) {
    setCustomerName(label);
    setCustomerId(option ? option.value : "");
  }

  function patchLine(rowId: string, patch: Partial<LineItem>) {
    setLines((prev) => prev.map((line) => (line.rowId === rowId ? { ...line, ...patch } : line)));
  }

  function pickItem(rowId: string, label: string, option: ComboboxOption | null) {
    const found: InventoryItem | undefined = option
      ? inventory.find((entry) => entry.id === option.value)
      : undefined;
    patchLine(rowId, {
      description: label,
      inventoryId: found?.id || "",
      unitPrice: found ? found.unitPrice : lines.find((line) => line.rowId === rowId)?.unitPrice || 0
    });
  }

  function addRow() {
    setLines((prev) => [...prev, newRow()]);
  }

  function removeRow(rowId: string) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((line) => line.rowId !== rowId)));
  }

  const safeTaxRate = Math.max(0, Number(taxRate) || 0);

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
  const taxAmount = linesWithMeta.reduce((sum, line) => sum + line.taxAmount, 0);
  const total = subtotal + taxAmount;

  // Default amountPaid to the full total, but allow the user to override.
  const amountPaid = useMemo(() => {
    if (amountPaidInput === "") return total;
    const parsed = Number(amountPaidInput);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return Math.min(parsed, total);
  }, [amountPaidInput, total]);

  const outstanding = Math.max(0, total - amountPaid);
  const isPaidInFull = outstanding < 0.01;
  const isPartial = amountPaid > 0 && !isPaidInFull;

  const linesReady = linesWithMeta.every((line) => line.description.trim().length > 0 && line.qty > 0);
  const anyOversell = linesWithMeta.some((line) => line.overSelling);

  const customerReady = Boolean(customerId) || customerName.trim().length > 0;
  const canSubmit = customerReady && linesReady && total > 0 && !anyOversell;
  const customerIsNew = !customerId && customerName.trim().length > 0;

  const ctaLabel = isPaidInFull ? "Record sale" : isPartial ? "Record partial sale" : "Issue invoice";

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    try {
      // For a brand-new customer, create the customer record first so the sale
      // is recorded against a real customer id.
      let saleCustomerId = customerId;
      if (!saleCustomerId && customerName.trim()) {
        const created = await api<{ id: string }>("/api/customers", {
          method: "POST",
          body: JSON.stringify({ name: customerName.trim(), notes: "Created from a quick sale" }),
          successMessage: "Customer created",
          successDetail: customerName.trim()
        });
        saleCustomerId = created.id;
      }

      const payloadItems = linesWithMeta.map((line) => ({
        ...(line.inventoryId ? { inventoryId: line.inventoryId } : {}),
        description: line.description.trim(),
        quantity: line.qty,
        unitPrice: line.price,
        taxRate: safeTaxRate,
        discountAmount: 0
      }));
      await api("/api/sales/quick", {
        method: "POST",
        body: JSON.stringify({
          customerId: saleCustomerId,
          items: payloadItems,
          paymentMethod,
          amountPaid
        }),
        successMessage: isPaidInFull
          ? "Sale recorded"
          : isPartial
          ? "Partial sale recorded"
          : "Invoice issued",
        successDetail: customerIsNew
          ? `New customer "${customerName.trim()}" added · ${money(total, currency)}`
          : isPaidInFull
          ? `${linesWithMeta.length} item${linesWithMeta.length === 1 ? "" : "s"} · ${money(total, currency)}`
          : `Outstanding ${money(outstanding, currency)}`,
        errorMessage: "Could not record the sale"
      });
      setLines([newRow()]);
      setAmountPaidInput("");
      reload();
    } catch {
      // toast already shown by api()
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
      {/* Hero strip */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-fuchsia-600 to-rose-500 px-6 py-6 text-white">
        <div className="absolute -right-6 -top-10 h-32 w-32 rounded-full bg-white/15 blur-sm" />
        <div className="absolute -bottom-12 right-20 h-28 w-28 rounded-full bg-white/10" />
        <div className="absolute -left-10 -bottom-8 h-24 w-24 rounded-full bg-cyan-400/15 blur-sm" />
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 shadow-lg shadow-violet-900/30 backdrop-blur">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/80">Quick sale</p>
              <h3 className="text-xl font-extrabold tracking-tight md:text-2xl">Sell anything in one click</h3>
              <p className="mt-0.5 text-xs text-white/70">
                Add line items, set quantity &amp; price — we&rsquo;ll create the invoice, log the payment, and update inventory.
              </p>
            </div>
          </div>

          {/* Live total */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:max-w-lg">
            <div className="rounded-2xl bg-white/15 px-3 py-2.5 backdrop-blur">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Lines</p>
              <p className="mt-0.5 text-base font-extrabold tabular-nums">{linesWithMeta.length}</p>
            </div>
            <div className="rounded-2xl bg-white/15 px-3 py-2.5 backdrop-blur">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Total</p>
              <p className="mt-0.5 text-base font-extrabold tabular-nums">{money(total, currency)}</p>
            </div>
            <div
              className={clsx(
                "rounded-2xl px-3 py-2.5 backdrop-blur",
                isPaidInFull
                  ? "bg-emerald-400/25"
                  : isPartial
                  ? "bg-amber-400/25"
                  : "bg-rose-400/25"
              )}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                {isPaidInFull ? "Paid in full" : "Outstanding"}
              </p>
              <p className="mt-0.5 text-base font-extrabold tabular-nums">
                {isPaidInFull ? money(total, currency) : money(outstanding, currency)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-6">
        {/* Header row */}
        <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
          <div>
            <Combobox
              label="Customer"
              value={customerName}
              onChange={pickCustomer}
              options={customerOptions}
              placeholder="Search a customer or type a new name…"
              required
              emptyHint="No match — a new customer will be created with this name."
            />
            {customerIsNew ? (
              <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-fuchsia-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-fuchsia-700">
                <Sparkles className="h-3 w-3" />
                New customer — will be saved on this sale
              </p>
            ) : null}
          </div>
          <Select
            label="Payment method"
            value={paymentMethod}
            onChange={setPaymentMethod}
            options={PAYMENT_METHODS}
          />
        </div>

        {/* Line items */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Items</p>
              <p className="mt-0.5 text-xs text-slate-400">Add as many lines as you need.</p>
            </div>
            <Button variant="secondary" type="button" onClick={addRow}>
              <Plus className="h-4 w-4" />
              Add item
            </Button>
          </div>

          {/* Desktop header */}
          <div className="hidden grid-cols-[2fr_90px_140px_120px_36px] gap-3 px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 md:grid">
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
                  "grid gap-3 rounded-2xl border bg-slate-50/60 p-3 transition md:grid-cols-[2fr_90px_140px_120px_36px] md:items-center md:gap-3",
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
                        line.overSelling
                          ? "bg-rose-100 text-rose-700"
                          : "bg-emerald-50 text-emerald-700"
                      )}
                    >
                      {line.overSelling ? <AlertCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                      {line.overSelling
                        ? `Only ${line.inventoryItem.quantity} in stock`
                        : `${line.inventoryItem.quantity} → ${Math.max(0, line.inventoryItem.quantity - line.qty)} after sale`}
                    </p>
                  ) : (
                    line.description.trim() ? (
                      <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Custom item
                      </p>
                    ) : null
                  )}
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
        </div>

        {/* Tax + Amount Paid + Summary */}
        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-5 lg:grid-cols-[1.1fr_1fr]">
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Tax rate %"
                type="number"
                value={taxRate}
                onChange={(v) => setTaxRate(Math.max(0, Number(v) || 0))}
              />
              <Input
                label="Amount paid"
                type="number"
                value={amountPaidInput === "" ? amountPaid.toFixed(2) : amountPaidInput}
                onChange={setAmountPaidInput}
              />
            </div>

            <div className="grid gap-1 rounded-2xl bg-slate-100/70 px-4 py-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-500">Subtotal</span>
                <span className="font-semibold text-slate-800 tabular-nums">{money(subtotal, currency)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-500">Tax ({safeTaxRate}%)</span>
                <span className="font-semibold text-slate-800 tabular-nums">{money(taxAmount, currency)}</span>
              </div>
              <div className="my-1 border-t border-dashed border-slate-300/70" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total</span>
                <span className="text-lg font-extrabold tabular-nums text-brand-700">{money(total, currency)}</span>
              </div>
            </div>
          </div>

          {/* Outstanding / paid status card */}
          <div
            className={clsx(
              "relative overflow-hidden rounded-2xl p-5 transition",
              isPaidInFull
                ? "bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white"
                : isPartial
                ? "bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white"
                : "bg-gradient-to-br from-rose-500 via-rose-600 to-fuchsia-600 text-white"
            )}
          >
            <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/15 blur-sm" />
            <div className="relative z-10 flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 self-start rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur">
                {isPaidInFull ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Paid in full
                  </>
                ) : isPartial ? (
                  <>
                    <Receipt className="h-3.5 w-3.5" />
                    Partial payment
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3.5 w-3.5" />
                    Unpaid
                  </>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">Amount paid</p>
                  <p className="mt-1 text-2xl font-extrabold tabular-nums">{money(amountPaid, currency)}</p>
                </div>
                {isPaidInFull ? (
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">Settled</p>
                    <p className="mt-1 text-2xl font-extrabold tabular-nums">{money(total, currency)}</p>
                  </div>
                ) : (
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">Outstanding balance</p>
                    <p className="mt-1 text-2xl font-extrabold tabular-nums">{money(outstanding, currency)}</p>
                  </div>
                )}
              </div>

              {!isPaidInFull ? (
                <p className="text-xs leading-relaxed text-white/85">
                  The invoice will be created with a remaining balance of{" "}
                  <strong>{money(outstanding, currency)}</strong>. You can collect it later from the Payments tab.
                </p>
              ) : (
                <p className="text-xs leading-relaxed text-white/85">
                  Invoice and payment will both be created and the ledger updated automatically.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            <ShoppingCart className="mr-1 inline h-3.5 w-3.5 text-slate-400" />
            {linesWithMeta.length} item{linesWithMeta.length === 1 ? "" : "s"} ·{" "}
            {linesWithMeta.filter((l) => l.inventoryId).length} from inventory
          </p>
          <Button type="button" onClick={submit} disabled={!canSubmit} loading={busy}>
            {busy ? null : <Sparkles className="h-4 w-4" />}
            {ctaLabel}
          </Button>
        </div>
      </div>
    </article>
  );
}
