"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowUpRight, Banknote, Package } from "lucide-react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { Input } from "@/components/forms/Input";
import { MetricCard } from "@/components/MetricCard";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { Select } from "@/components/forms/Select";
import { TableToolbar } from "@/components/TableToolbar";
import { api } from "@/lib/api";
import { INVENTORY_CATEGORIES } from "@/lib/constants";
import type { Column, InventoryItem } from "@/lib/types";
import { money } from "@/lib/utils";

interface InventoryProps {
  data: { inventory: InventoryItem[] };
  reload: () => void;
  currency: string;
}

const blank = {
  sku: "",
  name: "",
  category: "General",
  quantity: 0,
  reorderLevel: 5,
  unitCost: 0,
  unitPrice: 0
};

export function Inventory({ data, reload, currency }: InventoryProps) {
  const inventory = data.inventory || [];
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState(blank);
  const [createBusy, setCreateBusy] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [busyRow, setBusyRow] = useState<string>("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  async function addItem(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name) return;
    setCreateBusy(true);
    try {
      await api("/api/inventory", {
        method: "POST",
        body: JSON.stringify(form),
        successMessage: "Item added to inventory",
        successDetail: form.name
      });
      setForm(blank);
      setCreateOpen(false);
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
      await api(`/api/inventory/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          sku: editing.sku,
          name: editing.name,
          category: editing.category,
          quantity: editing.quantity,
          reorderLevel: editing.reorderLevel,
          unitCost: editing.unitCost,
          unitPrice: editing.unitPrice
        }),
        successMessage: "Item updated",
        successDetail: editing.name
      });
      setEditing(null);
      reload();
    } finally {
      setEditBusy(false);
    }
  }

  async function adjustQty(id: string, delta: number) {
    setBusyRow(`${id}:adjust:${delta}`);
    try {
      await api(`/api/inventory/${id}/adjust`, {
        method: "POST",
        body: JSON.stringify({ delta }),
        silent: true
      });
      reload();
    } finally {
      setBusyRow("");
    }
  }

  async function removeItem(id: string, name: string) {
    if (!confirm("Remove this inventory item?")) return;
    setBusyRow(`${id}:delete`);
    try {
      await api(`/api/inventory/${id}`, {
        method: "DELETE",
        successMessage: "Item removed",
        successDetail: name
      });
      reload();
    } finally {
      setBusyRow("");
    }
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return inventory.filter((item) => {
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (stockFilter === "low" && item.quantity > item.reorderLevel) return false;
      if (stockFilter === "out" && item.quantity > 0) return false;
      if (stockFilter === "ok" && item.quantity <= item.reorderLevel) return false;
      if (term) {
        const blob = `${item.sku} ${item.name} ${item.category}`.toLowerCase();
        if (!blob.includes(term)) return false;
      }
      return true;
    });
  }, [inventory, search, categoryFilter, stockFilter]);

  const totalValue = inventory.reduce((sum, item) => sum + item.unitCost * item.quantity, 0);
  const totalRetail = inventory.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const lowStock = inventory.filter((item) => item.quantity <= item.reorderLevel).length;
  const totalUnits = inventory.reduce((sum, item) => sum + item.quantity, 0);

  const columns: Column<InventoryItem>[] = [
    { key: "sku", label: "SKU", render: (row) => <strong className="font-mono text-slate-700">{row.sku}</strong> },
    { key: "name", label: "Name", render: (row) => <strong className="text-slate-900">{row.name}</strong> },
    { key: "category", label: "Category", render: (row) => <Badge tone="neutral">{row.category}</Badge> },
    {
      key: "quantity",
      label: "Stock",
      render: (row) => {
        const isLow = row.quantity <= row.reorderLevel;
        return (
          <div className="inline-flex items-center gap-2">
            <Button
              variant="small"
              type="button"
              onClick={() => adjustQty(row.id, -1)}
              loading={busyRow === `${row.id}:adjust:-1`}
              disabled={row.quantity === 0}
              className="!min-h-[28px] !min-w-[28px] !px-2"
            >
              {busyRow === `${row.id}:adjust:-1` ? "" : "−"}
            </Button>
            <span className={isLow ? "font-bold text-rose-600 tabular-nums" : "tabular-nums"}>{row.quantity}</span>
            <Button
              variant="small"
              type="button"
              onClick={() => adjustQty(row.id, 1)}
              loading={busyRow === `${row.id}:adjust:1`}
              className="!min-h-[28px] !min-w-[28px] !px-2"
            >
              {busyRow === `${row.id}:adjust:1` ? "" : "+"}
            </Button>
          </div>
        );
      }
    },
    { key: "unitPrice", label: "Unit price", align: "right", render: (row) => <span className="tabular-nums">{money(row.unitPrice, currency)}</span> },
    { key: "total", label: "Total", align: "right", render: (row) => <strong className="tabular-nums">{money(row.unitPrice * row.quantity, currency)}</strong> },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="inline-flex gap-2">
          <Button variant="small" type="button" onClick={() => setEditing(row)}>Edit</Button>
          <Button
            variant="smallDanger"
            type="button"
            onClick={() => removeItem(row.id, row.name)}
            loading={busyRow === `${row.id}:delete`}
          >
            Remove
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Items in stock" value={totalUnits} icon={<Package className="h-4 w-4" />} accent="indigo" />
        <MetricCard label="Inventory value (cost)" value={money(totalValue, currency)} icon={<Banknote className="h-4 w-4" />} accent="emerald" />
        <MetricCard label="Retail value" value={money(totalRetail, currency)} icon={<ArrowUpRight className="h-4 w-4" />} accent="cyan" />
        <MetricCard label="Low stock alerts" value={lowStock} icon={<AlertTriangle className="h-4 w-4" />} accent="rose" />
      </section>

      <Panel>
        <PageHeader
          title="Inventory"
          subtitle="Manage stock and pricing"
          count={inventory.length}
          actionLabel="Add item"
          onAction={() => setCreateOpen(true)}
        />
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search SKU, name or category…"
          resultCount={filtered.length}
          totalCount={inventory.length}
          filters={[
            {
              key: "category",
              label: "Category",
              value: categoryFilter,
              onChange: setCategoryFilter,
              options: INVENTORY_CATEGORIES.map((value) => ({ label: value, value }))
            },
            {
              key: "stock",
              label: "Stock",
              value: stockFilter,
              onChange: setStockFilter,
              options: [
                { label: "Low stock", value: "low" },
                { label: "Out of stock", value: "out" },
                { label: "Healthy", value: "ok" }
              ]
            }
          ]}
        />
        <DataTable
          columns={columns}
          rows={filtered.map((row) => ({ ...row, _key: row.id }))}
          empty="No inventory items match the current filters."
        />
      </Panel>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add inventory item"
        subtitle="Create a new product or service"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setCreateOpen(false)} disabled={createBusy}>Cancel</Button>
            <Button type="submit" form="inventory-form" loading={createBusy}>Add item</Button>
          </>
        }
      >
        <form id="inventory-form" className="grid gap-4 sm:grid-cols-2" onSubmit={addItem}>
          <Input label="SKU" value={form.sku} onChange={(sku) => setForm({ ...form, sku })} />
          <Input label="Product name" value={form.name} onChange={(name) => setForm({ ...form, name })} required />
          <Select label="Category" value={form.category} onChange={(category) => setForm({ ...form, category })} options={INVENTORY_CATEGORIES} />
          <Input label="Quantity" type="number" value={form.quantity} onChange={(quantity) => setForm({ ...form, quantity: Number(quantity) })} />
          <Input label="Reorder level" type="number" value={form.reorderLevel} onChange={(reorderLevel) => setForm({ ...form, reorderLevel: Number(reorderLevel) })} />
          <Input label="Unit cost" type="number" value={form.unitCost} onChange={(unitCost) => setForm({ ...form, unitCost: Number(unitCost) })} />
          <Input label="Unit price" type="number" value={form.unitPrice} onChange={(unitPrice) => setForm({ ...form, unitPrice: Number(unitPrice) })} />
        </form>
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit inventory item"
        subtitle={editing ? editing.name : ""}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setEditing(null)} disabled={editBusy}>Cancel</Button>
            <Button type="submit" form="inventory-edit-form" loading={editBusy}>Save changes</Button>
          </>
        }
      >
        {editing ? (
          <form id="inventory-edit-form" className="grid gap-4 sm:grid-cols-2" onSubmit={saveEdit}>
            <Input label="SKU" value={editing.sku} onChange={(sku) => setEditing({ ...editing, sku })} />
            <Input label="Product name" value={editing.name} onChange={(name) => setEditing({ ...editing, name })} required />
            <Select label="Category" value={editing.category} onChange={(category) => setEditing({ ...editing, category })} options={INVENTORY_CATEGORIES} />
            <Input label="Quantity" type="number" value={editing.quantity} onChange={(quantity) => setEditing({ ...editing, quantity: Number(quantity) })} />
            <Input label="Reorder level" type="number" value={editing.reorderLevel} onChange={(reorderLevel) => setEditing({ ...editing, reorderLevel: Number(reorderLevel) })} />
            <Input label="Unit cost" type="number" value={editing.unitCost} onChange={(unitCost) => setEditing({ ...editing, unitCost: Number(unitCost) })} />
            <Input label="Unit price" type="number" value={editing.unitPrice} onChange={(unitPrice) => setEditing({ ...editing, unitPrice: Number(unitPrice) })} />
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
