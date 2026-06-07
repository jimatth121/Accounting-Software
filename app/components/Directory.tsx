"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { Input } from "@/components/forms/Input";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { Panel } from "@/components/Panel";
import { TableToolbar } from "@/components/TableToolbar";
import { api } from "@/lib/api";
import { useCan } from "@/lib/permissions";
import { useDebounced, usePaginatedTable } from "@/lib/usePaginatedTable";
import type { Column, Party } from "@/lib/types";

interface DirectoryProps {
  title: string;
  singular: string;
  endpoint: string;
  module: string;
  records: Party[];
  reload: () => void;
}

const blank = { name: "", companyName: "", email: "", phone: "", address: "", taxId: "", notes: "" };

export function Directory({ title, singular, endpoint, module, records, reload }: DirectoryProps) {
  const can = useCan();
  const canWrite = can(module, "write");
  const canDelete = can(module, "delete");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<Party | null>(null);
  const [search, setSearch] = useState("");
  const [createBusy, setCreateBusy] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [busyRow, setBusyRow] = useState<string>("");

  const debouncedSearch = useDebounced(search);
  const { rows, meta, page, setPage, loading, refetch } = usePaginatedTable<Party>(endpoint, {
    search: debouncedSearch
  });

  // Refresh both the bootstrap data (header counts / dropdowns) and the table.
  const refresh = useCallback(() => {
    reload();
    refetch();
  }, [reload, refetch]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setCreateBusy(true);
    try {
      await api(endpoint, {
        method: "POST",
        body: JSON.stringify(form),
        successMessage: `${singular[0].toUpperCase()}${singular.slice(1)} added`,
        successDetail: form.name
      });
      setForm(blank);
      setCreateOpen(false);
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
      await api(`${endpoint}/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editing.name,
          companyName: editing.companyName,
          email: editing.email,
          phone: editing.phone,
          address: editing.address,
          taxId: editing.taxId,
          notes: editing.notes
        }),
        successMessage: `${singular[0].toUpperCase()}${singular.slice(1)} updated`,
        successDetail: editing.name
      });
      setEditing(null);
      refresh();
    } finally {
      setEditBusy(false);
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete this ${singular}?`)) return;
    setBusyRow(`${id}:delete`);
    try {
      await api(`${endpoint}/${id}`, {
        method: "DELETE",
        successMessage: `${singular[0].toUpperCase()}${singular.slice(1)} deleted`,
        successDetail: name
      });
      refresh();
    } finally {
      setBusyRow("");
    }
  }

  const columns: Column<Party>[] = [
    { key: "name", label: "Name", render: (row) => <strong className="text-slate-900">{row.name}</strong> },
    { key: "email", label: "Email", render: (row) => row.email || <span className="text-slate-400">—</span> },
    { key: "phone", label: "Phone", render: (row) => row.phone || <span className="text-slate-400">—</span> },
    { key: "companyName", label: "Company", render: (row) => row.companyName || <span className="text-slate-400">—</span> },
    { key: "address", label: "Address", render: (row) => row.address || <span className="text-slate-400">—</span> },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="inline-flex gap-2">
          {canWrite ? <Button variant="small" type="button" onClick={() => setEditing(row)}>Edit</Button> : null}
          {canDelete ? (
            <Button
              variant="smallDanger"
              type="button"
              loading={busyRow === `${row.id}:delete`}
              onClick={() => remove(row.id, row.name)}
            >
              Delete
            </Button>
          ) : null}
        </div>
      )
    }
  ];

  const formId = `${singular}-form`;
  const editFormId = `${singular}-edit-form`;

  return (
    <Panel>
      <PageHeader
        title={title}
        subtitle={`Manage your ${title.toLowerCase()}`}
        count={records.length}
        actionLabel={`Add ${singular}`}
        onAction={canWrite ? () => setCreateOpen(true) : undefined}
      />
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder={`Search ${title.toLowerCase()} by name, email, phone…`}
        resultCount={meta.total}
        totalCount={records.length}
      />
      <DataTable columns={columns} rows={rows.map((row) => ({ ...row, _key: row.id || row.name }))} empty={`No ${title.toLowerCase()} match the current filters.`} />
      <Pagination
        page={page}
        totalPages={meta.totalPages}
        total={meta.total}
        pageSize={meta.pageSize}
        onPageChange={setPage}
        loading={loading}
      />

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={`Add ${singular}`}
        subtitle={`Create a new ${singular} record`}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setCreateOpen(false)} disabled={createBusy}>Cancel</Button>
            <Button type="submit" form={formId} loading={createBusy}>Save {singular}</Button>
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

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={`Edit ${singular}`}
        subtitle={editing ? editing.name : ""}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setEditing(null)} disabled={editBusy}>Cancel</Button>
            <Button type="submit" form={editFormId} loading={editBusy}>Save changes</Button>
          </>
        }
      >
        {editing ? (
          <form id={editFormId} className="grid gap-4 sm:grid-cols-2" onSubmit={saveEdit}>
            <Input label="Name" value={editing.name} onChange={(name) => setEditing({ ...editing, name })} required />
            <Input label="Company name" value={editing.companyName || ""} onChange={(companyName) => setEditing({ ...editing, companyName })} />
            <Input label="Email" value={editing.email || ""} onChange={(email) => setEditing({ ...editing, email })} />
            <Input label="Phone" value={editing.phone || ""} onChange={(phone) => setEditing({ ...editing, phone })} />
            <Input label="Address" value={editing.address || ""} onChange={(address) => setEditing({ ...editing, address })} />
            <Input label="Tax ID" value={editing.taxId || ""} onChange={(taxId) => setEditing({ ...editing, taxId })} />
          </form>
        ) : null}
      </Modal>
    </Panel>
  );
}
