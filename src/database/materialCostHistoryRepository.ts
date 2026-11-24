import { getDatabase } from './database';
import type { MaterialCostHistoryRecord } from '../types/materialCostHistory';

export async function getMaterialCostHistory(userId: string, materialId: number): Promise<MaterialCostHistoryRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<MaterialCostHistoryRecord>(
    'SELECT * FROM material_cost_history WHERE userId = ? AND materialId = ? ORDER BY id DESC',
    userId, materialId,
  );
}
