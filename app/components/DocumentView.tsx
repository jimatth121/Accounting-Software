"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Loader2, X } from "lucide-react";
import type { Company, Expense, Invoice, Payment } from "@/lib/types";
import { formatDate, money, numberToWords } from "@/lib/utils";

export type DocPayload =
  | { kind: "invoice"; record: Invoice }
  | { kind: "payment"; record: Payment; invoice?: Invoice | null }
  | { kind: "expense"; record: Expense };

interface DocumentViewProps {
  doc: DocPayload | null;
  onClose: () => void;
  company: Company | null;
  currency: string;
}

const BRAND_GRADIENT = "linear-gradient(135deg, #4338ca 0%, #6366f1 52%, #d946ef 100%)";

const META: Record<DocPayload["kind"], { label: string; tone: string }> = {
  invoice: { label: "Invoice", tone: "#6366f1" },
  payment: { label: "Payment Receipt", tone: "#10b981" },
  expense: { label: "Expense Voucher", tone: "#f59e0b" }
};

function statusStyle(status?: string): { bg: string; color: string } {
  const value = (status || "").toLowerCase();
  if (/(paid|received|complete|recorded)/.test(value)) return { bg: "#dcfce7", color: "#15803d" };
  if (/(overdue|cancel|fail|reject)/.test(value)) return { bg: "#fee2e2", color: "#b91c1c" };
  if (/(pending|sent|draft|view)/.test(value)) return { bg: "#fef3c7", color: "#b45309" };
  return { bg: "#e0e7ff", color: "#4338ca" };
}

function docNumber(doc: DocPayload): string {
  if (doc.kind === "invoice") return doc.record.invoiceNumber;
  const prefix = doc.kind === "payment" ? "PAY" : "EXP";
  const ref = doc.kind === "payment" ? doc.record.reference : undefined;
  return ref || `${prefix}-${(doc.record.id || "").slice(0, 8).toUpperCase()}`;
}

export function DocumentView({ doc, onClose, company, currency }: DocumentViewProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!doc) return undefined;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [doc, onClose]);

  if (!doc) return null;

  const meta = META[doc.kind];
  const number = docNumber(doc);

  async function downloadPdf() {
    if (!sheetRef.current) return;
    setBusy(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf")
      ]);
      const canvas = await html2canvas(sheetRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`${meta.label.replace(/\s+/g, "-").toLowerCase()}-${number}.pdf`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-slate-900/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      {/* Toolbar (excluded from the PDF capture) */}
      <div
        className="flex items-center justify-between gap-3 border-b border-white/10 bg-slate-900/80 px-4 py-3 md:px-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-300">{meta.label}</p>
          <p className="truncate text-sm font-semibold text-white">{number}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={downloadPdf}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {busy ? "Preparing…" : "Download PDF"}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition hover:bg-white/15"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Scrollable document area */}
      <div className="flex-1 overflow-y-auto px-3 py-6 md:px-6 md:py-10" onClick={onClose}>
        <div
          ref={sheetRef}
          onClick={(event) => event.stopPropagation()}
          className="mx-auto w-full max-w-[820px] animate-slideUp overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl"
        >
          <DocHeader company={company} label={meta.label} number={number} />
          <div className="px-8 py-7 md:px-12 md:py-9">
            {doc.kind === "invoice" ? <InvoiceBody invoice={doc.record} currency={currency} /> : null}
            {doc.kind === "payment" ? <PaymentBody payment={doc.record} invoice={doc.invoice} currency={currency} /> : null}
            {doc.kind === "expense" ? <ExpenseBody expense={doc.record} currency={currency} /> : null}
          </div>
          <DocFooter company={company} tone={meta.tone} />
        </div>
      </div>
    </div>
  );
}

/* ---------- Shared chrome ---------- */

function DocHeader({ company, label, number }: { company: Company | null; label: string; number: string }) {
  const name = company?.name || "SmartBooks AI";
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SB";
  return (
    <div className="relative overflow-hidden px-8 py-8 text-white md:px-12 md:py-10" style={{ background: BRAND_GRADIENT }}>
      <div className="relative z-10 flex items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-xl font-extrabold backdrop-blur">
            {initials}
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-tight">{name}</p>
            <p className="mt-0.5 max-w-[260px] text-xs leading-relaxed text-white/80">
              {company?.address || "Lagos, Nigeria"}
              {company?.email ? ` · ${company.email}` : ""}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/80">{label}</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight">{number}</p>
        </div>
      </div>
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-white/10" />
    </div>
  );
}

function DocFooter({ company, tone }: { company: Company | null; tone: string }) {
  return (
    <div className="border-t border-slate-200 px-8 py-6 md:px-12">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-xs text-slate-500">
          Thank you for your business. Generated by{" "}
          <span className="font-semibold" style={{ color: tone }}>{company?.name || "SmartBooks AI"}</span>.
        </p>
        {company?.taxId ? <p className="text-xs text-slate-400">Tax ID: {company.taxId}</p> : null}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value || "—"}</p>
    </div>
  );
}

function StatusPill({ status }: { status?: string }) {
  if (!status) return null;
  const s = statusStyle(status);
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide"
      style={{ background: s.bg, color: s.color }}
    >
      {status}
    </span>
  );
}

function AmountRow({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: string }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${strong ? "" : "text-sm"}`}>
      <span className={strong ? "text-sm font-bold text-slate-900" : "text-slate-500"}>{label}</span>
      <span
        className={strong ? "text-lg font-extrabold" : "font-semibold text-slate-800"}
        style={strong && tone ? { color: tone } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

/* ---------- Invoice ---------- */

function lineSubtotal(item: { quantity?: number; unitPrice?: number }): number {
  return (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
}

function lineTax(item: { quantity?: number; unitPrice?: number; taxRate?: number }): number {
  return lineSubtotal(item) * ((Number(item.taxRate) || 0) / 100);
}

function lineTotal(item: { quantity?: number; unitPrice?: number; taxRate?: number; discountAmount?: number }): number {
  return lineSubtotal(item) + lineTax(item) - (Number(item.discountAmount) || 0);
}

function ItemsTable({
  items,
  currency,
  variant = "full"
}: {
  items: NonNullable<Invoice["items"]>;
  currency: string;
  variant?: "full" | "compact";
}) {
  const showTax = items.some((item) => (Number(item.taxRate) || 0) > 0);
  const showDiscount = items.some((item) => (Number(item.discountAmount) || 0) > 0);
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <th className="px-5 py-3 text-left">Item</th>
            <th className="px-3 py-3 text-right">Qty</th>
            <th className="px-3 py-3 text-right">Unit price</th>
            {showTax && variant === "full" ? <th className="px-3 py-3 text-right">Tax %</th> : null}
            {showDiscount && variant === "full" ? <th className="px-3 py-3 text-right">Discount</th> : null}
            <th className="px-5 py-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const qty = Number(item.quantity) || 0;
            const unit = Number(item.unitPrice) || 0;
            return (
              <tr key={`${item.description}-${index}`} className="border-t border-slate-200">
                <td className="px-5 py-4 text-slate-800">
                  <p className="font-semibold text-slate-900">{item.description || "Item"}</p>
                </td>
                <td className="px-3 py-4 text-right text-slate-700 tabular-nums">{qty}</td>
                <td className="px-3 py-4 text-right text-slate-700 tabular-nums">{money(unit, currency)}</td>
                {showTax && variant === "full" ? (
                  <td className="px-3 py-4 text-right text-slate-500 tabular-nums">{(Number(item.taxRate) || 0).toFixed(2)}%</td>
                ) : null}
                {showDiscount && variant === "full" ? (
                  <td className="px-3 py-4 text-right text-slate-500 tabular-nums">
                    {money(Number(item.discountAmount) || 0, currency)}
                  </td>
                ) : null}
                <td className="px-5 py-4 text-right font-semibold text-slate-900 tabular-nums">
                  {money(lineTotal(item), currency)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function InvoiceBody({ invoice, currency }: { invoice: Invoice; currency: string }) {
  const cur = invoice.currency || currency;
  const items: Invoice["items"] = invoice.items && invoice.items.length
    ? invoice.items
    : [{ description: `Invoice ${invoice.invoiceNumber} — goods & services rendered`, quantity: 1, unitPrice: invoice.totalAmount || 0 }];
  const computedSubtotal = items.reduce((sum, item) => sum + lineSubtotal(item), 0);
  const computedTax = items.reduce((sum, item) => sum + lineTax(item), 0);
  const computedDiscount = items.reduce((sum, item) => sum + (Number(item.discountAmount) || 0), 0);
  const subtotal = invoice.subtotal ?? computedSubtotal;
  const tax = invoice.taxAmount ?? computedTax;
  const discount = invoice.discountAmount ?? computedDiscount;
  const total = invoice.totalAmount || subtotal + tax - discount;
  const paid = invoice.amountPaid ?? Math.max(0, total - (invoice.balanceDue || 0));
  const balance = invoice.balanceDue ?? Math.max(0, total - paid);

  return (
    <div className="grid gap-7">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Billed to</p>
          <p className="mt-1.5 text-base font-bold text-slate-900">{invoice.customerName || "—"}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:justify-items-end">
          <Field label="Issue date" value={formatDate(invoice.issueDate)} />
          <Field label="Due date" value={formatDate(invoice.dueDate)} />
          <Field label="Status" value={<StatusPill status={invoice.status} />} />
          <Field label="Currency" value={cur} />
        </div>
      </div>

      <ItemsTable items={items} currency={cur} variant="full" />

      {invoice.notes ? (
        <div className="rounded-xl border border-slate-200 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Notes</p>
          <p className="mt-1 text-sm text-slate-700">{invoice.notes}</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-[320px] rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Amount in words</p>
          <p className="mt-1 text-sm font-medium capitalize text-slate-700">{numberToWords(total)} {cur} only</p>
        </div>
        <div className="w-full max-w-[280px] space-y-2.5 sm:ml-auto">
          <AmountRow label="Subtotal" value={money(subtotal, cur)} />
          {tax > 0 ? <AmountRow label="Tax" value={money(tax, cur)} /> : null}
          {discount > 0 ? <AmountRow label="Discount" value={`− ${money(discount, cur)}`} /> : null}
          <AmountRow label="Amount paid" value={money(paid, cur)} />
          <div className="my-1 border-t border-dashed border-slate-200" />
          <AmountRow label="Balance due" value={money(balance, cur)} strong tone="#6366f1" />
        </div>
      </div>

      {invoice.terms ? (
        <p className="text-xs italic text-slate-500">{invoice.terms}</p>
      ) : null}
    </div>
  );
}

/* ---------- Payment ---------- */

function PaymentBody({ payment, invoice, currency }: { payment: Payment; invoice?: Invoice | null; currency: string }) {
  const cur = payment.currency || currency;
  const incoming = payment.paymentType === "incoming";
  const items = invoice?.items?.length ? invoice.items : null;
  return (
    <div className="grid gap-7">
      <div className="flex flex-col items-center rounded-2xl bg-slate-50 px-6 py-8 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
          {incoming ? "Amount received" : "Amount paid"}
        </p>
        <p className="mt-2 text-4xl font-extrabold tracking-tight" style={{ color: incoming ? "#10b981" : "#ef4444" }}>
          {money(payment.amount, cur)}
        </p>
        <p className="mt-2 max-w-md text-xs font-medium capitalize text-slate-500">
          {numberToWords(payment.amount)} {cur} only
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
        <Field label="Date" value={formatDate(payment.paymentDate || payment.createdAt)} />
        <Field label="Method" value={payment.paymentMethod} />
        <Field label="Type" value={<span className="capitalize">{payment.paymentType}</span>} />
        <Field label="Reference" value={payment.reference} />
        <Field label="Linked invoice" value={invoice?.invoiceNumber} />
        <Field label="Currency" value={cur} />
      </div>

      {items ? (
        <div>
          <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Items paid for
          </p>
          <ItemsTable items={items} currency={cur} variant="compact" />
          {invoice ? (
            <div className="mt-3 flex flex-wrap items-center justify-end gap-x-6 gap-y-1 text-xs text-slate-500">
              <span>
                Invoice total: <strong className="text-slate-800 tabular-nums">{money(invoice.totalAmount || 0, cur)}</strong>
              </span>
              {typeof invoice.balanceDue === "number" ? (
                <span>
                  Balance after payment: <strong className={invoice.balanceDue > 0 ? "text-rose-700 tabular-nums" : "text-emerald-700 tabular-nums"}>{money(invoice.balanceDue, cur)}</strong>
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {payment.notes ? (
        <div className="rounded-xl border border-slate-200 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Notes</p>
          <p className="mt-1 text-sm text-slate-700">{payment.notes}</p>
        </div>
      ) : null}
    </div>
  );
}

/* ---------- Expense ---------- */

function ExpenseBody({ expense, currency }: { expense: Expense; currency: string }) {
  const cur = expense.currency || currency;
  const tax = expense.taxAmount || 0;
  const subtotal = Math.max(0, (expense.amount || 0) - tax);
  return (
    <div className="grid gap-7">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Paid to</p>
          <p className="mt-1.5 text-base font-bold text-slate-900">{expense.vendorName || "—"}</p>
          {expense.category ? (
            <span className="mt-2 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-700">
              {expense.category}
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:justify-items-end">
          <Field label="Expense date" value={formatDate(expense.expenseDate)} />
          <Field label="Method" value={expense.paymentMethod} />
          <Field label="Status" value={<StatusPill status={expense.status} />} />
          <Field label="Currency" value={cur} />
        </div>
      </div>

      {expense.description ? (
        <div className="rounded-xl border border-slate-200 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Description</p>
          <p className="mt-1 text-sm text-slate-700">{expense.description}</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-[320px] rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Amount in words</p>
          <p className="mt-1 text-sm font-medium capitalize text-slate-700">{numberToWords(expense.amount)} {cur} only</p>
        </div>
        <div className="w-full max-w-[280px] space-y-2.5 sm:ml-auto">
          <AmountRow label="Subtotal" value={money(subtotal, cur)} />
          <AmountRow label="Tax" value={money(tax, cur)} />
          <div className="my-1 border-t border-dashed border-slate-200" />
          <AmountRow label="Total" value={money(expense.amount, cur)} strong tone="#f59e0b" />
        </div>
      </div>
    </div>
  );
}
