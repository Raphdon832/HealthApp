import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { sendVerification } from '@/lib/email';
import { useNavigate } from 'react-router-dom';

export default function VerifyEmail() {
  const { user, logout } = useAuth();
  const [resent, setResent] = useState(false);
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !user.emailVerified) {
      // Optionally, could auto-send on mount
    }
  }, [user]);

  if (!user) return null;
  if (user.emailVerified) return null;

  const handleResend = async () => {
    setSending(true);
    await sendVerification(user);
    setResent(true);
    setSending(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      // ignore logout errors
    }
    // Go back to previous page if possible, otherwise send to landing
    if (window.history && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/auth/landing');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="bg-white p-8 max-w-md w-full text-center">
        <h2 className="text-xl font-light mb-2">Verify your email</h2>
        <p className="mb-4 text-zinc-600 text-[14px] font-thin">A verification link has been sent to <b>{user.email}</b>.<br />Please check your inbox and click the link to activate your account.</p>
        <button
          className="px-4 py-2 bg-sky-600 text-white rounded-full text-[12px] font-light disabled:opacity-50"
          onClick={handleResend}
          disabled={sending || resent}
        >{resent ? 'Verification Sent!' : sending ? 'Sending...' : 'Resend Email'}</button>
        <button
          className="block mt-4 mx-auto text-sm text-zinc-500 underline"
          onClick={handleLogout}
        >Back</button>
      </div>
    </div>
  );
}
