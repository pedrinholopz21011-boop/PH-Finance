/**
 * Formatador oficial para o sistema PH FINANCE
 * Moeda: Real Brasileiro (BRL)
 * Datas: DD/MM/AAAA
 * Fuso horário seguro: America/Bahia / Local
 */

export function roundMoney(value: number): number {
  if (isNaN(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatBRL(value: number, includeSymbol: boolean = true): string {
  const rounded = roundMoney(value);
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: includeSymbol ? 'currency' : 'decimal',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rounded);

  return formatted;
}

export function parseBRLInput(input: string): number {
  if (!input) return 0;
  // Limpa caracteres não numéricos exceto vírgula e ponto
  const clean = input
    .replace(/[^\d,-]/g, '')
    .replace(',', '.');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : roundMoney(parsed);
}

/**
 * Converte 'YYYY-MM-DD' para 'DD/MM/AAAA' sem distorção de fuso horário UTC
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  return dateString;
}

/**
 * Retorna a data de hoje no formato YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converte "2026-10" em "Outubro de 2026"
 */
export function formatMonthYear(monthStr: string): string {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const idx = parseInt(month, 10) - 1;
  if (idx >= 0 && idx < 12) {
    return `${monthNames[idx]} de ${year}`;
  }
  return monthStr;
}

/**
 * Retorna o mês corrente no formato YYYY-MM
 */
export function getCurrentMonthString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Calcula a diferença em dias entre duas datas (YYYY-MM-DD)
 */
export function getDaysDiff(targetDateStr: string, baseDateStr: string = getTodayDateString()): number {
  const target = new Date(targetDateStr + 'T00:00:00');
  const base = new Date(baseDateStr + 'T00:00:00');
  const diffTime = target.getTime() - base.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Verifica se uma conta ou obrigação está vencida
 */
export function isBillOverdue(dueDateStr: string, status: string): boolean {
  if (status === 'realizada' || status === 'pago') return false;
  const today = getTodayDateString();
  return dueDateStr < today;
}
