import React, { useState } from 'react';
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Trash2,
  TrendingUp,
  Sliders,
  DollarSign,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { calculateBudgetExecution } from '../../utils/accounting';
import { formatBRL, roundMoney } from '../../utils/formatters';
import { EXPENSE_CATEGORIES } from '../../utils/constants';

export const BudgetView: React.FC = () => {
  const { state, periodMonth, updateBudget, deleteBudget } = useFinance();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState(EXPENSE_CATEGORIES[0].name);
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [alert50, setAlert50] = useState(true);
  const [alert75, setAlert75] = useState(true);
  const [alert90, setAlert90] = useState(true);
  const [alert100, setAlert100] = useState(true);

  // Execução de cada orçamento cadastrado
  const budgetReports = state.budgets.map((b) => {
    return {
      budget: b,
      ...calculateBudgetExecution(b, state.transactions, periodMonth),
    };
  });

  const totalBudgeted = state.budgets.reduce((acc, b) => acc + b.monthlyLimit, 0);
  const totalSpentInBudgets = budgetReports.reduce((acc, r) => acc + r.spent, 0);

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(monthlyLimit.replace(',', '.'));
    if (isNaN(limit) || limit <= 0) return;

    updateBudget(selectedCat, limit, { alert50, alert75, alert90, alert100 });
    setModalOpen(false);
    setMonthlyLimit('');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Orçamento & Limites por Categoria
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Defina tetos mensais de gastos e receba alertas automáticos aos 50%, 75%, 90% e 100%
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Definir Limite de Categoria</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Teto Total Orçado
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatBRL(totalBudgeted)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">{state.budgets.length} categorias monitoradas</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Gasto Realizado Orçado
          </span>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {formatBRL(totalSpentInBudgets)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {totalBudgeted > 0 ? ((totalSpentInBudgets / totalBudgeted) * 100).toFixed(1) : 0}% consumido
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Saldo Restante Livre
          </span>
          <div
            className={`text-2xl font-black mt-1 ${
              totalBudgeted - totalSpentInBudgets >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {formatBRL(totalBudgeted - totalSpentInBudgets)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Disponível até o fim de {periodMonth}</p>
        </div>
      </div>

      {/* Budget List Cards or Empty State */}
      {state.budgets.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 max-w-xl mx-auto">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <PieChart className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Nenhum teto orçamentário definido
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Defina limites mensais para categorias (Alimentação, Moradia, Transporte, Lazer) para receber avisos preventivos e evitar estourar o orçamento.
            </p>
          </div>
          <div className="pt-2 flex justify-center">
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Definir Primeiro Orçamento</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {budgetReports.map((item) => {
          const { budget, spent, remaining, percentage, isExceeded, alertLevel } = item;

          return (
            <div
              key={budget.id}
              className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-xs space-y-4 transition-all ${
                isExceeded
                  ? 'border-rose-400 dark:border-rose-900 ring-2 ring-rose-500/10'
                  : alertLevel === 'warning'
                  ? 'border-amber-300 dark:border-amber-800'
                  : 'border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{budget.category}</span>
                    {isExceeded && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Estourado
                      </span>
                    )}
                  </h3>
                  <span className="text-xs text-slate-500">
                    Limite: {formatBRL(budget.monthlyLimit)} / mês
                  </span>
                </div>

                <button
                  onClick={() => {
                    if (confirm(`Remover orçamento de "${budget.category}"?`)) {
                      deleteBudget(budget.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  title="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-300">
                    Gasto: {formatBRL(spent)}
                  </span>
                  <span
                    className={
                      isExceeded
                        ? 'text-rose-600 font-bold'
                        : percentage >= 80
                        ? 'text-amber-600 font-bold'
                        : 'text-slate-500'
                    }
                  >
                    {percentage.toFixed(1)}%
                  </span>
                </div>

                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isExceeded
                        ? 'bg-rose-500'
                        : percentage >= 85
                        ? 'bg-amber-500'
                        : percentage >= 50
                        ? 'bg-blue-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  />
                </div>
              </div>

              {/* Status footer */}
              <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">
                  {remaining >= 0 ? 'Restante para gastar:' : 'Ultrapassou em:'}
                </span>
                <span
                  className={`font-black ${
                    remaining >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {formatBRL(Math.abs(remaining))}
                </span>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Modal: New / Edit Budget */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Definir Orçamento de Categoria
            </h3>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Selecione a Categoria
                </label>
                <select
                  value={selectedCat}
                  onChange={(e) => setSelectedCat(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Limite Mensal Máximo (R$) *
                </label>
                <input
                  type="text"
                  placeholder="Ex: 800,00"
                  autoFocus
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                  Gatilhos de Notificação e Alerta
                </span>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alert50}
                      onChange={(e) => setAlert50(e.target.checked)}
                      className="rounded accent-blue-600"
                    />
                    <span>Alerta aos 50% atingidos (Informativo)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alert75}
                      onChange={(e) => setAlert75(e.target.checked)}
                      className="rounded accent-blue-600"
                    />
                    <span>Alerta aos 75% atingidos (Atenção)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alert90}
                      onChange={(e) => setAlert90(e.target.checked)}
                      className="rounded accent-blue-600"
                    />
                    <span>Alerta aos 90% atingidos (Crítico)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alert100}
                      onChange={(e) => setAlert100(e.target.checked)}
                      className="rounded accent-blue-600"
                    />
                    <span>Alerta aos 100% atingidos (Estouro do Limite)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors"
                >
                  Salvar Orçamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
