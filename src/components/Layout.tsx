import clsx from 'clsx';
import {
  BarChart3, Ban, Bell, BookOpen, Flag, Heart, Image, LayoutDashboard, LogOut, ScrollText, Settings as Cog, ShieldCheck, UserCog, Users as UsersIcon,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { NavLink, Outlet } from 'react-router-dom';
import { get } from '../lib/api';
import { useAuth, type Role } from '../lib/auth';
import { titleCase } from '../lib/format';

type Item = { to: string; label: string; icon: typeof Heart; roles?: Role[]; badge?: 'photos' | 'reports' | 'verifs' };
const NAV: { title: string; items: Item[] }[] = [
  { title: 'Overview', items: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  ] },
  { title: 'People', items: [
    { to: '/users', label: 'Users', icon: UsersIcon },
    { to: '/photos', label: 'Photo moderation', icon: Image, badge: 'photos' },
    { to: '/verifications', label: 'Verification', icon: ShieldCheck, badge: 'verifs' },
  ] },
  { title: 'Safety', items: [
    { to: '/reports', label: 'Reports', icon: Flag, badge: 'reports' },
    { to: '/blocks', label: 'Blocks', icon: Ban },
  ] },
  { title: 'Content & growth', items: [
    { to: '/reference', label: 'Reference data', icon: BookOpen },
    { to: '/broadcasts', label: 'Notifications', icon: Bell, roles: ['admin', 'moderator', 'support'] },
    { to: '/settings', label: 'App config', icon: Cog, roles: ['admin'] },
  ] },
  { title: 'Team', items: [
    { to: '/admins', label: 'Admins', icon: UserCog, roles: [] },
    { to: '/audit', label: 'Audit log', icon: ScrollText, roles: [] },
  ] },
];

export default function Layout() {
  const { admin, logout, can } = useAuth();
  const { data } = useQuery({ queryKey: ['overview'], queryFn: () => get('/overview'), refetchInterval: 60_000 });
  const badges = { photos: data?.queues.photos_pending, reports: data?.queues.open_reports, verifs: data?.queues.verifications_pending };

  return (
    <div className="flex h-full">
      <aside className="w-[248px] shrink-0 border-r bg-surface/60 flex flex-col overflow-y-auto">
        <div className="px-6 pt-7 pb-6 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand grid place-items-center shadow-glow"><Heart size={18} fill="white" className="text-white" /></div>
          <div className="leading-tight">
            <div className="font-bold text-[17px]">Luvhere</div>
            <div className="text-[11px] text-quiet font-semibold tracking-widest uppercase">CRM</div>
          </div>
        </div>

        <nav className="px-3 flex-1 space-y-5">
          {NAV.map((g) => {
            const items = g.items.filter((i) => !i.roles || can(...i.roles));
            if (!items.length) return null;
            return (
              <div key={g.title}>
                <div className="label px-3 mb-1.5">{g.title}</div>
                {items.map((i) => {
                  const n = i.badge ? badges[i.badge] : 0;
                  return (
                    <NavLink key={i.to} to={i.to} end={i.to === '/'}
                      className={({ isActive }) => clsx('flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors',
                        isActive ? 'bg-pink/10 text-pink' : 'text-muted hover:text-ink hover:bg-white/5')}>
                      <i.icon size={18} />
                      <span className="flex-1">{i.label}</span>
                      {!!n && <span className="text-[11px] font-bold bg-brand text-white rounded-full px-2 py-0.5">{n > 99 ? '99+' : n}</span>}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t m-3 mt-4 rounded-2xl bg-elevated/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand grid place-items-center font-bold text-[14px]">{admin!.name.charAt(0).toUpperCase()}</div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="text-[14px] font-semibold truncate">{admin!.name}</div>
            <div className="text-[12px] text-quiet">{titleCase(admin!.role)}</div>
          </div>
          <button title="Sign out" onClick={logout} className="text-quiet hover:text-pink"><LogOut size={17} /></button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1320px] mx-auto px-8 py-8"><Outlet /></div>
      </main>
    </div>
  );
}
