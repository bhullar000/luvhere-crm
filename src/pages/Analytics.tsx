import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Donut, HBars, TimeSeries, VBars } from '../components/Charts';
import { ErrorBox, PageHeader, Select, Spinner, Stat } from '../components/ui';
import { get } from '../lib/api';
import { fmtNum } from '../lib/format';

const sum = (a: { value: number }[]) => a.reduce((s, r) => s + r.value, 0);

export default function Analytics() {
  const [days, setDays] = useState('30');
  const { data, isLoading, error } = useQuery({ queryKey: ['analytics', days], queryFn: () => get('/analytics', { days }) });

  return (
    <>
      <PageHeader title="Analytics" subtitle="Growth, engagement and who your users are"
        actions={<Select className="!w-40" value={days} onChange={setDays} options={[{ value: 7, label: 'Last 7 days' }, { value: 30, label: 'Last 30 days' }, { value: 90, label: 'Last 90 days' }]} />} />
      {isLoading ? <Spinner /> : error ? <ErrorBox error={error} /> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Signups" value={fmtNum(sum(data.signups))} />
            <Stat label="Likes sent" value={fmtNum(sum(data.likes))} tone="pink" />
            <Stat label="New matches" value={fmtNum(sum(data.matches))} />
            <Stat label="Messages" value={fmtNum(sum(data.messages))} />
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mt-4">
            <div className="card"><div className="label mb-3">Signups</div><TimeSeries data={data.signups} /></div>
            <div className="card"><div className="label mb-3">Users active per day</div><TimeSeries data={data.active} color="#8747FF" /></div>
            <div className="card"><div className="label mb-3">Likes</div><TimeSeries data={data.likes} /></div>
            <div className="card"><div className="label mb-3">Matches</div><TimeSeries data={data.matches} color="#8747FF" /></div>
            <div className="card lg:col-span-2"><div className="label mb-3">Messages (matches + anonymous)</div><TimeSeries data={data.messages} height={200} /></div>
          </div>

          <div className="label mt-8 mb-3">Audience</div>
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="card"><div className="label mb-4">Gender</div><Donut data={data.gender} /></div>
            <div className="card"><div className="label mb-3">Age groups</div><VBars data={data.age} /></div>
            <div className="card"><div className="label mb-4">Looking for</div><Donut data={data.goals} /></div>
            <div className="card"><div className="label mb-3">Top cities</div>{data.cities.length ? <HBars data={data.cities} /> : <p className="text-quiet text-[14px]">No city data yet.</p>}</div>
            <div className="card"><div className="label mb-3">Top interests</div>{data.top_interests.length ? <HBars data={data.top_interests} /> : <p className="text-quiet text-[14px]">No data yet.</p>}</div>
            <div className="card"><div className="label mb-4">Push devices</div>{data.platforms.length ? <Donut data={data.platforms} /> : <p className="text-quiet text-[14px]">No registered devices.</p>}</div>
          </div>

          <div className="label mt-8 mb-3">Engagement funnel (all time)</div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Likes" value={fmtNum(data.match_rate.likes)} />
            <Stat label="Matches" value={fmtNum(data.match_rate.matches)} hint={`${data.match_rate.likes ? Math.round((data.match_rate.matches / data.match_rate.likes) * 100) : 0}% of likes`} />
            <Stat label="Chats started" value={fmtNum(data.match_rate.chats_started)} />
            <Stat label="Identity reveals" value={fmtNum(data.match_rate.reveals)} tone="pink" />
          </div>
        </>
      )}
    </>
  );
}
