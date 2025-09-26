// src/pages/auth/PharmacySignIn.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import BackButton from './BackButton';
import { useAuth } from '@/lib/auth';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

const getUserFriendlyErrorMessage = (error) => {
  const errorCode = error.code || error.message;
  
  if (errorCode.includes('auth/invalid-credential') || errorCode.includes('auth/wrong-password') || errorCode.includes('auth/user-not-found')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (errorCode.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (errorCode.includes('auth/too-many-requests')) {
    return 'Too many failed attempts. Please try again later.';
  }
  if (errorCode.includes('auth/network-request-failed')) {
    return 'Network error. Please check your connection and try again.';
  }
  
  // Default fallback
  return 'Sign in failed. Please try again.';
};

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
setError(getUserFriendlyErrorMessage(err));
}
finally{ setBusy(false); }
}


return (
<AuthLayout>
<BackButton to="/auth/landing" className="w-[78px] h-[27px] font-poppins font-extralight tracking-tight text-[14px] sm:text-[16px]" />
<div className="font-poppins text-[32px] sm:text-[42px] md:text-[54px] lg:text-[64px] font-thin tracking-tight leading-[109%] text-left text-black dark:text-white">I'm a<br/>Pharmacy</div>

{error && (
  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
    <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0" />
    <span className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</span>
    <button
      onClick={() => setError(null)}
      className="ml-auto text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-300"
      aria-label="Dismiss error"
    >
      ×
    </button>
  </div>
)}

<form onSubmit={submit} className="mt-8 w-full max-w-md md:max-w-xl lg:max-w-2xl mx-auto font-poppins">
<input type="email" className="w-full mb-4 px-4 py-2 border-b border-zinc-300 dark:border-gray-600 bg-transparent font-thin text-[13px] sm:text-[14px] md:text-[16px] lg:text-[18px] font-poppins placeholder:text-left text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:border-[#36A5FF]" placeholder="Email Address" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />

<div className="relative mb-4">
  <input
    type={showPassword ? 'text' : 'password'}
    className="w-full px-4 py-2 border-b border-zinc-300 dark:border-gray-600 bg-transparent font-thin text-[13px] sm:text-[14px] md:text-[16px] lg:text-[18px] font-poppins placeholder:text-left text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:border-[#36A5FF]"
    placeholder="Password"
    value={form.password}
    onChange={e=>setForm({...form,password:e.target.value})}
    aria-label="Password"
  />
  <button type="button" onClick={()=>setShowPassword(s=>!s)} aria-pressed={showPassword} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-zinc-500 dark:text-zinc-400">
    {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
  </button>
</div>

<div className="flex justify-center w-full">
<button disabled={busy} className="w-full sm:w-[359px] h-[47px] rounded-full border font-poppins text-[14px] sm:text-[16px] lg:text-[18px] font-light border-[#36A5FF] text-[#36A5FF] bg-white dark:bg-gray-800 mt-4 flex items-center justify-center">{busy?'Signing in…':'Sign In'}</button>
</div>
</form>
<div className="mt-6 text-center text-zinc-500 dark:text-zinc-400 text-[13px] sm:text-[14px] md:text-[16px] font-light">
  <Link to="/auth/forgot-password" className="text-sky-600 dark:text-sky-400 font-medium">Forgot password?</Link>
</div>
<div className="mt-2 text-center text-zinc-500 dark:text-zinc-400 text-[13px] sm:text-[14px] md:text-[16px] font-light">Don’t have an account? <Link to="/auth/pharmacy/register" className="text-sky-600 dark:text-sky-400 font-medium">Register</Link></div>
</AuthLayout>
);
}