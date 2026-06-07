"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Crown, Lock, Pencil, Plus, RotateCcw, Shield, Trash2, Eye, X } from "lucide-react";
import { Button } from "@/components/Button";
import { Panel } from "@/components/Panel";
import { api } from "@/lib/api";
import type { Member, PermissionAction, Permissions } from "@/lib/types";
import { clsx } from "@/lib/utils";

interface PermissionsTabProps {
  permissions: Permissions | null;
  currentMember: Member | null;
  reload: () => void;
}

const ACTION_META: Record<PermissionAction, { label: string; icon: typeof Eye; tone: string }> = {
  read: { label: "View", icon: Eye, tone: "from-cyan-500 to-blue-500" },
  write: { label: "Edit", icon: Pencil, tone: "from-amber-500 to-orange-500" },
  delete: { label: "Delete", icon: Trash2, tone: "from-rose-500 to-fuchsia-500" }
};

const ROLE_TONE: Record<string, { gradient: string; border: string; chip: string }> = {
  Administrator: {
    gradient: "from-fuchsia-500 via-purple-500 to-indigo-500",
    border: "border-fuchsia-200",
    chip: "bg-fuchsia-50 text-fuchsia-700"
  },
  Accountant: {
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    border: "border-emerald-200",
    chip: "bg-emerald-50 text-emerald-700"
  },
  Member: {
    gradient: "from-brand-500 via-indigo-500 to-violet-500",
    border: "border-brand-200",
    chip: "bg-brand-50 text-brand-700"
  },
  Viewer: {
    gradient: "from-slate-500 via-slate-600 to-slate-700",
    border: "border-slate-200",
    chip: "bg-slate-100 text-slate-600"
  }
};

const ROLE_DESCRIPTION: Record<string, string> = {
  Administrator: "Owns the workspace. Has every permission across every module — this cannot be changed.",
  Accountant: "Handles the books — invoices, expenses, payments and reconciliations.",
  Member: "Day-to-day collaborators who create and edit most records.",
  Viewer: "Read-only access. Useful for stakeholders or auditors who shouldn't make changes."
};

function cloneMatrix(matrix: Permissions["matrix"]): Permissions["matrix"] {
  return JSON.parse(JSON.stringify(matrix));
}

function countYeses(role: string, matrix: Permissions["matrix"], modules: string[]): number {
  let count = 0;
  for (const module of modules) {
    const cell = matrix?.[role]?.[module];
    if (!cell) continue;
    if (cell.read) count++;
    if (cell.write) count++;
    if (cell.delete) count++;
  }
  return count;
}

export function PermissionsTab({ permissions, currentMember, reload }: PermissionsTabProps) {
  const isAdmin = currentMember?.role === "Administrator";
  const [matrix, setMatrix] = useState<Permissions["matrix"]>(
    permissions ? cloneMatrix(permissions.matrix) : {}
  );
  const [activeRole, setActiveRole] = useState<string>("Accountant");
  const [saveBusy, setSaveBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  useEffect(() => {
    if (permissions) setMatrix(cloneMatrix(permissions.matrix));
  }, [permissions]);

  const roles = useMemo(() => permissions?.roles || [], [permissions]);
  const modules = useMemo(() => permissions?.modules || [], [permissions]);
  const actions = useMemo<PermissionAction[]>(
    () => (permissions?.actions || []) as PermissionAction[],
    [permissions]
  );

  function toggle(role: string, module: string, action: PermissionAction) {
    if (!isAdmin) return;
    if (role === "Administrator") return;
    setMatrix((prev) => {
      const next = cloneMatrix(prev);
      const cell = next[role]?.[module] || { read: false, write: false, delete: false };
      const current = Boolean(cell[action]);
      next[role] = next[role] || {};
      next[role][module] = { ...cell, [action]: !current };
      // Cascade: turning OFF read disables write/delete; turning ON write/delete forces read on.
      if (action === "read" && current) {
        next[role][module].write = false;
        next[role][module].delete = false;
      }
      if ((action === "write" || action === "delete") && !current) {
        next[role][module].read = true;
      }
      return next;
    });
  }

  function setAllForRole(role: string, value: boolean) {
    if (!isAdmin || role === "Administrator") return;
    setMatrix((prev) => {
      const next = cloneMatrix(prev);
      next[role] = next[role] || {};
      for (const module of modules) {
        next[role][module] = { read: value, write: value, delete: value };
      }
      return next;
    });
  }

  async function save() {
    setSaveBusy(true);
    try {
      await api("/api/permissions", {
        method: "PATCH",
        body: JSON.stringify({ matrix }),
        successMessage: "Permissions saved"
      });
      reload();
    } finally {
      setSaveBusy(false);
    }
  }

  async function resetToDefaults() {
    if (!confirm("Reset all role permissions to the defaults?")) return;
    setResetBusy(true);
    try {
      await api("/api/permissions/reset", {
        method: "POST",
        successMessage: "Permissions reset"
      });
      reload();
    } finally {
      setResetBusy(false);
    }
  }

  if (!permissions) {
    return (
      <Panel>
        <p className="text-sm text-slate-500">Permission settings are loading…</p>
      </Panel>
    );
  }

  const totalCells = modules.length * actions.length;
  const active = activeRole === "Administrator" || roles.includes(activeRole) ? activeRole : roles[1] || roles[0];
  const activeTone = ROLE_TONE[active] || ROLE_TONE.Member;
  const activeIsAdmin = active === "Administrator";

  return (
    <div className="grid gap-5">
      {/* Header */}
      <Panel>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Role permissions</h3>
            <p className="mt-0.5 text-sm text-slate-500">
              Pick a role to see and edit every permission it has. Administrators always keep full access.
            </p>
          </div>
          {isAdmin ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" type="button" onClick={resetToDefaults} loading={resetBusy}>
                <RotateCcw className="h-4 w-4" />
                Reset defaults
              </Button>
              <Button type="button" onClick={save} loading={saveBusy}>
                <Shield className="h-4 w-4" />
                Save changes
              </Button>
            </div>
          ) : (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <Lock className="h-3 w-3" />
              View only
            </p>
          )}
        </div>

        {/* Role chips */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map((role) => {
            const tone = ROLE_TONE[role] || ROLE_TONE.Member;
            const count = role === "Administrator" ? totalCells : countYeses(role, matrix, modules);
            const isCurrent = role === active;
            return (
              <button
                key={role}
                type="button"
                onClick={() => setActiveRole(role)}
                className={clsx(
                  "group relative overflow-hidden rounded-2xl border-2 p-4 text-left transition",
                  isCurrent
                    ? `${tone.border} bg-white shadow-lg shadow-slate-200`
                    : "border-transparent bg-slate-50 hover:bg-white hover:shadow"
                )}
              >
                <div
                  className={clsx(
                    "absolute inset-x-0 top-0 h-1 bg-gradient-to-r transition",
                    isCurrent ? tone.gradient : "from-transparent to-transparent"
                  )}
                />
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow",
                      tone.gradient
                    )}
                  >
                    {role === "Administrator" ? (
                      <Crown className="h-5 w-5" />
                    ) : role === "Accountant" ? (
                      <Shield className="h-5 w-5" />
                    ) : role === "Viewer" ? (
                      <Eye className="h-5 w-5" />
                    ) : (
                      <Pencil className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{role}</p>
                    <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                      {count} / {totalCells} permissions
                    </p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={clsx("h-full rounded-full bg-gradient-to-r", tone.gradient)}
                    style={{ width: `${(count / Math.max(1, totalCells)) * 100}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </Panel>

      {/* Active role card */}
      <Panel className="!p-0 overflow-hidden">
        <div className={clsx("relative bg-gradient-to-br px-6 py-6 text-white", activeTone.gradient)}>
          <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/15 blur-sm" />
          <div className="relative z-10 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                {active === "Administrator" ? <Crown className="h-6 w-6" /> : <Shield className="h-6 w-6" />}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/80">Editing role</p>
                <h4 className="text-xl font-extrabold tracking-tight">{active}</h4>
                <p className="mt-0.5 max-w-xl text-xs text-white/85">{ROLE_DESCRIPTION[active] || ""}</p>
              </div>
            </div>
            {!activeIsAdmin && isAdmin ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAllForRole(active, true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur transition hover:bg-white/30"
                >
                  <Check className="h-3.5 w-3.5" />
                  Grant all
                </button>
                <button
                  type="button"
                  onClick={() => setAllForRole(active, false)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur transition hover:bg-white/30"
                >
                  <X className="h-3.5 w-3.5" />
                  Revoke all
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Per-module list */}
        <div className="grid gap-2 p-5 sm:p-6">
          {modules.map((module) => {
            const cell = activeIsAdmin
              ? { read: true, write: true, delete: true }
              : matrix?.[active]?.[module] || { read: false, write: false, delete: false };
            return (
              <div
                key={module}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">{module}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {cell.read || cell.write || cell.delete
                      ? [cell.read && "View", cell.write && "Edit", cell.delete && "Delete"]
                          .filter(Boolean)
                          .join(" · ")
                      : "No access"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {actions.map((action) => {
                    const meta = ACTION_META[action];
                    const Icon = meta.icon;
                    const checked = Boolean(cell[action]);
                    return (
                      <button
                        key={action}
                        type="button"
                        disabled={!isAdmin || activeIsAdmin}
                        onClick={() => toggle(active, module, action)}
                        aria-pressed={checked}
                        className={clsx(
                          "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition",
                          checked
                            ? clsx(
                                "border-transparent text-white shadow-md bg-gradient-to-br",
                                meta.tone
                              )
                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                          (!isAdmin || activeIsAdmin) ? "cursor-not-allowed opacity-80" : "hover:-translate-y-0.5"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
          <p className="flex items-start gap-2 text-xs text-slate-600">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
            Turning off <strong className="mx-1">View</strong> automatically disables Edit and Delete.
            Turning on <strong className="mx-1">Edit</strong> or <strong className="mx-1">Delete</strong> forces View on.
          </p>
        </div>
      </Panel>
    </div>
  );
}
