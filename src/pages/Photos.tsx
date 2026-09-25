import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Badge, Button, Empty, ErrorBox, Modal, PageHeader, Pagination, Spinner, StatusBadge, Tabs, useToast } from '../components/ui';
import { get, post, type Page } from '../lib/api';
import { useAuth } from '../lib/auth';
import clsx from 'clsx';

export default function Photos() {
  const [sp, setSp] = useSearchParams();
  const status = sp.get('status') ?? 'pending';
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState<number[]>([]);
  const [preview, setPreview] = useState<any>(null);
  const qc = useQueryClient();
  const toast = useToast();
  const { can } = useAuth();
  const mod = can('admin', 'moderator');

  const { data, isLoading, error } = useQuery({ queryKey: ['photos', status, page], queryFn: () => get<Page<any>>('/photos', { status, page }) });
  const review = useMutation({
    mutationFn: (v: { ids: number[]; decision: 'approve' | 'reject' }) => post('/photos/review', v),
    onSuccess: (_r, v) => { toast(`${v.ids.length} photo(s) ${v.decision}d`); setSel([]); setPreview(null); qc.invalidateQueries({ queryKey: ['photos'] }); qc.invalidateQueries({ queryKey: ['overview'] }); },
    onError: (e: Error) => toast(e.message, 'danger'),
  });
  const toggle = (id: number) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <>
      <PageHeader title="Photo moderation" subtitle="Approve clean photos; rejecting deletes the photo from the user's profile"
        actions={mod && sel.length > 0 && <>
          <span className="text-muted text-[14px]">{sel.length} selected</span>
          <Button variant="primary" size="sm" onClick={() => review.mutate({ ids: sel, decision: 'approve' })}><Check size={14} /> Approve</Button>
          <Button variant="danger" size="sm" onClick={() => review.mutate({ ids: sel, decision: 'reject' })}><X size={14} /> Reject</Button>
        </>} />
      <div className="mb-5"><Tabs value={status} onChange={(t) => { setSp({ status: t }); setPage(1); setSel([]); }} tabs={[
        { id: 'pending', label: 'To review' }, { id: 'face_rejected', label: 'Face mismatch' }, { id: 'approved', label: 'Approved' }, { id: 'all', label: 'All' },
      ]} /></div>

      {isLoading ? <Spinner /> : error ? <ErrorBox error={error} /> : !data!.data.length ? <Empty title="Nothing here" hint="The queue is clear." /> : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {data!.data.map((p) => (
              <div key={p.id} className={clsx('card !p-2 transition-all', sel.includes(p.id) && '!border-pink/60 shadow-glow')}>
                <button className="block w-full relative" onClick={() => (mod ? toggle(p.id) : setPreview(p))} onDoubleClick={() => setPreview(p)}>
                  <img src={p.thumb_url} loading="lazy" className="w-full aspect-[3/4] object-cover rounded-xl bg-elevated" />
                  {sel.includes(p.id) && <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-brand grid place-items-center"><Check size={14} /></span>}
                </button>
                <div className="px-1.5 pt-2 pb-1 space-y-1.5">
                  <Link to={`/users/${p.user?.id}`} className="text-[13px] font-medium hover:text-pink block truncate">{p.user?.name ?? 'User'} <span className="text-quiet">#{p.user?.id}</span></Link>
                  <div className="flex flex-wrap gap-1">
                    <StatusBadge status={p.moderation_status} />
                    {p.face_status && <Badge tone={p.face_status === 'matched' ? 'ok' : 'danger'}>face {p.face_status}</Badge>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={data} onPage={setPage} />
          <p className="text-quiet text-[12px] mt-3">Click to select · double-click to enlarge</p>
        </>
      )}

      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.user?.name ?? 'Photo'} wide
        footer={mod && preview && <><Button variant="danger" onClick={() => review.mutate({ ids: [preview.id], decision: 'reject' })}><X size={14} /> Reject</Button><Button variant="primary" onClick={() => review.mutate({ ids: [preview.id], decision: 'approve' })}><Check size={14} /> Approve</Button></>}>
        {preview && <>
          <img src={preview.url} className="max-h-[60vh] mx-auto rounded-2xl" />
          <div className="flex flex-wrap gap-2 justify-center text-[13px]">
            {preview.face_status && <Badge tone={preview.face_status === 'matched' ? 'ok' : 'danger'}>face {preview.face_status}{preview.face_similarity ? ` · ${Math.round(preview.face_similarity)}% similar` : ''}</Badge>}
            {preview.face_reason && <span className="text-quiet">{preview.face_reason}</span>}
          </div>
        </>}
      </Modal>
    </>
  );
}
