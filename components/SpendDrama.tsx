'use client';

import { useEffect, useRef } from 'react';
import { GiFlame, GiDeathSkull } from 'react-icons/gi';
import { RiAlarmWarningFill } from 'react-icons/ri';

interface SpendDramaProps {
  show: boolean;
  amount: number;
  player: string;
  onClose: () => void;
}

export default function SpendDrama({ show, amount, player, onClose }: SpendDramaProps) {
  const flashRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show) {
      const el = flashRef.current;
      if (!el) return;
      const flash = () => {
        el.classList.add('flash');
        setTimeout(() => el.classList.remove('flash'), 100);
      };
      flash();
      setTimeout(flash, 180);
      setTimeout(flash, 320);
    }
  }, [show]);

  const name = player === 'bhuvi' ? 'BHUVI' : 'KARTHIC';

  return (
    <>
      <div ref={flashRef} className="red-flash" />

      <div className={`overlay-bg ${show ? 'show' : ''}`} onClick={onClose}>
        <div
          className="overlay-box drama-box"
          onClick={e => e.stopPropagation()}
        >
          {/* Skull icon */}
          <div
            className="flex justify-center mb-3"
            style={{ animation: show ? 'float 0.8s ease-in-out infinite' : 'none' }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle, rgba(255,71,87,0.2) 0%, transparent 70%)',
                border: '2px solid rgba(255,71,87,0.3)',
                boxShadow: '0 0 30px rgba(255,71,87,0.3)',
              }}
            >
              <GiDeathSkull size={44} style={{ color: 'var(--red)' }} />
            </div>
          </div>

          {/* Fire row */}
          <div className="flex justify-center gap-1 mb-3">
            {[0, 1, 2].map(i => (
              <GiFlame
                key={i}
                size={22}
                style={{
                  color: i === 1 ? '#FF4757' : '#FF6B35',
                  animation: `float ${0.8 + i * 0.15}s ease-in-out infinite ${i * 0.1}s`,
                }}
              />
            ))}
          </div>

          <h2
            className="font-bc font-black text-3xl text-center mb-2"
            style={{ color: 'var(--red)', textShadow: '0 0 20px rgba(255,71,87,0.6)' }}
          >
            Money Gone
          </h2>

          <div
            className="font-bc font-black text-5xl text-center mb-3"
            style={{
              color: 'var(--red)',
              textShadow: '0 0 30px rgba(255,71,87,0.8)',
              animation: 'glow-pulse-b 1.2s ease-in-out infinite',
            }}
          >
            ₹{amount.toLocaleString()}
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <RiAlarmWarningFill size={14} style={{ color: 'rgba(255,71,87,0.8)' }} />
            <span
              className="font-bc font-bold text-sm tracking-widest"
              style={{ color: 'rgba(255,71,87,0.8)' }}
            >
              {name} SPENT THIS 😭
            </span>
            <RiAlarmWarningFill size={14} style={{ color: 'rgba(255,71,87,0.8)' }} />
          </div>

          <p className="text-sm text-center mb-7" style={{ color: 'var(--muted)', lineHeight: 1.5 }}>
            Your savings goal just felt that 😭
          </p>

          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl font-bc font-black text-lg tracking-wider relative overflow-hidden transition-all"
            style={{
              background: 'linear-gradient(135deg, #FF4757, #FF6B81)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(255,71,87,0.4)',
            }}
          >
            I Know, I&apos;m Sorry 💸
          </button>
        </div>
      </div>
    </>
  );
}
