'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Radio,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  Plane,
  Clock,
  Key,
  Copy,
  Check,
  Shield,
  AlertTriangle,
  Flame,
  ArrowRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { fetchMarketingRadarPreview, MarketingRadarData } from '@/lib/api';

const DEFAULT_STREAMER_KEY = 'skyrush_streamer_2026';

function StreamerHudContent() {
  const searchParams = useSearchParams();
  const urlKey = searchParams.get('key') || '';

  const [streamerKey, setStreamerKey] = useState(urlKey || DEFAULT_STREAMER_KEY);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [data, setData] = useState<MarketingRadarData | null>(null);
  const [connected, setConnected] = useState(false);
  const [stealthMode, setStealthMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const prevRoundRef = useRef<number | null>(null);
  const lastSoundPlayedRef = useRef<{ round: number; type: string } | null>(null);

  // Synthesize Web Audio pings for streamer cues
  const playCueSound = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (_) {}
  }, [soundEnabled]);

  // Initial authentication & data load
  const loadData = useCallback(async (keyToUse: string) => {
    try {
      const res = await fetchMarketingRadarPreview(keyToUse);
      setData(res);
      setIsAuthorized(true);
      setAuthError(null);
    } catch (err: any) {
      // If we don't have a valid key and not logged in as admin
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
      if (!token && keyToUse !== DEFAULT_STREAMER_KEY) {
        setIsAuthorized(false);
        setAuthError(err?.message || 'Access Denied: Please provide a valid Streamer Access Key.');
      } else {
        // Retry with default streamer key
        try {
          const fallbackRes = await fetchMarketingRadarPreview(DEFAULT_STREAMER_KEY);
          setData(fallbackRes);
          setIsAuthorized(true);
          setStreamerKey(DEFAULT_STREAMER_KEY);
          setAuthError(null);
        } catch (_) {
          setIsAuthorized(false);
          setAuthError('Unauthorized: Enter valid Streamer Key or log into Admin Dashboard.');
        }
      }
    }
  }, []);

  useEffect(() => {
    const key = urlKey || localStorage.getItem('skyrush_streamer_key') || DEFAULT_STREAMER_KEY;
    setStreamerKey(key);
    loadData(key);
  }, [urlKey, loadData]);

  // WebSocket real-time subscription
  useEffect(() => {
    const s = getSocket();

    const subscribe = () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : undefined;
      s.emit('subscribeStreamerRadar', {
        token,
        key: streamerKey,
      });
      setConnected(true);
    };

    if (s.connected) {
      subscribe();
    }
    s.on('connect', subscribe);
    s.on('disconnect', () => setConnected(false));

    const handleUpdate = (update: MarketingRadarData) => {
      setData(update);
      setIsAuthorized(true);
      setConnected(true);

      // Audio Cue Logic
      if (update.status === 'waiting' && update.countdown <= 3 && update.countdown > 0) {
        const soundKey = `${update.roundNumber}_countdown_${update.countdown}`;
        if (!lastSoundPlayedRef.current || lastSoundPlayedRef.current.type !== soundKey) {
          playCueSound(600, 0.12);
          lastSoundPlayedRef.current = { round: update.roundNumber, type: soundKey };
        }
      } else if (update.status === 'playing') {
        // Approaching safe cashout target (between 80% and 85%)
        if (update.currentMultiplier >= update.safeCashoutTarget * 0.95 && update.currentMultiplier < update.safeCashoutTarget) {
          const soundKey = `${update.roundNumber}_approaching_cashout`;
          if (!lastSoundPlayedRef.current || lastSoundPlayedRef.current.type !== soundKey) {
            playCueSound(880, 0.25, 'triangle');
            lastSoundPlayedRef.current = { round: update.roundNumber, type: soundKey };
          }
        }
      }
    };

    s.on('marketingPreviewUpdate', handleUpdate);

    // Fallback polling every 3 seconds to guarantee freshness
    const interval = setInterval(() => {
      if (streamerKey) {
        fetchMarketingRadarPreview(streamerKey)
          .then((res) => {
            setData(res);
            setIsAuthorized(true);
          })
          .catch(() => {});
      }
    }, 3000);

    return () => {
      s.off('connect', subscribe);
      s.off('disconnect');
      s.off('marketingPreviewUpdate', handleUpdate);
      clearInterval(interval);
    };
  }, [streamerKey, playCueSound]);

  const handleCopyShareLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://admin.skyrush.cc';
    const link = `${origin}/streamer-hud?key=${encodeURIComponent(streamerKey)}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    const clean = keyInput.trim();
    setStreamerKey(clean);
    localStorage.setItem('skyrush_streamer_key', clean);
    loadData(clean);
  };

  // Multiplier formatting & tier colors
  const crashPoint = data?.crashPoint || 1.0;
  const currentMult = data?.currentMultiplier || 1.0;
  const safeCashout = data?.safeCashoutTarget || Math.max(1.15, parseFloat((crashPoint * 0.85).toFixed(2)));

  const getTierInfo = (multiplier: number) => {
    if (multiplier >= 20.0) {
      return {
        label: 'EPIC MOONSHOT 🚀',
        color: 'from-amber-400 via-rose-500 to-purple-600',
        textColor: 'text-amber-300',
        borderColor: 'border-amber-500/40',
        glow: 'shadow-amber-500/30',
      };
    }
    if (multiplier >= 8.0) {
      return {
        label: 'MEGA MULTIPLIER ⚡',
        color: 'from-purple-500 to-indigo-500',
        textColor: 'text-purple-300',
        borderColor: 'border-purple-500/40',
        glow: 'shadow-purple-500/30',
      };
    }
    if (multiplier >= 3.5) {
      return {
        label: 'HIGH CRUISE WIN 🎯',
        color: 'from-emerald-500 to-teal-500',
        textColor: 'text-emerald-300',
        borderColor: 'border-emerald-500/40',
        glow: 'shadow-emerald-500/30',
      };
    }
    return {
      label: 'FAST HOP RUN 🛩️',
      color: 'from-sky-500 to-blue-600',
      textColor: 'text-sky-300',
      borderColor: 'border-sky-500/40',
      glow: 'shadow-sky-500/30',
    };
  };

  const tier = getTierInfo(crashPoint);

  // Flight progress % (clamped 0 to 100)
  const flightProgress =
    data?.status === 'playing' && crashPoint > 1.0
      ? Math.min(100, Math.max(0, ((Math.log(currentMult) / Math.log(crashPoint)) * 100)))
      : data?.status === 'crashed'
      ? 100
      : 0;

  // Key Access Barrier if unauthorized
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-[#060911] flex items-center justify-center p-6 text-gray-100">
        <div className="w-full max-w-md bg-[#0c121e] border border-purple-500/20 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Radio className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Streamer Radar Telemetry</h2>
            <p className="text-xs text-gray-400 mt-1">Enter your Streamer Access Key to unlock the live crash radar</p>
          </div>

          {authError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2 text-left">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleKeySubmit} className="space-y-4">
            <div className="relative">
              <Key className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="e.g. skyrush_streamer_2026"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs transition-all shadow-lg shadow-purple-600/30 active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Unlock Streamer Radar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-[11px] text-gray-500">
            Default Key: <code className="text-purple-300 font-mono">skyrush_streamer_2026</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#070b14] text-gray-100 font-sans selection:bg-purple-600 selection:text-white transition-all ${isFullscreen ? 'p-4 md:p-6' : 'space-y-6'}`}>
      {/* Top Telemetry Header */}
      <div className="bg-[#0d1424]/90 backdrop-blur-2xl border border-white/5 rounded-3xl p-5 md:p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
            <Radio className="w-6 h-6 text-white animate-pulse" />
            {connected && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#070b14] rounded-full" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                MARKETING ISOLATED STUDIO
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${connected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                {connected ? '● LIVE RADAR ACTIVE' : '○ CONNECTING...'}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white mt-0.5 flex items-center gap-2">
              <span>Streamer Telemetry HUD</span>
            </h1>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Stealth Mode */}
          <button
            onClick={() => setStealthMode((prev) => !prev)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
              stealthMode
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-lg shadow-rose-950/30'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
            }`}
            title="Blurs multiplier numbers to prevent accidental screen leaks"
          >
            {stealthMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{stealthMode ? 'Stealth ON' : 'Stealth Off'}</span>
          </button>

          {/* Sound Cues */}
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
              soundEnabled
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : 'bg-white/5 hover:bg-white/10 text-gray-400 border-white/10'
            }`}
            title="Audio beeps when approaching crash or cashout window"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Audio Cue' : 'Muted'}</span>
          </button>

          {/* Fullscreen Mode */}
          <button
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-all"
            title="Toggle fullscreen HUD view"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isFullscreen ? 'Compact' : 'Full Screen'}</span>
          </button>

          {/* Copy Share Link */}
          <button
            onClick={handleCopyShareLink}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/20 transition-all active:scale-95"
            title="Copies standalone streamer URL for 2nd monitor or phone"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Link Copied!' : 'Copy HUD Link'}</span>
          </button>
        </div>
      </div>

      {/* Main Radar Telemetry Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* HERO CARD 1: Pre-Revealed Crash Target */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0f172a] to-[#080d19] border border-purple-500/30 p-6 md:p-8 shadow-2xl flex flex-col justify-between">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Label & Round Number */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Sparkles className="w-4 h-4 animate-spin-slow" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">
                  Next Predicted Target (Revealed in Advance)
                </span>
                <span className="text-xs font-bold text-purple-300">
                  Round #{data?.roundNumber || '--'}
                </span>
              </div>
            </div>

            {/* Status Pill */}
            <div>
              {data?.status === 'waiting' && (
                <span className="px-3 py-1 rounded-xl text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 animate-pulse">
                  <Clock className="w-3.5 h-3.5" />
                  <span>COUNTDOWN: {data.countdown}s</span>
                </span>
              )}
              {data?.status === 'playing' && (
                <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 animate-pulse">
                  <Plane className="w-3.5 h-3.5" />
                  <span>IN FLIGHT (AIRBORNE)</span>
                </span>
              )}
              {data?.status === 'crashed' && (
                <span className="px-3 py-1 rounded-xl text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>ROUND CRASHED</span>
                </span>
              )}
            </div>
          </div>

          {/* Big Multiplier Centerpiece */}
          <div className="py-8 md:py-12 text-center relative select-none">
            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase mb-3 border ${tier.borderColor} ${tier.textColor} bg-white/[0.02]`}>
              {tier.label}
            </span>

            <div className={`transition-all duration-300 ${stealthMode ? 'blur-xl select-none' : ''}`}>
              <div className="font-mono text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter bg-gradient-to-r from-white via-purple-100 to-purple-400 bg-clip-text text-transparent drop-shadow-2xl">
                {crashPoint.toFixed(2)}x
              </div>
            </div>

            <p className="text-xs text-gray-400 font-medium mt-3 max-w-md mx-auto">
              {data?.status === 'waiting'
                ? `Plane will launch in ${data.countdown} seconds and crash precisely at ${crashPoint.toFixed(2)}x.`
                : data?.status === 'playing'
                ? `Plane is live! Currently at ${currentMult.toFixed(2)}x climbing to ${crashPoint.toFixed(2)}x.`
                : `Round ended at ${crashPoint.toFixed(2)}x. Next round target preparing...`}
            </p>
          </div>

          {/* Flight Progress Bar */}
          <div className="space-y-2 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-gray-400 flex items-center gap-1.5 font-mono">
                <Plane className="w-3.5 h-3.5 text-purple-400" />
                <span>Live Multiplier: <strong className="text-white text-sm">{currentMult.toFixed(2)}x</strong></span>
              </span>
              <span className="text-emerald-400 font-mono">
                Safe Cashout Zone: <strong>{safeCashout.toFixed(2)}x</strong> (~85%)
              </span>
            </div>

            {/* Interactive Progress Bar */}
            <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10 relative">
              {/* Safe Cashout Marker */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-emerald-400 shadow-md shadow-emerald-400 z-10"
                style={{ left: '85%' }}
                title="85% Safe Cashout Point"
              />
              <div
                className={`h-full rounded-full transition-all duration-100 bg-gradient-to-r ${tier.color} shadow-lg ${tier.glow}`}
                style={{ width: `${flightProgress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono">
              <span>Takeoff 1.00x</span>
              <span className="text-emerald-400">85% Cashout Mark ({safeCashout.toFixed(2)}x)</span>
              <span className="text-rose-400">Crash {crashPoint.toFixed(2)}x</span>
            </div>
          </div>
        </div>

        {/* HERO CARD 2: Strategic Telemetry Metrics */}
        <div className="space-y-6 flex flex-col justify-between">
          {/* Card: Safe Cashout Recommendation */}
          <div className="rounded-3xl bg-[#0f172a] border border-emerald-500/30 p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                  Recommended Cashout
                </span>
                <span className="text-lg font-black text-white">Safe Cashout Target</span>
              </div>
            </div>

            <div className={`mt-4 py-2 ${stealthMode ? 'blur-md select-none' : ''}`}>
              <div className="font-mono text-4xl md:text-5xl font-black text-emerald-400 flex items-baseline gap-2">
                <span>{safeCashout.toFixed(2)}x</span>
                <span className="text-xs text-gray-400 font-sans font-medium">Auto-win zone</span>
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Cashing out at or below <strong className="text-emerald-300 font-mono">{safeCashout.toFixed(2)}x</strong> ensures a high-drama win before the plane crashes at {crashPoint.toFixed(2)}x.
            </p>
          </div>

          {/* Card: Flight Timing & Estimated Duration */}
          <div className="rounded-3xl bg-[#0f172a] border border-white/5 p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                  Flight Telemetry
                </span>
                <span className="text-lg font-black text-white">Duration & Timing</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <span className="text-[11px] text-gray-400 block">Est. Flight Duration</span>
                <span className="text-xl font-black font-mono text-white mt-0.5 block">
                  ~{data?.estFlightDuration ? `${data.estFlightDuration}s` : '--'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <span className="text-[11px] text-gray-400 block">Est. Time Remaining</span>
                <span className="text-xl font-black font-mono text-purple-300 mt-0.5 block">
                  {data?.status === 'playing' ? `${data.remainingSeconds}s` : data?.status === 'waiting' ? `${data.countdown}s` : '0s'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-purple-500/5 border border-purple-500/20 text-xs text-gray-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-purple-300">
                <Zap className="w-3.5 h-3.5 fill-purple-400 text-purple-400" />
                <span>Auto-Win Accounts:</span>
              </span>
              <span className="font-mono font-black text-white">
                {data?.activeAutoWinBetsCount || 0} active bets scheduled
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Streamer Quick Tips Banner */}
      <div className="rounded-3xl bg-[#0c1322] border border-white/5 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>How to use this Streamer Radar like a Pro</span>
          </h4>
          <p className="text-xs text-gray-400 leading-relaxed max-w-3xl">
            Keep this window open on your <strong>second monitor, phone, or tablet</strong> while streaming. When the countdown starts, observe the <strong>Predicted Target</strong>. You can hype up your stream chat with predictions before cashout, while the system protects your gameplay!
          </p>
        </div>

        <div className="flex-shrink-0">
          <button
            onClick={handleCopyShareLink}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-200 flex items-center gap-2 transition-all"
          >
            <Key className="w-3.5 h-3.5 text-purple-400" />
            <span>Key: <code className="font-mono text-purple-300">{streamerKey}</code></span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StreamerHudPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    }>
      <StreamerHudContent />
    </Suspense>
  );
}
