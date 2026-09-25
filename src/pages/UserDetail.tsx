import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Ban, BellRing, Crown, LogOut, PauseCircle, PlayCircle, RotateCcw, ShieldCheck, ShieldOff, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ActionDialog, Avatar, Badge, Button, ErrorBox, Field, Modal, Spinner, Stat, StatusBadge, Tabs, useToast } from '../components/ui';
import { get, post, put } from '../lib/api';
import { useAuth } from '../lib/auth';
import { fmtDate, fmtNum, timeAgo, titleCase } from '../lib/format';

type Dlg = null | 'suspend' | 'ban' | 'delete' | 'grant_premium' | 'notify';

export default function UserDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const toast = useToast();
  const { can } = useAuth();
  const [tab, setTab] = useState<'overview' | 'photos' | 'activity' | 'safety'>('overview');
  const [dlg, setDlg] = useState<Dlg>(null);
  const [notes, setNotes] = useState<string | null>(null);
  const [msg, setMsg] = useState({ title: '', body: '' });

  const { data, isLoading, error } = useQuery({ queryKey: ['user', id], queryFn: () => get(`/users/${id}`) });
  const refresh = () => { qc.invalidateQueries({ queryKey: ['user', id] }); qc.invalidateQueries({ queryKey: ['users'] }); };

  const act = useMutation({
    mutationFn: (v: { action: string; reason?: string; days?: number }) => post(`/users/${id}/action`, v),
    onSuccess: () => { toast('Done'); refresh(); },
    onError: (e: Error) => toast(e.message, 'danger'),
  });
  const saveNotes = useMutation({
    mutationFn: (v: string) => put(`/users/${id}`, { admin_notes: v }),
    onSuccess: () => { toast('Notes saved'); setNotes(null); refresh(); },
  });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorBox error={error} />;
  const { user: u, stats: s } = data;
  const mod = can('admin', 'moderator');
  const deleted = !!u.deleted_at;

  return (
    <>
      <Link to="/users" className="inline-flex items-center gap-1.5 text-muted hover:text-ink text-[14px] mb-4"><ArrowLeft size={16} /> Users</Link>

      <div className="card flex flex-wrap items-center gap-5">
        <Avatar src={u.photos[0]?.thumb_url} name={u.name} size={84} />
        <div className="flex-1 min-w-[240px]">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[26px] font-bold">{u.name ?? 'Unnamed'}</h1>
            <StatusBadge status={deleted ? 'deleted' : u.status} />
            {u.is_verified && <Badge tone="ok"><ShieldCheck size={12} /> Verified</Badge>}
            {u.is_premium && <Badge tone="pink"><Crown size={12} /> Premium</Badge>}
          </div>
          <div className="text-muted text-[14px] mt-1">#{u.id} · {u.email ?? u.phone ?? 'no contact'} · {[u.age && `${u.age} yrs`, titleCase(u.gender), u.city].filter(Boolean).join(' · ')}</div>
          {u.status !== 'active' && <div className="text-warn text-[13px] mt-1.5">{u.status === 'suspended' && u.suspended_until ? `Suspended until ${fmtDate(u.suspended_until, true)}` : titleCase(u.status)}{u.status_reason && ` — ${u.status_reason}`}</div>}
        </div>

        {mod && (
          <div className="flex flex-wrap gap-2">
            {deleted ? <Button size="sm" onClick={() => act.mutate({ action: 'restore' })}><RotateCcw size={14} /> Restore</Button> : (
              <>
                {u.status === 'active'
                  ? <><Button size="sm" onClick={() => setDlg('suspend')}><PauseCircle size={14} /> Suspend</Button><Button size="sm" variant="danger" onClick={() => setDlg('ban')}><Ban size={14} /> Ban</Button></>
                  : <Button size="sm" variant="primary" onClick={() => act.mutate({ action: 'reactivate' })}><PlayCircle size={14} /> Reactivate</Button>}
                <Button size="sm" onClick={() => act.mutate({ action: u.is_verified ? 'unverify' : 'verify' })}>{u.is_verified ? <><ShieldOff size={14} /> Unverify</> : <><ShieldCheck size={14} /> Verify</>}</Button>
                <Button size="sm" onClick={() => act.mutate({ action: 'force_logout' })}><LogOut size={14} /> Log out everywhere</Button>
                <Button size="sm" variant="danger" onClick={() => setDlg('delete')}><Trash2 size={14} /> Delete</Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
        <Stat label="Likes sent" value={fmtNum(s.likes_given)} hint={`${fmtNum(s.passes)} passes`} />
        <Stat label="Likes received" value={fmtNum(s.likes_received)} />
        <Stat label="Matches" value={fmtNum(s.matches)} tone="pink" />
        <Stat label="Messages" value={fmtNum(s.messages_sent + s.anon_messages_sent)} hint={`${s.anon_conversations} anon chats`} />
        <Stat label="Reports against" value={s.reports_against} tone={s.reports_against ? 'danger' : undefined} hint={`blocked by ${s.blocked_by}`} />
      </div>

      <div className="my-6"><Tabs value={tab} onChange={setTab} tabs={[
        { id: 'overview', label: 'Profile' }, { id: 'photos', label: 'Photos', count: u.photos.length },
        { id: 'activity', label: 'Activity' }, { id: 'safety', label: 'Safety & notes', count: s.reports_against },
      ]} /></div>

      {tab === 'overview' && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="card lg:col-span-2 space-y-5">
            <div><div className="label mb-1.5">Bio</div><p className="text-soft whitespace-pre-wrap">{u.bio || '—'}</p></div>
            <div className="grid sm:grid-cols-3 gap-4 text-[14px]">
              {[['Occupation', u.occupation], ['Education', u.education], ['Height', u.height_cm && `${u.height_cm} cm`], ['Goal', titleCase(u.relationship_goal)], ['Interested in', titleCase(u.interested_in)], ['Birthdate', fmtDate(u.birthdate)]].map(([k, v]) => (
                <div key={k as string}><div className="label">{k}</div><div className="text-soft mt-0.5">{v || '—'}</div></div>
              ))}
            </div>
            <div><div className="label mb-2">Interests</div><div className="flex flex-wrap gap-2">{u.interests.length ? u.interests.map((i: any) => <Badge key={i.id} tone="pink">{i.emoji} {i.name}</Badge>) : <span className="text-quiet">—</span>}</div></div>
            <div><div className="label mb-2">Languages & lifestyle</div><div className="flex flex-wrap gap-2">{[...u.languages.map((l: any) => l.name), ...u.lifestyle.map((l: any) => `${titleCase(l.group)}: ${l.label}`)].map((t) => <Badge key={t}>{t}</Badge>)}</div></div>
          </div>
          <div className="card space-y-4 text-[14px]">
            <div className="label">Account</div>
            {[['Joined', fmtDate(u.created_at, true)], ['Last active', timeAgo(u.last_active_at)], ['Onboarding', u.onboarding_completed_at ? fmtDate(u.onboarding_completed_at) : 'Incomplete'],
              ['Email verified', u.email_verified_at ? fmtDate(u.email_verified_at) : 'No'], ['Phone verified', u.phone_verified_at ? fmtDate(u.phone_verified_at) : 'No'],
              ['Sign-in', [u.google && 'Google', u.apple && 'Apple', u.email && 'Email', u.phone && 'Phone'].filter(Boolean).join(', ') || '—'],
              ['Incognito / Travel', `${u.incognito ? 'On' : 'Off'} / ${u.travel_mode ? 'On' : 'Off'}`]].map(([k, v]) => (
              <div key={k as string} className="flex justify-between gap-3"><span className="text-quiet">{k}</span><span className="text-soft text-right">{v}</span></div>
            ))}
            <div className="border-t pt-4">
              <div className="label mb-2">Premium</div>
              <div className="text-soft mb-3">{u.is_premium ? `Active until ${fmtDate(u.premium_until)}` : 'Free plan'}</div>
              {mod && <div className="flex gap-2 flex-wrap"><Button size="sm" onClick={() => setDlg('grant_premium')}><Crown size={14} /> Grant</Button>{u.is_premium && <Button size="sm" variant="ghost" onClick={() => act.mutate({ action: 'revoke_premium' })}>Revoke</Button>}</div>}
            </div>
            {can('admin', 'moderator', 'support') && <div className="border-t pt-4"><Button size="sm" onClick={() => setDlg('notify')}><BellRing size={14} /> Send notification</Button></div>}
          </div>
        </div>
      )}

      {tab === 'photos' && (
        u.photos.length ? <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {u.photos.map((p: any) => (
            <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="card !p-2 block">
              <img src={p.thumb_url} className="w-full aspect-[3/4] object-cover rounded-xl bg-elevated" />
              <div className="flex flex-wrap gap-1.5 mt-2 px-1 pb-1">
                {p.is_primary && <Badge tone="pink">Primary</Badge>}
                <StatusBadge status={p.moderation_status} />
                {p.face_status && <Badge tone={p.face_status === 'matched' ? 'ok' : 'danger'}>face {p.face_status}{p.face_similarity ? ` ${Math.round(p.face_similarity)}%` : ''}</Badge>}
              </div>
            </a>
          ))}
        </div> : <p className="text-quiet">No photos uploaded.</p>
      )}

      {tab === 'activity' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card"><div className="label mb-3">Devices</div>
            {data.devices.length ? data.devices.map((d: any, i: number) => <div key={i} className="flex justify-between py-1.5 text-[14px]"><span className="text-soft">{d.device_name ?? d.platform} <span className="text-quiet">· {d.platform} v{d.app_version ?? '?'}</span></span><span className="text-quiet">{timeAgo(d.last_seen_at)}</span></div>) : <p className="text-quiet text-[14px]">No push devices registered.</p>}
          </div>
          <div className="card"><div className="label mb-3">Recent notifications</div>
            {data.notifications.length ? data.notifications.map((n: any) => <div key={n.id} className="flex justify-between py-1.5 text-[14px]"><span className="text-soft">{n.title} <span className="text-quiet">· {n.type}</span></span><span className="text-quiet">{n.read_at ? 'read' : 'unread'} · {timeAgo(n.created_at)}</span></div>) : <p className="text-quiet text-[14px]">None.</p>}
          </div>
          <div className="card"><div className="label mb-3">Verification attempts</div>
            {u.verifications.length ? u.verifications.map((v: any) => <div key={v.id} className="flex justify-between items-center py-1.5 text-[14px]"><StatusBadge status={v.status} /><span className="text-quiet">{v.failure_reason ?? (v.confidence ? `${Math.round(v.confidence * 100)}% conf.` : '')} · {timeAgo(v.created_at)}</span></div>) : <p className="text-quiet text-[14px]">No attempts.</p>}
          </div>
          <div className="card"><div className="label mb-3">Preferences</div>
            {u.preference ? <div className="text-[14px] text-soft space-y-1"><div>Age {u.preference.min_age}–{u.preference.max_age} · within {u.preference.max_distance_km} km</div><div>Show me: {titleCase(u.preference.show_me)}</div><div>{u.preference.verified_only && 'Verified only · '}{u.preference.online_only && 'Online only'}</div></div> : <p className="text-quiet text-[14px]">Not set.</p>}
          </div>
        </div>
      )}

      {tab === 'safety' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card"><div className="label mb-3">Reports against this user</div>
            {data.reports.length ? data.reports.map((r: any) => <Link key={r.id} to="/reports" className="flex justify-between items-center py-1.5 text-[14px]"><span className="text-soft">#{r.id} · {titleCase(r.reason)}</span><span className="flex items-center gap-2"><StatusBadge status={r.status} /><span className="text-quiet">{timeAgo(r.created_at)}</span></span></Link>) : <p className="text-quiet text-[14px]">No reports.</p>}
            <div className="text-quiet text-[13px] mt-3">Reports filed by this user: {s.reports_made} · Blocking {s.blocking} · Blocked by {s.blocked_by}</div>
          </div>
          <div className="card"><div className="label mb-3">Internal notes</div>
            <textarea className="input min-h-[120px]" placeholder="Only visible to staff…" disabled={!mod} value={notes ?? u.admin_notes ?? ''} onChange={(e) => setNotes(e.target.value)} />
            {mod && notes !== null && <div className="mt-3"><Button size="sm" variant="primary" loading={saveNotes.isPending} onClick={() => saveNotes.mutate(notes)}>Save notes</Button></div>}
          </div>
          <div className="card lg:col-span-2"><div className="label mb-3">Staff action history</div>
            {data.audit.length ? data.audit.map((a: any, i: number) => <div key={i} className="flex justify-between py-1.5 text-[14px]"><span className="text-soft">{titleCase(a.action.replace('user.', ''))}{a.meta?.reason && <span className="text-quiet"> — {a.meta.reason}</span>} <span className="text-quiet">by {a.admin ?? 'system'}</span></span><span className="text-quiet">{fmtDate(a.created_at, true)}</span></div>) : <p className="text-quiet text-[14px]">No staff actions yet.</p>}
          </div>
        </div>
      )}

      <ActionDialog open={dlg === 'suspend'} onClose={() => setDlg(null)} title="Suspend user" description="They are signed out now and can't sign in until the suspension ends." confirmLabel="Suspend"
        fields={{ days: { label: 'Days', def: '7' }, reason: true }} onConfirm={(v) => act.mutateAsync({ action: 'suspend', days: Number(v.days), reason: v.reason })} />
      <ActionDialog open={dlg === 'ban'} onClose={() => setDlg(null)} danger title="Ban user" description="Permanent. The user is signed out and cannot sign in again unless reactivated." confirmLabel="Ban user"
        fields={{ reason: true }} onConfirm={(v) => act.mutateAsync({ action: 'ban', reason: v.reason })} />
      <ActionDialog open={dlg === 'delete'} onClose={() => setDlg(null)} danger title="Delete account" description="The account is soft-deleted and hidden everywhere. You can restore it later." confirmLabel="Delete"
        fields={{ reason: true }} onConfirm={(v) => act.mutateAsync({ action: 'delete', reason: v.reason })} />
      <ActionDialog open={dlg === 'grant_premium'} onClose={() => setDlg(null)} title="Grant premium" description="Adds free premium time. Extends the current period if already premium." confirmLabel="Grant"
        fields={{ days: { label: 'Days of premium', def: '30' } }} onConfirm={(v) => act.mutateAsync({ action: 'grant_premium', days: Number(v.days) })} />
      <Modal open={dlg === 'notify'} onClose={() => setDlg(null)} title={`Notify ${u.name ?? 'user'}`}
        footer={<><Button variant="ghost" onClick={() => setDlg(null)}>Cancel</Button><Button variant="primary" onClick={async () => { try { await post(`/users/${id}/notify`, msg); toast('Notification queued'); setDlg(null); setMsg({ title: '', body: '' }); } catch (e) { toast((e as Error).message, 'danger'); } }}>Send</Button></>}>
        <Field label="Title"><input className="input" maxLength={80} value={msg.title} onChange={(e) => setMsg({ ...msg, title: e.target.value })} /></Field>
        <Field label="Message"><textarea className="input min-h-[90px]" maxLength={300} value={msg.body} onChange={(e) => setMsg({ ...msg, body: e.target.value })} /></Field>
      </Modal>
    </>
  );
}
