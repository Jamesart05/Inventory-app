'use client';

import { useAuth } from '@/lib/auth-context';
import ThemeToggle from './ThemeToggle';

export default function TopBar({ title }: { title: string }) {
  const { user, logout } = useAuth();

  return (
    <header className="top-bar">
      <h1>{title}</h1>
      <div className="row" style={{ gap: 8 }}>
        <ThemeToggle />
        {user && (
          <button className="btn btn-secondary btn-sm" onClick={logout}>
            Log out
          </button>
        )}
      </div>
    </header>
  );
}