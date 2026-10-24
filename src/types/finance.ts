export type AccountType = 
  | 'checking' 
  | 'savings' 
  | 'cash' 
  | 'digital_wallet' 
  | 'investment' 
  | 'other';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  institution: string;
  initialBalance: number;
  currentBalance: number;
  startDate: string;
  color: string;
  status: 'active' | 'archived';
  notes?: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export type ExpenseNature = 
  | 'fixa' 
  | 'variavel' 
  | 'eventual' 
  | 'essencial' 
  | 'nao_essencial' 
  | 'planejada' 
  | 'imprevista';

export type TransactionStatus = 'realizada' | 'prevista' | 'cancelada';

export type PaymentMethod = 
  | 'pix' 
  | 'dinheiro' 
  | 'debito' 
  | 'credito' 
  | 'boleto' 
  | 'transferencia' 
  | 'outro';

export type IncomeFrequency = 
  | 'unica' 
  | 'semanal' 
  | 'quinzenal' 
  | 'mensal' 
  | 'anual' 
  | 'personalizada';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  subcategory?: string;
  date: string; // YYYY-MM-DD
  expectedDate?: string; // YYYY-MM-DD
  paymentDate?: string; // YYYY-MM-DD
  accountId: string; // Conta de origem ou destino
  destinationAccountId?: string; // Para transferências
  paymentMethod: PaymentMethod;
  expenseNature?: ExpenseNature;
  status: TransactionStatus;
  frequency?: IncomeFrequency;
  cardId?: string; // Se feita no cartão de crédito
  invoiceMonth?: string; // Ex: "2026-10" para faturas
  isInvoicePayment?: boolean; // Se é pagamento de fatura de cartão (não duplica despesa)
  installmentIndex?: number;
  installmentsTotal?: number;
  recurringId?: string;
  notes?: string;
  receiptName?: string;
  receiptData?: string; // Base64 ou URL opcional
  createdAt: string;
  updatedAt: string;
}

export interface CreditCard {
  id: string;
  name: string;
  institution: string;
  totalLimit: number;
  closingDay: number; // Dia de fechamento da fatura
  dueDay: number; // Dia de vencimento da fatura
  paymentAccountId: string; // Conta padrão para pagamento
  color: string;
  status: 'active' | 'blocked';
  notes?: string;
}

export interface CreditCardInvoice {
  id: string;
  cardId: string;
  month: string; // YYYY-MM
  closingDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  totalAmount: number;
  status: 'open' | 'closed' | 'paid';
  paidAt?: string;
  paymentAccountId?: string;
}

export interface RecurringCommitment {
  id: string;
  title: string;
  amount: number;
  isVariableAmount: boolean;
  type: 'expense' | 'income';
  category: string;
  subcategory?: string;
  dueDay: number;
  frequency: 'mensal' | 'semanal' | 'quinzenal' | 'anual';
  startDate: string;
  endDate?: string;
  accountId: string;
  paymentMethod: PaymentMethod;
  expenseNature?: ExpenseNature;
  notes?: string;
  active: boolean;
  reminderDays: number;
}

export interface BudgetLimit {
  id: string;
  category: string;
  monthlyLimit: number;
  alert50: boolean;
  alert75: boolean;
  alert90: boolean;
  alert100: boolean;
}

export type DebtType = 
  | 'emprestimo_pessoal' 
  | 'financiamento_carro' 
  | 'financiamento_moto' 
  | 'financiamento_imobiliario' 
  | 'consorcio' 
  | 'parcelamento' 
  | 'divida_pessoal' 
  | 'outro';

export interface Debt {
  id: string;
  creditor: string;
  type: DebtType;
  originalAmount: number;
  remainingBalance: number;
  interestRateAnnual?: number; // Em %
  totalInstallments: number;
  paidInstallments: number;
  installmentAmount: number;
  dueDay: number;
  startDate: string;
  estimatedEndDate: string;
  notes?: string;
}

export type GoalCategory = 
  | 'emergency_fund' 
  | 'car' 
  | 'house' 
  | 'trip' 
  | 'tech' 
  | 'debt_payoff' 
  | 'investment' 
  | 'other';

export interface FinancialGoal {
  id: string;
  title: string;
  category: GoalCategory;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  priority: 'baixa' | 'media' | 'alta';
  linkedAccountId?: string;
  monthlyPlannedContribution: number;
  notes?: string;
}

export type AssetType = 
  | 'cash' 
  | 'checking' 
  | 'savings' 
  | 'fixed_income' 
  | 'investment_fund' 
  | 'stocks' 
  | 'etfs' 
  | 'crypto' 
  | 'real_estate' 
  | 'vehicle' 
  | 'other';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  currentValue: number;
  acquisitionCost: number;
  institution?: string;
  updatedAt: string;
  notes?: string;
}

export interface UserPreferences {
  name: string;
  email: string;
  currency: 'BRL';
  dateFormat: 'DD/MM/AAAA';
  timezone: 'America/Bahia';
  theme: 'light' | 'dark' | 'system';
  firstDayOfMonth: number;
  onboardingCompleted: boolean;
  monthlySavingsGoalPercentage: number;
  emergencyFundTargetMonths: number;
  customCategories: string[];
}

export interface FinancialSummaryKPIs {
  currentBalance: number; // Saldo Realizado
  monthlyIncome: number; // Receitas Realizadas no Mês
  monthlyExpenses: number; // Despesas Realizadas no Mês
  projectedEndMonthBalance: number; // Saldo Projetado
  pendingBillsTotal: number; // Contas pendentes a pagar
  pendingIncomeTotal: number; // Recebimentos previstos
  openDebtsTotal: number; // Total de dívidas em aberto
  fixedExpensesCommitted: number; // Comprometido com despesas fixas
  availableAfterCommitments: number; // Saldo disponível após compromissos
  accumulatedSavings: number; // Economia acumulada do mês
  savingsRate: number | null; // % da renda economizada (null quando não há receitas)
  previousMonthComparison: {
    incomeDiffPercentage: number;
    expenseDiffPercentage: number;
    balanceDiff: number;
  };
}

export interface WhatIfScenario {
  id: string;
  title: string;
  description: string;
  incomeAdjustmentPercent: number;
  expenseAdjustmentPercent: number;
  additionalMonthlyExpense: number;
  additionalMonthlyIncome: number;
  debtPrepaymentAmount: number;
}
