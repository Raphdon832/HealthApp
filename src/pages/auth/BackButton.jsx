// src/pages/auth/BackButton.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';


export default function BackButton({ to }) {
const navigate = useNavigate();
return (
<button
  onClick={() => (to ? navigate(to) : navigate(-1))}
  className="mb-5 w-[70px] h-[20px] font-poppins font-extralight tracking-tight text-[12px] flex items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-zinc-300 dark:border-gray-600 dark:border-gray-600"
>
  ← Back
</button>
);
}