export interface MaterialCostHistoryRecord {
  id: number;
  materialId: number;
  materialName: string;
  kind: 'baseline' | 'created' | 'changed';
  costCents: number;
  quantity: number;
  unit: string;
  previousCostCents: number | null;
  previousQuantity: number | null;
  previousUnit: string | null;
  recordedAt: string;
}
