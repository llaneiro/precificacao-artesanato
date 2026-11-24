// Uma despesa recorrente, expressa pelo custo mensal em centavos.
export interface Expense {
  id: number;
  userId: string;
  name: string;
  monthlyCostCents: number;
  description: string | null;
  createdAt: string;
}

export interface CreateExpenseInput {
  name: string;
  monthlyCostCents: number;
  description: string | null;
}

export interface UpdateExpenseInput extends CreateExpenseInput {
  id: number;
}
