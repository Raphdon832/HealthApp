import { useState } from 'react';
import { sendReset } from '@/lib/email';
import ForgotPasswordIllustration from '@/icons/illustrations/ForgotPasswordIllustration.png'; // <-- adjust name if different

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await sendReset(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-md text-center bg-white rounded-2xl  p-8">
        {/* Illustration above heading */}
        <img
          src={ForgotPasswordIllustration}
          alt="Forgot Password"
          className="mx-auto mb-4 w-28 h-28 object-contain"
        />

        <h2 className="text-xl font-light mb-4">Forgot Password?</h2>

        {sent ? (
          <p className="text-green-600 font-thin text-[14px]">
            A password reset link has been sent to your email.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <input
              type="email"
              className="w-full border-b border-zinc-300 text-[12px] mt-2 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-sky-600 text-white text-[13px] font-light py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="inline-block h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}