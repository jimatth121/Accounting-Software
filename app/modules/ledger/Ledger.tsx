"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  BookOpen,
  CalendarRange,
  ListChecks,
  Receipt,
  Scale
} from "lucide-react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { Select } from "@/components/forms/Select";
import { DatePicker } from "@/components/forms/DatePicker";
import { TableToolbar } from "@/components/TableToolbar";
import { api } from "@/lib/api";
import type { Account, AppData, Column, LedgerEntry, LedgerResponse } from "@/lib/types";
import { clsx, formatDate, money } from "@/lib/utils";

interface LedgerProps {
  data: AppData;
  currency: string;
}

const TYPE_COLORS: Record<string, string> = {
  Asset: "from-cyan-500 to-blue-500",
  Liability: "from-rose-500 to-pink-500",
  Equity: "from-amber-500 to-orange-500",
  Income: "from-emerald-500 to-teal-500",
  Expense: "from-violet-500 to-fuchsia-500"
};

function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T {
  let handle: ReturnType<typeof setTimeout> | null = null;
  return ((...args: Parameters<T>) => {
    if (handle) clearTimeout(handle);
    handle = setTimeout(() => fn(...args), ms);
  }) as T;
}

export function Ledger({ data, currency }: LedgerProps) {
  const accounts = data.accounts || [];
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [ledger, setLedger] = useState<LedgerResponse>({
    entries: [],
    summary: { totalDebits: 0, totalCredits: 0, netChange: 0, entryCount: 0 }
  });
  const [loading, setLoading] = useState(true);

  // Debounced fetcher
  const fetchLedger = useMemo(
    () =>
      debounce(async (params: Record<string, string>) => {
        try {
          const query = new URLSearchParams();
          Object.entries(params).forEach(([key, value]) => {
            if (value && value !== "all") query.set(key, value);
          });
          const path = query.toString() ? `/api/ledger?${query}` : "/api/ledger";
          const result = await api<LedgerResponse>(path);
          setLedger(result);
        } catch {
          // silent — toolbar shows zero state
        } finally {
          setLoading(false);
        }
      }, 200),
    []
  );

  useEffect(() => {
    setLoading(true);
    fetchLedger({
      accountId: accountFilter,
      type: typeFilter,
      dateFrom,
      dateTo,
      search
    });
  }, [accountFilter, typeFilter, dateFrom, dateTo, search, fetchLedger]);

  const accountOptions = useMemo(
    () =>
      (accounts as Account[]).map((a) => ({
        label: `${a.code} · ${a.name}`,
        value: a.id || a.code
      })),
    [accounts]
  );

  const typeOptions = [
    { label: "Assets", value: "Asset" },
    { label: "Liabilities", value: "Liability" },
    { label: "Equity", value: "Equity" },
    { label: "Income", value: "Income" },
    { label: "Expenses", value: "Expense" }
  ];

  const activeAccount = accounts.find((a) => (a.id || a.code) === accountFilter);
  const showBalance = !!activeAccount; // running balance only meaningful for single account

  const columns: Column<LedgerEntry>[] = [
    {
      key: "date",
      label: "Date",
      render: (row) => (
        <div>
          <p className="text-sm font-semibold text-slate-900">{formatDate(row.date)}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-400">{row.reference || "—"}</p>
        </div>
      )
    },
    {
      key: "account",
      label: "Account",
      render: (row) => (
        <div className="flex items-start gap-2">
          <div
            className={clsx(
              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow",
              TYPE_COLORS[row.accountType] || "from-slate-500 to-slate-700"
            )}
          >
            <span className="text-[10px] font-extrabold">{row.accountCode.slice(0, 2)}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{row.accountName}</p>
            <p className="text-[11px] text-slate-500">{row.accountCode} · {row.accountType}</p>
          </div>
        </div>
      )
    },
    {
      key: "description",
      label: "Description",
      render: (row) => <p className="max-w-[320px] truncate text-sm text-slate-700">{row.description}</p>
    },
    {
      key: "debit",
      label: "Debit",
      align: "right",
      render: (row) => (row.debit > 0 ? <span className="font-bold text-emerald-700">{money(row.debit, currency)}</span> : <span className="text-slate-300">—</span>)
    },
    {
      key: "credit",
      label: "Credit",
      align: "right",
      render: (row) => (row.credit > 0 ? <span className="font-bold text-rose-700">{money(row.credit, currency)}</span> : <span className="text-slate-300">—</span>)
    },
    ...(showBalance
      ? [
          {
            key: "runningBalance",
            label: "Balance",
            align: "right" as const,
            render: (row: LedgerEntry) => (
              <span
                className={clsx(
                  "font-extrabold tabular-nums",
                  row.runningBalance >= 0 ? "text-slate-900" : "text-rose-700"
                )}
              >
                {money(row.runningBalance, currency)}
              </span>
            )
          }
        ]
      : [])
  ];

  const totalCount = ledger.summary.entryCount;
  const balancedDelta = Math.abs(ledger.summary.totalDebits - ledger.summary.totalCredits);
  const isBalanced = balancedDelta < 0.01;

  return (
    <div className="grid gap-5">
      {/* Hero strip */}
      <Panel className="!p-0 overflow-hidden">
        <div className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-7 text-white md:px-9 md:py-9">
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 right-20 h-44 w-44 rounded-full bg-white/10" />
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur">
                <BookOpen className="h-3.5 w-3.5" />
                General Ledger
              </div>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight md:text-3xl">
                {activeAccount ? `${activeAccount.code} · ${activeAccount.name}` : "All accounts"}
              </h2>
              <p className="mt-1 text-sm text-white/80">
                Every transaction posted against your chart of accounts.
                {dateFrom || dateTo ? ` · ${dateFrom || "earliest"} → ${dateTo || "latest"}` : ""}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:max-w-md">
              <div className="rounded-xl bg-white/15 px-3 py-3 backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Entries</p>
                <p className="mt-1 text-xl font-extrabold tabular-nums">{ledger.summary.entryCount}</p>
              </div>
              <div className="rounded-xl bg-white/15 px-3 py-3 backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Net change</p>
                <p className="mt-1 text-lg font-extrabold tabular-nums">
                  {money(ledger.summary.netChange, currency)}
                </p>
              </div>
              <div className="rounded-xl bg-white/15 px-3 py-3 backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Status</p>
                <p className="mt-1 inline-flex items-center gap-1 text-sm font-bold">
                  <Scale className="h-4 w-4" />
                  {isBalanced ? "Balanced" : `Δ ${money(balancedDelta, currency)}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* Summary metric cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total debits"
          value={money(ledger.summary.totalDebits, currency)}
          icon={<ArrowUpCircle className="h-4 w-4" />}
          accent="emerald"
        />
        <MetricCard
          label="Total credits"
          value={money(ledger.summary.totalCredits, currency)}
          icon={<ArrowDownCircle className="h-4 w-4" />}
          accent="rose"
        />
        <MetricCard
          label="Net change"
          value={money(ledger.summary.netChange, currency)}
          icon={<Banknote className="h-4 w-4" />}
          accent="indigo"
        />
        <MetricCard
          label="Postings"
          value={ledger.summary.entryCount}
          icon={<ListChecks className="h-4 w-4" />}
          accent="cyan"
        />
      </section>

      {/* Filters + table */}
      <Panel>
        <PageHeader
          title="Journal entries"
          subtitle="Filter by account, date range or search the description"
          count={totalCount}
        />

        {/* Date pickers + chips */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
          <div className="flex-1">
            <DatePicker label="From" value={dateFrom} onChange={setDateFrom} placeholder="Any start date" />
          </div>
          <div className="flex-1">
            <DatePicker label="To" value={dateTo} onChange={setDateTo} placeholder="Any end date" />
          </div>
          {dateFrom || dateTo ? (
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
            >
              <CalendarRange className="h-4 w-4" />
              Clear range
            </Button>
          ) : null}
        </div>

        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search description, account or reference…"
          filters={[
            {
              key: "account",
              label: "Account",
              value: accountFilter,
              onChange: setAccountFilter,
              options: accountOptions
            },
            {
              key: "type",
              label: "Type",
              value: typeFilter,
              onChange: setTypeFilter,
              options: typeOptions
            }
          ]}
        />

        {/* Active filter chips */}
        {(activeAccount || typeFilter !== "all" || dateFrom || dateTo) ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {activeAccount ? (
              <Badge tone="low">
                {activeAccount.code} · {activeAccount.name}
              </Badge>
            ) : null}
            {typeFilter !== "all" ? <Badge tone="medium">{typeFilter}</Badge> : null}
            {dateFrom ? <Badge>From {dateFrom}</Badge> : null}
            {dateTo ? <Badge>To {dateTo}</Badge> : null}
          </div>
        ) : null}

        {loading ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-14 text-sm text-slate-500">
            <Receipt className="mb-2 h-6 w-6 animate-pulse" />
            Loading journal entries…
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={ledger.entries.map((row) => ({ ...row, _key: row.id }))}
            empty="No entries match the current filters."
            density="compact"
          />
        )}

        {/* Totals footer */}
        {ledger.entries.length ? (
          <div className="mt-4 grid gap-2 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 sm:grid-cols-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total debits</p>
              <p className="mt-1 text-lg font-extrabold text-emerald-700 tabular-nums">
                {money(ledger.summary.totalDebits, currency)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total credits</p>
              <p className="mt-1 text-lg font-extrabold text-rose-700 tabular-nums">
                {money(ledger.summary.totalCredits, currency)}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Net change</p>
              <p
                className={clsx(
                  "mt-1 text-lg font-extrabold tabular-nums",
                  ledger.summary.netChange >= 0 ? "text-slate-900" : "text-rose-700"
                )}
              >
                {money(ledger.summary.netChange, currency)}
              </p>
            </div>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
