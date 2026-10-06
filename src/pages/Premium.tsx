import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Plus } from 'lucide-react';
import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { Badge, Button, ErrorBox, PageHeader, Select, Spinner, useToast } from '../components/ui';
import { get, put } from '../lib/api';

type Period = { id?: number; code: string; label: string; price_suffix: string; months: number; discount_percent: number; is_active: boolean };
type Feature = { id?: number; key: string; label: string; paywall_label: string | null; icon: string; in_paywall: boolean; is_active: boolean; enforced?: boolean };
type Plan = { id?: number; code: string; name: string; is_popular: boolean; is_active: boolean; subscribers?: number; prices: Record<string, number | null>; features: Record<string, string> };
type Catalogue = { periods: Period[]; features: Feature[]; plans: Plan[]; icons: string[] };

/** What each enforced feature key does in the app when a plan says yes / limited / no. */
const ENFORCED_HINT: Record<string, string> = {
  unlimited_likes: 'yes: no daily cap. Otherwise the free likes per day apply (App config).',
  see_likes: 'yes or limited: the Likes tab shows who liked you. no: likers stay locked.',
  see_matches: 'yes or limited: matches open. no: tapping a match opens the upgrade popup.',
  unlimited_match_chat: 'yes: no cap. Otherwise the free messages per match apply.',
  anon_chat: 'yes: no cap. Otherwise the free anonymous chats per day and messages per chat apply.',
};

const VALUES = [
  { value: 'yes', label: '✓ Included' },
  { value: 'limited', label: 'Limited' },
  { value: 'no', label: '✕ Not included' },
];

const slug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

function move<T>(list: T[], i: number, by: -1 | 1): T[] {
  const j = i + by;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

function Order({ onUp, onDown }: { onUp: () => void; onDown: () => void }) {
  return (
    <div className="flex flex-col text-quiet">
      <button type="button" title="Move up" onClick={onUp} className="hover:text-pink"><ArrowUp size={14} /></button>
      <button type="button" title="Move down" onClick={onDown} className="hover:text-pink"><ArrowDown size={14} /></button>
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex items-center gap-2 text-[13px] text-soft cursor-pointer whitespace-nowrap">
      <input type="checkbox" className="w-4 h-4 accent-[#FF3F8E]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function Section({ title, hint, action, children }: { title: string; hint: string; action: ReactNode; children: ReactNode }) {
  return (
    <div className="card space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="label">{title}</div>
          <div className="text-quiet text-[12px] mt-1">{hint}</div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function Premium() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading, error } = useQuery({ queryKey: ['premium'], queryFn: () => get<Catalogue>('/premium') });
  const [c, setC] = useState<Catalogue | null>(null);
  useEffect(() => { if (data) setC(data); }, [data]);

  const save = useMutation({
    mutationFn: () => put<Catalogue>('/premium', c),
    onSuccess: (fresh) => { toast('Plans saved — the app picks them up on its next fetch'); qc.setQueryData(['premium'], fresh); setC(fresh); },
    onError: (e: Error) => toast(e.message, 'danger'),
  });

  if (error) return <ErrorBox error={error} />;
  if (isLoading || !c) return <Spinner />;

  const setPeriod = (i: number, patch: Partial<Period>) => setC({ ...c, periods: c.periods.map((p, k) => (k === i ? { ...p, ...patch } : p)) });
  const setFeature = (i: number, patch: Partial<Feature>) => setC({ ...c, features: c.features.map((f, k) => (k === i ? { ...f, ...patch } : f)) });
  const setPlan = (i: number, patch: Partial<Plan>) => setC({ ...c, plans: c.plans.map((p, k) => (k === i ? { ...p, ...patch } : p)) });
  // One plan carries the "Most Popular" pill.
  const setPopular = (i: number) => setC({ ...c, plans: c.plans.map((p, k) => ({ ...p, is_popular: k === i })) });

  const addPeriod = () => setC({ ...c, periods: [...c.periods, { code: `period_${c.periods.length + 1}`, label: 'New period', price_suffix: '/month', months: 1, discount_percent: 0, is_active: false }] });
  const addPlan = () => setC({ ...c, plans: [...c.plans, { code: `plan_${c.plans.length + 1}`, name: 'New plan', is_popular: false, is_active: false, prices: {}, features: {} }] });
  const addFeature = () => setC({ ...c, features: [...c.features, { key: `feature_${c.features.length + 1}`, label: 'New feature', paywall_label: null, icon: 'star', in_paywall: false, is_active: true }] });

  return (
    <>
      <PageHeader
        title="Premium plans"
        subtitle="Everything the app's upgrade popup and Choose Your Plan screen show: periods, prices, discounts and what each plan includes."
        actions={<Button variant="primary" loading={save.isPending} onClick={() => save.mutate()}>Save changes</Button>}
      />

      <div className="space-y-4">
        <Section
          title="Billing periods"
          hint="The tabs above the plans. A discount above 0 shows a “Save N%” badge on its tab. Retire a period by switching it off."
          action={<Button size="sm" onClick={addPeriod}><Plus size={14} />Add period</Button>}
        >
          <div className="grid grid-cols-[24px_1.2fr_1fr_1fr_90px_110px_auto] gap-3 items-center text-[13px]">
            <span /><span className="label">Tab label</span><span className="label">Code</span><span className="label">Price suffix</span><span className="label">Months</span><span className="label">Discount %</span><span />
            {c.periods.map((p, i) => (
              <Fragment key={p.id ?? `new-${i}`}>
                <Order onUp={() => setC({ ...c, periods: move(c.periods, i, -1) })} onDown={() => setC({ ...c, periods: move(c.periods, i, 1) })} />
                <input className="input" value={p.label} onChange={(e) => setPeriod(i, { label: e.target.value })} />
                <input className="input font-mono" value={p.code} disabled={!!p.id} onChange={(e) => setPeriod(i, { code: slug(e.target.value) })} />
                <input className="input" value={p.price_suffix} onChange={(e) => setPeriod(i, { price_suffix: e.target.value })} />
                <input className="input" type="number" min={1} value={p.months} onChange={(e) => setPeriod(i, { months: Number(e.target.value) })} />
                <input className="input" type="number" min={0} max={95} value={p.discount_percent} onChange={(e) => setPeriod(i, { discount_percent: Number(e.target.value) })} />
                <Toggle checked={p.is_active} onChange={(v) => setPeriod(i, { is_active: v })} label="Active" />
              </Fragment>
            ))}
          </div>
        </Section>

        <Section
          title="Plans & prices"
          hint="Price is in ₹ for the whole period. Leave a price empty to not offer that plan for that period."
          action={<Button size="sm" onClick={addPlan}><Plus size={14} />Add plan</Button>}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left">
                  <th /><th className="label pb-2 pr-3">Name</th><th className="label pb-2 pr-3">Code</th>
                  {c.periods.map((p) => <th key={p.code} className="label pb-2 pr-3">₹ {p.label}</th>)}
                  <th className="label pb-2 pr-3">Most popular</th><th />
                </tr>
              </thead>
              <tbody>
                {c.plans.map((plan, i) => (
                  <tr key={plan.id ?? `new-${i}`} className="align-middle">
                    <td className="pr-2 py-1.5"><Order onUp={() => setC({ ...c, plans: move(c.plans, i, -1) })} onDown={() => setC({ ...c, plans: move(c.plans, i, 1) })} /></td>
                    <td className="pr-3 py-1.5 min-w-[140px]"><input className="input" value={plan.name} onChange={(e) => setPlan(i, { name: e.target.value })} /></td>
                    <td className="pr-3 py-1.5 min-w-[120px]"><input className="input font-mono" value={plan.code} disabled={!!plan.id} onChange={(e) => setPlan(i, { code: slug(e.target.value) })} /></td>
                    {c.periods.map((p) => (
                      <td key={p.code} className="pr-3 py-1.5 min-w-[110px]">
                        <input
                          className="input" type="number" min={1} placeholder="—"
                          value={plan.prices[p.code] ?? ''}
                          onChange={(e) => setPlan(i, { prices: { ...plan.prices, [p.code]: e.target.value === '' ? null : Number(e.target.value) } })}
                        />
                      </td>
                    ))}
                    <td className="pr-3 py-1.5"><input type="radio" name="popular" className="w-4 h-4 accent-[#FF3F8E]" checked={plan.is_popular} onChange={() => setPopular(i)} /></td>
                    <td className="py-1.5">
                      <div className="flex items-center gap-3">
                        <Toggle checked={plan.is_active} onChange={(v) => setPlan(i, { is_active: v })} label="Active" />
                        {!!plan.subscribers && <Badge tone="pink">{plan.subscribers} active</Badge>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section
          title="Features"
          hint="Rows of the comparison table. “In popup” lists the feature on the Unlock More Connections popup. Keys marked enforced change what the app allows."
          action={<Button size="sm" onClick={addFeature}><Plus size={14} />Add feature</Button>}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left">
                  <th /><th className="label pb-2 pr-3">Table label</th><th className="label pb-2 pr-3">Popup label</th><th className="label pb-2 pr-3">Icon</th>
                  {c.plans.map((p) => <th key={p.code} className="label pb-2 pr-3">{p.name}</th>)}
                  <th />
                </tr>
              </thead>
              <tbody>
                {c.features.map((f, i) => (
                  <tr key={f.id ?? `new-${i}`} className="align-top">
                    <td className="pr-2 pt-3"><Order onUp={() => setC({ ...c, features: move(c.features, i, -1) })} onDown={() => setC({ ...c, features: move(c.features, i, 1) })} /></td>
                    <td className="pr-3 py-1.5 min-w-[200px]">
                      <input className="input" value={f.label} onChange={(e) => setFeature(i, { label: e.target.value })} />
                      <div className="flex items-center gap-2 mt-1.5">
                        <input className="input !py-1 !text-[12px] font-mono" value={f.key} disabled={!!f.id} onChange={(e) => setFeature(i, { key: slug(e.target.value) })} />
                        {f.enforced && <Badge tone="violet">enforced</Badge>}
                      </div>
                      {f.enforced && <div className="text-quiet text-[11px] mt-1 max-w-[280px]">{ENFORCED_HINT[f.key]}</div>}
                    </td>
                    <td className="pr-3 py-1.5 min-w-[200px]"><input className="input" placeholder={f.label} value={f.paywall_label ?? ''} onChange={(e) => setFeature(i, { paywall_label: e.target.value || null })} /></td>
                    <td className="pr-3 py-1.5 min-w-[120px]"><Select value={f.icon} onChange={(v) => setFeature(i, { icon: v })} options={c.icons.map((icon) => ({ value: icon, label: icon }))} /></td>
                    {c.plans.map((plan, pi) => (
                      <td key={plan.code} className="pr-3 py-1.5 min-w-[140px]">
                        <Select
                          value={plan.features[f.key] ?? 'no'}
                          onChange={(v) => setPlan(pi, { features: { ...plan.features, [f.key]: v } })}
                          options={VALUES}
                        />
                      </td>
                    ))}
                    <td className="py-1.5">
                      <div className="flex flex-col gap-2 pt-2">
                        <Toggle checked={f.in_paywall} onChange={(v) => setFeature(i, { in_paywall: v })} label="In popup" />
                        <Toggle checked={f.is_active} onChange={(v) => setFeature(i, { is_active: v })} label="Active" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    </>
  );
}
