import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button, Empty, ErrorBox, Field, Modal, PageHeader, Pagination, SearchInput, Spinner, Table, Tabs, useToast } from '../components/ui';
import { del, get, post, put, type Page } from '../lib/api';
import { useAuth } from '../lib/auth';

type FieldDef = { key: string; label: string; type?: 'text' | 'number'; max?: number };
const TYPES: Record<string, { label: string; fields: FieldDef[]; cols: string[] }> = {
  interests: { label: 'Interests', cols: ['emoji', 'name', 'slug', 'category'], fields: [{ key: 'name', label: 'Name' }, { key: 'slug', label: 'Slug (unique)' }, { key: 'emoji', label: 'Emoji' }, { key: 'category', label: 'Category' }] },
  cities: { label: 'Cities', cols: ['name', 'state', 'country_code'], fields: [{ key: 'name', label: 'Name' }, { key: 'state', label: 'State' }, { key: 'country_code', label: 'Country code (2 letters)', max: 2 }, { key: 'latitude', label: 'Latitude', type: 'number' }, { key: 'longitude', label: 'Longitude', type: 'number' }] },
  languages: { label: 'Languages', cols: ['name', 'code'], fields: [{ key: 'name', label: 'Name' }, { key: 'code', label: 'Code (unique)' }] },
  lifestyle: { label: 'Lifestyle options', cols: ['group', 'label', 'value'], fields: [{ key: 'group', label: 'Group (e.g. drinking)' }, { key: 'value', label: 'Value (e.g. socially)' }, { key: 'label', label: 'Label shown in app' }] },
};

export default function Reference() {
  const [type, setType] = useState('interests');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [edit, setEdit] = useState<{ id?: number; form: Record<string, any> } | null>(null);
  const qc = useQueryClient();
  const toast = useToast();
  const { can } = useAuth();
  const canEdit = can('admin');
  const def = TYPES[type];

  const { data, isLoading, error } = useQuery({ queryKey: ['ref', type, search, page], queryFn: () => get<Page<any>>(`/reference/${type}`, { search, page }) });
  const save = useMutation({
    mutationFn: () => (edit!.id ? put(`/reference/${type}/${edit!.id}`, edit!.form) : post(`/reference/${type}`, edit!.form)),
    onSuccess: () => { toast('Saved — live in the app on next launch'); setEdit(null); qc.invalidateQueries({ queryKey: ['ref', type] }); },
    onError: (e: Error) => toast(e.message, 'danger'),
  });
  const remove = useMutation({
    mutationFn: (id: number) => del(`/reference/${type}/${id}`),
    onSuccess: () => { toast('Deleted'); qc.invalidateQueries({ queryKey: ['ref', type] }); },
  });

  return (
    <>
      <PageHeader title="Reference data" subtitle="The options users pick from in onboarding, profile and filters"
        actions={<>
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
          {canEdit && <Button variant="primary" onClick={() => setEdit({ form: type === 'cities' ? { country_code: 'IN' } : {} })}><Plus size={15} /> Add</Button>}
        </>} />
      <div className="mb-5"><Tabs value={type} onChange={(t) => { setType(t); setPage(1); setSearch(''); }} tabs={Object.entries(TYPES).map(([id, t]) => ({ id, label: t.label }))} /></div>

      {isLoading ? <Spinner /> : error ? <ErrorBox error={error} /> : !data!.data.length ? <Empty title="Nothing yet" /> : (
        <>
          <Table head={[...def.cols.map((c) => c.replace('_', ' ')), 'Used by', '']}>
            {data!.data.map((r) => (
              <tr key={r.id} className="hover:bg-white/[0.03]">
                {def.cols.map((c) => <td key={c} className="td text-soft">{r[c] ?? '—'}</td>)}
                <td className="td text-quiet">{r.users} users</td>
                <td className="td text-right whitespace-nowrap">{canEdit && <>
                  <Button size="sm" variant="ghost" onClick={() => setEdit({ id: r.id, form: r })}><Pencil size={14} /></Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete "${r.name ?? r.label}"? ${r.users ? `It will be removed from ${r.users} user profiles.` : ''}`)) remove.mutate(r.id); }}><Trash2 size={14} className="text-danger" /></Button></>}</td>
              </tr>
            ))}
          </Table>
          <Pagination page={data} onPage={setPage} />
        </>
      )}

      <Modal open={!!edit} onClose={() => setEdit(null)} title={`${edit?.id ? 'Edit' : 'Add'} ${def.label.toLowerCase().replace(/s$/, '')}`}
        footer={<><Button variant="ghost" onClick={() => setEdit(null)}>Cancel</Button><Button variant="primary" loading={save.isPending} onClick={() => save.mutate()}>Save</Button></>}>
        {edit && def.fields.map((f) => (
          <Field key={f.key} label={f.label}>
            <input className="input" type={f.type ?? 'text'} step="any" maxLength={f.max} value={edit.form[f.key] ?? ''} onChange={(e) => setEdit({ ...edit, form: { ...edit.form, [f.key]: f.type === 'number' && e.target.value !== '' ? Number(e.target.value) : e.target.value } })} />
          </Field>
        ))}
      </Modal>
    </>
  );
}
