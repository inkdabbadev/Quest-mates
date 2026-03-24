'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  CHECKPOINTS, WAYPOINTS, PLAYER_CONFIG,
  getCurrentCP, getProgress, buildPath,
} from '@/lib/constants';
import type { BothPlayersState } from '@/types';
import { RiMapPinFill, RiLockFill, RiVipCrownFill, RiFireFill } from 'react-icons/ri';
import { BsLightningChargeFill, BsStarFill, BsCheckCircleFill } from 'react-icons/bs';
import { GiTrophy, GiPathDistance } from 'react-icons/gi';

type PKey = 'bhuvi' | 'karthic';

const MAP_W = 420;
const MAP_H = 290;

// ── Per-player illustrated theme ──────────────────────────────────────────────
const THEME = {
  bhuvi: {
    // Pink sky → light pink → grass
    bg: 'linear-gradient(180deg, #D9606A 0%, #E8828C 20%, #F5A8AE 48%, #FECFD3 73%, #FFE2E5 80%, #5DB342 80%, #4A8C30 100%)',
    champIcon: '❤️',
    champBg: '#D81B60',
    champShadow: 'rgba(216,27,96,0.55)',
    avatarBorder: '#FF6B35',
    nameBg: '#FF6B35',
    nameShadow: 'rgba(255,107,53,0.6)',
    doneRing: '#FF6B35',
    // Clouds: [x, y, width, animDelay]
    clouds: [
      [10,  12, 96,  0  ],
      [130, 8,  76,  1.8],
      [310, 20, 88,  0.9],
    ] as [number, number, number, number][],
  },
  karthic: {
    // Deep blue sky → medium blue → light blue → grass
    bg: 'linear-gradient(180deg, #1053A8 0%, #1976D2 22%, #2196F3 46%, #64B5F6 72%, #BBDEFB 80%, #5DB342 80%, #4A8C30 100%)',
    champIcon: '📦',
    champBg: '#00796B',
    champShadow: 'rgba(0,121,107,0.55)',
    avatarBorder: '#4ECDC4',
    nameBg: '#4ECDC4',
    nameShadow: 'rgba(78,205,196,0.6)',
    doneRing: '#4ECDC4',
    // Bigger clouds for karthic
    clouds: [
      [5,   8,  118, 0  ],
      [168, 4,  102, 1.4],
      [298, 16, 92,  2.2],
    ] as [number, number, number, number][],
  },
} as const;

// ── Fluffy cloud component ────────────────────────────────────────────────────
function Cloud({ x, y, w, delay }: { x: number; y: number; w: number; delay: number }) {
  return (
    <div
      className="absolute pointer-events-none select-none"
      style={{
        left: x,
        top: y,
        filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.14))',
        animation: `float ${5 + delay}s ease-in-out infinite ${delay}s`,
      }}
    >
      <svg width={w} height={Math.round(w * 0.54)} viewBox="0 0 100 54">
        <ellipse cx="50" cy="43" rx="44" ry="13" fill="white" />
        <ellipse cx="28" cy="30" rx="22" ry="20" fill="white" />
        <ellipse cx="63" cy="25" rx="27" ry="23" fill="white" />
        <ellipse cx="43" cy="17" rx="18" ry="15" fill="white" />
        <ellipse cx="75" cy="33" rx="17" ry="14" fill="white" />
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function MapPage() {
  const { data: session } = useSession();
  const [activePlayer, setActivePlayer] = useState<PKey>('bhuvi');
  const [state, setState] = useState<BothPlayersState>({
    bhuvi:   { totalXP: 0, todayXP: 0, todayFit: 0, todayFin: 0, todaySoc: 0, streak: 0, longestStreak: 0 },
    karthic: { totalXP: 0, todayXP: 0, todayFit: 0, todayFin: 0, todaySoc: 0, streak: 0, longestStreak: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchXP = useCallback(async () => {
    setError(false);
    try {
      const res = await fetch('/api/xp');
      if (res.ok) setState(await res.json());
      else setError(true);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchXP();
    if (session?.user?.username) setActivePlayer(session.user.username as PKey);
  }, [fetchXP, session]);

  const p     = state[activePlayer];
  const cfg   = PLAYER_CONFIG[activePlayer];
  const theme = THEME[activePlayer];
  const cpIdx = getCurrentCP(p.totalXP);
  const pct   = getProgress(p.totalXP, cpIdx);
  const cp    = CHECKPOINTS[cpIdx];
  const nextCP = CHECKPOINTS[Math.min(cpIdx + 1, 11)];
  const path  = buildPath(MAP_W, MAP_H);

  // Avatar position — interpolated between current and next checkpoint based on XP progress
  const [avWx0, avWy0] = WAYPOINTS[cpIdx];
  const [avWx1, avWy1] = WAYPOINTS[Math.min(cpIdx + 1, 11)];
  const t = pct / 100;
  const ax = MAP_W * (avWx0 + (avWx1 - avWx0) * t) / 100;
  const ay = MAP_H * (avWy0 + (avWy1 - avWy0) * t) / 100;

  // Champion position (last checkpoint)
  const [chWx, chWy] = WAYPOINTS[11];
  const cx = MAP_W * chWx / 100;
  const cy = MAP_H * chWy / 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: 400 }}>
        <div className="text-center">
          <GiPathDistance size={42} style={{ color: 'var(--bhuvi)', margin: '0 auto 12px', animation: 'float 1.5s ease-in-out infinite' }} />
          <p className="font-bc font-black text-sm tracking-wider" style={{ color: 'var(--muted)' }}>LOADING MAP...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4" style={{ height: 400 }}>
        <GiPathDistance size={36} style={{ color: 'var(--muted2)' }} />
        <p className="font-bc font-bold text-sm tracking-wider" style={{ color: 'var(--muted)' }}>FAILED TO LOAD MAP</p>
        <button
          onClick={() => { setLoading(true); fetchXP(); }}
          className="font-bc font-black text-xs px-4 py-2 rounded-xl"
          style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text2)', cursor: 'pointer' }}
        >
          RETRY
        </button>
      </div>
    );
  }

  return (
    <div>

      {/* ── Player toggle ──────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3">
        <div
          className="flex rounded-xl overflow-hidden"
          style={{ background: 'var(--bg3)', border: '1px solid var(--border2)' }}
        >
          {(['bhuvi', 'karthic'] as PKey[]).map(pk => {
            const c      = PLAYER_CONFIG[pk];
            const active = activePlayer === pk;
            const color  = pk === 'bhuvi' ? '#FF6B35' : '#4ECDC4';
            return (
              <button
                key={pk}
                onClick={() => setActivePlayer(pk)}
                className="flex-1 flex items-center justify-center gap-2 py-3 relative"
                style={{
                  background: active ? `${color}10` : 'transparent',
                  color: active ? color : 'var(--muted)',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'Chakra Petch', sans-serif",
                  fontWeight: 800,
                  fontSize: 15,
                  letterSpacing: '0.4px',
                  touchAction: 'manipulation',
                  transition: 'all 0.2s',
                }}
              >
                {/* Active bottom underline */}
                {active && (
                  <div
                    className="absolute bottom-0 left-8 right-8 rounded-full"
                    style={{ height: 2, background: color, boxShadow: `0 0 6px ${color}` }}
                  />
                )}
                {/* Colored indicator dot */}
                <span
                  className="rounded-full flex-shrink-0"
                  style={{
                    width: 8, height: 8,
                    background: color,
                    boxShadow: active ? `0 0 7px ${color}` : 'none',
                  }}
                />
                <span>{c.emoji}</span>
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Illustrated map canvas ─────────────────────────────────── */}
      <div
        className="relative mx-4 rounded-2xl overflow-hidden"
        style={{
          height: MAP_H,
          background: theme.bg,
          boxShadow: '0 8px 32px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.12)',
          border: '1px solid rgba(0,0,0,0.08)',
        }}
      >

        {/* Clouds */}
        {theme.clouds.map(([x, y, w, delay], i) => (
          <Cloud key={i} x={x} y={y} w={w} delay={delay} />
        ))}

        {/* SVG — path + checkpoint dots */}
        <svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Road shadow */}
          <path
            d={path} fill="none"
            stroke="rgba(0,0,0,0.1)" strokeWidth={18} strokeLinecap="round"
          />
          {/* Gray road base */}
          <path
            d={path} fill="none"
            stroke="rgba(200,200,200,0.75)" strokeWidth={13} strokeLinecap="round"
          />
          {/* White dashed centre line — creates the dotted road look */}
          <path
            d={path} fill="none"
            stroke="rgba(255,255,255,0.60)" strokeWidth={5}
            strokeLinecap="round" strokeDasharray="2 16"
          />

          {/* Checkpoint dots (skip current avatar pos + champion pos) */}
          {CHECKPOINTS.map((_, i) => {
            // Hide champion position (avatar at end) and hide cpIdx only when avatar is sitting exactly on it (pct === 0)
            if (i === 11 || (i === cpIdx && pct === 0)) return null;
            const [wx, wy] = WAYPOINTS[i];
            const dx = MAP_W * wx / 100;
            const dy = MAP_H * wy / 100;
            // cpIdx is "done" once the avatar has moved past it (pct > 0)
            const done = i < cpIdx || (i === cpIdx && pct > 0);
            return (
              <g key={i}>
                {/* Outer white ring */}
                <circle
                  cx={dx} cy={dy}
                  r={done ? 9 : 7}
                  fill="white"
                  stroke={done ? theme.doneRing : 'rgba(180,180,180,0.85)'}
                  strokeWidth={done ? 2.5 : 2}
                />
                {done && (
                  <text
                    x={dx} y={dy + 1}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={8} fill={theme.doneRing} fontWeight="bold"
                  >✓</text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Champion emoji + CHAMPION badge at final checkpoint */}
        <div
          className="absolute pointer-events-none flex flex-col items-center"
          style={{
            left: `${(cx / MAP_W) * 100}%`,
            top: `${(cy / MAP_H) * 100}%`,
            transform: 'translate(-50%, -100%)',
            zIndex: 8,
          }}
        >
          <span
            style={{
              fontSize: 36,
              filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.3))',
              display: 'block',
              lineHeight: 1,
            }}
          >
            {theme.champIcon}
          </span>
          <div
            className="font-bc font-black text-white rounded-full mt-1"
            style={{
              background: theme.champBg,
              fontSize: 11,
              letterSpacing: '0.8px',
              padding: '3px 10px',
              boxShadow: `0 3px 12px ${theme.champShadow}`,
              whiteSpace: 'nowrap',
            }}
          >
            CHAMPION
          </div>
        </div>

        {/* Player avatar pin at current checkpoint */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${(ax / MAP_W) * 100}%`,
            top: `${(ay / MAP_H) * 100}%`,
            transform: 'translate(-50%, -100%)',
            zIndex: 10,
          }}
        >
          <div className="flex flex-col items-center" style={{ gap: 4 }}>
            {/* Circular avatar */}
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                background: 'white',
                border: `3px solid ${theme.avatarBorder}`,
                boxShadow: `0 4px 16px ${theme.avatarBorder}55, 0 2px 8px rgba(0,0,0,0.22)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                animation: 'float 2.8s ease-in-out infinite',
              }}
            >
              {cfg.emoji}
            </div>
            {/* Name label pill */}
            <div
              className="font-bc font-black text-white rounded-full"
              style={{
                background: theme.nameBg,
                fontSize: 10,
                letterSpacing: '0.5px',
                padding: '2px 8px',
                boxShadow: `0 2px 8px ${theme.nameShadow}`,
                whiteSpace: 'nowrap',
              }}
            >
              {cfg.name}
            </div>
          </div>
        </div>

        {/* Bottom progress overlay */}
        <div
          className="absolute bottom-0 left-0 right-0 px-3 pb-2.5 pt-7"
          style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.28))' }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span
              className="font-bc font-bold text-xs text-white"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
            >
              {cpIdx < 11 ? `CP ${cpIdx + 1} → ${cpIdx + 2}` : '🏆 CHAMPION'}
            </span>
            <span
              className="font-bc font-bold text-xs text-white"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
            >
              {p.totalXP.toLocaleString()} XP
            </span>
          </div>
          {/* White progress bar */}
          <div
            className="rounded-full overflow-hidden"
            style={{ height: 5, background: 'rgba(255,255,255,0.28)' }}
          >
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                background: 'white',
                borderRadius: 999,
                boxShadow: '0 0 8px rgba(255,255,255,0.9)',
                transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Streak card ────────────────────────────────────────────── */}
      <div className="mx-4 mt-4">
        <div
          className="rounded-2xl p-4"
          style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border2)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <RiFireFill size={14} style={{ color: '#FF6B35' }} />
            <span className="font-bc font-black text-xs tracking-widest" style={{ color: 'var(--muted)' }}>
              STREAKS
            </span>
            <div className="flex-1 h-px" style={{ background: 'var(--border2)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--muted2)' }}>
              1 grace day allowed
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(['bhuvi', 'karthic'] as PKey[]).map(pk => {
              const pkCfg = PLAYER_CONFIG[pk];
              const pkStreak = state[pk].streak;
              const pkLongest = state[pk].longestStreak;
              const isActive = activePlayer === pk;
              return (
                <div
                  key={pk}
                  className="rounded-xl p-3 text-center"
                  style={{
                    background: isActive ? `${pkCfg.color}10` : 'var(--bg3)',
                    border: `1px solid ${isActive ? pkCfg.color + '30' : 'var(--border2)'}`,
                  }}
                >
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span style={{ fontSize: 16 }}>{pkCfg.emoji}</span>
                    <span className="font-bc font-bold text-xs" style={{ color: pkCfg.color }}>{pkCfg.name}</span>
                  </div>
                  <div
                    className="font-bc font-black"
                    style={{ fontSize: 34, color: pkStreak > 0 ? pkCfg.color : 'var(--muted2)', lineHeight: 1 }}
                  >
                    {pkStreak}
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <RiFireFill size={10} style={{ color: pkStreak > 0 ? pkCfg.color : 'var(--muted2)', opacity: 0.7 }} />
                    <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                      day streak
                    </span>
                  </div>
                  {pkLongest > 0 && (
                    <div className="mt-1.5 text-xs font-medium" style={{ color: 'var(--muted2)' }}>
                      best: {pkLongest}d
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Current checkpoint card ────────────────────────────────── */}
      <div className="mx-4 mt-4">
        <div
          className="rounded-2xl p-4 relative overflow-hidden"
          style={{
            background: `linear-gradient(145deg, ${cfg.color}08, var(--bg3))`,
            border: `1px solid ${cfg.color}20`,
            boxShadow: `0 0 24px ${cfg.color}08`,
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}30, transparent)` }}
          />
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
              style={{
                background: `${cfg.color}15`,
                border: `1px solid ${cfg.color}30`,
                boxShadow: `0 0 20px ${cfg.color}20`,
              }}
            >
              {cp.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bc font-black text-xl" style={{ color: cfg.color }}>
                  {cp.name}
                </span>
                <span className={`here-badge ${activePlayer === 'bhuvi' ? 'here-badge-b' : 'here-badge-k'}`}>
                  <RiMapPinFill size={8} style={{ marginRight: 2 }} />
                  HERE
                </span>
              </div>
              <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>{cp.desc}</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                {cpIdx < 11
                  ? `Next: ${nextCP.name} · ${(nextCP.totalXP - p.totalXP).toLocaleString()} XP away`
                  : '🏆 Final destination reached!'}
              </span>
              <span className="font-bc font-bold text-sm" style={{ color: cfg.color }}>{pct}%</span>
            </div>
            <div className="progress-track">
              <div
                className={activePlayer === 'bhuvi' ? 'progress-fill-b' : 'progress-fill-k'}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Full journey list ──────────────────────────────────────── */}
      <div className="mx-4 mt-5 mb-2">
        <div className="flex items-center gap-3 mb-3">
          <GiPathDistance size={16} style={{ color: 'var(--muted)' }} />
          <span className="font-bc font-black text-xs tracking-widest" style={{ color: 'var(--muted)' }}>
            FULL JOURNEY
          </span>
          <div className="flex-1 h-px" style={{ background: 'var(--border2)' }} />
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)' }}
          >
            <BsStarFill size={9} style={{ color: 'var(--gold)' }} />
            <span className="font-bc font-bold text-xs" style={{ color: 'var(--gold)' }}>
              {cpIdx + 1}/12
            </span>
          </div>
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg2)', border: '1px solid var(--border2)' }}
        >
          {CHECKPOINTS.map((chk, i) => {
            const isDone    = i < cpIdx;
            const isCurrent = i === cpIdx;
            const isLocked  = i > cpIdx + 1;

            return (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 relative"
                style={{
                  borderBottom: i < 11 ? '1px solid rgba(28,32,53,0.7)' : 'none',
                  background: isDone
                    ? 'rgba(255,215,0,0.025)'
                    : isCurrent
                    ? `${cfg.color}07`
                    : 'transparent',
                }}
              >
                {/* Vertical connectors */}
                {i > 0 && (
                  <div className="absolute left-[31px] top-0 w-px" style={{
                    height: '50%',
                    background: isDone ? cfg.color : 'var(--border2)',
                    opacity: isDone ? 0.5 : 0.3,
                  }} />
                )}
                {i < 11 && (
                  <div className="absolute left-[31px] bottom-0 w-px" style={{
                    height: '50%',
                    background: isDone ? cfg.color : 'var(--border2)',
                    opacity: isDone ? 0.4 : 0.25,
                  }} />
                )}

                {/* Row number */}
                <span
                  className="font-bc font-black text-xs w-4 text-right flex-shrink-0 relative z-10"
                  style={{ color: isDone ? 'var(--gold)' : isCurrent ? cfg.color : 'var(--muted2)' }}
                >
                  {i + 1}
                </span>

                {/* Status icon */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 relative z-10"
                  style={{
                    background: isDone ? 'rgba(255,215,0,0.12)' : isCurrent ? `${cfg.color}18` : 'var(--bg4)',
                    border: `1px solid ${isDone ? 'rgba(255,215,0,0.2)' : isCurrent ? `${cfg.color}30` : 'var(--border2)'}`,
                    opacity: isLocked ? 0.45 : 1,
                    fontSize: 16,
                  }}
                >
                  {isDone     ? <BsCheckCircleFill size={14} style={{ color: 'var(--gold)' }} /> :
                   isCurrent  ? <span>{chk.icon}</span> :
                   isLocked   ? <RiLockFill size={13} style={{ color: 'var(--muted2)' }} /> :
                                <span>{chk.icon}</span>}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="font-bc font-bold text-sm truncate"
                      style={{
                        color: isDone ? 'var(--gold)' : isCurrent ? cfg.color : 'var(--muted)',
                        opacity: isLocked ? 0.5 : 1,
                      }}
                    >
                      {chk.name}
                    </span>
                    {isCurrent && (
                      <span className={`here-badge ${activePlayer === 'bhuvi' ? 'here-badge-b' : 'here-badge-k'} flex-shrink-0`}>
                        HERE
                      </span>
                    )}
                  </div>
                  <p
                    className="text-xs mt-0.5 truncate"
                    style={{ color: 'var(--muted2)', opacity: isLocked ? 0.5 : 0.8 }}
                  >
                    {isLocked ? `${chk.totalXP.toLocaleString()} XP required` : chk.desc}
                  </p>
                </div>

                {/* XP + icon */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <BsLightningChargeFill
                      size={9}
                      style={{ color: isDone ? 'var(--gold)' : isCurrent ? cfg.color : 'var(--muted2)' }}
                    />
                    <span
                      className="font-bc font-bold text-xs"
                      style={{
                        color: isDone ? 'var(--gold)' : isCurrent ? cfg.color : 'var(--muted2)',
                        opacity: isLocked ? 0.45 : 1,
                      }}
                    >
                      {chk.totalXP.toLocaleString()}
                    </span>
                  </div>
                  {i === 11 && isDone && <GiTrophy size={12} style={{ color: 'var(--gold)' }} />}
                  {isCurrent && <RiVipCrownFill size={11} style={{ color: cfg.color }} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
