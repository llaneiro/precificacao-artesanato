import { useEffect, useRef, useState } from 'react';
import { usePricingSettings } from './usePricingSettings';
import { LaborMode } from '../types/pricingSettings';
import { centsToInput } from '../utils/currency';
import { parseLabor } from '../utils/pricingInputs';
import { hourlyRate } from '../types/pricingSettings';

export function usePricingForm(section: 'labor' | 'fees') {
  const { settings, loading, error: loadError, loadSettings, saveLabor, saveFees } = usePricingSettings(false);
  const [mode, setMode] = useState<LaborMode>('hourly');
  const [hours, setHours] = useState('');
  const [hourly, setHourly] = useState('');
  const [monthly, setMonthly] = useState('');
  const [debit, setDebit] = useState('');
  const [credit, setCredit] = useState('');
  const [pix, setPix] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);

  useEffect(() => { void loadSettings(); }, [loadSettings]);
  useEffect(() => {
    if (loading || loadError) return;
    // Wait for the initial load; settings may legitimately be null.
    if (!settings) return;
    setMode(settings.laborMode ?? 'hourly');
    setHours(settings.productiveHours === null ? '' : String(settings.productiveHours));
    setHourly(settings.hourlyCostCents === null ? '' : centsToInput(settings.hourlyCostCents));
    setMonthly(settings.monthlyIncomeCents === null ? '' : centsToInput(settings.monthlyIncomeCents));
    setDebit(settings.debitBps === null ? '' : centsToInput(settings.debitBps));
    setCredit(settings.creditBps === null ? '' : centsToInput(settings.creditBps));
    setPix(settings.pixBps === null ? '' : centsToInput(settings.pixBps));
  }, [settings, loading, loadError]);

  let preview: number | null = null;
  try { preview = hourlyRate(parseLabor(mode, hours, mode === 'hourly' ? hourly : monthly)); } catch {}

  async function save(): Promise<boolean> {
    if (busy.current || loading || loadError) return false;
    busy.current = true;
    setSaving(true);
    setError(null);
    try {
      if (section === 'labor') await saveLabor(mode, hours, mode === 'hourly' ? hourly : monthly);
      else await saveFees(debit, credit, pix);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar as configurações.');
      return false;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  return { mode, setMode, hours, setHours, hourly, setHourly, monthly, setMonthly,
    debit, setDebit, credit, setCredit, pix, setPix, preview,
    loading: loading, loadError, loadSettings, saving, error, save };
}
