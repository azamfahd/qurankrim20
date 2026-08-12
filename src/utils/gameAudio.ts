// Simple Web Audio API sound generator for games
let audioCtx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

const getNoiseBuffer = (ctx: AudioContext) => {
  if (!noiseBuffer) {
    const bufferSize = ctx.sampleRate * 2; 
    noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  return noiseBuffer;
};

export const playGameSound = (type: 'correct' | 'wrong' | 'win' | 'lost' | 'start') => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    // Resume context if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'correct') {
      // Happy high-pitched beep
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'wrong') {
      // Dull low-pitched buzz
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'start') {
      // Ascending start sound
      osc.type = 'square';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'win') {
      // Grand fanfare melody: C5 -> E5 -> G5 -> C6 (held longer)
      const playNote = (freq: number, startTime: number, duration = 0.4, vol = 0.3) => {
        const o = audioCtx!.createOscillator();
        const g = audioCtx!.createGain();
        o.type = 'triangle';
        o.frequency.value = freq;
        o.connect(g);
        g.connect(audioCtx!.destination);
        g.gain.setValueAtTime(vol, startTime);
        g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        o.start(startTime);
        o.stop(startTime + duration);
      };

      playNote(523.25, now, 0.25, 0.25);        // C5
      playNote(659.25, now + 0.15, 0.25, 0.25);  // E5
      playNote(783.99, now + 0.30, 0.25, 0.25);  // G5
      playNote(1046.50, now + 0.45, 1.2, 0.35);  // C6 (long triumphant note)
      playNote(659.25, now + 0.45, 1.2, 0.18);   // E5 harmony

      // Cheering & Clapping applause effect
      const nBuffer = getNoiseBuffer(audioCtx!);
      const playClap = (time: number, vol: number) => {
        const source = audioCtx!.createBufferSource();
        source.buffer = nBuffer;
        
        const filter = audioCtx!.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000 + Math.random() * 800; // clap frequency dispersion
        filter.Q.value = 1.2;
        
        const g = audioCtx!.createGain();
        g.gain.setValueAtTime(0, time);
        g.gain.linearRampToValueAtTime(vol, time + 0.008);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
        
        source.connect(filter);
        filter.connect(g);
        g.connect(audioCtx!.destination);
        source.start(time);
        source.stop(time + 0.18);
      };

      // Dense crowd applause simulation for 2.2 seconds
      for (let i = 0; i < 60; i++) {
        playClap(now + 0.08 + (Math.random() * 2.2), 0.04 + Math.random() * 0.08);
      }
    } else if (type === 'lost') {
      // Sad descending tone
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(150, now + 0.5);
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.linearRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch (e) {
    console.warn('Audio play failed (maybe user has not interacted with document yet)', e);
  }
};
