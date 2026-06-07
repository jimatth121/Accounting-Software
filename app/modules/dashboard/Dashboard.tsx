"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { Panel } from "@/components/Panel";
import { CHART_COLORS } from "@/lib/constants";
import type { AppData } from "@/lib/types";
import { formatDate, money } from "@/lib/utils";
import { QuickSale } from "./QuickSale";

interface DashboardProps {
  data: AppData;
  currency: string;
  reload: () => void;
}

export function Dashboard({ data, currency, reload }: DashboardProps) {
  const totalRevenue = data.dashboard?.totalRevenue || 0;
  const totalExpenses = data.dashboard?.totalExpenses || 0;
  const netProfit = data.dashboard?.netProfit || 0;
  const outstanding = data.dashboard?.outstandingInvoices || 0;
  const overdue = data.dashboard?.overdueInvoices || 0;
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  const monthlyTrend = useMemo(() => {
    const buckets: Record<string, { name: string; revenue: number; expenses: number }> = {};
    (data.invoices || []).forEach((invoice) => {
      const date = new Date(invoice.issueDate || invoice.dueDate || Date.now());
      const key = date.toLocaleDateString("en-US", { month: "short" });
      if (!buckets[key]) buckets[key] = { name: key, revenue: 0, expenses: 0 };
      buckets[key].revenue += invoice.totalAmount || 0;
    });
    (data.expenses || []).forEach((expense) => {
      const date = new Date(expense.expenseDate || Date.now());
      const key = date.toLocaleDateString("en-US", { month: "short" });
      if (!buckets[key]) buckets[key] = { name: key, revenue: 0, expenses: 0 };
      buckets[key].expenses += expense.amount || 0;
    });
    const series = Object.values(buckets);
    if (series.length === 0) {
      return ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((name) => ({ name, revenue: 0, expenses: 0 }));
    }
    return series;
  }, [data.invoices, data.expenses]);

  const expenseBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    (data.dashboard?.topExpenseCategories || []).forEach((item) => {
      map[item.name] = item.amount;
    });
    if (Object.keys(map).length === 0) {
      (data.expenses || []).forEach((expense) => {
        const key = expense.category || "Other";
        map[key] = (map[key] || 0) + (expense.amount || 0);
      });
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [data.dashboard?.topExpenseCategories, data.expenses]);

  return (
    <div className="grid gap-5">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-500 to-fuchsia-500 px-7 py-8 text-white shadow-hero md:px-9 md:py-10">
        <div className="relative z-10 max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/85">Welcome back</p>
          <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight md:text-3xl">Your finances at a glance</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/90 md:text-[15px]">
            Track revenue, monitor expenses, and grow with AI-powered insights. You earned{" "}
            <strong className="font-bold text-white">{money(totalRevenue, currency)}</strong> and have{" "}
            <strong className="font-bold text-white">{money(outstanding, currency)}</strong> outstanding.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Button variant="secondary" className="!bg-white !text-brand-700 !border-transparent shadow-lg">
              View reports
            </Button>
            <Button variant="ghost">Ask AI ✦</Button>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-10 -top-20 h-72 w-72 rounded-full bg-white/15 blur-sm" />
          <div className="absolute right-52 top-20 h-44 w-44 rounded-full bg-cyan-400/30 blur-sm" />
          <div className="absolute -bottom-14 right-24 h-56 w-56 rounded-full bg-pink-400/30 blur-sm" />
        </div>
      </section>

      {/* Hero metrics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total revenue" value={money(totalRevenue, currency)} delta="+12.4%" trend="up" icon="↗" accent="indigo" />
        <MetricCard label="Total expenses" value={money(totalExpenses, currency)} delta="+3.1%" trend="down" icon="↘" accent="rose" />
        <MetricCard label="Net profit" value={money(netProfit, currency)} delta={`${profitMargin}% margin`} trend="up" icon="✓" accent="emerald" />
        <MetricCard label="Outstanding" value={money(outstanding, currency)} delta={`${overdue} overdue`} trend="neutral" icon="⏱" accent="amber" />
      </section>

      {/* Quick sale */}
      <QuickSale data={data} reload={reload} currency={currency} />

      {/* Charts */}
      <section className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Panel>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-bold tracking-tight text-slate-900">Revenue overview</h3>
              <p className="mt-0.5 text-sm text-slate-500">Performance over time</p>
            </div>
            <div className="flex gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                <span className="h-2 w-2 rounded-full bg-brand-500" />
                Revenue
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                Expenses
              </span>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => money(Number(value), currency)} contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 10px 30px rgba(15,23,42,0.08)" }} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revGrad)" />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2.5} fill="url(#expGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <div className="mb-5">
            <h3 className="text-base font-bold tracking-tight text-slate-900">Expense breakdown</h3>
            <p className="mt-0.5 text-sm text-slate-500">Where your money goes</p>
          </div>
          <div className="h-72 w-full">
            {expenseBreakdown.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="85%" innerRadius="55%" paddingAngle={3}>
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => money(Number(value), currency)} contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12 }} />
                  <Legend verticalAlign="bottom" height={32} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState text="No expense data yet" />
            )}
          </div>
        </Panel>
      </section>

      {/* Lists */}
      <section className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-bold tracking-tight text-slate-900">Recent invoices</h3>
              <p className="mt-0.5 text-sm text-slate-500">Latest billing activity</p>
            </div>
            <Badge>{(data.dashboard?.recentInvoices || []).length} items</Badge>
          </div>
          {(data.dashboard?.recentInvoices || []).length ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3 text-left">Invoice</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left">Customer</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left">Due</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.dashboard!.recentInvoices!.map((invoice) => (
                    <tr key={invoice.id || invoice.invoiceNumber} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                      <td className="px-4 py-3"><strong>{invoice.invoiceNumber}</strong></td>
                      <td className="px-4 py-3">{invoice.customerName}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(invoice.dueDate)}</td>
                      <td className="px-4 py-3 text-right">{money(invoice.balanceDue, invoice.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState text="No recent invoices" />
          )}
        </Panel>

        <Panel>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-bold tracking-tight text-slate-900">Anomaly alerts</h3>
              <p className="mt-0.5 text-sm text-slate-500">Issues that need attention</p>
            </div>
            <Badge tone={data.anomalies.length ? "high" : "low"}>{data.anomalies.length} alerts</Badge>
          </div>
          <div className="grid gap-2.5">
            {data.anomalies.length ? (
              data.anomalies.map((item) => {
                const dot = {
                  high: "bg-rose-500 shadow-[0_0_0_4px_rgba(239,68,68,0.18)]",
                  medium: "bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.18)]",
                  low: "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.18)]"
                }[item.severity];
                return (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3.5">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
                    <div className="min-w-0 flex-1">
                      <strong className="block text-sm text-slate-900">{item.title}</strong>
                      <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
                    </div>
                    <Badge tone={item.severity}>{item.severity}</Badge>
                  </div>
                );
              })
            ) : (
              <EmptyState text="All clear — no anomalies detected." />
            )}
          </div>
        </Panel>
      </section>
    </div>
  );
}
