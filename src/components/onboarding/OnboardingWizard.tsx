import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Wallet,
  DollarSign,
  TrendingDown,
  Target,
  X,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { getTodayDateString } from '../../utils/formatters';

interface OnboardingWizardProps {
  onFinish?: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onFinish }) => {
  const { completeOnboarding, updatePreferences } = useFinance();

  const [step, setStep] = useState(1);

  // Step 1: Info básica
  const [name, setName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [startDate, setStartDate] = useState(getTodayDateString());

  // Step 2: Renda
  const [salary, setSalary] = useState('');
  const [salaryDay, setSalaryDay] = useState(5);
  const [otherIncome, setOtherIncome] = useState('');

  // Step 3: Despesas
  const [fixedExpenses, setFixedExpenses] = useState('');
  const [variableExpenses, setVariableExpenses] = useState('');

  // Step 4: Planejamento
  const [emergencyMonths, setEmergencyMonths] = useState(6);
  const [savingsPercentage, setSavingsPercentage] = useState(20);

  const handleSkipOrComplete = () => {
    completeOnboarding({
      name: name.trim() || 'Usuário PH',
      initialBalance: parseFloat(initialBalance.replace(',', '.')) || 0,
      salary: parseFloat(salary.replace(',', '.')) || 0,
      salaryDay: salaryDay || 5,
      fixedExpensesEstimate: parseFloat(fixedExpenses.replace(',', '.')) || 0,
      emergencyTargetMonths: emergencyMonths || 6,
    });
    if (onFinish) onFinish();
  };

  const stepsList = [
    { num: 1, title: 'Básico', icon: Wallet },
    { num: 2, title: 'Renda', icon: DollarSign },
    { num: 3, title: 'Despesas', icon: TrendingDown },
    { num: 4, title: 'Metas', icon: Target },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Top brand & step progress */}
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white relative">
          <button
            onClick={handleSkipOrComplete}
            className="absolute top-5 right-5 text-white/70 hover:text-white text-xs font-semibold px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-all flex items-center gap-1"
          >
            <span>Pular Assistente</span>
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
              Configuração Inicial — PH Finance
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Seja bem-vindo ao seu controle financeiro!
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 mt-1">
            Configure as informações iniciais para calcularmos seu saldo, despesas e metas.
          </p>

          {/* Stepper tabs */}
          <div className="grid grid-cols-4 gap-2 mt-5">
            {stepsList.map((s) => {
              const Icon = s.icon;
              const isDone = step > s.num;
              const isCurrent = step === s.num;
              return (
                <div
                  key={s.num}
                  className={`flex items-center gap-1.5 p-2 rounded-xl text-xs font-semibold transition-all ${
                    isCurrent
                      ? 'bg-white text-blue-900 shadow-md'
                      : isDone
                      ? 'bg-white/20 text-white'
                      : 'bg-white/5 text-white/50'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  ) : (
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="hidden sm:inline">{s.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Etapa 1: Informações Básicas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Como você gostaria de ser chamado e qual seu saldo disponível hoje?
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Seu Nome de Exibição
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pedro Henrique"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Saldo Inicial Disponível (R$)
                  </label>
                  <input
                    type="text"
                    placeholder="0,00"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Etapa 2: Fontes de Renda
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cadastre seu salário líquido ou recebimentos habituais para cálculo de fluxo mensal.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Salário Líquido Mensal (R$)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 5000,00"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dia Recebimento
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={salaryDay}
                    onChange={(e) => setSalaryDay(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Outras Rendas Estimadas (Freelances, Aluguéis, etc.)
                </label>
                <input
                  type="text"
                  placeholder="0,00"
                  value={otherIncome}
                  onChange={(e) => setOtherIncome(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Etapa 3: Despesas e Custos Fixos
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Estime seus compromissos recorrentes para calcularmos o dinheiro comprometido.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contas Fixas Mensais Estimadas (Aluguel, Luz, Internet, etc.) (R$)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 2200,00"
                  value={fixedExpenses}
                  onChange={(e) => setFixedExpenses(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Gastos Variáveis Estimados (Alimentação, Lazer, etc.) (R$)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 1200,00"
                  value={variableExpenses}
                  onChange={(e) => setVariableExpenses(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Etapa 4: Planejamento & Reserva de Emergência
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Defina suas metas de poupança para guiar os alertas e recomendações de inteligência.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reserva de Emergência Desejada ({emergencyMonths} meses de custo de vida)
                </label>
                <input
                  type="range"
                  min={3}
                  max={12}
                  step={1}
                  value={emergencyMonths}
                  onChange={(e) => setEmergencyMonths(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>3 meses (Mínimo)</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {emergencyMonths} Meses
                  </span>
                  <span>12 meses (Máxima segurança)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Meta de Economia Mensal ({savingsPercentage}% da renda)
                </label>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={savingsPercentage}
                  onChange={(e) => setSavingsPercentage(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>5%</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {savingsPercentage}% (Regra 50/30/20)
                  </span>
                  <span>50%</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 transition-all"
              >
                <span>Próximo Passo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSkipOrComplete}
                className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-500/20 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Concluir e Acessar Painel</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
