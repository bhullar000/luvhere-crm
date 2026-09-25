import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Empty, ErrorBox, PageHeader, Pagination, SearchInput, Spinner, StatusBadge, Table, useToast } from '../components/ui';
import { del, get } from '../lib/api';
import { useAuth } from '../lib/auth';
import { timeAgo } from '../lib/format';

export default function Blocks() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const toast = useToast();
  const { can } = useAuth();
  const { data, isLoading, error } = useQuery({ queryKey: ['blocks', search, page], queryFn: () => get('/blocks', { search, page }) });
  const remove = useMutation({
    mutationFn: (id: number) => del(`/blocks/${id}`),
    onSuccess: () => { toast('Block removed'); qc.invalidateQueries({ queryKey: ['blocks'] }); },
  });

  return (
    <>
      <PageHeader title="Blocks" subtitle="Who is blocking whom. A user blocked by many people is a strong abuse signal." actions={<SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name" />} />
      {data?.most_blocked?.length > 0 && (
        <div className="card mb-5">
          <div className="label mb-3">Most blocked users</div>
          <div className="flex flex-wrap gap-3">{data.most_blocked.map((u: any) => (
            <Link key={u.id} to={`/users/${u.id}`} className="bg-elevated border rounded-2xl px-4 py-2.5 hover:border-pink/40">
              <div className="font-medium text-[14px]">{u.name ?? `#${u.id}`} <StatusBadge status={u.status} /></div>
              <div className="text-danger text-[12px] font-semibold">blocked by {u.blocked_by}</div>
            </Link>))}</div>
        </div>
      )}
      {isLoading ? <Spinner /> : error ? <ErrorBox error={error} /> : !data.data.length ? <Empty title="No blocks" /> : (
        <>
          <Table head={['Blocker', 'Blocked', 'When', '']}>
            {data.data.map((b: any) => (
              <tr key={b.id} className="hover:bg-white/[0.03]">
                <td className="td"><Link to={`/users/${b.blocker_id}`} className="hover:text-pink">{b.blocker_name ?? `#${b.blocker_id}`}</Link></td>
                <td className="td"><Link to={`/users/${b.blocked_id}`} className="hover:text-pink">{b.blocked_name ?? `#${b.blocked_id}`}</Link></td>
                <td className="td text-quiet">{timeAgo(b.created_at)}</td>
                <td className="td text-right">{can('admin', 'moderator') && <Button size="sm" variant="ghost" onClick={() => remove.mutate(b.id)}>Remove block</Button>}</td>
              </tr>
            ))}
          </Table>
          <Pagination page={data} onPage={setPage} />
        </>
      )}
    </>
  );
}
