import { convertQuantity } from './material';
export interface Product {
  id: number;
  userId: string;
  name: string;
  description: string | null;
  productionMinutes: number;
  photoFilename: string | null;
  createdAt: string;
}

export interface ProductMaterialInput {
  materialId: number;
  quantityUsed: number;
  usageUnit: string;
}

export interface ProductMaterial extends Omit<ProductMaterialInput, 'usageUnit'> {
  usageUnit?: string;
  name: string;
  unit: string;
  costCents: number;
  referenceQuantity: number;
}

export interface ProductAdditionalExpenseInput {
  expenseId: number;
  quantity: number;
}

export interface ProductAdditionalExpense extends ProductAdditionalExpenseInput {
  name: string;
  costCents: number;
}

export interface ProductDetails extends Product {
  additionalExpenses: ProductAdditionalExpense[];
  materials: ProductMaterial[];
}

export interface ProductSummary extends Product {
  additionalCostCents: number;
  materialCount: number;
  materialCostCents: number;
}

export interface CreateProductInput {
  name: string;
  description: string | null;
  productionMinutes: number;
  photoFilename: string | null;
  materials: ProductMaterialInput[];
  additionalExpenses: ProductAdditionalExpenseInput[];
}

export interface UpdateProductInput extends CreateProductInput {
  id: number;
}

// Mantém a precisão intermediária e arredonda somente o custo total.
export function getMaterialCostCents(materials: ProductMaterial[]): number {
  return Math.round(materials.reduce((sum, material) =>
    sum + material.costCents / material.referenceQuantity * convertQuantity(material.quantityUsed, material.usageUnit ?? material.unit, material.unit), 0));
}
