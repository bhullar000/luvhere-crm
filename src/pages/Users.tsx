import { useQuery } from '@tanstack/react-query';
import { Crown, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Empty, ErrorBox, PageHeader, Pagination, SearchInput, Select, Spinner, StatusBadge, Table } from '../components/ui';
import { get, type Page } from '../lib/api';
import { fmtDate, timeAgo, titleCase } from '../lib/format';

export default function Users() {
  const [f, setF] = useState<Record<string, string>>({ search: '', status: '', gender: '', is_verified: '', is_premium: '', onboarded: '', deleted: '', sort: 'id', dir: 'desc' });
  const [page, setPage] = useState(1);
  const set = (k: string) => (v: string) => { setF((s) => ({ ...s, [k]: v })); setPage(1); };

  const { data, isLoading, error } = useQuery({ queryKey: ['users', f, page], queryFn: () => get<Page<any>>('/users', { ...f, page }) });

  return (
    <>
      <PageHeader title="Users" subtitle="Search, filter and manage every account" />
      <div className="flex flex-wrap gap-2.5 mb-4">
        <SearchInput value={f.search} onChange={set('search')} placeholder="Name, email, phone or ID" />
        <Select className="!w-36" value={f.status} onChange={set('status')} placeholder="Any status" options={[{ value: 'active', label: 'Active' }, { value: 'suspended', label: 'Suspended' }, { value: 'banned', label: 'Banned' }]} />
        <Select className="!w-36" value={f.gender} onChange={set('gender')} placeholder="Any gender" options={['male', 'female', 'non_binary', 'other'].map((v) => ({ value: v, label: titleCase(v) }))} />
        <Select className="!w-36" value={f.is_verified} onChange={set('is_verified')} placeholder="Verified: any" options={[{ value: 'true', label: 'Verified' }, { value: 'false', label: 'Not verified' }]} />
        <Select className="!w-36" value={f.is_premium} onChange={set('is_premium')} placeholder="Plan: any" options={[{ value: 'true', label: 'Premium' }, { value: 'false', label: 'Free' }]} />
        <Select className="!w-40" value={f.onboarded} onChange={set('onboarded')} placeholder="Onboarding: any" options={[{ value: 'true', label: 'Completed' }, { value: 'false', label: 'Incomplete' }]} />
        <Select className="!w-36" value={f.deleted} onChange={set('deleted')} placeholder="Hide deleted" options={[{ value: '1', label: 'Deleted only' }, { value: 'all', label: 'Include deleted' }]} />
        <Select className="!w-44" value={`${f.sort}:${f.dir}`} onChange={(v) => { const [s, d] = v.split(':'); setF((x) => ({ ...x, sort: s, dir: d })); }}
          options={[{ value: 'id:desc', label: 'Newest first' }, { value: 'id:asc', label: 'Oldest first' }, { value: 'last_active_at:desc', label: 'Recently active' }, { value: 'name:asc', label: 'Name A–Z' }]} />
      </div>

      {isLoading ? <Spinner /> : error ? <ErrorBox error={error} /> : !data!.data.length ? <Empty title="No users match" hint="Try clearing a filter." /> : (
        <>
          <Table head={['User', 'Contact', 'Profile', 'Status', 'Last active', 'Joined']}>
            {data!.data.map((u) => (
              <tr key={u.id} className="hover:bg-white/[0.03]">
                <td className="td">
                  <Link to={`/users/${u.id}`} className="flex items-center gap-3">
                    <Avatar src={u.avatar} name={u.name} />
                    <div>
                      <div className="font-medium flex items-center gap-1.5">{u.name ?? 'Unnamed'}
                        {u.is_verified && <ShieldCheck size={14} className="text-ok" />}
                        {u.is_premium && <Crown size={14} className="text-pink" />}
                      </div>
                      <div className="text-[12px] text-quiet">#{u.id}{u.deleted_at && ' · deleted'}</div>
                    </div>
                  </Link>
                </td>
                <td className="td text-soft">{u.email ?? u.phone ?? '—'}</td>
                <td className="td text-soft">{[u.age, titleCase(u.gender), u.city].filter((x) => x && x !== '—').join(' · ') || '—'}{!u.onboarded && <span className="text-quiet text-[12px] block">onboarding incomplete</span>}</td>
                <td className="td"><StatusBadge status={u.status} /></td>
                <td className="td text-quiet">{timeAgo(u.last_active_at)}</td>
                <td className="td text-quiet">{fmtDate(u.created_at)}</td>
              </tr>
            ))}
          </Table>
          <Pagination page={data} onPage={setPage} />
        </>
      )}
    </>
  );
}
