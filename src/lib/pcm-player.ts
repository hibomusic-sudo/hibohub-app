export class PCMPlayer {
  private audioCtx: AudioContext;
  private nextTime: number;
  private sampleRate: number;
  private chunks: Float32Array[] = [];
  private isPlaying: boolean = false;
  private combinedBuffer: Float32Array = new Float32Array(0);

  constructor(sampleRate: number = 44100) {
    this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.sampleRate = sampleRate;
    this.nextTime = 0;
  }

  public feedBase64(base64Chunk: string) {
    // Convert base64 to ArrayBuffer
    const binaryString = window.atob(base64Chunk);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    this.feed(bytes.buffer);
  }

  public feed(buffer: ArrayBuffer) {
    // Convert 16-bit PCM to Float32
    const int16 = new Int16Array(buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }
    
    // Store for saving later
    const newCombined = new Float32Array(this.combinedBuffer.length + float32.length);
    newCombined.set(this.combinedBuffer, 0);
    newCombined.set(float32, this.combinedBuffer.length);
    this.combinedBuffer = newCombined;

    this.playChunk(float32);
  }

  private playChunk(data: Float32Array) {
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const audioBuffer = this.audioCtx.createBuffer(1, data.length, this.sampleRate);
    audioBuffer.getChannelData(0).set(data);

    const source = this.audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioCtx.destination);

    if (this.nextTime === 0 || this.nextTime < this.audioCtx.currentTime) {
      this.nextTime = this.audioCtx.currentTime + 0.1; // Add small buffer
    }

    source.start(this.nextTime);
    this.nextTime += audioBuffer.duration;
  }

  public stop() {
    this.audioCtx.close();
  }

  public getWavBlob(): Blob {
    // Convert combined float32 back to WAV
    return this.exportWAV(this.combinedBuffer);
  }

  private exportWAV(float32Data: Float32Array): Blob {
    const numChannels = 1;
    const sampleRate = this.sampleRate;
    const buffer = new ArrayBuffer(44 + float32Data.length * 2);
    const view = new DataView(buffer);

    // Write WAV header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + float32Data.length * 2, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true); // Byte rate
    view.setUint16(32, numChannels * 2, true); // Block align
    view.setUint16(34, 16, true); // Bits per sample
    this.writeString(view, 36, 'data');
    view.setUint32(40, float32Data.length * 2, true);

    // Write PCM data
    let offset = 44;
    for (let i = 0; i < float32Data.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, float32Data[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
