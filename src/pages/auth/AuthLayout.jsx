// src/pages/auth/AuthLayout.jsx
import React from 'react';


export default function AuthLayout({ children }) {
return (
<div className="min-h-screen bg-white">
<div className="max-w-md mx-auto px-6 pt-14 pb-10">
{/* Logo */}
<div className="flex flex-col items-center mb-8">
<div className="h-16 w-16 rounded-xl bg-zinc-900 text-white grid place-items-center text-3xl font-bold">PD</div>
<div className="mt-3 text-zinc-600">Prescription Drives</div>
</div>
{children}
</div>
</div>
);
}