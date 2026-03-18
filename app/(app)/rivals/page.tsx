'use client';

import { useState, useEffect, useCallback } from 'react';
import { NUDGE_MESSAGES, getCurrentCP, getLevel, PLAYER_CONFIG } from '@/lib/constants';
import Toast from '@/components/Toast';
import { GiCrossedSwords, GiTrophy, GiMuscleUp, GiCoinsPile, GiSmartphone } from 'react-icons/gi';
import { BsLightningChargeFill, BsBarChartFill } from 'react-icons/bs';
import { RiVipCrownFill, RiMapPinFill, RiFireFill } from 'react-icons/ri';
import { FiSend } from 'react-icons/fi';

interface RivalsData {
  bhuvi:   { totalXP: number; todayFit: number; todayFin: number; todaySoc: number };
  karthic: { totalXP: number; todayFit: number; todayFin: number; todaySoc: number };
}

export default function RivalsPage() {
  const [data, setData] = useState<RivalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [nudgeSent, setNudgeSent] = useState<number | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2400); };

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/xp');
      if (res.ok) setData(await res.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleNudge = async (idx: number, text: string, emoji: string) => {
    setNudgeSent(idx);
    showToast(`${emoji} Nudge sent: "${text}"`);
    try { await fetch('/api/nudge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text }) }); }
    catch { /* silent */ }
    setTimeout(() => setNudgeSent(null), 1600);
  };

  if (loading) return (
    <div className="flex items-center justify-center" style={{ height: 400 }}>
      <div className="text-center">
        <GiCrossedSwords size={40} style={{ color: 'var(--bhuvi)', margin: '0 auto 12px', animation: 'spin-slow 2s linear infinite' }} />
        <p className="font-bc font-black text-sm tracking-wider" style={{ color: 'var(--muted)' }}>LOADING BATTLE...</p>
      </div>
    </div>
  );

  if (!data) return null;

  const bXP = data.bhuvi.totalXP, kXP = data.karthic.totalXP;
  const total = bXP + kXP || 1;
  const bPct = Math.round((bXP / total) * 100);
  const kPct = 100 - bPct;
  const bCfg = PLAYER_CONFIG.bhuvi, kCfg = PLAYER_CONFIG.karthic;
  const bWinning = bXP >= kXP;
  const xpDiff = Math.abs(bXP - kXP);

  const cats = [
    { Icon: GiMuscleUp,    label: 'Fitness', b: data.bhuvi.todayFit, k: data.karthic.todayFit, color: '#FF6B35' },
    { Icon: GiCoinsPile,   label: 'Finance', b: data.bhuvi.todayFin, k: data.karthic.todayFin, color: '#FFD700' },
    { Icon: GiSmartphone,  label: 'Social',  b: data.bhuvi.todaySoc, k: data.karthic.todaySoc, color: '#4ECDC4' },
  ];

  return (
    <div className="px-4 py-4 space-y-4">

      {/* ── BATTLE HEADER ─────────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden relative"
        style={{
          background: 'linear-gradient(145deg, #0D0806, #0A0D12, #0D0806)',
          border: '1px solid var(--border2)',
          boxShadow:
            '0 0 60px rgba(255,107,53,0.07), 0 0 60px rgba(78,205,196,0.07), 0 12px 40px rgba(0,0,0,0.6)',
        }}
      >
        {/* Diagonal color split */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(108deg, rgba(255,107,53,0.05) 0%, transparent 48%, rgba(78,205,196,0.05) 100%)',
          }} />
          {/* Top border accent */}
          <div className="absolute top-0 left-0 right-0 h-px" style={{
            background: 'linear-gradient(90deg, rgba(255,107,53,0.5) 0%, transparent 45%, transparent 55%, rgba(78,205,196,0.5) 100%)',
          }} />
        </div>

        {/* Title row */}
        <div className="flex items-center justify-center gap-3 px-4 py-3 relative"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <GiCrossedSwords size={15} style={{ color: 'var(--gold)' }} />
          <span className="font-bc font-black text-sm tracking-widest" style={{ color: 'var(--gold)' }}>
            TOTAL XP BATTLE
          </span>
          <GiCrossedSwords size={15} style={{ color: 'var(--gold)', transform: 'scaleX(-1)' }} />
        </div>

        {/* Player heads row */}
        <div className="flex items-stretch px-4 pt-5 pb-4 relative gap-2">

          {/* ── Bhuvi ── */}
          <div className="flex-1 flex flex-col items-center gap-1.5">
            <div
              style={{
                fontSize: 48,
                filter: 'drop-shadow(0 0 18px rgba(255,107,53,0.75))',
                animation: 'float 3s ease-in-out infinite',
                display: 'block',
                lineHeight: 1,
              }}
            >🦁</div>

            <div className="font-bc font-black text-lg" style={{ color: bCfg.color }}>Bhuvi</div>

            <div
              className="font-bc font-black"
              style={{
                fontSize: 38,
                color: bCfg.color,
                textShadow: '0 0 24px rgba(255,107,53,0.55)',
                lineHeight: 1,
              }}
            >
              {bXP.toLocaleString()}
            </div>
            <div className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>XP</div>

            {bWinning && bXP !== kXP && (
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-full mt-1"
                style={{
                  background: 'rgba(255,107,53,0.15)',
                  border: '1px solid rgba(255,107,53,0.3)',
                  color: bCfg.color,
                  fontSize: 11,
                  fontWeight: 800,
                  fontFamily: "'Barlow Condensed'",
                }}
              >
                <RiFireFill size={10} /> WINNING
              </div>
            )}
          </div>

          {/* ── VS center ── */}
          <div className="flex flex-col items-center justify-center gap-1 px-2">
            <div
              className="font-bc font-black"
              style={{ fontSize: 28, color: 'var(--muted2)', lineHeight: 1 }}
            >VS</div>
            {xpDiff > 0 && (
              <div
                className="font-bc font-bold text-xs text-center px-2 py-1 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border)',
                  color: 'var(--muted)',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                }}
              >
                {xpDiff.toLocaleString()}<br />
                <span style={{ fontSize: 9, letterSpacing: '0.5px' }}>XP GAP</span>
              </div>
            )}
          </div>

          {/* ── Karthic ── */}
          <div className="flex-1 flex flex-col items-center gap-1.5">
            <div
              style={{
                fontSize: 48,
                filter: 'drop-shadow(0 0 18px rgba(78,205,196,0.75))',
                animation: 'float 3s ease-in-out infinite 0.5s',
                display: 'block',
                lineHeight: 1,
              }}
            >🐯</div>

            <div className="font-bc font-black text-lg" style={{ color: kCfg.color }}>Karthic</div>

            <div
              className="font-bc font-black"
              style={{
                fontSize: 38,
                color: kCfg.color,
                textShadow: '0 0 24px rgba(78,205,196,0.55)',
                lineHeight: 1,
              }}
            >
              {kXP.toLocaleString()}
            </div>
            <div className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>XP</div>

            {!bWinning && bXP !== kXP && (
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-full mt-1"
                style={{
                  background: 'rgba(78,205,196,0.15)',
                  border: '1px solid rgba(78,205,196,0.3)',
                  color: kCfg.color,
                  fontSize: 11,
                  fontWeight: 800,
                  fontFamily: "'Barlow Condensed'",
                }}
              >
                <RiFireFill size={10} /> WINNING
              </div>
            )}
          </div>
        </div>

        {/* Battle bar */}
        <div className="px-4 pb-5 relative">
          <div className="flex justify-between items-center mb-1.5">
            <span className="font-bc font-bold text-xs" style={{ color: bCfg.color }}>{bPct}%</span>
            <span className="font-bc font-bold text-xs tracking-widest" style={{ color: 'var(--muted2)' }}>
              SPLIT
            </span>
            <span className="font-bc font-bold text-xs" style={{ color: kCfg.color }}>{kPct}%</span>
          </div>
          <div className="battle-track" style={{ height: 14, borderRadius: 999 }}>
            <div className="battle-seg-b" style={{ width: `${bPct}%` }} />
            <div className="battle-seg-k" style={{ width: `${kPct}%` }} />
          </div>
        </div>
      </div>

      {/* ── STATS GRID ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { Icon: RiVipCrownFill, label: 'Bhuvi Level',   val: getLevel(bXP),                sub: 'current level', color: bCfg.color },
          { Icon: RiVipCrownFill, label: 'Karthic Level',  val: getLevel(kXP),                sub: 'current level', color: kCfg.color },
          { Icon: RiMapPinFill,   label: 'Bhuvi CP',       val: `${getCurrentCP(bXP) + 1}/12`, sub: 'checkpoint',    color: bCfg.color },
          { Icon: RiMapPinFill,   label: 'Karthic CP',     val: `${getCurrentCP(kXP) + 1}/12`, sub: 'checkpoint',    color: kCfg.color },
        ].map((item, i) => (
          <div
            key={i}
            className="rounded-2xl p-4 text-center relative overflow-hidden"
            style={{
              background: `linear-gradient(145deg, ${item.color}08, var(--bg3))`,
              border: `1px solid ${item.color}1A`,
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${item.color}30, transparent)` }} />
            <item.Icon size={13} style={{ color: item.color, opacity: 0.6, margin: '0 auto 6px' }} />
            <div className="text-xs font-bc font-bold tracking-wider mb-1" style={{ color: 'var(--muted)' }}>
              {item.label}
            </div>
            <div
              className="font-bc font-black"
              style={{ fontSize: 36, color: item.color, textShadow: `0 0 16px ${item.color}45`, lineHeight: 1 }}
            >
              {item.val}
            </div>
            <div className="text-xs mt-1 font-semibold" style={{ color: 'var(--muted2)' }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* ── TODAY'S LOG BATTLE ────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg2)', border: '1px solid var(--border2)' }}
      >
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{ borderBottom: '1px solid var(--border2)' }}
        >
          <BsBarChartFill size={13} style={{ color: 'var(--gold)' }} />
          <span className="font-bc font-black text-sm tracking-widest" style={{ color: 'var(--text)' }}>
            TODAY&apos;S LOG BATTLE
          </span>
        </div>

        {/* Column labels */}
        <div
          className="grid grid-cols-3 px-4 pt-3 pb-1 text-xs font-bc font-black tracking-wider"
          style={{ color: 'var(--muted2)' }}
        >
          <span>CATEGORY</span>
          <span className="text-center" style={{ color: bCfg.color }}>🦁 B</span>
          <span className="text-center" style={{ color: kCfg.color }}>K 🐯</span>
        </div>

        <div className="px-4 pb-4 pt-1 space-y-4">
          {cats.map((cat, i) => {
            const catTotal = cat.b + cat.k || 1;
            const bCatPct = Math.round((cat.b / catTotal) * 100);
            const kCatPct = 100 - bCatPct;
            const winner = cat.b > cat.k ? 'b' : cat.k > cat.b ? 'k' : 'tie';

            return (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <cat.Icon size={14} style={{ color: cat.color }} />
                    <span className="font-bc font-bold text-sm" style={{ color: 'var(--text2)' }}>{cat.label}</span>
                  </div>
                  {winner !== 'tie' ? (
                    <span
                      className="font-bc font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: `${winner === 'b' ? bCfg.color : kCfg.color}15`,
                        color: winner === 'b' ? bCfg.color : kCfg.color,
                        border: `1px solid ${winner === 'b' ? bCfg.color : kCfg.color}30`,
                        fontSize: 10,
                      }}
                    >
                      {winner === 'b' ? `🦁 +${cat.b - cat.k}` : `🐯 +${cat.k - cat.b}`}
                    </span>
                  ) : (
                    <span className="font-bc font-bold text-xs" style={{ color: 'var(--muted2)' }}>TIE</span>
                  )}
                </div>
                <div className="battle-track mb-1.5" style={{ height: 9 }}>
                  <div className="battle-seg-b" style={{ width: `${bCatPct}%` }} />
                  <div className="battle-seg-k" style={{ width: `${kCatPct}%` }} />
                </div>
                <div className="flex justify-between">
                  <span className="font-bc font-bold text-xs" style={{ color: bCfg.color }}>{cat.b} XP</span>
                  <span className="font-bc font-bold text-xs" style={{ color: kCfg.color }}>{cat.k} XP</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── NUDGE ─────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'var(--bg2)', border: '1px solid var(--border2)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <FiSend size={13} style={{ color: 'var(--bhuvi)' }} />
          <span className="font-bc font-black text-sm tracking-wider" style={{ color: 'var(--text)' }}>
            POKE YOUR MATE
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {NUDGE_MESSAGES.map((n, i) => (
            <button
              key={i}
              onClick={() => handleNudge(i, n.text, n.emoji)}
              className={`nudge-btn ${nudgeSent === i ? 'sent' : ''}`}
            >
              {nudgeSent === i ? (
                <><BsLightningChargeFill size={11} /> Sent!</>
              ) : (
                <>{n.emoji} {n.text}</>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Combined XP ───────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-4 flex items-center justify-between"
        style={{
          background: 'linear-gradient(145deg, rgba(255,215,0,0.06), var(--bg3))',
          border: '1px solid rgba(255,215,0,0.14)',
          boxShadow: '0 0 30px rgba(255,215,0,0.04)',
        }}
      >
        <div className="flex items-center gap-2">
          <GiTrophy size={20} style={{ color: 'var(--gold)' }} />
          <div>
            <div className="font-bc font-bold text-xs tracking-widest" style={{ color: 'var(--muted)' }}>
              COMBINED QUEST XP
            </div>
          </div>
        </div>
        <span
          className="font-bc font-black text-3xl"
          style={{ color: 'var(--gold)', textShadow: '0 0 16px rgba(255,215,0,0.45)' }}
        >
          {(bXP + kXP).toLocaleString()}
        </span>
      </div>

      {toast && <Toast message={toast} />}
    </div>
  );
}
