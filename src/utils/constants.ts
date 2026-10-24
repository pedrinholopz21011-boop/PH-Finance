export interface CategoryOption {
  id: string;
  name: string;
  iconName: string;
  subcategories: string[];
}

export const EXPENSE_CATEGORIES: CategoryOption[] = [
  {
    id: 'moradia',
    name: 'Moradia',
    iconName: 'Home',
    subcategories: [
      'Aluguel',
      'Prestação da casa',
      'Condomínio',
      'IPTU',
      'Manutenção',
      'Móveis',
      'Reparos',
    ],
  },
  {
    id: 'alimentacao',
    name: 'Alimentação',
    iconName: 'Utensils',
    subcategories: [
      'Supermercado',
      'Feira',
      'Açougue',
      'Padaria',
      'Restaurantes',
      'Lanches',
      'Delivery',
      'Água mineral',
      'Outros alimentos',
    ],
  },
  {
    id: 'contas_casa',
    name: 'Contas da Casa',
    iconName: 'Zap',
    subcategories: [
      'Energia elétrica',
      'Água',
      'Gás',
      'Internet e Wi-Fi',
      'Telefone',
      'Streaming',
      'TV por assinatura',
    ],
  },
  {
    id: 'saude_higiene',
    name: 'Saúde e Higiene',
    iconName: 'HeartPulse',
    subcategories: [
      'Higiene pessoal',
      'Produtos de limpeza',
      'Farmácia',
      'Consultas',
      'Exames',
      'Plano de saúde',
      'Academia',
      'Cuidados pessoais',
    ],
  },
  {
    id: 'transporte',
    name: 'Transporte',
    iconName: 'Car',
    subcategories: [
      'Combustível',
      'Transporte público',
      'Aplicativos de transporte',
      'Estacionamento',
      'Pedágios',
      'Manutenção de veículos',
      'Seguro',
      'IPVA',
      'Licenciamento',
    ],
  },
  {
    id: 'veiculos_financiamentos',
    name: 'Veículos e Financiamentos',
    iconName: 'Key',
    subcategories: [
      'Parcela de carro',
      'Parcela de moto',
      'Financiamento de veículos',
      'Consórcio',
      'Empréstimos',
      'Juros',
      'Taxas',
      'Outras parcelas',
    ],
  },
  {
    id: 'educacao',
    name: 'Educação',
    iconName: 'GraduationCap',
    subcategories: [
      'Mensalidade escolar',
      'Cursos',
      'Livros',
      'Material escolar',
      'Plataformas de ensino',
      'Idiomas',
    ],
  },
  {
    id: 'lazer_estilo',
    name: 'Lazer e Estilo de Vida',
    iconName: 'Palmtree',
    subcategories: [
      'Viagens',
      'Passeios',
      'Cinema',
      'Jogos',
      'Restaurantes e Bares',
      'Roupas',
      'Calçados',
      'Assinaturas',
      'Hobbies',
    ],
  },
  {
    id: 'trabalho_negocios',
    name: 'Trabalho e Negócios',
    iconName: 'Briefcase',
    subcategories: [
      'Softwares',
      'Ferramentas de IA',
      'Publicidade',
      'Hospedagem de sites',
      'Domínios',
      'Equipamentos',
      'Materiais',
      'Serviços terceirizados',
      'Taxas comerciais',
    ],
  },
  {
    id: 'financeiro',
    name: 'Financeiro',
    iconName: 'BadgePercent',
    subcategories: [
      'Tarifas bancárias',
      'Juros',
      'IOF',
      'Seguros',
      'Impostos',
      'Taxas de cartão',
    ],
  },
  {
    id: 'outros',
    name: 'Outros',
    iconName: 'MoreHorizontal',
    subcategories: [
      'Presentes',
      'Doações',
      'Emergências',
      'Gastos diversos',
    ],
  },
];

export const INCOME_CATEGORIES = [
  'Salário',
  'Trabalho autônomo',
  'Serviços digitais',
  'Vendas',
  'Comissões',
  'Benefícios',
  'Rendimentos de investimentos',
  'Aluguéis recebidos',
  'Presentes',
  'Reembolsos',
  'Outras receitas',
];

export const PAYMENT_METHODS = [
  { value: 'pix', label: 'Pix' },
  { value: 'credito', label: 'Cartão de Crédito' },
  { value: 'debito', label: 'Cartão de Débito' },
  { value: 'dinheiro', label: 'Dinheiro em Espécie' },
  { value: 'boleto', label: 'Boleto Bancário' },
  { value: 'transferencia', label: 'Transferência (TED/DOC)' },
  { value: 'outro', label: 'Outro' },
];

export const EXPENSE_NATURES = [
  { value: 'fixa', label: 'Fixa (mensal essencial)' },
  { value: 'variavel', label: 'Variável (conforme consumo)' },
  { value: 'eventual', label: 'Eventual (esporádica)' },
  { value: 'essencial', label: 'Essencial (vital)' },
  { value: 'nao_essencial', label: 'Não Essencial (estilo de vida)' },
  { value: 'planejada', label: 'Planejada' },
  { value: 'imprevista', label: 'Imprevista' },
];
