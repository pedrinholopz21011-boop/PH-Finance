import React, { useState, useMemo } from 'react';
import {
  FileBarChart,
  Download,
  Printer,
  PieChart,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatBRL, formatDate, formatMonthYear, roundMoney } from '../../utils/formatters';
import { exportTransactionsToCSV } from '../../services/storage';
import { calculatePeriodCashFlow } from '../../utils/accounting';

export const ReportsView: React.FC = () => {
  const { state, periodMonth, setPeriodMonth, kpis } = useFinance();

  const [accountingRegime, setAccountingRegime] = useState<'competencia' | 'caixa'>('competencia');

  // Breakdown Fixas vs Variáveis
  const natureBreakdown = useMemo(() => {
    let fixed = 0;
    let variable = 0;
    let essential = 0;
    let nonEssential = 0;

    state.transactions.forEach((t) => {
      if (t.type === 'expense' && t.status === 'realizada' && t.date.substring(0, 7) === periodMonth) {
        if (t.expenseNature === 'fixa') fixed += t.amount;
        else variable += t.amount;

        if (t.expenseNature === 'essencial' || t.expenseNature === 'fixa') essential += t.amount;
        else nonEssential += t.amount;
      }
    });

    return {
      fixed: roundMoney(fixed),
      variable: roundMoney(variable),
      essential: roundMoney(essential),
      nonEssential: roundMoney(nonEssential),
    };
  }, [state.transactions, periodMonth]);

  // Breakdown por Categoria no mês
  const categorySummary = useMemo(() => {
    const map = new Map<string, number>();
    state.transactions.forEach((t) => {
      if (t.type === 'expense' && t.status === 'realizada' && t.date.substring(0, 7) === periodMonth) {
        map.set(t.category, (map.get(t.category) || 0) + t.amount);
      }
    });
    return Array.from(map.entries())
      .map(([category, amount]) => ({ category, amount: roundMoney(amount) }))
      .sort((a, b) => b.amount - a.amount);
  }, [state.transactions, periodMonth]);

  const totalSpentMonth = categorySummary.reduce((acc, c) => acc + c.amount, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Relatórios Financeiros & Análise Gerencial
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Demonstrativos completos por regime contábil, categorias e natureza dos gastos
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Regime Selector */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-slate-700">
            <button
              onClick={() => setAccountingRegime('competencia')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                accountingRegime === 'competencia'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Regime de Competência
            </button>
            <button
              onClick={() => setAccountingRegime('caixa')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                accountingRegime === 'caixa'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Regime de Caixa
            </button>
          </div>

          <button
            onClick={() => exportTransactionsToCSV(state.transactions, state.accounts)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-xs"
            title="Exportar CSV com delimitador ; para Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md hover:bg-slate-800 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Regime Definition Note */}
      <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5 print:hidden">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Regime Contábil Selecionado: </span>
          {accountingRegime === 'competencia'
            ? 'Regime de Competência — Reconhece as despesas e receitas na data em que o fato gerador ocorreu (ex: compras no cartão entram no mês da compra, permitindo apuração precisa do orçamento sem duplicar pagamentos de fatura).'
            : 'Regime de Caixa — Reconhece apenas as entradas e saídas financeiras efetivas nas contas bancárias (ex: compras parceladas debitam apenas no dia do pagamento da fatura).'}
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block border-b pb-4 mb-4">
        <h1 className="text-2xl font-black">PH Finance — Relatório Gerencial</h1>
        <p className="text-sm text-slate-600">
          Período: {formatMonthYear(periodMonth)} • Regime:{' '}
          {accountingRegime === 'competencia' ? 'Competência' : 'Caixa'}
        </p>
      </div>

      {/* 1. Summary Demonstrativo */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Demonstrativo do Resultado do Período ({formatMonthYear(periodMonth)})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 text-xs font-semibold uppercase block">
              Receitas Realizadas
            </span>
            <div className="text-xl font-black text-emerald-600 mt-1">
              +{formatBRL(kpis.monthlyIncome)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 text-xs font-semibold uppercase block">
              Despesas Realizadas
            </span>
            <div className="text-xl font-black text-rose-600 mt-1">
              -{formatBRL(kpis.monthlyExpenses)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 text-xs font-semibold uppercase block">
              Superávit / Poupança Líquida
            </span>
            <div
              className={`text-xl font-black mt-1 ${
                kpis.accumulatedSavings >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {formatBRL(kpis.accumulatedSavings)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 text-xs font-semibold uppercase block">
              Taxa de Poupança
            </span>
            <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
              {kpis.savingsRate !== null ? `${kpis.savingsRate.toFixed(1)}%` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Categorias & Natureza dos Gastos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Despesas Fixas vs Variáveis */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Estrutura de Custos: Fixos vs Variáveis
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Despesas Fixas (Compromissos essenciais)</span>
                <span className="font-bold">{formatBRL(natureBreakdown.fixed)}</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{
                    width: `${
                      totalSpentMonth > 0 ? (natureBreakdown.fixed / totalSpentMonth) * 100 : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Despesas Variáveis (Consumo flexível)</span>
                <span className="font-bold">{formatBRL(natureBreakdown.variable)}</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{
                    width: `${
                      totalSpentMonth > 0 ? (natureBreakdown.variable / totalSpentMonth) * 100 : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
            <strong>Critério 50/30/20:</strong> Idealmente, seus custos fixos e essenciais devem
            representar até 50% da sua renda líquida mensal para garantir flexibilidade e segurança.
          </div>
        </div>

        {/* Detalhamento por Categoria */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Distribuição de Gastos por Categoria
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {categorySummary.map((cat) => {
              const percent = totalSpentMonth > 0 ? (cat.amount / totalSpentMonth) * 100 : 0;
              return (
                <div key={cat.category} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {cat.category}
                    </span>
                    <span className="text-slate-400">({percent.toFixed(1)}%)</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatBRL(cat.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
