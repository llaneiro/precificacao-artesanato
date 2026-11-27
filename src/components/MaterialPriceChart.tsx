import { formatNumber } from '../utils/numberDisplay';
import { useState } from 'react';
import { View, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { HelpLabel } from './HelpTip';
import { formatEquivalentPrice, materialPriceTrend } from '../utils/materialPriceTrend';

type Trend = ReturnType<typeof materialPriceTrend>;
const MAX_POINTS = 60;
const HEIGHT = 144;
const PAD = 8;
const dateLabel = (date: string) => new Date(date).toLocaleDateString('pt-BR');

function Variation({ title, value }: { title: string; value: number | null }) {
  const color = value === null || value === 0 ? 'text-gray-700' : value > 0 ? 'text-red-700' : 'text-green-700';
  const background = value === null || value === 0 ? 'bg-gray-50' : value > 0 ? 'bg-red-50' : 'bg-green-50';
  const label = value === null ? 'Sem comparação' : value > 0 ? 'Aumento no custo' : value < 0 ? 'Redução no custo' : 'Sem variação';
  return <View className={'flex-1 min-w-[115px] p-3 rounded-xl ' + background}>
    <Text className="text-gray-600 text-xs">{title}</Text>
    <Text className={'font-bold text-lg mt-1 ' + color}>{value === null ? '—' : (value > 0 ? '+' : '') + formatNumber(value) + '%'}</Text>
    <Text className={'text-xs mt-1 ' + color}>{label}</Text>
  </View>;
}

export function MaterialPriceChart({ trend }: { trend: Trend }) {
  const points = trend.points.slice(-MAX_POINTS);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [width, setWidth] = useState(0);
  const selectedIndex = points.findIndex(p => p.id === selectedId);
  const index = selectedIndex < 0 ? points.length - 1 : selectedIndex;
  const selected = points[index];
  const max = Math.max(0, ...points.map(p => p.value));
  const min = Math.min(...points.map(p => p.value));
  const span = max - min;
  // Pontos igualmente espaçados por registro, não por tempo. Datas reais no seletor.
  const coords = points.map((p,i) => ({
    x: PAD + (width - 2 * PAD) * i / Math.max(1, points.length - 1),
    y: span > 0 ? PAD + (HEIGHT - 2 * PAD) * (max - p.value) / span : HEIGHT / 2,
  }));
  return <View className="bg-white border border-gray-200 rounded-2xl p-4">
    <HelpLabel title="Evolução do preço" message="Comparamos os preços por uma unidade equivalente, independentemente do tamanho da compra. Cada ponto representa um registro, com espaçamento igual entre registros. A referência inicial de materiais antigos não representa necessariamente uma compra." className="text-lg font-bold text-gray-800" />
    {points.length < 2 ? <View className="bg-gray-50 rounded-xl p-4 my-2 gap-2">
      <Ionicons name="trending-up-outline" color="#818cf8" size={26} />
      <Text className="text-gray-700 font-semibold">Acompanhe a evolução do custo</Text>
      <Text className="text-gray-500 text-sm">{points.length ? 'O gráfico aparecerá conforme novas atualizações forem registradas.' : 'Ainda não há registros comparáveis para este material.'}</Text>
    </View> : <>
      <Text className="text-gray-500 text-xs">Preço equivalente por {trend.unit}</Text>
      <View className="flex-row flex-wrap items-center justify-between gap-2 mt-1 mb-4">
        <Text className="text-indigo-700 text-xl font-bold">{formatEquivalentPrice(selected.value)}</Text>
        <Text className="text-gray-500 text-xs">{dateLabel(selected.date)}</Text>
      </View>
      <View className="flex-row gap-2">
        <View className="justify-between py-1">
          <Text className="text-gray-500 text-xs">{formatEquivalentPrice(max)}</Text>
          {span > 0 && <Text className="text-gray-500 text-xs">{formatEquivalentPrice(min + span / 2)}</Text>}
          <Text className="text-gray-500 text-xs">{span > 0 ? formatEquivalentPrice(min) : ''}</Text>
        </View>
        <View onLayout={e => setWidth(e.nativeEvent.layout.width)} style={{ flex: 1, height: HEIGHT, position: 'relative', minWidth: 0 }}>
          {[PAD, HEIGHT / 2, HEIGHT - PAD].map(y => <View key={y} style={{ position: 'absolute', left: 0, right: 0, top: y, borderTopWidth: 1, borderColor: '#e5e7eb' }} />)}
          {width > 2 * PAD && <>
            {coords.slice(1).map((p,i) => {
              const prev = coords[i], dx = p.x - prev.x, dy = p.y - prev.y;
              const length = Math.hypot(dx, dy);
              return <View key={points[i+1].id} pointerEvents="none" style={{ position: 'absolute', left: (prev.x + p.x - length) / 2, top: (prev.y + p.y) / 2 - 1, width: length, height: 2, backgroundColor: '#6366f1', transform: [{ rotate: Math.atan2(dy, dx) + 'rad' }] }} />;
            })}
            {coords.map((p,i) => <View key={points[i].id} pointerEvents="none" style={{ position: 'absolute', left: p.x - (i === index ? 5 : 3), top: p.y - (i === index ? 5 : 3), width: i === index ? 10 : 6, height: i === index ? 10 : 6, borderRadius: 6, borderWidth: 1.5, borderColor: '#6366f1', backgroundColor: i === index ? '#4f46e5' : '#fff' }} />)}
          </>}
        </View>
      </View>
      <View className="flex-row justify-between mt-2"><Text className="text-gray-500 text-xs">{dateLabel(points[0].date)}</Text><Text className="text-gray-500 text-xs">{dateLabel(points[points.length-1].date)}</Text></View>
      <Slider accessibilityLabel="Consultar registro de preço" accessibilityValue={{ text: dateLabel(selected.date) + ', ' + formatEquivalentPrice(selected.value) }} style={{ height: 44, width: '100%' }} minimumValue={0} maximumValue={points.length - 1} step={1} value={index} onValueChange={value => setSelectedId(points[Math.round(value)]?.id ?? null)} minimumTrackTintColor="#4f46e5" maximumTrackTintColor="#d1d5db" thumbTintColor="#4f46e5" />
      <Text className="text-gray-500 text-xs mb-3">{points.length} {trend.points.length > MAX_POINTS ? 'registros mais recentes exibidos' : 'registros em ordem cronológica'}. Deslize para consultar cada valor.</Text>
      <View className="flex-row flex-wrap gap-3 mb-3">
        <Variation title="Última variação" value={trend.lastChange} />
        <Variation title="Desde o 1º registro comparável" value={trend.overallChange} />
      </View>
    </>}
    {trend.omitted > 0 && <Text className="text-gray-500 text-xs mb-3">{trend.omitted} registro(s) não comparáveis ou inválidos. Consulte os registros abaixo.</Text>}
  </View>;
}
