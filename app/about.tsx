import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const references = [
  {
    title: 'Dicas sobre comercialização de produto artesanal',
    source: 'Sebrae · E-book',
    description: 'Custos da produção artesanal, embalagens e comercialização.',
    url: 'https://sebrae.com.br/Sebrae/Portal%20Sebrae/Arquivos/ebook_dicas-sobre-comercializacao-de-porduto-artesanal.pdf',
  },
  {
    title: 'Como calcular o preço do seu produto em 2026',
    source: 'Sebrae RN · Artigo',
    description: 'Formação de preços, custos diretos, despesas e margem de lucro.',
    url: 'https://blog.rn.sebrae.com.br/precificar-produto-2026/',
  },
  {
    title: 'Gestão financeira para pequenos negócios',
    source: 'Sebrae RN · Guia',
    description: 'Organização financeira, separação de contas e planejamento.',
    url: 'https://blog.rn.sebrae.com.br/gestao-financeira-pequenos-negocios-guia-completo/',
  },
] as const;

async function openReference(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Não foi possível abrir a referência', 'Tente novamente ou confira sua conexão com a internet.');
  }
}

export default function AboutScreen() {
  const name = Constants.expoConfig?.name ?? 'Precifica Arte';
  const version = Constants.expoConfig?.version ?? '1.0.0';
  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <View className="items-center py-6">
          <View className="w-20 h-20 rounded-3xl bg-indigo-100 items-center justify-center mb-4">
            <Ionicons name="calculator-outline" size={40} color="#4f46e5" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 text-center">{name}</Text>
          <Text className="text-gray-500 mt-1">Versão {version}</Text>
        </View>
        <View className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-2">Sobre o aplicativo</Text>
          <Text className="text-gray-600 leading-6">Uma ferramenta para ajudar artesãos a calcular o preço de venda dos seus produtos, considerando materiais, tempo de confecção, despesas, taxas de pagamento e margem de lucro.</Text>
          <Text className="text-gray-600 leading-6 mt-2">O aplicativo permite acompanhar custos e precificações, organizar os dados do negócio e trabalhar mesmo sem conexão com a internet, com sincronização automática quando disponível.</Text>
        </View>
        <View className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
          <Text accessibilityRole="header" className="text-lg font-bold text-gray-800 mb-2">Como calculamos os preços</Text>
          <Text className="text-gray-600 leading-6">O aplicativo utiliza a formação de preços baseada em custos, adaptada à realidade do artesanato. Os valores vêm dos dados cadastrados por você, e não de uma tabela externa de preços.</Text>
          <View className="gap-3 mt-4">
            {[
              { title: 'Materiais e despesas adicionais', description: 'Custo proporcional à quantidade utilizada e gastos específicos da peça.' },
              { title: 'Mão de obra', description: 'Valor da hora de trabalho multiplicado pelo tempo de confecção. A remuneração é separada do lucro.' },
              { title: 'Despesas fixas', description: 'Gastos mensais divididos pelas horas produtivas e distribuídos conforme o tempo de confecção de cada peça.' },
              { title: 'Margem e taxas de pagamento', description: 'O preço base cobre os custos e a margem desejada. Quando há taxa de pagamento, o preço sugerido é ajustado para preservar o valor líquido.' },
            ].map(item => <View key={item.title} className="flex-row gap-2">
              <Ionicons name="checkmark-circle-outline" size={20} color="#4f46e5" style={{ marginTop: 2 }} />
              <View className="flex-1">
                <Text className="text-gray-800 font-semibold">{item.title}</Text>
                <Text className="text-gray-600 text-sm leading-5 mt-1">{item.description}</Text>
              </View>
            </View>)}
          </View>
          <View className="bg-indigo-50 rounded-xl p-3 mt-4">
            <Text className="text-indigo-900 font-semibold mb-2">Entenda a margem de lucro</Text>
            <Text className="text-indigo-800 text-sm leading-5">Preço base = custo total ÷ (1 − margem desejada)</Text>
            <Text className="text-indigo-800 text-sm leading-5 mt-2">Por exemplo, um custo de R$ 100,00 com margem de 30% resulta em um preço base de R$ 142,86, antes de eventuais taxas.</Text>
            <Text className="text-indigo-800 text-sm leading-5 mt-2">Na precificação manual, o lucro é o valor recebido após a taxa de pagamento menos o custo total. A margem é calculada sobre esse valor recebido, quando positivo.</Text>
          </View>
          <Text className="text-gray-500 text-sm leading-5 mt-3">Os resultados são estimativas. Impostos sobre vendas, comissões, fretes e outros custos não cadastrados podem afetar o lucro real. O aplicativo não registra vendas nem calcula automaticamente tributos.</Text>
        </View>
        <View className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
          <Text accessibilityRole="header" className="text-lg font-bold text-gray-800 mb-2">Fontes e referências</Text>
          <Text className="text-gray-600 leading-6">Os conceitos de precificação e gestão financeira têm como referência materiais do Serviço Brasileiro de Apoio às Micro e Pequenas Empresas (Sebrae). As dicas educativas são adaptadas ao artesanato, e as dicas de uso descrevem as funções do próprio aplicativo.</Text>
          <Text className="text-gray-600 text-sm leading-5 mt-2">As fórmulas, o rateio por horas e o cálculo da margem sobre o valor recebido são escolhas da metodologia do aplicativo, não uma reprodução de uma calculadora oficial do Sebrae.</Text>
          <View className="mt-3">
            {references.map((reference, index) => <Pressable key={reference.url}
              accessibilityRole="link" accessibilityLabel={'Consultar ' + reference.title + ', ' + reference.source}
              onPress={() => void openReference(reference.url)}
              className={'flex-row items-center gap-3 py-3 min-h-12 active:bg-gray-50 ' + (index ? 'border-t border-gray-100' : '')}>
              <View className="w-10 h-10 rounded-xl bg-indigo-50 items-center justify-center">
                <Ionicons name="book-outline" color="#4f46e5" size={22} />
              </View>
              <View className="flex-1">
                <Text className="text-indigo-700 font-semibold">{reference.title}</Text>
                <Text className="text-gray-500 text-xs mt-1">{reference.source}</Text>
                <Text className="text-gray-600 text-sm leading-5 mt-1">{reference.description}</Text>
              </View>
              <Ionicons name="open-outline" size={18} color="#6366f1" />
            </Pressable>)}
          </View>
          <Text className="text-gray-500 text-xs mt-2">Referências consultadas em 25/11/2026. A abertura dos links requer conexão com a internet.</Text>
        </View>
        <View className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-3">Desenvolvimento</Text>
          <View className="flex-row items-center gap-3">
            <View className="w-11 h-11 rounded-full bg-indigo-50 items-center justify-center">
              <Ionicons name="person-outline" size={23} color="#4f46e5" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-800 font-semibold">Larissa Laneiro dos Santos</Text>
              <Text className="text-sm text-gray-500 mt-1">Desenvolvedora</Text>
            </View>
          </View>
          <View className="border-t border-gray-100 mt-4 pt-3">
            <Text className="text-gray-700 font-medium">Projeto acadêmico</Text>
            <Text className="text-gray-500 text-sm mt-1">Fatec · Análise e Desenvolvimento de Sistemas</Text>
            <Text className="text-gray-500 text-sm mt-1">Desenvolvimento para Dispositivos Móveis</Text>
          </View>
        </View>
        <View className="bg-white border border-gray-200 rounded-2xl p-4">
          <Text className="text-lg font-bold text-gray-800 mb-2">Tecnologias utilizadas</Text>
          <Text className="text-gray-600 leading-6">React Native, Expo, TypeScript, SQLite e Firebase.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
