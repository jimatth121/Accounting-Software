"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Combobox, type ComboboxOption } from "@/components/forms/Combobox";
import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";
import { api } from "@/lib/api";
import { PAYMENT_METHODS } from "@/lib/constants";
import type { AppData } from "@/lib/types";
import { clsx, money } from "@/lib/utils";

interface QuickSaleProps {
  data: AppData;
  reload: () => void;
  currency: string;
}

const TAX_RATE = 7.5;

export function QuickSale({ data, reload, currency }: QuickSaleProps) {
  const customers = data.customers || [];
  const inventory = data.inventory || [];

  const [customerId, setCustomerId] = useState<string>(customers[0]?.id || "");
  const [itemSearch, setItemSearch] = useState<string>("");
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(TAX_RATE);
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [markPaid, setMarkPaid] = useState(true);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<string>("");

  const selectedItem = inventory.find((item) => item.id === selectedInventoryId) || null;

  const itemOptions: ComboboxOption[] = inventory.map((item) => ({
    label: item.name,
    value: item.id,
    hint: `${item.sku} · ${item.quantity} in stock · ${money(item.unitPrice, currency)}`,
    badge: item.quantity <= item.reorderLevel ? "Low" : undefined
  }));

  function pickItem(label: string, option: ComboboxOption | null) {
    setItemSearch(label);
    if (option) {
      const item = inventory.find((entry) => entry.id === option.value);
      if (item) {
        setSelectedInventoryId(item.id);
        setUnitPrice(item.unitPrice);
        return;
      }
    }
    // Free-typed entry — clear the inventory link
    setSelectedInventoryId("");
  }

  const safeQty = Math.max(1, Number(quantity) || 1);
  const safePrice = Math.max(0, Number(unitPrice) || 0);
  const safeTaxRate = Math.max(0, Number(taxRate) || 0);
  const subtotal = safeQty * safePrice;
  const taxAmount = subtotal * (safeTaxRate / 100);
  const total = subtotal + taxAmount;

  const stockAfter = selectedItem ? Math.max(0, selectedItem.quantity - safeQty) : null;
  const overSelling = selectedItem ? safeQty > selectedItem.quantity : false;
  const itemReady = itemSearch.trim().length > 0;

  const canSubmit = !!customerId && itemReady && total > 0 && !overSelling;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setSuccess("");
    try {
      const item = {
        ...(selectedInventoryId ? { inventoryId: selectedInventoryId } : {}),
        description: itemSearch.trim(),
        quantity: safeQty,
        unitPrice: safePrice,
        taxRate: safeTaxRate,
        discountAmount: 0
      };
      const result = await api<{ invoice: { invoiceNumber: string } }>("/api/sales/quick", {
        method: "POST",
        body: JSON.stringify({
          customerId,
          items: [item],
          paymentMethod,
          markPaid
        }),
        successMessage: markPaid ? "Sale recorded" : "Invoice issued",
        errorMessage: "Could not record the sale"
      });
      setSuccess(`${markPaid ? "Sale recorded" : "Invoice issued"} — ${result.invoice.invoiceNumber}`);
      setQuantity(1);
      setItemSearch("");
      setSelectedInventoryId("");
      setUnitPrice(0);
      reload();
    } catch {
      // toast already shown by api()
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
      {/* Header strip */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-fuchsia-600 to-rose-500 px-6 py-5 text-white">
        <div className="absolute -right-6 -top-10 h-32 w-32 rounded-full bg-white/15 blur-sm" />
        <div className="absolute -bottom-12 right-24 h-28 w-28 rounded-full bg-white/10" />
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">Quick sale</p>
              <h3 className="text-lg font-extrabold tracking-tight">Sell in one click</h3>
            </div>
          </div>
          <div className="hidden text-right md:block">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Total due</p>
            <p className="mt-0.5 text-xl font-extrabold tabular-nums">{money(total, currency)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Customer"
            value={customerId}
            onChange={setCustomerId}
            options={customers.map((c) => ({ label: c.name, value: c.id }))}
          />

          <Combobox
            label="Item"
            value={itemSearch}
            onChange={pickItem}
            options={itemOptions}
            placeholder="Search inventory or type a custom item…"
            required
            emptyHint="No matches — this will be saved as a custom one-off item."
          />

          <Input
            label="Quantity"
            type="number"
            value={quantity}
            onChange={(v) => setQuantity(Math.max(1, Number(v) || 1))}
          />
          <Input
            label="Unit price"
            type="number"
            value={unitPrice}
            onChange={(v) => setUnitPrice(Number(v))}
          />
          <Input
            label="Tax rate %"
            type="number"
            value={taxRate}
            onChange={(v) => setTaxRate(Number(v))}
          />
          <Select
            label="Payment method"
            value={paymentMethod}
            onChange={setPaymentMethod}
            options={PAYMENT_METHODS}
          />
        </div>

        {/* Stock + warnings (only when an inventory item is selected) */}
        {selectedItem ? (
          <div
            className={clsx(
              "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm",
              overSelling ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-slate-50"
            )}
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Stock</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                {selectedItem.quantity} in stock → {stockAfter} after sale
              </p>
            </div>
            {overSelling ? (
              <Badge tone="high">Not enough stock</Badge>
            ) : (
              <Badge tone="low">Available</Badge>
            )}
          </div>
        ) : null}

        {/* Totals + paid toggle */}
        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 sm:grid-cols-[1fr_auto]">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subtotal</p>
              <p className="mt-0.5 text-sm font-bold text-slate-900 tabular-nums">{money(subtotal, currency)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tax</p>
              <p className="mt-0.5 text-sm font-bold text-slate-900 tabular-nums">{money(taxAmount, currency)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</p>
              <p className="mt-0.5 text-base font-extrabold text-brand-700 tabular-nums">{money(total, currency)}</p>
            </div>
          </div>

          <label className="flex items-center gap-2 self-end text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={markPaid}
              onChange={(event) => setMarkPaid(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Mark as paid now
          </label>
        </div>

        {success ? (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <Check className="h-4 w-4" />
            {success}
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            {selectedItem
              ? markPaid
                ? "Decrements inventory, creates the invoice and payment, updates the ledger."
                : "Decrements inventory and issues an invoice (record the payment later)."
              : markPaid
              ? "Creates the invoice and payment for this custom item."
              : "Creates an invoice for this custom item (record the payment later)."}
          </p>
          <Button type="button" onClick={submit} disabled={!canSubmit} loading={busy}>
            {busy ? null : <Sparkles className="h-4 w-4" />}
            {markPaid ? "Record sale" : "Issue invoice"}
          </Button>
        </div>
      </div>
    </article>
  );
}
