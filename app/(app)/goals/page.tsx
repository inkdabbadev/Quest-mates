'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { DEFAULT_GOALS, PLAYER_CONFIG } from '@/lib/constants';
import Toast from '@/components/Toast';
import type { PlayerGoals, GoalMilestone } from '@/types';
import { GiMuscleUp, GiCoinsPile, GiSmartphone, GiTrophy } from 'react-icons/gi';
import { BsLightningChargeFill, BsPlusCircleFill } from 'react-icons/bs';
import { RiFlag2Fill, RiSaveLine } from 'react-icons/ri';

type PKey = 'bhuvi' | 'karthic';

const GOAL_CATS = [
  { key: 'fit' as keyof PlayerGoals, Icon: GiMuscleUp, iconColor: '#FF6B35', name: 'Physical Fitness', desc: 'Body transformation targets' },
  { key: 'fin' as keyof PlayerGoals, Icon: GiCoinsPile, iconColor: '#FFD700', name: 'Financial Goals', desc: 'Debt, savings & wealth milestones' },
  { key: 'soc' as keyof PlayerGoals, Icon: GiSmartphone, iconColor: '#4ECDC4', name: 'Social Media', desc: 'Follower growth targets' },
];

const MS_META: Record<string, { color: string; glow: string; label: string; bg: string; border: string }> = {
  'ms-now': { color: '#2ED573', glow: 'rgba(46,213,115,0.5)',   label: 'NOW',  bg: 'rgba(46,213,115,0.08)',   border: 'rgba(46,213,115,0.2)' },
  'ms-1m':  { color: '#FF6B35', glow: 'rgba(255,107,53,0.5)',   label: '1 MO', bg: 'rgba(255,107,53,0.08)',   border: 'rgba(255,107,53,0.2)' },
  'ms-3m':  { color: '#A78BFA', glow: 'rgba(167,139,250,0.5)',  label: '3 MO', bg: 'rgba(167,139,250,0.08)',  border: 'rgba(167,139,250,0.2)' },
  'ms-9m':  { color: '#FFD700', glow: 'rgba(255,215,0,0.5)',    label: '9 MO', bg: 'rgba(255,215,0,0.08)',    border: 'rgba(255,215,0,0.2)' },
};

export default function GoalsPage() {
  const { data: session } = useSession();
  const [activePlayer, setActivePlayer] = useState<PKey>('bhuvi');
  const [goals, setGoals] = useState<Record<PKey, PlayerGoals>>({
    bhuvi:   DEFAULT_GOALS.bhuvi,
    karthic: DEFAULT_GOALS.karthic,
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2400); };

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch('/api/goals?both=true');
      if (res.ok) {
        const data = await res.json();
        setGoals(prev => ({ bhuvi: data.bhuvi || prev.bhuvi, karthic: data.karthic || prev.karthic }));
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchGoals();
    if (session?.user?.username) setActivePlayer(session.user.username);
  }, [fetchGoals, session]);

  const handleChange = (cat: keyof PlayerGoals, idx: number, val: string) => {
    setGoals(prev => {
      const updated = { ...prev };
      updated[activePlayer] = { ...updated[activePlayer] };
      updated[activePlayer][cat] = [...updated[activePlayer][cat]];
      updated[activePlayer][cat][idx] = { ...updated[activePlayer][cat][idx], val };
      return updated;
    });
  };

  const handleAdd = (cat: keyof PlayerGoals) => {
    setGoals(prev => {
      const updated = { ...prev };
      updated[activePlayer] = { ...updated[activePlayer] };
      updated[activePlayer][cat] = [...updated[activePlayer][cat], { label: 'New target', val: '', cls: 'ms-9m' }];
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goals[activePlayer]),
      });
      if (res.ok) showToast('🎯 Goals saved!');
      else showToast('Failed to save. Try again.');
    } catch { showToast('Network error.'); }
    finally { setSaving(false); }
  };

  const cfg = PLAYER_CONFIG[activePlayer];
  const isOwn = session?.user?.username === activePlayer;
  const playerGoals = goals[activePlayer];

  return (
    <div>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 relative"
        style={{ background: 'linear-gradient(180deg, var(--bg2) 0%, var(--bg3) 100%)', borderBottom: '1px solid var(--border2)' }}
      >
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}25, transparent)` }} />
        <div className="flex items-center gap-2">
          <RiFlag2Fill size={18} style={{ color: 'var(--gold)' }} />
          <span className="font-bc font-black text-xl tracking-wider" style={{ color: 'var(--text)' }}>GOALS</span>
        </div>
        <div className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>9-month targets</div>
      </div>

      {/* Player Toggle */}
      <div className="px-4 pt-4 pb-2">
        <div className="player-toggle">
          {(['bhuvi', 'karthic'] as PKey[]).map(pk => {
            const c = PLAYER_CONFIG[pk];
            return (
              <button
                key={pk}
                className={`ptab ${activePlayer === pk ? (pk === 'bhuvi' ? 'active-b' : 'active-k') : ''}`}
                onClick={() => setActivePlayer(pk)}
              >
                {c.emoji} {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Viewing indicator */}
      {!isOwn && (
        <div
          className="mx-4 my-2 px-3 py-2 rounded-xl flex items-center gap-2"
          style={{ background: `${cfg.color}08`, border: `1px solid ${cfg.color}20` }}
        >
          <span style={{ fontSize: 14 }}>{cfg.emoji}</span>
          <span className="text-xs font-semibold" style={{ color: cfg.color }}>
            Viewing {cfg.name}&apos;s goals (read-only)
          </span>
        </div>
      )}

      {/* Goal Cards */}
      <div className="px-4 pb-4 space-y-4 mt-2">
        {GOAL_CATS.map(cat => {
          const milestones = playerGoals[cat.key] as GoalMilestone[];

          return (
            <div
              key={cat.key}
              className="rounded-2xl overflow-hidden relative"
              style={{
                background: `linear-gradient(145deg, ${cat.iconColor}05, var(--bg2))`,
                border: `1px solid ${cat.iconColor}15`,
                boxShadow: `0 0 20px ${cat.iconColor}06`,
              }}
            >
              {/* Top shine */}
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${cat.iconColor}25, transparent)` }} />

              {/* Card header */}
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `${cat.iconColor}12`,
                    border: `1px solid ${cat.iconColor}25`,
                    boxShadow: `0 0 14px ${cat.iconColor}20`,
                  }}
                >
                  <cat.Icon size={20} style={{ color: cat.iconColor }} />
                </div>
                <div className="flex-1">
                  <div className="font-bc font-black text-base" style={{ color: 'var(--text)' }}>{cat.name}</div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>{cat.desc}</div>
                </div>
                <div className="flex items-center gap-1">
                  <BsLightningChargeFill size={10} style={{ color: 'var(--gold)' }} />
                  <span className="font-bc font-bold text-xs" style={{ color: 'var(--gold)' }}>
                    {milestones.length}
                  </span>
                </div>
              </div>

              {/* Timeline track */}
              <div className="px-4 pt-3 pb-1">
                <div className="relative h-1.5 rounded-full mb-3"
                  style={{ background: 'var(--bg4)', overflow: 'hidden' }}>
                  <div className="absolute inset-0 rounded-full"
                    style={{ background: `linear-gradient(90deg, #2ED573, #FF6B35, #A78BFA, #FFD700)`, opacity: 0.6 }} />
                </div>
                <div className="flex justify-between mb-3">
                  {Object.entries(MS_META).map(([key, m]) => (
                    <div
                      key={key}
                      className="font-bc font-black text-xs px-1.5 py-0.5 rounded-full"
                      style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}`, fontSize: 10 }}
                    >
                      {m.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Milestone rows */}
              <div className="pb-2">
                {milestones.map((ms, idx) => {
                  const meta = MS_META[ms.cls] || MS_META['ms-9m'];
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 px-4 py-2.5"
                      style={{ borderBottom: idx < milestones.length - 1 ? '1px solid rgba(28,32,53,0.5)' : 'none' }}
                    >
                      {/* Dot */}
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: meta.color, boxShadow: `0 0 8px ${meta.glow}` }}
                      />

                      {/* Timeline label */}
                      <div
                        className="font-bc font-black text-xs px-1.5 py-0.5 rounded-md flex-shrink-0"
                        style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, fontSize: 9, minWidth: 28, textAlign: 'center' }}
                      >
                        {meta.label}
                      </div>

                      {/* Label text */}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold truncate block" style={{ color: 'var(--text)' }}>
                          {ms.label}
                        </span>
                      </div>

                      {/* Value input */}
                      <input
                        value={ms.val}
                        disabled={!isOwn}
                        onChange={e => handleChange(cat.key, idx, e.target.value)}
                        className="g-inp"
                        placeholder="Target"
                        style={{
                          borderColor: ms.val ? `${meta.color}35` : undefined,
                          color: ms.val ? meta.color : undefined,
                          opacity: isOwn ? 1 : 0.55,
                          cursor: isOwn ? 'text' : 'default',
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Add milestone (own only) */}
              {isOwn && (
                <div className="px-4 pb-3">
                  <button
                    onClick={() => handleAdd(cat.key)}
                    className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                    style={{
                      background: 'var(--bg4)',
                      border: `1px dashed ${cat.iconColor}35`,
                      color: cat.iconColor,
                      cursor: 'pointer',
                    }}
                  >
                    <BsPlusCircleFill size={12} />
                    Add milestone
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Save Button (own player only) */}
        {isOwn && (
          <button
            onClick={handleSave}
            disabled={saving}
            className={activePlayer === 'bhuvi' ? 'btn-primary-b' : 'btn-primary-k'}
            style={{
              width: '100%',
              opacity: saving ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {saving ? (
              <><BsLightningChargeFill size={16} style={{ animation: 'spin-slow 1s linear infinite' }} /> SAVING...</>
            ) : (
              <><RiSaveLine size={16} /> SAVE {cfg.name.toUpperCase()}&apos;S GOALS</>
            )}
          </button>
        )}

        {/* Decorative bottom */}
        <div
          className="flex items-center justify-center gap-2 py-2"
          style={{ color: 'var(--muted2)', fontSize: 12 }}
        >
          <GiTrophy size={12} style={{ color: 'var(--gold)', opacity: 0.5 }} />
          <span className="font-bc font-bold text-xs tracking-widest" style={{ opacity: 0.5 }}>
            9 MONTHS · 1 LEGEND
          </span>
          <GiTrophy size={12} style={{ color: 'var(--gold)', opacity: 0.5 }} />
        </div>
      </div>

      {toast && <Toast message={toast} />}
    </div>
  );
}
