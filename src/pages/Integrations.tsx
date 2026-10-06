import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ActionDialog, Badge, Button, ErrorBox, PageHeader, Spinner, Tabs, useToast } from '../components/ui';
import { get, put } from '../lib/api';

type Mode = 'test' | 'live';
type Modes = Record<string, Mode | null>;

/** What each switch does in kive-backend, in the order a new user meets them. */
const INTEGRATIONS: { key: string; title: string; test: string; live: string }[] = [
  { key: 'sms', title: 'SMS OTP', test: 'No SMS is sent; the app shows the code on screen.', live: 'Codes are sent by Fast2SMS (paid, Indian numbers only).' },
  { key: 'verification', title: 'Face verification', test: 'The liveness check and the photo face match always pass.', live: 'AWS Rekognition liveness, and every photo matched to the live face.' },
  { key: 'inappropriate', title: 'Inappropriate photo check', test: 'Every upload is treated as clean.', live: 'AWS Rekognition scans each upload; blocked photos are deleted and the user told.' },
  { key: 'moderation', title: 'Photo moderation', test: 'New photos are approved automatically.', live: 'New photos wait in Photo moderation for a reviewer.' },
  { key: 'payments', title: 'Premium payments', test: 'Choosing a plan grants it at once with no charge (test purchase).', live: 'No payment gateway is connected yet, so purchases are refused.' },
];

export default function Integrations() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading, error } = useQuery({ queryKey: ['integrations'], queryFn: () => get<{ integrations: Modes }>('/integrations') });
  const [modes, setModes] = useState<Modes | null>(null);
  const [confirming, setConfirming] = useState(false);
  useEffect(() => { if (data) setModes(data.integrations); }, [data]);

  const save = useMutation({
    mutationFn: () => put('/integrations', { integrations: modes }),
    onSuccess: () => { toast('Integration modes saved'); qc.invalidateQueries({ queryKey: ['integrations'] }); },
    onError: (e: Error) => toast(e.message, 'danger'),
  });

  if (error) return <ErrorBox error={error} />;
  if (isLoading || !modes || !data) return <Spinner />;

  const saved = data.integrations;
  const changed = INTEGRATIONS.filter((i) => modes[i.key] !== saved[i.key]);
  const goingLive = changed.filter((i) => modes[i.key] === 'live');

  // Going live costs money and affects real users, so it is confirmed first.
  const onSave = () => (goingLive.length > 0 ? setConfirming(true) : save.mutate());

  return (
    <>
      <PageHeader
        title="Integrations"
        subtitle="Test runs every flow without calling a provider. Live uses the real service. Changes apply to the app immediately."
        actions={<Button variant="primary" disabled={changed.length === 0} loading={save.isPending} onClick={onSave}>Save changes</Button>}
      />
      <div className="card !py-1 divide-y divide-white/[0.06]">
        {INTEGRATIONS.map((i) => {
          const mode = modes[i.key];
          return (
            <div key={i.key} className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-medium text-[15px]">
                  {i.title}
                  {mode ? <Badge tone={mode === 'live' ? 'ok' : 'warn'}>{mode}</Badge> : <Badge>server default</Badge>}
                  {modes[i.key] !== saved[i.key] && <Badge tone="pink">unsaved</Badge>}
                </div>
                <div className="text-quiet text-[13px] mt-0.5">
                  {mode === 'live' ? i.live : mode === 'test' ? i.test : 'Not set here yet, so the app follows its .env. Pick a mode to take control.'}
                </div>
              </div>
              <Tabs<Mode>
                tabs={[{ id: 'test', label: 'Test' }, { id: 'live', label: 'Live' }]}
                value={(mode ?? '') as Mode}
                onChange={(m) => setModes({ ...modes, [i.key]: m })}
              />
            </div>
          );
        })}
      </div>

      <ActionDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Switch to live?"
        description={`${goingLive.map((i) => i.title).join(', ')} will use the real provider for every user, and may be billed.`}
        confirmLabel="Go live"
        danger
        onConfirm={() => save.mutateAsync()}
      />
    </>
  );
}
