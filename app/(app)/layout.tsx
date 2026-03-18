'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { GiCrossedSwords } from 'react-icons/gi';
import { FiLogOut } from 'react-icons/fi';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="login-bg flex items-center justify-center min-h-dvh">
        <div className="text-center">
          <GiCrossedSwords
            size={42}
            style={{ color: 'var(--gold)', margin: '0 auto 14px', animation: 'spin-slow 3s linear infinite' }}
          />
          <p className="font-bc font-black text-base tracking-widest" style={{ color: 'var(--muted)' }}>
            LOADING QUEST...
          </p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const playerColor = session.user.color;

  return (
    <div className="app-shell">

      {/* ─── Header ─────────────────────────────────────────────────── */}
      <header className="app-header">

        {/* Shine line tinted with player color */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${playerColor}28, rgba(255,215,0,0.12), ${playerColor}28, transparent)`,
          }}
        />

        {/* Logo */}
        <div className="flex items-center gap-1.5">
          <GiCrossedSwords size={16} style={{ color: 'var(--gold)' }} />
          <span className="font-bc font-black text-xl tracking-wider">
            <span style={{ color: 'var(--text)' }}>QUEST</span>
            <span
              style={{
                background: 'linear-gradient(135deg, #FF6B35, #FFD700)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              MATES
            </span>
          </span>
        </div>

        {/* Right: player identity + logout */}
        <div className="flex items-center gap-2">

          {/* Player badge */}
          <div
            className="player-header-badge"
            style={{
              background: `${playerColor}12`,
              border: `1px solid ${playerColor}28`,
            }}
          >
            <span style={{ fontSize: 15, lineHeight: 1 }}>{session.user.emoji}</span>
            <span
              className="font-bc font-black text-sm tracking-wide"
              style={{ color: playerColor }}
            >
              {session.user.name.toUpperCase()}
            </span>
          </div>

          {/* Logout button */}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="logout-btn"
            aria-label="Sign out"
          >
            <FiLogOut size={14} />
          </button>

        </div>
      </header>

      {/* Page content */}
      <main className="screen-scroll">{children}</main>

      {/* Bottom nav */}
      <Navigation />

    </div>
  );
}
