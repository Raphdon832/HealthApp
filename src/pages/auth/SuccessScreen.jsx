import { Link } from 'react-router-dom';

export default function SuccessScreen({ email }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="bg-white p-8 max-w-md w-full text-center">
        <h2 className="text-xl font-thin mb-2">Registration<br/>Successful!</h2>
        <p className="mb-4 text-zinc-600 text-[13px]">A verification link has been sent to <b>{email}</b>.<br />Please check your inbox and verify your email to continue.</p>
        <Link to="/auth/customer/signin" className="mt-4 inline-block px-4 py-2 bg-sky-600 text-white rounded-full">Go to Sign In</Link>
      </div>
    </div>
  );
}
