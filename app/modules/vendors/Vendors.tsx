"use client";

import { Directory } from "@/components/Directory";
import type { Party } from "@/lib/types";

interface VendorsProps {
  data: { vendors: Party[] };
  reload: () => void;
}

export function Vendors({ data, reload }: VendorsProps) {
  return (
    <Directory
      title="Vendors"
      singular="vendor"
      endpoint="/api/vendors"
      records={data.vendors}
      reload={reload}
    />
  );
}
