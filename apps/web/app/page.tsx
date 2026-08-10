'use client';

import {
  Activity,
  AlertTriangle,
  Globe2,
  LayoutDashboard,
  Settings,
  LogOut,
  Users,
} from 'lucide-react';
import { AuthGate } from '@/components/auth/auth-gate';
import { AuthProvider, useAuth } from '@/components/auth/auth-provider';
import { OrbitMark } from '@/components/orbit';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { WorkspaceProvider } from '@/components/workspaces/workspace-provider';
import { WorkspaceSwitcher } from '@/components/workspaces/workspace-switcher';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'Monitors', icon: Activity, active: false },
  { label: 'Incidents', icon: AlertTriangle, active: false, count: '0' },
  { label: 'Status pages', icon: Globe2, active: false },
  { label: 'Team', icon: Users, active: false },
  { label: 'Settings', icon: Settings, active: false },
];

export default function Home(): React.ReactNode {
  return (
    <AuthProvider>
      <AuthGate>
        <main className="orbit-console min-h-screen bg-[#080b16] text-[#f3f1ff]">
          <div className="flex min-h-screen">
            <WorkspaceProvider>
              <Sidebar />
              <DashboardContent />
            </WorkspaceProvider>
          </div>
        </main>
      </AuthGate>
    </AuthProvider>
  );
}

function Sidebar(): React.ReactNode {
  const { user, logout } = useAuth();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-[#d8dee8] bg-[#101827]/60 px-3 py-4 text-white backdrop-blur-xl lg:flex lg:flex-col">
      <div className="mb-5 flex items-center gap-3 px-2">
        <OrbitMark />
        <div>
          <p className="font-serif text-[22px] italic leading-none">Orbit</p>
          <p className="mt-1 text-sm text-[#94a3b8]">Monitor operations</p>
        </div>
      </div>

      <div className="mb-5">
        <WorkspaceSwitcher />
      </div>

      <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#94a3b8]">Workspace</p>
      <nav className="space-y-1">
        {navItems.slice(0, 4).map((item) => (
          <a
            key={item.label}
            href="#"
            className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium ${item.active ? 'bg-[#0f766e] text-white shadow-sm' : 'text-[#cbd5e1] hover:bg-white/[0.07] hover:text-white'}`}
          >
            <item.icon className="size-4" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.count ? <span className="rounded-md bg-[#dc2626] px-1.5 py-0.5 text-xs text-white">{item.count}</span> : null}
          </a>
        ))}
      </nav>

      <p className="mt-4 px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#94a3b8]">Account</p>
      <nav className="space-y-1">
        {navItems.slice(4).map((item) => (
          <a
            key={item.label}
            href="#"
            className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium ${item.active ? 'bg-[#0f766e] text-white shadow-sm' : 'text-[#cbd5e1] hover:bg-white/[0.07] hover:text-white'}`}
          >
            <item.icon className="size-4" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
          </a>
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-2 border-t border-white/10 px-2 pt-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{user?.name}</p>
          <p className="truncate text-xs text-[#94a3b8]">{user?.email}</p>
        </div>
        <button type="button" onClick={logout} className="grid size-9 shrink-0 place-items-center rounded-md text-[#94a3b8] hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2dd4bf]" aria-label="Sign out" title="Sign out">
          <LogOut className="size-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
