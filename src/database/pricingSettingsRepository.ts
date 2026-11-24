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
    INSERT INTO pricing_settings (userId, debitBps, creditBps, pixBps, debitUnused, creditUnused, pixUnused)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(userId) DO UPDATE SET debitBps=excluded.debitBps, creditBps=excluded.creditBps, pixBps=excluded.pixBps,
      debitUnused=excluded.debitUnused, creditUnused=excluded.creditUnused, pixUnused=excluded.pixUnused
  `, userId, input.debitBps, input.creditBps, input.pixBps, input.debitUnused, input.creditUnused, input.pixUnused);
}

export async function saveProfitMargin(userId: string, marginBps: number | null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`
    INSERT INTO pricing_settings (userId, marginBps) VALUES (?, ?)
    ON CONFLICT(userId) DO UPDATE SET marginBps=excluded.marginBps
  `, userId, marginBps);
}

export async function saveNoFixedExpenses(userId: string, confirmed: boolean): Promise<void> {
  const db = await getDatabase();
  const result = await db.runAsync(`
    INSERT INTO pricing_settings (userId, noFixedExpenses)
    SELECT ?, ? WHERE ? = 0 OR NOT EXISTS (SELECT 1 FROM fixed_expenses WHERE userId = ?)
    ON CONFLICT(userId) DO UPDATE SET noFixedExpenses=excluded.noFixedExpenses
  `, userId, confirmed ? 1 : 0, confirmed ? 1 : 0, userId);
  if (!result.changes) throw new Error('Existem despesas fixas cadastradas.');
}
