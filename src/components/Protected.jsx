// src/components/Protected.jsx
import React from 'react';
import { useAuth } from '@/lib/auth';

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6">Loading…</div>;
  if (!user) return <div className="p-6">Please sign in to continue.</div>;
  return children;
}

export function RequireRole({ children, role }) {
  const { profile, loading } = useAuth();
  if (loading) return <div className="p-6">Loading…</div>;
  if (!profile || profile.role !== role) return <div className="p-6">You need {role} access.</div>;
  return children;
}
