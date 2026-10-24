import React, { useState } from 'react';
import {
  BadgePercent,
  Plus,
  TrendingDown,
  Calculator,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit2,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Debt, DebtType } from '../../types/finance';
import { formatBRL, formatDate, getTodayDateString, roundMoney } from '../../utils/formatters';

export const DebtsView: React.FC = () => {
  const { state, addDebt, updateDebt, deleteDebt, payDebtInstallment, activeAccounts } =
    useFinance();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  // Amortization simulator state
  const [extraPaymentSim, setExtraPaymentSim] = useState<number>(300);
  const [simulationStrategy, setSimulationStrategy] = useState<'avalanche' | 'snowball'>('avalanche');

  // Pay installment modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedDebtToPay, setSelectedDebtToPay] = useState<Debt | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payAccount, setPayAccount] = useState(activeAccounts[0]?.id || '');

  // Form fields
  const [creditor, setCreditor] = useState('');
  const [type, setType] = useState<DebtType>('financiamento_carro');
  const [originalAmount, setOriginalAmount] = useState('');
  const [remainingBalance, setRemainingBalance] = useState('');
  const [interestRate, setInterestRate] = useState('14.8');
  const [totalInstallments, setTotalInstallments] = useState(48);
  const [paidInstallments, setPaidInstallments] = useState(12);
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [dueDay, setDueDay] = useState(15);
  const [notes, setNotes] = useState('');

  const totalDebts = state.debts.reduce((acc, d) => acc + d.remainingBalance, 0);
  const totalMonthlyInstallments = state.debts.reduce((acc, d) => acc + d.installmentAmount, 0);

  const handleOpenNew = () => {
    setEditingDebt(null);
    setCreditor('');
    setType('emprestimo_pessoal');
    setOriginalAmount('');
    setRemainingBalance('');
    setInterestRate('12.5');
    setTotalInstallments(24);
    setPaidInstallments(0);
    setInstallmentAmount('');
    setDueDay(10);
    setNotes('');
    setModalOpen(true);
  };

  const handleOpenEdit = (debt: Debt) => {
    setEditingDebt(debt);
    setCreditor(debt.creditor);
    setType(debt.type);
    setOriginalAmount(debt.originalAmount.toString());
    setRemainingBalance(debt.remainingBalance.toString());
    setInterestRate(debt.interestRateAnnual?.toString() || '0');
    setTotalInstallments(debt.totalInstallments);
    setPaidInstallments(debt.paidInstallments);
    setInstallmentAmount(debt.installmentAmount.toString());
    setDueDay(debt.dueDay);
    setNotes(debt.notes || '');
    setModalOpen(true);
  };

  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditor.trim()) return;

    const orig = parseFloat(originalAmount.replace(',', '.')) || 0;
    const remain = parseFloat(remainingBalance.replace(',', '.')) || orig;
    const instAmt = parseFloat(installmentAmount.replace(',', '.')) || roundMoney(remain / Math.max(1, totalInstallments - paidInstallments));
    const rate = parseFloat(interestRate.replace(',', '.')) || 0;

    if (editingDebt) {
      updateDebt(editingDebt.id, {
        creditor: creditor.trim(),
        type,
        originalAmount: roundMoney(orig),
        remainingBalance: roundMoney(remain),
        interestRateAnnual: rate,
        totalInstallments: Number(totalInstallments),
        paidInstallments: Number(paidInstallments),
        installmentAmount: roundMoney(instAmt),
        dueDay: Number(dueDay),
        notes: notes.trim(),
      });
    } else {
      addDebt({
        creditor: creditor.trim(),
        type,
        originalAmount: roundMoney(orig),
        remainingBalance: roundMoney(remain),
        interestRateAnnual: rate,
        totalInstallments: Number(totalInstallments),
        paidInstallments: Number(paidInstallments),
        installmentAmount: roundMoney(instAmt),
        dueDay: Number(dueDay),
        startDate: getTodayDateString(),
        estimatedEndDate: '2028-12-31',
        notes: notes.trim(),
      });
    }
    setModalOpen(false);
  };

  const handleOpenPayInstallment = (debt: Debt) => {
    setSelectedDebtToPay(debt);
    setPayAmount(debt.installmentAmount.toString());
    setPayAccount(activeAccounts[0]?.id || '');
    setPayModalOpen(true);
  };

  const handleConfirmPayInstallment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtToPay) return;
    const amt = parseFloat(payAmount.replace(',', '.')) || selectedDebtToPay.installmentAmount;
    payDebtInstallment(selectedDebtToPay.id, amt, payAccount);
    setPayModalOpen(false);
  };

  // Strategies ranking
  const rankedDebts = [...state.debts].sort((a, b) => {
    if (simulationStrategy === 'avalanche') {
      // Prioridade: Maior taxa de juros anual
      return (b.interestRateAnnual || 0) - (a.interestRateAnnual || 0);
    } else {
      // Prioridade: Menor saldo devedor restante (Bola de neve)
      return a.remainingBalance - b.remainingBalance;
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Dívidas, Financiamentos & Quitação
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Acompanhe o saldo devedor, parcelas restantes e simule amortizações antecipadas
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Dívida / Financiamento</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Saldo Devedor Total
          </span>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {formatBRL(totalDebts)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">{state.debts.length} contratos ativos</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Compromisso Mensal em Parcelas
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatBRL(totalMonthlyInstallments)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Soma das parcelas que vencem este mês</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Economia com Amortização Extra
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            ~15% a 35% de Juros
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Estimativa ao antecipar parcelas do fim</p>
        </div>
      </div>

      {/* Debts List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Contratos Cadastrados
        </h3>

        {state.debts.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
            Parabéns! Você não possui nenhuma dívida ou financiamento registrado.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.debts.map((debt) => {
              const remainingInstallments = Math.max(0, debt.totalInstallments - debt.paidInstallments);
              const progressPercent =
                debt.totalInstallments > 0
                  ? (debt.paidInstallments / debt.totalInstallments) * 100
                  : 0;

              return (
                <div
                  key={debt.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {debt.creditor}
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          {debt.type.replace('_', ' ')} • Juros:{' '}
                          {debt.interestRateAnnual ? `${debt.interestRateAnnual}% a.a.` : 'N/I'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(debt)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Excluir dívida com "${debt.creditor}"?`)) {
                              deleteDebt(debt.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 my-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Saldo Devedor:</span>
                        <span className="font-black text-rose-600 text-sm">
                          {formatBRL(debt.remainingBalance)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Valor Parcela:</span>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {formatBRL(debt.installmentAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar of Installments */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                        <span>
                          {debt.paidInstallments} de {debt.totalInstallments} parcelas pagas
                        </span>
                        <span>{remainingInstallments} restantes</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Vencimento: Todo dia {debt.dueDay}
                    </span>
                    <button
                      onClick={() => handleOpenPayInstallment(debt)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Pagar Parcela</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Amortization Strategy Simulator (Avalanche vs Bola de Neve) */}
      {state.debts.length > 0 && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-blue-950 text-white shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-400" />
                <span>Simulador de Estratégias de Quitação Antecipada</span>
              </h3>
              <p className="text-xs text-blue-200 mt-0.5">
                Compare as estratégias Avalanche e Bola de Neve para eliminar dívidas com rapidez
              </p>
            </div>

            <div className="flex rounded-xl bg-white/10 p-1 border border-white/10">
              <button
                onClick={() => setSimulationStrategy('avalanche')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  simulationStrategy === 'avalanche' ? 'bg-blue-600 text-white' : 'text-blue-200'
                }`}
              >
                Método Avalanche (Maior Juros)
              </button>
              <button
                onClick={() => setSimulationStrategy('snowball')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  simulationStrategy === 'snowball' ? 'bg-blue-600 text-white' : 'text-blue-200'
                }`}
              >
                Bola de Neve (Menor Saldo)
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-blue-200">
                  {simulationStrategy === 'avalanche'
                    ? '🎯 O Método Avalanche ataca primeiro as dívidas com a maior taxa de juros anual, maximizando o dinheiro economizado.'
                    : '⚡ O Método Bola de Neve quita primeiro as menores dívidas para dar vitórias rápidas e liberar fluxo de caixa.'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span>Aporte Extra Mensal:</span>
                <input
                  type="number"
                  min={50}
                  step={50}
                  value={extraPaymentSim}
                  onChange={(e) => setExtraPaymentSim(Number(e.target.value))}
                  className="w-24 px-2 py-1 rounded bg-white/10 border border-white/20 text-white font-bold"
                />
              </div>
            </div>

            {/* Ranking of priorities */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
                Ordem Recomendada de Pagamento Antecipado:
              </span>
              {rankedDebts.map((d, index) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center font-bold text-[10px]">
                      {index + 1}
                    </span>
                    <span className="font-bold">{d.creditor}</span>
                    <span className="text-blue-200 text-[11px]">
                      ({d.interestRateAnnual ? `${d.interestRateAnnual}% a.a.` : 'Taxa N/I'})
                    </span>
                  </div>
                  <span className="font-bold text-emerald-400">
                    Saldo: {formatBRL(d.remainingBalance)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: New / Edit Debt */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              {editingDebt ? 'Editar Dívida / Financiamento' : 'Cadastrar Dívida'}
            </h3>

            <form onSubmit={handleSaveDebt} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Credor / Instituição *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Santander Financiamentos, Empréstimo Caixa"
                  value={creditor}
                  onChange={(e) => setCreditor(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Tipo de Obrigação
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as DebtType)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="financiamento_carro">Financiamento Carro</option>
                    <option value="financiamento_moto">Financiamento Moto</option>
                    <option value="financiamento_imobiliario">Financiamento Imobiliário</option>
                    <option value="emprestimo_pessoal">Empréstimo Pessoal</option>
                    <option value="consorcio">Consórcio</option>
                    <option value="divida_pessoal">Dívida Pessoal</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Taxa Juros Anual (% a.a.)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 14.8"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Valor Original (R$)
                  </label>
                  <input
                    type="text"
                    placeholder="30000,00"
                    value={originalAmount}
                    onChange={(e) => setOriginalAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Saldo Devedor Atual (R$) *
                  </label>
                  <input
                    type="text"
                    placeholder="15000,00"
                    value={remainingBalance}
                    onChange={(e) => setRemainingBalance(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Total Parcelas
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(Number(e.target.value))}
                    className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Pagas
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={paidInstallments}
                    onChange={(e) => setPaidInstallments(Number(e.target.value))}
                    className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Dia Venc.
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={dueDay}
                    onChange={(e) => setDueDay(Number(e.target.value))}
                    className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Valor da Parcela Mensal (R$)
                </label>
                <input
                  type="text"
                  placeholder="850,00"
                  value={installmentAmount}
                  onChange={(e) => setInstallmentAmount(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
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
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Pay Installment */}
      {payModalOpen && selectedDebtToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Amortizar Parcela de Financiamento</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Isto registrará a saída de caixa na sua conta e abaterá o saldo devedor do contrato.
            </p>

            <form onSubmit={handleConfirmPayInstallment} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
                <span className="text-slate-400 block">Contrato:</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white block mt-0.5">
                  {selectedDebtToPay.creditor}
                </span>
                <span className="text-slate-500 block mt-1">
                  Parcela {selectedDebtToPay.paidInstallments + 1} de {selectedDebtToPay.totalInstallments}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Valor a Pagar (R$)
                </label>
                <input
                  type="text"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Conta para Débito
                </label>
                <select
                  value={payAccount}
                  onChange={(e) => setPayAccount(e.target.value)}
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
                  onClick={() => setPayModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors"
                >
                  Confirmar Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
