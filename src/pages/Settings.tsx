import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type ChangeEvent } from 'react';
import { Button, ErrorBox, Field, PageHeader, Spinner, useToast } from '../components/ui';
import { get, put } from '../lib/api';

export default function Settings() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading, error } = useQuery({ queryKey: ['settings'], queryFn: () => get('/settings') });
  const [s, setS] = useState<any>(null);
  useEffect(() => { if (data) setS(data); }, [data]);

  const save = useMutation({
    mutationFn: () => put('/settings', s),
    onSuccess: () => { toast('Settings saved'); qc.invalidateQueries({ queryKey: ['settings'] }); },
    onError: (e: Error) => toast(e.message, 'danger'),
  });

  if (isLoading || !s) return <Spinner />;
  if (error) return <ErrorBox error={error} />;
  const num = (grp: string, k: string) => (e: ChangeEvent<HTMLInputElement>) => setS({ ...s, [grp]: { ...s[grp], [k]: Number(e.target.value) } });

  return (
    <>
      <PageHeader title="App config" subtitle="Remote settings the mobile app reads from /api/config" actions={<Button variant="primary" loading={save.isPending} onClick={() => save.mutate()}>Save changes</Button>} />
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card space-y-4">
          <div className="label">Free plan limits</div>
          <Field label="Likes per day" hint="Likes a user can send each day unless their plan has unlimited likes."><input className="input" type="number" min={0} value={s.free_limits.likes_per_day} onChange={num('free_limits', 'likes_per_day')} /></Field>
          <Field label="Messages per match" hint="Messages a user can send in each match chat unless their plan has unlimited chat with matches."><input className="input" type="number" min={0} value={s.free_limits.messages_per_match} onChange={num('free_limits', 'messages_per_match')} /></Field>
          <Field label="Anonymous chats per day" hint="New anonymous conversations a user can start each day without the anonymous chat feature."><input className="input" type="number" min={0} value={s.free_limits.anon_chats_per_day ?? 2} onChange={num('free_limits', 'anon_chats_per_day')} /></Field>
          <Field label="Messages per anonymous chat" hint="Messages a user can send in each anonymous chat without the anonymous chat feature."><input className="input" type="number" min={0} value={s.free_limits.anon_messages_per_chat ?? 5} onChange={num('free_limits', 'anon_messages_per_chat')} /></Field>
        </div>
        <div className="card space-y-4">
          <div className="label">App version & availability</div>
          <Field label="Minimum supported version" hint="Older builds should show an update screen."><input className="input" value={s.app.min_supported_version} onChange={(e) => setS({ ...s, app: { ...s.app, min_supported_version: e.target.value } })} /></Field>
          <label className="flex items-center justify-between gap-4 bg-elevated border rounded-2xl px-4 py-3 cursor-pointer">
            <div><div className="font-medium text-[14px]">Maintenance mode</div><div className="text-quiet text-[12px]">Sent to the app as a banner message.</div></div>
            <input type="checkbox" className="w-5 h-5 accent-[#FF3F8E]" checked={s.app.maintenance_mode} onChange={(e) => setS({ ...s, app: { ...s.app, maintenance_mode: e.target.checked } })} />
          </label>
          <Field label="Maintenance message"><input className="input" value={s.app.maintenance_message ?? ''} onChange={(e) => setS({ ...s, app: { ...s.app, maintenance_message: e.target.value } })} /></Field>
        </div>
      </div>
    </>
  );
}
