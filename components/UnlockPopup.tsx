'use client';

import type { Checkpoint } from '@/types';
import { GiTrophy } from 'react-icons/gi';
import { BsLightningChargeFill, BsStarFill } from 'react-icons/bs';
import { RiVipCrownFill } from 'react-icons/ri';

interface UnlockPopupProps {
  checkpoint: Checkpoint | null;
  onClose: () => void;
}

export default function UnlockPopup({ checkpoint, onClose }: UnlockPopupProps) {
  if (!checkpoint) return null;

  return (
    <div className={`overlay-bg ${checkpoint ? 'show' : ''}`} onClick={onClose}>
      <div
        className="overlay-box unlock-box"
        onClick={e => e.stopPropagation()}
      >
        {/* Crown / trophy header */}
        <div className="flex justify-center mb-3">
          <div
            className="relative"
            style={{ animation: 'bounce-in 0.6s cubic-bezier(0.175,0.885,0.32,1.275)' }}
          >
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle, rgba(255,215,0,0.2) 0%, transparent 70%)',
                border: '2px solid rgba(255,215,0,0.3)',
                boxShadow: '0 0 40px rgba(255,215,0,0.3), 0 0 80px rgba(255,215,0,0.1)',
              }}
            >
              <span style={{ fontSize: 48 }}>{checkpoint.icon}</span>
            </div>
            {/* Corner stars */}
            <BsStarFill
              size={12}
              style={{ position: 'absolute', top: -2, right: -2, color: 'var(--gold)', animation: 'float 1.5s ease-in-out infinite' }}
            />
            <BsStarFill
              size={9}
              style={{ position: 'absolute', bottom: 2, left: -2, color: 'var(--gold)', animation: 'float 2s ease-in-out infinite 0.5s', opacity: 0.7 }}
            />
          </div>
        </div>

        {/* Unlocked badge */}
        <div className="flex justify-center mb-3">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{
              background: 'rgba(255,215,0,0.12)',
              border: '1px solid rgba(255,215,0,0.3)',
              boxShadow: '0 0 12px rgba(255,215,0,0.2)',
            }}
          >
            <RiVipCrownFill size={12} style={{ color: 'var(--gold)' }} />
            <span className="font-bc font-black text-xs tracking-widest" style={{ color: 'var(--gold)' }}>
              CHECKPOINT UNLOCKED
            </span>
          </div>
        </div>

        {/* Name */}
        <h2
          className="font-bc font-black text-4xl text-center mb-1"
          style={{ color: 'var(--gold)', textShadow: '0 0 20px rgba(255,215,0,0.5)', lineHeight: 1 }}
        >
          {checkpoint.name}
        </h2>

        {/* Description */}
        <p className="text-sm text-center mb-4" style={{ color: 'var(--text2)', lineHeight: 1.6 }}>
          {checkpoint.desc}
        </p>

        {/* XP milestone card */}
        <div
          className="flex items-center justify-center gap-2 mb-6 py-3 px-4 rounded-xl"
          style={{
            background: 'rgba(255,215,0,0.08)',
            border: '1px solid rgba(255,215,0,0.2)',
          }}
        >
          <BsLightningChargeFill size={16} style={{ color: 'var(--gold)' }} />
          <span className="font-bc font-black text-2xl" style={{ color: 'var(--gold)' }}>
            {checkpoint.totalXP.toLocaleString()} XP
          </span>
          <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>reached</span>
        </div>

        {/* Stars row */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map(i => (
            <BsStarFill
              key={i}
              size={14}
              style={{
                color: 'var(--gold)',
                opacity: i <= 3 ? 1 : 0.3,
                animation: `float ${1.5 + i * 0.2}s ease-in-out infinite ${i * 0.15}s`,
              }}
            />
          ))}
        </div>

        {/* Trophy icon */}
        <div className="flex justify-center mb-4">
          <GiTrophy size={24} style={{ color: 'var(--gold)', opacity: 0.7 }} />
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-xl font-bc font-black text-xl tracking-wider relative overflow-hidden transition-all"
          style={{
            background: 'linear-gradient(135deg, #FFD700, #FFF176, #FFD700)',
            color: '#08090F',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(255,215,0,0.4)',
          }}
        >
          <span className="flex items-center justify-center gap-2">
            <BsLightningChargeFill size={16} />
            Let&apos;s Go! 🚀
          </span>
        </button>
      </div>
    </div>
  );
}
