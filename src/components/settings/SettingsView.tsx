import React, { useState } from 'react';
import {
  Settings,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Moon,
  Sun,
  ShieldCheck,
  CheckCircle2,
  Tag,
  Plus,
  X,
  AlertTriangle,
  User,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export const SettingsView: React.FC = () => {
  const {
    state,
    updatePreferences,
    exportBackup,
    importBackup,
    resetToDemoData,
    clearAllData,
  } = useFinance();

  const [name, setName] = useState(state.preferences.name || '');
  const [email, setEmail] = useState(state.preferences.email || '');
  const [emergencyTargetMonths, setEmergencyTargetMonths] = useState(
    state.preferences.emergencyFundTargetMonths || 6
  );
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [importJsonInput, setImportJsonInput] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);

  const isDarkMode = state.preferences.theme === 'dark';

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updatePreferences({
      name: name.trim(),
      email: email.trim(),
      emergencyFundTargetMonths: Number(emergencyTargetMonths),
    });
  };

  const handleToggleTheme = () => {
    const nextTheme = isDarkMode ? 'light' : 'dark';
    updatePreferences({ theme: nextTheme });
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleAddCustomCategory = () => {
    if (!newCategoryInput.trim()) return;
    const current = state.preferences.customCategories || [];
    if (!current.includes(newCategoryInput.trim())) {
      updatePreferences({
        customCategories: [...current, newCategoryInput.trim()],
      });
    }
    setNewCategoryInput('');
  };

  const handleRemoveCustomCategory = (cat: string) => {
    const current = state.preferences.customCategories || [];
    updatePreferences({
      customCategories: current.filter((c) => c !== cat),
    });
  };

  const handleExecuteImport = () => {
    if (!importJsonInput.trim()) return;
    const success = importBackup(importJsonInput.trim());
    if (success) {
      setImportModalOpen(false);
      setImportJsonInput('');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Configurações do PH Finance
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Personalize preferências regionais, tema, categorias e gerencie seus backups
        </p>
      </div>

      {/* 1. Perfil & Preferências */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" />
          <span>Perfil & Preferências Globais</span>
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Nome de Exibição
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                E-mail Cadastrado
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Moeda Padrão
              </label>
              <input
                type="text"
                disabled
                value="BRL — Real Brasileiro (R$)"
                className="w-full px-3.5 py-2 text-xs bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Formato de Data
              </label>
              <input
                type="text"
                disabled
                value="DD/MM/AAAA"
                className="w-full px-3.5 py-2 text-xs bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Fuso Horário
              </label>
              <input
                type="text"
                disabled
                value="America/Bahia (UTC-3)"
                className="w-full px-3.5 py-2 text-xs bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleToggleTheme}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              <span>{isDarkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}</span>
            </button>

            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors"
            >
              Salvar Preferências
            </button>
          </div>
        </form>
      </div>

      {/* 2. Categorias Personalizadas */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Tag className="w-4 h-4 text-blue-600" />
            <span>Categorias Personalizadas Adicionais</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Crie categorias exclusivas que serão exibidas em todos os seletores de despesas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Nova categoria (ex: Cuidados com Pets, Horta, Condomínio Extra)..."
            value={newCategoryInput}
            onChange={(e) => setNewCategoryInput(e.target.value)}
            className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
          />
          <button
            type="button"
            onClick={handleAddCustomCategory}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {(state.preferences.customCategories || []).map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <span>{cat}</span>
              <button
                onClick={() => handleRemoveCustomCategory(cat)}
                className="text-slate-400 hover:text-rose-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* 3. Armazenamento, Backup & Exclusão de Dados */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Backup, Restauração & Privacidade Local</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Seus dados estão armazenados localmente no seu navegador com total privacidade e sem cookies de rastreamento
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={exportBackup}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3"
          >
            <Download className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                Exportar Backup JSON
              </span>
              <span className="text-[11px] text-slate-400">
                Baixe um arquivo seguro com todas as suas contas e transações
              </span>
            </div>
          </button>

          <button
            onClick={() => setImportModalOpen(true)}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3"
          >
            <Upload className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                Importar / Restaurar Backup
              </span>
              <span className="text-[11px] text-slate-400">
                Suba um arquivo JSON exportado anteriormente
              </span>
            </div>
          </button>

          <button
            onClick={() => {
              if (confirm('Restaurar a base demonstrativa completa com exemplos realistas?')) {
                resetToDemoData();
              }
            }}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3"
          >
            <RefreshCw className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                Carregar Base Demonstrativa
              </span>
              <span className="text-[11px] text-slate-400">
                Preenche com transações, contas e metas realistas para exploração
              </span>
            </div>
          </button>

          <button
            onClick={() => {
              const code = prompt('Digite "CONFIRMAR" para apagar permanentemente todos os registros:');
              if (code === 'CONFIRMAR') {
                clearAllData();
              }
            }}
            className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20 text-left hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-3"
          >
            <Trash2 className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold text-xs sm:text-sm text-rose-700 dark:text-rose-300 block">
                Zerar Todos os Dados
              </span>
              <span className="text-[11px] text-rose-600/70">
                Limpa permanentemente todas as contas e transações
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Modal: Import Backup */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Importar Backup JSON
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Cole o conteúdo JSON do seu arquivo de backup exportado anteriormente:
            </p>

            <textarea
              rows={8}
              value={importJsonInput}
              onChange={(e) => setImportJsonInput(e.target.value)}
              placeholder="Cole o código JSON aqui..."
              className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 mt-3">
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors"
              >
                Restaurar Dados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
