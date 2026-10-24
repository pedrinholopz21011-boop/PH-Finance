import React, { useState, useMemo } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  Search,
  Filter,
  Download,
  Copy,
  Trash2,
  CheckCircle2,
  Edit2,
  Plus,
  ArrowUpDown,
  Tag,
  Wallet,
  Calendar,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../../types/finance';
import { formatBRL, formatDate, roundMoney } from '../../utils/formatters';
import { exportTransactionsToCSV } from '../../services/storage';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../utils/constants';

export const TransactionsView: React.FC = () => {
  const {
    state,
    periodMonth,
    openQuickModal,
    deleteTransaction,
    duplicateTransaction,
    markTransactionAsPaid,
  } = useFinance();

  // Filters state
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('current'); // 'current', 'all'
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'description'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  // Account map for quick lookup
  const accountMap = useMemo(() => {
    const map = new Map<string, string>();
    state.accounts.forEach((a) => map.set(a.id, a.name));
    return map;
  }, [state.accounts]);

  // Filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    return state.transactions.filter((tx) => {
      // Period filter
      if (filterPeriod === 'current' && (tx.date || '').substring(0, 7) !== periodMonth) {
        return false;
      }
      // Type filter
      if (filterType !== 'all' && tx.type !== filterType) {
        return false;
      }
      // Category filter
      if (filterCategory !== 'all' && tx.category !== filterCategory) {
        return false;
      }
      // Account filter
      if (filterAccount !== 'all' && tx.accountId !== filterAccount && tx.destinationAccountId !== filterAccount) {
        return false;
      }
      // Status filter
      if (filterStatus !== 'all' && tx.status !== filterStatus) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const descMatch = (tx.description || '').toLowerCase().includes(query);
        const catMatch = (tx.category || '').toLowerCase().includes(query);
        const notesMatch = (tx.notes || '').toLowerCase().includes(query);
        if (!descMatch && !catMatch && !notesMatch) return false;
      }
      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = a.date.localeCompare(b.date);
      } else if (sortBy === 'amount') {
        comparison = a.amount - b.amount;
      } else if (sortBy === 'description') {
        comparison = a.description.localeCompare(b.description);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [
    state.transactions,
    periodMonth,
    filterPeriod,
    filterType,
    filterCategory,
    filterAccount,
    filterStatus,
    searchTerm,
    sortBy,
    sortOrder,
  ]);

  // Financial totals of current filtered set
  const filteredTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach((tx) => {
      if (tx.status === 'realizada') {
        if (tx.type === 'income') income += tx.amount;
        if (tx.type === 'expense' && !tx.isInvoicePayment) expense += tx.amount;
      }
    });
    return {
      income: roundMoney(income),
      expense: roundMoney(expense),
      balance: roundMoney(income - expense),
    };
  }, [filteredTransactions]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSort = (field: 'date' | 'amount' | 'description') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Módulo de Transações e Extrato
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gerencie todas as receitas, despesas e transferências com rastreabilidade total
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportTransactionsToCSV(filteredTransactions, state.accounts)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
            title="Exportar dados filtrados para Excel/CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => openQuickModal('expense')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Transação</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Bar for filtered view */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase">Entradas Realizadas</span>
            <div className="text-lg font-black text-emerald-600">
              +{formatBRL(filteredTotals.income)}
            </div>
          </div>
          <ArrowUpCircle className="w-8 h-8 text-emerald-500/20" />
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase">Saídas Realizadas</span>
            <div className="text-lg font-black text-rose-600">
              -{formatBRL(filteredTotals.expense)}
            </div>
          </div>
          <ArrowDownCircle className="w-8 h-8 text-rose-500/20" />
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase">Saldo Líquido Filtrado</span>
            <div
              className={`text-lg font-black ${
                filteredTotals.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {formatBRL(filteredTotals.balance)}
            </div>
          </div>
          <Wallet className="w-8 h-8 text-blue-500/20" />
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        {/* Top filter row: Search & Period */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por descrição, notas ou categoria..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <select
              value={filterPeriod}
              onChange={(e) => {
                setFilterPeriod(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
            >
              <option value="current">Mês Ativo ({periodMonth})</option>
              <option value="all">Todo o Histórico (Sem filtro de mês)</option>
            </select>
          </div>

          <div>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
            >
              <option value="all">Todos os Tipos</option>
              <option value="expense">Apenas Despesas</option>
              <option value="income">Apenas Receitas</option>
              <option value="transfer">Apenas Transferências</option>
            </select>
          </div>
        </div>

        {/* Secondary filter row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
            >
              <option value="all">Todas as Categorias</option>
              <optgroup label="Despesas">
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Receitas">
                {INCOME_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div>
            <select
              value={filterAccount}
              onChange={(e) => {
                setFilterAccount(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
            >
              <option value="all">Todas as Contas</option>
              {state.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
            >
              <option value="all">Todos os Status</option>
              <option value="realizada">Realizada (Efetivada)</option>
              <option value="prevista">Prevista (Pendente)</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th
                  onClick={() => toggleSort('date')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Data</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('description')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Descrição</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Conta</th>
                <th className="py-3 px-4">Status</th>
                <th
                  onClick={() => toggleSort('amount')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Valor</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    {state.transactions.length === 0 ? (
                      <div className="max-w-md mx-auto space-y-3">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Nenhum lançamento cadastrado ainda
                        </p>
                        <p className="text-xs text-slate-400">
                          Comece registrando suas receitas ou despesas reais para alimentar automaticamente seu fluxo de caixa e relatórios.
                        </p>
                        <div className="flex items-center justify-center gap-2 pt-1">
                          <button
                            onClick={() => openQuickModal('income')}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                          >
                            + Cadastrar Primeira Receita
                          </button>
                          <button
                            onClick={() => openQuickModal('expense')}
                            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors"
                          >
                            + Registrar Primeira Despesa
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">
                        Nenhum lançamento encontrado para os filtros selecionados.
                      </span>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 text-slate-500 font-medium">
                      {formatDate(tx.date)}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {tx.description}
                      </div>
                      {tx.notes && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {tx.notes}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <span className="font-medium">{tx.category}</span>
                      {tx.subcategory && (
                        <span className="text-[11px] text-slate-400 block">
                          {tx.subcategory}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {accountMap.get(tx.accountId) || 'Conta N/A'}
                      {tx.destinationAccountId && (
                        <span className="text-[11px] text-blue-500 block">
                          ➔ {accountMap.get(tx.destinationAccountId)}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          tx.status === 'realizada'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : tx.status === 'prevista'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>

                    <td
                      className={`py-3 px-4 text-right font-bold text-sm ${
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

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {tx.status === 'prevista' && (
                          <button
                            onClick={() => markTransactionAsPaid(tx.id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg"
                            title="Confirmar pagamento / recebimento"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => duplicateTransaction(tx.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Duplicar lançamento"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Excluir lançamento "${tx.description}"?`)) {
                              deleteTransaction(tx.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          title="Excluir lançamento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            Mostrando {filteredTransactions.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} até{' '}
            {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} de{' '}
            {filteredTransactions.length} registros
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="px-2 font-semibold">
              Página {currentPage} de {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
