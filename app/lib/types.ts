import type { LucideIcon } from "lucide-react";

export interface Company {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  defaultCurrency?: string;
  taxId?: string;
  fiscalYearStartMonth?: string;
}

export interface Party {
  id: string;
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  notes?: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  discountAmount?: number;
  inventoryId?: string | null;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  issueDate?: string;
  dueDate?: string;
  totalAmount: number;
  balanceDue: number;
  currency?: string;
  status: string;
  items?: InvoiceLineItem[];
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  amountPaid?: number;
  notes?: string;
  terms?: string;
}

export interface Expense {
  id: string;
  vendorId?: string;
  vendorName?: string;
  expenseDate?: string;
  amount: number;
  taxAmount?: number;
  currency?: string;
  category?: string;
  paymentMethod?: string;
  description?: string;
  status?: string;
}

export interface Payment {
  id: string;
  paymentType: "incoming" | "outgoing";
  invoiceId?: string;
  amount: number;
  currency?: string;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  paymentDate?: string;
  createdAt?: string;
}

export interface Account {
  id?: string;
  code: string;
  name: string;
  type: string;
}

export interface Anomaly {
  id: string;
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
}

export interface DashboardSummary {
  totalRevenue?: number;
  totalExpenses?: number;
  netProfit?: number;
  outstandingInvoices?: number;
  cashReceived?: number;
  overdueInvoices?: number;
  recentInvoices?: Invoice[];
  topExpenseCategories?: { name: string; amount: number }[];
}

export interface Reports {
  profitAndLoss?: {
    income: number;
    expenses: number;
    netProfit: number;
  };
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  unitCost: number;
  unitPrice: number;
}

export interface NotificationPrefs {
  invoiceReminders: boolean;
  paymentReceived: boolean;
  overdueAlerts: boolean;
  weeklyDigest: boolean;
  productUpdates: boolean;
  emailMarketing: boolean;
}

export interface Preferences {
  notifications: NotificationPrefs;
  theme: string;
  language: string;
  dateFormat: string;
  autoBackup: boolean;
}

export type Role = "Administrator" | "Accountant" | "Member" | "Viewer";

export type PermissionAction = "read" | "write" | "delete";

export interface PermissionCell {
  read: boolean;
  write: boolean;
  delete: boolean;
}

export type PermissionMatrix = Record<string, Record<string, PermissionCell>>;

export interface Permissions {
  roles: string[];
  modules: string[];
  actions: PermissionAction[];
  matrix: PermissionMatrix;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: Role | string;
  status: "active" | "pending" | "suspended" | string;
  clerkUserId?: string;
  isOwner?: boolean;
  invitedAt?: string;
  joinedAt?: string | null;
  clerkInvitationId?: string | null;
  inviteEmailSent?: boolean;
  inviteUrl?: string;
}

export interface InvitationResult {
  member: Member;
  invitation: {
    mode: "clerk" | "manual" | "already_exists" | "noop";
    emailSent: boolean;
    status: string;
    url: string;
    errorCode: string | null;
    error: string | null;
  };
  clerkConfigured: boolean;
}

export interface AppData {
  company: Company | null;
  customers: Party[];
  vendors: Party[];
  invoices: Invoice[];
  expenses: Expense[];
  payments: Payment[];
  accounts: Account[];
  inventory: InventoryItem[];
  preferences: Preferences | null;
  members: Member[];
  permissions: Permissions | null;
  currentMember: Member | null;
  workspaceUserId: string | null;
  dashboard: DashboardSummary | null;
  reports: Reports | null;
  anomalies: Anomaly[];
}

export interface LedgerEntry {
  id: string;
  transactionId: string;
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  runningBalance: number;
}

export interface LedgerSummary {
  totalDebits: number;
  totalCredits: number;
  netChange: number;
  entryCount: number;
}

export interface LedgerResponse {
  entries: LedgerEntry[];
  summary: LedgerSummary;
}

export type NavLabel =
  | "Dashboard"
  | "Company"
  | "Customers"
  | "Vendors"
  | "Invoices"
  | "Expenses"
  | "Payments"
  | "Inventory"
  | "Ledger"
  | "Reports"
  | "AI Assistant"
  | "Settings";

export interface NavItem {
  label: NavLabel;
  icon: LucideIcon;
}

export interface Column<T> {
  key: string;
  label: string;
  align?: "left" | "right";
  render?: (row: T) => React.ReactNode;
}
