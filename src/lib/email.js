// Utility for sending email verification and password reset
import { sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebase';

export async function sendVerification(user) {
  if (user) {
    await sendEmailVerification(user);
  }
}

export async function sendReset(email) {
  await sendPasswordResetEmail(auth, email);
}
