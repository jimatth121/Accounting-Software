"use client";

import { useState } from "react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { Input } from "@/components/forms/Input";
import { MetricCard } from "@/components/MetricCard";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { Select } from "@/components/forms/Select";
import { INVENTORY_CATEGORIES } from "@/lib/constants";
import type { Column, InventoryItem } from "@/lib/types";
import { money } from "@/lib/utils";

interface InventoryProps {
  inventory: InventoryItem[];
  setInventory: (items: InventoryItem[]) => void;
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

export function Inventory({ inventory, setInventory, currency }: InventoryProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);

  function addItem(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name) return;
    const item: InventoryItem = {
      id: `inv-${Date.now()}`,
      sku: form.sku || `SKU-${Math.floor(Math.random() * 9000) + 1000}`,
      name: form.name,
      category: form.category,
      quantity: Number(form.quantity) || 0,
      reorderLevel: Number(form.reorderLevel) || 0,
      unitCost: Number(form.unitCost) || 0,
      unitPrice: Number(form.unitPrice) || 0
    };
    setInventory([item, ...inventory]);
    setForm(blank);
    setOpen(false);
  }

  function adjustQty(id: string, delta: number) {
    setInventory(
      inventory.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
      )
    );
  }

  function removeItem(id: string) {
    setInventory(inventory.filter((item) => item.id !== id));
  }

  const totalValue = inventory.reduce((sum, item) => sum + item.unitCost * item.quantity, 0);
  const totalRetail = inventory.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const lowStock = inventory.filter((item) => item.quantity <= item.reorderLevel).length;
  const totalUnits = inventory.reduce((sum, item) => sum + item.quantity, 0);

  const columns: Column<InventoryItem>[] = [
    { key: "sku", label: "SKU", render: (row) => <strong>{row.sku}</strong> },
    { key: "name", label: "Name" },
    { key: "category", label: "Category", render: (row) => <Badge>{row.category}</Badge> },
    {
      key: "quantity",
      label: "Stock",
      render: (row) => {
        const isLow = row.quantity <= row.reorderLevel;
        return (
          <div className="inline-flex items-center gap-2">
            <Button variant="small" type="button" onClick={() => adjustQty(row.id, -1)} className="!min-h-[28px] !min-w-[28px] !px-2">−</Button>
            <span className={isLow ? "font-bold text-rose-600" : ""}>{row.quantity}</span>
            <Button variant="small" type="button" onClick={() => adjustQty(row.id, 1)} className="!min-h-[28px] !min-w-[28px] !px-2">+</Button>
          </div>
        );
      }
    },
    { key: "unitPrice", label: "Unit price", align: "right", render: (row) => money(row.unitPrice, currency) },
    { key: "total", label: "Total", align: "right", render: (row) => <strong>{money(row.unitPrice * row.quantity, currency)}</strong> },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <Button variant="smallDanger" type="button" onClick={() => removeItem(row.id)}>Remove</Button>
      )
    }
  ];

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Items in stock" value={totalUnits} icon="▣" accent="indigo" />
        <MetricCard label="Inventory value (cost)" value={money(totalValue, currency)} icon="₦" accent="emerald" />
        <MetricCard label="Retail value" value={money(totalRetail, currency)} icon="↗" accent="cyan" />
        <MetricCard label="Low stock alerts" value={lowStock} icon="!" accent="rose" />
      </section>

      <Panel>
        <PageHeader
          title="Inventory"
          subtitle="Manage stock and pricing"
          count={inventory.length}
          actionLabel="Add item"
          onAction={() => setOpen(true)}
        />
        <DataTable columns={columns} rows={inventory.map((row) => ({ ...row, _key: row.id }))} empty="No inventory items yet — add your first product." />
      </Panel>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add inventory item"
        subtitle="Create a new product or service"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form="inventory-form">Add item</Button>
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
    </div>
  );
}
