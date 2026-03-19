'use client';

import { useState, useRef, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { GiCrossedSwords, GiTrophy } from 'react-icons/gi';
import { BsLightningChargeFill, BsShieldFill } from 'react-icons/bs';
import { RiVipCrownFill } from 'react-icons/ri';

type Player = 'bhuvi' | 'karthic';

const PLAYERS = {
  bhuvi: {
    name: 'Bhuvi',
    emoji: '🦁',
    color: '#FF6B35',
    color2: '#FF9A6C',
    title: 'The Lion',
    tagline: 'Fierce & Unstoppable',
    stat: '9 Months',
    glow: 'rgba(255,107,53,0.35)',
    bg: 'rgba(255,107,53,0.08)',
  },
  karthic: {
    name: 'Karthic',
    emoji: '🐯',
    color: '#4ECDC4',
    color2: '#80E8E3',
    title: 'The Tiger',
    tagline: 'Sharp & Strategic',
    stat: '12 CPs',
    glow: 'rgba(78,205,196,0.35)',
    bg: 'rgba(78,205,196,0.08)',
  },
};

// Animated star particle
function Star({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <div
      className="absolute w-0.5 h-0.5 rounded-full bg-white"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        opacity: 0.4,
        animation: `float ${2.5 + delay}s ease-in-out infinite ${delay}s`,
      }}
    />
  );
}

const STARS = Array.from({ length: 35 }, (_, i) => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  delay: Math.random() * 3,
}));

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const [selected, setSelected] = useState<Player | null>(null);
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [mounted, setMounted] = useState(false);

  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    setMounted(true);
    if (status === 'authenticated') router.replace('/map');
  }, [status, router]);

  const handleSelect = (player: Player) => {
    setSelected(player);
    setPin(['', '', '', '']);
    setError('');
    setTimeout(() => pinRefs[0].current?.focus(), 350);
  };

  const handlePinChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);
    setError('');
    if (digit && index < 3) pinRefs[index + 1].current?.focus();
    if (digit && index === 3) {
      const full = newPin.join('');
      if (full.length === 4) handleLogin(newPin);
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) pinRefs[index - 1].current?.focus();
  };

  const handleLogin = async (pinArr: string[]) => {
    if (!selected) return;
    const fullPin = pinArr.join('');
    if (fullPin.length < 4) return;
    setLoading(true);
    const result = await signIn('credentials', { username: selected, pin: fullPin, redirect: false });
    setLoading(false);
    if (result?.ok) {
      router.replace('/map');
    } else {
      setShaking(true);
      setPin(['', '', '', '']);
      setError('Wrong PIN. Try again.');
      setTimeout(() => { setShaking(false); pinRefs[0].current?.focus(); }, 500);
    }
  };

  if (!mounted || status === 'loading') {
    return (
      <div className="login-bg flex items-center justify-center">
        <div className="text-center">
          <GiCrossedSwords
            size={48}
            style={{ color: 'var(--bhuvi)', margin: '0 auto 16px', animation: 'spin-slow 4s linear infinite' }}
          />
          <p className="font-bc font-black text-lg tracking-widest" style={{ color: 'var(--muted)' }}>
            ENTERING QUEST...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-bg relative overflow-hidden" style={{ minHeight: '100dvh' }}>

      {/* Star field */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {STARS.map((s, i) => <Star key={i} {...s} />)}
      </div>

      {/* Ambient orbs */}
      <div className="absolute pointer-events-none" style={{
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,107,53,0.08) 0%, transparent 70%)',
        top: '-80px', left: '-80px', animation: 'float 7s ease-in-out infinite',
      }} />
      <div className="absolute pointer-events-none" style={{
        width: 280, height: 280, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(78,205,196,0.08) 0%, transparent 70%)',
        bottom: '-60px', right: '-60px', animation: 'float 7s ease-in-out infinite 3.5s',
      }} />

      <div className="relative z-10 w-full max-w-sm mx-auto px-5 py-6 flex flex-col min-h-dvh">

        {/* Logo hero */}
        <div className="text-center pt-10 pb-8 animate-slide-up">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 relative"
            style={{
              background: 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(78,205,196,0.15))',
              border: '1px solid rgba(255,215,0,0.15)',
              boxShadow: '0 0 30px rgba(255,107,53,0.1), 0 0 30px rgba(78,205,196,0.1)',
            }}
          >
            <GiCrossedSwords size={32} style={{ color: 'var(--gold)' }} />
          </div>

          <h1
            className="font-bc font-black tracking-widest"
            style={{ fontSize: 38, lineHeight: 1 }}
          >
            <span style={{ color: 'var(--text)' }}>QUEST</span>
            <span style={{
              background: 'linear-gradient(135deg, #FF6B35, #FFD700)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              MATES
            </span>
          </h1>
          <p className="text-sm font-medium mt-2" style={{ color: 'var(--muted)' }}>
            9 Months · 12 Checkpoints · 1 Legend
          </p>

          {/* Feature pills */}
          <div className="flex justify-center gap-2 mt-3">
            {[
              { icon: <BsLightningChargeFill size={10} />, label: 'XP System' },
              { icon: <GiTrophy size={10} />, label: 'Checkpoints' },
              { icon: <RiVipCrownFill size={10} />, label: 'Levels' },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border2)',
                  color: 'var(--muted)',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                <span style={{ color: 'var(--gold)' }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* Character Select label */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: 'var(--border2)' }} />
          <span className="font-bc font-black text-xs tracking-widest" style={{ color: 'var(--muted)' }}>
            SELECT CHARACTER
          </span>
          <div className="flex-1 h-px" style={{ background: 'var(--border2)' }} />
        </div>

        {/* Character Cards */}
        <div className="flex gap-3 mb-5" style={{ animationDelay: '0.1s' }}>
          {(Object.entries(PLAYERS) as [Player, typeof PLAYERS.bhuvi][]).map(([key, p]) => (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              className={`char-card ${selected === key ? (key === 'bhuvi' ? 'selected-b' : 'selected-k') : ''}`}
            >
              {/* Shimmer overlay when selected */}
              {selected === key && (
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse at 50% 20%, ${p.color}20 0%, transparent 65%)`,
                  }}
                />
              )}

              {/* Emoji */}
              <div
                className="relative text-5xl mb-3"
                style={{
                  filter: selected === key ? `drop-shadow(0 0 16px ${p.color}) drop-shadow(0 0 30px ${p.color}80)` : 'none',
                  animation: selected === key ? 'avatar-float 2.5s ease-in-out infinite' : 'none',
                  display: 'block',
                }}
              >
                {p.emoji}
              </div>

              {/* Name */}
              <div
                className="font-bc font-black text-xl relative mb-0.5"
                style={{
                  color: selected === key ? p.color : 'var(--text)',
                  textShadow: selected === key ? `0 0 12px ${p.glow}` : 'none',
                }}
              >
                {p.name}
              </div>
              <div className="text-xs relative" style={{ color: 'var(--muted)' }}>
                {p.title}
              </div>
              <div
                className="text-xs mt-1.5 font-semibold relative"
                style={{ color: selected === key ? p.color : 'var(--muted2)', opacity: 0.9 }}
              >
                {p.tagline}
              </div>

              {/* Stat badge */}
              <div
                className="mt-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full relative"
                style={{
                  background: selected === key ? `${p.color}18` : 'var(--bg4)',
                  border: `1px solid ${selected === key ? p.color + '35' : 'var(--border2)'}`,
                  fontSize: 10,
                  fontWeight: 700,
                  color: selected === key ? p.color : 'var(--muted)',
                  fontFamily: "'Chakra Petch', sans-serif",
                }}
              >
                <BsShieldFill size={8} />
                WARRIOR
              </div>

              {/* Check mark */}
              {selected === key && (
                <div
                  className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: p.color, boxShadow: `0 0 8px ${p.glow}` }}
                >
                  <span style={{ fontSize: 10, color: '#08090F', fontWeight: 900 }}>✓</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* VS divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--border3))' }} />
          <div
            className="font-bc font-black text-2xl px-3 py-1 rounded-xl"
            style={{
              color: 'var(--muted)',
              background: 'var(--bg3)',
              border: '1px solid var(--border2)',
              lineHeight: 1,
            }}
          >
            VS
          </div>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, var(--border3), transparent)' }} />
        </div>

        {/* PIN Entry */}
        {selected ? (
          <div
            className="animate-slide-up rounded-2xl p-6"
            style={{
              background: `linear-gradient(145deg, ${PLAYERS[selected].bg}, var(--bg3))`,
              border: `1px solid ${PLAYERS[selected].color}30`,
              boxShadow: `0 0 40px ${PLAYERS[selected].glow}15, 0 8px 32px rgba(0,0,0,0.4)`,
            }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{
                  background: `${PLAYERS[selected].color}18`,
                  border: `1px solid ${PLAYERS[selected].color}35`,
                  boxShadow: `0 0 12px ${PLAYERS[selected].glow}`,
                }}
              >
                {PLAYERS[selected].emoji}
              </div>
              <div>
                <p
                  className="font-bc font-black text-sm tracking-wider"
                  style={{ color: PLAYERS[selected].color }}
                >
                  {PLAYERS[selected].name.toUpperCase()} — ENTER PIN
                </p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  4-digit secret code
                </p>
              </div>
            </div>

            {/* PIN boxes */}
            <div className={`flex gap-3 justify-center mb-5 ${shaking ? 'animate-shake' : ''}`}>
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={pinRefs[i]}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handlePinChange(i, e.target.value)}
                  onKeyDown={e => handlePinKeyDown(i, e)}
                  className={`pin-input ${selected === 'karthic' ? 'karthic-pin' : ''} ${digit ? 'filled' : ''}`}
                />
              ))}
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-center justify-center gap-2 mb-4 py-2 px-3 rounded-xl animate-slide-down"
                style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.2)' }}
              >
                <span style={{ color: 'var(--red)', fontSize: 13, fontWeight: 600 }}>⚠️ {error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={() => handleLogin(pin)}
              disabled={loading || pin.join('').length < 4}
              className="w-full py-3.5 rounded-xl font-bc font-black text-xl tracking-wider relative overflow-hidden transition-all"
              style={{
                background: pin.join('').length === 4
                  ? `linear-gradient(135deg, ${PLAYERS[selected].color}, ${PLAYERS[selected].color2})`
                  : 'var(--bg4)',
                color: pin.join('').length === 4 ? '#08090F' : 'var(--muted)',
                border: 'none',
                cursor: pin.join('').length === 4 ? 'pointer' : 'not-allowed',
                boxShadow: pin.join('').length === 4
                  ? `0 4px 24px ${PLAYERS[selected].glow}, 0 1px 0 rgba(255,255,255,0.15) inset`
                  : 'none',
                opacity: loading ? 0.75 : 1,
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <GiCrossedSwords size={18} style={{ animation: 'spin-slow 1.5s linear infinite' }} />
                  ENTERING...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <BsLightningChargeFill size={16} />
                  ENTER THE QUEST
                </span>
              )}
            </button>
          </div>
        ) : (
          <div
            className="text-center py-4 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border2)' }}
          >
            <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
              👆 Choose your warrior above
            </p>
          </div>
        )}

        <p className="text-center text-xs mt-6 pb-4" style={{ color: 'var(--muted2)' }}>
          QuestMates · Built for Glory ⚔️
        </p>
      </div>
    </div>
  );
}
