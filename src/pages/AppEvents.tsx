import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Donut, HBars, TimeSeries, VBars } from '../components/Charts';
import { Badge, Button, Empty, ErrorBox, PageHeader, Pagination, Select, Spinner, Stat, Table, Tabs } from '../components/ui';
import { get } from '../lib/api';
import { fmtDate, fmtNum, timeAgo, titleCase } from '../lib/format';

type Tab = 'overview' | 'feed';

/** In-app analytics: what people do inside the app, from the events it posts. */
export default function AppEvents() {
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get('tab') === 'feed' || params.has('user') || params.has('session') ? 'feed' : 'overview';
  const setTab = (t: Tab) => setParams(t === 'feed' ? { tab: 'feed' } : {});

  return (
    <>
      <PageHeader title="App activity" subtitle="Screens, funnel steps and actions sent by the app" actions={<Tabs tabs={[{ id: 'overview', label: 'Overview' }, { id: 'feed', label: 'Live feed' }]} value={tab} onChange={setTab} />} />
      {tab === 'overview' ? <Overview /> : <Feed />}
    </>
  );
}

function Overview() {
  const [days, setDays] = useState('30');
  const { data, isLoading, error } = useQuery({ queryKey: ['app-events-summary', days], queryFn: () => get('/app-events/summary', { days }) });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorBox error={error} />;
  if (!data.totals.events) {
    return <Empty title="No app activity yet" hint="Events appear here as soon as someone opens the app with analytics on." />;
  }

  const top = data.funnel[0]?.value || 1;

  return (
    <>
      <div className="flex justify-end mb-4">
        <Select className="!w-40" value={days} onChange={setDays} options={[{ value: 1, label: 'Today' }, { value: 7, label: 'Last 7 days' }, { value: 30, label: 'Last 30 days' }, { value: 90, label: 'Last 90 days' }]} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Sessions" value={fmtNum(data.totals.sessions)} />
        <Stat label="Signed-in users" value={fmtNum(data.totals.users)} tone="pink" />
        <Stat label="Events" value={fmtNum(data.totals.events)} />
        <Stat label="Events per session" value={data.totals.events_per_session} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <div className="card"><div className="label mb-3">Active users per day</div><TimeSeries data={data.daily_users} /></div>
        <div className="card"><div className="label mb-3">Sessions per day</div><TimeSeries data={data.daily_sessions} color="#8747FF" /></div>
      </div>

      <div className="label mt-8 mb-3">Funnel (sessions reaching each step)</div>
      <div className="card space-y-2.5">
        {data.funnel.map((s: { label: string; value: number }, i: number) => (
          <div key={s.label} className="flex items-center gap-3 text-[14px]">
            <span className="w-40 text-soft shrink-0">{i + 1}. {s.label}</span>
            <div className="flex-1 h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full bg-brand rounded-full" style={{ width: `${Math.round((s.value / top) * 100)}%` }} />
            </div>
            <span className="w-24 text-right tabular-nums">{fmtNum(s.value)} <span className="text-quiet">{Math.round((s.value / top) * 100)}%</span></span>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <div className="card lg:col-span-2"><div className="label mb-3">Most used screens</div>{data.top_screens.length ? <HBars data={data.top_screens} /> : <p className="text-quiet text-[14px]">No screen views yet.</p>}</div>
        <div className="card"><div className="label mb-3">Top events</div>
          {data.top_events.map((e: { label: string; value: number }) => (
            <Link key={e.label} to={`/app-events?tab=feed&name=${e.label}`} className="flex justify-between py-1 text-[14px] hover:text-pink">
              <span className="text-soft">{titleCase(e.label)}</span><span className="tabular-nums">{fmtNum(e.value)}</span>
            </Link>
          ))}
        </div>
        <div className="card"><div className="label mb-4">Platform</div>{data.platforms.length ? <Donut data={data.platforms} /> : <p className="text-quiet text-[14px]">—</p>}</div>
        <div className="card"><div className="label mb-3">App versions</div>{data.versions.length ? <VBars data={data.versions} /> : <p className="text-quiet text-[14px]">—</p>}</div>
        <div className="card"><div className="label mb-3">Why the paywall opened</div>{data.paywall_reasons.length ? <HBars data={data.paywall_reasons.map((r: { label: string; value: number }) => ({ ...r, label: titleCase(r.label) }))} /> : <p className="text-quiet text-[14px]">Not shown yet.</p>}</div>
      </div>
    </>
  );
}

function Feed() {
  const [params, setParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const name = params.get('name') ?? '';
  const user = params.get('user') ?? '';
  const session = params.get('session') ?? '';

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    next.set('tab', 'feed');
    if (value) next.set(key, value); else next.delete(key);
    setParams(next);
    setPage(1);
  };

  const names = useQuery({ queryKey: ['app-event-names'], queryFn: () => get<string[]>('/app-events/names') });
  const { data, isLoading, error } = useQuery({
    queryKey: ['app-events', name, user, session, page],
    queryFn: () => get('/app-events', { name, user_id: user, session_id: session, page }),
    // A live view: new events show up without a reload.
    refetchInterval: page === 1 ? 10_000 : false,
  });

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select className="!w-56" value={name} onChange={(v) => setFilter('name', v)} placeholder="All events" options={(names.data ?? []).map((n) => ({ value: n, label: titleCase(n) }))} />
        {user && <Badge tone="pink">User #{user} <button className="ml-1.5" onClick={() => setFilter('user', '')}>×</button></Badge>}
        {session && <Badge>Session {session.slice(-6)} <button className="ml-1.5" onClick={() => setFilter('session', '')}>×</button></Badge>}
        {(name || user || session) && <Button size="sm" variant="ghost" onClick={() => setParams({ tab: 'feed' })}>Clear filters</Button>}
      </div>
      {isLoading ? <Spinner /> : error ? <ErrorBox error={error} /> : !data.data.length ? <Empty title="No events" hint="Nothing matches these filters yet." /> : (
        <>
          <Table head={['When', 'Event', 'User', 'Details', 'Device', 'Session']}>
            {data.data.map((e: any) => (
              <tr key={e.id} className="hover:bg-white/[0.03]">
                <td className="td text-quiet whitespace-nowrap" title={fmtDate(e.occurred_at ?? e.created_at, true)}>{timeAgo(e.occurred_at ?? e.created_at)}</td>
                <td className="td"><button className="hover:text-pink font-medium" onClick={() => setFilter('name', e.name)}>{titleCase(e.name)}</button></td>
                <td className="td">{e.user_id ? <Link to={`/users/${e.user_id}`} className="hover:text-pink">{e.user_name ?? `#${e.user_id}`}</Link> : <span className="text-quiet">Signed out</span>}</td>
                <td className="td"><Props props={e.props} /></td>
                <td className="td text-quiet whitespace-nowrap">{e.platform ?? '—'}{e.app_version ? ` · v${e.app_version}` : ''}</td>
                <td className="td">{e.session_id ? <button className="text-quiet hover:text-pink font-mono text-[12px]" onClick={() => setFilter('session', e.session_id)}>{e.session_id.slice(-6)}</button> : '—'}</td>
              </tr>
            ))}
          </Table>
          <Pagination page={data} onPage={setPage} />
        </>
      )}
    </>
  );
}

function Props({ props }: { props: Record<string, unknown> | null }) {
  if (!props || !Object.keys(props).length) return <span className="text-quiet">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {Object.entries(props).map(([k, v]) => <Badge key={k}>{k}: {String(v)}</Badge>)}
    </div>
  );
}
