import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthContext } from '../src/contexts/AuthContext';
import { getReviewInterval, saveReviewInterval } from '../src/database/dashboardRepository';
import { REVIEW_INTERVALS, type ReviewInterval } from '../src/utils/dashboard';
import { HeaderSaveButton } from '../src/components/HeaderSaveButton';

export default function DashboardSettings() {
  const { user }=useAuthContext();
  const router=useRouter();
  const [days,setDays]=useState<ReviewInterval>(30);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [ready,setReady]=useState(false);
  const busy=useRef(false);
  useEffect(()=>{
    let active=true;
    setLoading(true);setReady(false);setError('');
    if (!user?.uid) {setLoading(false);return;}
    getReviewInterval(user.uid).then(v=>{if(active){setDays(v);setReady(true);}}).catch(()=>{if(active)setError('Não foi possível carregar a preferência.');}).finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[user?.uid]);
  async function save(){
    if(!user?.uid||!ready||busy.current)return;
    busy.current=true;setSaving(true);setError('');
    try{await saveReviewInterval(user.uid,days);router.back();}
    catch{setError('Não foi possível salvar a preferência.');}
    finally{busy.current=false;setSaving(false);}
  }
  return <SafeAreaView edges={['bottom','left','right']} className="flex-1 bg-gray-50">
    <Stack.Screen options={{title:'Lembretes',headerRight:()=> <HeaderSaveButton disabled={!ready||loading} saving={saving} onPress={()=>void save()}/>}}/>
    <View className="p-4">
      <Text className="text-xl font-bold text-gray-800 mb-2">Revisão de preços</Text>
      <Text className="text-gray-600 mb-4">Com que frequência deseja conferir o preço dos materiais?</Text>
      {loading?<ActivityIndicator color="#4f46e5"/>:ready&&REVIEW_INTERVALS.map(n=><Pressable key={n} disabled={saving} accessibilityRole="radio" accessibilityState={{checked:days===n}} onPress={()=>setDays(n)} className={'flex-row items-center gap-3 border rounded-xl p-4 mb-2 '+(days===n?'bg-indigo-50 border-indigo-500':'bg-white border-gray-200')}>
        <Ionicons name={days===n?'radio-button-on':'radio-button-off'} size={22} color={days===n?'#4f46e5':'#9ca3af'}/><Text className="text-gray-800 font-medium">A cada {n} dias</Text>
      </Pressable>)}
      {!!error&&<Text className="text-red-600 mt-2">{error}</Text>}
      {ready&&<Pressable disabled={saving} onPress={()=>void save()} className="bg-indigo-600 rounded-xl p-4 mt-4"><Text className="text-white font-bold text-center">{saving?'Salvando...':'Salvar preferência'}</Text></Pressable>}
    </View>
  </SafeAreaView>;
}
