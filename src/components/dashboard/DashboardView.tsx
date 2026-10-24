import React from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  CreditCard as CreditCardIcon,
  Target,
  Plus,
  ArrowRight,
  PieChart as PieIcon,
  BadgePercent,
  ShieldAlert,
  FolderPlus,
  Landmark,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatBRL, formatDate, isBillOverdue, getDaysDiff, formatMonthYear } from '../../utils/formatters';
import { calculateBudgetExecution } from '../../utils/accounting';
import { ActiveTab } from '../layout/Sidebar';

interface DashboardViewProps {
  onNavigateTab: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  const {
    kpis,
    state,
    periodMonth,
    openQuickModal,
    markTransactionAsPaid,
  } = useFinance();

  // Transações do mês
  const monthlyTransactions = state.transactions.filter(
    (t) => (t.date || '').substring(0, 7) === periodMonth
  );

  // Próximas contas a pagar e vencidas
  const pendingBills = state.transactions
    .filter((t) => t.type === 'expense' && t.status === 'prevista')
    .sort((a, b) => (a.expectedDate || a.date).localeCompare(b.expectedDate || b.date));

  const overdueBills = pendingBills.filter((b) => isBillOverdue(b.expectedDate || b.date, b.status));
  const upcomingBills = pendingBills.filter((b) => !isBillOverdue(b.expectedDate || b.date, b.status)).slice(0, 5);

  // Despesas agrupadas por categoria para gráfico
  const expensesByCategory = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const t of state.transactions) {
      if (
        t.type === 'expense' &&
        !t.isInvoicePayment &&
        t.status === 'realizada' &&
        t.date.substring(0, 7) === periodMonth
      ) {
        const cat = t.category || 'Outros';
        map.set(cat, (map.get(cat) || 0) + t.amount);
      }
    }
    const arr = Array.from(map.entries()).map(([name, amount]) => ({ name, amount }));
    return arr.sort((a, b) => b.amount - a.amount);
  }, [state.transactions, periodMonth]);

  const totalCategoryExpenses = expensesByCategory.reduce((sum, item) => sum + item.amount, 0);

  // Cores dinâmicas para gráfico de categorias
  const categoryPalette = [
    '#3B82F6', // Blue
    '#EC4899', // Pink
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#6366F1', // Indigo
    '#64748B', // Slate
  ];

  const hasAnyActivity = kpis.monthlyIncome > 0 || kpis.monthlyExpenses > 0;
  const hasAccounts = state.accounts.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* ONBOARDING / SETUP BANNER WHEN NO ACCOUNTS REGISTERED */}
      {!hasAccounts && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl border border-blue-800/60">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-2">
                <Landmark className="w-4 h-4" />
                <span>Primeiros Passos no PH Finance</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Você ainda não cadastrou suas contas bancárias
              </h2>
              <p className="text-xs sm:text-sm text-blue-100/90 max-w-2xl leading-relaxed">
                Cadastre sua primeira conta corrente, poupança ou carteira para que o sistema comece a calcular seu saldo realizado, despesas e fluxo de caixa real.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => onNavigateTab('accounts')}
                className="px-4 py-2.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Conta / Carteira</span>
              </button>
              <button
                onClick={() => openQuickModal('income')}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Receita</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. TOP CARDS: 10 KEY PERFORMANCE INDICATORS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Saldo Atual Realizado */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>1. Saldo Realizado</span>
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatBRL(kpis.currentBalance)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {!hasAccounts ? 'Nenhuma conta cadastrada' : `${state.accounts.length} conta(s) ativa(s)`}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500">Saldo Projetado fim do mês:</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {formatBRL(kpis.projectedEndMonthBalance)}
            </span>
          </div>
        </div>

        {/* KPI 2 & 3: Receitas vs Despesas do Mês */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>2 & 3. Receitas x Despesas</span>
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="my-2 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> Receitas
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-white">
                {formatBRL(kpis.monthlyIncome)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5" /> Despesas
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-white">
                {formatBRL(kpis.monthlyExpenses)}
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500">Resultado do mês:</span>
            <span
              className={`font-bold ${
                kpis.accumulatedSavings >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {formatBRL(kpis.accumulatedSavings)}
            </span>
          </div>
        </div>

        {/* KPI 5 & 8: Contas Pendentes & Saldo Pós-Compromissos */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>5 & 8. Contas Pendentes</span>
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatBRL(kpis.pendingBillsTotal)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {pendingBills.length === 0 ? 'Nenhum compromisso pendente' : `${pendingBills.length} compromisso(s) em aberto`}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500">Livre pós-contas:</span>
            <span
              className={`font-bold ${
                kpis.availableAfterCommitments >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {formatBRL(kpis.availableAfterCommitments)}
            </span>
          </div>
        </div>

        {/* KPI 6 & 10: Dívidas & Taxa de Poupança */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>6 & 10. Dívidas & Poupança</span>
            <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="my-2 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Taxa de Poupança:</span>
              <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
                {kpis.savingsRate !== null ? `${kpis.savingsRate.toFixed(1)}%` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Total em Dívidas:</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {formatBRL(kpis.openDebtsTotal)}
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500">Custos fixos alocados:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {formatBRL(kpis.fixedExpensesCommitted)}
            </span>
          </div>
        </div>
      </div>

      {/* OVERDUE BILLS ALERT BANNER (Se houver contas vencidas) */}
      {overdueBills.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-600 text-white shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                Atenção: {overdueBills.length} conta(s) com vencimento ultrapassado!
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">
                Total pendente em atraso:{' '}
                <strong>
                  {formatBRL(overdueBills.reduce((acc, b) => acc + b.amount, 0))}
                </strong>
                . Elas não foram debitadas do saldo bancário ainda.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('bills')}
            className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors shrink-0"
          >
            Ver e Quitar Contas
          </button>
        </div>
      )}

      {/* 2. MAIN CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico 1: Receitas x Despesas Comparativo */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Fluxo Mensal: Receitas versus Despesas
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comparativo de entradas e saídas realizadas no mês ({formatMonthYear(periodMonth)})
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('reports')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
              >
                <span>Relatório Completo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* ESTADO VAZIO INFORMATIVO SE NÃO HOUVER RECEITAS NEM DESPESAS */}
            {!hasAnyActivity ? (
              <div className="py-10 px-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 my-2">
                <FolderPlus className="w-10 h-10 text-slate-400 mx-auto mb-2.5" />
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Nenhuma movimentação realizada em {formatMonthYear(periodMonth)}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4">
                  Cadastre suas receitas e despesas reais para visualizar as barras comparativas de execução financeira e poupança.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => openQuickModal('income')}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                  >
                    + Adicionar Receita
                  </button>
                  <button
                    onClick={() => openQuickModal('expense')}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors"
                  >
                    + Registrar Despesa
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-emerald-700 dark:text-emerald-400">
                      Receitas Realizadas: {formatBRL(kpis.monthlyIncome)}
                    </span>
                    <span className="text-slate-500">100% da base</span>
                  </div>
                  <div className="w-full h-5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                      style={{
                        width: `${Math.min(
                          100,
                          kpis.monthlyIncome > 0
                            ? (kpis.monthlyIncome / (Math.max(kpis.monthlyIncome, kpis.monthlyExpenses) || 1)) * 100
                            : 0
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-rose-700 dark:text-rose-400">
                      Despesas Realizadas: {formatBRL(kpis.monthlyExpenses)}
                    </span>
                    <span className="text-slate-500">
                      {kpis.monthlyIncome > 0
                        ? `${((kpis.monthlyExpenses / kpis.monthlyIncome) * 100).toFixed(1)}% da renda`
                        : '—'}
                    </span>
                  </div>
                  <div className="w-full h-5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-rose-500 transition-all duration-700"
                      style={{
                        width: `${Math.min(
                          100,
                          kpis.monthlyExpenses > 0
                            ? (kpis.monthlyExpenses / (Math.max(kpis.monthlyIncome, kpis.monthlyExpenses) || 1)) * 100
                            : 0
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Balanço e economia */}
                <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-500 block">Poupança Líquida no Mês</span>
                    <span
                      className={`text-lg font-black ${
                        kpis.accumulatedSavings >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {formatBRL(kpis.accumulatedSavings)}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 block">Comprometido com Fixos</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {formatBRL(kpis.fixedExpensesCommitted)}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 block">Contas Previstas a Entrar</span>
                    <span className="text-sm font-bold text-emerald-600">
                      +{formatBRL(kpis.pendingIncomeTotal)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Gráfico 2: Despesas por Categoria */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-blue-600" />
                <span>Despesas por Categoria</span>
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                Total: {formatBRL(totalCategoryExpenses)}
              </span>
            </div>

            {expensesByCategory.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Nenhuma despesa realizada neste período.
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {expensesByCategory.slice(0, 5).map((cat, idx) => {
                  const percent =
                    totalCategoryExpenses > 0
                      ? (cat.amount / totalCategoryExpenses) * 100
                      : 0;
                  const color = categoryPalette[idx % categoryPalette.length];
                  return (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          {cat.name}
                        </span>
                        <span className="text-slate-500 font-medium">
                          {formatBRL(cat.amount)} ({percent.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('budget')}
            className="w-full mt-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Gerenciar Orçamento por Categoria
          </button>
        </div>
      </div>

      {/* 3. ROW: PRÓXIMAS CONTAS A VENCER & METAS FINANCEIRAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas Contas a Pagar */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Próximas Contas a Vencer
              </h3>
            </div>
            {pendingBills.length > 0 && (
              <button
                onClick={() => onNavigateTab('bills')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Ver todas ({pendingBills.length})
              </button>
            )}
          </div>

          {upcomingBills.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Nenhuma conta pendente para os próximos dias.
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingBills.map((bill) => {
                const days = getDaysDiff(bill.expectedDate || bill.date);
                return (
                  <div
                    key={bill.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {bill.description}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>Vence: {formatDate(bill.expectedDate || bill.date)}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 font-medium">
                          {days === 0 ? 'Vence hoje' : days === 1 ? 'Amanhã' : `Em ${days} dias`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {formatBRL(bill.amount)}
                      </span>
                      <button
                        onClick={() => markTransactionAsPaid(bill.id)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center gap-1"
                        title="Marcar como paga"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Pagar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Metas Financeiras com Barra de Progresso */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Metas & Reserva de Emergência
              </h3>
            </div>
            {state.goals.length > 0 && (
              <button
                onClick={() => onNavigateTab('goals')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Ver todas ({state.goals.length})
              </button>
            )}
          </div>

          {state.goals.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <p>Nenhuma meta financeira cadastrada.</p>
              <button
                onClick={() => onNavigateTab('goals')}
                className="mt-2 text-xs font-bold text-blue-600 hover:underline"
              >
                + Criar Primeira Meta
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {state.goals.slice(0, 3).map((goal) => {
                const percent = Math.min(
                  100,
                  goal.targetAmount > 0
                    ? (goal.currentAmount / goal.targetAmount) * 100
                    : 0
                );
                return (
                  <div key={goal.id} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {goal.title}
                      </span>
                      <span className="font-semibold text-slate-500">
                        {formatBRL(goal.currentAmount)} / {formatBRL(goal.targetAmount)}
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>{percent.toFixed(1)}% concluído</span>
                      <span>Alvo: {formatDate(goal.targetDate)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 4. ÚLTIMAS TRANSAÇÕES RECENTES */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Últimas Transações Registradas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Extrato recente ordenado por data
            </p>
          </div>
          {state.transactions.length > 0 && (
            <button
              onClick={() => onNavigateTab('transactions')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
            >
              <span>Extrato Completo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-slate-100 dark:border-slate-800 font-semibold uppercase tracking-wider">
              <tr>
                <th className="pb-3">Data</th>
                <th className="pb-3">Descrição</th>
                <th className="pb-3">Categoria</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {state.transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Nenhuma transação cadastrada ainda. Use o botão &quot;+ Novo Lançamento&quot; acima para registrar sua primeira receita ou despesa.
                  </td>
                </tr>
              ) : (
                state.transactions.slice(0, 6).map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 text-slate-500">{formatDate(tx.date)}</td>
                    <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                      {tx.description}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">
                      {tx.category} {tx.subcategory ? `• ${tx.subcategory}` : ''}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          tx.status === 'realizada'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td
                      className={`py-3 text-right font-bold ${
                        tx.type === 'income'
                          ? 'text-emerald-600'
                          : tx.type === 'expense'
                          ? 'text-rose-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                      {formatBRL(tx.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
