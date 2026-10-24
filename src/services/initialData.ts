import {
  Account,
  CreditCard,
  CreditCardInvoice,
  Transaction,
  RecurringCommitment,
  BudgetLimit,
  Debt,
  FinancialGoal,
  Asset,
  UserPreferences,
} from '../types/finance';

export const INITIAL_USER_PREFERENCES: UserPreferences = {
  name: 'Pedro Henrique',
  email: 'lopespedrohenrique504@gmail.com',
  currency: 'BRL',
  dateFormat: 'DD/MM/AAAA',
  timezone: 'America/Bahia',
  theme: 'light',
  firstDayOfMonth: 1,
  onboardingCompleted: true,
  monthlySavingsGoalPercentage: 20,
  emergencyFundTargetMonths: 6,
  customCategories: [],
};

// ESTADO INICIAL 100% LIMPO E ZERADO (SEM DADOS FICTÍCIOS OU MOCKADOS)
export const INITIAL_ACCOUNTS: Account[] = [];
export const INITIAL_CREDIT_CARDS: CreditCard[] = [];
export const INITIAL_INVOICES: CreditCardInvoice[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];
export const INITIAL_RECURRING: RecurringCommitment[] = [];
export const INITIAL_BUDGETS: BudgetLimit[] = [];
export const INITIAL_DEBTS: Debt[] = [];
export const INITIAL_GOALS: FinancialGoal[] = [];
export const INITIAL_ASSETS: Asset[] = [];

// Preset opcional reservado exclusivamente para o botão "Carregar Base Demonstrativa" nas Configurações
export const DEMO_PRESET_ACCOUNTS: Account[] = [
  {
    id: 'demo-acc-1',
    name: 'Nubank Principal',
    type: 'checking',
    institution: 'Nubank',
    initialBalance: 3450.8,
    currentBalance: 3450.8,
    startDate: '2026-01-01',
    color: '#820AD1',
    status: 'active',
    notes: 'Conta corrente para gastos do dia a dia e Pix',
  },
  {
    id: 'demo-acc-2',
    name: 'Itaú Reserva',
    type: 'savings',
    institution: 'Itaú Unibanco',
    initialBalance: 14200.0,
    currentBalance: 14200.0,
    startDate: '2026-01-01',
    color: '#EC7000',
    status: 'active',
    notes: 'Reserva de emergência líquida',
  },
];

export const DEMO_PRESET_CREDIT_CARDS: CreditCard[] = [
  {
    id: 'demo-card-1',
    name: 'Nubank Ultravioleta',
    institution: 'Nubank',
    totalLimit: 9500.0,
    closingDay: 20,
    dueDay: 27,
    paymentAccountId: 'demo-acc-1',
    color: '#820AD1',
    status: 'active',
  },
];

export const DEMO_PRESET_TRANSACTIONS: Transaction[] = [
  {
    id: 'demo-tx-1',
    description: 'Salário Líquido Mensal',
    amount: 6850.0,
    type: 'income',
    category: 'Salário',
    date: '2026-10-05',
    expectedDate: '2026-10-05',
    paymentDate: '2026-10-05',
    accountId: 'demo-acc-1',
    paymentMethod: 'transferencia',
    status: 'realizada',
    createdAt: '2026-10-05T09:00:00Z',
    updatedAt: '2026-10-05T09:00:00Z',
  },
  {
    id: 'demo-tx-2',
    description: 'Aluguel do Apartamento',
    amount: 1650.0,
    type: 'expense',
    category: 'Moradia',
    date: '2026-10-10',
    expectedDate: '2026-10-10',
    paymentDate: '2026-10-10',
    accountId: 'demo-acc-1',
    paymentMethod: 'pix',
    expenseNature: 'fixa',
    status: 'realizada',
    createdAt: '2026-10-10T10:00:00Z',
    updatedAt: '2026-10-10T10:00:00Z',
  },
];
