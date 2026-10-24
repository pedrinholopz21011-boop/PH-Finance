import React, { useState } from 'react';
import {
  Menu,
  Plus,
  Moon,
  Sun,
  Search,
  Calendar,
  ChevronDown,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatMonthYear, getCurrentMonthString } from '../../utils/formatters';

interface HeaderProps {
  onOpenMobile: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobile,
  searchQuery,
  onSearchChange,
}) => {
  const {
    periodMonth,
    setPeriodMonth,
    openQuickModal,
    state,
    updatePreferences,
  } = useFinance();

  const [menuOpen, setMenuOpen] = useState(false);

  const isDarkMode = state.preferences.theme === 'dark';

  const toggleTheme = () => {
    const nextTheme = isDarkMode ? 'light' : 'dark';
    updatePreferences({ theme: nextTheme });
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setPeriodMonth(e.target.value);
    }
  };

  const setPresetMonth = (offsetMonths: number) => {
    const [year, month] = getCurrentMonthString().split('-').map(Number);
    const targetDate = new Date(year, month - 1 + offsetMonths, 1);
    const y = targetDate.getFullYear();
    const m = String(targetDate.getMonth() + 1).padStart(2, '0');
    setPeriodMonth(`${y}-${m}`);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left side: Mobile menu & Period Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Period Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-1">
            <span>{formatMonthYear(periodMonth)}</span>
            <input
              type="month"
              value={periodMonth}
              onChange={handleMonthChange}
              className="sr-only"
              id="period-picker"
            />
          </label>

          <div className="hidden sm:flex items-center gap-1 ml-2 border-l border-slate-300 dark:border-slate-600 pl-2 text-xs">
            <button
              onClick={() => setPresetMonth(-1)}
              className="px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
              title="Mês Anterior"
            >
              Ant.
            </button>
            <button
              onClick={() => setPresetMonth(0)}
              className="px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-semibold"
              title="Mês Atual"
            >
              Atual
            </button>
            <button
              onClick={() => setPresetMonth(1)}
              className="px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
              title="Próximo Mês"
            >
              Próx.
            </button>
          </div>
        </div>
      </div>

      {/* Middle: Global Search */}
      <div className="hidden md:flex items-center flex-1 max-w-md relative mx-2">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar despesa, receita, fornecedor ou conta..."
          className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-500"
        />
      </div>

      {/* Right side: Quick Action Button, Theme toggle, User badge */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Fast Action Modal Button */}
        <div className="relative">
          <div className="flex rounded-xl shadow-xs overflow-hidden">
            <button
              onClick={() => openQuickModal('expense')}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Novo Lançamento</span>
              <span className="sm:hidden">Novo</span>
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="px-2 bg-blue-700 hover:bg-blue-800 text-white border-l border-blue-500/50 transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dropdown Options */}
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 z-50 animate-in fade-in zoom-in-95">
                <button
                  onClick={() => {
                    openQuickModal('expense');
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 text-left"
                >
                  <ArrowDownCircle className="w-4 h-4 text-rose-500" />
                  <span>Nova Despesa</span>
                </button>
                <button
                  onClick={() => {
                    openQuickModal('income');
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 text-left"
                >
                  <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
                  <span>Nova Receita</span>
                </button>
                <button
                  onClick={() => {
                    openQuickModal('transfer');
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 text-left"
                >
                  <ArrowLeftRight className="w-4 h-4 text-blue-500" />
                  <span>Transferência entre Contas</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Alternar tema"
          className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isDarkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Avatar */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200">
            {state.preferences.name?.substring(0, 2).toUpperCase() || 'NF'}
          </div>
        </div>
      </div>
    </header>
  );
};
