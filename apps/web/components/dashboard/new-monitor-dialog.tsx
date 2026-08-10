'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, LoaderCircle, Plus, X } from 'lucide-react';
import type { MonitorInterval } from '@orbit/types';

export type NewMonitorInput = {
  name: string;
  targetUrl: string;
  interval: MonitorInterval;
};

const initialForm: NewMonitorInput = {
  name: '',
  targetUrl: '',
  interval: 60,
};

export function NewMonitorDialog({
  onCreate,
  disabled = false,
  disabledReason = 'Choose a workspace before creating a monitor.',
}: {
  onCreate: (input: NewMonitorInput) => Promise<void>;
  disabled?: boolean;
  disabledReason?: string;
}): React.ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<NewMonitorInput>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !isSubmitting) close();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, isSubmitting]);

  const close = (): void => {
    if (isSubmitting) return;
    setIsOpen(false);
    setError(null);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const name = form.name.trim();
    const targetUrl = form.targetUrl.trim();

    if (name.length < 2) {
      setError('Give this monitor a name with at least two characters.');
      return;
    }

    try {
      const parsed = new URL(targetUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        setError('HTTP monitors need an http:// or https:// address.');
        return;
      }
    } catch {
      setError('Enter a complete URL, including https://.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onCreate({ ...form, name, targetUrl });
      setForm(initialForm);
      setIsOpen(false);
      window.setTimeout(() => triggerRef.current?.focus(), 0);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Orbit could not create this monitor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button ref={triggerRef} type="button" disabled={disabled} title={disabled ? disabledReason : undefined} onClick={() => setIsOpen(true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0f766e] px-4 text-sm font-semibold text-white transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a79fff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d101f] disabled:cursor-not-allowed disabled:opacity-60">
        <Plus className="size-4" aria-hidden="true" />
        New monitor
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-[#03050d]/75 p-0 backdrop-blur-[2px] sm:place-items-center sm:p-5" role="presentation" onMouseDown={close}>
          <form className="max-h-[92dvh] w-full overflow-y-auto rounded-t-lg border border-[#292f4d] bg-[#0d101f] shadow-2xl sm:max-w-lg sm:rounded-lg" role="dialog" aria-modal="true" aria-labelledby="new-monitor-title" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
            <header className="flex items-start justify-between gap-4 border-b border-[#292f4d] px-5 py-4 sm:px-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#a79fff]">HTTP monitor</p>
                <h2 id="new-monitor-title" className="mt-1 text-xl font-semibold text-[#f3f1ff]">Add a monitor</h2>
                <p className="mt-1 text-sm leading-5 text-[#9499b3]">Save the endpoint and schedule now. Orbit will report results only after the checking worker is added.</p>
              </div>
              <button type="button" disabled={isSubmitting} onClick={close} className="grid size-9 shrink-0 place-items-center rounded-md border border-[#292f4d] text-[#cfd2e5] transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7165ff] disabled:opacity-60" aria-label="Close new monitor form">
                <X className="size-4" aria-hidden="true" />
              </button>
            </header>

            <div className="space-y-4 px-5 py-5 sm:px-6">
              <Field label="Monitor name" htmlFor="monitor-name" hint="A short name your team will recognize.">
                <input id="monitor-name" autoFocus required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Production API" className={inputClasses} />
              </Field>

              <Field label="Endpoint URL" htmlFor="monitor-url" hint="Use the full HTTP or HTTPS URL, including https://.">
                <input id="monitor-url" type="url" required value={form.targetUrl} onChange={(event) => setForm({ ...form, targetUrl: event.target.value })} placeholder="https://api.example.com/health" className={inputClasses} />
              </Field>

              <Field label="Check interval" htmlFor="monitor-interval">
                <div className="relative">
                  <select id="monitor-interval" value={form.interval} onChange={(event) => setForm({ ...form, interval: Number(event.target.value) as MonitorInterval })} className={`${inputClasses} appearance-none pr-9`}>
                    <option value={30}>Every 30 seconds</option>
                    <option value={60}>Every minute</option>
                    <option value={300}>Every 5 minutes</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#9499b3]" aria-hidden="true" />
                </div>
              </Field>

              <div className="rounded-md border border-[#3b4380] bg-[#171b3c] px-3 py-3 text-sm leading-5 text-[#cfd2e5]">
                <span className="mr-2 inline-flex size-4 translate-y-0.5 items-center justify-center rounded-full bg-[#7165ff] text-white"><Check className="size-3" aria-hidden="true" /></span>
                This saves real configuration to the active workspace with a <strong>Pending</strong> state. No synthetic checks are shown.
              </div>

              {error ? <p className="rounded-md border border-[#7f3445] bg-[#321923] px-3 py-2 text-sm text-[#fb7185]" role="alert">{error}</p> : null}
            </div>

            <footer className="flex flex-col-reverse gap-2 border-t border-[#292f4d] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button type="button" disabled={isSubmitting} onClick={close} className="h-10 rounded-md px-4 text-sm font-medium text-[#cfd2e5] hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7165ff] disabled:opacity-60">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#7165ff] px-4 text-sm font-semibold text-white transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c4b5fd] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d101f] disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
                {isSubmitting ? 'Saving monitor' : 'Add monitor'}
              </button>
            </footer>
          </form>
        </div>
      ) : null}
    </>
  );
}

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode }): React.ReactNode {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-[#f3f1ff]">{label}</label>
      {hint ? <p className="mt-1 text-xs leading-5 text-[#9499b3]">{hint}</p> : null}
      <div className="mt-2">{children}</div>
    </div>
  );
}

const inputClasses = 'h-10 w-full rounded-md border border-[#292f4d] bg-[#101426] px-3 text-sm text-[#f3f1ff] outline-none placeholder:text-[#6f7693] focus:border-[#7165ff] focus:ring-2 focus:ring-[#7165ff]/30';
