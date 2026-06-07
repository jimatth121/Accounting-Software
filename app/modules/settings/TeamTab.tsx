"use client";

import { useState } from "react";
import { Copy, Crown, Mail, RefreshCw, Send, ShieldCheck, UserPlus } from "lucide-react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Input } from "@/components/forms/Input";
import { Panel } from "@/components/Panel";
import { Select } from "@/components/forms/Select";
import { api } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { toast } from "@/lib/toast";
import type { InvitationResult, Member } from "@/lib/types";
import { clsx, formatDate } from "@/lib/utils";

interface TeamTabProps {
  members: Member[];
  currentMember: Member | null;
  reload: () => void;
}

const ROLE_TONE: Record<string, { dot: string; pill: string }> = {
  Administrator: { dot: "bg-fuchsia-500", pill: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200" },
  Accountant: { dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Member: { dot: "bg-brand-500", pill: "bg-brand-50 text-brand-700 border-brand-200" },
  Viewer: { dot: "bg-slate-400", pill: "bg-slate-50 text-slate-600 border-slate-200" }
};

async function copy(value: string, label: string) {
  if (!value) {
    toast.warning("Nothing to copy", "No sign-up URL is available yet.");
    return;
  }
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied to clipboard`);
  } catch {
    toast.error("Copy failed", "Try selecting the URL manually instead.");
  }
}

export function TeamTab({ members, currentMember, reload }: TeamTabProps) {
  const isAdmin = currentMember?.role === "Administrator";
  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "Member" });
  const [inviteBusy, setInviteBusy] = useState(false);
  const [busyRow, setBusyRow] = useState<string>("");

  async function invite(event: React.FormEvent) {
    event.preventDefault();
    setInviteBusy(true);
    try {
      const result = await api<InvitationResult>("/api/members", {
        method: "POST",
        body: JSON.stringify(form),
        silent: true
      });
      const { invitation } = result;
      if (invitation.emailSent) {
        toast.success(
          "Invitation email sent",
          `${form.email} will receive a sign-up link from Clerk.`
        );
      } else if (invitation.mode === "already_exists") {
        toast.info(
          "User already has an account",
          "They can just sign in with this email and will land in this workspace."
        );
      } else if (invitation.mode === "manual") {
        toast.warning(
          "Invite recorded — email not sent",
          invitation.errorCode === "no_clerk_secret"
            ? "Add CLERK_SECRET_KEY in the backend env to send emails. Copy the sign-up link from the member card."
            : invitation.error || "Share the sign-up link manually."
        );
      }
      setForm({ name: "", email: "", role: "Member" });
      setInviteOpen(false);
      reload();
    } finally {
      setInviteBusy(false);
    }
  }

  async function resend(member: Member) {
    setBusyRow(`${member.id}:resend`);
    try {
      const result = await api<InvitationResult>(`/api/members/${member.id}/resend`, {
        method: "POST",
        silent: true
      });
      if (result.invitation.emailSent) {
        toast.success("Invitation re-sent", `${member.email} will receive a fresh email.`);
      } else {
        toast.warning(
          "Could not send email",
          result.invitation.error || "Share the sign-up link manually instead."
        );
      }
      reload();
    } finally {
      setBusyRow("");
    }
  }

  async function changeRole(id: string, role: string) {
    setBusyRow(`${id}:role`);
    try {
      await api(`/api/members/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
        successMessage: "Role updated"
      });
      reload();
    } finally {
      setBusyRow("");
    }
  }

  async function remove(member: Member) {
    if (!confirm(`Remove ${member.name || member.email}?`)) return;
    setBusyRow(`${member.id}:delete`);
    try {
      await api(`/api/members/${member.id}`, {
        method: "DELETE",
        successMessage: "Member removed",
        successDetail: member.email
      });
      reload();
    } finally {
      setBusyRow("");
    }
  }

  return (
    <Panel>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Team members</h3>
          <p className="mt-0.5 text-sm text-slate-500">
            Invite people to your workspace. They'll get an email from Clerk and sign in with their own
            account — but every action they take lands in this workspace.
          </p>
        </div>
        {isAdmin ? (
          <Button type="button" onClick={() => setInviteOpen((prev) => !prev)}>
            <UserPlus className="h-4 w-4" />
            {inviteOpen ? "Cancel invite" : "Invite member"}
          </Button>
        ) : (
          <Badge tone="neutral">Read only</Badge>
        )}
      </div>

      {inviteOpen && isAdmin ? (
        <form
          className="mb-5 grid gap-3 rounded-2xl border border-dashed border-brand-300 bg-brand-50/60 p-4 sm:grid-cols-[1fr_1fr_160px_auto]"
          onSubmit={invite}
        >
          <Input label="Full name" value={form.name} onChange={(name) => setForm({ ...form, name })} placeholder="Jane Doe" />
          <Input label="Email" type="email" required value={form.email} onChange={(email) => setForm({ ...form, email })} placeholder="jane@company.com" />
          <Select
            label="Role"
            value={form.role}
            onChange={(role) => setForm({ ...form, role })}
            options={ROLES.filter((role) => role !== "Administrator")}
          />
          <div className="flex items-end">
            <Button type="submit" loading={inviteBusy}>
              <Mail className="h-4 w-4" />
              Send invite
            </Button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-3">
        {members.map((member) => {
          const tone = ROLE_TONE[member.role] || ROLE_TONE.Member;
          const isCurrent = member.id === currentMember?.id;
          const isPending = !member.isOwner && (member.status === "pending" || !member.clerkUserId);
          return (
            <article
              key={member.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-500 text-base font-extrabold text-white shadow-md shadow-brand-500/30">
                    {(member.name || member.email || "?")[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-bold text-slate-900">{member.name || member.email}</p>
                      {member.isOwner ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                          <Crown className="h-3 w-3" />
                          Owner
                        </span>
                      ) : null}
                      {isCurrent ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                          You
                        </span>
                      ) : null}
                      {isPending ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                          Pending
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{member.email}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {member.status === "pending" || !member.clerkUserId
                        ? `Invited ${formatDate(member.invitedAt)} · ${member.inviteEmailSent ? "email delivered" : "no email yet"}`
                        : `Joined ${formatDate(member.joinedAt || member.invitedAt)}`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <span
                    className={clsx(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider",
                      tone.pill
                    )}
                  >
                    <span className={clsx("h-2 w-2 rounded-full", tone.dot)} />
                    {member.role}
                  </span>

                  {isAdmin && !member.isOwner ? (
                    <>
                      <select
                        value={member.role}
                        onChange={(event) => changeRole(member.id, event.target.value)}
                        disabled={busyRow === `${member.id}:role`}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-brand-500"
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                      <Button
                        variant="smallDanger"
                        type="button"
                        onClick={() => remove(member)}
                        loading={busyRow === `${member.id}:delete`}
                      >
                        Remove
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>

              {/* Invitation actions row */}
              {isAdmin && isPending ? (
                <div className="flex flex-col gap-2 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                      {member.inviteEmailSent ? "Invitation email sent" : "Email not delivered"}
                    </p>
                    {member.inviteUrl ? (
                      <p className="mt-0.5 truncate font-mono text-[11px] text-slate-600">{member.inviteUrl}</p>
                    ) : (
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Configure <code>CLERK_SECRET_KEY</code> + <code>FRONTEND_URL</code> on the backend to enable email delivery.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {member.inviteUrl ? (
                      <Button
                        variant="small"
                        type="button"
                        onClick={() => copy(member.inviteUrl || "", "Sign-up link")}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy link
                      </Button>
                    ) : null}
                    <Button
                      variant="small"
                      type="button"
                      onClick={() => resend(member)}
                      loading={busyRow === `${member.id}:resend`}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {member.inviteEmailSent ? "Resend email" : "Try sending email"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <p className="mt-5 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
        Invited members sign in with their own Clerk account using the email shown here. On first sign-in
        they're attached to this workspace with the role you assigned. Make sure your Clerk app allows sign-ups
        (or restricts them to invitations), and set <code className="mx-0.5 rounded bg-white px-1 text-[11px]">CLERK_SECRET_KEY</code>
        + <code className="mx-0.5 rounded bg-white px-1 text-[11px]">FRONTEND_URL</code> on the backend for the email to go out automatically.
      </p>

      <p className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-slate-400">
        <Send className="h-3 w-3" />
        Powered by Clerk Invitations
      </p>
    </Panel>
  );
}
