import { getDatabase } from './database';
import { getProducts, getProductById } from './productRepository';
import { getPricingSettings } from './pricingSettingsRepository';
import { getExpenses } from './expenseRepository';
import { getPricingHistory, getPricingHistoryById } from './pricingHistoryRepository';
import type { Material } from '../types/material';
import { REVIEW_INTERVALS, type ReviewInterval, daysSince, financialPending, pricingReviewReasons } from '../utils/dashboard';

export async function getReviewInterval(userId: string): Promise<ReviewInterval> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ reviewDays: ReviewInterval }>('SELECT reviewDays FROM dashboard_settings WHERE userId = ?', userId);
  return row && REVIEW_INTERVALS.includes(row.reviewDays) ? row.reviewDays : 30;
}

export async function saveReviewInterval(userId: string, days: ReviewInterval) {
  if (!REVIEW_INTERVALS.includes(days)) throw new Error('Intervalo inválido.');
  const db = await getDatabase();
  await db.runAsync('INSERT INTO dashboard_settings (userId, reviewDays) VALUES (?, ?) ON CONFLICT(userId) DO UPDATE SET reviewDays=excluded.reviewDays', userId, days);
}

export async function getDashboard(userId: string) {
  const db = await getDatabase();
  const [interval, materials, products, settings, expenses, history] = await Promise.all([
    getReviewInterval(userId),
    db.getAllAsync<Material & { lastReview: string | null }>(`
      SELECT m.*, (SELECT h.recordedAt FROM material_cost_history h WHERE h.userId=m.userId AND h.materialId=m.id
        AND h.kind IN ('created','changed') ORDER BY h.id DESC LIMIT 1) AS lastReview
      FROM materials m WHERE m.userId=? ORDER BY m.name
    `, userId),
    getProducts(userId), getPricingSettings(userId), getExpenses(userId), getPricingHistory(userId),
  ]);
  const now = Date.now();
  const materialReviews = materials.map(m => ({ ...m, days: daysSince(m.lastReview, now) }))
    .filter(m => m.days === null || m.days >= interval)
    .sort((a,b) => (b.days ?? Infinity) - (a.days ?? Infinity));
  const latest = new Map<number, typeof history[number]>();
  for (const item of history) if (!latest.has(item.productId)) latest.set(item.productId, item);
  const productReviews: { id: number; name: string; reasons: string[] }[] = [];
  const unpriced: { id: number; name: string }[] = [];
  for (const p of products) {
    const previous = latest.get(p.id);
    if (!previous) { unpriced.push({ id:p.id, name:p.name }); continue; }
    const [product, record] = await Promise.all([getProductById(userId,p.id),getPricingHistoryById(userId,previous.id)]);
    if (!product || !record) continue;
    const reasons = pricingReviewReasons(product, record.snapshot, settings, expenses);
    if (reasons.length) productReviews.push({ id:p.id, name:p.name, reasons });
  }
  return { interval, materialCount: materials.length, productCount: products.length, materialReviews, productReviews, unpriced,
    pending: financialPending(settings, expenses), recent: history.slice(0, 3), products };
}
export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;
