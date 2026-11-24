import type { ProductAdditionalExpense, ProductMaterial } from './product';
import type { PaymentMethod, LaborMode } from './pricingSettings';

export type PricingMode = 'suggested' | 'manual';
export type ManualPayment = PaymentMethod | 'noFee';

export interface PricingScenario {
  key: ManualPayment;
  name: string;
  feeBps: number;
  salePriceCents: number;
  feeCents: number;
  netCents: number;
  profitCents: number;
  marginPercent: number | null;
  minimumPriceCents: number | null;
}

export interface PricingSnapshot {
  version: 1 | 2;
  productId: number;
  productName: string;
  productionMinutes: number;
  mode: PricingMode;
  targetMarginBps: number | null;
  costs: { materials: number; additional: number; labor: number; fixed: number; total: number };
  materials: ProductMaterial[];
  additionalExpenses: ProductAdditionalExpense[];
  financial: {
    laborMode: LaborMode | null;
    productiveHours: number | null;
    hourlyCostCents: number | null;
    monthlyIncomeCents: number | null;
    monthlyFixedCents: number;
    fixedExpenses: { id: number; name: string; monthlyCostCents: number }[];
    noFixedExpenses: boolean;
  };
  scenarios: PricingScenario[];
  unavailablePayments: { key: PaymentMethod; name: string; reason: 'missingFee' | 'incompatible' | 'outOfRange' | 'incomplete' }[];
}

export interface PricingHistorySummary {
  id: number;
  productId: number;
  productName: string;
  mode: PricingMode;
  totalCostCents: number;
  salePriceCents: number;
  profitCents: number;
  createdAt: string;
}

export interface PricingHistoryRecord extends PricingHistorySummary {
  snapshot: PricingSnapshot;
}
