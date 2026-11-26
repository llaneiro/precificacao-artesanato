import { getDatabase } from './database';
import type { PricingHistorySummary, PricingHistoryRecord, PricingSnapshot } from '../types/pricingHistory';

const SUMMARY = 'id, productId, productName, mode, totalCostCents, salePriceCents, profitCents, createdAt';

export async function createPricingHistory(userId: string, snapshot: PricingSnapshot): Promise<number> {
  const db = await getDatabase();
  const primary = snapshot.scenarios[0];
  const result = await db.runAsync(`
    INSERT INTO pricing_history (userId, productId, productName, mode, totalCostCents, salePriceCents, profitCents, createdAt, snapshot)
    SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?
    WHERE EXISTS (SELECT 1 FROM products WHERE id = ? AND userId = ?)
  `, userId, snapshot.productId, snapshot.productName, snapshot.mode, snapshot.costs.total, primary.salePriceCents,
    primary.profitCents, new Date().toISOString(), JSON.stringify(snapshot), snapshot.productId, userId);
  if (!result.changes) throw new Error('Produto não encontrado.');
  return result.lastInsertRowId;
}

export async function getPricingHistory(userId: string, productId?: number, includeSavedMargin = false): Promise<PricingHistorySummary[]> {
  const db = await getDatabase();
  // Lê somente os campos necessários do snapshot, sem recalcular margens antigas.
  const metadata = includeSavedMargin
    ? ", CASE WHEN json_valid(snapshot) THEN json_extract(snapshot, '$.version') END AS formulaVersion, CASE WHEN json_valid(snapshot) THEN json_extract(snapshot, '$.scenarios[0].marginPercent') END AS savedMarginPercent"
    : '';
  const query = 'SELECT ' + SUMMARY + metadata + ' FROM pricing_history WHERE userId = ?';
  const order = ' ORDER BY createdAt DESC, id DESC';
  return productId === undefined
    ? db.getAllAsync<PricingHistorySummary>(query + order, userId)
    : db.getAllAsync<PricingHistorySummary>(query + ' AND productId = ?' + order, userId, productId);
}

export async function getPricingHistoryById(userId: string, id: number): Promise<PricingHistoryRecord | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<PricingHistorySummary & { snapshot: string }>(
    'SELECT ' + SUMMARY + ', snapshot FROM pricing_history WHERE id = ? AND userId = ?', id, userId);
  if (!row) return null;
  const snapshot = JSON.parse(row.snapshot) as PricingSnapshot;
  if (!snapshot || (snapshot.version !== 1 && snapshot.version !== 2) || !snapshot.scenarios?.length) throw new Error('Registro histórico incompatível.');
  return { ...row, snapshot };
}

export async function deletePricingHistory(userId: string, id: number): Promise<void> {
  const db = await getDatabase();
  const result = await db.runAsync('DELETE FROM pricing_history WHERE id = ? AND userId = ?', id, userId);
  if (!result.changes) throw new Error('Registro não encontrado.');
}
