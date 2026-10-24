import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  ArrowLeftRight,
  Landmark,
  PiggyBank,
  Banknote,
  Coins,
  TrendingUp,
  MoreVertical,
  CheckCircle2,
  Trash2,
  Edit2,
  AlertCircle,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Account, AccountType } from '../../types/finance';
import { formatBRL, formatDate, getTodayDateString, roundMoney } from '../../utils/formatters';

export const AccountsView: React.FC = () => {
  const {
    activeAccounts,
    kpis,
    addAccount,
    updateAccount,
    deleteAccount,
    transferBetweenAccounts,
    openQuickModal,
  } = useFinance();

  const [modalOpen, setModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Form states for new/edit account
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [institution, setInstitution] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [color, setColor] = useState('#2563EB');
  const [notes, setNotes] = useState('');

  // Transfer form
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDate, setTransferDate] = useState(getTodayDateString());
  const [transferDesc, setTransferDesc] = useState('');
  const [transferError, setTransferError] = useState('');

  const handleOpenNew = () => {
    setEditingAccount(null);
    setName('');
    setType('checking');
    setInstitution('');
    setInitialBalance('');
    setColor('#2563EB');
    setNotes('');
    setModalOpen(true);
  };

  const handleOpenEdit = (acc: Account) => {
    setEditingAccount(acc);
    setName(acc.name);
    setType(acc.type);
    setInstitution(acc.institution || '');
    setInitialBalance(acc.initialBalance.toString());
    setColor(acc.color || '#2563EB');
    setNotes(acc.notes || '');
    setModalOpen(true);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const balanceNum = parseFloat(initialBalance.replace(',', '.')) || 0;

    if (editingAccount) {
      updateAccount(editingAccount.id, {
        name: name.trim(),
        type,
        institution: institution.trim(),
        color,
        notes: notes.trim(),
      });
    } else {
      addAccount({
        name: name.trim(),
        type,
        institution: institution.trim() || 'Instituição Manual',
        initialBalance: roundMoney(balanceNum),
        startDate: getTodayDateString(),
        color,
        status: 'active',
        notes: notes.trim(),
      });
    }
    setModalOpen(false);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');
    const amt = parseFloat(transferAmount.replace(',', '.'));
    if (isNaN(amt) || amt <= 0) {
      setTransferError('Informe um valor de transferência válido maior que zero.');
      return;
    }
    if (!transferFrom || !transferTo) {
      setTransferError('Selecione ambas as contas de origem e destino.');
      return;
    }
    if (transferFrom === transferTo) {
      setTransferError('A conta de origem e destino não podem ser iguais.');
      return;
    }

    transferBetweenAccounts(transferFrom, transferTo, amt, transferDate, transferDesc.trim());
    setTransferModalOpen(false);
    setTransferAmount('');
    setTransferDesc('');
  };

  const getAccountIcon = (t: AccountType) => {
    switch (t) {
      case 'savings':
        return PiggyBank;
      case 'cash':
        return Banknote;
      case 'digital_wallet':
        return Coins;
      case 'investment':
        return TrendingUp;
      default:
        return Landmark;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Contas, Carteiras & Transferências
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Acompanhe o saldo consolidado e individual das suas contas correntes, poupanças e dinheiro
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeAccounts.length >= 2) {
                setTransferFrom(activeAccounts[0].id);
                setTransferTo(activeAccounts[1].id);
              }
              setTransferModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
            <span>Transferir entre Contas</span>
          </button>

          <button
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Conta</span>
          </button>
        </div>
      </div>

      {/* Consolidado Global Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
            Patrimônio Líquido em Caixa Consolidado
          </span>
          <div className="text-3xl font-black tracking-tight mt-1">
            {formatBRL(kpis.currentBalance)}
          </div>
          <p className="text-xs text-blue-200/80 mt-1">
            Soma de todas as {activeAccounts.length} contas bancárias e carteiras cadastradas
          </p>
        </div>

        <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs text-xs text-blue-100 max-w-xs border border-white/10">
          <span className="font-bold block text-white mb-0.5">Regra Contábil:</span>
          Transferências internas entre contas próprias nunca alteram o consolidado nem contam como receita/despesa.
        </div>
      </div>

      {/* Account Cards Grid or Empty State */}
      {activeAccounts.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 max-w-xl mx-auto">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Landmark className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Você ainda não cadastrou suas contas
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Cadastre suas contas bancárias (corrente, poupança, carteira ou corretora) para acompanhar saldos reais, entradas e saídas com exatidão.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleOpenNew}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Conta ou Carteira</span>
            </button>
            <button
              onClick={() => openQuickModal('income')}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <span>Cadastrar Primeira Receita</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeAccounts.map((acc) => {
            const Icon = getAccountIcon(acc.type);
            return (
              <div
                key={acc.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: acc.color || '#2563EB' }}
                />

                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: acc.color || '#2563EB' }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {acc.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {acc.institution} • {acc.type}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(acc)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Editar conta"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {activeAccounts.length > 1 && (
                        <button
                          onClick={() => {
                            if (confirm(`Deseja remover a conta "${acc.name}"?`)) {
                              deleteAccount(acc.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          title="Excluir conta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Saldo Realizado Atual
                    </span>
                    <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                      {formatBRL(acc.currentBalance)}
                    </div>
                  </div>

                  {acc.notes && (
                    <p className="mt-2 text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
                      {acc.notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Saldo Inicial: {formatBRL(acc.initialBalance)}</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Ativa
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: New / Edit Account */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              {editingAccount ? 'Editar Conta Bancária' : 'Cadastrar Nova Conta'}
            </h3>

            <form onSubmit={handleSaveAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Nome da Conta / Carteira *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Nubank Principal, Itaú Reserva, Carteira Dinheiro"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Tipo de Conta
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AccountType)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="checking">Conta Corrente</option>
                    <option value="savings">Poupança</option>
                    <option value="cash">Dinheiro em Espécie</option>
                    <option value="digital_wallet">Carteira Digital</option>
                    <option value="investment">Investimentos</option>
                    <option value="other">Outra</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Instituição
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Nubank, Itaú, Bradesco"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {!editingAccount && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Saldo Inicial (R$)
                  </label>
                  <input
                    type="text"
                    placeholder="0,00"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Cor de Identificação
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

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Observações
                </label>
                <input
                  type="text"
                  placeholder="Finalidade desta conta..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
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
                  {editingAccount ? 'Salvar Alterações' : 'Criar Conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Transfer Between Accounts */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-blue-600" />
              <span>Transferência Interna entre Contas</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Mova valores entre suas contas mantendo a integridade dos seus saldos.
            </p>

            {transferError && (
              <div className="flex items-center gap-2 p-3 mb-3 text-xs rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{transferError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Valor a Transferir (R$) *
                </label>
                <input
                  type="text"
                  placeholder="0,00"
                  autoFocus
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Conta de Origem (Sai)
                  </label>
                  <select
                    value={transferFrom}
                    onChange={(e) => setTransferFrom(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
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
                    Conta de Destino (Entra)
                  </label>
                  <select
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    {activeAccounts
                      .filter((a) => a.id !== transferFrom)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({formatBRL(a.currentBalance)})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Data da Transferência
                  </label>
                  <input
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Descrição (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Aporte na poupança"
                    value={transferDesc}
                    onChange={(e) => setTransferDesc(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors"
                >
                  Confirmar Transferência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
