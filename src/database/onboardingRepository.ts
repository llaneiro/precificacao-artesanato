import { getDatabase } from './database';

export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ completedAt: string }>(
    'SELECT completedAt FROM onboarding_state WHERE userId = ?', userId,
  );
  return row !== null;
}

export async function completeOnboarding(userId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO onboarding_state (userId, completedAt) VALUES (?, ?) ON CONFLICT(userId) DO NOTHING',
    userId, new Date().toISOString(),
  );
}
