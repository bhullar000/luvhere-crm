import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type ChangeEvent } from 'react';
import { Button, ErrorBox, Field, PageHeader, Spinner, Toggle, useToast } from '../components/ui';
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
  const appStr = (k: string) => (e: ChangeEvent<HTMLInputElement>) => setS({ ...s, app: { ...s.app, [k]: e.target.value } });
  const appBool = (k: string) => (v: boolean) => setS({ ...s, app: { ...s.app, [k]: v } });
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
          <div className="flex items-center justify-between gap-4 bg-elevated border rounded-2xl px-4 py-3">
            <div><div className="font-medium text-[14px]">Maintenance mode</div><div className="text-quiet text-[12px]">Sent to the app as a banner message.</div></div>
            <Toggle label="Maintenance mode" checked={!!s.app.maintenance_mode} onChange={appBool('maintenance_mode')} />
          </div>
          <Field label="Maintenance message"><input className="input" value={s.app.maintenance_message ?? ''} onChange={(e) => setS({ ...s, app: { ...s.app, maintenance_message: e.target.value } })} /></Field>
        </div>
        <div className="card space-y-4 lg:col-span-2">
          <div className="label">Update prompt</div>
          <div className="flex items-center justify-between gap-4 bg-elevated border rounded-2xl px-4 py-3">
            <div><div className="font-medium text-[14px]">Require update</div><div className="text-quiet text-[12px]">On: an app older than the latest version below shows a popup that can't be closed until the user updates from the store. Builds below the minimum supported version are always blocked.</div></div>
            <Toggle label="Require update" checked={!!s.app.force_update} onChange={appBool('force_update')} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Latest iOS version" hint="The version live on the App Store, e.g. 1.2.0."><input className="input" value={s.app.latest_version_ios ?? ''} onChange={appStr('latest_version_ios')} /></Field>
            <Field label="Latest Android version" hint="The version live on Google Play, e.g. 1.2.0."><input className="input" value={s.app.latest_version_android ?? ''} onChange={appStr('latest_version_android')} /></Field>
            <Field label="App Store link" hint="e.g. https://apps.apple.com/app/id1234567890"><input className="input" value={s.app.ios_store_url ?? ''} onChange={appStr('ios_store_url')} /></Field>
            <Field label="Google Play link"><input className="input" value={s.app.android_store_url ?? ''} onChange={appStr('android_store_url')} /></Field>
          </div>
          <Field label="Message" hint="Optional. Shown in the popup instead of the default text."><input className="input" value={s.app.update_message ?? ''} onChange={appStr('update_message')} /></Field>
        </div>
      </div>
    </>
  );
}
