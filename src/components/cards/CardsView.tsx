import React, { useState, useMemo } from 'react';
import {
  CreditCard as CreditCardIcon,
  Plus,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  TrendingDown,
  Edit2,
  Trash2,
  AlertCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { CreditCard, CreditCardInvoice } from '../../types/finance';
import {
  formatBRL,
  formatDate,
  formatMonthYear,
  getCurrentMonthString,
  getTodayDateString,
  roundMoney,
} from '../../utils/formatters';
import { calculateCreditCardUsage } from '../../utils/accounting';

export const CardsView: React.FC = () => {
  const {
    state,
    periodMonth,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    payCreditCardInvoice,
    activeAccounts,
    openQuickModal,
  } = useFinance();

  const [selectedCardId, setSelectedCardId] = useState<string>(
    state.creditCards[0]?.id || ''
  );

  const [newCardModalOpen, setNewCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  // New card form state
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [totalLimit, setTotalLimit] = useState('');
  const [closingDay, setClosingDay] = useState(20);
  const [dueDay, setDueDay] = useState(27);
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [color, setColor] = useState('#820AD1');
  const [notes, setNotes] = useState('');

  // Pay invoice modal state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [invoiceToPay, setInvoiceToPay] = useState<CreditCardInvoice | null>(null);
  const [payAccount, setPayAccount] = useState('');
  const [payAmount, setPayAmount] = useState('');

  const selectedCard = useMemo(
    () => state.creditCards.find((c) => c.id === selectedCardId) || state.creditCards[0],
    [state.creditCards, selectedCardId]
  );

  const cardUsage = useMemo(() => {
    if (!selectedCard) return { usedAmount: 0, availableLimit: 0, utilizationPercent: 0 };
    return calculateCreditCardUsage(selectedCard, state.transactions);
  }, [selectedCard, state.transactions]);

  // Transações do cartão selecionado
  const cardTransactions = useMemo(() => {
    if (!selectedCard) return [];
    return state.transactions.filter(
      (t) => t.cardId === selectedCard.id && t.type === 'expense' && !t.isInvoicePayment
    );
  }, [selectedCard, state.transactions]);

  // Parcelas futuras
  const installmentTransactions = useMemo(() => {
    return cardTransactions.filter((t) => (t.installmentsTotal || 1) > 1);
  }, [cardTransactions]);

  // Faturas do cartão selecionado
  const cardInvoices = useMemo(() => {
    if (!selectedCard) return [];
    return state.invoices.filter((inv) => inv.cardId === selectedCard.id);
  }, [selectedCard, state.invoices]);

  const handleOpenNewCard = () => {
    setEditingCard(null);
    setName('');
    setInstitution('');
    setTotalLimit('');
    setClosingDay(20);
    setDueDay(27);
    setPaymentAccountId(activeAccounts[0]?.id || '');
    setColor('#820AD1');
    setNotes('');
    setNewCardModalOpen(true);
  };

  const handleOpenEditCard = (card: CreditCard) => {
    setEditingCard(card);
    setName(card.name);
    setInstitution(card.institution);
    setTotalLimit(card.totalLimit.toString());
    setClosingDay(card.closingDay);
    setDueDay(card.dueDay);
    setPaymentAccountId(card.paymentAccountId);
    setColor(card.color);
    setNotes(card.notes || '');
    setNewCardModalOpen(true);
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const limitNum = parseFloat(totalLimit.replace(',', '.')) || 1000;

    if (editingCard) {
      updateCreditCard(editingCard.id, {
        name: name.trim(),
        institution: institution.trim(),
        totalLimit: roundMoney(limitNum),
        closingDay: Number(closingDay),
        dueDay: Number(dueDay),
        paymentAccountId,
        color,
        notes: notes.trim(),
      });
    } else {
      addCreditCard({
        name: name.trim(),
        institution: institution.trim() || 'Banco Emissor',
        totalLimit: roundMoney(limitNum),
        closingDay: Number(closingDay),
        dueDay: Number(dueDay),
        paymentAccountId: paymentAccountId || activeAccounts[0]?.id || '',
        color,
        status: 'active',
        notes: notes.trim(),
      });
    }
    setNewCardModalOpen(false);
  };

  const handleOpenPayInvoice = (inv: CreditCardInvoice) => {
    setInvoiceToPay(inv);
    setPayAccount(inv.paymentAccountId || selectedCard?.paymentAccountId || activeAccounts[0]?.id || '');
    setPayAmount(inv.totalAmount.toString());
    setPayModalOpen(true);
  };

  const handleConfirmPayInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceToPay || !selectedCard) return;
    const amt = parseFloat(payAmount.replace(',', '.')) || invoiceToPay.totalAmount;

    payCreditCardInvoice(selectedCard.id, invoiceToPay.month, payAccount, amt);
    setPayModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Cartões de Crédito & Faturas
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Acompanhe limites, datas de fechamento/vencimento, parcelamentos e pagamento de faturas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openQuickModal('expense')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>Lançar Compra no Cartão</span>
          </button>

          <button
            onClick={handleOpenNewCard}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cartão</span>
          </button>
        </div>
      </div>

      {state.creditCards.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 max-w-xl mx-auto">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <CreditCardIcon className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Você ainda não cadastrou nenhum cartão de crédito
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Cadastre seus cartões para controlar limite disponível, dia de fechamento, vencimento de faturas e compras parceladas sem duplicar saídas de caixa.
            </p>
          </div>
          <div className="pt-2 flex justify-center">
            <button
              onClick={handleOpenNewCard}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Primeiro Cartão</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Cards Selector Tabs */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {state.creditCards.map((c) => {
              const isSelected = selectedCard?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCardId(c.id)}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all shrink-0 ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                      : 'bg-white/60 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 hover:bg-white'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: c.color || '#820AD1' }}
                  >
                    <CreditCardIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                      {c.name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Fecha dia {c.closingDay} • Vence dia {c.dueDay}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedCard && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card Visual & Limit Details */}
          <div className="lg:col-span-1 space-y-4">
            {/* Visual Credit Card */}
            <div
              className="p-6 rounded-3xl text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[200px]"
              style={{
                background: `linear-gradient(135deg, ${selectedCard.color || '#4338CA'}, #0F172A)`,
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                    {selectedCard.institution}
                  </span>
                  <h4 className="text-base font-extrabold tracking-tight">{selectedCard.name}</h4>
                </div>
                <CreditCardIcon className="w-8 h-8 text-white/70" />
              </div>

              <div className="my-4">
                <span className="text-[10px] text-white/70 uppercase tracking-wider block">
                  Limite Total
                </span>
                <div className="text-2xl font-black">{formatBRL(selectedCard.totalLimit)}</div>
              </div>

              <div className="flex items-center justify-between text-xs text-white/90 pt-3 border-t border-white/10">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-white/60 block">
                    Fechamento
                  </span>
                  <span className="font-bold">Todo dia {selectedCard.closingDay}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-white/60 block">
                    Vencimento
                  </span>
                  <span className="font-bold">Todo dia {selectedCard.dueDay}</span>
                </div>
              </div>
            </div>

            {/* Limit Utilization Progress */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Uso do Limite</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {cardUsage.utilizationPercent.toFixed(1)}% utilizado
                </span>
              </div>

              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    cardUsage.utilizationPercent >= 85
                      ? 'bg-rose-500'
                      : cardUsage.utilizationPercent >= 60
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, cardUsage.utilizationPercent)}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Utilizado:</span>
                  <span className="font-bold text-rose-600">{formatBRL(cardUsage.usedAmount)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Disponível:</span>
                  <span className="font-bold text-emerald-600">
                    {formatBRL(cardUsage.availableLimit)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => handleOpenEditCard(selectedCard)}
                  className="flex-1 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
                >
                  Editar Cartão
                </button>
                {state.creditCards.length > 1 && (
                  <button
                    onClick={() => {
                      if (confirm(`Excluir cartão "${selectedCard.name}"?`)) {
                        deleteCreditCard(selectedCard.id);
                      }
                    }}
                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Invoices and Installment Commitments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Faturas Históricas e Fatura Atual */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Faturas do Cartão
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Status das faturas em aberto, fechadas e pagas
                  </p>
                </div>
              </div>

              {cardInvoices.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  Nenhuma fatura fechada registrada para este cartão.
                </div>
              ) : (
                <div className="space-y-3">
                  {cardInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <span>Fatura de {formatMonthYear(inv.month)}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              inv.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : inv.status === 'closed'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                            }`}
                          >
                            {inv.status === 'paid'
                              ? 'Paga'
                              : inv.status === 'closed'
                              ? 'Fechada'
                              : 'Aberta'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                          <span>Fecha: {formatDate(inv.closingDate)}</span>
                          <span>Vence: {formatDate(inv.dueDate)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-base font-black text-slate-900 dark:text-white">
                          {formatBRL(inv.totalAmount)}
                        </span>

                        {inv.status !== 'paid' ? (
                          <button
                            onClick={() => handleOpenPayInvoice(inv)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Pagar Fatura</span>
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Pago
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Compras e Parcelamentos Recentes do Cartão */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
                Lançamentos no Cartão ({cardTransactions.length})
              </h3>

              {cardTransactions.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  Nenhuma compra registrada neste cartão.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {cardTransactions.slice(0, 6).map((tx) => (
                    <div key={tx.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {tx.description}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {formatDate(tx.date)} • {tx.category}
                        </div>
                      </div>
                      <span className="font-bold text-rose-600">{formatBRL(tx.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </>
      )}

      {/* Modal: New / Edit Credit Card */}
      {newCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              {editingCard ? 'Editar Cartão' : 'Cadastrar Cartão de Crédito'}
            </h3>

            <form onSubmit={handleSaveCard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Nome do Cartão *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Nubank Ultravioleta, Inter Black"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Instituição Emissora
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Nubank, Itaú"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Limite Total (R$) *
                  </label>
                  <input
                    type="text"
                    placeholder="5000,00"
                    value={totalLimit}
                    onChange={(e) => setTotalLimit(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Dia Fechamento da Fatura
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={closingDay}
                    onChange={(e) => setClosingDay(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Dia Vencimento da Fatura
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={dueDay}
                    onChange={(e) => setDueDay(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Conta Padrão para Débito da Fatura
                </label>
                <select
                  value={paymentAccountId}
                  onChange={(e) => setPaymentAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  {activeAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatBRL(a.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Cor do Cartão
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0"
                  />
                  <span className="text-xs text-slate-500 font-mono">{color}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewCardModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors"
                >
                  Salvar Cartão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Pay Invoice */}
      {payModalOpen && invoiceToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Liquidar Fatura do Cartão</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              O pagamento debitará o saldo da conta corrente sem duplicar as despesas das compras
              individuais já reconhecidas.
            </p>

            <form onSubmit={handleConfirmPayInvoice} className="space-y-4">
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
                  Conta para Saída do Dinheiro
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
                  Confirmar Pagamento da Fatura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
