import clsx from 'clsx';
import { Loader2, X } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import type { Page } from '../lib/api';

/* ---------- Button ---------- */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  loading?: boolean;
};
export function Button({ variant = 'secondary', size = 'md', loading, className, children, disabled, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[.98] whitespace-nowrap',
        size === 'md' ? 'px-5 py-2.5 text-[14px]' : 'px-3.5 py-1.5 text-[13px]',
        variant === 'primary' && 'bg-brand text-white shadow-glow hover:brightness-110',
        variant === 'secondary' && 'bg-elevated border text-soft hover:text-ink hover:border-white/20',
        variant === 'ghost' && 'text-muted hover:text-ink hover:bg-white/5',
        variant === 'danger' && 'bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25',
        className,
      )}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

/* ---------- Badge ---------- */
const TONES = {
  neutral: 'bg-white/5 text-muted border-white/10',
  pink: 'bg-pink/10 text-pink border-pink/30',
  violet: 'bg-violet/15 text-[#B592FF] border-violet/30',
  ok: 'bg-ok/10 text-ok border-ok/30',
  warn: 'bg-warn/10 text-warn border-warn/30',
  danger: 'bg-danger/10 text-danger border-danger/30',
} as const;
export type Tone = keyof typeof TONES;
export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={clsx('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[12px] font-medium whitespace-nowrap', TONES[tone])}>{children}</span>;
}

const STATUS_TONE: Record<string, Tone> = {
  active: 'ok', verified: 'ok', matched: 'ok', approved: 'ok', sent: 'ok', actioned: 'ok',
  suspended: 'warn', pending: 'warn', processing: 'warn', reviewing: 'warn', open: 'warn',
  banned: 'danger', failed: 'danger', rejected: 'danger',
  dismissed: 'neutral', unverified: 'neutral',
};
export function StatusBadge({ status }: { status?: string | null }) {
  const s = status ?? 'unknown';
  return <Badge tone={STATUS_TONE[s] ?? 'neutral'}>{s.replace(/_/g, ' ')}</Badge>;
}

/* ---------- Layout bits ---------- */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-[28px] font-bold leading-tight">{title}</h1>
        {subtitle && <p className="text-muted text-[15px] mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: 'pink' | 'ok' | 'warn' | 'danger' }) {
  return (
    <div className="card !p-4">
      <div className="label">{label}</div>
      <div className={clsx('text-[28px] font-bold mt-1.5 leading-none', tone === 'pink' && 'text-pink', tone === 'ok' && 'text-ok', tone === 'warn' && 'text-warn', tone === 'danger' && 'text-danger')}>{value}</div>
      {hint && <div className="text-[12px] text-quiet mt-2">{hint}</div>}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-quiet">
      <Loader2 className="animate-spin" size={18} /> {label ?? 'Loading…'}
    </div>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="text-center py-16">
      <div className="text-soft font-semibold">{title}</div>
      {hint && <div className="text-quiet text-[14px] mt-1">{hint}</div>}
    </div>
  );
}

export function ErrorBox({ error }: { error: unknown }) {
  return <div className="card !border-danger/30 text-danger text-[14px]">{(error as Error)?.message ?? 'Something went wrong'}</div>;
}

export function Avatar({ src, name, size = 36 }: { src?: string | null; name?: string | null; size?: number }) {
  return src ? (
    <img src={src} alt="" style={{ width: size, height: size }} className="rounded-full object-cover bg-elevated shrink-0" />
  ) : (
    <div style={{ width: size, height: size, fontSize: size * 0.4 }} className="rounded-full bg-elevated border grid place-items-center text-muted font-semibold shrink-0">
      {(name ?? '?').trim().charAt(0).toUpperCase()}
    </div>
  );
}

/* ---------- Table ---------- */
export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="card !p-0 overflow-x-auto">
      <table className="w-full">
        <thead className="border-b">
          <tr>{head.map((h, i) => <th key={i} className="th">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06]">{children}</tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, onPage }: { page?: Pick<Page<unknown>, 'current_page' | 'last_page' | 'total'>; onPage: (p: number) => void }) {
  if (!page || page.last_page <= 1) return page ? <div className="text-quiet text-[13px] mt-3">{page.total} total</div> : null;
  return (
    <div className="flex items-center justify-between mt-4">
      <span className="text-quiet text-[13px]">{page.total.toLocaleString()} total · page {page.current_page} of {page.last_page}</span>
      <div className="flex gap-2">
        <Button size="sm" disabled={page.current_page <= 1} onClick={() => onPage(page.current_page - 1)}>Previous</Button>
        <Button size="sm" disabled={page.current_page >= page.last_page} onClick={() => onPage(page.current_page + 1)}>Next</Button>
      </div>
    </div>
  );
}

/* ---------- Form fields ---------- */
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label block mb-1.5">{label}</span>
      {children}
      {hint && <span className="text-quiet text-[12px] mt-1 block">{hint}</span>}
    </label>
  );
}

export function Select({ value, onChange, options, placeholder, className }: {
  value: string | number | undefined;
  onChange: (v: string) => void;
  options: { value: string | number; label: string }[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <select className={clsx('input pr-8', className)} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div className="inline-flex flex-wrap gap-1 p-1 bg-surface border rounded-full">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={clsx('px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all', value === t.id ? 'bg-brand text-white shadow-glow' : 'text-muted hover:text-ink')}>
          {t.label}{t.count !== undefined && <span className="opacity-70 ml-1.5">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/70 backdrop-blur-sm" onMouseDown={onClose}>
      <div className={clsx('bg-surface border rounded-[28px] w-full max-h-[90vh] flex flex-col', wide ? 'max-w-3xl' : 'max-w-md')} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h3 className="text-[18px] font-semibold">{title}</h3>
          <button onClick={onClose} className="text-quiet hover:text-ink"><X size={18} /></button>
        </div>
        <div className="px-6 py-2 overflow-y-auto space-y-4">{children}</div>
        {footer && <div className="px-6 py-4 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Toasts ---------- */
type Toast = { id: number; msg: string; tone: 'ok' | 'danger' };
const ToastCtx = createContext<(msg: string, tone?: Toast['tone']) => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((msg: string, tone: Toast['tone'] = 'ok') => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, msg, tone }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-5 right-5 z-[60] space-y-2">
        {items.map((t) => (
          <div key={t.id} className={clsx('px-4 py-3 rounded-2xl border text-[14px] font-medium bg-elevated shadow-xl', t.tone === 'ok' ? 'border-ok/40 text-ok' : 'border-danger/40 text-danger')}>{t.msg}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- Confirm-with-optional-input dialog ---------- */
export function ActionDialog({ open, onClose, title, description, confirmLabel, danger, onConfirm, fields }: {
  open: boolean; onClose: () => void; title: string; description?: string; confirmLabel: string; danger?: boolean;
  onConfirm: (v: { reason: string; days: string }) => Promise<unknown> | void;
  fields?: { reason?: boolean; days?: { label: string; def: string } };
}) {
  const [reason, setReason] = useState('');
  const [days, setDays] = useState(fields?.days?.def ?? '');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setReason(''); setDays(fields?.days?.def ?? ''); } }, [open]); // eslint-disable-line
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} loading={busy}
          onClick={async () => { setBusy(true); try { await onConfirm({ reason, days }); onClose(); } finally { setBusy(false); } }}>{confirmLabel}</Button>
      </>}>
      {description && <p className="text-muted text-[14px]">{description}</p>}
      {fields?.days && <Field label={fields.days.label}><input className="input" type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} /></Field>}
      {fields?.reason && <Field label="Reason (optional)"><textarea className="input min-h-[80px]" value={reason} onChange={(e) => setReason(e.target.value)} /></Field>}
    </Modal>
  );
}

/* ---------- Debounced input ---------- */
export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [local, setLocal] = useState(value);
  useEffect(() => { const t = setTimeout(() => onChange(local), 350); return () => clearTimeout(t); }, [local]); // eslint-disable-line
  return <input className="input !w-64" placeholder={placeholder ?? 'Search…'} value={local} onChange={(e) => setLocal(e.target.value)} />;
}
