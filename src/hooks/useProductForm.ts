import { compatibleUnits, convertQuantity } from '../types/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMaterials } from './useMaterials';
import { useAdditionalExpenses } from './useAdditionalExpenses';
import { useProducts } from './useProducts';
import { getMaterialCostCents, ProductMaterial } from '../types/product';
import { deleteProductPhoto, getProductPhotoUri, pickProductPhoto, saveProductPhoto } from '../services/productPhoto';

type SelectedMaterial = { materialId: number; quantity: string; usageUnit: string };
type Fields = { name: string; description: string; hours: string; minutes: string };
const EMPTY_FIELDS: Fields = { name: '', description: '', hours: '', minutes: '' };

function parseQuantity(text: string): number {
  if (!/^\d+(?:[,.]\d+)?$/.test(text.trim())) return NaN;
  const value = Number(text.trim().replace(',', '.'));
  return Number.isFinite(value) && value > 0 ? value : NaN;
}

function parseDuration(hours: string, minutes: string): number {
  if (!/^\d*$/.test(hours.trim()) || !/^\d*$/.test(minutes.trim())) throw new Error('Informe horas e minutos inteiros.');
  const h = Number(hours), m = Number(minutes);
  const total = h * 60 + m;
  if (m >= 60 || !Number.isSafeInteger(total) || total <= 0) throw new Error('Informe um tempo válido (minutos de 0 a 59).');
  return total;
}

export function useProductForm(id?: string) {
  const { materials, loading: materialsLoading, error: materialsError, loadMaterials } = useMaterials();
  const { expenses: additionalExpenses, loading: additionalLoading, error: additionalError, loadAdditionalExpenses } = useAdditionalExpenses();
  const { getProductById, addProduct, editProduct } = useProducts(false);
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS);
  const [selectedAdditional, setSelectedAdditional] = useState<{ expenseId: number; quantity: string }[]>([]);
  const [selected, setSelected] = useState<SelectedMaterial[]>([]);
  const [photoFilename, setPhotoFilename] = useState<string | null>(null);
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const isEditing = id !== undefined;

  useEffect(() => {
    let active = true;
    setFields(EMPTY_FIELDS);
    setSelected([]);
    setSelectedAdditional([]);
    setPhotoFilename(null);
    setNewPhoto(null);
    setLoadError(null);
    if (!isEditing) { setLoading(false); return; }
    setLoading(true);
    const productId = Number(id);
    if (!id || !/^\d+$/.test(id) || !Number.isSafeInteger(productId) || productId <= 0) {
      setLoadError('Identificador inválido.');
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const product = await getProductById(productId);
        if (!product) throw new Error('Produto não encontrado.');
        if (!active) return;
        setFields({
          name: product.name,
          description: product.description ?? '',
          hours: String(Math.floor(product.productionMinutes / 60)),
          minutes: String(product.productionMinutes % 60),
        });
        setSelected(product.materials.map(m => ({ materialId: m.materialId, quantity: String(m.quantityUsed).replace('.', ','), usageUnit: m.usageUnit ?? m.unit })));
        setSelectedAdditional(product.additionalExpenses.map(e => ({ expenseId: e.expenseId, quantity: String(e.quantity) })));
        setPhotoFilename(product.photoFilename);
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : 'Não foi possível carregar o produto.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id, isEditing, getProductById]);

  const setField = (field: keyof Fields, value: string) => {
    setFields(old => ({ ...old, [field]: value }));
    setError(null);
  };
  const addMaterial = (materialId: number) => {
    setSelected(old => old.some(m => m.materialId === materialId) ? old : [...old, { materialId, quantity: '', usageUnit: compatibleUnits(materials.find(m => m.id === materialId)?.unit ?? '')[0] ?? '' }]);
    setError(null);
  };
  const changeQuantity = (materialId: number, quantity: string) => {
    setSelected(old => old.map(m => m.materialId === materialId ? { ...m, quantity } : m));
    setError(null);
  };
  const changeUsageUnit = (materialId: number, usageUnit: string) => {
    setSelected(old => old.map(m => m.materialId === materialId ? { ...m, usageUnit } : m));
    setError(null);
  };
  const removeMaterial = (materialId: number) => setSelected(old => old.filter(m => m.materialId !== materialId));

  function addAdditional(expenseId: number) {
    setSelectedAdditional(old => old.some(e => e.expenseId === expenseId) ? old : [...old, { expenseId, quantity: '1' }]);
    setError(null);
  }
  function removeAdditional(expenseId: number) {
    setSelectedAdditional(old => old.filter(e => e.expenseId !== expenseId));
    setError(null);
  }
  function changeAdditionalQuantity(expenseId: number, quantity: string) {
    setSelectedAdditional(old => old.map(e => e.expenseId === expenseId ? { ...e, quantity } : e));
    setError(null);
  }
  function resolveAdditional() {
    let total = 0;
    const items = selectedAdditional.map(selection => {
      const expense = additionalExpenses.find(e => e.id === selection.expenseId);
      const quantity = Number(selection.quantity);
      if (!expense) throw new Error('Uma despesa adicional não está disponível.');
      if (!/^\d+$/.test(selection.quantity.trim()) || !Number.isSafeInteger(quantity) || quantity <= 0) throw new Error('Informe uma quantidade inteira maior que zero para cada despesa adicional.');
      total += expense.costCents * quantity;
      if (!Number.isSafeInteger(total)) throw new Error('O custo das despesas adicionais é muito alto.');
      return { expenseId: expense.id, quantity };
    });
    return { items, total };
  }
  let additionalCostCents: number | null = null;
  try { additionalCostCents = resolveAdditional().total; } catch {}

  async function choosePhoto() {
    try {
      const uri = await pickProductPhoto();
      if (uri) setNewPhoto(uri);
    } catch {
      setError('Não foi possível selecionar a foto.');
    }
  }
  function removePhoto() {
    setNewPhoto(null);
    setPhotoFilename(null);
  }

  function resolvedMaterials(): ProductMaterial[] {
    return selected.map(selection => {
      const material = materials.find(m => m.id === selection.materialId);
      if (!material) throw new Error('Um dos materiais não está mais disponível.');
      const quantityUsed = parseQuantity(selection.quantity);
      if (!Number.isFinite(convertQuantity(quantityUsed, selection.usageUnit, material.unit))) throw new Error('Informe uma quantidade válida para cada material.');
      return { materialId: material.id, quantityUsed, usageUnit: selection.usageUnit, name: material.name, unit: material.unit, costCents: material.costCents, referenceQuantity: material.quantity };
    });
  }

  let totalCostCents: number | null = null;
  try {
    const total = getMaterialCostCents(resolvedMaterials());
    if (Number.isSafeInteger(total)) totalCostCents = total;
  } catch { /* Prévia indisponível enquanto houver dados incompletos. */ }

  async function save(): Promise<boolean> {
    if (busy.current || loading || loadError || materialsLoading || materialsError || additionalLoading || additionalError) return false;
    busy.current = true;
    setSaving(true);
    setError(null);
    let copied: string | null = null;
    try {
      const name = fields.name.trim();
      if (!name) throw new Error('Informe o nome do produto.');
      const productionMinutes = parseDuration(fields.hours, fields.minutes);
      const linked = resolvedMaterials();
      if (!linked.length) throw new Error('Adicione pelo menos um material.');
      if (!Number.isSafeInteger(getMaterialCostCents(linked))) throw new Error('O custo informado é muito alto.');
      const extra = resolveAdditional();
      if (newPhoto) copied = saveProductPhoto(newPhoto);
      const input = {
        name, description: fields.description.trim() || null, productionMinutes,
        photoFilename: copied ?? photoFilename,
        additionalExpenses: extra.items,
        materials: linked.map(({ materialId, quantityUsed, usageUnit, unit }) => ({ materialId, quantityUsed, usageUnit: usageUnit ?? unit })),
      };
      if (isEditing) await editProduct({ ...input, id: Number(id) });
      else await addProduct(input);
      return true;
    } catch (error) {
      if (copied) deleteProductPhoto(copied);
      setError(error instanceof Error ? error.message : 'Não foi possível salvar o produto.');
      return false;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  return {
    fields, setField, selected, addMaterial, changeQuantity, changeUsageUnit, removeMaterial,
    materials, materialsLoading, materialsError, loadMaterials,
    additionalExpenses, additionalLoading, additionalError, loadAdditionalExpenses, selectedAdditional, addAdditional, removeAdditional, changeAdditionalQuantity, additionalCostCents,
    photoUri: newPhoto ?? getProductPhotoUri(photoFilename), choosePhoto, removePhoto,
    isEditing, loading, loadError, saving, error, save, totalCostCents,
  };
}
