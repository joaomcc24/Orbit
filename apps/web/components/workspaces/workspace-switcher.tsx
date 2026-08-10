'use client';

import { useState } from 'react';
import { ChevronDown, LoaderCircle, Plus, RefreshCw, X } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { useWorkspace } from './workspace-provider';

export function WorkspaceSwitcher({ compact = false }: { compact?: boolean }): React.ReactNode {
  const { user } = useAuth();
  const { activeWorkspace, workspaces, isLoading, isCreating, error, refresh, selectWorkspace, createWorkspace, clearError } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'workspaces' | 'create'>('workspaces');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const close = (): void => {
    setIsOpen(false);
    setFormError(null);
    clearError();
  };

  const addWorkspace = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setFormError(null);
    const normalizedSlug = slug.trim().toLowerCase();

    if (!name.trim() || !normalizedSlug) {
      setFormError('Name and slug are required.');
      return;
    }

    try {
      await createWorkspace({ name: name.trim(), slug: normalizedSlug });
      setName('');
      setSlug('');
      setMode('workspaces');
    } catch {
      // The provider exposes the API message in the shared error state.
    }
  };

  const select = (workspace: Parameters<typeof selectWorkspace>[0]): void => {
    selectWorkspace(workspace);
    close();
  };

  const label = activeWorkspace?.name ?? 'Choose workspace';
  const detail = activeWorkspace?.slug ?? user?.email ?? 'No workspace selected';

  return (
    <div className="relative">
      <button type="button" onClick={() => setIsOpen(true)} className={compact ? 'inline-flex h-8 max-w-[13rem] items-center gap-2 rounded-md border border-[#292f4d] bg-[#101426] px-2.5 text-left text-xs text-[#cfd2e5] hover:bg-[#171b3c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2dd4bf]' : 'flex h-11 w-full items-center justify-between rounded-md border border-white/10 bg-white/[0.04] px-3 text-left transition-colors hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2dd4bf]'}>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{label}</span>
          {!compact ? <span className="block truncate text-xs text-[#94a3b8]">{detail}</span> : null}
        </span>
        <ChevronDown className="size-4 shrink-0 text-[#94a3b8]" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className={`${compact ? 'right-0 top-10 w-[min(23rem,calc(100vw-2rem))]' : 'left-0 top-12 w-[calc(100vw-2rem)] max-w-sm'} absolute z-50 overflow-hidden rounded-md border border-[#292f4d] bg-[#0d101f] shadow-2xl`}>
          <div className="flex items-start justify-between gap-3 border-b border-[#292f4d] px-4 py-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#5eead4]">Workspace</p>
              <p className="mt-1 text-sm font-medium text-[#f3f1ff]">{mode === 'create' ? 'Create workspace' : 'Switch workspace'}</p>
            </div>
            <button type="button" onClick={close} className="grid size-8 place-items-center rounded-md text-[#9499b3] hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2dd4bf]" aria-label="Close workspace switcher">
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          {mode === 'workspaces' ? (
            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-xs text-[#9499b3]">{user?.email}</p>
                <button type="button" onClick={() => void refresh()} disabled={isLoading} className="grid size-8 place-items-center rounded-md text-[#cfd2e5] hover:bg-white/[0.06] disabled:opacity-60" aria-label="Refresh workspaces">
                  <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
                </button>
              </div>

              {error ? <p className="mt-3 rounded-md border border-[#7f3445] bg-[#321923] px-3 py-2 text-xs leading-5 text-[#fb7185]" role="alert">{error}</p> : null}

              {workspaces.length ? (
                <ul className="mt-3 space-y-1 border-t border-[#292f4d] pt-3">
                  {workspaces.map((workspace) => (
                    <li key={workspace.id}>
                      <button type="button" onClick={() => select(workspace)} className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left transition-colors ${workspace.id === activeWorkspace?.id ? 'bg-[#153d3b] text-[#f3f1ff]' : 'text-[#cfd2e5] hover:bg-white/[0.06]'}`}>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{workspace.name}</span>
                          <span className="block truncate font-mono text-[10px] uppercase tracking-[0.08em] text-[#9499b3]">{workspace.slug}</span>
                        </span>
                        {workspace.id === activeWorkspace?.id ? <span className="size-1.5 rounded-full bg-[#2dd4bf]" /> : null}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : !isLoading && !error ? <p className="mt-3 border-t border-[#292f4d] pt-3 text-sm leading-5 text-[#9499b3]">No workspaces yet.</p> : null}

              <button type="button" onClick={() => setMode('create')} className="mt-3 inline-flex h-9 items-center gap-1.5 text-xs font-medium text-[#5eead4] hover:text-[#99f6e4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2dd4bf]">
                <Plus className="size-3.5" aria-hidden="true" />
                Create workspace
              </button>
            </div>
          ) : (
            <form onSubmit={addWorkspace} className="space-y-3 p-4">
              <SwitcherField label="Workspace name" htmlFor="workspace-name">
                <input id="workspace-name" value={name} onChange={(event) => { setName(event.target.value); if (!slug) setSlug(toSlug(event.target.value)); }} placeholder="Orbit development" className={inputClass} />
              </SwitcherField>
              <SwitcherField label="Workspace slug" htmlFor="workspace-slug">
                <input id="workspace-slug" value={slug} onChange={(event) => setSlug(toSlug(event.target.value))} placeholder="orbit-development" className={inputClass} />
              </SwitcherField>
              {formError ? <p className="rounded-md border border-[#7f3445] bg-[#321923] px-3 py-2 text-xs text-[#fb7185]" role="alert">{formError}</p> : null}
              {error ? <p className="rounded-md border border-[#7f3445] bg-[#321923] px-3 py-2 text-xs text-[#fb7185]" role="alert">{error}</p> : null}
              <div className="flex items-center justify-between gap-2 border-t border-[#292f4d] pt-3">
                <button type="button" onClick={() => setMode('workspaces')} className="h-9 px-2 text-xs font-medium text-[#cfd2e5] hover:text-white">Back</button>
                <button type="submit" disabled={isCreating} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#0f766e] px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                  {isCreating ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" /> : <Plus className="size-3.5" aria-hidden="true" />}
                  Create workspace
                </button>
              </div>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}

function SwitcherField({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }): React.ReactNode {
  return <label htmlFor={htmlFor} className="block text-xs font-medium text-[#cfd2e5]"><span className="mb-1.5 block">{label}</span>{children}</label>;
}

function toSlug(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const inputClass = 'h-9 w-full rounded-md border border-[#292f4d] bg-[#101426] px-2.5 text-sm text-[#f3f1ff] outline-none placeholder:text-[#6f7693] focus:border-[#2dd4bf] focus:ring-2 focus:ring-[#2dd4bf]/20';
