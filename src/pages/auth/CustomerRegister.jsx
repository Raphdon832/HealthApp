// src/pages/auth/CustomerRegister.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import BackButton from './BackButton';
import { useAuth } from '@/lib/auth';
import SuccessScreen from './SuccessScreen';
import { Eye, EyeOff } from 'lucide-react';
import GoogleButton from '@/components/GoogleButton';
import { useUserLocation } from '@/hooks/useUserLocation';
import { checkGoogleAuthConfig } from '@/lib/googleAuthDebug';


export default function CustomerRegister(){
const { signUp, signUpWithGoogle } = useAuth();
const { userCoords, location, locationError } = useUserLocation();
const [form, setForm] = useState({ name:'', email:'', phone:'', password:'', address: '' });
const [busy, setBusy] = useState(false);
const [googleLoading, setGoogleLoading] = useState(false);
const [success, setSuccess] = useState(null);
const [addressSuggestions, setAddressSuggestions] = useState([]);
const [selectedAddress, setSelectedAddress] = useState(null);
const addressTimeout = useRef();
const [showPassword, setShowPassword] = useState(false);
const navigate = useNavigate();

// Debug Google Auth configuration
useEffect(() => {
  checkGoogleAuthConfig();
}, []);


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
if (!form.address) throw new Error('Address is required');
const result = await signUp({ email: form.email, password: form.password, displayName: form.name, role: 'customer', address: form.address, lat: selectedAddress?.lat, lon: selectedAddress?.lon, phone: form.phone });
setSuccess(form.email);
}catch(err){
alert(err.message);
}finally{ setBusy(false); }
}

const handleGoogleRegister = async () => {
setGoogleLoading(true);
try {
  console.log('Starting Google registration process...');
  console.log('User location:', { location, userCoords });
  
  const userLocation = {
    address: location,
    latitude: userCoords?.latitude,
    longitude: userCoords?.longitude
  };
  
  const result = await signUpWithGoogle(userLocation);
  console.log('Google registration result:', result);
  
  if (result.isNewUser) {
    console.log('New user created, showing success screen');
    // New user created successfully
    setSuccess(result.user.email);
  } else if (result.existingCustomer) {
    console.log('Existing customer, navigating to home');
    // Existing customer account - just sign them in
    navigate('/');
  } else {
    console.log('Existing user, navigating to home');
    // Existing user, just navigate
    navigate('/');
  }
} catch (err) {
  console.error('Google registration failed:', err);
  
  // Check if it's a user-friendly error message already
  if (err.message && !err.message.includes('Firebase:')) {
    alert(err.message);
  } else {
    alert('Google registration failed. Please try again or contact support if the issue persists.');
  }
}
finally {
  setGoogleLoading(false);
}
}


if (success) return <SuccessScreen email={success} />;


return (
  <AuthLayout>
    <BackButton to="/auth/landing" className="w-[78px] h-[27px] font-poppins font-extralight tracking-tight text-[14px] sm:text-[16px]" />
    <div className="font-poppins text-[32px] sm:text-[42px] md:text-[54px] lg:text-[64px] font-thin tracking-tight leading-[109%] text-left">I'm a<br/>Customer</div>
    <form onSubmit={submit} className="mt-8 w-full max-w-md md:max-w-xl lg:max-w-2xl mx-auto font-poppins">
      <input className="w-full mb-4 px-4 py-2 border-b border-zinc-300 dark:border-gray-600 bg-transparent font-thin text-[13px] sm:text-[14px] md:text-[16px] lg:text-[18px] font-poppins placeholder:text-left text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:border-[#36A5FF]" placeholder="Full Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
      <input type="email" className="w-full mb-4 px-4 py-2 border-b border-zinc-300 dark:border-gray-600 bg-transparent font-thin text-[13px] sm:text-[14px] md:text-[16px] lg:text-[18px] font-poppins placeholder:text-left text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:border-[#36A5FF]" placeholder="Email Address" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
      <input className="w-full mb-4 px-4 py-2 border-b border-zinc-300 dark:border-gray-600 bg-transparent font-thin text-[13px] sm:text-[14px] md:text-[16px] lg:text-[18px] font-poppins placeholder:text-left text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:border-[#36A5FF]" placeholder="Phone Number" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} />
      <div className="relative mb-4">
        <input
          className="w-full px-4 py-2 border-b border-zinc-300 dark:border-gray-600 bg-transparent font-thin text-[13px] sm:text-[14px] md:text-[16px] lg:text-[18px] font-poppins placeholder:text-left text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:border-[#36A5FF]"
          placeholder="Address (required)"
          value={form.address || ''}
          onChange={handleAddressChange}
          required
          autoComplete="off"
        />
        {addressSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 bg-white dark:bg-gray-800 border border-zinc-200 rounded shadow z-10 max-h-40 overflow-y-auto">
            {addressSuggestions.map(s => (
              <div
                key={s.place_id}
                className="px-4 py-2 hover:bg-sky-50 cursor-pointer text-[13px]"
                onClick={() => handleSelectSuggestion(s)}
              >
                {s.display_name}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="relative mb-4">
        <input type={showPassword ? 'text' : 'password'} className="w-full mb-0 px-4 py-2 border-b border-zinc-300 dark:border-gray-600 bg-transparent font-thin text-[13px] sm:text-[14px] md:text-[16px] lg:text-[18px] font-poppins placeholder:text-left text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:border-[#36A5FF]" placeholder="Choose a password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
        <button type="button" onClick={()=>setShowPassword(s=>!s)} aria-pressed={showPassword} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-zinc-500 dark:text-zinc-400">
          {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
        </button>
      </div>
      <div className="flex justify-center w-full">
        <button disabled={busy} className="w-full sm:w-[359px] h-[47px] rounded-full border font-poppins text-[14px] sm:text-[16px] lg:text-[18px] font-light border-[#36A5FF] text-[#36A5FF] bg-white dark:bg-gray-800 mt-4 flex items-center justify-center">{busy?'Registering…':'Register'}</button>
      </div>
    </form>
    
    <div className="mt-6 flex items-center justify-center">
      <div className="border-t border-gray-300 dark:border-gray-600 flex-1"></div>
      <span className="px-4 text-gray-500 dark:text-gray-400 text-sm">or</span>
      <div className="border-t border-gray-300 dark:border-gray-600 flex-1"></div>
    </div>

    <div className="mt-6 flex justify-center">
      <GoogleButton onClick={handleGoogleRegister} loading={googleLoading}>
        Register with Google
      </GoogleButton>
    </div>
    
    {!locationError && userCoords && (
      <div className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
        Google registration will use your current location as address
      </div>
    )}
    
    {locationError && (
      <div className="mt-3 text-center text-xs text-red-500 dark:text-red-400">
        Location access required for Google registration
      </div>
    )}
    
    <div className="mt-6 text-center text-zinc-500 dark:text-zinc-400 text-[13px] sm:text-[14px] md:text-[16px] font-light">Already have an account? <Link to="/auth/customer/signin" className="text-sky-600 dark:text-sky-400 font-medium">Sign In</Link></div>
  </AuthLayout>
);
}