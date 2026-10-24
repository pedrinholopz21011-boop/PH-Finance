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
import {
  INITIAL_ACCOUNTS,
  INITIAL_ASSETS,
  INITIAL_BUDGETS,
  INITIAL_CREDIT_CARDS,
  INITIAL_DEBTS,
  INITIAL_GOALS,
  INITIAL_INVOICES,
  INITIAL_RECURRING,
  INITIAL_TRANSACTIONS,
  INITIAL_USER_PREFERENCES,
  DEMO_PRESET_ACCOUNTS,
  DEMO_PRESET_CREDIT_CARDS,
  DEMO_PRESET_TRANSACTIONS,
} from './initialData';
import { formatDate } from '../utils/formatters';

export interface AppState {
  preferences: UserPreferences;
  accounts: Account[];
  creditCards: CreditCard[];
  invoices: CreditCardInvoice[];
  transactions: Transaction[];
  recurring: RecurringCommitment[];
  budgets: BudgetLimit[];
  debts: Debt[];
  goals: FinancialGoal[];
  assets: Asset[];
  lastSavedAt: string;
}

const STORAGE_KEY = 'ph_finance_data_v1';
const LEGACY_STORAGE_KEY = 'nexo_finance_data_v1';

export function getInitialAppState(): AppState {
  return {
    preferences: INITIAL_USER_PREFERENCES,
    accounts: INITIAL_ACCOUNTS,
    creditCards: INITIAL_CREDIT_CARDS,
    invoices: INITIAL_INVOICES,
    transactions: INITIAL_TRANSACTIONS,
    recurring: INITIAL_RECURRING,
    budgets: INITIAL_BUDGETS,
    debts: INITIAL_DEBTS,
    goals: INITIAL_GOALS,
    assets: INITIAL_ASSETS,
    lastSavedAt: new Date().toISOString(),
  };
}

export function getDemoPresetAppState(): AppState {
  return {
    preferences: INITIAL_USER_PREFERENCES,
    accounts: DEMO_PRESET_ACCOUNTS,
    creditCards: DEMO_PRESET_CREDIT_CARDS,
    invoices: [],
    transactions: DEMO_PRESET_TRANSACTIONS,
    recurring: [],
    budgets: [],
    debts: [],
    goals: [],
    assets: [],
    lastSavedAt: new Date().toISOString(),
  };
}

export function loadAppState(): AppState {
  try {
    // 1. Limpa resquícios do storage legado se continham dados mockados
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialAppState();
      saveAppState(initial);
      return initial;
    }

    const parsed = JSON.parse(raw);

    // Se o estado salvo contiver dados mockados antigos (acc-1, tx-1, debt-1 de exemplo), filtra
    const cleanedAccounts = (parsed.accounts || []).filter(
      (a: Account) => a.id !== 'acc-1' && a.id !== 'acc-2' && a.id !== 'acc-3' && a.id !== 'acc-4'
    );
    const cleanedTransactions = (parsed.transactions || []).filter(
      (t: Transaction) => !t.id.startsWith('tx-') || t.id.length > 10 // preserva apenas tx criadas com timestamp
    );
    const cleanedDebts = (parsed.debts || []).filter((d: Debt) => d.id !== 'debt-1');
    const cleanedGoals = (parsed.goals || []).filter(
      (g: FinancialGoal) => g.id !== 'goal-1' && g.id !== 'goal-2'
    );
    const cleanedAssets = (parsed.assets || []).filter(
      (a: Asset) => a.id !== 'asset-1' && a.id !== 'asset-2' && a.id !== 'asset-3'
    );

    const cleanState: AppState = {
      preferences: {
        ...INITIAL_USER_PREFERENCES,
        ...(parsed.preferences || {}),
      },
      accounts: cleanedAccounts,
      creditCards: parsed.creditCards?.filter((c: CreditCard) => c.id !== 'card-1' && c.id !== 'card-2') || [],
      invoices: parsed.invoices?.filter((i: CreditCardInvoice) => i.id !== 'inv-1' && i.id !== 'inv-2') || [],
      transactions: cleanedTransactions,
      recurring: parsed.recurring?.filter((r: RecurringCommitment) => !r.id.startsWith('rec-')) || [],
      budgets: parsed.budgets?.filter((b: BudgetLimit) => !b.id.startsWith('bud-')) || [],
      debts: cleanedDebts,
      goals: cleanedGoals,
      assets: cleanedAssets,
      lastSavedAt: new Date().toISOString(),
    };

    saveAppState(cleanState);
    return cleanState;
  } catch (err) {
    console.error('Erro ao ler estado do localStorage:', err);
    return getInitialAppState();
  }
}

export function saveAppState(state: AppState): void {
  try {
    const payload = {
      ...state,
      lastSavedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error('Erro ao salvar estado no localStorage:', err);
  }
}

export function exportStateToJson(state: AppState): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  const now = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute('download', `ph-finance-backup-${now}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importStateFromJson(jsonString: string): AppState {
  const parsed = JSON.parse(jsonString);
  if (!parsed.preferences) {
    throw new Error('Arquivo de backup inválido ou incompatível.');
  }
  const cleanState: AppState = {
    ...getInitialAppState(),
    ...parsed,
    lastSavedAt: new Date().toISOString(),
  };
  saveAppState(cleanState);
  return cleanState;
}

export function exportTransactionsToCSV(transactions: Transaction[], accounts: Account[]): void {
  const accountMap = new Map<string, string>();
  accounts.forEach((a) => accountMap.set(a.id, a.name));

  const headers = [
    'Data',
    'Tipo',
    'Descrição',
    'Categoria',
    'Subcategoria',
    'Valor (R$)',
    'Status',
    'Conta',
    'Forma de Pagamento',
    'Natureza',
    'Observações',
  ];

  const rows = transactions.map((t) => [
    formatDate(t.date),
    t.type === 'income' ? 'Receita' : t.type === 'expense' ? 'Despesa' : 'Transferência',
    `"${(t.description || '').replace(/"/g, '""')}"`,
    `"${(t.category || '').replace(/"/g, '""')}"`,
    `"${(t.subcategory || '').replace(/"/g, '""')}"`,
    t.amount.toFixed(2).replace('.', ','),
    t.status === 'realizada' ? 'Realizada' : t.status === 'prevista' ? 'Prevista' : 'Cancelada',
    `"${(accountMap.get(t.accountId) || 'N/A').replace(/"/g, '""')}"`,
    t.paymentMethod,
    t.expenseNature || '',
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  // BOM UTF-8 (\uFEFF) para compatibilidade perfeita com Excel no Windows/Mac
  const csvContent =
    '\uFEFF' +
    headers.join(';') +
    '\n' +
    rows.map((r) => r.join(';')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const now = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `ph-finance-extrato-${now}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
