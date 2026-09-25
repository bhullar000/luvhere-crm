import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Badge, Empty, ErrorBox, PageHeader, Pagination, SearchInput, Spinner, Table } from '../components/ui';
import { get, type Page } from '../lib/api';
import { fmtDate } from '../lib/format';

export default function Audit() {
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useQuery({ queryKey: ['audit', action, page], queryFn: () => get<Page<any>>('/audit', { action, page }) });

  return (
    <>
      <PageHeader title="Audit log" subtitle="Every staff action, newest first" actions={<SearchInput value={action} onChange={(v) => { setAction(v); setPage(1); }} placeholder="Filter by action, e.g. user.ban" />} />
      {isLoading ? <Spinner /> : error ? <ErrorBox error={error} /> : !data!.data.length ? <Empty title="No activity" /> : (
        <>
          <Table head={['When', 'Staff', 'Action', 'Subject', 'Details', 'IP']}>
            {data!.data.map((l) => (
              <tr key={l.id}>
                <td className="td text-quiet whitespace-nowrap">{fmtDate(l.created_at, true)}</td>
                <td className="td text-soft">{l.admin ?? 'system'}</td>
                <td className="td"><Badge tone="violet">{l.action}</Badge></td>
                <td className="td text-quiet">{l.subject_type ? `${l.subject_type}${l.subject_id ? ` #${l.subject_id}` : ''}` : '—'}</td>
                <td className="td text-quiet text-[12px] max-w-[300px] truncate">{l.meta ? JSON.stringify(l.meta) : ''}</td>
                <td className="td text-quiet text-[12px]">{l.ip}</td>
              </tr>
            ))}
          </Table>
          <Pagination page={data} onPage={setPage} />
        </>
      )}
    </>
  );
}
