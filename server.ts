import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    system: 'PH Finance API',
    timestamp: new Date().toISOString(),
  });
});

// Gemini AI Financial Assistant Endpoint
app.post('/api/gemini/advisor', async (req: Request, res: Response) => {
  try {
    const { question, financialSummary } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'A pergunta ou tópico é obrigatório.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Heuristic fallback if GEMINI_API_KEY is not provisioned yet
      return res.json({
        answer: generateLocalFinancialAdvice(question, financialSummary),
        mode: 'heuristic_insight',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `
Você é o Assistente Especialista de Inteligência Financeira do PH FINANCE.
O usuário está no Brasil (moeda BRL R$, data DD/MM/AAAA, fuso America/Bahia).
Você deve agir com total rigor contábil, tom profissional, empático, objetivo e sem rodeios.

Dados Financeiros Reais Consolidados do Usuário:
${JSON.stringify(financialSummary, null, 2)}

Pergunta / Pedido do Usuário:
"${question}"

Diretrizes Obrigatórias:
1. Responda em Português do Brasil com excelente formatação em Markdown (tópicos, negritos, valores em R$).
2. Diferencie claramente fatos observados (valores realizados e cadastrados) de estimativas/projeções.
3. Não invente números, investimentos garantidos nem promessas irreais de rentabilidade.
4. Forneça conselhos práticos, baseados no método 50/30/20, reserva de emergência (3 a 6 meses de despesas essenciais) e estratégias de quitação de dívidas (Avalanche e Bola de Neve).
5. Se o usuário perguntar algo que os dados não cobrem, explique o que falta cadastrar.
`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'Você é o consultor de inteligência financeira do sistema PH Finance. Forneça análises matemáticas precisas, orientações de economia e planejamento baseados estritamente nos dados do usuário.',
          temperature: 0.3,
        },
      });

      const text = response.text || 'Não foi possível gerar uma resposta detalhada no momento.';
      return res.json({ answer: text, mode: 'ai_gemini' });
    } catch (apiErr: any) {
      console.warn('Gemini API call failed, using graceful financial heuristic:', apiErr?.message);
      return res.json({
        answer: generateLocalFinancialAdvice(question, financialSummary),
        mode: 'heuristic_fallback',
      });
    }
  } catch (error: any) {
    console.error('Gemini Advisor Error:', error);
    return res.status(500).json({
      error: 'Erro ao processar análise inteligente.',
      details: error?.message || 'Falha de comunicação',
    });
  }
});

function generateLocalFinancialAdvice(question: string, summary: any): string {
  const currentBalance = summary?.currentBalance || 0;
  const monthlyIncome = summary?.monthlyIncome || 0;
  const monthlyExpenses = summary?.monthlyExpenses || 0;
  const savingsRate = summary?.savingsRate || 0;
  const pendingDebts = summary?.pendingDebts || 0;

  return `### Análise Inteligente PH Finance

**Resumo da sua saúde financeira:**
- **Saldo Atual Realizado:** R$ ${Number(currentBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- **Receitas do Mês:** R$ ${Number(monthlyIncome).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- **Despesas do Mês:** R$ ${Number(monthlyExpenses).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- **Taxa de Poupança:** ${Number(savingsRate).toFixed(1)}%
- **Compromissos em Dívidas:** R$ ${Number(pendingDebts).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

**Recomendações Práticas para "${question}":**
1. **Controle de Despesas Fixas:** Mantenha seus compromissos fixos abaixo de 50% da sua renda líquida para ter margem de manobra em imprevistos.
2. **Reserva de Emergência:** Seu objetivo deve ser acumular pelo menos 3 a 6 meses do custo de vida essencial em contas de liquidez imediata.
3. **Estratégia de Dívidas:** Se houver juros rotativos de cartão ou cheque especial, priorize liquidá-los primeiro pelo método Avalanche (maior taxa de juros).
4. **Alocação Inteligente:** Monitore as categorias com alertas de 75% e 90% ativadas no módulo de Orçamento para evitar surpresas no fim do mês.`;
}

// Vite middleware in dev or static files in production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[PH Finance] Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();
