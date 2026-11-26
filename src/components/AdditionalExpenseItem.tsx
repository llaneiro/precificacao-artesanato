import { ExpenseListRow } from './ExpenseListRow';
import type { AdditionalExpense } from '../types/additionalExpense';

interface AdditionalExpenseItemProps {
  expense: AdditionalExpense;
  onEdit: (id: number) => void;
  onDelete: (expense: AdditionalExpense) => void;
  disabled?: boolean;
  first?: boolean;
  last?: boolean;
}

export function AdditionalExpenseItem({ expense, onEdit, onDelete, ...layout }: AdditionalExpenseItemProps) {
  return <ExpenseListRow {...layout} name={expense.name} costCents={expense.costCents} description={expense.description}
    onEdit={() => onEdit(expense.id)} onDelete={() => onDelete(expense)} />;
}
