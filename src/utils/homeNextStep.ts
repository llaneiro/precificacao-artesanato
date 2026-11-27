type HomeProgress = {
  pending: readonly string[];
  materialCount: number;
  productCount: number;
};

export type HomeNextStep = 'unknown' | 'costs' | 'materials' | 'product' | 'pricing';

export function homeNextStep(data: HomeProgress | null): HomeNextStep {
  if (!data) return 'unknown';
  if (data.pending.length) return 'costs';
  if (!data.materialCount) return 'materials';
  if (!data.productCount) return 'product';
  return 'pricing';
}
