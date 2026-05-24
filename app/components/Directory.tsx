"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { Input } from "@/components/forms/Input";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { api } from "@/lib/api";
import type { Column, Party } from "@/lib/types";

interface DirectoryProps {
  title: string;
  singular: string;
  endpoint: string;
  records: Party[];
  reload: () => void;
}

const blank = { name: "", companyName: "", email: "", phone: "", address: "", taxId: "", notes: "" };

export function Directory({ title, singular, endpoint, records, reload }: DirectoryProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await api(endpoint, { method: "POST", body: JSON.stringify(form) });
    setForm(blank);
    setOpen(false);
    reload();
  }

  const columns: Column<Party>[] = [
    { key: "name", label: "Name", render: (row) => <strong className="text-slate-900">{row.name}</strong> },
    { key: "email", label: "Email", render: (row) => row.email || <span className="text-slate-400">—</span> },
    { key: "phone", label: "Phone", render: (row) => row.phone || <span className="text-slate-400">—</span> },
    { key: "companyName", label: "Company", render: (row) => row.companyName || <span className="text-slate-400">—</span> },
    { key: "address", label: "Address", render: (row) => row.address || <span className="text-slate-400">—</span> }
  ];

  const formId = `${singular}-form`;

  return (
    <Panel>
      <PageHeader
        title={title}
        subtitle={`Manage your ${title.toLowerCase()}`}
        count={records.length}
        actionLabel={`Add ${singular}`}
        onAction={() => setOpen(true)}
      />
      <DataTable columns={columns} rows={records.map((row) => ({ ...row, _key: row.id || row.name }))} empty={`No ${title.toLowerCase()} yet`} />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Add ${singular}`}
        subtitle={`Create a new ${singular} record`}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form={formId}>Save {singular}</Button>
          </>
        }
      >
        <form id={formId} className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
          <Input label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} required />
          <Input label="Company name" value={form.companyName} onChange={(companyName) => setForm({ ...form, companyName })} />
          <Input label="Email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
          <Input label="Phone" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
          <Input label="Address" value={form.address} onChange={(address) => setForm({ ...form, address })} />
          <Input label="Tax ID" value={form.taxId} onChange={(taxId) => setForm({ ...form, taxId })} />
        </form>
      </Modal>
    </Panel>
  );
}
