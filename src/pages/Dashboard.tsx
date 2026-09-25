import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Donut, HBars, TimeSeries } from '../components/Charts';
import { Avatar, ErrorBox, PageHeader, Spinner, Stat, StatusBadge } from '../components/ui';
import { get } from '../lib/api';
import { fmtNum, timeAgo } from '../lib/format';

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({ queryKey: ['overview'], queryFn: () => get('/overview') });
  if (isLoading) return <Spinner />;
  if (error) return <ErrorBox error={error} />;
  const k = data.kpis, q = data.queues;
  const top = data.funnel[0].value || 1;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="How Luvhere is doing right now" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total users" value={fmtNum(k.total_users)} hint={`+${k.new_today} today · +${k.new_7d} this week`} />
        <Stat label="Active (24h)" value={fmtNum(k.dau)} tone="pink" hint={`${fmtNum(k.mau)} in the last 30 days`} />
        <Stat label="Active matches" value={fmtNum(k.matches)} hint={`+${k.matches_7d} this week`} />
        <Stat label="Verified" value={fmtNum(k.verified)} tone="ok" hint={`${Math.round((k.verified / (k.total_users || 1)) * 100)}% of users`} />
      </div>

      <div className="label mt-8 mb-3">Needs attention</div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/reports"><Stat label="Open reports" value={q.open_reports} tone={q.open_reports ? 'warn' : undefined} hint="Review →" /></Link>
        <Link to="/photos"><Stat label="Photos to review" value={q.photos_pending} tone={q.photos_pending ? 'warn' : undefined} hint="Moderate →" /></Link>
        <Link to="/verifications"><Stat label="Verification queue" value={q.verifications_pending} tone={q.verifications_pending ? 'warn' : undefined} hint="Review →" /></Link>
        <Link to="/photos?status=face_rejected"><Stat label="Face-match rejected" value={q.photos_face_rejected} hint="Photos that failed match" /></Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-8">
        <div className="card lg:col-span-2">
          <div className="label mb-3">Signups · last 14 days</div>
          <TimeSeries data={data.signups} />
        </div>
        <div className="card">
          <div className="label mb-4">Account health</div>
          <Donut data={[
            { label: 'active', value: k.total_users - k.suspended - k.banned },
            { label: 'suspended', value: k.suspended },
            { label: 'banned', value: k.banned },
          ]} />
          <div className="text-[13px] text-quiet mt-4">Premium: <span className="text-soft font-semibold">{fmtNum(k.premium)}</span> · Onboarded: <span className="text-soft font-semibold">{fmtNum(k.onboarded)}</span></div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <div className="card">
          <div className="label mb-3">Conversion funnel</div>
          <HBars data={data.funnel} height={200} />
          <div className="text-quiet text-[12px] mt-1">{data.funnel.map((f: any) => `${f.label} ${Math.round((f.value / top) * 100)}%`).join(' · ')}</div>
        </div>
        <div className="card">
          <div className="label mb-3">Newest users</div>
          <ul className="divide-y divide-white/[0.06]">
            {data.recent_users.map((u: any) => (
              <li key={u.id}>
                <Link to={`/users/${u.id}`} className="flex items-center gap-3 py-2.5 hover:bg-white/[0.03] -mx-2 px-2 rounded-xl">
                  <Avatar name={u.name} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-medium truncate">{u.name ?? 'Unnamed'}</div>
                    <div className="text-[12px] text-quiet truncate">{u.email ?? u.phone ?? `#${u.id}`}</div>
                  </div>
                  <StatusBadge status={u.status} />
                  <span className="text-[12px] text-quiet w-16 text-right">{timeAgo(u.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
