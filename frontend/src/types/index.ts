// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
}

// ─── Perfumes ─────────────────────────────────────────────────────────────────

export type PerfumeStatus = "active" | "archived" | "out_of_stock";
export type Concentration = "EDP" | "EDT" | "EXP" | "EDC" | "PC";

export interface Perfume {
  id: string;
  name: string;
  brand: string;
  category?: string;
  description?: string;
  concentration?: Concentration;
  status: PerfumeStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── Bottles ──────────────────────────────────────────────────────────────────

export type BottleStatus = "open" | "low_stock" | "empty" | "archived" | "damaged";

export interface Bottle {
  id: string;
  perfumeId: string;
  perfume?: Perfume;
  batchCode?: string;
  purchasePrice: number;
  initialMl: number;
  calculatedRemainingMl: number;
  realRemainingMl: number;
  status: BottleStatus;
  supplierId?: string;
  createdAt: string;
}

// ─── Batches ──────────────────────────────────────────────────────────────────

export interface PerfumeBatch {
  id: string;
  perfumeId: string;
  batchCode: string;
  purchasePrice: number;
  purchaseDate: string;
  supplierId?: string;
  notes?: string;
}

// ─── Prices ───────────────────────────────────────────────────────────────────

export interface PerfumePrice {
  id: string;
  perfumeId: string;
  ml: number;
  price: number;
  isFullBottle: boolean;
}

// ─── Customers ────────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  instagram?: string;
  notes?: string;
  isVip: boolean;
  totalDebt: number;
  createdAt: string;
}

// ─── Sales ────────────────────────────────────────────────────────────────────

export type PaymentMethod = "cash" | "transfer" | "card" | "credit";
export type SaleStatus = "paid" | "credit" | "partial";

export interface Sale {
  id: string;
  customerId?: string;
  customer?: Customer;
  total: number;
  paid: number;
  status: SaleStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
  items?: SaleItem[];
}

export interface SaleItem {
  id: string;
  saleId: string;
  bottleId: string;
  perfumeId: string;
  perfume?: Perfume;
  ml: number;
  price: number;
  perfumeCost: number;
  suppliesCost: number;
  estimatedProfit: number;
  realProfit: number;
  isGift: boolean;
}

// ─── Credits ──────────────────────────────────────────────────────────────────

export type CreditRisk = "low" | "medium" | "high";

export interface Credit {
  id: string;
  customerId: string;
  customer?: Customer;
  saleId: string;
  total: number;
  paid: number;
  pending: number;
  risk: CreditRisk;
  dueDate?: string;
  lastPaymentAt?: string;
  createdAt: string;
}

export interface CreditPayment {
  id: string;
  creditId: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  notes?: string;
}

// ─── Supplies ─────────────────────────────────────────────────────────────────

export type SupplyCategory = "bottles" | "bags" | "stickers" | "labels" | "boxes" | "ribbons" | "paper" | "other";

export interface Supply {
  id: string;
  name: string;
  category: SupplyCategory;
  stock: number;
  minStock: number;
  unit: string;
  costPerUnit: number;
  createdAt: string;
}

// ─── Movements ────────────────────────────────────────────────────────────────

export type MovementType = "sale" | "gift" | "sample" | "loss" | "adjustment" | "purchase";

export interface PerfumeMovement {
  id: string;
  bottleId: string;
  perfumeId: string;
  perfume?: Perfume;
  type: MovementType;
  ml: number;
  reason?: string;
  notes?: string;
  createdAt: string;
}

// ─── Cash / Finance ───────────────────────────────────────────────────────────

export interface CashSummary {
  totalSalesCollected: number;
  totalCreditPayments: number;
  totalContributions: number;
  totalExpenses: number;
  totalPurchases: number;
  totalWithdrawals: number;
  balance: number;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  notes?: string;
  createdAt: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  salesToday: number;
  salesWeek: number;
  salesMonth: number;
  cashBalance: number;
  estimatedProfit: number;
  realProfit: number;
  pendingCredits: number;
  inventoryValue: number;
  mlLost: number;
  totalGifted: number;
  topPerfume: string;
  mostSoldPerfume: string;
  avgRoi: number;
}

// ─── Profitability ────────────────────────────────────────────────────────────

export interface PerfumeProfitability {
  perfumeId: string;
  perfume: Perfume;
  investment: number;
  sales: number;
  roi: number;
  margin: number;
  mlSold: number;
  mlLost: number;
  profit: number;
  lastSaleAt?: string;
  daysSinceLastSale?: number;
  isDead: boolean;
}
