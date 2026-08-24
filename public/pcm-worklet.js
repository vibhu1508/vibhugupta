/**
 * Captures mono PCM for Sarvam's realtime WebSocket.
 *
 * Runs on the audio thread so mic capture never competes with React or the
 * WebGL loop for the main thread.
 *
 * Buffered to 1024 samples (~64ms at 16kHz) before posting. The raw render
 * quantum is 128 samples — forwarding those directly would mean ~125
 * base64-encoded WebSocket frames per second, which is pure overhead for no
 * latency gain, since Sarvam's endpointing works in hundreds of ms.
 */
const FRAME = 1024;

class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buf = new Float32Array(FRAME);
    this._n = 0;
  }

  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;

    for (let i = 0; i < ch.length; i++) {
      this._buf[this._n++] = ch[i];
      if (this._n === FRAME) {
        // Copy: the buffer is reused, and the message is structured-cloned.
        this.port.postMessage(this._buf.slice(0));
        this._n = 0;
      }
    }
    return true;
  }
}

registerProcessor("pcm-processor", PCMProcessor);
