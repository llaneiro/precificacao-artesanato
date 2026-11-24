import { useCallback, useEffect, useRef, useState } from 'react';
import { useMaterials } from './useMaterials';
import { CreateMaterialInput, isMaterialUnit } from '../types/material';
import { parseCostCents, centsToInput } from '../utils/currency';
export { parseCostCents } from '../utils/currency';

const EMPTY_FIELDS = { name: '', cost: '', quantity: '', unit: '' };
type MaterialFields = typeof EMPTY_FIELDS;

function parseQuantity(value: string): number {
  if (!/^\d+(?:[,.]\d+)?$/.test(value.trim())) {
    throw new Error('Informe uma quantidade válida.');
  }
  const quantity = Number(value.trim().replace(',', '.'));
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('Informe uma quantidade maior que zero.');
  }
  return quantity;
}

function toInput(fields: MaterialFields): CreateMaterialInput {
  if (!isMaterialUnit(fields.unit)) throw new Error('Selecione uma unidade de medida.');
  return {
    name: fields.name,
    costCents: parseCostCents(fields.cost),
    quantity: parseQuantity(fields.quantity),
    unit: fields.unit,
  };
}

// Gerencia o formulário e reutiliza o hook de materiais para persistir os dados.
export function useMaterialForm(id?: string) {
  const { getMaterialById, addMaterial, editMaterial } = useMaterials(false);
  const [fields, setFields] = useState<MaterialFields>(EMPTY_FIELDS);
  const [loading, setLoading] = useState(Boolean(id));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);
  const isEditing = id !== undefined;

  useEffect(() => {
    let active = true;
    setLoadError(null);
    setError(null);
    setFields(EMPTY_FIELDS);
    if (!isEditing) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const materialId = Number(id);
    if (!id || !/^\d+$/.test(id) || !Number.isSafeInteger(materialId) || materialId <= 0) {
      setLoadError('Identificador de material inválido.');
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const material = await getMaterialById(materialId);
        if (!material) throw new Error('Material não encontrado.');
        if (active) setFields({
          name: material.name,
          cost: centsToInput(material.costCents),
          quantity: String(material.quantity).replace('.', ','),
          unit: material.unit,
        });
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : 'Não foi possível carregar o material.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [id, isEditing, getMaterialById]);

  const setField = useCallback((field: keyof MaterialFields, value: string) => {
    setFields(current => ({ ...current, [field]: value }));
    setError(null);
  }, []);

  const save = useCallback(async (): Promise<boolean> => {
    if (savingRef.current || loading || loadError) return false;
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      const input = toInput(fields);
      if (isEditing) await editMaterial({ ...input, id: Number(id) });
      else await addMaterial(input);
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Não foi possível salvar o material.');
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [fields, id, isEditing, loading, loadError, addMaterial, editMaterial]);

  return { fields, setField, isEditing, loading, loadError, saving, error, save };
}
