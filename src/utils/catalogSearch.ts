export type CatalogSort = 'recent' | 'name';
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');

export function filterCatalog<T extends { id: number; name: string }>(products: T[], search: string, sort: CatalogSort): T[] {
  const terms = normalize(search).trim().split(/\s+/).filter(Boolean);
  const result = products.filter(product => {
    const name = normalize(product.name);
    return terms.every(term => name.includes(term));
  });
  // O repositório já retorna os produtos em ordem decrescente de criação.
  if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }) || b.id - a.id);
  return result;
}
