import type { ProductSummary } from '../types/product';

export type CatalogSort = 'recent' | 'name';
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');

export function filterProducts(products: ProductSummary[], search: string, sort: CatalogSort): ProductSummary[] {
  const terms = normalize(search).trim().split(/\s+/).filter(Boolean);
  const result = products.filter(product => {
    const name = normalize(product.name);
    return terms.every(term => name.includes(term));
  });
  // O repositório já retorna os produtos em ordem decrescente de criação.
  if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }) || b.id - a.id);
  return result;
}

export function formatProductionDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return [hours ? hours + 'h' : '', remainder ? remainder + 'min' : ''].filter(Boolean).join(' ') || '0min';
}
