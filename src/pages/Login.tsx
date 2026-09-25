import { Heart } from 'lucide-react';
import { useState } from 'react';
import { Button, Field } from '../components/ui';
import { useAuth } from '../lib/auth';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <div className="h-full grid place-items-center p-4">
      <form
        className="card !p-8 w-full max-w-sm space-y-5 !rounded-[28px]"
        onSubmit={async (e) => {
          e.preventDefault(); setBusy(true); setError('');
          try { await login(email, password); } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
        }}
      >
        <div className="flex flex-col items-center gap-3 pb-2">
          <div className="w-14 h-14 rounded-2xl bg-brand grid place-items-center shadow-glow"><Heart size={26} fill="white" className="text-white" /></div>
          <div className="text-center">
            <h1 className="text-[24px] font-bold">Luvhere CRM</h1>
            <p className="text-muted text-[14px]">Sign in to the back office</p>
          </div>
        </div>
        <Field label="Email"><input className="input" type="email" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password"><input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        {error && <div className="text-danger text-[13px]">{error}</div>}
        <Button variant="primary" type="submit" loading={busy} className="w-full">Sign in</Button>
      </form>
    </div>
  );
}
