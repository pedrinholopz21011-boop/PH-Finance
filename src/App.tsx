/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { QuickTransactionModal } from './components/common/QuickTransactionModal';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { AccountsView } from './components/accounts/AccountsView';
import { CardsView } from './components/cards/CardsView';
import { BillsCalendarView } from './components/bills/BillsCalendarView';
import { BudgetView } from './components/budget/BudgetView';
import { DebtsView } from './components/debts/DebtsView';
import { PlanningScenariosView } from './components/planning/PlanningScenariosView';
import { GoalsView } from './components/goals/GoalsView';
import { PatrimonyView } from './components/patrimony/PatrimonyView';
import { ReportsView } from './components/reports/ReportsView';
import { AIAssistantView } from './components/ai/AIAssistantView';
import { SettingsView } from './components/settings/SettingsView';

const MainLayout: React.FC = () => {
  const { state, notification } = useFinance();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchTerm] = useState('');

  // Initial theme sync with user preferences
  useEffect(() => {
    if (state.preferences.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.preferences.theme]);

  // If user starts searching, switch to transactions view for instant results
  const handleSearchChange = (q: string) => {
    setSearchTerm(q);
    if (q.trim() && activeTab !== 'transactions') {
      setActiveTab('transactions');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Global Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-72">
        {/* Top Header */}
        <Header
          onOpenMobile={() => setMobileOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
        />

        {/* View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && <DashboardView onNavigateTab={setActiveTab} />}
          {activeTab === 'transactions' && <TransactionsView />}
          {activeTab === 'accounts' && <AccountsView />}
          {activeTab === 'cards' && <CardsView />}
          {activeTab === 'bills' && <BillsCalendarView />}
          {activeTab === 'budget' && <BudgetView />}
          {activeTab === 'debts' && <DebtsView />}
          {activeTab === 'planning' && <PlanningScenariosView />}
          {activeTab === 'goals' && <GoalsView />}
          {activeTab === 'patrimony' && <PatrimonyView />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'ai' && <AIAssistantView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Quick Transaction Modal (Available Everywhere via '+ Novo Lançamento') */}
      <QuickTransactionModal />

      {/* First-time Onboarding Wizard */}
      {!state.preferences.onboardingCompleted && <OnboardingWizard />}

      {/* Toast Notification Alert */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 text-xs font-semibold max-w-md border border-slate-700/50">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <MainLayout />
    </FinanceProvider>
  );
}
