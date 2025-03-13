export interface InventoryAnalyticsData {
  totalItems: number;
  totalValue: number;
  stockByCategory: {
    category: string;
    quantity: number;
    value: number;
  }[];
  lowStockProducts: {
    id: string;
    name: string;
    quantity: number;
    minQuantity: number;
    price: number;
  }[];
}

export interface StaffPerformanceData {
  totalStaff: number;
  totalSales: number;
  averageSalesPerEmployee: number;
  bestPerformer: {
    name: string;
    sales: number;
    transactions: number;
  };
  staffStats: {
    id: string;
    name: string;
    position: string;
    sales: number;
    transactions: number;
    averageCheck: number;
    returns: number;
    workingHours: number;
    efficiency: number;
  }[];
  salesByHour: {
    hour: number;
    sales: number;
    transactions: number;
  }[];
}

export interface SalesAnalyticsData {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  salesByDay: {
    date: string;
    amount: number;
    type: string;
  }[];
  salesByCategory: {
    category: string;
    amount: number;
  }[];
  topProducts: {
    id: string;
    name: string;
    quantity: number;
    revenue: number;
  }[];
}

export interface FinancialMetricsData {
  totalRevenue: number;
  totalProfit: number;
  averageMargin: number;
  revenueGrowth: number;
  profitGrowth: number;
  expensesByCategory: {
    category: string;
    amount: number;
  }[];
  dailyMetrics: {
    date: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
  topProducts: {
    id: string;
    name: string;
    revenue: number;
    profit: number;
    margin: number;
    quantity: number;
  }[];
}
