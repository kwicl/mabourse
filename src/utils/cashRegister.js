/**
 * Caisse enregistreuse ancienne : son synthétisé (Web Audio, aucun fichier) + signal d'animation.
 * Les montants avec `animate` ne défilent que juste après un enregistrement (pas lors d'un changement de période).
 */

let ctx = null;
let lastRing = 0;
const WINDOW_MS = 5000;

let unlocked = false;

/** WAV silencieux très court (généré, aucun fichier). */
function silentWavUrl() {
  const n = 800;
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const w = (o, str) => [...str].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
  w(0, 'RIFF');
  v.setUint32(4, 36 + n * 2, true);
  w(8, 'WAVEfmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true);
  v.setUint32(28, 16000, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  w(36, 'data');
  v.setUint32(40, n * 2, true);
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}

/**
 * iOS : le Web Audio est coupé par l'interrupteur silencieux et joue bas tant que la session
 * audio n'est pas en « lecture ». On la passe en lecture (Safari 17+) et, pour les versions
 * plus anciennes, on joue une fois un son HTML silencieux pendant le geste, ce qui a le même effet.
 */
function unlockIOS() {
  if (unlocked) return;
  unlocked = true;
  try {
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
  } catch {
    /* ignore */
  }
  try {
    const a = new Audio(silentWavUrl());
    a.setAttribute('playsinline', '');
    a.play()?.catch(() => {});
  } catch {
    /* ignore */
  }
}

/** À appeler pendant le geste utilisateur (avant tout await) pour débloquer l'audio sur mobile. */
export function primeAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    unlockIOS();
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
  } catch {
    /* audio indisponible */
  }
}

/** Arme le défilement avant l'enregistrement (la mise à jour locale peut précéder la fin de l'appel). */
export function armCash() {
  lastRing = Date.now();
  primeAudio();
}

/** Vrai si une opération vient d'être encaissée : les montants animés peuvent défiler. */
export const cashPending = () => Date.now() - lastRing < WINDOW_MS;

function noiseBuffer(c, seconds) {
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * seconds), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/** Clac mécanique bref (touche, cliquet). */
function clack(c, out, t, { freq = 2600, q = 3, gain = 0.5, dur = 0.035 } = {}) {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, dur);
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq;
  bp.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(bp).connect(g).connect(out);
  src.start(t);
  src.stop(t + dur + 0.01);
}

/** Cloche « ding » : partiels inharmoniques à décroissance exponentielle. */
function bell(c, out, t) {
  const base = 2093;
  [
    [1, 0.32, 1.6],
    [2.76, 0.12, 0.9],
    [5.4, 0.06, 0.45],
    [0.5, 0.05, 0.8],
  ].forEach(([ratio, amp, decay]) => {
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.value = base * ratio;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(amp, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + decay + 0.05);
  });
}

/** Tiroir-caisse qui s'ouvre : glissement grave + butée. */
function drawer(c, out, t) {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 0.32);
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(900, t);
  lp.frequency.linearRampToValueAtTime(350, t + 0.3);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.35, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  src.connect(lp).connect(g).connect(out);
  src.start(t);
  src.stop(t + 0.33);
  // Butée métallique
  const o = c.createOscillator();
  o.type = 'triangle';
  o.frequency.setValueAtTime(140, t + 0.3);
  o.frequency.exponentialRampToValueAtTime(60, t + 0.42);
  const og = c.createGain();
  og.gain.setValueAtTime(0.4, t + 0.3);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
  o.connect(og).connect(out);
  o.start(t + 0.3);
  o.stop(t + 0.47);
  clack(c, out, t + 0.3, { freq: 1200, q: 1.5, gain: 0.35, dur: 0.05 });
}

/** Joue la séquence complète et déclenche le défilement des montants. */
export function ringRegister() {
  lastRing = Date.now();
  primeAudio();
  if (!ctx) return;
  try {
    const c = ctx;
    // Chaîne de sortie : entrée -> compresseur (resserre les pics) -> gain de rattrapage.
    // Le son paraît nettement plus fort sans saturer.
    const out = c.createGain();
    out.gain.value = 1;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 6;
    comp.ratio.value = 12;
    comp.attack.value = 0.002;
    comp.release.value = 0.15;
    const makeup = c.createGain();
    makeup.gain.value = 7;
    out.connect(comp).connect(makeup).connect(c.destination);
    const t0 = c.currentTime + 0.02;
    // Frappe des touches
    [0, 0.09, 0.17].forEach((dt, i) => clack(c, out, t0 + dt, { freq: 2300 + i * 250, gain: 0.55 }));
    // Manivelle à cliquet
    for (let i = 0; i < 7; i++) clack(c, out, t0 + 0.3 + i * 0.045, { freq: 3400, q: 6, gain: 0.28, dur: 0.02 });
    // Ding + tiroir
    bell(c, out, t0 + 0.64);
    drawer(c, out, t0 + 0.68);
  } catch {
    /* audio indisponible */
  }
}
