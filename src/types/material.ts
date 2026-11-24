// Unidades disponíveis no formulário.
export const MATERIAL_UNITS = [
  { value: 'g', label: 'Gramas (g)' },
  { value: 'kg', label: 'Quilos (kg)' },
  { value: 'm', label: 'Metros (m)' },
  { value: 'cm', label: 'Centímetros (cm)' },
  { value: 'un', label: 'Unidades (un)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'l', label: 'Litros (L)' },
] as const;

export type MaterialUnit = (typeof MATERIAL_UNITS)[number]['value'];

export function isMaterialUnit(value: string): value is MaterialUnit {
  return MATERIAL_UNITS.some(unit => unit.value === value);
}

export const MEASURE_CATEGORIES = [
  { id: 'weight', label: 'Peso', icon: 'scale-outline', units: ['g', 'kg'] },
  { id: 'length', label: 'Comprimento', icon: 'resize-outline', units: ['cm', 'm'] },
  { id: 'volume', label: 'Volume', icon: 'water-outline', units: ['ml', 'l'] },
  { id: 'count', label: 'Unidades', icon: 'cube-outline', units: ['un'] },
] as const;
export type MeasureCategory = typeof MEASURE_CATEGORIES[number]['id'];
export function measureCategory(unit: string): MeasureCategory | undefined {
  return MEASURE_CATEGORIES.find(c => (c.units as readonly string[]).includes(unit))?.id;
}
export function compatibleUnits(unit: string): readonly MaterialUnit[] {
  return MEASURE_CATEGORIES.find(c => c.id === measureCategory(unit))?.units ?? [];
}
export function convertQuantity(quantity: number, from: string, to: string): number {
  const category = measureCategory(from);
  if (!category || category !== measureCategory(to) || !Number.isFinite(quantity) || quantity <= 0) return NaN;
  const factors: Record<string, number> = { g: 1, kg: 1000, cm: 1, m: 100, ml: 1, l: 1000, un: 1 };
  return quantity * (factors[from] / factors[to]);
}

// Representa um material armazenado no SQLite.
export interface Material {
  id: number;
  userId: string;
  name: string;
  costCents: number; // Preço correspondente à quantidade de referência, em centavos.
  quantity: number; // Quantidade de material correspondente ao preço.
  unit: string;
  createdAt: string; // Formato ISO 8601.
}

// Dados necessários para cadastrar um material.
export interface CreateMaterialInput {
  name: string;
  costCents: number;
  quantity: number;
  unit: MaterialUnit;
}

// Dados necessários para editar um material.
export interface UpdateMaterialInput {
  id: number;
  name: string;
}

export interface UpdateMaterialPriceInput {
  id: number;
  costCents: number;
  quantity: number;
  unit: MaterialUnit;
}
