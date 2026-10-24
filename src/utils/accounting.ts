import {
  Account,
  Transaction,
  Debt,
  FinancialSummaryKPIs,
  CreditCard,
  CreditCardInvoice,
  BudgetLimit,
} from '../types/finance';
import { roundMoney, getTodayDateString } from './formatters';

/**
 * REGRAS CONTÁBEIS DO PH FINANCE
 * Cumpre todas as normas contábeis estabelecidas na especificação do projeto.
 */

/**
 * 1. Calcula o saldo realizado individual de uma conta bancária/carteira.
 * Fórmula: Saldo Inicial + Entradas recebidas - Saídas pagas + Transferências recebidas - Transferências enviadas.
 * Importante: Compras no cartão de crédito NÃO reduzem o saldo da conta até a fatura ser paga!
 */
export function calculateAccountBalance(
  account: Account,
  transactions: Transaction[]
): number {
  let balance = account.initialBalance;

  for (const t of transactions) {
    if (t.status !== 'realizada') continue; // Apenas lançamentos realizados afetam o saldo

    // 1. Receita direta creditada nesta conta
    if (t.type === 'income' && t.accountId === account.id) {
      balance += t.amount;
    }

    // 2. Despesa direta paga com esta conta (excluindo compra no cartão que não foi débito em conta)
    else if (t.type === 'expense' && t.accountId === account.id) {
      // Se tiver cardId mas não for pagamento de fatura, não debitou a conta ainda
      if (t.cardId && !t.isInvoicePayment) {
        continue;
      }
      balance -= t.amount;
    }

    // 3. Transferência interna
    else if (t.type === 'transfer') {
      if (t.destinationAccountId === account.id) {
        balance += t.amount; // Entrada
      }
      if (t.accountId === account.id) {
        balance -= t.amount; // Saída
      }
    }
  }

  return roundMoney(balance);
}

/**
 * 2. Calcula o saldo realizado consolidado de todas as contas ativas.
 * Regra: Transferências internas entre contas se anulam aritmeticamente no consolidado geral.
 */
export function calculateConsolidatedBalance(
  accounts: Account[],
  transactions: Transaction[]
): number {
  const activeAccounts = accounts.filter((a) => a.status === 'active');
  const total = activeAccounts.reduce((sum, acc) => {
    return sum + calculateAccountBalance(acc, transactions);
  }, 0);

  return roundMoney(total);
}

/**
 * 3. Calcula as receitas e despesas realizadas em um período específico (ex: "2026-10").
 * Regra:
 * - Regime de Caixa vs Regime de Competência:
 *   - Despesas por Competência (Orçamento/Categorias): Compras no cartão entram no mês em que ocorreram,
 *     enquanto pagamentos de fatura são desconsiderados para não duplicar o gasto!
 *   - Despesas por Caixa: O débito na conta só ocorre no pagamento da fatura ou compras à vista.
 */
export function calculatePeriodCashFlow(
  transactions: Transaction[],
  periodMonth?: string // YYYY-MM ou undefined para todos
) {
  let realizedIncome = 0;
  let realizedExpenseCompetency = 0; // Para análise de categorias e orçamento
  let realizedExpenseCash = 0; // Para fluxo de caixa real das contas

  for (const t of transactions) {
    if (t.status !== 'realizada') continue;

    // Filtro por mês se especificado
    if (periodMonth) {
      const txMonth = t.date.substring(0, 7);
      if (txMonth !== periodMonth) continue;
    }

    // Transferências internas NUNCA entram em receitas ou despesas
    if (t.type === 'transfer') continue;

    if (t.type === 'income') {
      realizedIncome += t.amount;
    } else if (t.type === 'expense') {
      // Se for pagamento de fatura: é saída de CAIXA, mas NÃO é nova despesa por competência
      if (t.isInvoicePayment) {
        realizedExpenseCash += t.amount;
      } else {
        // Despesa comum (compra à vista ou no cartão de crédito)
        realizedExpenseCompetency += t.amount;
        if (!t.cardId) {
          realizedExpenseCash += t.amount;
        }
      }
    }
  }

  return {
    realizedIncome: roundMoney(realizedIncome),
    realizedExpenseCompetency: roundMoney(realizedExpenseCompetency),
    realizedExpenseCash: roundMoney(realizedExpenseCash),
    netSavings: roundMoney(realizedIncome - realizedExpenseCompetency),
  };
}

/**
 * 4. Calcula todos os 10 KPIs do Dashboard
 */
export function calculateDashboardKPIs(
  accounts: Account[],
  transactions: Transaction[],
  debts: Debt[],
  currentMonth: string
): FinancialSummaryKPIs {
  const currentBalance = calculateConsolidatedBalance(accounts, transactions);

  // Mês Atual
  const currentPeriod = calculatePeriodCashFlow(transactions, currentMonth);

  // Mês Anterior para comparação
  const [yearStr, monthStr] = currentMonth.split('-');
  const prevMonthNum = parseInt(monthStr, 10) - 1;
  const prevYearNum = prevMonthNum === 0 ? parseInt(yearStr, 10) - 1 : parseInt(yearStr, 10);
  const adjustedPrevMonth = prevMonthNum === 0 ? 12 : prevMonthNum;
  const prevMonthStr = `${prevYearNum}-${String(adjustedPrevMonth).padStart(2, '0')}`;
  const prevPeriod = calculatePeriodCashFlow(transactions, prevMonthStr);

  // Contas pendentes no mês atual e vencidas
  let pendingBillsTotal = 0;
  let pendingIncomeTotal = 0;
  let fixedExpensesCommitted = 0;

  for (const t of transactions) {
    const txMonth = (t.expectedDate || t.date).substring(0, 7);
    if (txMonth !== currentMonth) continue;

    if (t.status === 'prevista') {
      if (t.type === 'expense') {
        pendingBillsTotal += t.amount;
      } else if (t.type === 'income') {
        pendingIncomeTotal += t.amount;
      }
    }

    if (t.type === 'expense' && t.expenseNature === 'fixa') {
      fixedExpensesCommitted += t.amount;
    }
  }

  // Total de dívidas abertas
  const openDebtsTotal = debts.reduce((sum, d) => sum + d.remainingBalance, 0);

  // Saldo Projetado para o fim do mês:
  // Saldo Realizado Atual + Recebimentos Futuros Previstos do Mês - Pagamentos Futuros Previstos do Mês
  const projectedEndMonthBalance = roundMoney(
    currentBalance + pendingIncomeTotal - pendingBillsTotal
  );

  // Valor disponível após compromissos conhecidos (Saldo atual - contas a pagar pendentes do mês)
  const availableAfterCommitments = roundMoney(currentBalance - pendingBillsTotal);

  // Taxa de Poupança: (Receitas Realizadas - Despesas) / Receitas * 100
  const income = currentPeriod.realizedIncome;
  const expense = currentPeriod.realizedExpenseCompetency;
  const accumulatedSavings = roundMoney(income - expense);
  const savingsRate = income > 0 ? roundMoney(((income - expense) / income) * 100) : null;

  // Comparação mês anterior
  const incomeDiffPercentage =
    prevPeriod.realizedIncome > 0
      ? roundMoney(((income - prevPeriod.realizedIncome) / prevPeriod.realizedIncome) * 100)
      : 0;

  const expenseDiffPercentage =
    prevPeriod.realizedExpenseCompetency > 0
      ? roundMoney(
          ((expense - prevPeriod.realizedExpenseCompetency) /
            prevPeriod.realizedExpenseCompetency) *
            100
        )
      : 0;

  return {
    currentBalance,
    monthlyIncome: currentPeriod.realizedIncome,
    monthlyExpenses: currentPeriod.realizedExpenseCompetency,
    projectedEndMonthBalance,
    pendingBillsTotal: roundMoney(pendingBillsTotal),
    pendingIncomeTotal: roundMoney(pendingIncomeTotal),
    openDebtsTotal: roundMoney(openDebtsTotal),
    fixedExpensesCommitted: roundMoney(fixedExpensesCommitted),
    availableAfterCommitments,
    accumulatedSavings,
    savingsRate,
    previousMonthComparison: {
      incomeDiffPercentage,
      expenseDiffPercentage,
      balanceDiff: roundMoney(accumulatedSavings - prevPeriod.netSavings),
    },
  };
}

/**
 * 5. Orçamento por Categoria: Gastos realizados x Limite mensal
 */
export function calculateBudgetExecution(
  budget: BudgetLimit,
  transactions: Transaction[],
  currentMonth: string
) {
  // Soma todas as despesas da categoria no mês (competência, desconsiderando transferências e pagamentos de fatura)
  const totalSpent = transactions
    .filter(
      (t) =>
        t.type === 'expense' &&
        !t.isInvoicePayment &&
        t.status === 'realizada' &&
        t.category.toLowerCase() === budget.category.toLowerCase() &&
        t.date.substring(0, 7) === currentMonth
    )
    .reduce((sum, t) => sum + t.amount, 0);

  const roundedSpent = roundMoney(totalSpent);
  const remaining = roundMoney(budget.monthlyLimit - roundedSpent);
  const percentage =
    budget.monthlyLimit > 0
      ? roundMoney((roundedSpent / budget.monthlyLimit) * 100)
      : 0;

  return {
    spent: roundedSpent,
    remaining,
    percentage,
    isExceeded: roundedSpent > budget.monthlyLimit,
    alertLevel:
      percentage >= 100
        ? 'critical'
        : percentage >= 90
        ? 'warning'
        : percentage >= 75
        ? 'caution'
        : percentage >= 50
        ? 'info'
        : 'normal',
  };
}

/**
 * 6. Cálculo do limite utilizado e disponível de um Cartão de Crédito
 */
export function calculateCreditCardUsage(
  card: CreditCard,
  transactions: Transaction[]
) {
  // Compras realizadas no cartão que ainda pertencem a faturas não pagas
  const usedAmount = transactions
    .filter(
      (t) =>
        t.cardId === card.id &&
        t.type === 'expense' &&
        !t.isInvoicePayment &&
        t.status === 'realizada'
    )
    .reduce((sum, t) => sum + t.amount, 0);

  const available = roundMoney(card.totalLimit - usedAmount);
  return {
    usedAmount: roundMoney(usedAmount),
    availableLimit: available > 0 ? available : 0,
    utilizationPercent:
      card.totalLimit > 0
        ? roundMoney((usedAmount / card.totalLimit) * 100)
        : 0,
  };
}
