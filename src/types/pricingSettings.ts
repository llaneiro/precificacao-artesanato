export type LaborMode = 'hourly' | 'monthly';
export interface LaborSettings {
  laborMode: LaborMode;
  productiveHours: number;
  hourlyCostCents: number | null;
  monthlyIncomeCents: number | null;
}
export interface SalesFees {
  debitBps: number | null;
  creditBps: number | null;
  pixBps: number | null;
}
export interface PricingSettings extends SalesFees {
  userId: string;
  laborMode: LaborMode | null;
  productiveHours: number | null;
  hourlyCostCents: number | null;
  monthlyIncomeCents: number | null;
}
export function hourlyRate(settings: Pick<PricingSettings, 'laborMode' | 'productiveHours' | 'hourlyCostCents' | 'monthlyIncomeCents'>): number | null {
  if (settings.laborMode === 'hourly') return settings.hourlyCostCents;
  if (settings.laborMode === 'monthly' && settings.productiveHours && settings.monthlyIncomeCents !== null) {
    return settings.monthlyIncomeCents / settings.productiveHours;
  }
  return null;
}
