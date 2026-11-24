import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuthContext } from '../contexts/AuthContext';
import * as ProductRepository from '../database/productRepository';
import { CreateProductInput, ProductSummary, UpdateProductInput } from '../types/product';
import { deleteProductPhoto } from '../services/productPhoto';

function validateProduct(input: CreateProductInput): CreateProductInput {
  const name = input.name.trim();
  if (!name) throw new Error('Informe o nome do produto.');
  if (!Number.isSafeInteger(input.productionMinutes) || input.productionMinutes <= 0) {
    throw new Error('Informe um tempo de produção maior que zero.');
  }
  if (input.materials.length === 0) throw new Error('Adicione pelo menos um material.');
  if (new Set(input.materials.map(m => m.materialId)).size !== input.materials.length) {
    throw new Error('Não adicione o mesmo material mais de uma vez.');
  }
  if (input.materials.some(m => !Number.isSafeInteger(m.materialId) || m.materialId <= 0 || !Number.isFinite(m.quantityUsed) || m.quantityUsed <= 0)) {
    throw new Error('Informe uma quantidade válida para todos os materiais.');
  }
  if (new Set(input.additionalExpenses.map(e => e.expenseId)).size !== input.additionalExpenses.length ||
      input.additionalExpenses.some(e => !Number.isSafeInteger(e.expenseId) || e.expenseId <= 0 || !Number.isSafeInteger(e.quantity) || e.quantity <= 0)) {
    throw new Error('Informe quantidades inteiras positivas para as despesas adicionais, sem duplicatas.');
  }
  return { ...input, name, description: input.description?.trim() || null };
}

export function useProducts(loadOnFocus = true) {
  const { user } = useAuthContext();
  const userId = user?.uid;
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(loadOnFocus);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    if (!userId) { setProducts([]); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      setProducts(await ProductRepository.getProducts(userId));
    } catch {
      setError('Não foi possível carregar os produtos.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => {
    if (loadOnFocus) void loadProducts();
  }, [loadProducts, loadOnFocus]));

  const getProductById = useCallback(
    (id: number) => userId ? ProductRepository.getProductById(userId, id) : Promise.resolve(null),
    [userId],
  );
  const addProduct = useCallback(async (input: CreateProductInput) => {
    if (!userId) throw new Error('Faça login para cadastrar produtos.');
    await ProductRepository.createProduct(userId, validateProduct(input));
    if (loadOnFocus) await loadProducts();
  }, [userId, loadOnFocus, loadProducts]);

  const editProduct = useCallback(async (input: UpdateProductInput) => {
    if (!userId) throw new Error('Faça login para editar produtos.');
    const old = await ProductRepository.getProductById(userId, input.id);
    if (!old) throw new Error('Produto não encontrado.');
    await ProductRepository.updateProduct(userId, { ...validateProduct(input), id: input.id });
    if (old.photoFilename !== input.photoFilename) deleteProductPhoto(old.photoFilename);
    if (loadOnFocus) await loadProducts();
  }, [userId, loadOnFocus, loadProducts]);

  const removeProduct = useCallback(async (id: number) => {
    if (!userId) throw new Error('Faça login para excluir produtos.');
    const old = await ProductRepository.getProductById(userId, id);
    if (!old) throw new Error('Produto não encontrado.');
    await ProductRepository.deleteProduct(userId, id);
    deleteProductPhoto(old.photoFilename);
    if (loadOnFocus) await loadProducts();
  }, [userId, loadOnFocus, loadProducts]);

  return { products, loading, error, loadProducts, getProductById, addProduct, editProduct, removeProduct };
}
