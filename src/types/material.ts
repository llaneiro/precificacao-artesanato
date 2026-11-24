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
export interface UpdateMaterialInput extends CreateMaterialInput {
  id: number;
}
