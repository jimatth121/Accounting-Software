"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { api } from "@/lib/api";
import type { Company as CompanyType } from "@/lib/types";

interface CompanyProps {
  data: { company: CompanyType | null };
  reload: () => void;
}

export function Company({ data, reload }: CompanyProps) {
  const [form, setForm] = useState<CompanyType>(data.company || {});
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await api("/api/company", {
        method: "PATCH",
        body: JSON.stringify(form),
        successMessage: "Company profile saved"
      });
      reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel>
      <PageHeader title="Company setup" subtitle="Manage your business profile" />
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
        <Input label="Business name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
        <Input label="Business email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
        <Input label="Phone" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
        <Input label="Address" value={form.address} onChange={(address) => setForm({ ...form, address })} />
        <Input label="Country" value={form.country} onChange={(country) => setForm({ ...form, country })} />
        <Select
          label="Default currency"
          value={form.defaultCurrency}
          onChange={(defaultCurrency) => setForm({ ...form, defaultCurrency })}
          options={["NGN", "USD", "GBP", "EUR"]}
        />
        <Input label="Tax ID" value={form.taxId} onChange={(taxId) => setForm({ ...form, taxId })} />
        <Input label="Fiscal year start" value={form.fiscalYearStartMonth} onChange={(fiscalYearStartMonth) => setForm({ ...form, fiscalYearStartMonth })} />
        <div className="col-span-full mt-1 flex justify-end">
          <Button type="submit" loading={busy}>Save company</Button>
        </div>
      </form>
    </Panel>
  );
}
