import { Link } from 'react-router-dom';

export default function FailureScreen({ message, onRetry }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="bg-white p-8 max-w-md w-full text-center">
        <h2 className="text-xl font-light mb-2 text-red-600">Login Failed</h2>
        <p className="mb-4 text-zinc-600">{message || 'Invalid credentials or account not found.'}</p>
        <button
          className="mt-4 px-4 py-2 bg-sky-600 text-[12px] font-light text-white rounded"
          onClick={onRetry}
        >Try Again</button>
        <Link to="/auth/forgot-password" className="block mt-4 text-sky-600 underline">Forgot password?</Link>
      </div>
    </div>
  );
}
