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
}

export interface ProductMaterial extends ProductMaterialInput {
  name: string;
  unit: string;
  costCents: number;
  referenceQuantity: number;
}

export interface ProductDetails extends Product {
  materials: ProductMaterial[];
}

export interface ProductSummary extends Product {
  materialCount: number;
  materialCostCents: number;
}

export interface CreateProductInput {
  name: string;
  description: string | null;
  productionMinutes: number;
  photoFilename: string | null;
  materials: ProductMaterialInput[];
}

export interface UpdateProductInput extends CreateProductInput {
  id: number;
}

// Mantém a precisão intermediária e arredonda somente o custo total.
export function getMaterialCostCents(materials: ProductMaterial[]): number {
  return Math.round(materials.reduce((sum, material) =>
    sum + material.costCents / material.referenceQuantity * material.quantityUsed, 0));
}
