// src/pages/auth/CustomerRegister.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import BackButton from './BackButton';
import { useAuth } from '@/lib/auth';


export default function CustomerRegister(){
const { signUp } = useAuth();
const [form, setForm] = useState({ name:'', email:'', phone:'', password:'' });
const [busy, setBusy] = useState(false);
const navigate = useNavigate();


const submit = async (e)=>{
e.preventDefault();
setBusy(true);
try{
await signUp({ email: form.email, password: form.password, displayName: form.name, role: 'customer' });
// Optional: store phone under users doc can be added later
navigate('/');
}catch(err){
alert(err.message);
}finally{ setBusy(false); }
}


return (
  <AuthLayout>
    <BackButton to="/auth/landing" className="w-[78px] h-[27px] font-poppins font-extralight tracking-tight text-[16px]" />
    <div className="font-poppins text-[42px] md:text-[54px] lg:text-[64px] font-thin tracking-tight leading-[109%]">I'm a<br/>Customer</div>
    <form onSubmit={submit} className="mt-8 w-full max-w-md md:max-w-xl lg:max-w-2xl mx-auto font-poppins">
      <input className="w-full mb-4 px-4 py-2 border-b border-zinc-300 bg-transparent font-thin text-[14px] md:text-[16px] lg:text-[18px] font-poppins placeholder:text-left focus:outline-none focus:border-[#36A5FF]" placeholder="Full Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
      <input type="email" className="w-full mb-4 px-4 py-2 border-b border-zinc-300 bg-transparent font-thin text-[14px] md:text-[16px] lg:text-[18px] font-poppins placeholder:text-left focus:outline-none focus:border-[#36A5FF]" placeholder="Email Address" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
      <input className="w-full mb-4 px-4 py-2 border-b border-zinc-300 bg-transparent font-thin text-[14px] md:text-[16px] lg:text-[18px] font-poppins placeholder:text-left focus:outline-none focus:border-[#36A5FF]" placeholder="Phone Number" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} />
      <input type="password" className="w-full mb-4 px-4 py-2 border-b border-zinc-300 bg-transparent font-thin text-[14px] md:text-[16px] lg:text-[18px] font-poppins placeholder:text-left focus:outline-none focus:border-[#36A5FF]" placeholder="Choose a password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
      <div className="flex justify-center w-full">
        <button disabled={busy} className="w-full md:w-[359px] h-[47px] rounded-full border font-poppins text-[14px] md:text-[16px] lg:text-[18px] font-light border-[#36A5FF] text-[#36A5FF] bg-white mt-4 flex items-center justify-center">{busy?'Registering…':'Register'}</button>
      </div>
    </form>
    <div className="mt-6 text-center text-zinc-500 text-[14px] md:text-[16px] font-light">Already have an account? <Link to="/auth/customer/signin" className="text-sky-600 font-medium">Sign In</Link></div>
  </AuthLayout>
);
}