import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button, Empty, Field, PageHeader, Select, Spinner, Table, useToast } from '../components/ui';
import { get, post } from '../lib/api';
import { useAuth } from '../lib/auth';
import { fmtDate, titleCase } from '../lib/format';

const yn = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];

export default function Broadcasts() {
  const [f, setF] = useState({ title: '', body: '' });
  const [aud, setAud] = useState<Record<string, string>>({});
  const [count, setCount] = useState<number | null>(null);
  const qc = useQueryClient();
  const toast = useToast();
  const { can } = useAuth();
  const canSend = can('admin');
  const cities = useQuery({ queryKey: ['ref', 'cities', 'all'], queryFn: () => get('/reference/cities', { per_page: 200 }), enabled: canSend });
  const history = useQuery({ queryKey: ['broadcasts'], queryFn: () => get('/broadcasts') });

  const clean = () => Object.fromEntries(Object.entries(aud).filter(([, v]) => v !== ''));
  useEffect(() => {
    if (!canSend) return;
    const t = setTimeout(() => post('/broadcasts/preview', { audience: clean() }).then((r) => setCount(r.count)).catch(() => setCount(null)), 300);
    return () => clearTimeout(t);
  }, [aud]); // eslint-disable-line

  const send = useMutation({
    mutationFn: () => post('/broadcasts', { ...f, audience: clean() }),
    onSuccess: (r) => { toast(`Sent to ${r.recipients} users`); setF({ title: '', body: '' }); qc.invalidateQueries({ queryKey: ['broadcasts'] }); },
    onError: (e: Error) => toast(e.message, 'danger'),
  });
  const s = (k: string) => (v: string) => setAud((a) => ({ ...a, [k]: v }));

  return (
    <>
      <PageHeader title="Notifications" subtitle="Send an in-app notification and push to a segment of users" />
      {canSend && (
        <div className="grid lg:grid-cols-2 gap-4 mb-8">
          <div className="card space-y-4">
            <div className="label">Message</div>
            <Field label="Title"><input className="input" maxLength={80} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
            <Field label="Body" hint={`${f.body.length}/300`}><textarea className="input min-h-[110px]" maxLength={300} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></Field>
            <div className="rounded-2xl bg-elevated border p-3.5 flex gap-3 items-start">
              <div className="w-9 h-9 rounded-xl bg-brand shrink-0" />
              <div className="min-w-0"><div className="text-[13px] font-semibold">{f.title || 'Notification title'}</div><div className="text-[13px] text-muted">{f.body || 'Your message appears here.'}</div></div>
            </div>
          </div>
          <div className="card space-y-4">
            <div className="label">Audience <span className="text-pink ml-2 normal-case tracking-normal">{count === null ? '' : `${count.toLocaleString()} users`}</span></div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Gender"><Select value={aud.gender} onChange={s('gender')} placeholder="Everyone" options={['male', 'female', 'non_binary', 'other'].map((v) => ({ value: v, label: titleCase(v) }))} /></Field>
              <Field label="City"><Select value={aud.city_id} onChange={s('city_id')} placeholder="Anywhere" options={(cities.data?.data ?? []).map((c: any) => ({ value: c.id, label: c.name }))} /></Field>
              <Field label="Verified"><Select value={aud.verified} onChange={s('verified')} placeholder="Any" options={yn} /></Field>
              <Field label="Premium"><Select value={aud.premium} onChange={s('premium')} placeholder="Any" options={yn} /></Field>
              <Field label="Finished onboarding"><Select value={aud.onboarded} onChange={s('onboarded')} placeholder="Any" options={yn} /></Field>
              <Field label="Inactive for (days)"><input className="input" type="number" min={1} value={aud.inactive_days ?? ''} onChange={(e) => s('inactive_days')(e.target.value)} placeholder="e.g. 14" /></Field>
              <Field label="Active within (days)"><input className="input" type="number" min={1} value={aud.active_within_days ?? ''} onChange={(e) => s('active_within_days')(e.target.value)} placeholder="e.g. 7" /></Field>
            </div>
            <p className="text-quiet text-[12px]">Suspended, banned and deleted users are always excluded. Users who muted a category still receive system messages.</p>
            <Button variant="primary" className="w-full" loading={send.isPending} disabled={!f.title || !f.body || count === 0}
              onClick={() => { if (confirm(`Send to ${count ?? 'all matching'} users now?`)) send.mutate(); }}><Send size={15} /> Send to {count ?? '…'} users</Button>
          </div>
        </div>
      )}

      <div className="label mb-3">History</div>
      {history.isLoading ? <Spinner /> : !history.data?.data.length ? <Empty title="No broadcasts yet" /> : (
        <Table head={['Title', 'Message', 'Audience', 'Recipients', 'Sent by', 'When']}>
          {history.data.data.map((b: any) => (
            <tr key={b.id}>
              <td className="td font-medium">{b.title}</td>
              <td className="td text-muted max-w-[280px] truncate">{b.body}</td>
              <td className="td text-quiet text-[12px]">{Object.entries(b.audience ?? {}).map(([k, v]) => `${k}: ${v}`).join(', ') || 'Everyone'}</td>
              <td className="td">{b.recipient_count.toLocaleString()}</td>
              <td className="td text-soft">{b.admin ?? '—'}</td>
              <td className="td text-quiet">{fmtDate(b.created_at, true)}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
