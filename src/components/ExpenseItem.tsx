import { ExpenseListRow } from './ExpenseListRow';
import type { Expense } from '../types/expense';

interface ExpenseItemProps {
  expense: Expense;
  onEdit: (id: number) => void;
  onDelete: (expense: Expense) => void;
  disabled?: boolean;
  first?: boolean;
  last?: boolean;
}

export function ExpenseItem({ expense, onEdit, onDelete, ...layout }: ExpenseItemProps) {
  return <ExpenseListRow {...layout} name={expense.name} costCents={expense.monthlyCostCents} description={expense.description}
    onEdit={() => onEdit(expense.id)} onDelete={() => onDelete(expense)} />;
}
