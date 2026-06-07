"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Member, PermissionAction, Permissions } from "./types";

export type Can = (module: string, action?: PermissionAction) => boolean;

/**
 * Builds a permission checker for the current member. Administrators and the
 * workspace owner always pass. If there's no member context yet (e.g. before
 * bootstrap resolves) we fail open so the UI doesn't flash-hide everything —
 * the backend is the authoritative gate.
 */
export function makeCan(currentMember: Member | null, permissions: Permissions | null): Can {
  const role = currentMember?.role;
  const isAdmin = role === "Administrator" || Boolean(currentMember?.isOwner);
  return (module, action = "read") => {
    if (isAdmin) return true;
    if (!role) return true;
    const cell = permissions?.matrix?.[role]?.[module];
    return Boolean(cell?.[action]);
  };
}

const PermissionContext = createContext<Can>(() => true);

export function PermissionProvider({
  currentMember,
  permissions,
  children
}: {
  currentMember: Member | null;
  permissions: Permissions | null;
  children: ReactNode;
}) {
  const can = useMemo(() => makeCan(currentMember, permissions), [currentMember, permissions]);
  return <PermissionContext.Provider value={can}>{children}</PermissionContext.Provider>;
}

export function useCan(): Can {
  return useContext(PermissionContext);
}
