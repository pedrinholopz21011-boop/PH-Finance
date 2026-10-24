import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  Repeat,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction } from '../../types/finance';
import {
  formatBRL,
  formatDate,
  formatMonthYear,
  getTodayDateString,
  isBillOverdue,
  getDaysDiff,
} from '../../utils/formatters';

export const BillsCalendarView: React.FC = () => {
  const {
    state,
    periodMonth,
    setPeriodMonth,
    markTransactionAsPaid,
    confirmRecurringPayment,
    openQuickModal,
    activeAccounts,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'bills' | 'calendar' | 'recurring'>('bills');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all');

  // Selected date in calendar
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(getTodayDateString());

  // Confirm payment modal state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [billToPay, setBillToPay] = useState<Transaction | null>(null);
  const [paymentDate, setPaymentDate] = useState(getTodayDateString());
  const [paymentAccountId, setPaymentAccountId] = useState(activeAccounts[0]?.id || '');

  // Compromissos do mês
  const monthlyBills = useMemo(() => {
    return state.transactions
      .filter((t) => {
        const d = t.expectedDate || t.date;
        return d.substring(0, 7) === periodMonth;
      })
      .sort((a, b) => (a.expectedDate || a.date).localeCompare(b.expectedDate || b.date));
  }, [state.transactions, periodMonth]);

  // Contas vencidas
  const overdueBills = useMemo(() => {
    return monthlyBills.filter(
      (b) => b.type === 'expense' && isBillOverdue(b.expectedDate || b.date, b.status)
    );
  }, [monthlyBills]);

  // Contas a vencer
  const upcomingBills = useMemo(() => {
    return monthlyBills.filter(
      (b) =>
        b.type === 'expense' &&
        b.status === 'prevista' &&
        !isBillOverdue(b.expectedDate || b.date, b.status)
    );
  }, [monthlyBills]);

  // Contas pagas
  const paidBills = useMemo(() => {
    return monthlyBills.filter((b) => b.type === 'expense' && b.status === 'realizada');
  }, [monthlyBills]);

  // Recebimentos previstos
  const expectedIncomes = useMemo(() => {
    return monthlyBills.filter((b) => b.type === 'income' && b.status === 'prevista');
  }, [monthlyBills]);

  const handleOpenPayModal = (bill: Transaction) => {
    setBillToPay(bill);
    setPaymentDate(getTodayDateString());
    setPaymentAccountId(bill.accountId || activeAccounts[0]?.id || '');
    setPayModalOpen(true);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billToPay) return;
    markTransactionAsPaid(billToPay.id, paymentDate, paymentAccountId);
    setPayModalOpen(false);
  };

  // Calendar matrix calculation for periodMonth
  const calendarData = useMemo(() => {
    const [year, month] = periodMonth.split('-').map(Number);
    const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0 = Domingo
    const daysInMonth = new Date(year, month, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayTransactions = state.transactions.filter(
        (t) => (t.expectedDate || t.date) === dateStr
      );
      days.push({ day, dateStr, transactions: dayTransactions });
    }
    return days;
  }, [periodMonth, state.transactions]);

  const selectedDateTransactions = useMemo(() => {
    return state.transactions.filter(
      (t) => (t.expectedDate || t.date) === selectedCalendarDate
    );
  }, [state.transactions, selectedCalendarDate]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Central de Contas a Pagar & Calendário
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Acompanhe vencimentos, evite juros por atraso e organize o fluxo do mês
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('bills')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'bills'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Lista de Contas
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'calendar'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Calendário Mensal
            </button>
            <button
              onClick={() => setActiveTab('recurring')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'recurring'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Recorrências Fixas
            </button>
          </div>

          <button
            onClick={() => openQuickModal('expense')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Conta</span>
          </button>
        </div>
      </div>

      {/* Overdue Banner if exists */}
      {overdueBills.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold text-xs sm:text-sm text-rose-900 dark:text-rose-200 block">
                {overdueBills.length} Conta(s) Vencida(s) no momento!
              </span>
              <p className="text-xs text-rose-700 dark:text-rose-400">
                Total pendente em atraso:{' '}
                <strong>
                  {formatBRL(overdueBills.reduce((acc, b) => acc + b.amount, 0))}
                </strong>
                . Efetue o pagamento para atualizar seu saldo bancário real.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: LISTA DE CONTAS */}
      {activeTab === 'bills' && (
        <div className="space-y-6">
          {/* Quick Filter Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => setStatusFilter('overdue')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                statusFilter === 'overdue'
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-400 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider block">
                Vencidas
              </span>
              <div className="text-lg font-black text-rose-700 dark:text-rose-400">
                {overdueBills.length} ({formatBRL(overdueBills.reduce((acc, b) => acc + b.amount, 0))})
              </div>
            </button>

            <button
              onClick={() => setStatusFilter('pending')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                statusFilter === 'pending'
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-400 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">
                A Vencer
              </span>
              <div className="text-lg font-black text-amber-700 dark:text-amber-400">
                {upcomingBills.length} ({formatBRL(upcomingBills.reduce((acc, b) => acc + b.amount, 0))})
              </div>
            </button>

            <button
              onClick={() => setStatusFilter('paid')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                statusFilter === 'paid'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
                Já Pagas
              </span>
              <div className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                {paidBills.length} ({formatBRL(paidBills.reduce((acc, b) => acc + b.amount, 0))})
              </div>
            </button>

            <button
              onClick={() => setStatusFilter('all')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                statusFilter === 'all'
                  ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-400 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">
                Todas do Mês
              </span>
              <div className="text-lg font-black text-blue-700 dark:text-blue-400">
                {monthlyBills.length} lançamentos
              </div>
            </button>
          </div>

          {/* Table of Bills */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Vencimento</th>
                    <th className="py-3 px-4">Descrição</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Valor</th>
                    <th className="py-3 px-4 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {monthlyBills.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        Nenhuma conta ou compromisso registrado para este mês.
                      </td>
                    </tr>
                  ) : (
                    monthlyBills.map((bill) => {
                    const isOver = isBillOverdue(bill.expectedDate || bill.date, bill.status);
                    const isPaid = bill.status === 'realizada';
                    const days = getDaysDiff(bill.expectedDate || bill.date);

                    if (statusFilter === 'overdue' && !isOver) return null;
                    if (statusFilter === 'pending' && (isPaid || isOver)) return null;
                    if (statusFilter === 'paid' && !isPaid) return null;

                    return (
                      <tr
                        key={bill.id}
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                          isOver ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 font-semibold">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={
                                isOver
                                  ? 'text-rose-600 font-bold'
                                  : isPaid
                                  ? 'text-slate-400'
                                  : 'text-slate-800 dark:text-slate-200'
                              }
                            >
                              {formatDate(bill.expectedDate || bill.date)}
                            </span>
                            {isOver && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                                Vencida ({Math.abs(days)}d)
                              </span>
                            )}
                            {!isOver && !isPaid && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                                {days === 0 ? 'Hoje' : `Em ${days}d`}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                          {bill.description}
                          {bill.notes && (
                            <span className="text-[11px] text-slate-400 block font-normal truncate max-w-xs">
                              {bill.notes}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500">{bill.category}</td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : isOver
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                            }`}
                          >
                            {isPaid ? 'Pago' : isOver ? 'Vencida' : 'Pendente'}
                          </span>
                        </td>

                        <td
                          className={`py-3.5 px-4 text-right font-black text-sm ${
                            bill.type === 'income' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {formatBRL(bill.amount)}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {!isPaid ? (
                            <button
                              onClick={() => handleOpenPayModal(bill)}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1 mx-auto"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Baixar</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-semibold flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Quitado
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CALENDÁRIO MENSAL INTERATIVO */}
      {activeTab === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-600" />
                <span>Calendário de Vencimentos — {formatMonthYear(periodMonth)}</span>
              </h3>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dayName) => (
                <div key={dayName} className="font-bold text-slate-400 py-1 uppercase tracking-wider">
                  {dayName}
                </div>
              ))}

              {calendarData.map((dayItem, idx) => {
                if (!dayItem) {
                  return <div key={`empty-${idx}`} className="h-16 rounded-xl bg-slate-50/40 dark:bg-slate-800/20" />;
                }

                const isSelected = selectedCalendarDate === dayItem.dateStr;
                const hasPending = dayItem.transactions.some(
                  (t) => t.type === 'expense' && t.status === 'prevista'
                );
                const hasOverdue = dayItem.transactions.some(
                  (t) => t.type === 'expense' && isBillOverdue(t.expectedDate || t.date, t.status)
                );
                const hasPaid = dayItem.transactions.some(
                  (t) => t.type === 'expense' && t.status === 'realizada'
                );

                return (
                  <button
                    key={dayItem.dateStr}
                    onClick={() => setSelectedCalendarDate(dayItem.dateStr)}
                    className={`h-16 p-1 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                        : hasOverdue
                        ? 'border-rose-300 bg-rose-50/40 dark:border-rose-900/50 dark:bg-rose-950/20'
                        : hasPending
                        ? 'border-amber-300 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20'
                        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300">
                      {dayItem.day}
                    </span>

                    {/* Transaction Dots */}
                    <div className="flex items-center gap-1 mt-auto">
                      {hasOverdue && <span className="w-2 h-2 rounded-full bg-rose-500" title="Vencida" />}
                      {hasPending && !hasOverdue && (
                        <span className="w-2 h-2 rounded-full bg-amber-500" title="Pendente" />
                      )}
                      {hasPaid && <span className="w-2 h-2 rounded-full bg-emerald-500" title="Paga" />}
                      {dayItem.transactions.length > 0 && (
                        <span className="text-[10px] text-slate-400 font-bold ml-auto">
                          {dayItem.transactions.length}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details for Selected Date */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Lançamentos em {formatDate(selectedCalendarDate)}
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                {selectedDateTransactions.length} contas ou movimentações nesta data
              </p>

              {selectedDateTransactions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Nenhum compromisso agendado para este dia.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateTransactions.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 space-y-1"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {t.description}
                        </span>
                        <span
                          className={`font-bold ${
                            t.type === 'income' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {formatBRL(t.amount)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-500">
                        <span>{t.category}</span>
                        {t.status === 'prevista' ? (
                          <button
                            onClick={() => handleOpenPayModal(t)}
                            className="text-emerald-600 font-bold hover:underline"
                          >
                            Dar baixa agora
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-semibold">Realizada</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => openQuickModal('expense')}
              className="w-full mt-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
            >
              + Adicionar Conta neste Dia
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: RECORRÊNCIAS FIXAS */}
      {activeTab === 'recurring' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Repeat className="w-5 h-5 text-blue-600" />
                <span>Compromissos Recorrentes e Despesas Fixas</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aluguel, luz, condomínio, assinaturas e parcelas programadas mensalmente
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.recurring.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4"
              >
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{rec.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {rec.category} • Vencimento: Todo dia {rec.dueDay} • Frequência: {rec.frequency}
                  </p>
                  {rec.isVariableAmount && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block mt-1">
                      * Valor variável todo mês
                    </span>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base font-black text-slate-900 dark:text-white">
                    {formatBRL(rec.amount)}
                  </div>
                  <button
                    onClick={() => confirmRecurringPayment(rec.id)}
                    className="mt-1 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    Lançar no Mês
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Confirm Payment */}
      {payModalOpen && billToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Confirmar Pagamento de Conta</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Informe a data efetiva e a conta utilizada para registrar a saída no saldo bancário.
            </p>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
                <span className="text-slate-400 block">Conta a quitar:</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white block mt-0.5">
                  {billToPay.description}
                </span>
                <span className="text-base font-black text-rose-600 block mt-1">
                  {formatBRL(billToPay.amount)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Data Efetiva do Pagamento
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Conta Debitada
                </label>
                <select
                  value={paymentAccountId}
                  onChange={(e) => setPaymentAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
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
                  Confirmar Baixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
