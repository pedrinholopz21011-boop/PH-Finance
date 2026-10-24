import React, { useState } from 'react';
import {
  Building2,
  Plus,
  TrendingUp,
  ShieldCheck,
  Landmark,
  Coins,
  Car,
  FileText,
  Trash2,
  Edit2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Asset, AssetType } from '../../types/finance';
import { formatBRL, formatDate, getTodayDateString, roundMoney } from '../../utils/formatters';

export const PatrimonyView: React.FC = () => {
  const { state, addAsset, updateAsset, deleteAsset, kpis } = useFinance();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<AssetType>('fixed_income');
  const [currentValue, setCurrentValue] = useState('');
  const [acquisitionCost, setAcquisitionCost] = useState('');
  const [institution, setInstitution] = useState('');
  const [notes, setNotes] = useState('');

  // 1. Ativos Totais = Saldos em Contas Bancárias + Bens e Investimentos Registrados
  const bankAccountsTotal = kpis.currentBalance;
  const otherAssetsTotal = state.assets.reduce((sum, a) => sum + a.currentValue, 0);
  const totalAssets = roundMoney(bankAccountsTotal + otherAssetsTotal);

  // 2. Passivos Totais = Total de Dívidas em Aberto
  const totalLiabilities = kpis.openDebtsTotal;

  // 3. Patrimônio Líquido = Ativos - Passivos
  const netWorth = roundMoney(totalAssets - totalLiabilities);

  const handleOpenNew = () => {
    setEditingAsset(null);
    setName('');
    setType('fixed_income');
    setCurrentValue('');
    setAcquisitionCost('');
    setInstitution('');
    setNotes('');
    setModalOpen(true);
  };

  const handleOpenEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setName(asset.name);
    setType(asset.type);
    setCurrentValue(asset.currentValue.toString());
    setAcquisitionCost(asset.acquisitionCost.toString());
    setInstitution(asset.institution || '');
    setNotes(asset.notes || '');
    setModalOpen(true);
  };

  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const currentNum = parseFloat(currentValue.replace(',', '.')) || 0;
    const costNum = parseFloat(acquisitionCost.replace(',', '.')) || currentNum;

    if (editingAsset) {
      updateAsset(editingAsset.id, {
        name: name.trim(),
        type,
        currentValue: roundMoney(currentNum),
        acquisitionCost: roundMoney(costNum),
        institution: institution.trim(),
        updatedAt: getTodayDateString(),
        notes: notes.trim(),
      });
    } else {
      addAsset({
        name: name.trim(),
        type,
        currentValue: roundMoney(currentNum),
        acquisitionCost: roundMoney(costNum),
        institution: institution.trim() || 'Manual',
        updatedAt: getTodayDateString(),
        notes: notes.trim(),
      });
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Patrimônio Líquido & Investimentos
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cálculo contábil: Patrimônio Líquido = Ativos Totais (contas + bens) − Passivos (dívidas)
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Ativo / Bem</span>
        </button>
      </div>

      {/* Main Net Worth Master Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-blue-900/40">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
            Balanço Patrimonial Pessoal
          </span>
          <div className="text-3xl sm:text-4xl font-black tracking-tight mt-1">
            {formatBRL(netWorth)}
          </div>
          <p className="text-xs text-blue-200/80 mt-1">
            Patrimônio líquido consolidado descontando todas as obrigações
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
            <span className="text-[11px] text-blue-200 block">Total de Ativos (+)</span>
            <span className="text-base font-bold text-emerald-300">{formatBRL(totalAssets)}</span>
            <span className="text-[10px] text-white/60 block mt-0.5">Contas + Investimentos + Bens</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
            <span className="text-[11px] text-blue-200 block">Total de Passivos (−)</span>
            <span className="text-base font-bold text-rose-300">{formatBRL(totalLiabilities)}</span>
            <span className="text-[10px] text-white/60 block mt-0.5">Dívidas & Financiamentos</span>
          </div>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Bens, Investimentos e Ativos Cadastrados
          </h3>
          <span className="text-xs text-slate-500 font-semibold">
            Total em Bens: {formatBRL(otherAssetsTotal)}
          </span>
        </div>

        {state.assets.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
            Nenhum investimento ou bem cadastrado ainda. Adicione veículos, imóveis ou investimentos
            para monitorar sua evolução patrimonial.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.assets.map((asset) => {
              const profit = roundMoney(asset.currentValue - asset.acquisitionCost);
              const profitPercent =
                asset.acquisitionCost > 0
                  ? roundMoney((profit / asset.acquisitionCost) * 100)
                  : 0;

              return (
                <div
                  key={asset.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                          {asset.type.replace('_', ' ')}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1.5">
                          {asset.name}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          {asset.institution || 'Custódia própria'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(asset)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Excluir ativo "${asset.name}"?`)) {
                              deleteAsset(asset.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="my-3">
                      <span className="text-[11px] text-slate-400 block">Valor Atual:</span>
                      <div className="text-2xl font-black text-slate-900 dark:text-white">
                        {formatBRL(asset.currentValue)}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs flex justify-between items-center">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Custo de Aquisição:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {formatBRL(asset.acquisitionCost)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 text-[10px] block">Variação Histórica:</span>
                        <span
                          className={`font-bold flex items-center gap-0.5 justify-end ${
                            profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {profit >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {profitPercent}% ({formatBRL(profit)})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                    Última atualização: {formatDate(asset.updatedAt)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: New / Edit Asset */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              {editingAsset ? 'Editar Ativo Patrimonial' : 'Cadastrar Ativo / Bem'}
            </h3>

            <form onSubmit={handleSaveAsset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Nome do Ativo / Bem *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Apartamento, Onix Sedan 2022, Tesouro Selic 2029"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Tipo do Ativo
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AssetType)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="fixed_income">Renda Fixa / CDB / Tesouro</option>
                    <option value="investment_fund">Fundos / FIIs</option>
                    <option value="stocks">Ações</option>
                    <option value="etfs">ETFs</option>
                    <option value="crypto">Criptomoedas</option>
                    <option value="real_estate">Imóvel</option>
                    <option value="vehicle">Veículo (Carro / Moto)</option>
                    <option value="savings">Poupança</option>
                    <option value="other">Outro Ativo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Instituição / Local
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Itaú, XP, FIPE"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Valor de Mercado Atual (R$) *
                  </label>
                  <input
                    type="text"
                    placeholder="25000,00"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Custo de Aquisição (R$)
                  </label>
                  <input
                    type="text"
                    placeholder="22000,00"
                    value={acquisitionCost}
                    onChange={(e) => setAcquisitionCost(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Observações
                </label>
                <input
                  type="text"
                  placeholder="Detalhes ou liquidez..."
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
                  Salvar Ativo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
