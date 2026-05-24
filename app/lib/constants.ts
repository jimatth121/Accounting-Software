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
  { label: "Dashboard", icon: "▦" },
  { label: "Company", icon: "◈" },
  { label: "Customers", icon: "◉" },
  { label: "Vendors", icon: "◎" },
  { label: "Invoices", icon: "▤" },
  { label: "Expenses", icon: "▽" },
  { label: "Payments", icon: "₦" },
  { label: "Inventory", icon: "▣" },
  { label: "Reports", icon: "◍" },
  { label: "AI Assistant", icon: "✦" }
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
  dashboard: null,
  reports: null,
  anomalies: []
};
