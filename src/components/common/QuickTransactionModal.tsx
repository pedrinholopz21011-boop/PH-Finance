import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  Calendar,
  Wallet,
  CreditCard as CreditCardIcon,
  Tag,
  FileText,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  EXPENSE_NATURES,
} from '../../utils/constants';
import {
  TransactionType,
  PaymentMethod,
  ExpenseNature,
  TransactionStatus,
} from '../../types/finance';
import { getTodayDateString, roundMoney } from '../../utils/formatters';

export const QuickTransactionModal: React.FC = () => {
  const {
    quickModalOpen,
    quickModalDefaultType,
    closeQuickModal,
    addTransaction,
    transferBetweenAccounts,
    addAccount,
    activeAccounts,
    state,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<TransactionType>(quickModalDefaultType);
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [accountId, setAccountId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [cardId, setCardId] = useState('');
  const [expenseNature, setExpenseNature] = useState<ExpenseNature>('variavel');
  const [status, setStatus] = useState<TransactionStatus>('realizada');
  const [installments, setInstallments] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (quickModalOpen) {
      setActiveTab(quickModalDefaultType);
      setDescription('');
      setAmountStr('');
      setDate(getTodayDateString());
      setNotes('');
      setErrorMsg('');
      setInstallments(1);

      if (quickModalDefaultType === 'income') {
        setCategory(INCOME_CATEGORIES[0]);
        setStatus('realizada');
      } else if (quickModalDefaultType === 'expense') {
        setCategory(EXPENSE_CATEGORIES[1].name); // Alimentação
        setSubcategory(EXPENSE_CATEGORIES[1].subcategories[0]);
        setStatus('realizada');
      }

      if (activeAccounts.length > 0) {
        setAccountId(activeAccounts[0].id);
        if (activeAccounts.length > 1) {
          setDestinationAccountId(activeAccounts[1].id);
        }
      }

      if (state.creditCards.length > 0) {
        setCardId(state.creditCards[0].id);
      }
    }
  }, [quickModalOpen, quickModalDefaultType, activeAccounts, state.creditCards]);

  if (!quickModalOpen) return null;

  // Change category handler
  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    if (activeTab === 'expense') {
      const found = EXPENSE_CATEGORIES.find((c) => c.name === newCat);
      if (found && found.subcategories.length > 0) {
        setSubcategory(found.subcategories[0]);
      } else {
        setSubcategory('');
      }
    }
  };

  const currentCategoryObj = EXPENSE_CATEGORIES.find((c) => c.name === category);

  const handleCreateQuickAccount = () => {
    addAccount({
      name: 'Conta Corrente Principal',
      type: 'checking',
      institution: 'Banco Principal',
      initialBalance: 0,
      color: '#2563EB',
      startDate: getTodayDateString(),
      status: 'active',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const parsedAmount = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Informe um valor numérico válido maior que zero.');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Por favor, informe a descrição do lançamento.');
      return;
    }

    let targetAccountId = accountId;
    if (!targetAccountId && activeAccounts.length === 0) {
      addAccount({
        name: 'Conta Corrente Principal',
        type: 'checking',
        institution: 'Banco Principal',
        initialBalance: 0,
        color: '#2563EB',
        startDate: getTodayDateString(),
        status: 'active',
      });
      setErrorMsg('Conta Corrente Principal criada com sucesso! Clique em Salvar novamente para confirmar este lançamento.');
      return;
    }

    if (!targetAccountId) {
      setErrorMsg('Selecione uma conta bancária ou carteira.');
      return;
    }

    if (activeTab === 'transfer') {
      if (!destinationAccountId) {
        setErrorMsg('Selecione a conta de destino para a transferência.');
        return;
      }
      if (accountId === destinationAccountId) {
        setErrorMsg('A conta de origem e destino devem ser diferentes.');
        return;
      }

      transferBetweenAccounts(
        accountId,
        destinationAccountId,
        parsedAmount,
        date,
        description.trim()
      );
      closeQuickModal();
      return;
    }

    // Expense or Income
    const isCredit = activeTab === 'expense' && paymentMethod === 'credito';
    const isInstallment = isCredit && installments > 1;

    if (isInstallment) {
      // Cria as parcelas correspondentes nos meses subsequentes
      const installmentVal = roundMoney(parsedAmount / installments);
      const [year, month, day] = date.split('-').map(Number);

      for (let i = 0; i < installments; i++) {
        const instDate = new Date(year, month - 1 + i, day);
        const y = instDate.getFullYear();
        const m = String(instDate.getMonth() + 1).padStart(2, '0');
        const d = String(instDate.getDate()).padStart(2, '0');
        const formattedDate = `${y}-${m}-${d}`;

        addTransaction({
          description: `${description.trim()} (${i + 1}/${installments})`,
          amount: installmentVal,
          type: 'expense',
          category,
          subcategory,
          date: formattedDate,
          expectedDate: formattedDate,
          accountId,
          cardId: cardId || undefined,
          paymentMethod: 'credito',
          expenseNature,
          status,
          installmentIndex: i + 1,
          installmentsTotal: installments,
          notes: notes.trim() || undefined,
        });
      }
    } else {
      addTransaction({
        description: description.trim(),
        amount: parsedAmount,
        type: activeTab,
        category: category || (activeTab === 'income' ? 'Outras receitas' : 'Outros'),
        subcategory: subcategory || undefined,
        date,
        expectedDate: date,
        paymentDate: status === 'realizada' ? date : undefined,
        accountId,
        cardId: isCredit ? cardId : undefined,
        paymentMethod,
        expenseNature: activeTab === 'expense' ? expenseNature : undefined,
        status,
        notes: notes.trim() || undefined,
      });
    }

    closeQuickModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header Tabs */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4 pb-0">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('expense');
                setCategory(EXPENSE_CATEGORIES[1].name);
              }}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'expense'
                  ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ArrowDownCircle className="w-4 h-4 text-rose-500" />
              <span>Despesa</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('income');
                setCategory(INCOME_CATEGORIES[0]);
              }}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'income'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
              <span>Receita</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('transfer')}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'transfer'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4 text-blue-500" />
              <span>Transferência</span>
            </button>
          </div>

          <button
            onClick={closeQuickModal}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg -mt-3"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeAccounts.length === 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-amber-800 dark:text-amber-200">
                  Nenhuma conta cadastrada ainda.
                </span>
              </div>
              <button
                type="button"
                onClick={handleCreateQuickAccount}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 transition-colors"
              >
                + Criar Conta Principal
              </button>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Valor (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                R$
              </span>
              <input
                type="text"
                autoFocus
                placeholder="0,00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 text-lg font-bold bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Descrição *
            </label>
            <input
              type="text"
              placeholder={
                activeTab === 'expense'
                  ? 'Ex: Supermercado, Aluguel, Combustível'
                  : activeTab === 'income'
                  ? 'Ex: Salário mensal, Rendimento, Freelance'
                  : 'Ex: Transferência para reserva'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              required
            />
          </div>

          {/* Date & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Data do Lançamento
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>

            {activeTab !== 'transfer' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="realizada">
                    {activeTab === 'income' ? 'Recebido (Realizada)' : 'Pago (Realizada)'}
                  </option>
                  <option value="prevista">
                    {activeTab === 'income' ? 'Previsto receber' : 'Pendente / A pagar (Prevista)'}
                  </option>
                </select>
              </div>
            )}
          </div>

          {/* Helper hint for pending status */}
          {status === 'prevista' && activeTab !== 'transfer' && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200 dark:border-amber-900">
              * Lançamentos previstos afetam o Saldo Projetado e o Calendário, sem debitar o Saldo
              Realizado bancário antes da confirmação.
            </p>
          )}

          {/* Transfer specific accounts */}
          {activeTab === 'transfer' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Conta de Origem (Sai)
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  {activeAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (R$ {acc.currentBalance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Conta de Destino (Entra)
                </label>
                <select
                  value={destinationAccountId}
                  onChange={(e) => setDestinationAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="">Selecione o destino</option>
                  {activeAccounts
                    .filter((a) => a.id !== accountId)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (R$ {acc.currentBalance.toFixed(2)})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          ) : (
            <>
              {/* Category & Subcategory */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    {activeTab === 'expense'
                      ? EXPENSE_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))
                      : INCOME_CATEGORIES.map((inc) => (
                          <option key={inc} value={inc}>
                            {inc}
                          </option>
                        ))}
                  </select>
                </div>

                {activeTab === 'expense' && currentCategoryObj && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Subcategoria
                    </label>
                    <select
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    >
                      {currentCategoryObj.subcategories.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Account & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    {activeTab === 'income' ? 'Conta de Destino' : 'Conta de Pagamento'}
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    {activeAccounts.length === 0 ? (
                      <option value="">Nenhuma conta cadastrada</option>
                    ) : (
                      activeAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} (Saldo: R$ {acc.currentBalance.toFixed(2)})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm.value} value={pm.value}>
                        {pm.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* If Credit Card selected in Expense */}
              {activeTab === 'expense' && paymentMethod === 'credito' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50">
                  <div>
                    <label className="block text-xs font-semibold text-purple-900 dark:text-purple-300 mb-1">
                      Cartão de Crédito
                    </label>
                    <select
                      value={cardId}
                      onChange={(e) => setCardId(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-xl text-slate-900 dark:text-white"
                    >
                      {state.creditCards.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (Fecha dia {c.closingDay})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-purple-900 dark:text-purple-300 mb-1">
                      Parcelas
                    </label>
                    <select
                      value={installments}
                      onChange={(e) => setInstallments(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-xl text-slate-900 dark:text-white"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 18, 24, 36].map((num) => (
                        <option key={num} value={num}>
                          {num === 1 ? '1x (À vista na fatura)' : `${num}x parcelas mensais`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Expense Nature */}
              {activeTab === 'expense' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Natureza da Despesa
                  </label>
                  <select
                    value={expenseNature}
                    onChange={(e) => setExpenseNature(e.target.value as ExpenseNature)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    {EXPENSE_NATURES.map((nat) => (
                      <option key={nat.value} value={nat.value}>
                        {nat.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Observações (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Nota fiscal, recibo ou detalhes extras"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={closeQuickModal}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-xs sm:text-sm font-semibold text-white rounded-xl shadow-md transition-colors ${
                activeTab === 'expense'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  : activeTab === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
              }`}
            >
              Salvar Lançamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
