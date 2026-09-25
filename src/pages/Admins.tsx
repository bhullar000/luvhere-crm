import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Badge, Button, ErrorBox, Field, Modal, PageHeader, Spinner, Table, useToast } from '../components/ui';
import { del, get, post, put } from '../lib/api';
import { useAuth } from '../lib/auth';
import { fmtDate, titleCase } from '../lib/format';

const ROLE_HELP: Record<string, string> = {
  super_admin: 'Everything, including staff and audit log',
  admin: 'Moderation, reference data, app config, broadcasts',
  moderator: 'Users, photos, reports, verification, blocks',
  support: 'Read-only + message individual users',
};

export default function Admins() {
  const qc = useQueryClient();
  const toast = useToast();
  const { admin: me } = useAuth();
  const [edit, setEdit] = useState<any>(null);
  const { data, isLoading, error } = useQuery({ queryKey: ['admins'], queryFn: () => get('/admins') });
  const save = useMutation({
    mutationFn: () => {
      const { id, ...body } = edit;
      if (!body.password) delete body.password;
      return id ? put(`/admins/${id}`, body) : post('/admins', body);
    },
    onSuccess: () => { toast('Saved'); setEdit(null); qc.invalidateQueries({ queryKey: ['admins'] }); },
    onError: (e: Error) => toast(e.message, 'danger'),
  });
  const remove = useMutation({
    mutationFn: (id: number) => del(`/admins/${id}`),
    onSuccess: () => { toast('Removed'); qc.invalidateQueries({ queryKey: ['admins'] }); },
    onError: (e: Error) => toast(e.message, 'danger'),
  });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorBox error={error} />;

  return (
    <>
      <PageHeader title="Admins" subtitle="Who can sign in to this CRM" actions={<Button variant="primary" onClick={() => setEdit({ name: '', email: '', password: '', role: 'moderator', is_active: true })}><Plus size={15} /> Add admin</Button>} />
      <Table head={['Name', 'Email', 'Role', 'Status', 'Last sign-in', '']}>
        {data.data.map((a: any) => (
          <tr key={a.id}>
            <td className="td font-medium">{a.name} {a.id === me!.id && <span className="text-quiet text-[12px]">(you)</span>}</td>
            <td className="td text-soft">{a.email}</td>
            <td className="td"><Badge tone={a.role === 'super_admin' ? 'pink' : 'violet'}>{titleCase(a.role)}</Badge></td>
            <td className="td"><Badge tone={a.is_active ? 'ok' : 'danger'}>{a.is_active ? 'Active' : 'Disabled'}</Badge></td>
            <td className="td text-quiet">{fmtDate(a.last_login_at, true)}</td>
            <td className="td text-right whitespace-nowrap">
              <Button size="sm" variant="ghost" onClick={() => setEdit({ ...a, password: '' })}>Edit</Button>
              {a.id !== me!.id && <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Remove ${a.name}?`)) remove.mutate(a.id); }}><span className="text-danger">Remove</span></Button>}
            </td>
          </tr>
        ))}
      </Table>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit admin' : 'New admin'}
        footer={<><Button variant="ghost" onClick={() => setEdit(null)}>Cancel</Button><Button variant="primary" loading={save.isPending} onClick={() => save.mutate()}>Save</Button></>}>
        {edit && <>
          <Field label="Name"><input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
          {!edit.id && <Field label="Email"><input className="input" type="email" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></Field>}
          <Field label={edit.id ? 'New password (leave blank to keep)' : 'Password'}><input className="input" type="password" value={edit.password} onChange={(e) => setEdit({ ...edit, password: e.target.value })} /></Field>
          {edit.id !== me!.id && <>
            <Field label="Role" hint={ROLE_HELP[edit.role]}>
              <select className="input" value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value })}>{Object.keys(ROLE_HELP).map((r) => <option key={r} value={r}>{titleCase(r)}</option>)}</select>
            </Field>
            {edit.id && <label className="flex items-center gap-3 text-[14px]"><input type="checkbox" className="w-4 h-4 accent-[#FF3F8E]" checked={edit.is_active} onChange={(e) => setEdit({ ...edit, is_active: e.target.checked })} /> Account active</label>}
          </>}
        </>}
      </Modal>
    </>
  );
}
