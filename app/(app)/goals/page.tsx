'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { DEFAULT_GOALS, PLAYER_CONFIG } from '@/lib/constants';
import Toast from '@/components/Toast';
import type { PlayerGoals, GoalMilestone } from '@/types';
import { GiMuscleUp, GiCoinsPile, GiSmartphone, GiTrophy } from 'react-icons/gi';
import { BsPlusCircleFill } from 'react-icons/bs';
import { RiFlag2Fill, RiDeleteBin6Line } from 'react-icons/ri';
import { FiCheck } from 'react-icons/fi';

type PKey = 'bhuvi' | 'karthic';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const GOAL_CATS = [
  { key: 'fit' as keyof PlayerGoals, Icon: GiMuscleUp,   iconColor: '#FF6B35', name: 'Physical Fitness', desc: 'Body transformation' },
  { key: 'fin' as keyof PlayerGoals, Icon: GiCoinsPile,  iconColor: '#FFD700', name: 'Financial Goals',  desc: 'Savings & debt milestones' },
  { key: 'soc' as keyof PlayerGoals, Icon: GiSmartphone, iconColor: '#4ECDC4', name: 'Social Media',     desc: 'Follower growth' },
];

const CLS_ORDER: GoalMilestone['cls'][] = ['ms-now', 'ms-1m', 'ms-3m', 'ms-9m'];

const MS_META: Record<string, { color: string; glow: string; label: string; bg: string; border: string }> = {
  'ms-now': { color: '#2ED573', glow: 'rgba(46,213,115,0.5)',  label: 'NOW',  bg: 'rgba(46,213,115,0.1)',  border: 'rgba(46,213,115,0.3)' },
  'ms-1m':  { color: '#FF6B35', glow: 'rgba(255,107,53,0.5)',  label: '1 MO', bg: 'rgba(255,107,53,0.1)',  border: 'rgba(255,107,53,0.3)' },
  'ms-3m':  { color: '#A78BFA', glow: 'rgba(167,139,250,0.5)', label: '3 MO', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.3)' },
  'ms-9m':  { color: '#FFD700', glow: 'rgba(255,215,0,0.5)',   label: '9 MO', bg: 'rgba(255,215,0,0.1)',   border: 'rgba(255,215,0,0.3)' },
};

// Deep-clone goals so players never share the same reference
function cloneGoals(g: PlayerGoals): PlayerGoals {
  return { fit: g.fit.map(m => ({ ...m })), fin: g.fin.map(m => ({ ...m })), soc: g.soc.map(m => ({ ...m })) };
}

export default function GoalsPage() {
  const { data: session } = useSession();
  const [activePlayer, setActivePlayer] = useState<PKey>('bhuvi');
  const [goals, setGoals] = useState<Record<PKey, PlayerGoals>>({
    bhuvi:   cloneGoals(DEFAULT_GOALS.bhuvi),
    karthic: cloneGoals(DEFAULT_GOALS.karthic),
  });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [toast, setToast] = useState('');

  const saveTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchedRef     = useRef(false);

  const ownPlayer = session?.user?.username as PKey | undefined;
  const isOwn     = ownPlayer === activePlayer;

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2400); };

  // ── Fetch both players' goals once ───────────────────────────────────────────
  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch('/api/goals?both=true');
      if (!res.ok) return;
      const data = await res.json();
      setGoals(prev => ({
        bhuvi:   data.bhuvi   ? cloneGoals(data.bhuvi)   : prev.bhuvi,
        karthic: data.karthic ? cloneGoals(data.karthic) : prev.karthic,
      }));
    } catch { /* silent */ }
    finally { fetchedRef.current = true; }
  }, []);

  useEffect(() => {
    fetchGoals();
    if (session?.user?.username) setActivePlayer(session.user.username as PKey);
  }, [fetchGoals, session]);

  // ── Auto-save with 1.5 s debounce ────────────────────────────────────────────
  const scheduleAutoSave = useCallback((updatedGoals: PlayerGoals) => {
    if (!fetchedRef.current) return; // don't save during initial load
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('saving');
    saveTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/goals', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedGoals),
        });
        if (res.ok) {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } else {
          setSaveStatus('error');
          showToast('Failed to save. Try again.');
        }
      } catch {
        setSaveStatus('error');
        showToast('Network error.');
      }
    }, 1500);
  }, []);

  // ── Mutation helpers (own player only) ───────────────────────────────────────
  const mutate = (cat: keyof PlayerGoals, updater: (rows: GoalMilestone[]) => GoalMilestone[]) => {
    if (!isOwn) return;
    setGoals(prev => {
      const updated: PlayerGoals = { ...prev[activePlayer], [cat]: updater([...prev[activePlayer][cat]]) };
      scheduleAutoSave(updated);
      return { ...prev, [activePlayer]: updated };
    });
  };

  const handleChange = (cat: keyof PlayerGoals, idx: number, field: 'label' | 'val', value: string) =>
    mutate(cat, rows => rows.map((r, i) => i === idx ? { ...r, [field]: value } : r));

  const handleCycleCls = (cat: keyof PlayerGoals, idx: number) =>
    mutate(cat, rows => rows.map((r, i) => {
      if (i !== idx) return r;
      const next = (CLS_ORDER.indexOf(r.cls) + 1) % CLS_ORDER.length;
      return { ...r, cls: CLS_ORDER[next] };
    }));

  const handleAdd = (cat: keyof PlayerGoals) =>
    mutate(cat, rows => [...rows, { label: '', val: '', cls: 'ms-9m' }]);

  const handleDelete = (cat: keyof PlayerGoals, idx: number) =>
    mutate(cat, rows => rows.filter((_, i) => i !== idx));

  const handleClearAll = (cat: keyof PlayerGoals) =>
    mutate(cat, () => []);

  const cfg          = PLAYER_CONFIG[activePlayer];
  const playerGoals  = goals[activePlayer];

  return (
    <div>
      {/* ── Header ───────────────────────────────────────────────────── */}
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

        {/* Auto-save status pill */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{
            background: saveStatus === 'saved'
              ? 'rgba(46,213,115,0.1)'
              : saveStatus === 'error'
              ? 'rgba(255,71,87,0.1)'
              : 'var(--bg4)',
            border: `1px solid ${saveStatus === 'saved' ? 'rgba(46,213,115,0.25)' : saveStatus === 'error' ? 'rgba(255,71,87,0.25)' : 'var(--border2)'}`,
            transition: 'all 0.3s',
          }}
        >
          {saveStatus === 'saving' && (
            <><span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>saving…</span></>
          )}
          {saveStatus === 'saved' && (
            <><FiCheck size={11} style={{ color: 'var(--green)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--green)' }}>saved</span></>
          )}
          {saveStatus === 'error' && (
            <span className="text-xs font-semibold" style={{ color: 'var(--red)' }}>save failed</span>
          )}
          {saveStatus === 'idle' && (
            <span className="text-xs font-semibold" style={{ color: 'var(--muted2)' }}>9-month targets</span>
          )}
        </div>
      </div>

      {/* ── Player Toggle ─────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-2">
        <div className="player-toggle">
          {(['bhuvi', 'karthic'] as PKey[]).map(pk => {
            const c = PLAYER_CONFIG[pk];
            return (
              <button
                key={pk}
                className={`ptab ${activePlayer === pk ? (pk === 'bhuvi' ? 'active-b' : 'active-k') : ''}`}
                onClick={() => { setActivePlayer(pk); setSaveStatus('idle'); }}
              >
                {c.emoji} {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Viewing other player — read-only banner */}
      {!isOwn && (
        <div className="mx-4 my-2 px-3 py-2 rounded-xl flex items-center gap-2"
          style={{ background: `${cfg.color}08`, border: `1px solid ${cfg.color}20` }}>
          <span style={{ fontSize: 14 }}>{cfg.emoji}</span>
          <span className="text-xs font-semibold" style={{ color: cfg.color }}>
            Viewing {cfg.name}&apos;s goals (read-only)
          </span>
        </div>
      )}

      {/* ── Goal Categories ───────────────────────────────────────────── */}
      <div className="px-4 pb-6 space-y-4 mt-2">
        {GOAL_CATS.map(cat => {
          const milestones = playerGoals[cat.key] as GoalMilestone[];
          const filled = milestones.filter(m => m.label || m.val).length;

          return (
            <div
              key={cat.key}
              className="rounded-2xl overflow-hidden relative"
              style={{
                background: `linear-gradient(145deg, ${cat.iconColor}05, var(--bg2))`,
                border: `1px solid ${cat.iconColor}18`,
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${cat.iconColor}28, transparent)` }} />

              {/* Card header */}
              <div className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${cat.iconColor}12`, border: `1px solid ${cat.iconColor}22` }}>
                  <cat.Icon size={20} style={{ color: cat.iconColor }} />
                </div>
                <div className="flex-1">
                  <div className="font-bc font-black text-base" style={{ color: 'var(--text)' }}>{cat.name}</div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>{cat.desc}</div>
                </div>
                <div className="flex items-center gap-2">
                  {filled > 0 && (
                    <div className="font-bc font-bold text-xs px-2 py-0.5 rounded-full"
                      style={{ background: `${cat.iconColor}12`, color: cat.iconColor, border: `1px solid ${cat.iconColor}22` }}>
                      {filled} set
                    </div>
                  )}
                  {isOwn && milestones.length > 0 && (
                    <button
                      onClick={() => handleClearAll(cat.key)}
                      title="Clear all rows"
                      style={{
                        width: 26, height: 26, borderRadius: 7,
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        color: 'var(--muted2)',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, transition: 'all 0.18s',
                      }}
                      onMouseEnter={e => { Object.assign(e.currentTarget.style, { borderColor: 'var(--red)', color: 'var(--red)', background: 'rgba(255,71,87,0.08)' }); }}
                      onMouseLeave={e => { Object.assign(e.currentTarget.style, { borderColor: 'var(--border)', color: 'var(--muted2)', background: 'transparent' }); }}
                    >
                      <RiDeleteBin6Line size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Column headers — shown only when rows exist */}
              {milestones.length > 0 && (
                <div
                  className="grid items-center gap-2 px-4 py-2"
                  style={{
                    gridTemplateColumns: isOwn ? '46px 1fr 110px 30px' : '46px 1fr 110px',
                    borderBottom: '1px solid rgba(28,32,53,0.6)',
                  }}
                >
                  <span className="font-bc font-bold text-xs" style={{ color: 'var(--muted2)' }}>WHEN</span>
                  <span className="font-bc font-bold text-xs" style={{ color: 'var(--muted2)' }}>LABEL</span>
                  <span className="font-bc font-bold text-xs text-right" style={{ color: 'var(--muted2)' }}>VALUE</span>
                  {isOwn && <span />}
                </div>
              )}

              {/* Empty state */}
              {milestones.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm font-semibold" style={{ color: 'var(--muted2)' }}>
                    {isOwn ? 'No goals yet — tap + Add below' : 'No goals set'}
                  </p>
                </div>
              )}

              {/* Rows */}
              <div>
                {milestones.map((ms, idx) => {
                  const meta = MS_META[ms.cls] || MS_META['ms-9m'];
                  return (
                    <div
                      key={idx}
                      className="grid items-center gap-2 px-4 py-2.5"
                      style={{
                        gridTemplateColumns: isOwn ? '46px 1fr 110px 30px' : '46px 1fr 110px',
                        borderBottom: idx < milestones.length - 1 ? '1px solid rgba(28,32,53,0.55)' : 'none',
                        background: ms.val ? `${meta.color}03` : 'transparent',
                      }}
                    >
                      {/* Clickable timeline badge — tap to cycle */}
                      <button
                        onClick={() => handleCycleCls(cat.key, idx)}
                        disabled={!isOwn}
                        title={isOwn ? 'Tap to change timeline' : undefined}
                        className="font-bc font-black rounded-lg"
                        style={{
                          background: meta.bg,
                          color: meta.color,
                          border: `1px solid ${meta.border}`,
                          fontSize: 9,
                          padding: '4px 6px',
                          cursor: isOwn ? 'pointer' : 'default',
                          textAlign: 'center',
                          letterSpacing: '0.3px',
                          transition: 'box-shadow 0.2s',
                          boxShadow: isOwn ? `0 0 6px ${meta.glow}` : 'none',
                          width: '100%',
                        }}
                      >
                        {meta.label}
                        {isOwn && <span style={{ opacity: 0.5, fontSize: 8, display: 'block', lineHeight: 1, marginTop: 1 }}>tap ↻</span>}
                      </button>

                      {/* Label — editable input when own, plain text otherwise */}
                      {isOwn ? (
                        <input
                          value={ms.label}
                          onChange={e => handleChange(cat.key, idx, 'label', e.target.value)}
                          placeholder="e.g. Current weight"
                          style={{
                            background: 'var(--bg4)',
                            border: '1px solid var(--border2)',
                            borderRadius: 8,
                            color: 'var(--text)',
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 13,
                            fontWeight: 500,
                            outline: 'none',
                            width: '100%',
                            padding: '7px 10px',
                            transition: 'border-color 0.2s',
                          }}
                          onFocus={e => { e.currentTarget.style.borderColor = cat.iconColor + '55'; }}
                          onBlur={e => { e.currentTarget.style.borderColor = 'var(--border2)'; }}
                        />
                      ) : (
                        <span className="text-sm font-semibold truncate" style={{ color: ms.label ? 'var(--text)' : 'var(--muted2)' }}>
                          {ms.label || '—'}
                        </span>
                      )}

                      {/* Value input */}
                      <input
                        value={ms.val}
                        disabled={!isOwn}
                        onChange={e => handleChange(cat.key, idx, 'val', e.target.value)}
                        placeholder="Value"
                        style={{
                          background: ms.val ? `${meta.color}08` : 'var(--bg4)',
                          border: `1px solid ${ms.val ? meta.color + '40' : 'var(--border2)'}`,
                          borderRadius: 8,
                          color: ms.val ? meta.color : 'var(--muted)',
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 13,
                          fontWeight: 600,
                          outline: 'none',
                          width: '100%',
                          padding: '7px 10px',
                          textAlign: 'right',
                          opacity: isOwn ? 1 : 0.6,
                          cursor: isOwn ? 'text' : 'default',
                          transition: 'all 0.2s',
                        }}
                        onFocus={e => { if (isOwn) e.currentTarget.style.borderColor = meta.color + '70'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = ms.val ? meta.color + '40' : 'var(--border2)'; }}
                      />

                      {/* Delete */}
                      {isOwn && (
                        <button
                          onClick={() => handleDelete(cat.key, idx)}
                          style={{
                            width: 30, height: 30, borderRadius: 8,
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            color: 'var(--muted2)',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, transition: 'all 0.18s',
                          }}
                          onMouseEnter={e => { Object.assign(e.currentTarget.style, { borderColor: 'var(--red)', color: 'var(--red)', background: 'rgba(255,71,87,0.08)' }); }}
                          onMouseLeave={e => { Object.assign(e.currentTarget.style, { borderColor: 'var(--border)', color: 'var(--muted2)', background: 'transparent' }); }}
                        >
                          <RiDeleteBin6Line size={13} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add row */}
              {isOwn && (
                <div className="px-4 py-3" style={{ borderTop: milestones.length > 0 ? '1px solid rgba(28,32,53,0.5)' : 'none' }}>
                  <button
                    onClick={() => handleAdd(cat.key)}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                    style={{
                      background: 'var(--bg4)',
                      border: `1px dashed ${cat.iconColor}40`,
                      color: cat.iconColor,
                      cursor: 'pointer',
                    }}
                  >
                    <BsPlusCircleFill size={12} />
                    Add goal row
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <div className="flex items-center justify-center gap-2 py-2">
          <GiTrophy size={12} style={{ color: 'var(--gold)', opacity: 0.45 }} />
          <span className="font-bc font-bold text-xs tracking-widest" style={{ color: 'var(--muted2)', opacity: 0.5 }}>
            9 MONTHS · 1 LEGEND
          </span>
          <GiTrophy size={12} style={{ color: 'var(--gold)', opacity: 0.45 }} />
        </div>
      </div>

      {toast && <Toast message={toast} />}
    </div>
  );
}
