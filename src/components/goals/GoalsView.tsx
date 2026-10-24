import React, { useState } from 'react';
import {
  Target,
  Plus,
  ShieldCheck,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit2,
  Coins,
  ArrowRight,
  PiggyBank,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { FinancialGoal, GoalCategory } from '../../types/finance';
import { formatBRL, formatDate, getDaysDiff, roundMoney } from '../../utils/formatters';

export const GoalsView: React.FC = () => {
  const { state, addGoal, updateGoal, deleteGoal, contributeToGoal, activeAccounts, kpis } =
    useFinance();

  const [modalOpen, setModalOpen] = useState(false);
  const [contributeModalOpen, setContributeModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GoalCategory>('emergency_fund');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('2027-12-31');
  const [priority, setPriority] = useState<'baixa' | 'media' | 'alta'>('alta');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [notes, setNotes] = useState('');

  // Contribution form
  const [contribAmount, setContribAmount] = useState('');
  const [fromAccount, setFromAccount] = useState(activeAccounts[0]?.id || '');

  // Reserva de emergência calculada: N meses de despesas fixas/essenciais
  const essentialMonthlyExpenses = kpis.fixedExpensesCommitted || 2000;
  const targetEmergencyMonths = state.preferences.emergencyFundTargetMonths || 6;
  const recommendedEmergencyFund = roundMoney(essentialMonthlyExpenses * targetEmergencyMonths);

  const handleOpenNew = () => {
    setEditingGoal(null);
    setTitle('');
    setCategory('emergency_fund');
    setTargetAmount(recommendedEmergencyFund.toString());
    setCurrentAmount('0');
    setTargetDate('2027-12-31');
    setPriority('alta');
    setMonthlyContribution('500');
    setNotes('');
    setModalOpen(true);
  };

  const handleOpenEdit = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setCategory(goal.category);
    setTargetAmount(goal.targetAmount.toString());
    setCurrentAmount(goal.currentAmount.toString());
    setTargetDate(goal.targetDate);
    setPriority(goal.priority);
    setMonthlyContribution(goal.monthlyPlannedContribution.toString());
    setNotes(goal.notes || '');
    setModalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const targetNum = parseFloat(targetAmount.replace(',', '.')) || 1000;
    const currentNum = parseFloat(currentAmount.replace(',', '.')) || 0;
    const monthlyNum = parseFloat(monthlyContribution.replace(',', '.')) || 100;

    if (editingGoal) {
      updateGoal(editingGoal.id, {
        title: title.trim(),
        category,
        targetAmount: roundMoney(targetNum),
        currentAmount: roundMoney(currentNum),
        targetDate,
        priority,
        monthlyPlannedContribution: roundMoney(monthlyNum),
        notes: notes.trim(),
      });
    } else {
      addGoal({
        title: title.trim(),
        category,
        targetAmount: roundMoney(targetNum),
        currentAmount: roundMoney(currentNum),
        targetDate,
        priority,
        monthlyPlannedContribution: roundMoney(monthlyNum),
        notes: notes.trim(),
      });
    }
    setModalOpen(false);
  };

  const handleOpenContribute = (goal: FinancialGoal) => {
    setSelectedGoal(goal);
    setContribAmount(goal.monthlyPlannedContribution.toString());
    setFromAccount(activeAccounts[0]?.id || '');
    setContributeModalOpen(true);
  };

  const handleConfirmContribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    const amt = parseFloat(contribAmount.replace(',', '.')) || 0;
    if (amt <= 0) return;

    contributeToGoal(selectedGoal.id, amt, fromAccount);
    setContributeModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Metas Financeiras & Reserva de Emergência
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Acompanhe o acúmulo de patrimônio para seus sonhos e construa seu colchão de segurança
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Nova Meta</span>
        </button>
      </div>

      {/* Emergency Fund Highlight Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-900 to-teal-950 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Cálculo Recomendado: Reserva de Emergência</span>
          </span>
          <h3 className="text-2xl font-black tracking-tight">
            Alvo: {formatBRL(recommendedEmergencyFund)} ({targetEmergencyMonths} Meses de Despesas)
          </h3>
          <p className="text-xs text-emerald-100/80 max-w-xl">
            Com base nos seus custos essenciais cadastrados de{' '}
            <strong>{formatBRL(essentialMonthlyExpenses)}/mês</strong>, sua reserva ideal para
            segurança profissional e familiar é calculada automaticamente.
          </p>
        </div>

        <button
          onClick={() => {
            setTitle(`Reserva de Emergência (${targetEmergencyMonths} Meses)`);
            setCategory('emergency_fund');
            setTargetAmount(recommendedEmergencyFund.toString());
            setCurrentAmount('0');
            setPriority('alta');
            setModalOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-white text-emerald-950 hover:bg-emerald-50 text-xs font-bold shadow-md transition-all shrink-0"
        >
          Definir Como Meta Principal
        </button>
      </div>

      {/* Goals Grid or Empty State */}
      {state.goals.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 max-w-xl mx-auto">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Target className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Nenhuma meta financeira cadastrada
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Crie suas metas de curto, médio ou longo prazo (Reserva de Emergência, Viagens, Aposentadoria) para acompanhar a evolução dos seus aportes.
            </p>
          </div>
          <div className="pt-2 flex justify-center">
            <button
              onClick={handleOpenNew}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Primeira Meta</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {state.goals.map((goal) => {
          const percent = Math.min(
            100,
            goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
          );
          const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);

          // Cálculo do prazo com base na contribuição mensal
          const monthsNeeded =
            goal.monthlyPlannedContribution > 0
              ? Math.ceil(remainingAmount / goal.monthlyPlannedContribution)
              : null;

          return (
            <div
              key={goal.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        goal.priority === 'alta'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                          : goal.priority === 'media'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                      }`}
                    >
                      Prioridade {goal.priority}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                      {goal.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(goal)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Excluir meta "${goal.title}"?`)) {
                          deleteGoal(goal.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="my-3 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-900 dark:text-white font-black text-base">
                      {formatBRL(goal.currentAmount)}
                    </span>
                    <span className="text-slate-400 font-medium">
                      Alvo: {formatBRL(goal.targetAmount)}
                    </span>
                  </div>

                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span className="font-bold text-emerald-600">{percent.toFixed(1)}% concluído</span>
                    <span>Falta: {formatBRL(remainingAmount)}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs flex justify-between items-center">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Aporte Mensal:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatBRL(goal.monthlyPlannedContribution)} / mês
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[11px]">Estimativa:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {monthsNeeded ? `${monthsNeeded} meses restantes` : 'Definir aporte'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500">Data-alvo: {formatDate(goal.targetDate)}</span>
                <button
                  onClick={() => handleOpenContribute(goal)}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Aportar Valor</span>
                </button>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Modal: New / Edit Goal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              {editingGoal ? 'Editar Meta Financeira' : 'Nova Meta Financeira'}
            </h3>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Nome do Objetivo *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Reserva de Emergência, Comprar Carro, Viagem de Férias"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as GoalCategory)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="emergency_fund">Reserva de Emergência</option>
                    <option value="car">Veículo / Carro / Moto</option>
                    <option value="house">Imóvel / Casa Própria</option>
                    <option value="trip">Viagem e Férias</option>
                    <option value="tech">Equipamentos e Tecnologia</option>
                    <option value="debt_payoff">Quitação de Dívidas</option>
                    <option value="investment">Investimentos e Liberdade</option>
                    <option value="other">Outra Meta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Média</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Valor Alvo (R$) *
                  </label>
                  <input
                    type="text"
                    placeholder="20000,00"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Já Acumulado (R$)
                  </label>
                  <input
                    type="text"
                    placeholder="0,00"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Data-Alvo Prevista
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Aporte Mensal Planejado (R$)
                  </label>
                  <input
                    type="text"
                    placeholder="500,00"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
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
                  Salvar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Contribute to Goal */}
      {contributeModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Coins className="w-5 h-5 text-blue-600" />
              <span>Registrar Aporte na Meta</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Destine um valor para aproximar-se do objetivo &quot;{selectedGoal.title}&quot;.
            </p>

            <form onSubmit={handleConfirmContribute} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Valor do Aporte (R$) *
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="0,00"
                  value={contribAmount}
                  onChange={(e) => setContribAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Conta de Origem do Dinheiro
                </label>
                <select
                  value={fromAccount}
                  onChange={(e) => setFromAccount(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  {activeAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Saldo: {formatBRL(a.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setContributeModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors"
                >
                  Confirmar Aporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
