import type { Tip } from '../components/TipsCarousel';

// Orientações gerais adaptadas ao artesanato, e dicas de uso específicas do app.
// Referências consultadas:
// https://blog.rn.sebrae.com.br/gestao-financeira-pequenos-negocios-guia-completo/
// https://blog.rn.sebrae.com.br/precificar-produto-2026/
// https://sebrae.com.br/Sebrae/Portal%20Sebrae/Arquivos/ebook_dicas-sobre-comercializacao-de-porduto-artesanal.pdf
export const HOME_TIPS: readonly Tip[] = [
  { category: 'Mão de obra', title: 'Valorize seu tempo', description: 'Sua mão de obra remunera seu trabalho. O lucro do negócio é calculado separadamente.', icon: 'time-outline' },
  { category: 'Precificação', title: 'Margem não é acréscimo', description: 'Somar 30% ao custo não resulta em 30% de margem de lucro sobre a venda.', icon: 'calculator-outline' },
  { category: 'Materiais', title: 'Pequenos gastos contam', description: 'Inclua etiquetas, sacolas, fitas e embalagens que utiliza em cada peça.', icon: 'cube-outline' },
  { category: 'Organização financeira', title: 'Separe suas finanças', description: 'Mantenha o dinheiro do negócio separado das despesas pessoais.', icon: 'wallet-outline' },
  { category: 'Materiais', title: 'Compare antes de comprar', description: 'Compare o custo por kg, metro, litro ou unidade, não só o preço da embalagem.', icon: 'basket-outline' },
  { category: 'Precificação', title: 'Desconto com consciência', description: 'Simule o preço promocional na precificação manual antes de oferecer um desconto.', icon: 'pricetag-outline' },
  { category: 'Formas de pagamento', title: 'Lembre-se das taxas', description: 'As taxas da maquininha reduzem o valor que você recebe pela venda.', icon: 'card-outline' },
  { category: 'Despesas', title: 'Seu espaço tem um custo', description: 'Considere a parte de energia, aluguel e outros gastos que pertence ao negócio.', icon: 'home-outline' },
  { category: 'Mão de obra', title: 'Cronometre a confecção', description: 'Registre o tempo real necessário para produzir suas peças, inclusive o acabamento.', icon: 'stopwatch-outline' },
  { category: 'Materiais', title: 'Considere as sobras', description: 'Inclua as perdas de material que normalmente acontecem durante a produção.', icon: 'cut-outline' },
  { category: 'Organização financeira', title: 'Registre seus gastos', description: 'Anote compras e despesas do negócio. Isso ajuda a entender para onde vai o dinheiro.', icon: 'receipt-outline' },
  { category: 'Precificação', title: 'Preço mínimo não é lucro', description: 'Cobrir todos os custos é o ponto de equilíbrio. Para lucrar, o valor líquido precisa ser maior.', icon: 'scale-outline' },
  { category: 'Mão de obra', title: 'Planeje horas realistas', description: 'Ao estimar suas horas produtivas, reserve tempo para tarefas que não são de confecção.', icon: 'calendar-outline' },
  { category: 'Materiais', title: 'Revise os preços de compra', description: 'Confirme ou atualize os custos dos materiais sempre que conferir os preços dos fornecedores.', icon: 'refresh-outline' },
  { category: 'Precificação', title: 'Olhe além da concorrência', description: 'Compare preços do mercado, mas considere também seus custos e a qualidade do seu trabalho.', icon: 'search-outline' },
  { category: 'Despesas', title: 'Custos de peças especiais', description: 'Inclua serviços extras, como bordados terceirizados, apenas nos produtos que precisam deles.', icon: 'construct-outline' },
  { category: 'Formas de pagamento', title: 'Confira as condições', description: 'Verifique as taxas reais do seu Pix, débito e crédito à vista antes de configurá-las.', icon: 'card-outline' },
  { category: 'Organização financeira', title: 'Reserve dinheiro para o negócio', description: 'Planeje a reposição dos materiais e uma reserva para gastos inesperados.', icon: 'shield-checkmark-outline' },
  { category: 'Como usar o app', title: 'Acompanhe os custos', description: 'Abra os detalhes de um material para comparar o preço equivalente ao longo do tempo.', icon: 'trending-up-outline' },
  { category: 'Como usar o app', title: 'Simule antes de decidir', description: 'Experimente diferentes margens e preços de venda sem precisar salvar cada simulação.', icon: 'options-outline' },
  { category: 'Como usar o app', title: 'Guarde suas precificações', description: 'Salve o cálculo para consultar depois os preços, custos e condições utilizados.', icon: 'bookmark-outline' },
  { category: 'Despesas', title: 'Não conte um gasto duas vezes', description: 'Se já incluiu uma embalagem nos materiais de uma peça, não a some também como despesa adicional.', icon: 'layers-outline' },
  { category: 'Precificação', title: 'Confira todos os custos', description: 'Impostos, comissões e fretes podem afetar seu resultado. Considere gastos não cobertos pelo cálculo.', icon: 'alert-circle-outline' },
  { category: 'Organização financeira', title: 'Simulação não é venda', description: 'O lucro estimado ajuda a planejar preços, mas não substitui o controle das vendas realizadas.', icon: 'stats-chart-outline' },
];

// Fisher–Yates: todas as dicas aparecem uma vez, em ordem aleatória.
export function shuffleTips<T>(tips: readonly T[], random = Math.random): T[] {
  const shuffled = [...tips];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Embaralha uma única vez por execução do app, sem mudar a ordem durante a navegação.
export const SESSION_HOME_TIPS: readonly Tip[] = shuffleTips(HOME_TIPS);
