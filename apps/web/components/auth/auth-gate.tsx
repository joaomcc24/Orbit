'use client';

import { useState } from 'react';
import { ArrowRight, LoaderCircle, LockKeyhole } from 'lucide-react';
import { OrbitMark } from '@/components/orbit';
import { OrbitApiError } from '@/lib/api';
import { useAuth } from './auth-provider';

type Mode = 'login' | 'register';

export function AuthGate({ children }: { children: React.ReactNode }): React.ReactNode {
  const { accessToken, user, sessionMessage, login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (accessToken && user) {
    return children;
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (mode === 'register') {
        await register({ name, email, password });
      } else {
        await login({ email, password });
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof OrbitApiError
          ? caughtError.message
          : 'Orbit could not authenticate this request.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeMode = (nextMode: Mode): void => {
    setMode(nextMode);
    setError(null);
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#080b16] px-4 py-8 text-[#f3f1ff]">
      <section className="w-full max-w-md" aria-labelledby="auth-title">
        <div className="mb-8 flex items-center gap-3">
          <OrbitMark />
          <div>
            <p className="font-serif text-2xl italic leading-none">Orbit</p>
            <p className="mt-1 text-sm text-[#94a3b8]">Monitor operations</p>
          </div>
        </div>

        <div className="border-y border-[#292f4d] py-7">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md bg-[#0f766e] text-white">
              <LockKeyhole className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h1 id="auth-title" className="text-xl font-semibold">
                {mode === 'login' ? 'Sign in to Orbit' : 'Create your account'}
              </h1>
              <p className="mt-1 text-sm text-[#94a3b8]">
                {mode === 'login' ? 'Continue to your workspaces.' : 'Set up your Orbit identity.'}
              </p>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-2 border-b border-[#292f4d]" role="tablist" aria-label="Authentication mode">
            <ModeButton active={mode === 'login'} onClick={() => changeMode('login')}>Sign in</ModeButton>
            <ModeButton active={mode === 'register'} onClick={() => changeMode('register')}>Register</ModeButton>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' ? (
              <AuthField label="Name" htmlFor="auth-name">
                <input id="auth-name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} className={inputClass} />
              </AuthField>
            ) : null}

            <AuthField label="Email" htmlFor="auth-email">
              <input id="auth-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required className={inputClass} />
            </AuthField>

            <AuthField label="Password" htmlFor="auth-password">
              <input id="auth-password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={mode === 'register' ? 12 : undefined} maxLength={128} className={inputClass} />
            </AuthField>

            {error ?? sessionMessage ? <p className="border-l-2 border-[#fb7185] pl-3 text-sm text-[#fda4af]" role="alert">{error ?? sessionMessage}</p> : null}

            <button type="submit" disabled={isSubmitting} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#0f766e] px-4 text-sm font-semibold text-white hover:bg-[#0d6b64] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5eead4] disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="size-4" aria-hidden="true" />}
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }): React.ReactNode {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`h-10 border-b-2 text-sm font-medium ${active ? 'border-[#2dd4bf] text-white' : 'border-transparent text-[#94a3b8] hover:text-white'}`}>{children}</button>;
}

function AuthField({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }): React.ReactNode {
  return <label htmlFor={htmlFor} className="block text-sm font-medium text-[#cbd5e1]"><span className="mb-1.5 block">{label}</span>{children}</label>;
}

const inputClass = 'h-11 w-full rounded-md border border-[#374151] bg-[#101827] px-3 text-sm text-white outline-none focus:border-[#2dd4bf] focus:ring-2 focus:ring-[#2dd4bf]/20';
