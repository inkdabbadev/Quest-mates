'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { XP, PLAYER_CONFIG } from '@/lib/constants';
import UnlockPopup from '@/components/UnlockPopup';
import SpendDrama from '@/components/SpendDrama';
import Toast from '@/components/Toast';
import type { Checkpoint, LoggedFields as ILoggedFields } from '@/types';
import {
  GiMuscleUp, GiFootprint, GiWaterDrop, GiCoinsPile, GiFlame, GiSmartphone,
} from 'react-icons/gi';
import { BsLightningChargeFill, BsMoonStarsFill } from 'react-icons/bs';
import { RiCheckboxCircleFill, RiFireFill } from 'react-icons/ri';
import { FiTrendingUp } from 'react-icons/fi';

// ── Types ─────────────────────────────────────────────────────────────────────
interface LogState {
  workout: boolean; steps: string; water: string; sleep: string;
  savings: string; spend: string; followers: string;
}
interface XPTotals { fitness: number; finance: number; social: number; total: number; }
interface TodayLog {
  submitted: boolean; xp: XPTotals;
  fitness: { workout: boolean; steps: number; water: number; sleep: number };
  finance: { savings: number; spend: number };
  social: { followers: number };
  logged: ILoggedFields;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const EMPTY_LOG: LogState = {
  workout: false, steps: '', water: '', sleep: '',
  savings: '', spend: '', followers: '',
};
const EMPTY_LOGGED: ILoggedFields = {
  workout: false, steps: false, water: false,
  sleep: false, savings: false, followers: false,
};
const COL3 = '2fr 1fr 1fr';

// ── XP preview (client-side only, for display) ────────────────────────────────
function calcXPPreview(log: LogState): XPTotals {
  let fitness = 0, finance = 0, social = 0;
  if (log.workout) fitness += XP.WORKOUT;
  if ((+log.steps || 0) >= XP.STEPS_THRESHOLD) fitness += XP.STEPS;
  if ((+log.water || 0) >= XP.WATER_THRESHOLD) fitness += XP.WATER;
  if ((+log.savings || 0) > 0) finance += XP.SAVINGS;
  if ((+log.followers || 0) > 0) social += XP.FOLLOWERS;
  return { fitness, finance, social, total: fitness + finance + social };
}

// ── Activity definitions (for progress tracker) ───────────────────────────────
const ACTIVITIES = [
  { key: 'workout'   as keyof ILoggedFields, icon: '💪', label: 'Workout'   },
  { key: 'steps'     as keyof ILoggedFields, icon: '👟', label: 'Steps'     },
  { key: 'water'     as keyof ILoggedFields, icon: '💧', label: 'Water'     },
  { key: 'sleep'     as keyof ILoggedFields, icon: '🌙', label: 'Sleep'     },
  { key: 'savings'   as keyof ILoggedFields, icon: '💰', label: 'Savings'   },
  { key: 'followers' as keyof ILoggedFields, icon: '📱', label: 'Followers' },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function LogPage() {
  const { data: session } = useSession();

  const [myLog, setMyLog]             = useState<LogState>(EMPTY_LOG);
  const [xpPreview, setXpPreview]     = useState<XPTotals>({ fitness: 0, finance: 0, social: 0, total: 0 });
  const [todayLogged, setTodayLogged] = useState<ILoggedFields>(EMPTY_LOGGED);
  const [hasExisting, setHasExisting] = useState(false);
  const [spendOpen, setSpendOpen]     = useState(false);
  const [otherLog, setOtherLog]       = useState<TodayLog | null>(null);
  const [submitting, setSubmitting]   = useState(false);
  const [showDrama, setShowDrama]     = useState(false);
  const [dramaAmount, setDramaAmount] = useState(0);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [unlockCP, setUnlockCP]       = useState<Checkpoint | null>(null);
  const [toast, setToast]             = useState('');

  const myUsername    = session?.user?.username;
  const otherUsername = myUsername === 'bhuvi' ? 'karthic' : 'bhuvi';
  const myCfg         = myUsername ? PLAYER_CONFIG[myUsername] : PLAYER_CONFIG.bhuvi;
  const otherCfg      = PLAYER_CONFIG[otherUsername];

  // Derived
  const loggedCount = Object.values(todayLogged).filter(Boolean).length;
  const allDone     = loggedCount === 6;

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2800); };

  // ── Fetch & pre-populate form from today's saved log ─────────────────────
  const fetchTodayLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/log');
      if (!res.ok) return;
      const data = await res.json();

      const myData: TodayLog | undefined = data[myUsername!];
      if (myData?.submitted) {
        // Pre-populate every field from the server
        setMyLog({
          workout:   myData.fitness.workout,
          steps:     myData.fitness.steps     > 0 ? String(myData.fitness.steps)     : '',
          water:     myData.fitness.water     > 0 ? String(myData.fitness.water)     : '',
          sleep:     myData.fitness.sleep     > 0 ? String(myData.fitness.sleep)     : '',
          savings:   myData.finance.savings   > 0 ? String(myData.finance.savings)   : '',
          spend:     myData.finance.spend     > 0 ? String(myData.finance.spend)     : '',
          followers: myData.social.followers  > 0 ? String(myData.social.followers)  : '',
        });
        setTodayLogged(myData.logged ?? EMPTY_LOGGED);
        setHasExisting(true);
        if (myData.finance.spend > 0) setSpendOpen(true);
      }

      setOtherLog(data[otherUsername] ?? null);
    } catch { /* silent */ }
  }, [myUsername, otherUsername]);

  useEffect(() => { if (myUsername) fetchTodayLogs(); }, [fetchTodayLogs, myUsername]);
  useEffect(() => { setXpPreview(calcXPPreview(myLog)); }, [myLog]);

  // ── Build loggedFields: only fields that have actual values in the form ────
  const buildLoggedFields = (): string[] => {
    const lf: string[] = [];
    if (myLog.workout)          lf.push('workout');
    if (myLog.steps     !== '') lf.push('steps');
    if (myLog.water     !== '') lf.push('water');
    if (myLog.sleep     !== '') lf.push('sleep');
    if (myLog.savings   !== '') lf.push('savings');
    if (myLog.followers !== '') lf.push('followers');
    return lf;
  };

  // ── Has any new input to submit? ──────────────────────────────────────────
  const hasInput =
    myLog.workout ||
    myLog.steps     !== '' ||
    myLog.water     !== '' ||
    myLog.sleep     !== '' ||
    myLog.savings   !== '' ||
    myLog.spend     !== '' ||
    myLog.followers !== '';

  // ── Submit handlers ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!hasInput && !hasExisting) {
      showToast('Fill in at least one activity first!');
      return;
    }
    const spendAmt = +(myLog.spend) || 0;
    if (spendAmt > 0) { setDramaAmount(spendAmt); setShowDrama(true); setPendingSubmit(true); return; }
    await doSave();
  };

  const doSave = async () => {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        workout:      myLog.workout,
        loggedFields: buildLoggedFields(),
      };
      // Only send numeric fields that have a value (don't overwrite existing with blank)
      if (myLog.steps     !== '') payload.steps     = +myLog.steps     || 0;
      if (myLog.water     !== '') payload.water     = +myLog.water     || 0;
      if (myLog.sleep     !== '') payload.sleep     = +myLog.sleep     || 0;
      if (myLog.savings   !== '') payload.savings   = +myLog.savings   || 0;
      if (myLog.spend     !== '') payload.spend     = +myLog.spend     || 0;
      if (myLog.followers !== '') payload.followers = +myLog.followers || 0;

      const res = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const remaining = 6 - Object.values(data.logged as ILoggedFields).filter(Boolean).length;
        const msg = data.isAllLogged
          ? `🎉 All 6 done! ${data.xpEarned} XP total today — come back tomorrow!`
          : data.xpDiff > 0
            ? `⚡ +${data.xpDiff} XP! ${remaining} more to log today.`
            : `✅ Saved! ${remaining} more ${remaining === 1 ? 'activity' : 'activities'} to log today.`;
        showToast(msg);
        setTodayLogged(data.logged ?? EMPTY_LOGGED);
        setHasExisting(true);
        if (data.newCP !== undefined && data.newCP > data.prevCP) setUnlockCP(data.checkpoint);
        await fetchTodayLogs(); // re-populate form with saved values
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to save');
      }
    } catch { showToast('Network error — try again.'); }
    finally { setSubmitting(false); }
  };

  const handleDramaClose = async () => {
    setShowDrama(false);
    if (pendingSubmit) { setPendingSubmit(false); await doSave(); }
  };

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div>
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div
        className="px-4 pt-4 pb-3 relative"
        style={{
          background: 'linear-gradient(180deg, var(--bg2) 0%, var(--bg3) 100%)',
          borderBottom: '1px solid var(--border2)',
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${myCfg.color}35, transparent)` }}
        />
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BsLightningChargeFill size={15} style={{ color: 'var(--gold)' }} />
              <span className="font-bc font-black text-xl tracking-wider" style={{ color: 'var(--text)' }}>
                DAILY LOG
              </span>
            </div>
            <p className="text-xs font-semibold mt-0.5 capitalize" style={{ color: 'var(--muted)' }}>{today}</p>
          </div>
          {xpPreview.total > 0 && (
            <div className="xp-badge animate-slide-down">
              <BsLightningChargeFill size={11} />
              <span>+{xpPreview.total} XP</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Progress Tracker ─────────────────────────────────────────── */}
      <div className="mx-3 mt-3">
        {allDone ? (
          /* All done — celebration banner */
          <div
            className="rounded-2xl p-3.5 flex items-center gap-3 animate-slide-down"
            style={{
              background: 'linear-gradient(135deg, rgba(46,213,115,0.12), rgba(46,213,115,0.04))',
              border: '1px solid rgba(46,213,115,0.28)',
              boxShadow: '0 4px 20px rgba(46,213,115,0.08)',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
              style={{ background: 'rgba(46,213,115,0.15)', border: '1px solid rgba(46,213,115,0.3)' }}
            >
              🏆
            </div>
            <div>
              <p className="font-bc font-black text-sm" style={{ color: 'var(--green)' }}>
                All 6 activities logged!
              </p>
              <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--muted)' }}>
                You crushed today&apos;s log. Come back tomorrow!
              </p>
            </div>
          </div>
        ) : (
          /* Partial progress tracker */
          <div
            className="rounded-2xl p-3"
            style={{
              background: 'var(--bg2)',
              border: '1px solid var(--border2)',
            }}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="font-bc font-bold text-xs tracking-widest" style={{ color: 'var(--muted)' }}>
                TODAY&apos;S PROGRESS
              </span>
              <span
                className="font-bc font-black text-sm px-2 py-0.5 rounded-full"
                style={{
                  background: `${myCfg.color}12`,
                  color: myCfg.color,
                  border: `1px solid ${myCfg.color}25`,
                }}
              >
                {loggedCount}/6
              </span>
            </div>
            <div className="flex gap-1.5">
              {ACTIVITIES.map((act) => {
                const done = todayLogged[act.key];
                return (
                  <div
                    key={act.key}
                    className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all"
                    style={{
                      background: done ? `${myCfg.color}12` : 'var(--bg4)',
                      border: `1px solid ${done ? myCfg.color + '30' : 'var(--border)'}`,
                    }}
                  >
                    <span style={{ fontSize: 14, opacity: done ? 1 : 0.35 }}>{act.icon}</span>
                    {done && (
                      <RiCheckboxCircleFill size={10} style={{ color: myCfg.color }} />
                    )}
                    {!done && (
                      <div
                        className="rounded-full"
                        style={{ width: 6, height: 6, background: 'var(--border3)' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            {/* Progress bar */}
            <div className="mt-2.5 progress-track" style={{ height: 3 }}>
              <div
                className={myUsername === 'bhuvi' ? 'progress-fill-b' : 'progress-fill-k'}
                style={{ width: `${(loggedCount / 6) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Column Headers ────────────────────────────────────────────── */}
      <div
        className="grid px-3 py-2.5 gap-2 sticky top-0 z-20 mt-3"
        style={{
          gridTemplateColumns: COL3,
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
          <FiTrendingUp size={11} />
          <span className="font-bc font-bold text-xs tracking-widest">ACTIVITY</span>
        </div>
        <div className="text-center font-bc font-black text-sm" style={{ color: myCfg.color }}>
          {myCfg.emoji} {myCfg.name}
        </div>
        <div className="text-center font-bc font-black text-sm" style={{ color: otherCfg.color }}>
          {otherCfg.emoji} {otherCfg.name}
        </div>
      </div>

      {/* ── FITNESS ──────────────────────────────────────────────────── */}
      <CatHeader
        icon={<GiMuscleUp size={15} style={{ color: '#FF6B35' }} />}
        title="Fitness" category="fitness"
        myXP={xpPreview.fitness} otherXP={otherLog?.xp?.fitness ?? 0}
        myColor={myCfg.color} otherColor={otherCfg.color}
      />

      <LogRow
        label="Workout" xpLabel={`+${XP.WORKOUT} XP`}
        logged={todayLogged.workout} myColor={myCfg.color}
        icon={<GiMuscleUp size={13} style={{ color: 'var(--muted)' }} />}
        myCell={
          <button
            className={`tog-btn ${myLog.workout ? (myUsername === 'bhuvi' ? 'on-b' : 'on-k') : ''}`}
            onClick={() => setMyLog(l => ({ ...l, workout: !l.workout }))}
          >
            {myLog.workout ? <><RiCheckboxCircleFill size={13} /> Done</> : 'Did it?'}
          </button>
        }
        otherCell={
          otherLog
            ? <ReadonlyCell value={otherLog.fitness?.workout ? '✓ Done' : '—'} color={otherCfg.color} done={otherLog.fitness?.workout} />
            : <EmptyCell />
        }
      />

      <LogRow
        label="Steps" xpLabel={`+${XP.STEPS} if 8k+`}
        logged={todayLogged.steps} myColor={myCfg.color}
        icon={<GiFootprint size={13} style={{ color: 'var(--muted)' }} />}
        myCell={
          <NumberInput
            value={myLog.steps} placeholder="8000" unit="steps"
            active={(+myLog.steps || 0) >= 8000}
            color={myCfg.color}
            onChange={v => setMyLog(l => ({ ...l, steps: v }))}
          />
        }
        otherCell={
          otherLog
            ? <ReadonlyCell
                value={otherLog.fitness?.steps > 0 ? `${(otherLog.fitness.steps / 1000).toFixed(1)}k` : '—'}
                color={otherCfg.color} done={otherLog.fitness?.steps >= 8000}
              />
            : <EmptyCell />
        }
      />

      <LogRow
        label="Water" xpLabel={`+${XP.WATER} if 2L+`}
        logged={todayLogged.water} myColor={myCfg.color}
        icon={<GiWaterDrop size={13} style={{ color: '#4ECDC4' }} />}
        myCell={
          <NumberInput
            value={myLog.water} placeholder="0" unit="L" step="0.1"
            active={(+myLog.water || 0) >= 2}
            color={myCfg.color}
            onChange={v => setMyLog(l => ({ ...l, water: v }))}
          />
        }
        otherCell={
          otherLog
            ? <ReadonlyCell value={otherLog.fitness?.water > 0 ? `${otherLog.fitness.water}L` : '—'} color={otherCfg.color} done={otherLog.fitness?.water >= 2} />
            : <EmptyCell />
        }
      />

      <LogRow
        label="Sleep" xpLabel="Tracked"
        logged={todayLogged.sleep} myColor={myCfg.color}
        icon={<BsMoonStarsFill size={12} style={{ color: '#A78BFA' }} />}
        myCell={
          <NumberInput
            value={myLog.sleep} placeholder="0" unit="h" step="0.5"
            color={myCfg.color}
            onChange={v => setMyLog(l => ({ ...l, sleep: v }))}
          />
        }
        otherCell={
          otherLog
            ? <ReadonlyCell value={otherLog.fitness?.sleep > 0 ? `${otherLog.fitness.sleep}h` : '—'} color={otherCfg.color} />
            : <EmptyCell />
        }
      />

      {/* ── FINANCE ──────────────────────────────────────────────────── */}
      <CatHeader
        icon={<GiCoinsPile size={15} style={{ color: '#FFD700' }} />}
        title="Finance" category="finance"
        myXP={xpPreview.finance} otherXP={otherLog?.xp?.finance ?? 0}
        myColor={myCfg.color} otherColor={otherCfg.color}
      />

      <LogRow
        label="Saved today" xpLabel={`+${XP.SAVINGS} XP`}
        logged={todayLogged.savings} myColor={myCfg.color}
        icon={<GiCoinsPile size={13} style={{ color: '#FFD700' }} />}
        myCell={
          <NumberInput
            value={myLog.savings} placeholder="0" unit="₹"
            active={(+myLog.savings || 0) > 0}
            color={myCfg.color}
            onChange={v => setMyLog(l => ({ ...l, savings: v }))}
          />
        }
        otherCell={
          otherLog
            ? <ReadonlyCell value={otherLog.finance?.savings > 0 ? `₹${otherLog.finance.savings.toLocaleString('en-IN')}` : '—'} color={otherCfg.color} done={otherLog.finance?.savings > 0} />
            : <EmptyCell />
        }
      />

      {/* Spend toggle */}
      <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(28,32,53,0.7)' }}>
        <button
          className={`spend-toggle-btn ${spendOpen ? 'active' : ''}`}
          onClick={() => {
            setSpendOpen(o => !o);
            if (spendOpen) setMyLog(l => ({ ...l, spend: '' }));
          }}
        >
          <GiFlame size={15} />
          {spendOpen ? 'Cancel Spend' : 'Log Spend (Drama incoming 💀)'}
        </button>
      </div>

      {/* Spend row */}
      <div className={`spend-row-slide ${spendOpen ? 'open' : ''}`}>
        <LogRow
          label="Spent" xpLabel="drama 💀" isNeg
          logged={false} myColor={myCfg.color}
          icon={<RiFireFill size={13} style={{ color: 'var(--red)' }} />}
          myCell={
            <div className="relative">
              <input
                type="number" placeholder="0" inputMode="numeric"
                value={myLog.spend}
                onChange={e => setMyLog(l => ({ ...l, spend: e.target.value }))}
                className="qm-input qm-input-danger text-right"
                style={{ paddingRight: 26, fontSize: 14 }}
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: 'var(--red)' }}>₹</span>
            </div>
          }
          otherCell={<EmptyCell />}
        />
      </div>

      {/* ── SOCIAL ───────────────────────────────────────────────────── */}
      <CatHeader
        icon={<GiSmartphone size={15} style={{ color: '#4ECDC4' }} />}
        title="Social" category="social"
        myXP={xpPreview.social} otherXP={otherLog?.xp?.social ?? 0}
        myColor={myCfg.color} otherColor={otherCfg.color}
      />

      <LogRow
        label="Followers" xpLabel={`+${XP.FOLLOWERS} XP`}
        logged={todayLogged.followers} myColor={myCfg.color}
        icon={<GiSmartphone size={13} style={{ color: '#4ECDC4' }} />}
        myCell={
          <NumberInput
            value={myLog.followers} placeholder="0" unit="#"
            active={(+myLog.followers || 0) > 0}
            color={myCfg.color}
            onChange={v => setMyLog(l => ({ ...l, followers: v }))}
          />
        }
        otherCell={
          otherLog
            ? <ReadonlyCell value={otherLog.social?.followers > 0 ? otherLog.social.followers.toLocaleString('en-IN') : '—'} color={otherCfg.color} done={otherLog.social?.followers > 0} />
            : <EmptyCell />
        }
      />

      {/* ── XP Preview ───────────────────────────────────────────────── */}
      {xpPreview.total > 0 && (
        <div
          className="mx-3 mt-4 rounded-2xl overflow-hidden animate-slide-up"
          style={{
            background: 'linear-gradient(145deg, rgba(255,215,0,0.08), var(--bg3))',
            border: '1px solid rgba(255,215,0,0.18)',
            boxShadow: '0 0 24px rgba(255,215,0,0.06)',
          }}
        >
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center justify-center gap-2 mb-4">
              <BsLightningChargeFill size={13} style={{ color: 'var(--gold)' }} />
              <span className="font-bc font-black text-sm tracking-widest" style={{ color: 'var(--gold)' }}>
                {hasExisting ? 'UPDATED XP TOTAL' : 'XP PREVIEW'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: <GiMuscleUp size={16} />, label: 'Fitness', val: xpPreview.fitness, color: '#FF6B35' },
                { icon: <GiCoinsPile size={16} />, label: 'Finance', val: xpPreview.finance, color: '#FFD700' },
                { icon: <GiSmartphone size={16} />, label: 'Social', val: xpPreview.social, color: '#4ECDC4' },
              ].map(item => (
                <div
                  key={item.label}
                  className="text-center rounded-xl py-3"
                  style={{ background: `${item.color}08`, border: `1px solid ${item.color}18` }}
                >
                  <div style={{ color: item.color, display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{item.icon}</div>
                  <div className="font-bc font-black text-2xl" style={{ color: item.color }}>+{item.val}</div>
                  <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--muted)' }}>{item.label}</div>
                </div>
              ))}
            </div>
            <div
              className="mt-3 rounded-xl py-2.5 flex items-center justify-center gap-2"
              style={{ background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.12)' }}
            >
              <BsLightningChargeFill size={14} style={{ color: 'var(--gold)' }} />
              <span className="font-bc font-black text-2xl" style={{ color: 'var(--gold)' }}>+{xpPreview.total}</span>
              <span className="font-bc font-bold text-sm" style={{ color: 'var(--muted)' }}>TOTAL XP</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Submit Button ─────────────────────────────────────────────── */}
      <div className="px-3 mt-4 mb-6">
        <button
          onClick={handleSubmit}
          disabled={submitting || (!hasInput && !hasExisting)}
          className={myUsername === 'bhuvi' ? 'btn-primary-b' : 'btn-primary-k'}
          style={{
            width: '100%',
            opacity: (!hasInput && !hasExisting) || submitting ? 0.45 : 1,
            cursor: (!hasInput && !hasExisting) ? 'not-allowed' : 'pointer',
          }}
        >
          <span className="flex items-center justify-center gap-2">
            {submitting
              ? '⏳ Saving...'
              : hasExisting
                ? `${myCfg.emoji} Update Today's Log`
                : `${myCfg.emoji} Save ${myCfg.name}'s Log`}
          </span>
        </button>

        {!hasInput && !hasExisting && (
          <p className="text-center text-xs mt-2 font-medium" style={{ color: 'var(--muted2)' }}>
            Fill in at least one activity to save
          </p>
        )}

        {hasExisting && !allDone && (
          <p className="text-center text-xs mt-2 font-medium" style={{ color: 'var(--muted2)' }}>
            {6 - loggedCount} more {6 - loggedCount === 1 ? 'activity' : 'activities'} left to complete today
          </p>
        )}
      </div>

      <SpendDrama show={showDrama} amount={dramaAmount} player={myUsername || 'bhuvi'} onClose={handleDramaClose} />
      <UnlockPopup checkpoint={unlockCP} onClose={() => setUnlockCP(null)} />
      {toast && <Toast message={toast} />}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function CatHeader({
  icon, title, category, myXP, otherXP, myColor, otherColor,
}: {
  icon: React.ReactNode; title: string; category: string;
  myXP: number; otherXP: number; myColor: string; otherColor: string;
}) {
  return (
    <div className={`cat-section-header ${category}`} style={{ gridTemplateColumns: COL3 }}>
      <div className="flex items-center gap-2 relative z-10">
        {icon}
        <span className="font-bc font-black text-sm tracking-wider" style={{ color: 'var(--text)' }}>{title}</span>
      </div>
      <div className="text-center relative z-10">
        {myXP > 0 && (
          <span className="font-bc font-bold text-xs px-2 py-0.5 rounded-full"
            style={{ background: `${myColor}15`, color: myColor, border: `1px solid ${myColor}25` }}>
            +{myXP}
          </span>
        )}
      </div>
      <div className="text-center relative z-10">
        {otherXP > 0 && (
          <span className="font-bc font-bold text-xs px-2 py-0.5 rounded-full"
            style={{ background: `${otherColor}15`, color: otherColor, border: `1px solid ${otherColor}25` }}>
            +{otherXP}
          </span>
        )}
      </div>
    </div>
  );
}

function LogRow({
  label, xpLabel, isNeg, logged, myColor, icon, myCell, otherCell,
}: {
  label: string; xpLabel: string; isNeg?: boolean;
  logged: boolean; myColor: string;
  icon: React.ReactNode; myCell: React.ReactNode; otherCell: React.ReactNode;
}) {
  return (
    <div
      className="log-row-grid"
      style={{
        gridTemplateColumns: COL3,
        background: logged ? `${myColor}04` : undefined,
      }}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex-shrink-0">{icon}</div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold leading-tight" style={{ color: 'var(--text)' }}>{label}</span>
            {logged && !isNeg && (
              <RiCheckboxCircleFill size={11} style={{ color: myColor, flexShrink: 0 }} />
            )}
          </div>
          <div className="text-xs font-bold mt-0.5" style={{ color: isNeg ? 'var(--red)' : 'var(--muted2)' }}>
            {xpLabel}
          </div>
        </div>
      </div>
      <div>{myCell}</div>
      <div>{otherCell}</div>
    </div>
  );
}

function NumberInput({
  value, onChange, placeholder, unit, step, active, color,
}: {
  value: string; onChange: (v: string) => void; placeholder: string;
  unit: string; step?: string; active?: boolean; color: string;
}) {
  const pr = unit.length <= 1 ? 20 : unit.length <= 2 ? 24 : 36;
  return (
    <div className="relative">
      <input
        type="number"
        inputMode="numeric"
        step={step || '1'}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="qm-input text-right"
        style={{
          paddingRight: pr,
          fontSize: 14,
          borderColor: active ? color : undefined,
          boxShadow: active ? `0 0 8px ${color}25` : undefined,
          background: active ? `${color}08` : undefined,
        }}
      />
      {unit && (
        <span
          className="absolute right-1.5 top-1/2 -translate-y-1/2 font-bold pointer-events-none"
          style={{ fontSize: 11, color: active ? color : 'var(--muted)', lineHeight: 1 }}
        >
          {unit}
        </span>
      )}
    </div>
  );
}

function ReadonlyCell({ value, color, done }: { value: string; color: string; done?: boolean }) {
  return (
    <div
      className="w-full rounded-xl px-1.5 py-2 text-center font-bc font-bold transition-all"
      style={{
        fontSize: 12,
        background: done ? `${color}10` : 'var(--bg4)',
        border: `1px solid ${done ? color + '28' : 'var(--border2)'}`,
        color: done ? color : 'var(--muted)',
        boxShadow: done ? `0 0 8px ${color}12` : 'none',
        minHeight: 36,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {value}
    </div>
  );
}

function EmptyCell() {
  return (
    <div
      className="w-full rounded-xl px-1.5 py-2 text-center"
      style={{
        fontSize: 11, background: 'var(--bg4)', border: '1px solid var(--border)',
        color: 'var(--muted2)', minHeight: 36,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      —
    </div>
  );
}
