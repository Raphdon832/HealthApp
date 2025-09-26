// src/pages/auth/PharmacySignIn.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import BackButton from './BackButton';
import { useAuth } from '@/lib/auth';
import FailureScreen from './FailureScreen';
import { Eye, EyeOff } from 'lucide-react';


export default function PharmacySignIn(){
const { signIn } = useAuth();
const [form, setForm] = useState({ email:'', password:'' });
const [busy, setBusy] = useState(false);
const [error, setError] = useState(null);
const [showPassword, setShowPassword] = useState(false);
const navigate = useNavigate();


const submit = async (e)=>{
e.preventDefault();
setBusy(true);
setError(null);
try{
await signIn(form.email, form.password);
navigate('/');
}catch(err){
setError(err.message || 'Login failed.');
}
finally{ setBusy(false); }
}


if (error) return <FailureScreen message={error} onRetry={()=>setError(null)} />;


return (
<AuthLayout>
<BackButton to="/auth/landing" className="w-[78px] h-[27px] font-poppins font-extralight tracking-tight text-[14px] sm:text-[16px]" />
<div className="font-poppins text-[32px] sm:text-[42px] md:text-[54px] lg:text-[64px] font-thin tracking-tight leading-[109%] text-left">I'm a<br/>Pharmacy</div>
<form onSubmit={submit} className="mt-8 w-full max-w-md md:max-w-xl lg:max-w-2xl mx-auto font-poppins">
<input type="email" className="w-full mb-4 px-4 py-2 border-b border-zinc-300 dark:border-gray-600 bg-transparent font-thin text-[13px] sm:text-[14px] md:text-[16px] lg:text-[18px] font-poppins placeholder:text-left focus:outline-none focus:border-[#36A5FF]" placeholder="Email Address" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />

<div className="relative mb-4">
  <input
    type={showPassword ? 'text' : 'password'}
    className="w-full px-4 py-2 border-b border-zinc-300 dark:border-gray-600 bg-transparent font-thin text-[13px] sm:text-[14px] md:text-[16px] lg:text-[18px] font-poppins placeholder:text-left focus:outline-none focus:border-[#36A5FF]"
    placeholder="Password"
    value={form.password}
    onChange={e=>setForm({...form,password:e.target.value})}
    aria-label="Password"
  />
  <button type="button" onClick={()=>setShowPassword(s=>!s)} aria-pressed={showPassword} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-zinc-500">
    {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
  </button>
</div>

<div className="flex justify-center w-full">
<button disabled={busy} className="w-full sm:w-[359px] h-[47px] rounded-full border font-poppins text-[14px] sm:text-[16px] lg:text-[18px] font-light border-[#36A5FF] text-[#36A5FF] bg-white mt-4 flex items-center justify-center">{busy?'Signing in…':'Sign In'}</button>
</div>
</form>
<div className="mt-6 text-center text-zinc-500 text-[13px] sm:text-[14px] md:text-[16px] font-light">
  <Link to="/auth/forgot-password" className="text-sky-600 font-medium">Forgot password?</Link>
</div>
<div className="mt-2 text-center text-zinc-500 text-[13px] sm:text-[14px] md:text-[16px] font-light">Don’t have an account? <Link to="/auth/pharmacy/register" className="text-sky-600 font-medium">Register</Link></div>
</AuthLayout>
);
}