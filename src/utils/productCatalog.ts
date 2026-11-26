import type { ProductSummary } from '../types/product';

import { filterCatalog, type CatalogSort } from './catalogSearch';
export type { CatalogSort } from './catalogSearch';

export function filterProducts(products: ProductSummary[], search: string, sort: CatalogSort): ProductSummary[] {
  return filterCatalog(products, search, sort);
}

export function formatProductionDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return [hours ? hours + 'h' : '', remainder ? remainder + 'min' : ''].filter(Boolean).join(' ') || '0min';
}
