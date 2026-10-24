import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  CreditCard,
  CalendarDays,
  PieChart,
  BadgePercent,
  TrendingUp,
  Target,
  Building2,
  FileBarChart,
  Sparkles,
  Settings,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatBRL } from '../../utils/formatters';

export type ActiveTab =
  | 'dashboard'
  | 'transactions'
  | 'accounts'
  | 'cards'
  | 'bills'
  | 'budget'
  | 'debts'
  | 'planning'
  | 'goals'
  | 'patrimony'
  | 'reports'
  | 'ai'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
}) => {
  const { kpis, state, activeAccounts } = useFinance();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transações', icon: ArrowLeftRight },
    { id: 'accounts', label: 'Contas & Carteiras', icon: Wallet },
    { id: 'cards', label: 'Cartões de Crédito', icon: CreditCard },
    { id: 'bills', label: 'Contas & Calendário', icon: CalendarDays },
    { id: 'budget', label: 'Orçamento & Limites', icon: PieChart },
    { id: 'debts', label: 'Dívidas & Quitação', icon: BadgePercent },
    { id: 'planning', label: 'Planejamento 3-12M', icon: TrendingUp },
    { id: 'goals', label: 'Metas & Reserva', icon: Target },
    { id: 'patrimony', label: 'Patrimônio Líquido', icon: Building2 },
    { id: 'reports', label: 'Relatórios & Exportar', icon: FileBarChart },
    { id: 'ai', label: 'Assistente IA', icon: Sparkles, badge: 'Gemini' },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const handleNavClick = (tabId: string) => {
    onSelectTab(tabId as ActiveTab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-black text-sm tracking-wide">
              PH
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">
                  PH
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-bold text-lg tracking-tight">
                  FINANCE
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Controle Financeiro
              </p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick balance peek */}
        <div className="mx-4 my-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Saldo Realizado</span>
            {activeAccounts.length === 0 && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Sem contas</span>
            )}
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {formatBRL(kpis.currentBalance)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Disponível pós-contas:</span>
            <span
              className={`font-semibold ${
                kpis.availableAfterCommitments >= 0
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-rose-700 dark:text-rose-300'
              }`}
            >
              {formatBRL(kpis.availableAfterCommitments)}
            </span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-600/15 dark:text-blue-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info: Local storage status */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="truncate">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Dados Locais</span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                Privacidade total no navegador
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
