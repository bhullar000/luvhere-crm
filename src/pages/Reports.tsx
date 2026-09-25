import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Empty, ErrorBox, Field, Modal, PageHeader, Pagination, SearchInput, Spinner, StatusBadge, Table, Tabs, useToast } from '../components/ui';
import { get, put, type Page } from '../lib/api';
import { useAuth } from '../lib/auth';
import { timeAgo, titleCase } from '../lib/format';

export default function Reports() {
  const [status, setStatus] = useState('active');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<any>(null);
  const [note, setNote] = useState('');
  const [penalty, setPenalty] = useState('none');
  const qc = useQueryClient();
  const toast = useToast();
  const { can } = useAuth();

  const { data, isLoading, error } = useQuery({ queryKey: ['reports', status, search, page], queryFn: () => get<Page<any>>('/reports', { status, search, page }) });
  const resolve = useMutation({
    mutationFn: (v: any) => put(`/reports/${open.id}`, v),
    onSuccess: () => { toast('Report updated'); setOpen(null); qc.invalidateQueries({ queryKey: ['reports'] }); qc.invalidateQueries({ queryKey: ['overview'] }); },
    onError: (e: Error) => toast(e.message, 'danger'),
  });
  const openReport = (r: any) => { setOpen(r); setNote(r.resolution_note ?? ''); setPenalty('none'); };

  return (
    <>
      <PageHeader title="Reports" subtitle="User reports waiting for a decision" actions={<SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Reported user or details" />} />
      <div className="mb-5"><Tabs value={status} onChange={(t) => { setStatus(t); setPage(1); }} tabs={[
        { id: 'active', label: 'Needs review' }, { id: 'actioned', label: 'Actioned' }, { id: 'dismissed', label: 'Dismissed' }, { id: 'all', label: 'All' },
      ]} /></div>

      {isLoading ? <Spinner /> : error ? <ErrorBox error={error} /> : !data!.data.length ? <Empty title="No reports" hint="Nothing to review right now." /> : (
        <>
          <Table head={['#', 'Reason', 'Reported user', 'Reported by', 'Status', 'When', '']}>
            {data!.data.map((r) => (
              <tr key={r.id} className="hover:bg-white/[0.03] cursor-pointer" onClick={() => openReport(r)}>
                <td className="td text-quiet">{r.id}</td>
                <td className="td"><Badge tone="pink">{titleCase(r.reason)}</Badge></td>
                <td className="td">{r.reported?.name ?? `#${r.reported?.id}`} {r.reports_against_total > 1 && <Badge tone="danger">{r.reports_against_total} reports</Badge>}</td>
                <td className="td text-soft">{r.reporter?.name ?? `#${r.reporter?.id}`}</td>
                <td className="td"><StatusBadge status={r.status} /></td>
                <td className="td text-quiet">{timeAgo(r.created_at)}</td>
                <td className="td text-pink text-[13px] font-semibold">Review</td>
              </tr>
            ))}
          </Table>
          <Pagination page={data} onPage={setPage} />
        </>
      )}

      <Modal open={!!open} onClose={() => setOpen(null)} title={`Report #${open?.id}`} wide
        footer={open && (can('admin', 'moderator') ? <>
          <Button variant="ghost" onClick={() => resolve.mutate({ status: 'reviewing', note })}>Mark reviewing</Button>
          <Button onClick={() => resolve.mutate({ status: 'dismissed', note })}>Dismiss</Button>
          <Button variant="primary" loading={resolve.isPending} onClick={() => resolve.mutate({ status: 'actioned', note, ban: penalty === 'ban', suspend_days: penalty.startsWith('s') ? Number(penalty.slice(1)) : undefined })}>Mark actioned</Button>
        </> : <span className="text-quiet text-[13px]">Your role can view but not resolve reports.</span>)}>
        {open && (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="card !bg-elevated"><div className="label mb-1">Reported user</div>
                <Link to={`/users/${open.reported?.id}`} className="font-semibold hover:text-pink">{open.reported?.name ?? `#${open.reported?.id}`}</Link>
                <div className="text-quiet text-[13px]">{open.reported?.email ?? open.reported?.phone} · <StatusBadge status={open.reported?.status} /></div>
                <div className="text-warn text-[13px] mt-1">{open.reports_against_total} report(s) total</div></div>
              <div className="card !bg-elevated"><div className="label mb-1">Reporter</div>
                <Link to={`/users/${open.reporter?.id}`} className="font-semibold hover:text-pink">{open.reporter?.name ?? `#${open.reporter?.id}`}</Link>
                <div className="text-quiet text-[13px]">{open.reporter?.email ?? open.reporter?.phone}</div></div>
            </div>
            <div><div className="label mb-1">Reason</div><Badge tone="pink">{titleCase(open.reason)}</Badge></div>
            <div><div className="label mb-1">Details</div><p className="text-soft whitespace-pre-wrap">{open.details || 'No details provided.'}</p></div>
            {can('admin', 'moderator') && <>
              <Field label="Penalty when marking actioned">
                <select className="input" value={penalty} onChange={(e) => setPenalty(e.target.value)}>
                  <option value="none">No account penalty</option><option value="s1">Suspend 1 day</option><option value="s7">Suspend 7 days</option><option value="s30">Suspend 30 days</option><option value="ban">Ban permanently</option>
                </select>
              </Field>
              <Field label="Resolution note"><textarea className="input min-h-[80px]" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
            </>}
          </>
        )}
      </Modal>
    </>
  );
}
