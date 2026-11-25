import { useSyncStatus } from '../contexts/SyncContext';
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuthContext } from '../contexts/AuthContext';
import { getDashboard, type DashboardData } from '../database/dashboardRepository';

export function useDashboard() {
  const { user } = useAuthContext();
  const remoteVersion = useSyncStatus().remoteVersion;
  const userId = user?.uid;
  const [state, setState] = useState<{ owner: string; data: DashboardData } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const request = useRef(0);
  const load = useCallback(async () => {
    const token = ++request.current;
    setLoading(true); setError('');
    try {
      if (!userId) return;
      const data = await getDashboard(userId);
      if (request.current === token) setState({ owner:userId, data });
    } catch {
      if (request.current === token) { setState(null); setError('Não foi possível carregar o painel.'); }
    } finally { if (request.current === token) setLoading(false); }
  }, [userId]);
  useFocusEffect(useCallback(() => { void load(); return () => { request.current++; }; }, [load, remoteVersion]));
  return { data: state?.owner === userId ? state?.data ?? null : null, loading, error, load };
}
