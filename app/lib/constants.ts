import {
  Banknote,
  BookOpen,
  Building2,
  FileText,
  LayoutDashboard,
  Package,
  ReceiptText,
  PieChart,
  Sparkles,
  Truck,
  Users
} from "lucide-react";
import type { AppData, NavItem } from "./types";

export const CHART_COLORS = [
  "#6366f1",
  "#06b6d4",
  "#f59e0b",
  "#ef4444",
  "#10b981",
  "#a855f7",
  "#ec4899",
  "#0ea5e9"
];

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Inventory", icon: Package },
  { label: "Company", icon: Building2 },
  { label: "Customers", icon: Users },
  { label: "Vendors", icon: Truck },
  { label: "Invoices", icon: FileText },
  { label: "Expenses", icon: ReceiptText },
  { label: "Payments", icon: Banknote },
  { label: "Ledger", icon: BookOpen },
  { label: "Reports", icon: PieChart },
  { label: "AI Assistant", icon: Sparkles }
];

export const PAYMENT_METHODS = [
  "Bank transfer",
  "Cash",
  "Card",
  "POS",
  "Mobile money",
  "Paystack",
  "Flutterwave",
  "Stripe",
  "Other"
];

export const INVENTORY_CATEGORIES = [
  "General",
  "Electronics",
  "Apparel",
  "Food",
  "Office",
  "Services",
  "Other"
];

export const EMPTY_STATE: AppData = {
  company: null,
  customers: [],
  vendors: [],
  invoices: [],
  expenses: [],
  payments: [],
  accounts: [],
  inventory: [],
  preferences: null,
  members: [],
  permissions: null,
  currentMember: null,
  workspaceUserId: null,
  dashboard: null,
  reports: null,
  anomalies: []
};

export const ROLES = ["Administrator", "Accountant", "Member", "Viewer"];
export const PERMISSION_ACTIONS: ("read" | "write" | "delete")[] = ["read", "write", "delete"];

export const DEFAULT_PREFERENCES = {
  notifications: {
    invoiceReminders: true,
    paymentReceived: true,
    overdueAlerts: true,
    weeklyDigest: false,
    productUpdates: false,
    emailMarketing: false
  },
  theme: "light",
  language: "English",
  dateFormat: "DD MMM YYYY",
  autoBackup: true
};
