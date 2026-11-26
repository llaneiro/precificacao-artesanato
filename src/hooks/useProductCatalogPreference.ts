import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CatalogLayout = 'list' | 'grid';

// Preferência local, separada por conta. Não gera gravações no Firestore.
export function useProductCatalogPreference(userId: string) {
  const key = 'product-catalog-layout-v1:' + userId;
  const [layout, setLayout] = useState<CatalogLayout>('list');
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const writes = useRef<Promise<void>>(Promise.resolve());
  const active = useRef(false);
  useEffect(() => {
    active.current = true;
    let cancelled = false;
    AsyncStorage.getItem(key).then(saved => {
      if (!cancelled && (saved === 'list' || saved === 'grid')) setLayout(saved);
    }).catch(() => {
      if (!cancelled) setStorageError(true);
    }).finally(() => {
      if (!cancelled) setReady(true);
    });
    return () => { cancelled = true; active.current = false; };
  }, [key]);

  function choose(next: CatalogLayout) {
    if (!ready || next === layout) return;
    setLayout(next);
    // Garante que toques rápidos sejam persistidos na mesma ordem.
    writes.current = writes.current.catch(() => {}).then(async () => {
      try {
        await AsyncStorage.setItem(key, next);
        if (active.current) setStorageError(false);
      } catch {
        if (active.current) setStorageError(true);
      }
    });
  }
  return { layout, choose, ready, storageError };
}
