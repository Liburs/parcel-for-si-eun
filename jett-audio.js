// Original synthesized firearm effects: transient, low-frequency body and mechanical tail.
// Effects have their own mixer; muting background music must not mute the weapon.
export function createGunAudio(context, getVolume) {
  if (!context) return { fire() {}, stop() {}, dispose() {} };
  const active = new Set(), cache = new Map();
  const master = context.createGain(), limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -9; limiter.knee.value = 8;
  limiter.ratio.value = 5; limiter.attack.value = .002; limiter.release.value = .1;
  master.connect(limiter); limiter.connect(context.destination);
  let disposed = false;
  function buffer(weapon) {
    if (cache.has(weapon)) return cache.get(weapon);
    const spec = weapon === 'Operator' ? [.85, 68, .115, .07, .19] : weapon === 'Sheriff' ? [.48, 110, .075, .038, .11] : [.3, 145, .043, .022, .075];
    const [duration, frequency, bodyDecay, crackDecay, boltTime] = spec;
    const data = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
    const channel = data.getChannelData(0);
    let seed = 918273, low = 0, peak = 0;
    const noise = () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 2147483648 - 1; };
    for (let i = 0; i < channel.length; i++) {
      const t = i / context.sampleRate, n = noise(); low += (n - low) * .13;
      const attack = Math.min(1, t / .0007);
      const crack = (n - low * .6) * Math.exp(-t / crackDecay);
      const body = Math.sin(2 * Math.PI * (frequency * t + 8 * (1 - Math.exp(-t * 35)))) * Math.exp(-t / bodyDecay);
      const echo = t > .032 ? low * .55 * Math.exp(-(t - .032) / (bodyDecay * 2)) : 0;
      const bolt = t > boltTime ? (n * .6 + Math.sin(t * 9500) * .25) * Math.exp(-(t - boltTime) / .013) : 0;
      channel[i] = attack * (crack * .85 + body * .65 + echo + bolt * .22);
      peak = Math.max(peak, Math.abs(channel[i]));
    }
    for (let i = 0; i < channel.length; i++) channel[i] *= .94 / peak;
    cache.set(weapon, data); return data;
  }
  // Build buffers before the first click so the shot has no decode/network delay.
  ['Sheriff', 'Vandal', 'Operator'].forEach(buffer);
  function fire(weapon, { enemy = false, distance = 0, pan = 0 } = {}) {
    if (disposed) return;
    if (context.state === 'suspended') context.resume().catch(() => {});
    master.gain.setValueAtTime(getVolume(), context.currentTime);
    const source = context.createBufferSource(), gain = context.createGain(), stereo = context.createStereoPanner();
    source.buffer = buffer(weapon);
    gain.gain.value = enemy ? Math.max(.16, .65 / (1 + distance / 18)) : .85;
    stereo.pan.value = Math.max(-1, Math.min(1, pan));
    source.connect(gain); gain.connect(stereo); stereo.connect(master);
    const item = { source, gain, stereo }; active.add(item);
    source.onended = () => { source.disconnect(); gain.disconnect(); stereo.disconnect(); active.delete(item); };
    source.start();
  }
  function stop() {
    for (const item of active) { try { item.source.stop(); } catch {} item.source.disconnect(); item.gain.disconnect(); item.stereo.disconnect(); }
    active.clear();
  }
  return { fire, stop, dispose() { disposed = true; stop(); master.disconnect(); limiter.disconnect(); cache.clear(); } };
}
