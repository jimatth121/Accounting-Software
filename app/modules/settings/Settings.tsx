"use client";

import { useState } from "react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Input } from "@/components/forms/Input";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { Select } from "@/components/forms/Select";
import { Toggle } from "@/components/Toggle";
import { api } from "@/lib/api";
import type { Company } from "@/lib/types";
import { clsx } from "@/lib/utils";

interface SettingsProps {
  data: { company: Company | null };
  reload: () => void;
}

type Tab = "profile" | "company" | "notifications" | "security" | "preferences";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "profile", label: "Profile", icon: "◉" },
  { id: "company", label: "Company", icon: "◈" },
  { id: "notifications", label: "Notifications", icon: "⚑" },
  { id: "security", label: "Security", icon: "🔒" },
  { id: "preferences", label: "Preferences", icon: "✦" }
];

export function Settings({ data, reload }: SettingsProps) {
  const [tab, setTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState({
    fullName: "Account Owner",
    email: data.company?.email || "",
    role: "Administrator"
  });
  const [company, setCompany] = useState<Company>(data.company || {});
  const [security, setSecurity] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [notifications, setNotifications] = useState({
    invoiceReminders: true,
    paymentReceived: true,
    overdueAlerts: true,
    weeklyDigest: false,
    productUpdates: false,
    emailMarketing: false
  });
  const [preferences, setPreferences] = useState({
    theme: "light",
    language: "English",
    dateFormat: "DD MMM YYYY",
    twoFactor: false,
    autoBackup: true
  });

  async function saveCompany(event: React.FormEvent) {
    event.preventDefault();
    await api("/api/company", { method: "PATCH", body: JSON.stringify(company) });
    reload();
  }

  return (
    <div className="grid gap-5">
      <PageHeader title="Settings" subtitle="Manage your account, company and preferences" />

      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        {/* Tab nav */}
        <Panel className="!p-3 h-fit">
          <nav className="grid gap-1">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition",
                  tab === item.id
                    ? "bg-brand-50 text-brand-700 shadow-card"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <span
                  className={clsx(
                    "flex h-7 w-7 items-center justify-center rounded-lg text-sm",
                    tab === item.id ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500"
                  )}
                >
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </nav>
        </Panel>

        {/* Content */}
        <div className="grid gap-5">
          {tab === "profile" ? (
            <Panel>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Profile</h3>
                  <p className="mt-0.5 text-sm text-slate-500">Update your personal information</p>
                </div>
                <Badge tone="low">Active</Badge>
              </div>

              <div className="mb-6 flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-gradient-to-br from-brand-50 to-fuchsia-50 p-6 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-500 text-2xl font-bold text-white shadow-lg shadow-brand-500/30">
                  {profile.fullName?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="text-center sm:text-left">
                  <h4 className="text-lg font-bold text-slate-900">{profile.fullName}</h4>
                  <p className="text-sm text-slate-500">{profile.email || "No email set"}</p>
                  <p className="mt-1 text-xs font-semibold text-brand-700">{profile.role}</p>
                </div>
                <div className="sm:ml-auto">
                  <Button variant="secondary" type="button">Change avatar</Button>
                </div>
              </div>

              <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
                <Input label="Full name" value={profile.fullName} onChange={(fullName) => setProfile({ ...profile, fullName })} />
                <Input label="Email" type="email" value={profile.email} onChange={(email) => setProfile({ ...profile, email })} />
                <Select label="Role" value={profile.role} onChange={(role) => setProfile({ ...profile, role })} options={["Administrator", "Accountant", "Viewer", "Member"]} />
                <div className="col-span-full mt-2 flex justify-end gap-2">
                  <Button variant="secondary" type="button">Discard</Button>
                  <Button type="submit">Save profile</Button>
                </div>
              </form>
            </Panel>
          ) : null}

          {tab === "company" ? (
            <Panel>
              <div className="mb-5">
                <h3 className="text-base font-bold text-slate-900">Company information</h3>
                <p className="mt-0.5 text-sm text-slate-500">This information appears on invoices and reports</p>
              </div>
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={saveCompany}>
                <Input label="Business name" value={company.name} onChange={(name) => setCompany({ ...company, name })} />
                <Input label="Business email" value={company.email} onChange={(email) => setCompany({ ...company, email })} />
                <Input label="Phone" value={company.phone} onChange={(phone) => setCompany({ ...company, phone })} />
                <Input label="Address" value={company.address} onChange={(address) => setCompany({ ...company, address })} />
                <Input label="Country" value={company.country} onChange={(country) => setCompany({ ...company, country })} />
                <Select label="Default currency" value={company.defaultCurrency} onChange={(defaultCurrency) => setCompany({ ...company, defaultCurrency })} options={["NGN", "USD", "GBP", "EUR"]} />
                <Input label="Tax ID" value={company.taxId} onChange={(taxId) => setCompany({ ...company, taxId })} />
                <Input label="Fiscal year start" value={company.fiscalYearStartMonth} onChange={(fiscalYearStartMonth) => setCompany({ ...company, fiscalYearStartMonth })} />
                <div className="col-span-full mt-2 flex justify-end gap-2">
                  <Button variant="secondary" type="button">Discard</Button>
                  <Button type="submit">Save company</Button>
                </div>
              </form>
            </Panel>
          ) : null}

          {tab === "notifications" ? (
            <Panel>
              <div className="mb-5">
                <h3 className="text-base font-bold text-slate-900">Notification preferences</h3>
                <p className="mt-0.5 text-sm text-slate-500">Choose what you want to be notified about</p>
              </div>
              <div className="divide-y divide-slate-200">
                <Toggle
                  checked={notifications.invoiceReminders}
                  onChange={(invoiceReminders) => setNotifications({ ...notifications, invoiceReminders })}
                  label="Invoice reminders"
                  description="Notify customers automatically when invoices are due"
                />
                <Toggle
                  checked={notifications.paymentReceived}
                  onChange={(paymentReceived) => setNotifications({ ...notifications, paymentReceived })}
                  label="Payment received"
                  description="Get notified when a payment is received"
                />
                <Toggle
                  checked={notifications.overdueAlerts}
                  onChange={(overdueAlerts) => setNotifications({ ...notifications, overdueAlerts })}
                  label="Overdue alerts"
                  description="Alert me when invoices become overdue"
                />
                <Toggle
                  checked={notifications.weeklyDigest}
                  onChange={(weeklyDigest) => setNotifications({ ...notifications, weeklyDigest })}
                  label="Weekly digest"
                  description="Email summary of your finances every Monday"
                />
                <Toggle
                  checked={notifications.productUpdates}
                  onChange={(productUpdates) => setNotifications({ ...notifications, productUpdates })}
                  label="Product updates"
                  description="Notify me about new features and improvements"
                />
                <Toggle
                  checked={notifications.emailMarketing}
                  onChange={(emailMarketing) => setNotifications({ ...notifications, emailMarketing })}
                  label="Marketing emails"
                  description="Tips, offers, and promotional content"
                />
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="secondary" type="button">Reset</Button>
                <Button type="button">Save preferences</Button>
              </div>
            </Panel>
          ) : null}

          {tab === "security" ? (
            <div className="grid gap-5">
              <Panel>
                <div className="mb-5">
                  <h3 className="text-base font-bold text-slate-900">Change password</h3>
                  <p className="mt-0.5 text-sm text-slate-500">Keep your account secure with a strong password</p>
                </div>
                <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
                  <div className="col-span-full">
                    <Input label="Current password" type="password" value={security.currentPassword} onChange={(currentPassword) => setSecurity({ ...security, currentPassword })} />
                  </div>
                  <Input label="New password" type="password" value={security.newPassword} onChange={(newPassword) => setSecurity({ ...security, newPassword })} />
                  <Input label="Confirm new password" type="password" value={security.confirmPassword} onChange={(confirmPassword) => setSecurity({ ...security, confirmPassword })} />
                  <div className="col-span-full mt-2 flex justify-end">
                    <Button type="submit">Update password</Button>
                  </div>
                </form>
              </Panel>

              <Panel>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Two-factor authentication</h3>
                    <p className="mt-0.5 text-sm text-slate-500">Add an extra layer of protection to your account</p>
                  </div>
                  <Badge tone={preferences.twoFactor ? "low" : "neutral"}>{preferences.twoFactor ? "Enabled" : "Disabled"}</Badge>
                </div>
                <Toggle
                  checked={preferences.twoFactor}
                  onChange={(twoFactor) => setPreferences({ ...preferences, twoFactor })}
                  label="Require 2FA on sign in"
                  description="Use an authenticator app to verify your identity"
                />
              </Panel>

              <Panel>
                <div className="mb-3">
                  <h3 className="text-base font-bold text-rose-700">Danger zone</h3>
                  <p className="mt-0.5 text-sm text-slate-500">Irreversible and destructive actions</p>
                </div>
                <div className="flex flex-col items-stretch gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <strong className="block text-sm font-semibold text-slate-900">Delete this workspace</strong>
                    <p className="mt-0.5 text-xs text-slate-600">All data including invoices, expenses and payments will be permanently removed.</p>
                  </div>
                  <Button variant="smallDanger" type="button" className="!min-h-[40px]">Delete workspace</Button>
                </div>
              </Panel>
            </div>
          ) : null}

          {tab === "preferences" ? (
            <Panel>
              <div className="mb-5">
                <h3 className="text-base font-bold text-slate-900">Preferences</h3>
                <p className="mt-0.5 text-sm text-slate-500">Customize your workspace</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Select label="Theme" value={preferences.theme} onChange={(theme) => setPreferences({ ...preferences, theme })} options={["light", "dark", "system"]} />
                <Select label="Language" value={preferences.language} onChange={(language) => setPreferences({ ...preferences, language })} options={["English", "French", "Spanish", "Portuguese"]} />
                <Select label="Date format" value={preferences.dateFormat} onChange={(dateFormat) => setPreferences({ ...preferences, dateFormat })} options={["DD MMM YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]} />
                <Select label="Default currency" value={company.defaultCurrency} onChange={(defaultCurrency) => setCompany({ ...company, defaultCurrency })} options={["NGN", "USD", "GBP", "EUR"]} />
              </div>
              <div className="mt-6 divide-y divide-slate-200">
                <Toggle
                  checked={preferences.autoBackup}
                  onChange={(autoBackup) => setPreferences({ ...preferences, autoBackup })}
                  label="Automatic backup"
                  description="Backup your data daily to the cloud"
                />
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="secondary" type="button">Discard</Button>
                <Button type="button">Save preferences</Button>
              </div>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
