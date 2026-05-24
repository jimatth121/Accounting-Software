"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Notice } from "@/components/Notice";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { api, setAuthContext } from "@/lib/api";
import { EMPTY_STATE } from "@/lib/constants";
import type { AppData, InventoryItem, NavLabel } from "@/lib/types";
import { AIAssistant } from "@/modules/ai-assistant/AIAssistant";
import { Company } from "@/modules/company/Company";
import { Customers } from "@/modules/customers/Customers";
import { Dashboard } from "@/modules/dashboard/Dashboard";
import { Expenses } from "@/modules/expenses/Expenses";
import { Inventory } from "@/modules/inventory/Inventory";
import { Invoices } from "@/modules/invoices/Invoices";
import { Payments } from "@/modules/payments/Payments";
import { Reports } from "@/modules/reports/Reports";
import { Settings } from "@/modules/settings/Settings";
import { Vendors } from "@/modules/vendors/Vendors";

export default function Home() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const [active, setActive] = useState<NavLabel>("Dashboard");
  const [data, setData] = useState<AppData>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  async function loadData() {
    try {
      setError("");
      const bootstrap = await api<Partial<AppData>>("/api/bootstrap");
      setData({ ...EMPTY_STATE, ...bootstrap });
    } catch {
      setError("Start the backend API on port 4000 to use live data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !userId) {
      setAuthContext(null);
      window.location.href = "/sign-in";
      return;
    }
    const profile = {
      name: user?.unsafeMetadata?.companyName as string | undefined ?? user?.fullName ?? undefined,
      email: user?.primaryEmailAddress?.emailAddress,
      phone: user?.primaryPhoneNumber?.phoneNumber,
      address: user?.unsafeMetadata?.address as string | undefined,
      country: user?.unsafeMetadata?.country as string | undefined
    };
    setAuthContext({ userId, profile });
    loadData();
  }, [isLoaded, isSignedIn, userId, user]);

  const currency = data.company?.defaultCurrency || "NGN";

  if (!isLoaded || !isSignedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="text-sm font-medium">Loading workspace...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen md:grid-cols-[260px_1fr]">
      <Sidebar
        active={active}
        onSelect={setActive}
        open={navOpen}
        onClose={() => setNavOpen(false)}
        companyName={data.company?.name}
      />

      <section className="grid gap-5 px-4 py-5 md:px-7 md:py-6 min-w-0">
        <Topbar
          section={active}
          companyName={data.company?.name}
          onMenuClick={() => setNavOpen(!navOpen)}
          onSettings={() => setActive("Settings")}
          notificationCount={data.anomalies.length}
        />

        {error ? <Notice>{error}</Notice> : null}
        {loading ? <Notice tone="info">Loading SmartBooks AI...</Notice> : null}

        {!loading && active === "Dashboard" ? <Dashboard data={data} currency={currency} /> : null}
        {!loading && active === "Company" ? <Company data={data} reload={loadData} /> : null}
        {!loading && active === "Customers" ? <Customers data={data} reload={loadData} /> : null}
        {!loading && active === "Vendors" ? <Vendors data={data} reload={loadData} /> : null}
        {!loading && active === "Invoices" ? <Invoices data={data} reload={loadData} /> : null}
        {!loading && active === "Expenses" ? <Expenses data={data} reload={loadData} currency={currency} /> : null}
        {!loading && active === "Payments" ? <Payments data={data} reload={loadData} currency={currency} /> : null}
        {!loading && active === "Inventory" ? <Inventory inventory={inventory} setInventory={setInventory} currency={currency} /> : null}
        {!loading && active === "Reports" ? <Reports data={data} currency={currency} /> : null}
        {!loading && active === "AI Assistant" ? <AIAssistant data={data} /> : null}
        {!loading && active === "Settings" ? <Settings data={data} reload={loadData} /> : null}
      </section>
    </main>
  );
}
