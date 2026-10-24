import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
  FinancialSummaryKPIs,
  TransactionType,
} from '../types/finance';
import {
  AppState,
  loadAppState,
  saveAppState,
  exportStateToJson,
  importStateFromJson,
  getInitialAppState,
} from '../services/storage';
import { INITIAL_USER_PREFERENCES } from '../services/initialData';
import {
  calculateDashboardKPIs,
  calculateAccountBalance,
  calculateConsolidatedBalance,
} from '../utils/accounting';
import { getCurrentMonthString, getTodayDateString, roundMoney } from '../utils/formatters';

interface FinanceContextValue {
  state: AppState;
  periodMonth: string;
  setPeriodMonth: (month: string) => void;
  kpis: FinancialSummaryKPIs;
  activeAccounts: Account[];
  
  // Quick Modal
  quickModalOpen: boolean;
  quickModalDefaultType: TransactionType;
  openQuickModal: (type?: TransactionType) => void;
  closeQuickModal: () => void;

  // Transactions CRUD
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Transaction;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  markTransactionAsPaid: (id: string, paymentDate?: string, accountId?: string) => void;
  duplicateTransaction: (id: string) => void;

  // Accounts CRUD
  addAccount: (acc: Omit<Account, 'id' | 'currentBalance'>) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  transferBetweenAccounts: (
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    date: string,
    description?: string
  ) => void;

  // Cards & Invoices
  addCreditCard: (card: Omit<CreditCard, 'id'>) => void;
  updateCreditCard: (id: string, updates: Partial<CreditCard>) => void;
  deleteCreditCard: (id: string) => void;
  payCreditCardInvoice: (
    cardId: string,
    invoiceMonth: string,
    paymentAccountId: string,
    amount: number
  ) => void;

  // Recurring Commitments
  addRecurring: (rec: Omit<RecurringCommitment, 'id'>) => void;
  updateRecurring: (id: string, updates: Partial<RecurringCommitment>) => void;
  deleteRecurring: (id: string) => void;
  confirmRecurringPayment: (recurringId: string, actualAmount?: number, paymentDate?: string) => void;

  // Budgets
  updateBudget: (
    category: string,
    monthlyLimit: number,
    alerts?: { alert50?: boolean; alert75?: boolean; alert90?: boolean; alert100?: boolean }
  ) => void;
  deleteBudget: (id: string) => void;

  // Debts
  addDebt: (debt: Omit<Debt, 'id'>) => void;
  updateDebt: (id: string, updates: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  payDebtInstallment: (debtId: string, amount: number, accountId: string) => void;

  // Goals
  addGoal: (goal: Omit<FinancialGoal, 'id'>) => void;
  updateGoal: (id: string, updates: Partial<FinancialGoal>) => void;
  deleteGoal: (id: string) => void;
  contributeToGoal: (goalId: string, amount: number, fromAccountId?: string) => void;

  // Assets / Patrimônio
  addAsset: (asset: Omit<Asset, 'id'>) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;

  // Preferences & Onboarding
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  completeOnboarding: (data: {
    name: string;
    initialBalance: number;
    salary: number;
    salaryDay: number;
    fixedExpensesEstimate: number;
    emergencyTargetMonths: number;
  }) => void;

  // Backup & Reset
  exportBackup: () => void;
  importBackup: (jsonStr: string) => boolean;
  resetToDemoData: () => void;
  clearAllData: () => void;

  // Notifications
  notification: string | null;
  showNotification: (msg: string) => void;
}

const FinanceContext = createContext<FinanceContextValue | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => loadAppState());
  const [periodMonth, setPeriodMonth] = useState<string>(() => getCurrentMonthString());
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [quickModalDefaultType, setQuickModalDefaultType] = useState<TransactionType>('expense');
  const [notification, setNotification] = useState<string | null>(null);

  // Auto-save on state change
  useEffect(() => {
    saveAppState(state);
  }, [state]);

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 4000);
  }, []);

  const openQuickModal = useCallback((type: TransactionType = 'expense') => {
    setQuickModalDefaultType(type);
    setQuickModalOpen(true);
  }, []);

  const closeQuickModal = useCallback(() => {
    setQuickModalOpen(false);
  }, []);

  // Recalculate accounts balance with latest transactions
  const activeAccounts = useMemo(() => {
    return state.accounts.map((acc) => ({
      ...acc,
      currentBalance: calculateAccountBalance(acc, state.transactions),
    }));
  }, [state.accounts, state.transactions]);

  // Recalculate KPIs whenever transactions, accounts or debts change
  const kpis = useMemo(() => {
    return calculateDashboardKPIs(activeAccounts, state.transactions, state.debts, periodMonth);
  }, [activeAccounts, state.transactions, state.debts, periodMonth]);

  // 1. Transactions CRUD
  const addTransaction = useCallback(
    (txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Transaction => {
      const now = new Date().toISOString();
      const newTx: Transaction = {
        ...txData,
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: now,
        updatedAt: now,
      };

      setState((prev) => ({
        ...prev,
        transactions: [newTx, ...prev.transactions],
      }));

      showNotification('Lançamento adicionado com sucesso!');
      return newTx;
    },
    [showNotification]
  );

  const updateTransaction = useCallback(
    (id: string, updates: Partial<Transaction>) => {
      setState((prev) => ({
        ...prev,
        transactions: prev.transactions.map((t) =>
          t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
        ),
      }));
      showNotification('Lançamento atualizado.');
    },
    [showNotification]
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        transactions: prev.transactions.filter((t) => t.id !== id),
      }));
      showNotification('Lançamento excluído.');
    },
    [showNotification]
  );

  const markTransactionAsPaid = useCallback(
    (id: string, paymentDate: string = getTodayDateString(), accountId?: string) => {
      setState((prev) => ({
        ...prev,
        transactions: prev.transactions.map((t) => {
          if (t.id === id) {
            return {
              ...t,
              status: 'realizada',
              paymentDate,
              accountId: accountId || t.accountId,
              updatedAt: new Date().toISOString(),
            };
          }
          return t;
        }),
      }));
      showNotification('Conta marcada como realizada/paga!');
    },
    [showNotification]
  );

  const duplicateTransaction = useCallback(
    (id: string) => {
      const target = state.transactions.find((t) => t.id === id);
      if (!target) return;
      const { id: _, createdAt: __, updatedAt: ___, ...rest } = target;
      addTransaction({
        ...rest,
        description: `${target.description} (Cópia)`,
        date: getTodayDateString(),
        status: 'realizada',
      });
      showNotification('Lançamento duplicado!');
    },
    [state.transactions, addTransaction, showNotification]
  );

  // 2. Accounts CRUD
  const addAccount = useCallback(
    (accData: Omit<Account, 'id' | 'currentBalance'>) => {
      const newAcc: Account = {
        ...accData,
        id: `acc-${Date.now()}`,
        currentBalance: accData.initialBalance,
      };
      setState((prev) => ({
        ...prev,
        accounts: [...prev.accounts, newAcc],
      }));
      showNotification(`Conta "${newAcc.name}" criada.`);
    },
    [showNotification]
  );

  const updateAccount = useCallback(
    (id: string, updates: Partial<Account>) => {
      setState((prev) => ({
        ...prev,
        accounts: prev.accounts.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      }));
      showNotification('Conta atualizada.');
    },
    [showNotification]
  );

  const deleteAccount = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        accounts: prev.accounts.filter((a) => a.id !== id),
      }));
      showNotification('Conta removida.');
    },
    [showNotification]
  );

  const transferBetweenAccounts = useCallback(
    (
      fromAccountId: string,
      toAccountId: string,
      amount: number,
      date: string,
      description?: string
    ) => {
      const fromAcc = state.accounts.find((a) => a.id === fromAccountId);
      const toAcc = state.accounts.find((a) => a.id === toAccountId);
      const desc = description || `Transferência de ${fromAcc?.name || 'Conta'} para ${toAcc?.name || 'Destino'}`;

      addTransaction({
        description: desc,
        amount: roundMoney(amount),
        type: 'transfer',
        category: 'Transferência Interna',
        date,
        accountId: fromAccountId,
        destinationAccountId: toAccountId,
        paymentMethod: 'transferencia',
        status: 'realizada',
        notes: `Transferência bancária interna entre contas próprias`,
      });

      showNotification('Transferência realizada com sucesso!');
    },
    [state.accounts, addTransaction, showNotification]
  );

  // 3. Credit Cards CRUD & Invoice Payment
  const addCreditCard = useCallback(
    (cardData: Omit<CreditCard, 'id'>) => {
      const newCard: CreditCard = {
        ...cardData,
        id: `card-${Date.now()}`,
      };
      setState((prev) => ({
        ...prev,
        creditCards: [...prev.creditCards, newCard],
      }));
      showNotification(`Cartão "${newCard.name}" cadastrado.`);
    },
    [showNotification]
  );

  const updateCreditCard = useCallback(
    (id: string, updates: Partial<CreditCard>) => {
      setState((prev) => ({
        ...prev,
        creditCards: prev.creditCards.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      }));
      showNotification('Cartão atualizado.');
    },
    [showNotification]
  );

  const deleteCreditCard = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        creditCards: prev.creditCards.filter((c) => c.id !== id),
      }));
      showNotification('Cartão excluído.');
    },
    [showNotification]
  );

  const payCreditCardInvoice = useCallback(
    (cardId: string, invoiceMonth: string, paymentAccountId: string, amount: number) => {
      const card = state.creditCards.find((c) => c.id === cardId);
      const acc = state.accounts.find((a) => a.id === paymentAccountId);

      // Registra a transação de pagamento de fatura:
      // Reduz o saldo da conta corrente, mas não duplica as despesas por competência (isInvoicePayment = true)
      addTransaction({
        description: `Pagamento de Fatura - ${card?.name || 'Cartão'} (${invoiceMonth})`,
        amount: roundMoney(amount),
        type: 'expense',
        category: 'Financeiro',
        subcategory: 'Fatura de Cartão',
        date: getTodayDateString(),
        paymentDate: getTodayDateString(),
        accountId: paymentAccountId,
        paymentMethod: 'debito',
        status: 'realizada',
        isInvoicePayment: true,
        cardId,
        invoiceMonth,
        notes: `Liquidação da fatura paga com saldo de ${acc?.name || 'Conta'}`,
      });

      // Atualiza o status da fatura
      setState((prev) => ({
        ...prev,
        invoices: prev.invoices.map((inv) =>
          inv.cardId === cardId && inv.month === invoiceMonth
            ? { ...inv, status: 'paid', paidAt: getTodayDateString(), paymentAccountId }
            : inv
        ),
      }));

      showNotification('Fatura do cartão liquidada com sucesso!');
    },
    [state.creditCards, state.accounts, addTransaction, showNotification]
  );

  // 4. Recurring Commitments
  const addRecurring = useCallback(
    (recData: Omit<RecurringCommitment, 'id'>) => {
      const newRec: RecurringCommitment = {
        ...recData,
        id: `rec-${Date.now()}`,
      };
      setState((prev) => ({
        ...prev,
        recurring: [...prev.recurring, newRec],
      }));
      showNotification(`Compromisso fixo "${newRec.title}" cadastrado.`);
    },
    [showNotification]
  );

  const updateRecurring = useCallback(
    (id: string, updates: Partial<RecurringCommitment>) => {
      setState((prev) => ({
        ...prev,
        recurring: prev.recurring.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      }));
      showNotification('Compromisso recorrente atualizado.');
    },
    [showNotification]
  );

  const deleteRecurring = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        recurring: prev.recurring.filter((r) => r.id !== id),
      }));
      showNotification('Compromisso recorrente excluído.');
    },
    [showNotification]
  );

  const confirmRecurringPayment = useCallback(
    (recurringId: string, actualAmount?: number, paymentDate: string = getTodayDateString()) => {
      const item = state.recurring.find((r) => r.id === recurringId);
      if (!item) return;

      const finalAmount = actualAmount !== undefined ? actualAmount : item.amount;
      addTransaction({
        description: item.title,
        amount: roundMoney(finalAmount),
        type: item.type === 'income' ? 'income' : 'expense',
        category: item.category,
        subcategory: item.subcategory,
        date: paymentDate,
        paymentDate,
        accountId: item.accountId,
        paymentMethod: item.paymentMethod,
        expenseNature: item.expenseNature,
        status: 'realizada',
        recurringId: item.id,
        notes: `Ocorrência gerada a partir do compromisso recorrente "${item.title}"`,
      });

      showNotification(`Pagamento de "${item.title}" confirmado e lançado!`);
    },
    [state.recurring, addTransaction, showNotification]
  );

  // 5. Budgets
  const updateBudget = useCallback(
    (
      category: string,
      monthlyLimit: number,
      alerts?: { alert50?: boolean; alert75?: boolean; alert90?: boolean; alert100?: boolean }
    ) => {
      setState((prev) => {
        const existingIdx = prev.budgets.findIndex(
          (b) => b.category.toLowerCase() === category.toLowerCase()
        );
        if (existingIdx >= 0) {
          const updated = [...prev.budgets];
          updated[existingIdx] = {
            ...updated[existingIdx],
            monthlyLimit: roundMoney(monthlyLimit),
            ...(alerts || {}),
          };
          return { ...prev, budgets: updated };
        } else {
          const newBudget: BudgetLimit = {
            id: `bud-${Date.now()}`,
            category,
            monthlyLimit: roundMoney(monthlyLimit),
            alert50: alerts?.alert50 ?? true,
            alert75: alerts?.alert75 ?? true,
            alert90: alerts?.alert90 ?? true,
            alert100: alerts?.alert100 ?? true,
          };
          return { ...prev, budgets: [...prev.budgets, newBudget] };
        }
      });
      showNotification(`Orçamento para "${category}" definido.`);
    },
    [showNotification]
  );

  const deleteBudget = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        budgets: prev.budgets.filter((b) => b.id !== id),
      }));
      showNotification('Orçamento removido.');
    },
    [showNotification]
  );

  // 6. Debts
  const addDebt = useCallback(
    (debtData: Omit<Debt, 'id'>) => {
      const newDebt: Debt = {
        ...debtData,
        id: `debt-${Date.now()}`,
      };
      setState((prev) => ({
        ...prev,
        debts: [...prev.debts, newDebt],
      }));
      showNotification(`Dívida/Financiamento "${newDebt.creditor}" adicionado.`);
    },
    [showNotification]
  );

  const updateDebt = useCallback(
    (id: string, updates: Partial<Debt>) => {
      setState((prev) => ({
        ...prev,
        debts: prev.debts.map((d) => (d.id === id ? { ...d, ...updates } : d)),
      }));
      showNotification('Dívida atualizada.');
    },
    [showNotification]
  );

  const deleteDebt = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        debts: prev.debts.filter((d) => d.id !== id),
      }));
      showNotification('Dívida removida.');
    },
    [showNotification]
  );

  const payDebtInstallment = useCallback(
    (debtId: string, amount: number, accountId: string) => {
      const debt = state.debts.find((d) => d.id === debtId);
      if (!debt) return;

      const newRemaining = Math.max(0, roundMoney(debt.remainingBalance - amount));
      const newPaidInstallments = debt.paidInstallments + 1;

      // 1. Atualiza dívida
      updateDebt(debtId, {
        remainingBalance: newRemaining,
        paidInstallments: newPaidInstallments,
      });

      // 2. Lança saída de caixa
      addTransaction({
        description: `Parcela ${newPaidInstallments}/${debt.totalInstallments} - ${debt.creditor}`,
        amount: roundMoney(amount),
        type: 'expense',
        category: 'Veículos e Financiamentos',
        subcategory: 'Empréstimos',
        date: getTodayDateString(),
        paymentDate: getTodayDateString(),
        accountId,
        paymentMethod: 'pix',
        expenseNature: 'fixa',
        status: 'realizada',
        notes: `Amortização de parcela de financiamento. Saldo devedor restante: R$ ${newRemaining}`,
      });

      showNotification('Parcela de financiamento amortizada com sucesso!');
    },
    [state.debts, updateDebt, addTransaction, showNotification]
  );

  // 7. Goals
  const addGoal = useCallback(
    (goalData: Omit<FinancialGoal, 'id'>) => {
      const newGoal: FinancialGoal = {
        ...goalData,
        id: `goal-${Date.now()}`,
      };
      setState((prev) => ({
        ...prev,
        goals: [...prev.goals, newGoal],
      }));
      showNotification(`Meta "${newGoal.title}" criada.`);
    },
    [showNotification]
  );

  const updateGoal = useCallback(
    (id: string, updates: Partial<FinancialGoal>) => {
      setState((prev) => ({
        ...prev,
        goals: prev.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
      }));
      showNotification('Meta atualizada.');
    },
    [showNotification]
  );

  const deleteGoal = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        goals: prev.goals.filter((g) => g.id !== id),
      }));
      showNotification('Meta excluída.');
    },
    [showNotification]
  );

  const contributeToGoal = useCallback(
    (goalId: string, amount: number, fromAccountId?: string) => {
      const goal = state.goals.find((g) => g.id === goalId);
      if (!goal) return;

      const newCurrent = roundMoney(goal.currentAmount + amount);
      updateGoal(goalId, { currentAmount: newCurrent });

      if (fromAccountId) {
        // Se transferir para conta da meta
        const acc = state.accounts.find((a) => a.id === fromAccountId);
        addTransaction({
          description: `Aporte na meta: ${goal.title}`,
          amount: roundMoney(amount),
          type: 'transfer',
          category: 'Aporte de Metas',
          date: getTodayDateString(),
          accountId: fromAccountId,
          destinationAccountId: goal.linkedAccountId || fromAccountId,
          paymentMethod: 'transferencia',
          status: 'realizada',
          notes: `Aporte reservado para objetivo "${goal.title}"`,
        });
      }

      showNotification(`Aporte de R$ ${amount.toFixed(2)} registrado na meta!`);
    },
    [state.goals, state.accounts, updateGoal, addTransaction, showNotification]
  );

  // 8. Assets / Patrimônio
  const addAsset = useCallback(
    (assetData: Omit<Asset, 'id'>) => {
      const newAsset: Asset = {
        ...assetData,
        id: `asset-${Date.now()}`,
      };
      setState((prev) => ({
        ...prev,
        assets: [...prev.assets, newAsset],
      }));
      showNotification(`Ativo "${newAsset.name}" registrado.`);
    },
    [showNotification]
  );

  const updateAsset = useCallback(
    (id: string, updates: Partial<Asset>) => {
      setState((prev) => ({
        ...prev,
        assets: prev.assets.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      }));
      showNotification('Ativo patrimonial atualizado.');
    },
    [showNotification]
  );

  const deleteAsset = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        assets: prev.assets.filter((a) => a.id !== id),
      }));
      showNotification('Ativo removido.');
    },
    [showNotification]
  );

  // 9. Preferences & Onboarding
  const updatePreferences = useCallback(
    (updates: Partial<UserPreferences>) => {
      setState((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          ...updates,
        },
      }));
      showNotification('Preferências salvas.');
    },
    [showNotification]
  );

  const completeOnboarding = useCallback(
    (data: {
      name: string;
      initialBalance: number;
      salary: number;
      salaryDay: number;
      fixedExpensesEstimate: number;
      emergencyTargetMonths: number;
    }) => {
      const primaryAccount: Account = {
        id: `acc-primary-${Date.now()}`,
        name: 'Conta Corrente Principal',
        type: 'checking',
        institution: 'Banco Principal',
        initialBalance: roundMoney(data.initialBalance || 0),
        currentBalance: roundMoney(data.initialBalance || 0),
        startDate: getTodayDateString(),
        color: '#2563EB',
        status: 'active',
        notes: 'Conta configurada no onboarding inicial',
      };

      const salaryTx: Transaction | null =
        data.salary > 0
          ? {
              id: `tx-salary-${Date.now()}`,
              description: 'Salário Líquido Mensal',
              amount: roundMoney(data.salary),
              type: 'income',
              category: 'Salário',
              subcategory: 'Salário CLT',
              date: getTodayDateString(),
              expectedDate: getTodayDateString(),
              paymentDate: getTodayDateString(),
              accountId: primaryAccount.id,
              paymentMethod: 'transferencia',
              status: 'realizada',
              frequency: 'mensal',
              notes: `Salário recebido no dia ${data.salaryDay}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : null;

      const emergencyGoal: FinancialGoal = {
        id: `goal-emergency-${Date.now()}`,
        title: `Reserva de Emergência (${data.emergencyTargetMonths} Meses)`,
        category: 'emergency_fund',
        targetAmount: roundMoney((data.fixedExpensesEstimate || 2000) * data.emergencyTargetMonths),
        currentAmount: 0,
        targetDate: '2027-12-31',
        priority: 'alta',
        monthlyPlannedContribution: roundMoney((data.salary || 3000) * 0.15),
        notes: 'Meta calculada com base nos custos fixos estimados no onboarding',
      };

      setState((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          name: data.name || prev.preferences.name,
          onboardingCompleted: true,
          emergencyFundTargetMonths: data.emergencyTargetMonths || 6,
        },
        accounts: [primaryAccount],
        transactions: salaryTx ? [salaryTx] : [],
        goals: [emergencyGoal],
      }));

      showNotification('Configuração inicial concluída com sucesso! Bem-vindo ao PH Finance.');
    },
    [showNotification]
  );

  // 10. Backup & Reset
  const exportBackup = useCallback(() => {
    exportStateToJson(state);
    showNotification('Backup exportado com sucesso.');
  }, [state, showNotification]);

  const importBackup = useCallback(
    (jsonStr: string): boolean => {
      try {
        const imported = importStateFromJson(jsonStr);
        setState(imported);
        showNotification('Dados restaurados com sucesso.');
        return true;
      } catch (err: any) {
        showNotification(err?.message || 'Falha ao restaurar arquivo de backup.');
        return false;
      }
    },
    [showNotification]
  );

  const resetToDemoData = useCallback(() => {
    const demo = getInitialAppState();
    setState(demo);
    showNotification('Dados demonstrativos completos restaurados!');
  }, [showNotification]);

  const clearAllData = useCallback(() => {
    const fresh: AppState = {
      preferences: {
        ...INITIAL_USER_PREFERENCES,
        onboardingCompleted: false,
      },
      accounts: [],
      creditCards: [],
      invoices: [],
      transactions: [],
      recurring: [],
      budgets: [],
      debts: [],
      goals: [],
      assets: [],
      lastSavedAt: new Date().toISOString(),
    };
    setState(fresh);
    showNotification('Todos os dados foram excluídos e reiniciados.');
  }, [showNotification]);

  const value = useMemo(
    () => ({
      state,
      periodMonth,
      setPeriodMonth,
      kpis,
      activeAccounts,
      quickModalOpen,
      quickModalDefaultType,
      openQuickModal,
      closeQuickModal,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      markTransactionAsPaid,
      duplicateTransaction,
      addAccount,
      updateAccount,
      deleteAccount,
      transferBetweenAccounts,
      addCreditCard,
      updateCreditCard,
      deleteCreditCard,
      payCreditCardInvoice,
      addRecurring,
      updateRecurring,
      deleteRecurring,
      confirmRecurringPayment,
      updateBudget,
      deleteBudget,
      addDebt,
      updateDebt,
      deleteDebt,
      payDebtInstallment,
      addGoal,
      updateGoal,
      deleteGoal,
      contributeToGoal,
      addAsset,
      updateAsset,
      deleteAsset,
      updatePreferences,
      completeOnboarding,
      exportBackup,
      importBackup,
      resetToDemoData,
      clearAllData,
      notification,
      showNotification,
    }),
    [
      state,
      periodMonth,
      kpis,
      activeAccounts,
      quickModalOpen,
      quickModalDefaultType,
      openQuickModal,
      closeQuickModal,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      markTransactionAsPaid,
      duplicateTransaction,
      addAccount,
      updateAccount,
      deleteAccount,
      transferBetweenAccounts,
      addCreditCard,
      updateCreditCard,
      deleteCreditCard,
      payCreditCardInvoice,
      addRecurring,
      updateRecurring,
      deleteRecurring,
      confirmRecurringPayment,
      updateBudget,
      deleteBudget,
      addDebt,
      updateDebt,
      deleteDebt,
      payDebtInstallment,
      addGoal,
      updateGoal,
      deleteGoal,
      contributeToGoal,
      addAsset,
      updateAsset,
      deleteAsset,
      updatePreferences,
      completeOnboarding,
      exportBackup,
      importBackup,
      resetToDemoData,
      clearAllData,
      notification,
      showNotification,
    ]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};

export const useFinance = (): FinanceContextValue => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance deve ser usado dentro de um FinanceProvider');
  }
  return context;
};
