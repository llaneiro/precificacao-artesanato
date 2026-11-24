import { useCallback, useEffect, useRef, useState } from 'react';
import { useExpenses } from './useExpenses';
import { centsToInput, parseCostCents } from '../utils/currency';

const EMPTY_FIELDS = { name: '', monthlyCost: '', description: '' };
type ExpenseFields = typeof EMPTY_FIELDS;

export function useExpenseForm(id?: string) {
  const { getExpenseById, addExpense, editExpense } = useExpenses(false);
  const [fields, setFields] = useState<ExpenseFields>(EMPTY_FIELDS);
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
    const expenseId = Number(id);
    if (!id || !/^\d+$/.test(id) || !Number.isSafeInteger(expenseId) || expenseId <= 0) {
      setLoadError('Identificador de despesa inválido.');
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const expense = await getExpenseById(expenseId);
        if (!expense) throw new Error('Despesa não encontrada.');
        if (active) setFields({
          name: expense.name,
          monthlyCost: centsToInput(expense.monthlyCostCents),
          description: expense.description ?? '',
        });
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : 'Não foi possível carregar a despesa.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, [id, isEditing, getExpenseById]);

  const setField = useCallback((field: keyof ExpenseFields, value: string) => {
    setFields(current => ({ ...current, [field]: value }));
    setError(null);
  }, []);

  async function save(): Promise<boolean> {
    if (savingRef.current || loading || loadError) return false;
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      if (!fields.name.trim()) throw new Error('Informe o nome da despesa.');
      const input = {
        name: fields.name,
        monthlyCostCents: parseCostCents(fields.monthlyCost),
        description: fields.description,
      };
      if (isEditing) await editExpense({ ...input, id: Number(id) });
      else await addExpense(input);
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Não foi possível salvar a despesa.');
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return { fields, setField, isEditing, loading, loadError, saving, error, save };
}
