import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Empty, ErrorBox, PageHeader, Pagination, Spinner, StatusBadge, Table, Tabs, useToast } from '../components/ui';
import { get, post, type Page } from '../lib/api';
import { useAuth } from '../lib/auth';
import { timeAgo } from '../lib/format';

export default function Verifications() {
  const [status, setStatus] = useState('failed');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const toast = useToast();
  const { can } = useAuth();

  const { data, isLoading, error } = useQuery({ queryKey: ['verifs', status, page], queryFn: () => get<Page<any>>('/verifications', { status, page }) });
  const decide = useMutation({
    mutationFn: (v: { id: number; decision: 'approve' | 'reject' }) => post(`/verifications/${v.id}/decision`, { decision: v.decision }),
    onSuccess: () => { toast('Decision saved'); qc.invalidateQueries({ queryKey: ['verifs'] }); qc.invalidateQueries({ queryKey: ['overview'] }); },
    onError: (e: Error) => toast(e.message, 'danger'),
  });

  return (
    <>
      <PageHeader title="Verification" subtitle="Face-liveness attempts and per-photo face matches. Override a result manually when the automatic check got it wrong." />
      <div className="mb-5"><Tabs value={status} onChange={(t) => { setStatus(t); setPage(1); }} tabs={[
        { id: 'failed', label: 'Failed' }, { id: 'queue', label: 'Pending + failed' }, { id: 'verified', label: 'Verified' }, { id: 'all', label: 'All' },
      ]} /></div>

      {isLoading ? <Spinner /> : error ? <ErrorBox error={error} /> : !data!.data.length ? <Empty title="Nothing to review" /> : (
        <>
          <Table head={['User', 'Result', 'Liveness', 'Photo matches', 'When', '']}>
            {data!.data.map((v) => (
              <tr key={v.id} className="hover:bg-white/[0.03]">
                <td className="td"><Link to={`/users/${v.user?.id}`} className="font-medium hover:text-pink">{v.user?.name ?? `#${v.user?.id}`}</Link><div className="text-[12px] text-quiet">{v.user?.email ?? v.user?.phone}</div></td>
                <td className="td"><StatusBadge status={v.status} />{v.failure_reason && <div className="text-[12px] text-quiet mt-1 max-w-[220px]">{v.failure_reason}</div>}</td>
                <td className="td text-soft">{v.liveness_confidence ? `${Math.round(v.liveness_confidence)}%` : '—'}</td>
                <td className="td">
                  <div className="flex gap-1.5">{v.user?.photos.length ? v.user.photos.map((p: any) => (
                    <div key={p.id} className="relative" title={`${p.face_status ?? 'unchecked'} ${p.face_similarity ? Math.round(p.face_similarity) + '%' : ''}`}>
                      <img src={p.thumb_url} className={`w-11 h-14 object-cover rounded-lg border-2 ${p.face_status === 'matched' ? 'border-ok/60' : p.face_status ? 'border-danger/60' : 'border-white/10'}`} />
                    </div>)) : <Badge>no photos</Badge>}</div>
                </td>
                <td className="td text-quiet">{timeAgo(v.created_at)}</td>
                <td className="td">
                  {can('admin', 'moderator') && v.status !== 'verified' && <div className="flex gap-2"><Button size="sm" variant="primary" onClick={() => decide.mutate({ id: v.id, decision: 'approve' })}><Check size={13} /> Approve</Button></div>}
                  {can('admin', 'moderator') && v.status === 'verified' && <Button size="sm" variant="danger" onClick={() => decide.mutate({ id: v.id, decision: 'reject' })}><X size={13} /> Revoke</Button>}
                </td>
              </tr>
            ))}
          </Table>
          <Pagination page={data} onPage={setPage} />
        </>
      )}
    </>
  );
}
