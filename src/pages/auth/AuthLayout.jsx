// src/pages/auth/AuthLayout.jsx
import React from 'react';
import PharmaseaLogo from '@/icons/PharmaseaLogo.png';


export default function AuthLayout({ children }) {
return (
<div className="min-h-screen bg-white">
<div className="max-w-md mx-auto px-6 pt-14 pb-10">
{/* Logo */}
<div className="flex flex-col items-center mb-10">
  <img src={PharmaseaLogo} alt="Pharmasea" className="w-40 h-15 object-contain" />
  <div className="mt-3 text-zinc-600 text-[13px]"></div>
</div>
{children}
</div>
</div>
);
}