import React from 'react';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  // If the user already has a valid session, redirect them to the dashboard
  // This prevents logged-in users from seeing the login screen if they navigate to /login
  // or use the back button after logging in.
  const session = await getSession();
  if (session) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
