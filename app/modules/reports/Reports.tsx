"use client";

import { useMemo } from "react";
import { BarChart, Bar, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/Badge";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { Panel } from "@/components/Panel";
import { CHART_COLORS } from "@/lib/constants";
import type { Account, AppData, Column } from "@/lib/types";
import { money } from "@/lib/utils";

interface ReportsProps {
  data: AppData;
  currency: string;
}

interface BalanceRow {
  _key: string;
  name: string;
  outstanding: number;
}

export function Reports({ data, currency }: ReportsProps) {
  const report = data.reports?.profitAndLoss;

  const customerBalances = useMemo(() => {
    return (data.customers || [])
      .map((customer) => {
        const balance = (data.invoices || [])
          .filter((invoice) => invoice.customerId === customer.id)
          .reduce((sum, invoice) => sum + (invoice.balanceDue || 0), 0);
        return { name: customer.name, balance };
      })
      .filter((item) => item.balance > 0)
      .slice(0, 8);
  }, [data.customers, data.invoices]);

  const balanceColumns: Column<BalanceRow>[] = [
    { key: "name", label: "Customer", render: (row) => <strong>{row.name}</strong> },
    {
      key: "outstanding",
      label: "Outstanding",
      align: "right",
      render: (row) => money(row.outstanding, currency)
    }
  ];

  const accountsColumns: Column<Account>[] = [
    { key: "code", label: "Code" },
    { key: "name", label: "Account", render: (row) => <strong>{row.name}</strong> },
    { key: "type", label: "Type", render: (row) => <Badge>{row.type}</Badge> }
  ];

  const balanceRows: BalanceRow[] = (data.customers || []).map((customer) => {
    const outstanding = (data.invoices || [])
      .filter((invoice) => invoice.customerId === customer.id)
      .reduce((sum, invoice) => sum + (invoice.balanceDue || 0), 0);
    return { _key: customer.id, name: customer.name, outstanding };
  });

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Income summary" value={money(report?.income, currency)} icon="↗" accent="indigo" />
        <MetricCard label="Expense summary" value={money(report?.expenses, currency)} icon="↘" accent="rose" />
        <MetricCard label="Profit and loss" value={money(report?.netProfit, currency)} icon="✓" accent="emerald" />
      </section>

      {customerBalances.length ? (
        <Panel>
          <div className="mb-5">
            <h3 className="text-base font-bold tracking-tight text-slate-900">Top customer balances</h3>
            <p className="mt-0.5 text-sm text-slate-500">Customers with outstanding invoices</p>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={customerBalances} layout="vertical" margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={120} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => money(Number(value), currency)} contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12 }} />
                <Bar dataKey="balance" radius={[0, 8, 8, 0]}>
                  {customerBalances.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-base font-bold tracking-tight text-slate-900">Customer balances</h3>
            <Badge>{balanceRows.length}</Badge>
          </div>
          <DataTable columns={balanceColumns} rows={balanceRows} empty="No customers with outstanding balances" />
        </Panel>
        <Panel>
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-base font-bold tracking-tight text-slate-900">Chart of accounts</h3>
            <Badge>{data.accounts.length}</Badge>
          </div>
          <DataTable
            columns={accountsColumns}
            rows={(data.accounts || []).map((row) => ({ ...row, _key: row.id || row.code }))}
            empty="No accounts yet"
          />
        </Panel>
      </section>
    </div>
  );
}
