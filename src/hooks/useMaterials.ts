import { useSyncStatus } from '../contexts/SyncContext';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuthContext } from '../contexts/AuthContext';
import * as MaterialRepository from '../database/materialRepository';
import { Material, CreateMaterialInput, UpdateMaterialInput, UpdateMaterialPriceInput, isMaterialUnit } from '../types/material';

// Valida os dados antes de enviá-los ao repositório.
function validateMaterial(input: CreateMaterialInput): CreateMaterialInput {
  const name = input.name.trim();
  const unit = input.unit.trim();

  if (!name) throw new Error('Informe o nome do material.');
  if (!isMaterialUnit(unit)) throw new Error('Selecione uma unidade de medida.');
  if (!Number.isSafeInteger(input.costCents) || input.costCents < 0) {
    throw new Error('Informe um custo válido.');
  }
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
    throw new Error('Informe uma quantidade de material maior que zero.');
  }

  return { ...input, name, unit };
}

// O UID da conta autenticada identifica os registros locais.
export function useMaterials(loadOnFocus = true) {
  const { user } = useAuthContext();
  const remoteVersion = useSyncStatus().remoteVersion;
  const userId = user?.uid;
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMaterials = useCallback(async () => {
    if (!userId) {
      setMaterials([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await MaterialRepository.getMaterials(userId);
      setMaterials(data);
    } catch (error) {
      console.error('Erro ao carregar materiais:', error);
      setError('Não foi possível carregar os materiais.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Recarrega ao voltar para a tela de materiais.
  useFocusEffect(
    useCallback(() => {
      if (loadOnFocus) void loadMaterials();
    }, [loadMaterials, loadOnFocus, remoteVersion]),
  );

  const addMaterial = useCallback(
    async (input: CreateMaterialInput) => {
      if (!userId) throw new Error('Faça login para cadastrar materiais.');
      const material = await MaterialRepository.createMaterial(userId, validateMaterial(input));
      if (loadOnFocus) await loadMaterials();
      return material;
    },
    [userId, loadMaterials, loadOnFocus],
  );

  const editMaterial = useCallback(
    async (input: UpdateMaterialInput) => {
      if (!userId) throw new Error('Faça login para editar materiais.');
      const name = input.name.trim();
      if (!name) throw new Error('Informe o nome do material.');
      await MaterialRepository.updateMaterial(userId, { id: input.id, name });
      if (loadOnFocus) await loadMaterials();
    }, [userId, loadMaterials, loadOnFocus],
  );

  const updatePrice = useCallback(async (input: UpdateMaterialPriceInput) => {
    if (!userId) throw new Error('Faça login para atualizar o preço.');
    const valid = validateMaterial({ ...input, name: 'Material' });
    try {
      await MaterialRepository.updateMaterialPrice(userId, {
        id: input.id, costCents: valid.costCents, quantity: valid.quantity, unit: valid.unit,
      });
    } catch (error) {
      if (String(error).includes('MATERIAL_CATEGORY_CHANGE')) {
        throw new Error('A unidade precisa pertencer à categoria do material.');
      }
      throw error;
    }
    if (loadOnFocus) await loadMaterials();
  }, [userId, loadMaterials, loadOnFocus]);

  const removeMaterial = useCallback(
    async (id: number) => {
      if (!userId) throw new Error('Faça login para excluir materiais.');
      await MaterialRepository.deleteMaterial(userId, id);
      if (loadOnFocus) await loadMaterials();
    },
    [userId, loadMaterials, loadOnFocus],
  );

  const getMaterialById = useCallback(
    (id: number) => userId ? MaterialRepository.getMaterialById(userId, id) : Promise.resolve(null),
    [userId],
  );

  return {
    materials,
    loading,
    error,
    loadMaterials,
    getMaterialById,
    addMaterial,
    editMaterial,
    updatePrice,
    removeMaterial,
  };
}
