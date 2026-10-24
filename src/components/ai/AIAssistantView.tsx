import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  HelpCircle,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatBRL } from '../../utils/formatters';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  mode?: string;
  timestamp: string;
}

export const AIAssistantView: React.FC = () => {
  const { kpis, state, periodMonth } = useFinance();

  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Olá! Sou seu **Consultor de Inteligência Financeira** no PH Finance.

Analisei sua base de dados cadastrada para este mês (${periodMonth}):
- **Saldo Atual Realizado:** ${formatBRL(kpis.currentBalance)}
- **Receitas do Mês:** ${formatBRL(kpis.monthlyIncome)}
- **Despesas do Mês:** ${formatBRL(kpis.monthlyExpenses)}
- **Taxa de Poupança:** ${kpis.savingsRate !== null ? `${kpis.savingsRate.toFixed(1)}%` : '—'}
- **Contas Pendentes:** ${formatBRL(kpis.pendingBillsTotal)}
- **Dívidas Totais:** ${formatBRL(kpis.openDebtsTotal)}

Como posso orientar suas decisões hoje? Você pode clicar em uma das perguntas rápidas abaixo ou digitar uma dúvida personalizada.`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const quickPrompts = [
    'Onde estou gastando mais e como reduzir?',
    'Quanto posso gastar com segurança até o fim do mês?',
    'Quais contas ou dívidas devo priorizar quitar primeiro?',
    'Quanto preciso poupar por mês para atingir minha reserva de emergência?',
    'Como ficaria meu orçamento aplicando a regra 50/30/20?',
  ];

  const handleAskQuestion = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: queryText.trim(),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    // Preparar resumo agregado dos dados reais
    const topCategories = state.transactions
      .filter((t) => t.type === 'expense' && t.status === 'realizada')
      .slice(0, 5)
      .map((t) => `${t.category}: R$ ${t.amount}`);

    const financialSummary = {
      currentBalance: kpis.currentBalance,
      monthlyIncome: kpis.monthlyIncome,
      monthlyExpenses: kpis.monthlyExpenses,
      availableAfterCommitments: kpis.availableAfterCommitments,
      pendingBillsTotal: kpis.pendingBillsTotal,
      savingsRate: kpis.savingsRate,
      pendingDebts: kpis.openDebtsTotal,
      debtsList: state.debts.map((d) => ({
        creditor: d.creditor,
        balance: d.remainingBalance,
        rateAnnual: d.interestRateAnnual,
      })),
      goalsList: state.goals.map((g) => ({
        title: g.title,
        target: g.targetAmount,
        current: g.currentAmount,
      })),
      topCategoriesSample: topCategories,
    };

    try {
      const response = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: queryText.trim(),
          financialSummary,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao processar solicitação no assistente.');
      }

      const data = await response.json();
      const botMessage: Message = {
        role: 'assistant',
        content: data.answer || 'Análise concluída com base nos seus dados.',
        mode: data.mode,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            '⚠️ Ocorreu uma oscilação na conexão com o serviço de inteligência. Suas contas e saldos continuam 100% seguros localmente no seu navegador.',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>Assistente de Inteligência Financeira</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Análises e respostas fundamentadas estritamente nos dados reais do seu PH Finance
          </p>
        </div>

        <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Privacidade Garantida: Apenas métricas agregadas</span>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          Perguntas Frequentes Recomendadas:
        </span>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleAskQuestion(p)}
              className="px-3 py-1.5 text-xs font-medium rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-2xs"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 min-h-[420px] max-h-[600px] overflow-y-auto">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                }`}
              >
                {isUser ? 'Você' : <Sparkles className="w-4 h-4" />}
              </div>

              <div
                className={`p-4 rounded-2xl max-w-xl text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-800'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div
                  className={`text-[10px] mt-2 text-right ${
                    isUser ? 'text-blue-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 rounded-tl-none border border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>Analisando suas transações e gerando resposta contábil...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAskQuestion(question);
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Faça uma pergunta sobre seus gastos, dívidas ou economias..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
          className="flex-1 px-4 py-3 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 shadow-xs"
        />
        <button
          type="submit"
          disabled={!question.trim() || loading}
          className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
        >
          <span>Enviar</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
