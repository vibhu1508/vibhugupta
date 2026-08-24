/**
 * The audio bus the sphere breathes from.
 *
 * One global, deliberately: there is exactly one sphere, and whoever is
 * currently making sound (the visitor's mic, or the agent's reply) owns it.
 * Components push a source in; the render loop pulls `bands` out. Nothing
 * in between allocates.
 *
 * Band energies are log-spaced, not linear. A linear FFT split puts almost
 * everything interesting in the bottom three bins — speech would move a
 * sliver of the sphere and leave the rest dead.
 */

export const BANDS = 28;

export type Speaker = "idle" | "user" | "agent";

/* Speech lives here. Below 80Hz is rumble, above 8k is mostly sibilance. */
const F_MIN = 80;
const F_MAX = 8000;

/* Per-band attack/release. Fast attack so consonants punch, slow release so
   the shell settles instead of strobing. */
const ATTACK = 0.55;
const RELEASE = 0.12;

class VoiceField {
  speaker: Speaker = "idle";
  readonly bands = new Float32Array(BANDS);
  level = 0;
  /** One-shot impulse on speaker change — the shader uses it as a flash. */
  burst = 0;

  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: AudioNode | null = null;
  // Explicit <ArrayBuffer>: TS 5.7 distinguishes it from ArrayBufferLike,
  // and getByteFrequencyData only accepts the non-shared form.
  private spectrum: Uint8Array<ArrayBuffer> | null = null;
  /** Precomputed FFT bin range per band, so the hot loop does no math. */
  private edges: Int32Array | null = null;
  private raf = 0;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const Ctor: typeof AudioContext =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
    }
    // Autoplay policy parks the context until a gesture; every attach is one.
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private buildAnalyser(ctx: AudioContext) {
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    // We do our own smoothing per band, so keep the built-in light.
    analyser.smoothingTimeConstant = 0.25;
    analyser.minDecibels = -85;
    analyser.maxDecibels = -12;

    const bins = analyser.frequencyBinCount;
    const nyquist = ctx.sampleRate / 2;

    const edges = new Int32Array(BANDS + 1);
    for (let i = 0; i <= BANDS; i++) {
      const f = F_MIN * Math.pow(F_MAX / F_MIN, i / BANDS);
      edges[i] = Math.min(bins - 1, Math.round((f / nyquist) * bins));
    }
    // Guarantee every band owns at least one bin, or high bands read zero.
    for (let i = 1; i <= BANDS; i++) {
      if (edges[i] <= edges[i - 1]) edges[i] = edges[i - 1] + 1;
    }

    this.analyser = analyser;
    this.spectrum = new Uint8Array(new ArrayBuffer(bins));
    this.edges = edges;
    return analyser;
  }

  private pump = () => {
    this.raf = requestAnimationFrame(this.pump);
    const { analyser, spectrum, edges } = this;
    if (!analyser || !spectrum || !edges) return;

    analyser.getByteFrequencyData(spectrum);

    let sum = 0;
    for (let b = 0; b < BANDS; b++) {
      const from = edges[b];
      const to = edges[b + 1];

      // Peak, not mean. Averaging over a wide high band smears transients
      // into mush; the peak keeps the consonant.
      let peak = 0;
      for (let i = from; i < to; i++) {
        const v = spectrum[i];
        if (v > peak) peak = v;
      }

      let energy = peak / 255;
      // Perceptual tilt: high frequencies carry far less power, so without
      // this the top third of the sphere never moves.
      energy *= 0.55 + 0.45 * (b / (BANDS - 1));
      energy = Math.pow(energy, 0.75);

      const prev = this.bands[b];
      const k = energy > prev ? ATTACK : RELEASE;
      this.bands[b] = prev + (energy - prev) * k;

      sum += this.bands[b];
    }

    const level = sum / BANDS;
    this.level += (level - this.level) * (level > this.level ? 0.5 : 0.1);
  };

  private start() {
    if (!this.raf) this.raf = requestAnimationFrame(this.pump);
  }

  private stop() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private setSpeaker(next: Speaker) {
    if (this.speaker === next) return;
    this.speaker = next;
    // Flash on every handoff — this is what sells the turn-taking.
    this.burst = 1;
  }

  /** Point the sphere at the visitor's microphone. */
  async listenTo(stream: MediaStream) {
    this.release();
    const ctx = this.ensureContext();
    const analyser = this.buildAnalyser(ctx);
    const src = ctx.createMediaStreamSource(stream);
    src.connect(analyser);
    // Deliberately not connected to destination — never echo the mic.
    this.source = src;
    this.setSpeaker("user");
    this.start();
  }

  /**
   * Point the sphere at the agent's own voice.
   * Returns the element so the caller can still control playback.
   */
  speakWith(el: HTMLMediaElement) {
    this.release();
    const ctx = this.ensureContext();
    const analyser = this.buildAnalyser(ctx);
    // A media element can only be tapped once per context; cache the node.
    const cache = el as HTMLMediaElement & { __srcNode?: MediaElementAudioSourceNode };
    const src = cache.__srcNode ?? ctx.createMediaElementSource(el);
    cache.__srcNode = src;
    src.connect(analyser);
    // This one DOES reach the speakers, or the reply would be silent.
    analyser.connect(ctx.destination);
    this.source = src;
    this.setSpeaker("agent");
    this.start();
    return el;
  }

  /**
   * Drive the sphere for a voice we cannot tap.
   *
   * The browser's SpeechSynthesis has no audio node to attach an analyser
   * to, so when we fall back to it there is no spectrum to read. Rather than
   * leave the sphere inert while the page is clearly talking, synthesise a
   * plausible speech envelope: the shell still opens and takes the agent
   * colour, it just isn't following the actual waveform.
   */
  beginSynthetic() {
    this.release();
    this.setSpeaker("agent");
    const started = performance.now();
    const tick = () => {
      if (this.speaker !== "agent" || this.analyser) return;
      this.raf = requestAnimationFrame(tick);
      const t = (performance.now() - started) / 1000;
      for (let b = 0; b < BANDS; b++) {
        const x = b / (BANDS - 1);
        const v =
          (Math.sin(t * 7.3 + x * 9) * 0.5 + 0.5) *
          (Math.sin(t * 2.1 + x * 3) * 0.35 + 0.55) *
          (0.35 + 0.5 * Math.sin(Math.PI * x));
        this.bands[b] += (Math.max(0, v) - this.bands[b]) * 0.3;
      }
      this.level = this.bands.reduce((a, v) => a + v, 0) / BANDS;
    };
    this.raf = requestAnimationFrame(tick);
  }

  /** Hand the sphere back to idle. Energies relax on their own. */
  release() {
    this.stop();
    try {
      this.source?.disconnect();
    } catch {
      /* already torn down */
    }
    this.source = null;
    this.analyser = null;
    this.spectrum = null;
    this.edges = null;
    this.setSpeaker("idle");
  }

  /** Called by the render loop while idle so the shell relaxes smoothly. */
  decay(factor: number) {
    for (let i = 0; i < BANDS; i++) this.bands[i] *= factor;
    this.level *= factor;
  }
}

export const field = new VoiceField();
