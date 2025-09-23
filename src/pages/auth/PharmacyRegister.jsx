// src/pages/auth/PharmacyRegister.jsx
import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import BackButton from './BackButton';
import { useAuth } from '@/lib/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import SuccessScreen from './SuccessScreen';
import { Eye, EyeOff } from 'lucide-react';


export default function PharmacyRegister(){
const { signUp } = useAuth();
const [form, setForm] = useState({ name:'', email:'', phone:'', address:'', password:'' });
const [busy, setBusy] = useState(false);
const [addressSuggestions, setAddressSuggestions] = useState([]);
const [selectedAddress, setSelectedAddress] = useState(null);
const [success, setSuccess] = useState(null);
const addressTimeout = useRef();
const [showPassword, setShowPassword] = useState(false);
const navigate = useNavigate();


const fetchAddressSuggestions = async (query) => {
  if (!query) return setAddressSuggestions([]);
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`);
  const data = await res.json();
  setAddressSuggestions(data);
};

const handleAddressChange = (e) => {
  const value = e.target.value;
  setForm({ ...form, address: value });
  setSelectedAddress(null);
  clearTimeout(addressTimeout.current);
  addressTimeout.current = setTimeout(() => fetchAddressSuggestions(value), 400);
};

const handleSelectSuggestion = (s) => {
  setForm({ ...form, address: s.display_name });
  setSelectedAddress(s);
  setAddressSuggestions([]);
};

const submit = async (e)=>{
  e.preventDefault();
  setBusy(true);
  try{
    await signUp({ email: form.email, password: form.password, displayName: form.name, role: 'pharmacy' });
    const uid = auth.currentUser?.uid;
    if (uid) {
      await setDoc(doc(db, 'pharmacies', uid), {
        id: uid,
        name: form.name,
        email: form.email,
        address: form.address,
        lat: selectedAddress?.lat || null,
        lon: selectedAddress?.lon || null,
        etaMins: 25,
        phone: form.phone
      });
    }
    setSuccess(form.email);
  }catch(err){
    alert(err.message);
  }finally{ setBusy(false); }
}

if (success) return <SuccessScreen email={success} />;


return (
  <AuthLayout>
    <BackButton to="/auth/landing" className="w-[78px] h-[27px] font-poppins font-extralight tracking-tight text-[14px] sm:text-[16px]" />
    <div className="font-poppins text-[32px] sm:text-[42px] md:text-[54px] lg:text-[64px] font-thin tracking-tight leading-[109%] text-left">I'm a<br/>Pharmacy</div>
    <form onSubmit={submit} className="mt-8 w-full max-w-md md:max-w-xl lg:max-w-2xl mx-auto font-poppins">
      <input className="w-full mb-4 px-4 py-2 border-b border-zinc-300 bg-transparent font-thin text-[13px] sm:text-[14px] md:text-[16px] lg:text-[18px] font-poppins placeholder:text-left focus:outline-none focus:border-[#36A5FF]" placeholder="Pharmacy Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
      <input type="email" className="w-full mb-4 px-4 py-2 border-b border-zinc-300 bg-transparent font-thin text-[13px] sm:text-[14px] md:text-[16px] lg:text-[18px] font-poppins placeholder:text-left focus:outline-none focus:border-[#36A5FF]" placeholder="Email Address" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
      <input className="w-full mb-4 px-4 py-2 border-b border-zinc-300 bg-transparent font-thin text-[13px] sm:text-[14px] md:text-[16px] lg:text-[18px] font-poppins placeholder:text-left focus:outline-none focus:border-[#36A5FF]" placeholder="Phone Number" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} />
      <div className="relative mb-4">
        <input className="w-full px-4 py-2 border-b border-zinc-300 bg-transparent font-thin text-[13px] sm:text-[14px] md:text-[16px] lg:text-[18px] font-poppins placeholder:text-left focus:outline-none focus:border-[#36A5FF]" placeholder="Address" value={form.address} onChange={handleAddressChange} />
        {addressSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            {addressSuggestions.map((suggestion, idx) => (
              <div 
                key={idx} 
                onClick={() => handleSelectSuggestion(suggestion)}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-[13px] sm:text-[14px] md:text-[16px] font-poppins text-gray-800 dark:text-gray-200"
              >
                {suggestion.display_name}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="relative mb-4">
        <input type={showPassword ? 'text' : 'password'} className="w-full mb-0 px-4 py-2 border-b border-zinc-300 bg-transparent font-thin text-[13px] sm:text-[14px] md:text-[16px] lg:text-[18px] font-poppins placeholder:text-left focus:outline-none focus:border-[#36A5FF]" placeholder="Choose a password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
        <button type="button" onClick={()=>setShowPassword(s=>!s)} aria-pressed={showPassword} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-zinc-500">
          {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
        </button>
      </div>
      <div className="flex justify-center w-full">
        <button disabled={busy} className="w-full sm:w-[359px] h-[47px] rounded-full border font-poppins text-[14px] sm:text-[16px] lg:text-[18px] font-light border-[#36A5FF] text-[#36A5FF] bg-white mt-4 flex items-center justify-center">{busy?'Registering…':'Register'}</button>
      </div>
    </form>
    <div className="mt-6 text-center text-zinc-500 text-[13px] sm:text-[14px] md:text-[16px] font-light">Already have an account? <Link to="/auth/pharmacy/signin" className="text-sky-600 font-medium">Sign In</Link></div>
  </AuthLayout>
);
}