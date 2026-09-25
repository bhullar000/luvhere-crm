export const fmtNum = (n: number | null | undefined) => (n ?? 0).toLocaleString('en-IN');

export function fmtDate(iso?: string | null, withTime = false) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export function timeAgo(iso?: string | null) {
  if (!iso) return 'never';
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return fmtDate(iso);
}

export const titleCase = (s?: string | null) =>
  (s ?? '—').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
