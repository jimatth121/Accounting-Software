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

export interface AppData {
  company: Company | null;
  customers: Party[];
  vendors: Party[];
  invoices: Invoice[];
  expenses: Expense[];
  payments: Payment[];
  accounts: Account[];
  dashboard: DashboardSummary | null;
  reports: Reports | null;
  anomalies: Anomaly[];
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
  | "Reports"
  | "AI Assistant"
  | "Settings";

export interface NavItem {
  label: NavLabel;
  icon: string;
}

export interface Column<T> {
  key: string;
  label: string;
  align?: "left" | "right";
  render?: (row: T) => React.ReactNode;
}
