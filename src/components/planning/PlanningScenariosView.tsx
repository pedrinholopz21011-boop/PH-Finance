import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Sliders,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  PieChart,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatBRL, roundMoney } from '../../utils/formatters';

export const PlanningScenariosView: React.FC = () => {
  const { kpis, state } = useFinance();

  // What-If Simulation Controls
  const [incomeAdjustment, setIncomeAdjustment] = useState<number>(0); // % de aumento/queda de renda
  const [expenseCutPercent, setExpenseCutPercent] = useState<number>(0); // % de corte em despesas variáveis
  const [extraMonthlyExpense, setExtraMonthlyExpense] = useState<number>(0); // Ex: nova assinatura ou parcela
  const [extraMonthlyIncome, setExtraMonthlyIncome] = useState<number>(0); // Ex: novo freelance

  const currentMonthlyIncome = kpis.monthlyIncome || 5000;
  const currentMonthlyExpense = kpis.monthlyExpenses || 3500;
  const baseMonthlyNet = currentMonthlyIncome - currentMonthlyExpense;

  // Simulated numbers
  const simulatedMonthlyIncome = roundMoney(
    currentMonthlyIncome * (1 + incomeAdjustment / 100) + extraMonthlyIncome
  );
  const simulatedMonthlyExpense = roundMoney(
    currentMonthlyExpense * (1 - expenseCutPercent / 100) + extraMonthlyExpense
  );
  const simulatedMonthlyNet = roundMoney(simulatedMonthlyIncome - simulatedMonthlyExpense);
  const simulatedSavingsRate =
    simulatedMonthlyIncome > 0
      ? roundMoney((simulatedMonthlyNet / simulatedMonthlyIncome) * 100)
      : 0;

  // Projections for 1, 3, 6, and 12 months
  const projectionMonths = [
    { label: 'Fim do Mês Atual (1M)', months: 1 },
    { label: 'Em 3 Meses', months: 3 },
    { label: 'Em 6 Meses', months: 6 },
    { label: 'Em 12 Meses (1 Ano)', months: 12 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Planejamento Financeiro & Projeções Futuras
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Simule cenários hipotéticos independentes dos seus dados reais e projete seu caixa para 3, 6 e 12 meses
          </p>
        </div>
      </div>

      {/* Baseline vs Simulated Comparison Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Cenário Real Atual */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Cenário Real Vigente
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
              Dados Registrados
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block">Receitas Médias:</span>
              <span className="font-bold text-emerald-600 text-sm">
                {formatBRL(currentMonthlyIncome)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Despesas Médias:</span>
              <span className="font-bold text-rose-600 text-sm">
                {formatBRL(currentMonthlyExpense)}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-500">Poupança Mensal:</span>
            <span
              className={`text-base font-black ${
                baseMonthlyNet >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {formatBRL(baseMonthlyNet)} / mês
            </span>
          </div>
        </div>

        {/* Cenário Simulado */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-950 text-white shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Cenário Simulado (What-If)</span>
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 font-semibold border border-blue-400/30">
              Simulação Dinâmica
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-blue-300 block">Receitas Simuladas:</span>
              <span className="font-bold text-emerald-300 text-sm">
                {formatBRL(simulatedMonthlyIncome)}
              </span>
            </div>
            <div>
              <span className="text-blue-300 block">Despesas Simuladas:</span>
              <span className="font-bold text-rose-300 text-sm">
                {formatBRL(simulatedMonthlyExpense)}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs">
            <span className="text-blue-200">Nova Poupança Projetada:</span>
            <span
              className={`text-base font-black ${
                simulatedMonthlyNet >= 0 ? 'text-emerald-300' : 'text-rose-300'
              }`}
            >
              {formatBRL(simulatedMonthlyNet)} / mês ({simulatedSavingsRate.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Simulator Sliders & Controls */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-blue-600" />
          <span>Ajuste os Parâmetros da Simulação</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Slider 1: Renda */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">
                Ajuste na Renda Mensal (% de aumento ou queda)
              </span>
              <span
                className={`font-bold ${
                  incomeAdjustment > 0
                    ? 'text-emerald-600'
                    : incomeAdjustment < 0
                    ? 'text-rose-600'
                    : 'text-slate-500'
                }`}
              >
                {incomeAdjustment > 0 ? `+${incomeAdjustment}%` : `${incomeAdjustment}%`}
              </span>
            </div>
            <input
              type="range"
              min={-30}
              max={50}
              step={5}
              value={incomeAdjustment}
              onChange={(e) => setIncomeAdjustment(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>-30%</span>
              <span>0% (Sem alteração)</span>
              <span>+50%</span>
            </div>
          </div>

          {/* Slider 2: Despesas */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">
                Redução / Corte em Despesas Variáveis
              </span>
              <span className="font-bold text-emerald-600">
                {expenseCutPercent > 0 ? `-${expenseCutPercent}% economia` : '0% (Atual)'}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              step={5}
              value={expenseCutPercent}
              onChange={(e) => setExpenseCutPercent(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>0%</span>
              <span>15% (Corte moderado)</span>
              <span>40% (Austeridade)</span>
            </div>
          </div>

          {/* Input 3: Nova despesa fixa */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nova Despesa Mensal Extra (R$) (ex: Parcela de Carro, Assinatura)
            </label>
            <input
              type="number"
              min={0}
              step={50}
              value={extraMonthlyExpense}
              onChange={(e) => setExtraMonthlyExpense(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              placeholder="0,00"
            />
          </div>

          {/* Input 4: Renda extra fixa */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nova Renda Recorrente Extra (R$) (ex: Freelance fixo, Aluguel)
            </label>
            <input
              type="number"
              min={0}
              step={50}
              value={extraMonthlyIncome}
              onChange={(e) => setExtraMonthlyIncome(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              placeholder="0,00"
            />
          </div>
        </div>
      </div>

      {/* Projections Matrix Table: 1M, 3M, 6M, 12M */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Projeção de Acúmulo de Capital nos Próximos Meses
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Comparativo do patrimônio acumulado no ritmo atual versus ritmo simulado
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {projectionMonths.map((p) => {
            const baseAccumulated = roundMoney(kpis.currentBalance + baseMonthlyNet * p.months);
            const simulatedAccumulated = roundMoney(
              kpis.currentBalance + simulatedMonthlyNet * p.months
            );
            const diff = roundMoney(simulatedAccumulated - baseAccumulated);

            return (
              <div
                key={p.months}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-2"
              >
                <span className="font-bold text-xs text-slate-500 uppercase tracking-wider block">
                  {p.label}
                </span>

                <div>
                  <span className="text-[11px] text-slate-400 block">Saldo no Ritmo Atual:</span>
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    {formatBRL(baseAccumulated)}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-blue-500 font-semibold block">
                    Saldo no Ritmo Simulado:
                  </span>
                  <span className="font-black text-base text-blue-600 dark:text-blue-400">
                    {formatBRL(simulatedAccumulated)}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] flex justify-between">
                  <span className="text-slate-400">Diferença:</span>
                  <span
                    className={`font-bold ${
                      diff >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {diff >= 0 ? `+${formatBRL(diff)}` : formatBRL(diff)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
