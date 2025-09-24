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
    <BackButton to="/auth/landing" className="w-[78px] h-[27px] font-poppins font-extralight tracking-tight text-[14px] sm:text-[16px] animate-fade-in" style={{animationDelay:'0.1s'}} />
    <div className="font-poppins text-[32px] sm:text-[42px] md:text-[54px] lg:text-[64px] font-thin tracking-tight leading-[109%] text-left animate-text-reveal">I'm a<br/>Pharmacy</div>
    <form onSubmit={submit} className="mt-8 w-full max-w-md md:max-w-xl lg:max-w-2xl mx-auto font-poppins animate-fade-in-up" style={{animationDelay:'0.2s'}}>
      <input className="w-full mb-4 px-4 py-2 border-b border-zinc-300 bg-transparent font-thin text-[13px] sm:text-[14px] md:text-[16px] lg:text-[18px] font-poppins placeholder:text-left focus:outline-none focus:border-[#36A5FF] transition-all duration-200 hover:scale-105 active:scale-95 animate-bounce-in" style={{animationDelay:'0.3s'}} placeholder="Pharmacy Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
      <input type="email" className="w-full mb-4 px-4 py-2 border-b border-zinc-300 bg-transparent font-thin text-[13px] sm:text-[14px] md:text-[16px] lg:text-[18px] font-poppins placeholder:text-left focus:outline-none focus:border-[#36A5FF] transition-all duration-200 hover:scale-105 active:scale-95 animate-bounce-in" style={{animationDelay:'0.35s'}} placeholder="Email Address" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
      <input className="w-full mb-4 px-4 py-2 border-b border-zinc-300 bg-transparent font-thin text-[13px] sm:text-[14px] md:text-[16px] lg:text-[18px] font-poppins placeholder:text-left focus:outline-none focus:border-[#36A5FF] transition-all duration-200 hover:scale-105 active:scale-95 animate-bounce-in" style={{animationDelay:'0.4s'}} placeholder="Phone Number" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} />
      <div className="relative mb-4 animate-fade-in-up" style={{animationDelay:'0.45s'}}>
        <input className="w-full px-4 py-2 border-b border-zinc-300 bg-transparent font-thin text-[13px] sm:text-[14px] md:text-[16px] lg:text-[18px] font-poppins placeholder:text-left focus:outline-none focus:border-[#36A5FF] transition-all duration-200 hover:scale-105 active:scale-95" placeholder="Address" value={form.address} onChange={handleAddressChange} />
        {addressSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto animate-fade-in" style={{animationDelay:'0.5s'}}>
            {addressSuggestions.map((suggestion, idx) => (
              <div 
                key={idx} 
                onClick={() => handleSelectSuggestion(suggestion)}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-[13px] sm:text-[14px] md:text-[16px] font-poppins text-gray-800 transition-colors duration-200 animate-fadeInUp border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center bg-blue-100 flex-shrink-0 animate-bounce-in" style={{animationDelay:`${0.55+idx*0.05}s`}}>
                  <svg className="h-3 w-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900 truncate">
                    {suggestion.display_name}
                  </div>
                </div>
                <div className="text-xs text-blue-600 font-medium flex-shrink-0">
                  Address
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="relative mb-4 animate-fade-in-up" style={{animationDelay:'0.5s'}}>
        <input type={showPassword ? 'text' : 'password'} className="w-full mb-0 px-4 py-2 border-b border-zinc-300 bg-transparent font-thin text-[13px] sm:text-[14px] md:text-[16px] lg:text-[18px] font-poppins placeholder:text-left focus:outline-none focus:border-[#36A5FF] transition-all duration-200 hover:scale-105 active:scale-95" placeholder="Choose a password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
        <button type="button" onClick={()=>setShowPassword(s=>!s)} aria-pressed={showPassword} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-zinc-500 transition-all duration-200 hover:scale-110 active:scale-95">
          {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
        </button>
      </div>
      {/* Error message animation example (replace alert with animated error if needed) */}
      {/* {error && <div className="text-red-500 text-sm mt-2 animate-shake animate-fade-in">{error}</div>} */}
      <div className="flex justify-center w-full">
        <button disabled={busy} className={`w-full sm:w-[359px] h-[47px] rounded-full border font-poppins text-[14px] sm:text-[16px] lg:text-[18px] font-light border-[#36A5FF] text-[#36A5FF] bg-white mt-4 flex items-center justify-center btn-interactive transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm animate-bounce-in ${busy?'opacity-60 cursor-not-allowed':'opacity-100 cursor-pointer'}`} style={{animationDelay:'0.6s'}}>{busy?'Registering…':'Register'}</button>
      </div>
    </form>
    <div className="mt-6 text-center text-zinc-500 text-[13px] sm:text-[14px] md:text-[16px] font-light animate-fade-in" style={{animationDelay:'0.7s'}}>Already have an account? <Link to="/auth/pharmacy/signin" className="text-sky-600 font-medium transition-colors duration-200 hover:text-sky-800">Sign In</Link></div>
  </AuthLayout>
);
}