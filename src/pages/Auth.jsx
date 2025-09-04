import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('customer');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'signin') await signIn(email, password);
      else await signUp({ email, password, displayName, role });
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-zinc-200 p-6">
        <div className="text-2xl font-semibold mb-2">{mode==='signin'?'Welcome back':'Create account'}</div>
        <div className="text-zinc-500 mb-4">Pharmasea marketplace</div>

        {mode==='signup' && (
          <Input placeholder="Display name" value={displayName} onChange={(e)=>setDisplayName(e.target.value)} className="mb-3" />
        )}
        <Input type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} className="mb-3" />
        <Input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} className="mb-4" />

        {mode==='signup' && (
          <div className="mb-4">
            <div className="text-sm text-zinc-600 mb-2">Account type</div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={()=>setRole('customer')} className={`rounded-2xl border px-3 py-2 ${role==='customer'?'border-sky-400 text-sky-700':''}`}>Customer</button>
              <button type="button" onClick={()=>setRole('pharmacy')} className={`rounded-2xl border px-3 py-2 ${role==='pharmacy'?'border-sky-400 text-sky-700':''}`}>Pharmacy</button>
            </div>
          </div>
        )}

        <Button disabled={busy} className="w-full">{busy?'Please wait…':(mode==='signin'?'Sign in':'Sign up')}</Button>
        <div className="mt-4 text-sm text-center">
          {mode==='signin'? (
            <>No account? <button type="button" className="text-sky-600" onClick={()=>setMode('signup')}>Create one</button></>
          ): (
            <>Have an account? <button type="button" className="text-sky-600" onClick={()=>setMode('signin')}>Sign in</button></>
          )}
        </div>
      </form>
    </div>
  );
}
