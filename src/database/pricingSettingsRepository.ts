import { getDatabase } from './database';
import { LaborSettings, PricingSettings, SalesFees } from '../types/pricingSettings';

export async function getPricingSettings(userId: string): Promise<PricingSettings | null> {
  const db = await getDatabase();
  return db.getFirstAsync<PricingSettings>('SELECT * FROM pricing_settings WHERE userId = ?', userId);
}

export async function saveLaborSettings(userId: string, input: LaborSettings): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`
    INSERT INTO pricing_settings (userId, laborMode, productiveHours, hourlyCostCents, monthlyIncomeCents)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(userId) DO UPDATE SET laborMode=excluded.laborMode,
      productiveHours=excluded.productiveHours, hourlyCostCents=excluded.hourlyCostCents,
      monthlyIncomeCents=excluded.monthlyIncomeCents
  `, userId, input.laborMode, input.productiveHours, input.hourlyCostCents, input.monthlyIncomeCents);
}

export async function saveSalesFees(userId: string, input: SalesFees): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`
    INSERT INTO pricing_settings (userId, debitBps, creditBps, pixBps) VALUES (?, ?, ?, ?)
    ON CONFLICT(userId) DO UPDATE SET debitBps=excluded.debitBps, creditBps=excluded.creditBps, pixBps=excluded.pixBps
  `, userId, input.debitBps, input.creditBps, input.pixBps);
}
