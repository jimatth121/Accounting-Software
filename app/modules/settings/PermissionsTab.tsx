"use client";

import { useEffect, useMemo, useState } from "react";
import { Crown, Lock, RotateCcw, Shield } from "lucide-react";
import { Button } from "@/components/Button";
import { Panel } from "@/components/Panel";
import { api } from "@/lib/api";
import type { Member, Permissions } from "@/lib/types";
import { clsx } from "@/lib/utils";

interface PermissionsTabProps {
  permissions: Permissions | null;
  currentMember: Member | null;
  reload: () => void;
}

const ACTION_LABEL: Record<string, string> = {
  read: "View",
  write: "Edit",
  delete: "Delete"
};

const ROLE_DOT: Record<string, string> = {
  Administrator: "bg-fuchsia-500",
  Accountant: "bg-emerald-500",
  Member: "bg-brand-500",
  Viewer: "bg-slate-400"
};

function cloneMatrix(matrix: Permissions["matrix"]): Permissions["matrix"] {
  return JSON.parse(JSON.stringify(matrix));
}

export function PermissionsTab({ permissions, currentMember, reload }: PermissionsTabProps) {
  const isAdmin = currentMember?.role === "Administrator";
  const [matrix, setMatrix] = useState<Permissions["matrix"]>(
    permissions ? cloneMatrix(permissions.matrix) : {}
  );
  const [busy, setBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  useEffect(() => {
    if (permissions) setMatrix(cloneMatrix(permissions.matrix));
  }, [permissions]);

  const roles = useMemo(() => permissions?.roles || [], [permissions]);
  const modules = useMemo(() => permissions?.modules || [], [permissions]);
  const actions = useMemo(() => permissions?.actions || [], [permissions]);
  const editableRoles = roles.filter((role) => role !== "Administrator");

  function toggle(role: string, module: string, action: string) {
    if (!isAdmin) return;
    if (role === "Administrator") return;
    setMatrix((prev) => {
      const next = cloneMatrix(prev);
      const cell = next[role]?.[module] || { read: false, write: false, delete: false };
      const current = Boolean(cell[action as keyof typeof cell]);
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

  async function save() {
    setBusy(true);
    try {
      await api("/api/permissions", {
        method: "PATCH",
        body: JSON.stringify({ matrix }),
        successMessage: "Permissions saved"
      });
      reload();
    } finally {
      setBusy(false);
    }
  }

  async function resetToDefaults() {
    if (!confirm("Reset permissions to the default matrix?")) return;
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

  return (
    <Panel>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Role permissions</h3>
          <p className="mt-0.5 text-sm text-slate-500">
            Choose what each role can do across every module.
            Administrators always have full access.
          </p>
        </div>
        {isAdmin ? (
          <div className="flex gap-2">
            <Button variant="secondary" type="button" onClick={resetToDefaults} loading={resetBusy}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button type="button" onClick={save} loading={busy}>
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

      {/* Role legend */}
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        {roles.map((role) => (
          <span
            key={role}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
          >
            <span className={clsx("h-2 w-2 rounded-full", ROLE_DOT[role] || "bg-slate-300")} />
            {role}
            {role === "Administrator" ? <Crown className="h-3 w-3 text-amber-500" /> : null}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left">Module</th>
              {roles.map((role) => (
                <th key={role} colSpan={actions.length} className="border-l border-slate-200 px-3 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className={clsx("h-2 w-2 rounded-full", ROLE_DOT[role] || "bg-slate-300")} />
                    {role}
                  </div>
                </th>
              ))}
            </tr>
            <tr className="bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <th className="sticky left-0 z-10 bg-slate-50/60 px-4 py-2"></th>
              {roles.map((role) =>
                actions.map((action) => (
                  <th key={`${role}-${action}`} className="border-l border-slate-200 px-2 py-2 text-center font-medium">
                    {ACTION_LABEL[action] || action}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {modules.map((module, moduleIdx) => (
              <tr key={module} className={moduleIdx % 2 === 1 ? "bg-slate-50/40" : ""}>
                <td className="sticky left-0 z-[1] bg-inherit px-4 py-3 text-sm font-semibold text-slate-800">
                  {module}
                </td>
                {roles.map((role) =>
                  actions.map((action) => {
                    const isAdminRole = role === "Administrator";
                    const checked = isAdminRole
                      ? true
                      : Boolean(matrix?.[role]?.[module]?.[action]);
                    const disabled = !isAdmin || isAdminRole;
                    return (
                      <td key={`${module}-${role}-${action}`} className="border-l border-slate-100 px-2 py-2 text-center">
                        <button
                          type="button"
                          aria-label={`${role} ${action} ${module}`}
                          onClick={() => toggle(role, module, action)}
                          disabled={disabled}
                          className={clsx(
                            "mx-auto flex h-7 w-7 items-center justify-center rounded-lg border text-[10px] font-bold uppercase tracking-wider transition",
                            checked
                              ? "border-transparent bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/30"
                              : "border-slate-200 bg-white text-slate-300 hover:border-slate-300",
                            disabled ? "cursor-not-allowed opacity-80" : "cursor-pointer hover:-translate-y-0.5"
                          )}
                        >
                          {checked ? "✓" : "—"}
                        </button>
                      </td>
                    );
                  })
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
        Turning off <strong className="mx-1">View</strong> automatically disables Edit and Delete.
        Turning on <strong className="mx-1">Edit</strong> or <strong className="mx-1">Delete</strong> forces View on.
      </p>
    </Panel>
  );
}
