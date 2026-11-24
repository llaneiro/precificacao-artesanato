import { useEffect, useRef, useState } from 'react';
import { usePricingSettings } from './usePricingSettings';
import { LaborMode, PaymentDrafts, PaymentMethod, PaymentChoice, PAYMENT_METHODS, getPaymentChoice } from '../types/pricingSettings';
import { centsToInput } from '../utils/currency';
import { parseLabor } from '../utils/pricingInputs';
import { hourlyRate } from '../types/pricingSettings';

export function usePricingForm(section: 'labor' | 'fees') {
  const { settings, loading, error: loadError, loadSettings, saveLabor, saveFees } = usePricingSettings(false);
  const [mode, setMode] = useState<LaborMode>('hourly');
  const [hours, setHours] = useState('');
  const [hourly, setHourly] = useState('');
  const [monthly, setMonthly] = useState('');
  const [payments, setPayments] = useState<PaymentDrafts>({
    pix: { choice: 'pending', fee: '' },
    debit: { choice: 'pending', fee: '' },
    credit: { choice: 'pending', fee: '' },
  });
  function setPaymentChoice(key: PaymentMethod, choice: PaymentChoice) {
    setPayments(current => ({ ...current, [key]: { choice, fee: current[key].fee } }));
  }
  function setPaymentFee(key: PaymentMethod, fee: string) {
    setPayments(current => ({ ...current, [key]: { ...current[key], fee } }));
  }
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
    const drafts = {} as PaymentDrafts;
    for (const method of PAYMENT_METHODS) {
      const fee = settings[method.feeKey];
      const choice = getPaymentChoice(settings, method.key);
      drafts[method.key] = { choice, fee: choice === 'charged' && fee !== null ? centsToInput(fee) : '' };
    }
    setPayments(drafts);
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
      else await saveFees(payments);
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
    payments, setPaymentChoice, setPaymentFee, preview,
    loading: loading, loadError, loadSettings, saving, error, save };
}
