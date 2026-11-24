// Uma despesa adicional por unidade de serviço, em centavos.
export interface AdditionalExpense {
  id: number;
  userId: string;
  name: string;
  costCents: number;
  description: string | null;
  createdAt: string;
}

export interface CreateAdditionalExpenseInput {
  name: string;
  costCents: number;
  description: string | null;
}

export interface UpdateAdditionalExpenseInput extends CreateAdditionalExpenseInput {
  id: number;
}
