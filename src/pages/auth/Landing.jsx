// src/pages/auth/Landing.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';


export default function Landing() {
const [role, setRole] = useState('customer');
const navigate = useNavigate();


return (
<AuthLayout>
<div className="font-poppins text-[42px] font-thin tracking-tight leading-[109%]">HealthCare at<br/>Your Doorstep</div>
<p className="mt-4 text-zinc-500 text-[14px] tracking-tight font-thin leading-[154%] font-poppins">Pick up and deliver medical prescribed medications and, over-the-counter items from pharmacies to your doorstep.</p>


<div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-md mx-auto">
<button onClick={()=>setRole('customer')} className={`relative rounded-3xl p-0 text-left border-[1] font-poppins bg-[#F7F7F7] w-full h-[180px] sm:h-[160px] border-[1px] ${role==='customer'?'border-[#36A5FF] border-[1.5px] ring-2 ring-[#36A5FF]':'border-[#36A5FF]'}`}>
<div className="absolute left-[9px] top-[67px] text-[25px] font-light tracking-tight leading-[109%] font-poppins">I’m a<br/>customer</div>
<div className="absolute left-[9px] top-[127px] text-zinc-400 text-[13px] font-extralight tracking-tight leading-[109%] font-poppins">Sign Up or Login as a customer</div>
</button>
<button onClick={()=>setRole('pharmacy')} className={`relative rounded-3xl p-0 text-left border-[2] font-poppins bg-[#F7F7F7] w-full h-[180px] sm:h-[160px] border-[1px] ${role==='pharmacy'?'border-[#36A5FF] border-[1.5px] ring-2 ring-[#36A5FF]':'border-[#36A5FF]'}`}>
<div className="absolute left-[9px] top-[67px] text-[25px] font-light tracking-tight leading-[109%] font-poppins">I’m a<br/>pharmacy</div>
<div className="absolute left-[9px] top-[127px] text-zinc-400 text-[13px] font-extralight tracking-tight leading-[109%] font-poppins">Sign Up or Login as a pharmacy</div>
</button>
</div>


<div className="flex justify-center w-full">
  <button
    onClick={()=> navigate(role==='customer'? '/auth/customer/signin' : '/auth/pharmacy/signin')}
    disabled={!role}
    className={`mt-8 w-[359px] h-[47px] rounded-full border font-poppins text-[14px] font-light ${!role ? 'border-zinc-300 text-zinc-400 cursor-not-allowed bg-white' : 'border-[#36A5FF] text-[#36A5FF] cursor-pointer bg-white'} flex items-center justify-center`}
  >
    Continue
  </button>
</div>
</AuthLayout>
);
}