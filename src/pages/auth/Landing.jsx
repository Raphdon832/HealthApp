// src/pages/auth/Landing.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';


export default function Landing() {
const [role, setRole] = useState('customer');
const navigate = useNavigate();


return (
  <AuthLayout>
    <div className="font-poppins text-[32px] sm:text-[38px] md:text-[42px] lg:text-[54px] font-thin tracking-tight leading-[109%] text-left">HealthCare at<br/>Your Doorstep</div>
    <p className="mt-4 text-black text-[13px] sm:text-[14px] md:text-[16px] tracking-tight font-thin leading-[154%] font-poppins text-left">Pick up and deliver medical prescribed medications and, over-the-counter items from pharmacies to your doorstep.</p>
    <div className="mt-8 flex flex-row gap-4 w-full max-w-[350px] mx-0">
      <button onClick={()=>setRole('customer')} className={`relative rounded-3xl p-0 text-left border-[1] font-poppins bg-[#F7F7F7] w-[169px] h-[169px] border-[1px] ${role==='customer'?'border-[#36A5FF] border-[1.5px] ring-2 ring-[#36A5FF]':'border-[#36A5FF]'}`}>
        <div className="absolute left-[9px] top-[67px] text-[20px] sm:text-[25px] font-light tracking-tight leading-[109%] font-poppins">I’m a<br/>customer</div>
        <div className="absolute left-[9px] top-[127px] text-black text-[12px] sm:text-[13px] font-extralight tracking-tight leading-[109%] font-poppins">Sign Up or Login as a customer</div>
      </button>
      <button onClick={()=>setRole('pharmacy')} className={`relative rounded-3xl p-0 text-left border-[2] font-poppins bg-[#F7F7F7] w-[169px] h-[169px] border-[1px] ${role==='pharmacy'?'border-[#36A5FF] border-[1.5px] ring-2 ring-[#36A5FF]':'border-[#36A5FF]'}`}>
        <div className="absolute left-[9px] top-[67px] text-[20px] sm:text-[25px] font-light tracking-tight leading-[109%] font-poppins">I’m a<br/>pharmacy</div>
        <div className="absolute left-[9px] top-[127px] text-black text-[12px] sm:text-[13px] font-extralight tracking-tight leading-[109%] font-poppins">Sign Up or Login as a pharmacy</div>
      </button>
    </div>
    <div className="flex justify-start w-full max-w-[350px] mx-0">
      <button
        onClick={()=> navigate(role==='customer'? '/auth/customer/signin' : '/auth/pharmacy/signin')}
        disabled={!role}
        className={`mt-8 w-full h-[47px] rounded-full border font-poppins text-[14px] sm:text-[16px] font-light ${!role ? 'border-zinc-300 text-zinc-400 cursor-not-allowed bg-white' : 'border-[#36A5FF] text-[#36A5FF] cursor-pointer bg-white'} flex items-center justify-center`}
      >
        Continue
      </button>
    </div>
  </AuthLayout>
);
}