"use client";

import { Directory } from "@/components/Directory";
import type { Party } from "@/lib/types";

interface CustomersProps {
  data: { customers: Party[] };
  reload: () => void;
}

export function Customers({ data, reload }: CustomersProps) {
  return (
    <Directory
      title="Customers"
      singular="customer"
      endpoint="/api/customers"
      module="Customers"
      records={data.customers}
      reload={reload}
    />
  );
}
