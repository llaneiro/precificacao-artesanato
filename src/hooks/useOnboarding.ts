import { useCallback, useRef, useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import * as Repository from '../database/onboardingRepository';

export function useOnboarding() {
  const { user } = useAuthContext();
  const userId = user?.uid;
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const hasCompleted = useCallback(() => {
    if (!userId) return Promise.resolve(true);
    return Repository.hasCompletedOnboarding(userId);
  }, [userId]);

  const finish = useCallback(async () => {
    if (!userId || busy.current) return false;
    busy.current = true;
    setSaving(true);
    try {
      await Repository.completeOnboarding(userId);
      return true;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }, [userId]);

  return { hasCompleted, finish, saving };
}
